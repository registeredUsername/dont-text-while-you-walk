# Architecture

Décision de stack : [adr/0001-tech-stack.md](adr/0001-tech-stack.md).

## Vue d'ensemble

```text
 Doigt / clavier                         JSON (villes, obstacles, notifs)
       │                                          │
       ▼                                          ▼
 src/input/GestureRecognizer          src/content/loadContent (Zod)
       │  Gesture                                 │  GameContent
       └───────────────┐            ┌─────────────┘
                       ▼            ▼
                 src/core/Simulation  ◄── Director (patterns, difficulté), Rng (graine)
                       │
                       │  GameState + GameEvent[]   (pas fixe de 1/60 s)
                       ▼
     src/scenes/GameScene ──► src/render (StreetView, PhoneView, Hud)
                       │
                       └──► src/platform (vibrations, sons, sauvegarde)
```

## Les couches

| Dossier        | Rôle                                                                    | Dépend de Phaser ? | Testé ?       |
| -------------- | ----------------------------------------------------------------------- | ------------------ | ------------- |
| `src/config`   | réglages globaux (`GAME_CONFIG`)                                        | non                | indirectement |
| `src/content`  | schémas Zod, JSON, chargement et validation croisée                     | non                | oui           |
| `src/core`     | règles : `Simulation`, `Director`, `difficultyAt`, `Rng`                | **interdit**       | oui           |
| `src/input`    | gestes à partir des pointeurs, raccourcis clavier                       | non                | oui           |
| `src/render`   | dessin pseudo-3D de la rue, téléphone, HUD, manifeste d'assets          | oui                | non (visuel)  |
| `src/scenes`   | écrans Phaser : Boot, Menu, Game, GameOver                              | oui                | non           |
| `src/platform` | vibrations (Capacitor ou navigateur), sons placeholders, stockage local | non                | non           |
| `src/debug`    | paramètres d'URL, overlay                                               | partiel            | non           |

## Boucle de jeu

`GameScene.update()` à chaque frame :

1. Le recognizer détecte l'appui long (les swipes et taps arrivent par les événements pointeur).
2. Le temps écoulé est accumulé et la simulation avance par **pas fixes** de 1/60 s
   (`sim.step(dt)`), ce qui rend le jeu identique quel que soit le nombre d'images par seconde.
3. Chaque pas renvoie des `GameEvent` (collision, notif répondue, frôlement...). La scène les
   transforme en feedback : tremblement, son, vibration, texte qui s'envole.
4. Les vues dessinent `sim.state`. Elles ne modifient jamais l'état.

Un geste appelle `sim.handleGesture(g)` puis `sim.step(0)` pour récupérer immédiatement les
événements qu'il a produits.

## Pseudo-3D

Pas de moteur 3D. Un objet à la distance `d` devant le joueur est dessiné avec une échelle
`p = 1 / (1 + d / 8)`, à la hauteur `horizon + (bas de l'écran - horizon) × p`. Lever le
téléphone remonte l'horizon (on baisse la tête) : la rue proche passe derrière le téléphone.
Tout est dans `src/render/layout.ts`.

## Ajouter...

- **Un obstacle, une notif, une ville** : [CONTENT_GUIDE.md](CONTENT_GUIDE.md), sans toucher au code.
- **Un nouveau type de réponse** (sauter, s'arrêter) : ajouter la valeur dans `obstacleSchema.response`
  (`src/content/schemas.ts`), le geste dans `Simulation.handleGesture`, la règle dans
  `resolveObstacle`, puis un test.
- **Un nouveau geste** (double tap, diagonale) : `GestureRecognizer` + `Gesture` dans
  `src/core/types.ts` + `answerGestureSchema` + tests.
- **De vraies images** : charger les fichiers dans `BootScene` (`this.load.image(...)`), passer
  l'entrée du manifeste en `type: 'image'`, et dans `StreetView.createSprite` utiliser
  `scene.add.image` quand l'entrée est une image.
- **Une langue** : dupliquer `src/i18n/fr.ts`, puis traduire les `texts` des notifications.

## Choix assumés du prototype

- Un seul doigt suivi à la fois.
- L'aide sur le geste attendu est affichée sur chaque notification (`hint`), à retirer ou
  rendre optionnelle après les playtests.
- Les unités de distance sont des « unités de jeu » (u), réglées au ressenti.
