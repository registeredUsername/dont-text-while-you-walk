import { describe, expect, it } from 'vitest';
import {
  checkPatternSolvable,
  ContentError,
  loadContent,
  parseContent,
  RAW_CONTENT,
} from '@/content/loadContent';
import { ASSET_MANIFEST } from '@/render/assetManifest';

describe('contenu livré', () => {
  it('est valide', () => {
    expect(() => loadContent()).not.toThrow();
  });

  it('a un visuel (placeholder ou image) pour chaque obstacle', () => {
    const content = loadContent();
    for (const def of content.obstacles.values()) {
      expect(ASSET_MANIFEST[def.assetKey], `assetKey manquante : ${def.assetKey}`).toBeDefined();
    }
  });

  it('ne contient aucun pattern impossible', () => {
    const content = loadContent();
    for (const city of content.cities.values()) {
      for (const pattern of city.patterns) {
        expect(checkPatternSolvable(pattern, content.obstacles)).toEqual([]);
      }
    }
  });
});

describe('validation', () => {
  it('signale un obstacle inconnu dans un pattern', () => {
    const cities = structuredClone(RAW_CONTENT.cities) as Array<{
      patterns: Array<{ spawns: Array<{ obstacle: string }> }>;
    }>;
    cities[0]!.patterns[0]!.spawns[0]!.obstacle = 'licorne';
    expect(() => parseContent({ ...RAW_CONTENT, cities })).toThrow(/obstacle inconnu « licorne »/);
  });

  it('signale un pattern qui bouche les 3 couloirs', () => {
    const cities = structuredClone(RAW_CONTENT.cities) as Array<{ patterns: unknown[] }>;
    cities[0]!.patterns.push({
      id: 'mur',
      spawns: [
        { obstacle: 'lamppost', lane: 0 },
        { obstacle: 'lamppost', lane: 1 },
        { obstacle: 'lamppost', lane: 2 },
      ],
    });
    expect(() => parseContent({ ...RAW_CONTENT, cities })).toThrow(/les 3 couloirs sont bouchés/);
  });

  it('signale un JSON mal formé avec le chemin du champ', () => {
    const obstacles = structuredClone(RAW_CONTENT.obstacles) as Array<Record<string, unknown>>;
    obstacles[0]!.width = 7;
    try {
      parseContent({ ...RAW_CONTENT, obstacles });
      expect.fail('aurait dû lever une erreur');
    } catch (error) {
      expect(error).toBeInstanceOf(ContentError);
      expect((error as ContentError).problems.join('\n')).toMatch(/obstacles\.json > 0\.width/);
    }
  });
});
