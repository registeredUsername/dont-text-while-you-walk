# 0001. Stack : TypeScript + Phaser 4 + Vite + Capacitor

- Date : 2026-11-15
- Statut : acceptée pour le prototype, à confirmer par l'équipe

## Contexte

Jeu mobile tactile en portrait, 2D pseudo-3D, développé à plusieurs amis sur leur temps libre,
avec des niveaux variés en programmation. L'esthétique n'est pas choisie. Besoins clés :
tester très souvent sur de vrais téléphones, collaborer sans conflits Git, sortir sur iOS et
Android à terme, coût nul.

Options étudiées : Phaser 4 + TypeScript + Capacitor, Godot 4, Unity 6, Flutter + Flame.

## Décision

- **Phaser 4** (moteur 2D web, MIT) en **TypeScript strict**, build **Vite**.
- **Capacitor** pour empaqueter en apps iOS/Android (et accéder aux vibrations natives).
- **Zod** pour valider le contenu JSON, **Vitest** pour les tests, **ESLint + Prettier**.
- **GitHub Actions** pour la CI et **GitHub Pages** pour le lien de playtest.

Raisons principales : tester = ouvrir un lien sur son téléphone, sans installation ; tout est
du texte (diff et revue faciles) ; outils web connus et gratuits.

## Conséquences

- Pas de vraie 3D. Si l'équipe choisit une esthétique low-poly 3D, il faudra changer
  (Godot 4 serait le candidat).
- Pour limiter ce risque, les règles (`src/core`) et le contenu (JSON) sont indépendants du
  moteur. Seuls `src/render` et `src/scenes` seraient à réécrire.
- Performances : WebGL suffit largement pour ce jeu. À surveiller sur les vieux Android.
- Compiler pour iOS demande un Mac.
