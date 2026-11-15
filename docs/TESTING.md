# Tester et débugger

Au quotidien : navigateur en mode mobile, puis ton vrai téléphone sur le Wi-Fi. Les simulateurs
natifs ne servent que pour l'app empaquetée.

## 1. Navigateur sur l'ordinateur (tout le temps)

```bash
npm run dev
```

Ouvrir http://localhost:5173 dans **Chrome ou Edge**, F12, puis l'icône « téléphone »
(Ctrl+Shift+M, Cmd+Shift+M sur Mac) et choisir un modèle (iPhone, Pixel). La souris simule le
doigt : cliquer-glisser = swipe. Les flèches du clavier marchent aussi.

Le code se recharge tout seul à chaque enregistrement. VS Code : la configuration
« Debug dans Chrome » permet de mettre des points d'arrêt dans le code TypeScript.

Firefox a l'équivalent (Ctrl+Shift+M). Safari : menu Développement > Mode responsive.

## 2. Ton vrai téléphone (dès qu'on règle les gestes)

`npm run dev` affiche une adresse réseau et un **QR code** dans le terminal. Le téléphone doit
être sur le même Wi-Fi que l'ordinateur. Scanner, jouer.

Si ça ne charge pas : pare-feu de l'ordinateur (autoriser Node.js sur le réseau privé), ou
réseau Wi-Fi qui isole les appareils (Wi-Fi invité, réseau d'entreprise). Partage de connexion
du téléphone en dépannage.

Pour lancer directement une partie : `http://<adresse>:5173/?city=geneva&debug=1`.

## 3. Debug sur le téléphone

- **Android** : activer les options développeur et le débogage USB, brancher le câble, ouvrir
  `chrome://inspect` sur l'ordinateur. On voit la console et on inspecte la page du téléphone.
- **iPhone** : Réglages > Safari > Avancé > Inspecteur web. Brancher sur un **Mac**, Safari >
  Développement > (ton iPhone). Pas possible depuis Windows ou Linux.

## 4. Lien de playtest pour les amis

Chaque fusion sur `main` publie le jeu sur GitHub Pages (workflow `deploy-pages.yml`).
Prérequis une fois : Settings > Pages > Source = « GitHub Actions ». Le lien est du type
`https://<compte>.github.io/dont-text-while-you-walk/`. On peut l'ajouter à l'écran d'accueil
du téléphone pour jouer en plein écran.

## 5. App native (avant une version store)

L'app native est générée par Capacitor à partir du build web. Première fois :

```bash
npx cap add android   # crée le dossier android/ (à committer)
npx cap add ios       # crée le dossier ios/ (Mac uniquement pour compiler)
```

Choisir d'abord l'identifiant définitif `appId` dans `capacitor.config.ts`.

Ensuite :

| Cible             | Prérequis                                                                                                                   | Commande                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Émulateur Android | [Android Studio](https://developer.android.com/studio) (Windows, Mac, Linux), créer un appareil virtuel dans Device Manager | `npm run cap:android` puis ▶ dans Android Studio |
| Téléphone Android | câble USB, débogage USB activé                                                                                              | idem, choisir le téléphone                       |
| Simulateur iOS    | Mac + Xcode                                                                                                                 | `npm run cap:ios` puis ▶ dans Xcode              |
| iPhone réel       | Mac + Xcode + compte Apple (gratuit pour tester sur son propre iPhone, 99 USD/an pour publier)                              | idem                                             |

À tester en natif : vibrations (plugin Haptics), performances, zones sûres (encoche), son.

## 6. Paramètres de debug

| Paramètre        | Effet                                                                       |
| ---------------- | --------------------------------------------------------------------------- |
| `?debug=1`       | overlay : FPS, graine, état du téléphone, file de notifs, prochain obstacle |
| `?seed=1234`     | rejoue exactement la même partie (la graine est affichée en fin de partie)  |
| `?god=1`         | invincible                                                                  |
| `?speed=0.5`     | ralenti (jusqu'à 4 pour accélérer)                                          |
| `?city=new-york` | démarre directement dans une ville                                          |
| `?mute=1`        | coupe le son                                                                |

En dev, l'objet Phaser est accessible dans la console : `window.__game`.

## 7. Tests automatiques

```bash
npm test             # une fois
npm run test:watch   # en continu
```

- `tests/simulation.test.ts` : règles du jeu (couloirs, notifs, stress, collisions, déterminisme,
  5 minutes de jeu simulées, jamais de mur).
- `tests/gestures.test.ts` : reconnaissance des swipes, taps, appuis longs.
- `tests/content.test.ts` : validité de tout le contenu JSON.

**Reproduire un bug signalé** : lancer avec la graine du rapport (`?seed=...`), puis écrire un
test dans `simulation.test.ts` qui rejoue la situation avec `sim.spawnObstacle(...)` et
`sim.spawnNotification(...)`.
