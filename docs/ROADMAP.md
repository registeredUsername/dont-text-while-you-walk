# Roadmap

Premier objectif : savoir si le dilemme écran/rue est amusant, avec des carrés gris.

| Jalon                    | Contenu                                                                                                   | Critère de passage                                                   | État    |
| ------------------------ | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------- |
| **M0 Fondations**        | repo, CI, lien de playtest, prototype gris (3 couloirs, lever/baisser, 12 obstacles, 10 notifs, 2 villes) | tout le monde lance le jeu en local et sur son téléphone             | fait    |
| **M1 Test du fun**       | réglage des gestes, courbe de difficulté, sons placeholders, playtests                                    | 10 personnes jouent sans explication, la majorité relance une partie | à faire |
| **M2 Tranche verticale** | Genève aboutie, direction artistique choisie, sons, « juice », tutoriel                                   | on serait fiers d'une vidéo de 30 s                                  |         |
| **M3 Contenu**           | 3 villes, campagne + infini, progression, cosmétiques, FR + EN                                            | 1 h de jeu sans répétition gênante                                   |         |
| **M4 Bêta**              | apps natives, TestFlight, test fermé Google Play (12 testeurs, 14 jours)                                  | aucun crash bloquant, fiches store prêtes                            |         |
| **M5 Sortie**            | publication, page web, bande-annonce                                                                      |                                                                      |         |

## Backlog M1 (idées de premières issues)

- [ ] Régler les seuils de swipe sur 3 téléphones différents
- [ ] Tester la variante « esquive possible téléphone levé, à l'aveugle »
- [ ] Tutoriel des 30 premières secondes (un geste à la fois)
- [ ] Indicateur de couloir et silhouette des mains tenant le téléphone
- [ ] Écran de pause (et pause auto quand l'app passe en arrière-plan)
- [ ] Notification « code 2FA » (séquence de taps) et « photo à liker » (double tap)
- [x] Sauter (tap téléphone baissé) : laisse de chien, barrière basse, flaque
- [x] Mode test : niveau de départ (Normal, Avancé, Chaos) et invincible dans le menu
- [ ] Obstacles : vélo/trottinette rapide, feu rouge (arrêt ?)
- [ ] Réglages : son, vibrations, mode gaucher
- [ ] Partager le score de fin de partie
- [ ] Analytics de playtest minimalistes (durée de partie, cause de mort), sans données personnelles
