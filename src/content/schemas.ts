import { z } from 'zod';

/**
 * Schémas du contenu du jeu. Les fichiers JSON de src/content/data sont validés au
 * démarrage et dans les tests : une faute de frappe dans un JSON fait échouer `npm test`,
 * pas la partie d'un joueur.
 *
 * Guide pour ajouter du contenu : docs/CONTENT_GUIDE.md
 */

/** Deux obstacles plus proches que ça (u) arrivent « en même temps » pour le joueur. */
export const SIMULTANEOUS_DZ = 4;

const id = z.string().regex(/^[a-z0-9-]+$/, 'identifiant : minuscules, chiffres et tirets');
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'couleur au format #rrggbb');

/** Gestes qu'une notification peut attendre. */
export const answerGestureSchema = z.enum(['swipeLeft', 'swipeRight', 'tap', 'longPress']);

export const obstacleSchema = z
  .object({
    id,
    /** Nom affiché sur le placeholder et dans les stats. */
    label: z.string().min(1),
    /** hazard = à éviter, pickup = à ramasser. */
    kind: z.enum(['hazard', 'pickup']),
    /**
     * dodge = changer de couloir, duck = se baisser, jump = sauter (ou contourner s'il
     * reste un couloir libre), collect = passer dessus.
     */
    response: z.enum(['dodge', 'duck', 'jump', 'collect']),
    /** Nombre de couloirs occupés (1 à 3). */
    width: z.number().int().min(1).max(3),
    /** Vitesse propre vers le joueur (u/s). 0 = immobile. */
    speed: z.number().min(0).default(0),
    /** Clé d'asset : le rendu cherche le visuel avec cette clé (voir src/render/assetManifest.ts). */
    assetKey: z.string().min(1),
    /** Texte d'alerte montré au-dessus du téléphone levé quand l'obstacle approche. */
    warning: z.string().optional(),
    /** Vies perdues en cas de collision. */
    damage: z.number().int().min(0).default(1),
    /** Effet d'un bonus ramassé. */
    effect: z
      .object({
        heal: z.number().int().min(0).optional(),
        stress: z.number().optional(),
        score: z.number().int().optional(),
      })
      .optional(),
  })
  .superRefine((o, ctx) => {
    if (o.response === 'duck' && o.width !== 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['width'],
        message: 'un obstacle « duck » occupe les 3 couloirs',
      });
    }
    if (o.response === 'dodge' && o.width > 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['width'],
        message: 'un obstacle « dodge » laisse au moins un couloir libre (width ≤ 2)',
      });
    }
    if ((o.kind === 'pickup') !== (o.response === 'collect')) {
      ctx.addIssue({
        code: 'custom',
        path: ['response'],
        message: 'kind « pickup » va avec response « collect », et seulement lui',
      });
    }
  });

export const notificationSchema = z.object({
  id,
  category: z.enum(['family', 'work', 'spam', 'dating', 'social', 'system']),
  sender: z.string().min(1),
  /** Variantes de texte, une est tirée au hasard. */
  texts: z.array(z.string().min(1)).min(1),
  /** Geste qui constitue la bonne réponse. */
  expected: answerGestureSchema,
  /** Aide affichée sur la carte (utile au début, à retirer plus tard). */
  hint: z.string().optional(),
  /** Durée de vie en secondes en début de partie. */
  ttl: z.number().positive(),
  points: z.number().int().min(0),
  /** 1 = dès le début, 3 = fin de partie. */
  difficulty: z.number().int().min(1).max(3),
  stressOnExpire: z.number().min(0).default(1),
  stressOnWrong: z.number().min(0).default(1),
});

export const laneSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal('random')]);

export const patternSchema = z.object({
  id,
  /** Difficulté (0 à 1) à partir de laquelle le pattern peut sortir. */
  minDifficulty: z.number().min(0).max(1).default(0),
  weight: z.number().positive().default(1),
  spawns: z
    .array(
      z.object({
        obstacle: id,
        /** Couloir de gauche (0), du milieu (1), de droite (2), ou au hasard. */
        lane: laneSchema,
        /** Décalage en profondeur par rapport au début du pattern (u). */
        dz: z.number().min(0).default(0),
      }),
    )
    .min(1),
});

export const citySchema = z.object({
  id,
  name: z.string().min(1),
  description: z.string(),
  colors: z.object({
    sky: hexColor,
    skyline: hexColor,
    sidewalk: hexColor,
    road: hexColor,
    laneLine: hexColor,
  }),
  curve: z.object({
    /** Secondes pour passer de la difficulté 0 à 1. */
    rampSeconds: z.number().positive(),
    speedStart: z.number().positive(),
    speedMax: z.number().positive(),
    /** Écart entre deux patterns (u), au début et au maximum de difficulté. */
    patternGapStart: z.number().positive(),
    patternGapMin: z.number().positive(),
    /** Intervalle moyen entre deux notifications (s). */
    notificationIntervalStart: z.number().positive(),
    notificationIntervalMin: z.number().positive(),
    /** Facteur appliqué aux durées de vie des notifs à difficulté maximale. */
    ttlScaleEnd: z.number().positive().max(1),
  }),
  patterns: z.array(patternSchema).min(1),
  /** Identifiants des notifications possibles dans cette ville. */
  notifications: z.array(id).min(1),
});

export type AnswerGesture = z.infer<typeof answerGestureSchema>;
export type ObstacleDef = z.infer<typeof obstacleSchema>;
export type NotificationDef = z.infer<typeof notificationSchema>;
export type PatternDef = z.infer<typeof patternSchema>;
export type CityDef = z.infer<typeof citySchema>;
export type Lane = z.infer<typeof laneSchema>;
