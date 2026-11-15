import type Phaser from 'phaser';

export const UI_FONT = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';

/** Bouton placeholder : un rectangle arrondi et un texte. */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  options: { width?: number; height?: number; color?: number; fontSize?: number } = {},
): Phaser.GameObjects.Container {
  const width = options.width ?? 420;
  const height = options.height ?? 96;
  const bg = scene.add
    .rectangle(0, 0, width, height, options.color ?? 0x0a84ff)
    .setStrokeStyle(4, 0xffffff, 0.25);
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: UI_FONT,
      fontSize: `${options.fontSize ?? 36}px`,
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
    })
    .setOrigin(0.5);
  const button = scene.add.container(x, y, [bg, text]);
  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerdown', () => button.setScale(0.96));
  bg.on('pointerout', () => button.setScale(1));
  bg.on('pointerup', () => {
    button.setScale(1);
    onClick();
  });
  return button;
}

/** Bouton dont le texte change à chaque clic (réglages du menu). */
export function makeToggle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: () => string,
  onClick: () => void,
): Phaser.GameObjects.Container {
  const button = makeButton(
    scene,
    x,
    y,
    label(),
    () => {
      onClick();
      (button.list[1] as Phaser.GameObjects.Text).setText(label());
    },
    { width: 520, height: 64, color: 0x3a3a3c, fontSize: 26 },
  );
  return button;
}
