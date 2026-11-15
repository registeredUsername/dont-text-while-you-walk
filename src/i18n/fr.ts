/**
 * Textes de l'interface. Une seule langue pour l'instant : pour traduire, dupliquer ce
 * fichier (en.ts) et choisir la langue au démarrage.
 * Les textes des notifications sont dans src/content/data/notifications.json.
 */
export const STRINGS = {
  title: "Don't Text\nWhile You Walk",
  tapToStart: 'Choisis une ville',
  best: 'Record',
  controlsTitle: 'Commandes',
  controls: [
    'Swipe ↑ / ↓ : lever / baisser le téléphone',
    'Téléphone baissé : ← → couloir, ↓ se baisser, tap sauter',
    'Téléphone levé : ← → répondre, tap, appui long',
    'Clavier : flèches, espace = tap, L = appui long',
  ],
  startLevel: 'Départ',
  invincible: 'Invincible',
  yes: 'oui',
  no: 'non',
  gameOver: 'Fin du trajet',
  retry: 'Rejouer',
  menu: 'Menu',
  newBest: 'Nouveau record !',
  testMode: 'Mode test : record non enregistré',
  distance: 'Distance',
  score: 'Score',
  notifs: 'Notifs traitées',
  missed: 'Notifs ratées',
  collisions: 'Collisions',
  grannies: 'Grand-mères bousculées',
  screenTime: "Temps d'écran",
  nearMiss: 'Ouf !',
  phoneSmashed: 'Trop de stress !',
  contentError: 'Erreur dans le contenu du jeu',
} as const;

/** Titre humoristique de fin de partie selon le style de jeu. */
export function endTitle(screenRatio: number, collisions: number, grannies: number): string {
  if (grannies >= 2) return 'Terreur des trottoirs';
  if (screenRatio > 0.6) return 'Zombie du scroll';
  if (screenRatio < 0.15) return 'Piéton modèle (mais ta mère attend ta réponse)';
  if (collisions === 0) return 'Ninja urbain';
  return 'Citadin connecté';
}
