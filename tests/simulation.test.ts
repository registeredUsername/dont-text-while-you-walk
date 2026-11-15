import { describe, expect, it } from 'vitest';
import { GAME_CONFIG, type GameConfig } from '@/config/gameConfig';
import { loadContent } from '@/content/loadContent';
import { Simulation } from '@/core/Simulation';
import type { GameEvent, Gesture } from '@/core/types';

const content = loadContent();
const DT = GAME_CONFIG.fixedDt;

/** Config sans apparitions automatiques : chaque test place ce dont il a besoin. */
const QUIET: GameConfig = { ...GAME_CONFIG, firstObstacleAt: 1e9, firstNotificationAfter: 1e9 };

function run(sim: Simulation, seconds: number): GameEvent[] {
  const events: GameEvent[] = [];
  for (let i = 0; i < Math.round(seconds / DT); i++) events.push(...sim.step(DT));
  return events;
}

function raisePhone(sim: Simulation): void {
  sim.handleGesture('swipeUp');
  run(sim, GAME_CONFIG.phone.transitionSeconds + 0.05);
}

describe('Simulation : téléphone et couloirs', () => {
  it('change de couloir téléphone baissé', () => {
    const sim = new Simulation(content, 'geneva', 1, QUIET);
    sim.handleGesture('swipeLeft');
    expect(sim.state.lane).toBe(0);
    sim.handleGesture('swipeLeft');
    expect(sim.state.lane).toBe(0); // bord du trottoir
  });

  it('ne change pas de couloir téléphone levé : le swipe répond à la notif', () => {
    const sim = new Simulation(content, 'geneva', 1, QUIET);
    raisePhone(sim);
    expect(sim.state.phone.position).toBe('up');
    sim.spawnNotification('spam-prize');
    sim.handleGesture('swipeLeft');
    expect(sim.state.lane).toBe(1);
    expect(sim.state.notifications).toHaveLength(0);
    expect(sim.state.stats.notificationsAnswered).toBe(1);
  });

  it('ignore les swipes latéraux pendant la transition', () => {
    const sim = new Simulation(content, 'geneva', 1, QUIET);
    sim.handleGesture('swipeUp');
    sim.handleGesture('swipeLeft');
    expect(sim.state.lane).toBe(1);
  });
});

describe('Simulation : notifications et stress', () => {
  it('une bonne réponse donne des points, une mauvaise du stress', () => {
    const sim = new Simulation(content, 'geneva', 1, QUIET);
    raisePhone(sim);
    sim.spawnNotification('mom-dinner');
    const before = sim.state.score;
    sim.handleGesture('swipeRight');
    expect(sim.state.score).toBeGreaterThan(before);
    sim.spawnNotification('mom-dinner');
    sim.handleGesture('swipeLeft');
    expect(sim.state.stress).toBeGreaterThan(0);
    expect(sim.state.combo).toBe(0);
  });

  it('une notif ignorée expire et ajoute du stress', () => {
    const sim = new Simulation(content, 'geneva', 1, QUIET);
    sim.spawnNotification('spam-prize');
    const events = run(sim, 10);
    expect(events.some((e) => e.type === 'notificationExpired')).toBe(true);
    expect(sim.state.stats.notificationsMissed).toBe(1);
  });

  it('jauge de stress pleine = une vie perdue et file vidée', () => {
    const sim = new Simulation(content, 'geneva', 1, QUIET);
    raisePhone(sim);
    for (let i = 0; i < GAME_CONFIG.stress.max; i++) {
      sim.spawnNotification('mom-dinner');
      sim.handleGesture('swipeLeft'); // mauvaise réponse
    }
    expect(sim.state.lives).toBe(GAME_CONFIG.player.lives - 1);
    expect(sim.state.stress).toBe(0);
  });

  it('file pleine : une notif de plus ajoute du stress', () => {
    const sim = new Simulation(content, 'geneva', 1, QUIET);
    for (let i = 0; i < GAME_CONFIG.phone.maxStack; i++) sim.spawnNotification('spam-prize');
    expect(sim.spawnNotification('spam-prize')).toBeNull();
    expect(sim.state.stress).toBe(GAME_CONFIG.stress.overflowPenalty);
  });
});

describe('Simulation : obstacles', () => {
  it('collision si on reste dans le couloir', () => {
    const sim = new Simulation(content, 'geneva', 1, QUIET);
    sim.spawnObstacle('lamppost', 1, 5);
    const events = run(sim, 1);
    expect(events.some((e) => e.type === 'collision')).toBe(true);
    expect(sim.state.lives).toBe(GAME_CONFIG.player.lives - 1);
  });

  it('pas de collision si on esquive, et frôlement si au dernier moment', () => {
    const sim = new Simulation(content, 'geneva', 1, QUIET);
    sim.spawnObstacle('lamppost', 1, 2);
    run(sim, 0.1);
    sim.handleGesture('swipeRight');
    const events = run(sim, 1);
    expect(sim.state.lives).toBe(GAME_CONFIG.player.lives);
    expect(events.some((e) => e.type === 'nearMiss')).toBe(true);
  });

  it('se baisser évite la vitre, pas changer de couloir', () => {
    const ducker = new Simulation(content, 'geneva', 1, QUIET);
    ducker.spawnObstacle('glass-pane', 0, 3);
    ducker.handleGesture('swipeDown');
    run(ducker, 1);
    expect(ducker.state.lives).toBe(GAME_CONFIG.player.lives);

    const dodger = new Simulation(content, 'geneva', 1, QUIET);
    dodger.spawnObstacle('glass-pane', 0, 3);
    dodger.handleGesture('swipeLeft');
    run(dodger, 1);
    expect(dodger.state.lives).toBe(GAME_CONFIG.player.lives - 1);
  });

  it('une collision fait baisser le téléphone', () => {
    const sim = new Simulation(content, 'geneva', 1, QUIET);
    raisePhone(sim);
    sim.spawnObstacle('lamppost', 1, 3);
    run(sim, 1);
    expect(sim.state.phone.position).toBe('down');
  });

  it('le café rend une vie', () => {
    const sim = new Simulation(content, 'geneva', 1, QUIET);
    sim.spawnObstacle('lamppost', 1, 2);
    run(sim, 2);
    expect(sim.state.lives).toBe(2);
    sim.spawnObstacle('coffee', 1, 2);
    run(sim, 1);
    expect(sim.state.lives).toBe(3);
  });

  it('mode god : aucun dégât', () => {
    const sim = new Simulation(content, 'geneva', 1, QUIET, { god: true });
    sim.spawnObstacle('lamppost', 1, 2);
    run(sim, 1);
    expect(sim.state.lives).toBe(GAME_CONFIG.player.lives);
  });

  it('fin de partie à 0 vie', () => {
    const sim = new Simulation(content, 'geneva', 1, QUIET);
    for (let i = 0; i < 3; i++) {
      sim.spawnObstacle('lamppost', 1, 2);
      run(sim, 2);
    }
    expect(sim.state.over).toBe(true);
  });
});

describe('Simulation : parties complètes', () => {
  const gestures: Gesture[] = [
    'swipeLeft',
    'swipeRight',
    'swipeUp',
    'swipeDown',
    'tap',
    'longPress',
  ];

  function playRandom(seed: number, cityId: string, seconds: number): Simulation {
    const sim = new Simulation(content, cityId, seed, GAME_CONFIG, { god: true });
    let g = seed;
    for (let i = 0; i < Math.round(seconds / DT); i++) {
      if (i % 20 === 0) {
        g = (g * 1103515245 + 12345) % 2147483648;
        sim.handleGesture(gestures[g % gestures.length]!);
      }
      sim.step(DT);
    }
    return sim;
  }

  it('est déterministe : même graine et mêmes gestes = même partie', () => {
    const a = playRandom(1234, 'geneva', 60);
    const b = playRandom(1234, 'geneva', 60);
    expect(a.state.score).toBe(b.state.score);
    expect(a.state.stats).toEqual(b.state.stats);
  });

  it.each(['geneva', 'new-york'])(
    'tient 5 minutes à %s sans erreur et la difficulté monte',
    (city) => {
      const sim = playRandom(99, city, 300);
      expect(sim.state.difficulty).toBe(1);
      expect(sim.state.distance).toBeGreaterThan(1000);
      expect(
        sim.state.stats.notificationsAnswered + sim.state.stats.notificationsMissed,
      ).toBeGreaterThan(20);
    },
  );

  it.each([1, 5, 42, 2024])('laisse toujours un couloir libre (graine %i)', (seed) => {
    const sim = new Simulation(content, 'new-york', seed, GAME_CONFIG, { god: true });
    for (let i = 0; i < Math.round(300 / DT); i++) {
      sim.step(DT);
      const near = sim.state.obstacles.filter(
        (o) => o.def.response === 'dodge' && !o.resolved && o.z - sim.state.distance < 15,
      );
      for (const o of near) {
        const blocked = new Set<number>();
        for (const other of near) {
          if (Math.abs(other.z - o.z) > 1) continue;
          for (let l = other.lane; l < other.lane + other.def.width; l++) blocked.add(l);
        }
        expect(blocked.size).toBeLessThan(3);
      }
    }
  });
});
