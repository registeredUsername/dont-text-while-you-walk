import Phaser from 'phaser';
import { GAME_CONFIG } from '@/config/gameConfig';
import type { GameContent } from '@/content/loadContent';
import { randomSeed } from '@/core/rng';
import { Simulation } from '@/core/Simulation';
import type { GameEvent, Gesture } from '@/core/types';
import { DebugOverlay } from '@/debug/DebugOverlay';
import type { DebugParams } from '@/debug/params';
import { GestureRecognizer, KEYBOARD_GESTURES } from '@/input/GestureRecognizer';
import { STRINGS } from '@/i18n/fr';
import { vibrate } from '@/platform/haptics';
import { playSfx, unlockAudio, type SfxName } from '@/platform/sfx';
import { Hud } from '@/render/Hud';
import { PHONE, VIEW } from '@/render/layout';
import { PhoneView } from '@/render/PhoneView';
import { StreetView } from '@/render/StreetView';
import { REGISTRY, SCENES, type GameOverData, type GameSceneData } from './keys';

/** Pas de rattrapage au-delà de ce délai (onglet en arrière-plan, gros ralentissement). */
const MAX_FRAME_MS = 100;

/**
 * La scène de jeu fait le lien entre les trois mondes :
 * gestes (input) → simulation (core) → affichage (render).
 */
export class GameScene extends Phaser.Scene {
  private sim!: Simulation;
  private street!: StreetView;
  private phone!: PhoneView;
  private hud!: Hud;
  private debug?: DebugOverlay;
  private recognizer!: GestureRecognizer;
  private params!: DebugParams;
  private accumulator = 0;
  private ending = false;

  constructor() {
    super(SCENES.game);
  }

  create(data: GameSceneData): void {
    const content = this.registry.get(REGISTRY.content) as GameContent;
    this.params = this.registry.get(REGISTRY.debug) as DebugParams;
    const seed = data.seed ?? this.params.seed ?? randomSeed(Math.random);
    this.sim = new Simulation(content, data.cityId, seed, GAME_CONFIG, { god: this.params.god });
    this.accumulator = 0;
    this.ending = false;

    this.street = new StreetView(this, this.sim.city);
    this.phone = new PhoneView(this);
    this.hud = new Hud(this);
    this.debug = this.params.debug ? new DebugOverlay(this) : undefined;
    if (this.params.debug) console.info(`[debug] seed=${seed} city=${data.cityId}`);

    this.setupInput();
  }

  override update(time: number, delta: number): void {
    const longPress = this.recognizer.update(time);
    if (longPress) this.onGesture(longPress);

    const dt = GAME_CONFIG.fixedDt;
    this.accumulator += (Math.min(delta, MAX_FRAME_MS) / 1000) * this.params.timeScale;
    while (this.accumulator >= dt && !this.sim.state.over) {
      this.handleEvents(this.sim.step(dt));
      this.accumulator -= dt;
    }

    this.street.update(this.sim.state, delta);
    this.phone.update(this.sim.state);
    this.hud.update(this.sim.state, this.sim.multiplier);
    this.debug?.update(this.sim);

    if (this.sim.state.over && !this.ending) this.endGame();
  }

  private setupInput(): void {
    this.recognizer = new GestureRecognizer(GAME_CONFIG.gestures);
    const now = (): number => this.game.loop.time;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      unlockAudio();
      this.recognizer.pointerDown(p.id, p.x, p.y, now());
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      const gesture = this.recognizer.pointerMove(p.id, p.x, p.y, now());
      if (gesture) this.onGesture(gesture);
    });
    const release = (p: Phaser.Input.Pointer): void => {
      const gesture = this.recognizer.pointerUp(p.id, p.x, p.y, now());
      if (gesture) this.onGesture(gesture);
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.repeat) return;
      const gesture = KEYBOARD_GESTURES[event.code];
      if (gesture) {
        unlockAudio();
        this.onGesture(gesture);
      }
    });
  }

  private onGesture(gesture: Gesture): void {
    this.sim.handleGesture(gesture);
    // Les gestes produisent des événements immédiats (réponse à une notif...).
    this.handleEvents(this.sim.step(0));
  }

  /** Feedback visuel, sonore et haptique. Aucune règle de jeu ici. */
  private handleEvents(events: GameEvent[]): void {
    const cam = this.cameras.main;
    const phoneTextY = PHONE.upTop - 60;
    for (const event of events) {
      switch (event.type) {
        case 'phoneRaised':
        case 'phoneLowered':
          playSfx('phone');
          break;
        case 'laneChanged':
          playSfx('lane');
          break;
        case 'laneBlocked':
          cam.shake(80, 0.004);
          break;
        case 'notificationArrived':
          playSfx(`notif.${event.notification.def.category}` as SfxName);
          vibrate('light');
          break;
        case 'notificationAnswered':
          this.phone.answered(event.notification, event.gesture, event.correct);
          playSfx(event.correct ? 'correct' : 'wrong');
          if (event.correct)
            this.hud.popup(`+${event.points}`, VIEW.width / 2, phoneTextY, '#34c759');
          else vibrate('medium');
          break;
        case 'notificationExpired':
          this.phone.expired(event.notification);
          playSfx('expired');
          break;
        case 'notificationOverflow':
          this.hud.popup('File pleine !', VIEW.width / 2, phoneTextY, '#ff9f0a');
          break;
        case 'stressOverflow':
          cam.flash(250, 255, 60, 60);
          vibrate('heavy');
          playSfx('collision');
          this.hud.popup(STRINGS.phoneSmashed, VIEW.width / 2, VIEW.height / 2, '#ff3b30');
          break;
        case 'collision':
          this.street.flash(event.obstacle.uid);
          cam.shake(250, 0.02);
          cam.flash(150, 255, 0, 0);
          vibrate('heavy');
          playSfx('collision');
          this.hud.popup(
            event.obstacle.def.label + ' !',
            VIEW.width / 2,
            VIEW.height * 0.45,
            '#ff3b30',
          );
          break;
        case 'nearMiss':
          playSfx('nearMiss');
          this.hud.popup(
            `${STRINGS.nearMiss} +${event.points}`,
            VIEW.width / 2,
            VIEW.height * 0.5,
            '#ffd60a',
          );
          break;
        case 'pickup':
          playSfx('pickup');
          this.hud.popup(event.obstacle.def.label, VIEW.width / 2, VIEW.height * 0.5, '#34c759');
          break;
        case 'lifeGained':
          this.hud.popup('+1 ♥', 120, 140, '#ff5a5f');
          break;
        case 'ducked':
        case 'gameOver':
          break;
      }
    }
  }

  private endGame(): void {
    this.ending = true;
    const s = this.sim.state;
    const data: GameOverData = {
      cityId: s.cityId,
      seed: s.seed,
      score: Math.floor(s.score),
      distance: Math.floor(s.distance),
      time: s.time,
      stats: s.stats,
    };
    this.time.delayedCall(1000, () => this.scene.start(SCENES.gameOver, data));
  }
}
