import type Phaser from 'phaser';
import { GAME_CONFIG } from '@/config/gameConfig';
import type { NotificationDef } from '@/content/schemas';
import type { GameState, Gesture, NotificationInstance } from '@/core/types';
import { lerp, PHONE, VIEW } from './layout';

const CATEGORY_COLORS: Record<NotificationDef['category'], number> = {
  family: 0xe76f51,
  work: 0x264653,
  spam: 0x8d8d8d,
  dating: 0xe63977,
  social: 0x2a9d8f,
  system: 0x457b9d,
};

const SCREEN_INSET = 18;
const CARD_X = 34;
const CARD_WIDTH = PHONE.width - CARD_X * 2;
const CARD_HEIGHT = 168;
const CARD_GAP = 14;
const CARDS_TOP = 96;
const FONT = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';

interface CardView {
  container: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Graphics;
  timer: Phaser.GameObjects.Rectangle;
  hint: Phaser.GameObjects.Text;
  y: number;
}

/**
 * Le téléphone tenu en main : un cadre, une barre d'état, et la pile de notifications.
 * Sa position suit `state.phone.progress` (0 = baissé, 1 = levé).
 */
export class PhoneView {
  private readonly container: Phaser.GameObjects.Container;
  private readonly cardLayer: Phaser.GameObjects.Container;
  private readonly stressOverlay: Phaser.GameObjects.Rectangle;
  private readonly counter: Phaser.GameObjects.Text;
  private readonly clock: Phaser.GameObjects.Text;
  private readonly cards = new Map<number, CardView>();
  /** Décalage vertical lissé quand on se baisse ou qu'on saute. */
  private bodyOffset = 0;

  constructor(private readonly scene: Phaser.Scene) {
    const body = scene.add.graphics();
    body.fillStyle(0x111214).fillRoundedRect(0, 0, PHONE.width, PHONE.height, 56);
    body
      .fillStyle(0xf2f2f5)
      .fillRoundedRect(
        SCREEN_INSET,
        SCREEN_INSET,
        PHONE.width - SCREEN_INSET * 2,
        PHONE.height - SCREEN_INSET * 2,
        40,
      );
    body.fillStyle(0x111214).fillRoundedRect(PHONE.width / 2 - 70, SCREEN_INSET + 8, 140, 34, 17);

    this.clock = scene.add.text(52, 30, '9:41', {
      fontFamily: FONT,
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#111',
    });
    const status = scene.add
      .text(PHONE.width - 52, 30, '5G ▮▮▮ 87%', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#111',
      })
      .setOrigin(1, 0);
    this.counter = scene.add
      .text(PHONE.width / 2, 74, '', { fontFamily: FONT, fontSize: '20px', color: '#666' })
      .setOrigin(0.5, 0);
    this.stressOverlay = scene.add
      .rectangle(
        SCREEN_INSET,
        SCREEN_INSET,
        PHONE.width - SCREEN_INSET * 2,
        PHONE.height - SCREEN_INSET * 2,
        0xff0000,
        0,
      )
      .setOrigin(0);
    this.cardLayer = scene.add.container(0, 0);

    this.container = scene.add
      .container((VIEW.width - PHONE.width) / 2, PHONE.downTop, [
        body,
        this.stressOverlay,
        this.clock,
        status,
        this.counter,
        this.cardLayer,
      ])
      .setDepth(2000);
  }

  update(state: GameState, deltaMs: number): void {
    // Petit balancement de marche quand le téléphone est baissé.
    const sway = Math.sin(state.distance * 0.9) * 8 * (1 - state.phone.progress);
    // Accroupi : le téléphone descend. En saut : il traîne un peu derrière le mouvement.
    let target = 0;
    if (state.duckRemaining > 0) target = 110;
    if (state.jumpRemaining > 0) {
      const t = 1 - state.jumpRemaining / GAME_CONFIG.player.jumpSeconds;
      target = Math.sin(Math.PI * t) * 90;
    }
    this.bodyOffset += (target - this.bodyOffset) * Math.min(1, deltaMs / 40);
    this.container.y =
      lerp(PHONE.downTop, PHONE.upTop, easeOut(state.phone.progress)) + sway + this.bodyOffset;
    this.container.x = (VIEW.width - PHONE.width) / 2 + Math.cos(state.distance * 0.45) * 6;

    const minutes = 41 + Math.floor(state.time / 60);
    this.clock.setText(`9:${String(minutes % 60).padStart(2, '0')}`);
    const n = state.notifications.length;
    this.counter.setText(n === 0 ? 'Aucune notification' : `${n} notification${n > 1 ? 's' : ''}`);
    this.stressOverlay.setFillStyle(0xff0000, (state.stress / GAME_CONFIG.stress.max) * 0.3);

    const alive = new Set(state.notifications.map((x) => x.uid));
    for (const [uid, card] of this.cards) {
      if (!alive.has(uid)) this.dismiss(uid, card, 'fade');
    }
    state.notifications.forEach((notification, index) => {
      const card = this.cards.get(notification.uid) ?? this.createCard(notification);
      const targetY = CARDS_TOP + index * (CARD_HEIGHT + CARD_GAP);
      card.y += (targetY - card.y) * 0.3;
      card.container.y = card.y;
      card.container.setAlpha(index === 0 ? 1 : 0.75);
      card.hint.setVisible(index === 0);
      const ratio = Math.max(0, notification.remaining / notification.ttl);
      card.timer.width = (CARD_WIDTH - 40) * ratio;
      card.timer.setFillStyle(ratio < 0.3 ? 0xe74c3c : 0x34c759);
      this.drawFrame(card, notification, index === 0);
    });
  }

  /** Animation quand le joueur répond à la notification du dessus. */
  answered(notification: NotificationInstance, gesture: Gesture, correct: boolean): void {
    const card = this.cards.get(notification.uid);
    if (!card) return;
    const direction =
      gesture === 'swipeLeft' ? 'left' : gesture === 'swipeRight' ? 'right' : 'fade';
    if (!correct)
      card.container.add(
        this.scene.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0xff0000, 0.35).setOrigin(0),
      );
    this.dismiss(notification.uid, card, direction);
  }

  expired(notification: NotificationInstance): void {
    const card = this.cards.get(notification.uid);
    if (card) this.dismiss(notification.uid, card, 'fade');
  }

  private dismiss(uid: number, card: CardView, how: 'left' | 'right' | 'fade'): void {
    this.cards.delete(uid);
    this.scene.tweens.add({
      targets: card.container,
      x: how === 'left' ? -PHONE.width : how === 'right' ? PHONE.width : card.container.x,
      alpha: 0,
      duration: how === 'fade' ? 250 : 180,
      onComplete: () => card.container.destroy(),
    });
  }

  private createCard(notification: NotificationInstance): CardView {
    const def = notification.def;
    const frame = this.scene.add.graphics();
    const icon = this.scene.add.circle(44, 44, 24, CATEGORY_COLORS[def.category]);
    const initial = this.scene.add
      .text(44, 44, def.sender.charAt(0).toUpperCase(), {
        fontFamily: FONT,
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#fff',
      })
      .setOrigin(0.5);
    const sender = this.scene.add.text(82, 26, def.sender, {
      fontFamily: FONT,
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#111',
    });
    const body = this.scene.add.text(24, 76, notification.text, {
      fontFamily: FONT,
      fontSize: '25px',
      color: '#222',
      wordWrap: { width: CARD_WIDTH - 48 },
    });
    // Aide sur le geste attendu (prototype). À retirer ou rendre optionnelle plus tard.
    const hint = this.scene.add
      .text(CARD_WIDTH - 20, 26, def.hint ?? '', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#0a84ff',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);
    const timer = this.scene.add
      .rectangle(20, CARD_HEIGHT - 14, CARD_WIDTH - 40, 6, 0x34c759)
      .setOrigin(0, 0.5);
    const y = CARDS_TOP + this.cards.size * (CARD_HEIGHT + CARD_GAP) + 60;
    const container = this.scene.add.container(CARD_X, y, [
      frame,
      icon,
      initial,
      sender,
      body,
      hint,
      timer,
    ]);
    this.cardLayer.add(container);
    const card: CardView = { container, frame, timer, hint, y };
    this.cards.set(notification.uid, card);
    return card;
  }

  private drawFrame(card: CardView, notification: NotificationInstance, top: boolean): void {
    const g = card.frame;
    g.clear();
    g.fillStyle(0xffffff).fillRoundedRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 24);
    if (top)
      g.lineStyle(4, CATEGORY_COLORS[notification.def.category]).strokeRoundedRect(
        0,
        0,
        CARD_WIDTH,
        CARD_HEIGHT,
        24,
      );
  }
}

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}
