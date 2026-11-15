import Phaser from 'phaser';
import { endTitle, STRINGS } from '@/i18n/fr';
import { bestScoreKey, loadNumber, saveNumber } from '@/platform/storage';
import { VIEW } from '@/render/layout';
import { makeButton, UI_FONT } from '@/render/ui';
import { SCENES, type GameOverData } from './keys';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SCENES.gameOver);
  }

  create(data: GameOverData): void {
    const cx = VIEW.width / 2;
    this.cameras.main.setBackgroundColor('#1d1f24');

    const key = bestScoreKey(data.cityId);
    const previousBest = loadNumber(key);
    const isBest = data.score > previousBest;
    if (isBest) saveNumber(key, data.score);

    const grannies = data.stats.collisionsByObstacle['granny'] ?? 0;
    const screenRatio = data.time > 0 ? data.stats.screenTime / data.time : 0;

    this.add
      .text(cx, 140, STRINGS.gameOver, {
        fontFamily: UI_FONT,
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#fff',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 230, endTitle(screenRatio, data.stats.collisions, grannies), {
        fontFamily: UI_FONT,
        fontSize: '34px',
        color: '#ffd60a',
        align: 'center',
        wordWrap: { width: 640 },
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 330, `${data.score}`, {
        fontFamily: UI_FONT,
        fontSize: '96px',
        fontStyle: 'bold',
        color: '#fff',
      })
      .setOrigin(0.5);
    this.add
      .text(
        cx,
        410,
        isBest ? STRINGS.newBest : `${STRINGS.best} : ${Math.max(previousBest, data.score)}`,
        {
          fontFamily: UI_FONT,
          fontSize: '28px',
          color: isBest ? '#34c759' : '#8e8e93',
        },
      )
      .setOrigin(0.5);

    const rows: Array<[string, string]> = [
      [STRINGS.distance, `${data.distance} u`],
      [STRINGS.notifs, `${data.stats.notificationsAnswered}`],
      [STRINGS.missed, `${data.stats.notificationsMissed + data.stats.notificationsWrong}`],
      [STRINGS.collisions, `${data.stats.collisions}`],
      [STRINGS.grannies, `${grannies}`],
      [STRINGS.screenTime, `${Math.round(screenRatio * 100)} %`],
    ];
    rows.forEach(([label, value], i) => {
      const y = 500 + i * 56;
      this.add.text(110, y, label, { fontFamily: UI_FONT, fontSize: '30px', color: '#c7c7cc' });
      this.add
        .text(VIEW.width - 110, y, value, {
          fontFamily: UI_FONT,
          fontSize: '30px',
          fontStyle: 'bold',
          color: '#fff',
        })
        .setOrigin(1, 0);
    });

    makeButton(this, cx, 930, STRINGS.retry, () =>
      this.scene.start(SCENES.game, { cityId: data.cityId }),
    );
    makeButton(this, cx, 1050, STRINGS.menu, () => this.scene.start(SCENES.menu), {
      color: 0x3a3a3c,
    });
    this.add
      .text(cx, VIEW.height - 40, `seed ${data.seed}`, {
        fontFamily: UI_FONT,
        fontSize: '18px',
        color: '#636366',
      })
      .setOrigin(0.5);
  }
}
