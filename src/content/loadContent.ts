import { z } from 'zod';
import newYork from './data/cities/new-york.json';
import geneva from './data/cities/geneva.json';
import notifications from './data/notifications.json';
import obstacles from './data/obstacles.json';
import {
  citySchema,
  notificationSchema,
  obstacleSchema,
  type CityDef,
  type NotificationDef,
  type ObstacleDef,
  type PatternDef,
  SIMULTANEOUS_DZ,
} from './schemas';

/** Contenu brut, tel que lu dans les JSON. */
export interface RawContent {
  obstacles: unknown;
  notifications: unknown;
  cities: unknown[];
}

/** Contenu validé, prêt pour le jeu. */
export interface GameContent {
  obstacles: ReadonlyMap<string, ObstacleDef>;
  notifications: ReadonlyMap<string, NotificationDef>;
  cities: ReadonlyMap<string, CityDef>;
  /** Ordre d'affichage des villes dans le menu. */
  cityOrder: readonly string[];
}

export class ContentError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Contenu invalide :\n- ${problems.join('\n- ')}`);
    this.name = 'ContentError';
  }
}

function formatZodError(file: string, error: z.ZodError): string[] {
  return error.issues.map(
    (issue) => `${file} > ${issue.path.join('.') || '(racine)'} : ${issue.message}`,
  );
}

function indexById<T extends { id: string }>(
  file: string,
  items: T[],
  problems: string[],
): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (map.has(item.id)) problems.push(`${file} : identifiant en double « ${item.id} »`);
    map.set(item.id, item);
  }
  return map;
}

/**
 * Vérifie qu'un pattern laisse toujours une échappatoire : à une même profondeur,
 * les obstacles « dodge » ne doivent pas boucher les 3 couloirs.
 * Renvoie la liste des problèmes (vide si tout va bien).
 */
export function checkPatternSolvable(
  pattern: PatternDef,
  obstacleDefs: ReadonlyMap<string, ObstacleDef>,
  lanes = 3,
): string[] {
  const problems: string[] = [];
  const spawns = pattern.spawns
    .map((spawn) => ({ spawn, def: obstacleDefs.get(spawn.obstacle) }))
    .filter((s): s is { spawn: (typeof pattern.spawns)[number]; def: ObstacleDef } => !!s.def);

  for (const { spawn, def } of spawns) {
    if (spawn.lane !== 'random' && def.response === 'dodge' && spawn.lane + def.width > lanes) {
      problems.push(
        `pattern « ${pattern.id} » : ${def.id} (largeur ${def.width}) déborde du couloir ${spawn.lane}`,
      );
    }
  }

  for (const { spawn: anchor } of spawns) {
    const group = spawns.filter(
      (s) => s.def.response === 'dodge' && Math.abs(s.spawn.dz - anchor.dz) < SIMULTANEOUS_DZ,
    );
    const blocked = new Set<number>();
    let randomWidth = 0;
    for (const { spawn, def } of group) {
      if (spawn.lane === 'random') randomWidth += def.width;
      else for (let l = spawn.lane; l < spawn.lane + def.width; l++) blocked.add(l);
    }
    if (blocked.size + randomWidth >= lanes) {
      problems.push(
        `pattern « ${pattern.id} » : vers dz=${anchor.dz}, les 3 couloirs sont bouchés (aucune esquive possible)`,
      );
      break;
    }
  }
  return problems;
}

/** Valide et assemble le contenu. Lève ContentError avec la liste de tous les problèmes. */
export function parseContent(raw: RawContent): GameContent {
  const problems: string[] = [];

  const obstaclesResult = z.array(obstacleSchema).safeParse(raw.obstacles);
  if (!obstaclesResult.success)
    problems.push(...formatZodError('obstacles.json', obstaclesResult.error));
  const notificationsResult = z.array(notificationSchema).safeParse(raw.notifications);
  if (!notificationsResult.success)
    problems.push(...formatZodError('notifications.json', notificationsResult.error));

  const cityList: CityDef[] = [];
  raw.cities.forEach((rawCity, i) => {
    const result = citySchema.safeParse(rawCity);
    if (result.success) cityList.push(result.data);
    else problems.push(...formatZodError(`cities[${i}]`, result.error));
  });

  if (problems.length > 0) throw new ContentError(problems);

  const obstacleMap = indexById('obstacles.json', obstaclesResult.data ?? [], problems);
  const notificationMap = indexById('notifications.json', notificationsResult.data ?? [], problems);
  const cityMap = indexById('cities', cityList, problems);

  for (const city of cityList) {
    for (const notifId of city.notifications) {
      if (!notificationMap.has(notifId))
        problems.push(`ville « ${city.id} » : notification inconnue « ${notifId} »`);
    }
    if (!city.notifications.some((nid) => notificationMap.get(nid)?.difficulty === 1)) {
      problems.push(`ville « ${city.id} » : il faut au moins une notification de difficulté 1`);
    }
    if (!city.patterns.some((p) => p.minDifficulty === 0)) {
      problems.push(`ville « ${city.id} » : il faut au moins un pattern avec minDifficulty 0`);
    }
    if (city.curve.speedMax < city.curve.speedStart) {
      problems.push(`ville « ${city.id} » : speedMax doit être ≥ speedStart`);
    }
    for (const pattern of city.patterns) {
      for (const spawn of pattern.spawns) {
        if (!obstacleMap.has(spawn.obstacle)) {
          problems.push(
            `ville « ${city.id} », pattern « ${pattern.id} » : obstacle inconnu « ${spawn.obstacle} »`,
          );
        }
      }
      problems.push(
        ...checkPatternSolvable(pattern, obstacleMap).map((p) => `ville « ${city.id} », ${p}`),
      );
    }
  }

  if (problems.length > 0) throw new ContentError(problems);

  return {
    obstacles: obstacleMap,
    notifications: notificationMap,
    cities: cityMap,
    cityOrder: cityList.map((c) => c.id),
  };
}

/** Contenu livré avec le jeu. Ajouter une ville : importer son JSON et l'ajouter ici. */
export const RAW_CONTENT: RawContent = {
  obstacles,
  notifications,
  cities: [geneva, newYork],
};

let cached: GameContent | undefined;

export function loadContent(): GameContent {
  cached ??= parseContent(RAW_CONTENT);
  return cached;
}
