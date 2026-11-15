import type Phaser from 'phaser';
import { GAME_CONFIG } from '@/config/gameConfig';
import type { CityDef } from '@/content/schemas';
import type { GameState, ObstacleInstance } from '@/core/types';
import { ASSET_MANIFEST, type AssetEntry } from './assetManifest';
import {
  clamp,
  depthFactor,
  horizonY,
  PERSPECTIVE,
  PHONE,
  projectX,
  projectY,
  VIEW,
  type Projection,
} from './layout';

const FALLBACK_ASSET: AssetEntry = { type: 'placeholder', color: 0xff00ff, width: 0.6, height: 1 };
const JOINT_SPACING = 6;
const FACADE_SPACING = 14;
const MAX_WARNINGS = 3;

const hex = (color: string): number => Number.parseInt(color.slice(1), 16);

/** Remplit un polygone (sans allouer de Vector2 à chaque frame). */
function fillPolygon(
  g: Phaser.GameObjects.Graphics,
  points: ReadonlyArray<{ x: number; y: number }>,
): void {
  const [first, ...rest] = points;
  if (!first) return;
  g.beginPath();
  g.moveTo(first.x, first.y);
  for (const p of rest) g.lineTo(p.x, p.y);
  g.closePath();
  g.fillPath();
}

interface ObstacleSprite {
  container: Phaser.GameObjects.Container;
  rect: Phaser.GameObjects.Rectangle;
  baseColor: number;
  hitTimer: number;
}

/**
 * Dessine la rue en pseudo-3D à partir de l'état de la partie.
 * Ne contient aucune règle : il lit `GameState` et dessine.
 */
export class StreetView {
  private readonly ground: Phaser.GameObjects.Graphics;
  private readonly sprites = new Map<number, ObstacleSprite>();
  private readonly warnings: Phaser.GameObjects.Text[] = [];
  private readonly skyline: Array<{ x: number; w: number; h: number }> = [];
  private readonly colors;
  private cameraLane = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    city: CityDef,
  ) {
    this.colors = {
      sky: hex(city.colors.sky),
      skyline: hex(city.colors.skyline),
      sidewalk: hex(city.colors.sidewalk),
      road: hex(city.colors.road),
      laneLine: hex(city.colors.laneLine),
    };
    this.ground = scene.add.graphics().setDepth(0);
    // Silhouette d'immeubles à l'horizon : générée une fois, déterministe.
    let x = -200;
    let i = 0;
    while (x < VIEW.width + 200) {
      const w = 60 + ((i * 37) % 70);
      this.skyline.push({ x, w, h: 60 + ((i * 53) % 140) });
      x += w + 6;
      i++;
    }
    for (let k = 0; k < MAX_WARNINGS; k++) {
      this.warnings.push(
        scene.add
          .text(0, 0, '', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '30px',
            fontStyle: 'bold',
            color: '#ffffff',
            backgroundColor: '#c0392b',
            padding: { x: 12, y: 6 },
          })
          .setOrigin(0.5)
          .setDepth(1500)
          .setVisible(false),
      );
    }
  }

  update(state: GameState, deltaMs: number): void {
    // Caméra : suit le couloir du joueur avec un lissage (le changement de couloir reste instantané en jeu).
    const targetLane = state.lane - (GAME_CONFIG.lanes - 1) / 2;
    this.cameraLane += (targetLane - this.cameraLane) * clamp(deltaMs / 70, 0, 1);
    const proj: Projection = {
      horizon: horizonY(state.phone.progress, state.duckRemaining > 0),
      cameraLane: this.cameraLane,
    };
    this.drawGround(state, proj);
    this.drawObstacles(state, proj, deltaMs);
    this.drawWarnings(state, proj);
  }

  /** Fait clignoter un obstacle percuté. */
  flash(uid: number): void {
    const sprite = this.sprites.get(uid);
    if (sprite) sprite.hitTimer = 400;
  }

  private drawGround(state: GameState, proj: Projection): void {
    const g = this.ground;
    const c = this.colors;
    const far = 400;
    const half = PERSPECTIVE.sidewalkHalfWidth;
    g.clear();

    // Ciel, sol de base, et silhouette d'immeubles (parallaxe légère avec la caméra).
    g.fillStyle(c.road).fillRect(0, proj.horizon, VIEW.width, VIEW.height - proj.horizon);
    g.fillStyle(c.sky).fillRect(0, 0, VIEW.width, proj.horizon + 2);
    g.fillStyle(c.skyline, 0.6);
    for (const b of this.skyline) {
      g.fillRect(b.x - this.cameraLane * 12, proj.horizon - b.h, b.w, b.h + 2);
    }

    // Route à droite, trottoir au centre, façade à gauche.
    const quad = (o1: number, o2: number, color: number, alpha = 1): void => {
      g.fillStyle(color, alpha);
      fillPolygon(g, [
        { x: projectX(proj, o1, far), y: projectY(proj, far) },
        { x: projectX(proj, o2, far), y: projectY(proj, far) },
        { x: projectX(proj, o2, 0), y: VIEW.height },
        { x: projectX(proj, o1, 0), y: VIEW.height },
      ]);
    };
    quad(half, half + 6, c.road);
    quad(-half, half, c.sidewalk);

    // Façade : un plan vertical au bord gauche du trottoir.
    const wallOffset = -half - 0.1;
    const wallTop = (d: number): number =>
      projectY(proj, d) - PERSPECTIVE.wallHeight * PERSPECTIVE.laneWidth * depthFactor(d);
    g.fillStyle(c.skyline);
    fillPolygon(g, [
      { x: projectX(proj, wallOffset, far), y: projectY(proj, far) },
      { x: projectX(proj, wallOffset, far), y: wallTop(far) },
      { x: projectX(proj, wallOffset, -2), y: wallTop(-2) },
      { x: projectX(proj, wallOffset, -2), y: projectY(proj, -2) },
      { x: -400, y: projectY(proj, -2) },
      { x: -400, y: wallTop(far) },
    ]);

    // Lignes de couloirs et bordure.
    g.lineStyle(3, c.laneLine, 0.5);
    for (const offset of [-0.5, 0.5]) {
      g.lineBetween(
        projectX(proj, offset, far),
        projectY(proj, far),
        projectX(proj, offset, 0),
        VIEW.height,
      );
    }
    g.lineStyle(6, 0xffffff, 0.35);
    g.lineBetween(
      projectX(proj, half, far),
      projectY(proj, far),
      projectX(proj, half, 0),
      VIEW.height,
    );

    // Joints du trottoir et séparations de façade qui défilent : la sensation de vitesse.
    const view = GAME_CONFIG.viewDistance;
    const jointPhase = state.distance % JOINT_SPACING;
    for (let d = JOINT_SPACING - jointPhase; d < view; d += JOINT_SPACING) {
      const y = projectY(proj, d);
      g.lineStyle(2, 0x000000, 0.18 * (1 - d / view));
      g.lineBetween(projectX(proj, -half, d), y, projectX(proj, half, d), y);
    }
    const facadePhase = state.distance % FACADE_SPACING;
    for (let d = FACADE_SPACING - facadePhase; d < view; d += FACADE_SPACING) {
      const x = projectX(proj, wallOffset, d);
      g.lineStyle(4, 0x000000, 0.25 * (1 - d / view));
      g.lineBetween(x, projectY(proj, d), x, wallTop(d));
    }
  }

  private drawObstacles(state: GameState, proj: Projection, deltaMs: number): void {
    const seen = new Set<number>();
    for (const obstacle of state.obstacles) {
      const d = obstacle.z - state.distance;
      if (d > GAME_CONFIG.viewDistance + 1) continue;
      seen.add(obstacle.uid);
      const sprite = this.sprites.get(obstacle.uid) ?? this.createSprite(obstacle);
      const entry = ASSET_MANIFEST[obstacle.def.assetKey] ?? FALLBACK_ASSET;
      const p = depthFactor(d);
      const laneCenter = obstacle.lane + obstacle.def.width / 2 - GAME_CONFIG.lanes / 2;
      const elevation = (entry.elevation ?? 0) * PERSPECTIVE.laneWidth * p;
      sprite.container
        .setPosition(projectX(proj, laneCenter, d), projectY(proj, d) - elevation)
        .setScale(p)
        .setDepth(1000 - d)
        // Apparition progressive à l'horizon, disparition rapide une fois dépassé.
        .setAlpha(d < 0 ? clamp(1 + d / 2, 0, 1) : clamp((GAME_CONFIG.viewDistance - d) / 8, 0, 1));
      if (sprite.hitTimer > 0) {
        sprite.hitTimer -= deltaMs;
        sprite.rect.setFillStyle(
          Math.floor(sprite.hitTimer / 80) % 2 === 0 ? 0xff3b30 : sprite.baseColor,
        );
      } else {
        sprite.rect.setFillStyle(sprite.baseColor);
      }
    }
    for (const [uid, sprite] of this.sprites) {
      if (!seen.has(uid)) {
        sprite.container.destroy();
        this.sprites.delete(uid);
      }
    }
  }

  private createSprite(obstacle: ObstacleInstance): ObstacleSprite {
    const entry = ASSET_MANIFEST[obstacle.def.assetKey] ?? FALLBACK_ASSET;
    const lw = PERSPECTIVE.laneWidth;
    const w = entry.width * lw;
    const h = entry.height * lw;
    const color = entry.type === 'placeholder' ? entry.color : 0xff00ff;
    // Placeholder : un rectangle de couleur avec le nom de l'objet dessus.
    const rect = this.scene.add
      .rectangle(0, 0, w, h, color)
      .setOrigin(0.5, 1)
      .setStrokeStyle(6, 0x000000, 0.5);
    const label = this.scene.add
      .text(0, -h / 2, obstacle.def.label, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
        wordWrap: { width: Math.max(w, 260) },
      })
      .setOrigin(0.5);
    const container = this.scene.add.container(0, 0, [rect, label]);
    const sprite: ObstacleSprite = { container, rect, baseColor: color, hitTimer: 0 };
    this.sprites.set(obstacle.uid, sprite);
    return sprite;
  }

  /**
   * Téléphone levé, la rue proche est cachée : on affiche les alertes des obstacles
   * qui approchent derrière le téléphone (le joueur les « sent venir »).
   */
  private drawWarnings(state: GameState, proj: Projection): void {
    const phoneTop = PHONE.downTop + (PHONE.upTop - PHONE.downTop) * state.phone.progress;
    const hidden = state.obstacles
      .filter((o) => !o.resolved && o.def.warning && o.def.kind === 'hazard')
      .map((o) => ({ o, d: o.z - state.distance }))
      .filter(({ d }) => d > 0 && projectY(proj, d) > phoneTop && state.phone.progress > 0.5)
      .sort((a, b) => a.d - b.d)
      .slice(0, MAX_WARNINGS);
    this.warnings.forEach((text, i) => {
      const item = hidden[i];
      if (!item) {
        text.setVisible(false);
        return;
      }
      const laneCenter =
        item.o.lane + item.o.def.width / 2 - GAME_CONFIG.lanes / 2 - this.cameraLane;
      const urgency = 1 - clamp(item.d / 30, 0, 1);
      text
        .setText(`⚠ ${item.o.def.warning}`)
        .setPosition(VIEW.width / 2 + laneCenter * 200, phoneTop - 50 - i * 56)
        .setScale(0.85 + urgency * 0.25)
        .setAlpha(0.6 + 0.4 * Math.abs(Math.sin(state.time * (4 + urgency * 8))))
        .setVisible(true);
    });
  }
}
