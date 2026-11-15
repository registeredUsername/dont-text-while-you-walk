# Contribuer

## Le principe

`main` est toujours jouable. Tout changement passe par une branche et une pull request (PR),
relue par quelqu'un d'autre, avec la CI verte. Chaque fusion sur `main` met à jour le lien de
playtest (GitHub Pages).

## Étapes

1. Prendre ou créer une issue (modèles : bug, idée d'obstacle, idée de notif, tâche).
2. Créer une branche depuis `main` à jour :
   ```bash
   git switch main && git pull
   git switch -c feat/grand-mere-qui-recule
   ```
   Préfixes : `feat/`, `fix/`, `content/`, `docs/`, `chore/`.
3. Coder, puis vérifier en local :
   ```bash
   npm run check
   ```
4. Commits au format [Conventional Commits](https://www.conventionalcommits.org/fr/) :
   `feat: ajoute le chien en laisse`, `content: 5 nouvelles notifs de Maman`, `fix: swipe trop sensible`.
5. Pousser et ouvrir la PR. Remplir la checklist, lier l'issue (`Closes #12`).
6. Après relecture et CI verte : « Squash and merge ».

## Règles de code

- **`src/core` ne dépend jamais de Phaser ni du navigateur** (ESLint le vérifie). Une règle de
  jeu va dans le cœur, avec un test. L'affichage lit l'état, il ne décide rien.
- **Pas de `Math.random()` dans le cœur** : utiliser le `Rng` à graine, sinon les parties ne
  sont plus rejouables.
- **Pas de nombre magique** : les réglages vont dans `src/config/gameConfig.ts` ou dans les
  JSON de `src/content/data`.
- **Pas de chemin d'image dans le code** : passer par une clé d'asset (`src/render/assetManifest.ts`).
- TypeScript strict, formatage automatique par Prettier (VS Code formate à l'enregistrement
  si les extensions recommandées sont installées).

## Assets (images, sons, polices)

- Noter la source et la licence de chaque fichier dans `CREDITS.md`, dans la même PR.
- Les fichiers sources lourds (PSD, Krita, Aseprite, Blender) iront dans `assets/source/` via
  Git LFS (lignes prêtes dans `.gitattributes`).

## Décisions techniques

Une décision qui engage le projet (changer de moteur, ajouter un serveur, une grosse
bibliothèque) s'écrit dans `docs/adr/` (une page, modèle fourni) et se discute en PR.
