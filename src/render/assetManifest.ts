/**
 * Manifeste des visuels. Le code du jeu ne connaît que des clés (`obstacle.granny`), jamais
 * des fichiers. Pour remplacer un placeholder par une vraie image :
 *   1. déposer l'image dans public/assets/...
 *   2. remplacer l'entrée par { type: 'image', url: 'assets/...', ... }
 *   3. ajouter la source et la licence dans CREDITS.md
 * (le chargement des images est prévu dans PreloadScene, voir docs/ARCHITECTURE.md).
 */
export type AssetEntry =
  | {
      type: 'placeholder';
      /** Couleur du rectangle. */
      color: number;
      /** Taille relative à la largeur d'un couloir, au plus près (1 = un couloir). */
      width: number;
      height: number;
      /** Hauteur du bas de l'objet au-dessus du sol (0 = posé par terre), relative au couloir. */
      elevation?: number;
    }
  | {
      type: 'image';
      url: string;
      width: number;
      height: number;
      elevation?: number;
    };

export const ASSET_MANIFEST: Readonly<Record<string, AssetEntry>> = {
  'obstacle.pedestrian': { type: 'placeholder', color: 0x3f72af, width: 0.55, height: 1.75 },
  'obstacle.granny': { type: 'placeholder', color: 0xb565a7, width: 0.6, height: 1.5 },
  'obstacle.lamppost': { type: 'placeholder', color: 0x2d2d2d, width: 0.18, height: 4 },
  'obstacle.trash-bin': { type: 'placeholder', color: 0x4e8c3a, width: 0.5, height: 0.9 },
  'obstacle.double-stroller': { type: 'placeholder', color: 0xe07a5f, width: 1.7, height: 1.0 },
  // À hauteur de tête : il faut se baisser.
  'obstacle.glass-pane': {
    type: 'placeholder',
    color: 0x9ad1e8,
    width: 3,
    height: 0.45,
    elevation: 1.45,
  },
  'obstacle.scaffolding': {
    type: 'placeholder',
    color: 0xd9a441,
    width: 3,
    height: 0.35,
    elevation: 1.55,
  },
  // Au ras du sol : il faut sauter.
  'obstacle.dog-leash': {
    type: 'placeholder',
    color: 0x8b4513,
    width: 3,
    height: 0.1,
    elevation: 0.3,
  },
  'obstacle.low-barrier': { type: 'placeholder', color: 0xff6b00, width: 3, height: 0.4 },
  'obstacle.puddle': { type: 'placeholder', color: 0x4aa3df, width: 1.8, height: 0.08 },
  'obstacle.tourist-selfie': { type: 'placeholder', color: 0xf2c14e, width: 0.6, height: 1.7 },
  'obstacle.steam-vent': { type: 'placeholder', color: 0xdddddd, width: 0.7, height: 1.6 },
  'obstacle.food-cart': { type: 'placeholder', color: 0xc0392b, width: 1.7, height: 1.4 },
  'pickup.coffee': {
    type: 'placeholder',
    color: 0x8b5a2b,
    width: 0.3,
    height: 0.4,
    elevation: 0.9,
  },
  'pickup.free-wifi': {
    type: 'placeholder',
    color: 0x2ecc71,
    width: 0.35,
    height: 0.35,
    elevation: 1.2,
  },
};
