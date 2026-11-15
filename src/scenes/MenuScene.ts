import Phaser from 'phaser';
import type { GameContent } from '@/content/loadContent';
import { STRINGS } from '@/i18n/fr';
import { bestScoreKey, loadNumber } from '@/platform/storage';
import { unlockAudio } from '@/platform/sfx';
import {
  loadGodMode,
  loadStartLevelIndex,
  saveGodMode,
  saveStartLevelIndex,
  START_LEVELS,
} from '@/platform/testSettings';
import { VIEW } from '@/render/layout';
import { makeButton, makeToggle, UI_FONT } from '@/render/ui';
import { REGISTRY, SCENES, type GameSceneData } from './keys';

export class MenuScene extends Phaser.Scene {
  private startLevel = 0;
  private god = false;

  constructor() {
    super(SCENES.menu);
  }

  create(): void {
    const content = this.registry.get(REGISTRY.content) as GameContent;
    const cx = VIEW.width / 2;
    this.cameras.main.setBackgroundColor('#1d1f24');

    this.add
      .text(cx, 170, STRINGS.title, {
        fontFamily: UI_FONT,
        fontSize: '72px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 300, 'prototype · placeholders', {
        fontFamily: UI_FONT,
        fontSize: '26px',
        color: '#8e8e93',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 390, STRINGS.tapToStart, {
        fontFamily: UI_FONT,
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    content.cityOrder.forEach((cityId, i) => {
      const city = content.cities.get(cityId);
      if (!city) return;
      const y = 490 + i * 200;
      makeButton(
        this,
        cx,
        y,
        city.name,
        () =>
          this.start({
            cityId,
            startDifficulty: START_LEVELS[this.startLevel]?.value ?? 0,
            god: this.god,
          }),
        { width: 520 },
      );
      const best = loadNumber(bestScoreKey(cityId));
      this.add
        .text(cx, y + 66, `${city.description}${best > 0 ? `\n${STRINGS.best} : ${best}` : ''}`, {
          fontFamily: UI_FONT,
          fontSize: '22px',
          color: '#aeaeb2',
          align: 'center',
          wordWrap: { width: 600 },
        })
        .setOrigin(0.5, 0);
    });

    // Réglages de test : démarrer directement dans une situation chargée, être invincible.
    this.startLevel = loadStartLevelIndex();
    this.god = loadGodMode();
    makeToggle(
      this,
      cx,
      880,
      () => `${STRINGS.startLevel} : ${START_LEVELS[this.startLevel]?.label ?? ''}`,
      () => {
        this.startLevel = (this.startLevel + 1) % START_LEVELS.length;
        saveStartLevelIndex(this.startLevel);
      },
    );
    makeToggle(
      this,
      cx,
      960,
      () => `${STRINGS.invincible} : ${this.god ? STRINGS.yes : STRINGS.no}`,
      () => {
        this.god = !this.god;
        saveGodMode(this.god);
      },
    );

    const controlsY = 1040;
    this.add
      .text(cx, controlsY, STRINGS.controlsTitle, {
        fontFamily: UI_FONT,
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, controlsY + 40, STRINGS.controls.join('\n'), {
        fontFamily: UI_FONT,
        fontSize: '22px',
        color: '#c7c7cc',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(cx, VIEW.height - 30, `v${__APP_VERSION__} · ${__COMMIT__}`, {
        fontFamily: UI_FONT,
        fontSize: '18px',
        color: '#636366',
      })
      .setOrigin(0.5);
  }

  private start(data: GameSceneData): void {
    unlockAudio();
    this.scene.start(SCENES.game, data);
  }
}
