import type Phaser from 'phaser';
import { GAME_CONFIG } from '@/config/gameConfig';
import type { GameState } from '@/core/types';
import { VIEW } from './layout';

const FONT = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
const STYLE = {
  fontFamily: FONT,
  fontSize: '34px',
  fontStyle: 'bold',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 6,
};

/** Vies, score, combo et jauge de stress, en haut de l'écran. */
export class Hud {
  private readonly lives: Phaser.GameObjects.Text;
  private readonly score: Phaser.GameObjects.Text;
  private readonly combo: Phaser.GameObjects.Text;
  private readonly stressBar: Phaser.GameObjects.Graphics;

  constructor(private readonly scene: Phaser.Scene) {
    this.lives = scene.add.text(24, 20, '', { ...STYLE, color: '#ff5a5f' }).setDepth(3000);
    this.score = scene.add
      .text(VIEW.width - 24, 20, '', STYLE)
      .setOrigin(1, 0)
      .setDepth(3000);
    this.combo = scene.add
      .text(VIEW.width - 24, 62, '', { ...STYLE, fontSize: '28px', color: '#ffd60a' })
      .setOrigin(1, 0)
      .setDepth(3000);
    this.stressBar = scene.add.graphics().setDepth(3000);
  }

  update(state: GameState, multiplier: number): void {
    const max = GAME_CONFIG.player.maxLives;
    this.lives.setText(
      '♥'.repeat(Math.max(0, state.lives)) + '♡'.repeat(Math.max(0, max - state.lives)),
    );
    this.lives.setAlpha(
      state.invulnerableRemaining > 0 && Math.floor(state.time * 10) % 2 === 0 ? 0.3 : 1,
    );
    this.score.setText(`${Math.floor(state.score)}`);
    this.combo.setText(multiplier > 1 ? `combo x${multiplier}` : '');

    const ratio = Math.min(1, state.stress / GAME_CONFIG.stress.max);
    const g = this.stressBar;
    g.clear();
    g.fillStyle(0x000000, 0.35).fillRoundedRect(24, 72, 200, 16, 8);
    if (ratio > 0) {
      g.fillStyle(ratio > 0.7 ? 0xff3b30 : ratio > 0.4 ? 0xff9f0a : 0xffd60a).fillRoundedRect(
        24,
        72,
        Math.max(16, 200 * ratio),
        16,
        8,
      );
    }
  }

  /** Texte qui monte et disparaît (points, « Ouf ! »...). */
  popup(text: string, x: number, y: number, color = '#ffffff'): void {
    const label = this.scene.add
      .text(x, y, text, { ...STYLE, fontSize: '40px', color })
      .setOrigin(0.5)
      .setDepth(3100);
    this.scene.tweens.add({
      targets: label,
      y: y - 120,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy(),
    });
  }
}
