import Phaser from 'phaser';
import { ContentError, loadContent } from '@/content/loadContent';
import { readDebugParams } from '@/debug/params';
import { setMuted } from '@/platform/sfx';
import { STRINGS } from '@/i18n/fr';
import { VIEW } from '@/render/layout';
import { UI_FONT } from '@/render/ui';
import { REGISTRY, SCENES } from './keys';

/**
 * Démarrage : lit les paramètres de debug, valide le contenu.
 * Si un JSON est invalide, l'erreur s'affiche à l'écran (pratique pour qui édite le contenu).
 * C'est aussi ici qu'on chargera les vraies images et sons (this.load...).
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    const params = readDebugParams(window.location.search);
    this.registry.set(REGISTRY.debug, params);
    setMuted(params.mute);

    try {
      const content = loadContent();
      this.registry.set(REGISTRY.content, content);
      if (params.city && content.cities.has(params.city)) {
        this.scene.start(SCENES.game, { cityId: params.city, seed: params.seed ?? undefined });
      } else {
        this.scene.start(SCENES.menu);
      }
    } catch (error) {
      const lines = error instanceof ContentError ? error.problems : [String(error)];
      console.error(error);
      this.add.text(24, 24, `${STRINGS.contentError}\n\n${lines.map((l) => `• ${l}`).join('\n')}`, {
        fontFamily: UI_FONT,
        fontSize: '24px',
        color: '#ff6b6b',
        wordWrap: { width: VIEW.width - 48 },
      });
    }
  }
}
