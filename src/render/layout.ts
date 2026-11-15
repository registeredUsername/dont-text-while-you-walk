/**
 * Géométrie de l'écran et de la perspective. Le jeu est conçu en 720 × 1280 (portrait)
 * puis mis à l'échelle de l'écran du téléphone (Phaser.Scale.FIT).
 */
export const VIEW = { width: 720, height: 1280 } as const;

export const PERSPECTIVE = {
  /** Plus c'est grand, plus les objets lointains restent gros. */
  depthScale: 8,
  /** Largeur d'un couloir au premier plan (px). */
  laneWidth: 250,
  /** Bord du trottoir, en couloirs depuis le centre. */
  sidewalkHalfWidth: 1.5,
  /** Hauteur de la façade des immeubles, en largeurs de couloir. */
  wallHeight: 7,
} as const;

export const PHONE = {
  width: 560,
  height: 1100,
  /** Haut du téléphone quand il est baissé : on n'en voit qu'un bout en bas. */
  downTop: VIEW.height * 0.82,
  /** Haut du téléphone quand il est levé : il reste une bande de rue en haut. */
  upTop: VIEW.height * 0.24,
} as const;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

/** Facteur d'échelle d'un objet à la distance `d` devant le joueur. */
export function depthFactor(d: number): number {
  return 1 / (1 + Math.max(d, -0.9 * PERSPECTIVE.depthScale) / PERSPECTIVE.depthScale);
}

/**
 * Ligne d'horizon. Quand on lève le téléphone, on baisse la tête : l'horizon monte
 * et la rue proche disparaît derrière le téléphone.
 */
export function horizonY(phoneProgress: number, ducking: boolean): number {
  return lerp(VIEW.height * 0.34, VIEW.height * 0.04, phoneProgress) + (ducking ? 70 : 0);
}

export interface Projection {
  horizon: number;
  /** Décalage de caméra en couloirs (suit le couloir du joueur avec un lissage). */
  cameraLane: number;
}

export function projectY(proj: Projection, d: number): number {
  return proj.horizon + (VIEW.height - proj.horizon) * depthFactor(d);
}

/** `offset` = position latérale en couloirs depuis le centre du trottoir (-1, 0, 1 pour les couloirs). */
export function projectX(proj: Projection, offset: number, d: number): number {
  return VIEW.width / 2 + (offset - proj.cameraLane) * PERSPECTIVE.laneWidth * depthFactor(d);
}
