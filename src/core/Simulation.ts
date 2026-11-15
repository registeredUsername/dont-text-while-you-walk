import type { GameConfig } from '@/config/gameConfig';
import { GAME_CONFIG } from '@/config/gameConfig';
import type { GameContent } from '@/content/loadContent';
import type { CityDef, NotificationDef, ObstacleDef } from '@/content/schemas';
import { Director } from './Director';
import { difficultyAt } from './difficulty';
import { Rng } from './rng';
import type {
  GameEvent,
  GameState,
  Gesture,
  NotificationInstance,
  ObstacleInstance,
  SimulationOptions,
} from './types';

/** Les obstacles dépassés sont gardés un instant pour l'animation, puis supprimés. */
const OBSTACLE_CLEANUP_BEHIND = 6;

/**
 * Toute la logique d'une partie, sans affichage.
 *
 * Utilisation :
 *   const sim = new Simulation(content, 'geneva', seed);
 *   sim.handleGesture('swipeUp');          // quand le joueur fait un geste
 *   const events = sim.step(1 / 60);       // à chaque pas de temps fixe
 *   render(sim.state, events);
 */
export class Simulation {
  readonly state: GameState;
  readonly city: CityDef;
  private readonly rng: Rng;
  private readonly director: Director;
  private readonly events: GameEvent[] = [];
  private nextUid = 1;
  private readonly startDifficulty: number;

  constructor(
    private readonly content: GameContent,
    cityId: string,
    seed: number,
    private readonly config: GameConfig = GAME_CONFIG,
    private readonly options: SimulationOptions = {},
  ) {
    const city = content.cities.get(cityId);
    if (!city) throw new Error(`Ville inconnue : ${cityId}`);
    this.city = city;
    this.rng = new Rng(seed);
    this.director = new Director(
      content,
      city,
      this.rng,
      config.lanes,
      config.firstObstacleAt,
      config.firstNotificationAfter,
    );
    this.startDifficulty = Math.min(1, Math.max(0, options.startDifficulty ?? 0));
    const difficulty = difficultyAt(city, 0, this.startDifficulty);
    this.state = {
      seed,
      cityId,
      time: 0,
      distance: 0,
      speed: difficulty.speed,
      difficulty: difficulty.t,
      lane: config.startLane,
      previousLane: config.startLane,
      laneChangedAt: -Infinity,
      duckRemaining: 0,
      jumpRemaining: 0,
      phone: { position: 'down', progress: 0 },
      notifications: [],
      obstacles: [],
      lives: config.player.lives,
      invulnerableRemaining: 0,
      stress: 0,
      score: 0,
      combo: 0,
      perfectStreak: 0,
      stats: {
        notificationsAnswered: 0,
        notificationsWrong: 0,
        notificationsMissed: 0,
        collisions: 0,
        collisionsByObstacle: {},
        nearMisses: 0,
        pickups: 0,
        screenTime: 0,
      },
      over: false,
    };
  }

  // ---------------------------------------------------------------- gestes

  /**
   * Traduit un geste en action selon la position du téléphone.
   * C'est ici que vit la règle centrale : le même swipe veut dire « répondre » téléphone
   * levé et « changer de couloir » téléphone baissé.
   */
  handleGesture(gesture: Gesture): void {
    const s = this.state;
    if (s.over) return;

    switch (s.phone.position) {
      case 'down':
        if (gesture === 'swipeUp') this.setPhone('raising');
        else if (gesture === 'swipeLeft') this.changeLane(-1);
        else if (gesture === 'swipeRight') this.changeLane(1);
        else if (gesture === 'swipeDown') this.duck();
        else if (gesture === 'tap') this.jump();
        break;
      case 'up':
        if (gesture === 'swipeDown') this.setPhone('lowering');
        else if (gesture !== 'swipeUp') this.answer(gesture);
        break;
      case 'raising':
        // Changer d'avis pendant l'animation est permis.
        if (gesture === 'swipeDown') this.setPhone('lowering');
        break;
      case 'lowering':
        if (gesture === 'swipeUp') this.setPhone('raising');
        break;
    }
  }

  // ---------------------------------------------------------------- boucle

  /**
   * Avance la partie de `dt` secondes. Renvoie les événements survenus depuis le pas
   * précédent (y compris ceux déclenchés par les gestes).
   */
  step(dt: number): GameEvent[] {
    const s = this.state;
    if (s.over) return this.flushEvents();

    const difficulty = difficultyAt(this.city, s.time, this.startDifficulty);
    s.time += dt;
    s.difficulty = difficulty.t;
    s.speed = difficulty.speed;
    s.distance += s.speed * dt;
    s.score += s.speed * dt * this.config.score.pointsPerUnit;

    this.updatePhone(dt);
    s.duckRemaining = Math.max(0, s.duckRemaining - dt);
    s.jumpRemaining = Math.max(0, s.jumpRemaining - dt);
    s.invulnerableRemaining = Math.max(0, s.invulnerableRemaining - dt);

    // Obstacles : apparition, déplacement, passage à hauteur du joueur.
    const horizon = s.distance + this.config.viewDistance;
    for (const planned of this.director.planObstacles(horizon, difficulty, s.obstacles, s)) {
      this.addObstacle(planned.def, planned.lane, planned.z);
    }
    for (const obstacle of s.obstacles) {
      obstacle.z -= obstacle.def.speed * dt;
      if (!obstacle.resolved && obstacle.z <= s.distance) this.resolveObstacle(obstacle);
    }
    s.obstacles = s.obstacles.filter((o) => o.z > s.distance - OBSTACLE_CLEANUP_BEHIND);

    // Notifications : arrivée, expiration, stress.
    const incoming = this.director.tickNotifications(dt, difficulty);
    if (incoming) this.pushNotification(incoming, difficulty.ttlScale);
    this.updateNotifications(dt);

    if (s.lives <= 0) {
      s.over = true;
      this.events.push({ type: 'gameOver' });
    }
    return this.flushEvents();
  }

  // ---------------------------------------------------------------- outils publics (debug, tests)

  /** Fait apparaître un obstacle à `ahead` unités devant le joueur. */
  spawnObstacle(obstacleId: string, lane: number, ahead: number): ObstacleInstance {
    const def = this.content.obstacles.get(obstacleId);
    if (!def) throw new Error(`Obstacle inconnu : ${obstacleId}`);
    return this.addObstacle(def, lane, this.state.distance + ahead);
  }

  /** Envoie immédiatement une notification. */
  spawnNotification(notificationId: string): NotificationInstance | null {
    const def = this.content.notifications.get(notificationId);
    if (!def) throw new Error(`Notification inconnue : ${notificationId}`);
    return this.pushNotification(def, 1);
  }

  /** Multiplicateur de score pour le combo actuel. */
  get multiplier(): number {
    const { comboSteps, comboMultipliers } = this.config.score;
    let m = 1;
    comboSteps.forEach((step, i) => {
      if (this.state.combo >= step) m = comboMultipliers[i] ?? m;
    });
    return m;
  }

  // ---------------------------------------------------------------- interne

  private flushEvents(): GameEvent[] {
    const out = [...this.events];
    this.events.length = 0;
    return out;
  }

  private setPhone(position: 'raising' | 'lowering'): void {
    this.state.phone.position = position;
  }

  private updatePhone(dt: number): void {
    const phone = this.state.phone;
    const rate = dt / this.config.phone.transitionSeconds;
    if (phone.position === 'raising') {
      phone.progress = Math.min(1, phone.progress + rate);
      if (phone.progress >= 1) {
        phone.position = 'up';
        this.events.push({ type: 'phoneRaised' });
      }
    } else if (phone.position === 'lowering') {
      phone.progress = Math.max(0, phone.progress - rate);
      if (phone.progress <= 0) {
        phone.position = 'down';
        this.events.push({ type: 'phoneLowered' });
      }
    }
    if (phone.position !== 'down') this.state.stats.screenTime += dt;
  }

  private changeLane(direction: -1 | 1): void {
    const s = this.state;
    const target = s.lane + direction;
    if (target < 0 || target >= this.config.lanes) {
      this.events.push({ type: 'laneBlocked', direction });
      return;
    }
    s.previousLane = s.lane;
    s.lane = target;
    s.laneChangedAt = s.time;
    this.events.push({ type: 'laneChanged', lane: target, from: s.previousLane });
  }

  private duck(): void {
    // Pas de changement de posture en plein saut.
    if (this.state.jumpRemaining > 0) return;
    this.state.duckRemaining = this.config.player.duckSeconds;
    this.events.push({ type: 'ducked' });
  }

  private jump(): void {
    const s = this.state;
    if (s.jumpRemaining > 0) return;
    s.duckRemaining = 0; // on se relève pour sauter
    s.jumpRemaining = this.config.player.jumpSeconds;
    this.events.push({ type: 'jumped' });
  }

  private answer(gesture: Gesture): void {
    const s = this.state;
    const top = s.notifications.shift();
    if (!top) return;
    const correct = top.def.expected === gesture;
    let points = 0;
    if (correct) {
      s.combo += 1;
      s.perfectStreak += 1;
      points = top.def.points * this.multiplier;
      s.score += points;
      s.stats.notificationsAnswered += 1;
      const healEvery = this.config.healEveryPerfectNotifications;
      if (s.perfectStreak % healEvery === 0) this.gainLife();
    } else {
      s.stress += top.def.stressOnWrong;
      s.combo = 0;
      s.perfectStreak = 0;
      s.stats.notificationsWrong += 1;
    }
    this.events.push({ type: 'notificationAnswered', notification: top, gesture, correct, points });
    this.checkStress();
  }

  private addObstacle(def: ObstacleDef, lane: number, z: number): ObstacleInstance {
    const obstacle: ObstacleInstance = { uid: this.nextUid++, def, lane, z, resolved: false };
    this.state.obstacles.push(obstacle);
    return obstacle;
  }

  private occupies(obstacle: ObstacleInstance, lane: number): boolean {
    return lane >= obstacle.lane && lane < obstacle.lane + obstacle.def.width;
  }

  private resolveObstacle(obstacle: ObstacleInstance): void {
    const s = this.state;
    obstacle.resolved = true;
    const def = obstacle.def;

    if (def.response === 'collect') {
      if (this.occupies(obstacle, s.lane)) this.collect(obstacle);
      return;
    }

    const inLane = this.occupies(obstacle, s.lane);
    const avoided =
      def.response === 'duck'
        ? s.duckRemaining > 0
        : def.response === 'jump'
          ? s.jumpRemaining > 0 || !inLane
          : !inLane;
    if (!avoided) {
      this.hit(obstacle);
      return;
    }

    const justDodged =
      def.response === 'dodge' &&
      this.occupies(obstacle, s.previousLane) &&
      s.time - s.laneChangedAt <= this.config.score.nearMissWindow;
    if (justDodged) {
      const points = this.config.score.nearMissBonus * this.multiplier;
      s.score += points;
      s.combo += 1;
      s.stats.nearMisses += 1;
      this.events.push({ type: 'nearMiss', obstacle, points });
    }
  }

  private hit(obstacle: ObstacleInstance): void {
    const s = this.state;
    if (this.options.god || s.invulnerableRemaining > 0) return;
    s.lives -= obstacle.def.damage;
    s.invulnerableRemaining = this.config.player.invulnerableSeconds;
    s.combo = 0;
    s.stats.collisions += 1;
    s.stats.collisionsByObstacle[obstacle.def.id] =
      (s.stats.collisionsByObstacle[obstacle.def.id] ?? 0) + 1;
    if (this.config.phone.collisionLowersPhone && s.phone.position !== 'down') {
      s.phone.position = 'down';
      s.phone.progress = 0;
      this.events.push({ type: 'phoneLowered' });
    }
    this.events.push({ type: 'collision', obstacle });
  }

  private collect(obstacle: ObstacleInstance): void {
    const s = this.state;
    const effect = obstacle.def.effect ?? {};
    if (effect.heal) for (let i = 0; i < effect.heal; i++) this.gainLife();
    if (effect.stress) s.stress = Math.max(0, s.stress + effect.stress);
    if (effect.score) s.score += effect.score;
    s.stats.pickups += 1;
    this.events.push({ type: 'pickup', obstacle });
  }

  private gainLife(): void {
    const s = this.state;
    if (s.lives >= this.config.player.maxLives) return;
    s.lives += 1;
    this.events.push({ type: 'lifeGained' });
  }

  private pushNotification(def: NotificationDef, ttlScale: number): NotificationInstance | null {
    const s = this.state;
    if (s.notifications.length >= this.config.phone.maxStack) {
      s.stress += this.config.stress.overflowPenalty;
      this.events.push({ type: 'notificationOverflow' });
      this.checkStress();
      return null;
    }
    const ttl = def.ttl * ttlScale;
    const notification: NotificationInstance = {
      uid: this.nextUid++,
      def,
      text: this.rng.pick(def.texts),
      ttl,
      remaining: ttl,
    };
    s.notifications.push(notification);
    this.events.push({ type: 'notificationArrived', notification });
    return notification;
  }

  private updateNotifications(dt: number): void {
    const s = this.state;
    for (const n of s.notifications) n.remaining -= dt;
    const expired = s.notifications.filter((n) => n.remaining <= 0);
    if (expired.length > 0) {
      s.notifications = s.notifications.filter((n) => n.remaining > 0);
      for (const n of expired) {
        s.stress += n.def.stressOnExpire;
        s.combo = 0;
        s.perfectStreak = 0;
        s.stats.notificationsMissed += 1;
        this.events.push({ type: 'notificationExpired', notification: n });
      }
    }
    if (s.notifications.length === 0) {
      s.stress = Math.max(0, s.stress - this.config.stress.decayPerSecond * dt);
    }
    this.checkStress();
  }

  private checkStress(): void {
    const s = this.state;
    if (s.stress < this.config.stress.max) return;
    s.stress = 0;
    s.notifications = [];
    this.events.push({ type: 'stressOverflow' });
    if (!this.options.god) s.lives -= 1;
  }
}
