import type { Gesture } from '@/core/types';

export interface GestureThresholds {
  /** Distance minimale d'un swipe (px du jeu). */
  swipeMinDistance: number;
  /** Durée maximale d'un swipe (ms). Au-delà, c'est un glissé lent, ignoré. */
  swipeMaxDuration: number;
  tapMaxDistance: number;
  tapMaxDuration: number;
  longPressDuration: number;
}

interface Touch {
  id: number;
  x: number;
  y: number;
  t: number;
  /** Le geste a déjà été émis (swipe ou appui long) : on ignore la suite jusqu'au relâchement. */
  consumed: boolean;
  moved: boolean;
}

/**
 * Transforme des événements de pointeur (doigt ou souris) en gestes.
 * Code pur, sans Phaser ni DOM : testé dans tests/gestures.test.ts.
 *
 * - Swipe : émis dès que le doigt a parcouru `swipeMinDistance`, sans attendre le relâchement
 *   (plus réactif pour un runner).
 * - Tap : émis au relâchement si le doigt n'a presque pas bougé.
 * - Appui long : émis par `update()` après `longPressDuration` sans bouger.
 *
 * Un seul doigt est suivi à la fois.
 */
export class GestureRecognizer {
  private touch: Touch | null = null;

  constructor(private readonly th: GestureThresholds) {}

  pointerDown(id: number, x: number, y: number, t: number): void {
    if (this.touch) return;
    this.touch = { id, x, y, t, consumed: false, moved: false };
  }

  pointerMove(id: number, x: number, y: number, t: number): Gesture | null {
    const touch = this.touch;
    if (!touch || touch.id !== id || touch.consumed) return null;
    const dx = x - touch.x;
    const dy = y - touch.y;
    const distance = Math.hypot(dx, dy);
    if (distance > this.th.tapMaxDistance) touch.moved = true;
    if (distance >= this.th.swipeMinDistance && t - touch.t <= this.th.swipeMaxDuration) {
      touch.consumed = true;
      return direction(dx, dy);
    }
    return null;
  }

  pointerUp(id: number, x: number, y: number, t: number): Gesture | null {
    const touch = this.touch;
    if (!touch || touch.id !== id) return null;
    this.touch = null;
    if (touch.consumed) return null;
    const dx = x - touch.x;
    const dy = y - touch.y;
    const distance = Math.hypot(dx, dy);
    const duration = t - touch.t;
    if (distance >= this.th.swipeMinDistance && duration <= this.th.swipeMaxDuration) {
      return direction(dx, dy);
    }
    if (!touch.moved && distance <= this.th.tapMaxDistance && duration <= this.th.tapMaxDuration) {
      return 'tap';
    }
    return null;
  }

  /** À appeler à chaque frame pour détecter l'appui long. */
  update(t: number): Gesture | null {
    const touch = this.touch;
    if (!touch || touch.consumed || touch.moved) return null;
    if (t - touch.t >= this.th.longPressDuration) {
      touch.consumed = true;
      return 'longPress';
    }
    return null;
  }

  cancel(): void {
    this.touch = null;
  }
}

function direction(dx: number, dy: number): Gesture {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'swipeRight' : 'swipeLeft';
  return dy > 0 ? 'swipeDown' : 'swipeUp';
}

/** Raccourcis clavier pour développer sur ordinateur. */
export const KEYBOARD_GESTURES: Readonly<Record<string, Gesture>> = {
  ArrowLeft: 'swipeLeft',
  ArrowRight: 'swipeRight',
  ArrowUp: 'swipeUp',
  ArrowDown: 'swipeDown',
  KeyA: 'swipeLeft',
  KeyD: 'swipeRight',
  KeyW: 'swipeUp',
  KeyS: 'swipeDown',
  Space: 'tap',
  KeyL: 'longPress',
};
