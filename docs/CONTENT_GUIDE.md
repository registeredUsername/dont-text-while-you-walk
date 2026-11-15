# Ajouter du contenu sans coder

Tout le contenu est dans `src/content/data/`. Après une modification :

```bash
npm test      # vérifie que le contenu est valide (champs, références, patterns possibles)
npm run dev   # pour jouer avec
```

Si un JSON est invalide, le jeu affiche aussi l'erreur à l'écran au démarrage, avec le chemin
du champ fautif.

## Une notification

Dans `notifications.json`, ajouter un objet :

```json
{
  "id": "ex-message",
  "category": "dating",
  "sender": "L'ex",
  "texts": ["Coucou, ça va ? 😊", "J'ai retrouvé ton pull", "On peut parler ?"],
  "expected": "swipeLeft",
  "hint": "← ignorer",
  "ttl": 7,
  "points": 20,
  "difficulty": 2
}
```

| Champ                             | Valeurs                                                | Rôle                                                            |
| --------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| `id`                              | minuscules, chiffres, tirets                           | identifiant unique                                              |
| `category`                        | `family`, `work`, `spam`, `dating`, `social`, `system` | couleur et son de la notif                                      |
| `sender`                          | texte                                                  | expéditeur affiché                                              |
| `texts`                           | liste de textes                                        | une variante tirée au hasard                                    |
| `expected`                        | `swipeLeft`, `swipeRight`, `tap`, `longPress`          | la bonne réponse                                                |
| `hint`                            | texte (optionnel)                                      | aide affichée sur la carte                                      |
| `ttl`                             | secondes                                               | durée de vie en début de partie (raccourcie avec la difficulté) |
| `points`                          | entier                                                 | points d'une bonne réponse (avant combo)                        |
| `difficulty`                      | 1, 2 ou 3                                              | à partir de quand elle peut apparaître                          |
| `stressOnExpire`, `stressOnWrong` | nombre (défaut 1)                                      | stress si ignorée / mauvaise réponse                            |

Puis ajouter son `id` dans la liste `notifications` de chaque ville concernée (`cities/*.json`).

**Règle d'or** : le joueur doit pouvoir deviner la bonne réponse en une seconde, à partir de
l'expéditeur et du texte.

## Un obstacle

Dans `obstacles.json` :

```json
{
  "id": "dog-walker",
  "label": "Promeneur de chiens",
  "kind": "hazard",
  "response": "dodge",
  "width": 2,
  "speed": 1.5,
  "assetKey": "obstacle.dog-walker",
  "warning": "Wouf wouf !"
}
```

| Champ      | Valeurs                                                              | Rôle                                                                               |
| ---------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `kind`     | `hazard` ou `pickup`                                                 | à éviter ou à ramasser                                                             |
| `response` | `dodge` (changer de couloir), `duck` (se baisser), `collect` (bonus) |                                                                                    |
| `width`    | 1 ou 2 pour `dodge`, 3 pour `duck`                                   | couloirs occupés                                                                   |
| `speed`    | u/s, 0 = immobile                                                    | vitesse propre vers le joueur                                                      |
| `assetKey` | clé                                                                  | doit exister dans `src/render/assetManifest.ts` (couleur et taille du placeholder) |
| `warning`  | texte (optionnel)                                                    | alerte affichée quand on a le téléphone levé                                       |
| `damage`   | entier (défaut 1)                                                    | vies perdues                                                                       |
| `effect`   | `{ "heal": 1, "stress": -5, "score": 50 }`                           | effet d'un bonus                                                                   |

Ajouter l'entrée correspondante dans `src/render/assetManifest.ts` (une ligne : couleur, largeur,
hauteur), puis utiliser l'obstacle dans un pattern.

## Un pattern (séquence d'obstacles)

Dans une ville, `patterns` :

```json
{
  "id": "slalom",
  "minDifficulty": 0.3,
  "weight": 1,
  "spawns": [
    { "obstacle": "lamppost", "lane": 0, "dz": 0 },
    { "obstacle": "trash-bin", "lane": 2, "dz": 12 },
    { "obstacle": "lamppost", "lane": "random", "dz": 24 }
  ]
}
```

- `lane` : 0 (gauche), 1 (milieu), 2 (droite) ou `"random"`.
- `dz` : décalage en profondeur dans le pattern (12 u ≈ 1 s au début).
- `minDifficulty` : 0 = dès le début, 1 = fin de courbe. `weight` : fréquence relative.
- Les tests refusent un pattern qui bouche les 3 couloirs en même temps.

## Une ville

Copier `cities/geneva.json`, changer `id`, `name`, couleurs, courbe et patterns, puis
l'ajouter dans `RAW_CONTENT` en bas de `src/content/loadContent.ts` (deux lignes).
