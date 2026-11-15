import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '@/config/gameConfig';
import { GestureRecognizer } from '@/input/GestureRecognizer';

const make = () => new GestureRecognizer(GAME_CONFIG.gestures);

describe('GestureRecognizer', () => {
  it.each([
    ['swipeRight', 100, 0],
    ['swipeLeft', -100, 0],
    ['swipeUp', 0, -100],
    ['swipeDown', 0, 100],
  ] as const)('reconnaît %s dès que la distance est atteinte', (expected, dx, dy) => {
    const r = make();
    r.pointerDown(1, 300, 600, 0);
    expect(r.pointerMove(1, 300 + dx / 4, 600 + dy / 4, 30)).toBeNull();
    expect(r.pointerMove(1, 300 + dx, 600 + dy, 80)).toBe(expected);
    // La suite du même geste est ignorée.
    expect(r.pointerMove(1, 300 + dx * 2, 600 + dy * 2, 100)).toBeNull();
    expect(r.pointerUp(1, 300 + dx * 2, 600 + dy * 2, 120)).toBeNull();
  });

  it('reconnaît un swipe au relâchement si aucun move intermédiaire', () => {
    const r = make();
    r.pointerDown(1, 0, 0, 0);
    expect(r.pointerUp(1, 120, 10, 100)).toBe('swipeRight');
  });

  it('reconnaît un tap', () => {
    const r = make();
    r.pointerDown(1, 100, 100, 0);
    expect(r.pointerUp(1, 103, 102, 120)).toBe('tap');
  });

  it('ignore un glissé trop lent', () => {
    const r = make();
    r.pointerDown(1, 0, 0, 0);
    expect(r.pointerMove(1, 30, 0, 300)).toBeNull();
    expect(r.pointerUp(1, 200, 0, 900)).toBeNull();
  });

  it('reconnaît un appui long une seule fois', () => {
    const r = make();
    r.pointerDown(1, 0, 0, 0);
    expect(r.update(200)).toBeNull();
    expect(r.update(GAME_CONFIG.gestures.longPressDuration + 1)).toBe('longPress');
    expect(r.update(1000)).toBeNull();
    expect(r.pointerUp(1, 0, 0, 1100)).toBeNull();
  });

  it("pas d'appui long si le doigt a bougé", () => {
    const r = make();
    r.pointerDown(1, 0, 0, 0);
    r.pointerMove(1, 30, 0, 600);
    expect(r.update(700)).toBeNull();
  });

  it('suit un seul doigt à la fois', () => {
    const r = make();
    r.pointerDown(1, 0, 0, 0);
    r.pointerDown(2, 500, 500, 10);
    expect(r.pointerUp(2, 500, 500, 50)).toBeNull();
    expect(r.pointerUp(1, 0, 0, 60)).toBe('tap');
  });
});
