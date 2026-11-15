import Phaser from 'phaser';
import { VIEW } from '@/render/layout';
import { BootScene } from '@/scenes/BootScene';
import { GameOverScene } from '@/scenes/GameOverScene';
import { GameScene } from '@/scenes/GameScene';
import { MenuScene } from '@/scenes/MenuScene';
import './style.css';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1d1f24',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: VIEW.width,
    height: VIEW.height,
  },
  input: { activePointers: 2 },
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
});

// Accès depuis la console du navigateur pour débugger : window.__game
if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;
