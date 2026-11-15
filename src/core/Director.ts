import type { GameContent } from '@/content/loadContent';
import { SIMULTANEOUS_DZ } from '@/content/schemas';
import type { CityDef, NotificationDef, ObstacleDef, PatternDef } from '@/content/schemas';
import type { DifficultySnapshot } from './difficulty';
import type { Rng } from './rng';
import type { ObstacleInstance } from './types';

export interface PlannedObstacle {
  def: ObstacleDef;
  lane: number;
  z: number;
}

/**
 * Le « directeur » décide quoi faire apparaître et quand, en fonction de la difficulté.
 * Il assemble des patterns écrits à la main (JSON) plutôt que du hasard pur, et garantit
 * qu'il reste toujours un couloir libre.
 */
export class Director {
  /** Position (z absolu) du prochain pattern. */
  nextPatternZ: number;
  /** Secondes avant la prochaine notification. */
  notificationTimer: number;

  constructor(
    private readonly content: GameContent,
    private readonly city: CityDef,
    private readonly rng: Rng,
    private readonly lanes: number,
    firstObstacleAt: number,
    firstNotificationAfter: number,
  ) {
    this.nextPatternZ = firstObstacleAt;
    this.notificationTimer = firstNotificationAfter;
  }

  /**
   * Patterns à faire apparaître pour remplir la rue jusqu'à `horizonZ`.
   * Les obstacles déjà présents sont pris en compte : un piéton qui marche vers le joueur
   * ne doit pas former un mur avec un lampadaire placé plus loin.
   */
  planObstacles(
    horizonZ: number,
    difficulty: DifficultySnapshot,
    existing: readonly ObstacleInstance[],
    player: PlayerMotion,
  ): PlannedObstacle[] {
    const planned: PlannedObstacle[] = [];
    while (this.nextPatternZ <= horizonZ) {
      const pattern = this.pickPattern(difficulty.t);
      const others: Placed[] = [...existing.filter((o) => !o.resolved), ...planned];
      let accepted: PlannedObstacle[] | null = null;
      for (let attempt = 0; attempt < PLACEMENT_ATTEMPTS && !accepted; attempt++) {
        const candidate = this.instantiatePattern(
          pattern,
          this.nextPatternZ + attempt * PLACEMENT_SHIFT,
          others,
          player,
        );
        if (!formsWall([...others, ...candidate], player, this.lanes)) accepted = candidate;
      }
      if (accepted) planned.push(...accepted);
      const length = Math.max(0, ...pattern.spawns.map((s) => s.dz));
      this.nextPatternZ += length + difficulty.patternGap * this.rng.range(0.85, 1.25);
    }
    return planned;
  }

  /** Avance le minuteur des notifications. Renvoie une notification à envoyer, ou null. */
  tickNotifications(dt: number, difficulty: DifficultySnapshot): NotificationDef | null {
    this.notificationTimer -= dt;
    if (this.notificationTimer > 0) return null;
    this.notificationTimer = difficulty.notificationInterval * this.rng.range(0.7, 1.3);
    const eligible = this.city.notifications
      .map((id) => this.content.notifications.get(id))
      .filter((n): n is NotificationDef => !!n && n.difficulty <= difficulty.level);
    return eligible.length > 0 ? this.rng.pick(eligible) : null;
  }

  private pickPattern(t: number): PatternDef {
    const eligible = this.city.patterns.filter((p) => p.minDifficulty <= t);
    return this.rng.weighted(eligible, (p) => p.weight);
  }

  private instantiatePattern(
    pattern: PatternDef,
    baseZ: number,
    others: readonly Placed[],
    player: PlayerMotion,
  ): PlannedObstacle[] {
    const result: PlannedObstacle[] = [];
    for (const spawn of pattern.spawns) {
      const def = this.content.obstacles.get(spawn.obstacle);
      if (!def) continue; // impossible : le contenu est validé au chargement
      const z = baseZ + spawn.dz;
      let lane: number;
      if (def.width >= this.lanes) {
        lane = 0;
      } else if (spawn.lane === 'random') {
        lane = this.pickFreeLane(def, z, [...others, ...result], player);
      } else {
        lane = spawn.lane;
      }
      result.push({ def, lane, z });
    }
    return result;
  }

  /** Choisit un couloir au hasard qui ne bouche pas tous les couloirs au moment du passage. */
  private pickFreeLane(
    def: ObstacleDef,
    z: number,
    others: readonly Placed[],
    player: PlayerMotion,
  ): number {
    const candidates: number[] = [];
    for (let lane = 0; lane + def.width <= this.lanes; lane++) {
      const probe: Placed = { def, lane, z };
      if (def.response !== 'dodge' || !formsWall([...others, probe], player, this.lanes, probe)) {
        candidates.push(lane);
      }
    }
    return candidates.length > 0 ? this.rng.pick(candidates) : 0;
  }
}

/** Un obstacle placé ou prévu : assez pour calculer quand il croisera le joueur. */
type Placed = Pick<ObstacleInstance, 'def' | 'lane' | 'z'>;

export interface PlayerMotion {
  distance: number;
  speed: number;
}

const PLACEMENT_ATTEMPTS = 6;
const PLACEMENT_SHIFT = 6;

/** Instant (s) où l'obstacle croisera le joueur, à vitesse constante. */
function arrivalTime(o: Placed, player: PlayerMotion): number {
  return (o.z - player.distance) / (player.speed + o.def.speed);
}

/**
 * Vrai si, à un moment, les obstacles « dodge » qui arrivent ensemble bouchent tous les couloirs.
 * Si `only` est fourni, on ne vérifie que les groupes qui contiennent cet obstacle.
 */
export function formsWall(
  obstacles: readonly Placed[],
  player: PlayerMotion,
  lanes: number,
  only?: Placed,
): boolean {
  const window = SIMULTANEOUS_DZ / player.speed;
  const dodgers = obstacles.filter((o) => o.def.response === 'dodge');
  const anchors = only ? [only] : dodgers;
  for (const anchor of anchors) {
    const t = arrivalTime(anchor, player);
    const blocked = new Set<number>();
    for (const o of dodgers) {
      if (Math.abs(arrivalTime(o, player) - t) >= window) continue;
      for (let l = o.lane; l < o.lane + o.def.width; l++) blocked.add(l);
    }
    if (blocked.size >= lanes) return true;
  }
  return false;
}
