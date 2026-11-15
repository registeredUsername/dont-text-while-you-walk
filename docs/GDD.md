# Game Design Document

Le GDD complet (vision, contrôles, notifications, obstacles, progression, direction artistique,
plateformes, architecture, roadmap et **questions ouvertes à trancher**) est tenu dans un
document partagé, plus pratique pour commenter à plusieurs :

**→ [Don't Text While You Walk : Game Design Document](https://claude.ai/artifact/RCfe2xxvvoAK3ACiScVuTQ)**
(demander l'accès à Christophe).

Quand une version est figée (fin d'un jalon), l'exporter en Markdown depuis le menu du document
et remplacer ce fichier, pour garder l'historique dans Git.

## Résumé des règles implémentées dans le prototype

Ces règles sont dans `src/core/` et couvertes par `tests/simulation.test.ts`.

- **Deux états du téléphone**, baissé et levé, avec 150 ms de transition. Téléphone levé, la
  rue proche est cachée : seules la bande du haut et des alertes (« Attention la vitre ! ») restent visibles.
- **Le même geste change de sens** : téléphone baissé, ← → change de couloir et ↓ fait se
  baisser. Téléphone levé, ← → / tap / appui long répondent à la notification du dessus.
- **3 couloirs**. Obstacles « dodge » (changer de couloir), « duck » (se baisser, toute la
  largeur), bonus « collect » (café = +1 vie, Wi-Fi = -5 stress).
- **3 vies**, perdues par collision ou par jauge de stress pleine (10). 1,5 s d'invulnérabilité
  après un choc, qui fait aussi baisser le téléphone.
- **Notifications** : durée de vie, bonne réponse, stress si ignorée ou mauvaise réponse.
  5 en attente au maximum. Une vie regagnée toutes les 10 bonnes réponses d'affilée.
- **Score** : distance + notifs × combo (x1, x2, x3, x5) + bonus de frôlement (esquive au
  dernier moment).
- **Difficulté** par ville (vitesse, densité, fréquence des notifs) sur une courbe de 2 à 3 min.
- **Jamais de mur infranchissable** : le directeur vérifie qu'il reste un couloir libre au
  moment où les obstacles arrivent, y compris ceux qui marchent vers le joueur.
