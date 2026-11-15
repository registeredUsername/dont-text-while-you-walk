# Don't Text While You Walk

Runner mobile à la première personne : tu marches dans la rue en gérant ton téléphone.
Téléphone levé, tu réponds aux notifications mais tu ne vois plus la rue. Téléphone baissé,
tu vois la grand-mère arriver mais les notifs s'accumulent. À toi de choisir, en permanence.

> Statut : **prototype gris** (placeholders), jalon M0. Voir [docs/ROADMAP.md](docs/ROADMAP.md).

## Démarrer en 5 minutes

Prérequis : [Node.js](https://nodejs.org) 22 ou plus récent (la version est fixée dans `.nvmrc`) et Git.

```bash
git clone <url-du-repo>
cd dont-text-while-you-walk
npm install
npm run dev
```

- Sur l'ordinateur : ouvrir http://localhost:5173, puis F12 → mode appareil (Ctrl+Shift+M) → choisir un téléphone.
- Sur ton téléphone (même Wi-Fi) : scanner le QR code affiché dans le terminal.

Toutes les options de test (simulateurs, debug sur téléphone, apps natives) : [docs/TESTING.md](docs/TESTING.md).

## Commandes de jeu

| Geste      | Téléphone baissé   | Téléphone levé                  |
| ---------- | ------------------ | ------------------------------- |
| Swipe ↑    | lever le téléphone |                                 |
| Swipe ↓    | se baisser         | baisser le téléphone            |
| Swipe ← →  | changer de couloir | répondre à la notif (non / oui) |
| Tap        |                    | répondre (OK, liker)            |
| Appui long |                    | répondre (refuser un appel)     |

Au clavier : flèches (ou WASD), espace = tap, L = appui long.

## Scripts

| Commande                                  | Rôle                                                                        |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| `npm run dev`                             | serveur de dev avec rechargement instantané, accessible sur le réseau local |
| `npm test`                                | tests (règles du jeu, gestes, validation du contenu)                        |
| `npm run test:watch`                      | tests en continu pendant qu'on code                                         |
| `npm run lint` / `npm run format`         | qualité et formatage du code                                                |
| `npm run typecheck`                       | vérification TypeScript                                                     |
| `npm run check`                           | tout ce que la CI vérifie, à lancer avant une PR                            |
| `npm run build` / `npm run preview`       | build de production et aperçu local                                         |
| `npm run cap:android` / `npm run cap:ios` | app native (voir docs/TESTING.md)                                           |

## Debug

Paramètres d'URL, combinables : `?debug=1` (overlay), `?seed=42` (rejouer la même partie),
`?god=1` (invincible), `?speed=0.5` (ralenti), `?city=new-york` (démarrage direct), `?mute=1`.

## Organisation

```text
src/core/      règles du jeu, sans Phaser, testées      → docs/ARCHITECTURE.md
src/content/   villes, obstacles, notifs en JSON         → docs/CONTENT_GUIDE.md
src/input/     gestes tactiles et clavier
src/render/    dessin (placeholders), src/scenes/ écrans Phaser
docs/          GDD, architecture, tests, roadmap, décisions (adr/)
```

## Contribuer

Lire [CONTRIBUTING.md](CONTRIBUTING.md). Ajouter un obstacle ou une notification ne demande pas
de coder : [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md).

## Licence

Pas encore de licence : tous droits réservés aux membres du projet en attendant une décision
(voir les questions ouvertes du GDD).
