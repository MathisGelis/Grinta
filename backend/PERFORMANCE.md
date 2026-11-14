# Performance backend

Phase 2 : optimisation des temps de réponse. Règle suivie : mesurer avant de modifier, ne corriger que ce que les mesures désignent.

## Résumé

- La cause dominante est l'absence d'index sur les clés étrangères. Postgres n'en crée pas automatiquement : seules les colonnes de tête d'une contrainte d'unicité étaient indexées (par exemple `post_likes(userId, postId)` mais pas `postId` seul, `connections(followerId, followingId)` mais pas `followingId` seul). Treize index ajoutés (migration + entités) ramènent `GET /posts/feed/top` de **4,4 s à 13 ms**, `GET /users/:id/profile` de **1,1 s à 8 ms**, `GET /posts/mine` de **688 ms à 7 ms**.
- Le N+1 annoncé dans le CLAUDE.md sur `relations: ['exercises']` **n'existe pas** : `find` avec `relations` charge tout par JOIN en une requête (`GET /workouts/completed` fait 1 requête, mesuré). Les vrais N+1 étaient dans les écritures : une requête par exercice ou par jour de programme. Ils sont corrigés (création de workout : 10 requêtes à 5).
- Les sous-requêtes des feeds (`likesCount`, `commentsCount`, `isLiked`) **ne sont pas réécrites** : une fois les index en place elles coûtent 1 à 4 ms, voir « Volontairement non modifié ».

## Méthode

Mesure locale, sur un Postgres 16 sans latence réseau. Un jeu de données synthétique est chargé par `perf/seed-perf.sql` :

| Table | Lignes |
| --- | ---: |
| `users` | 2 001 |
| `completed_workouts` | 69 220 |
| `completed_workout_exercises` | 346 180 |
| `posts` | 24 158 |
| `post_likes` | 291 432 |
| `post_comments` | 60 250 |
| `connections` | 80 008 |
| `planned_workouts` | 16 015 |

Le compte de test est un utilisateur actif : 300 workouts, 15 plans, 3 programmes, 40 abonnements, 80 abonnés. Pour chaque endpoint, `perf/bench.mjs` exécute 15 requêtes après 2 de chauffe et relève :

- le nombre de requêtes SQL **émises par l'application** par appel (`pg_stat_statements.track = top`, ce qui exclut les triggers de clés étrangères internes à Postgres, qui gonflaient le comptage des écritures à 18 au lieu de 5),
- le temps de base de données par appel,
- le temps mur p50 et p95, et la taille de la réponse.

Avant et après ont été mesurés dans les mêmes conditions : même base, lignes créées par le benchmark supprimées entre les deux runs. « Avant » est le code de la Phase 1 sans index, « après » est le code et la migration de cette branche.

**Limite importante** : en production chaque requête SQL ajoute un aller-retour vers Supabase (eu-north-1). Les temps absolus ci-dessous sont donc un plancher, et la colonne « requêtes » compte autant que les millisecondes : un endpoint qui passe de 7 à 3 requêtes gagne plusieurs fois la latence réseau en plus du temps de calcul.

## Résultats

| Endpoint | Requêtes avant | Requêtes après | p50 avant (ms) | p50 après (ms) | Gain |
| --- | ---: | ---: | ---: | ---: | ---: |
| `GET /posts/feed/following` | 1 | 1 | 599,4 | 9,9 | x61 |
| `GET /posts/feed/top` | 1 | 1 | 4 410,7 | 13,3 | x332 |
| `GET /posts/:id` | 1 | 1 | 57,1 | 6,4 | x9 |
| `GET /posts/:id/comments` | 2 | 2 | 19,9 | 8 | x2 |
| `GET /posts/:id/likes` | 2 | 2 | 47,3 | 8 | x6 |
| `GET /posts/mine` | 1 | 1 | 688 | 7 | x98 |
| `GET /workouts/completed` | 1 | 1 | 175,9 | 13,8 | x13 |
| `GET /workouts/planned` | 1 | 1 | 27,1 | 4,9 | x6 |
| `GET /workouts/completed/:id` | 2 | 2 | 125,2 | 10,7 | x12 |
| `GET /programmes` | 1 | 1 | 7,2 | 7,5 | inchangé |
| `GET /programmes/:id` | 2 | 2 | 8,9 | 8,9 | inchangé |
| `GET /stats/summary` | 3 | 3 | 115,8 | 13,3 | x9 |
| `GET /stats/muscle-distribution` | 1 | 1 | 16,1 | 6,1 | x3 |
| `GET /stats/balance` | 1 | 1 | 16,8 | 6,4 | x3 |
| `GET /stats/consistency` | 1 | 1 | 15,8 | 10,1 | inchangé |
| `GET /stats/muscle-frequency` | 1 | 1 | 122,5 | 19,5 | x6 |
| `GET /stats/workout/:id` | 4 | 4 | 204,2 | 11,4 | x18 |
| `GET /users/:id/profile` | 7 | 3 | 1 084,5 | 8,3 | x131 |
| `GET /users/search` | 1 | 1 | 18 | 18,5 | inchangé |
| `GET /connections/recommendations` | 2 | 2 | 10,3 | 9,6 | inchangé |
| `GET /connections/:id/followers` | 1 | 1 | 14,2 | 5,2 | x3 |
| `GET /exercises` | 1 | 1 | 7,6 | 8,2 | inchangé |
| `POST /workouts/completed` (6 exercices) | 10 | 5 | 15,1 | 12,5 | 5 requêtes de moins |
| `PATCH /workouts/planned/:id` (6 exercices) | 17 | 12 | 55,2 | 24,9 | x2 |
| `POST /programmes` (7 jours) | 12 | 5 | 16,7 | 13,5 | 7 requêtes de moins |

Les 5 requêtes restantes d'une création de workout sont le minimum de TypeORM : `START TRANSACTION`, `INSERT` du workout, `INSERT` en un seul lot des exercices, `SELECT` des exercices référencés, `COMMIT`.

## Décisions

### Index sur les clés étrangères (migration `AddForeignKeyIndexes`)

| Index | Sert à |
| --- | --- |
| `completed_workouts (userId, completionDate)` | historique, filtres par période des Stats, compteurs du profil |
| `completed_workout_exercises (workoutId)` | chargement des exercices d'un workout (jointure la plus fréquente) |
| `planned_workouts (userId, createdAt)`, `planned_workout_exercises (workoutId)` | liste et détail des plans |
| `programmes (userId)`, `programme_days (workoutId)` | liste des programmes, `ON DELETE SET NULL` à la suppression d'un plan |
| `posts (userId, createdAt)`, `posts (createdAt)` | `posts/mine`, profil, top du mois |
| `post_likes (postId)` | `likesCount`, liste des likes |
| `post_comments (postId, createdAt)` | `commentsCount`, liste des commentaires |
| `connections (followingId)`, `follow_requests (followingId)` | abonnés, demandes reçues, feed |
| `comment_reports (commentId)` | suppression en cascade d'un commentaire |

Ce que montre `EXPLAIN (ANALYZE, BUFFERS)` sur la requête du top du mois : sans index, les sous-requêtes corrélées font un `Seq Scan on post_likes` (291 k lignes) **une fois par post candidat** (`loops=159`, plusieurs sous-plans), soit 4 790 ms. Avec index, ce sont des `Index Only Scan on "IDX_post_likes_post"` et le filtre de date passe par `Bitmap Index Scan on "IDX_posts_created"` : 3,9 ms.

Usage constaté pendant le benchmark (`pg_stat_user_indexes`) : tous les index ont été utilisés sauf `follow_requests (followingId)` et `comment_reports (commentId)`, qui servent uniquement à l'acceptation d'une demande et à la suppression d'un commentaire, des chemins que le benchmark ne parcourt pas. Ils sont conservés (8 ko chacun) parce que sans eux ces opérations feraient un parcours complet de la table à mesure qu'elle grossit.

Les index sont **déclarés sur les entités** (`@Index` avec un nom explicite) et créés par la migration avec `CREATE INDEX IF NOT EXISTS`. Les deux sont nécessaires : tant que `synchronize: true` est actif, un index créé par migration seule serait supprimé au démarrage suivant comme « inconnu ». Les deux chemins produisent exactement le même schéma, vérifié par `migration:generate`, qui répond « No changes in database schema ». `down()` supprime les treize index (`DROP INDEX IF EXISTS`), testé avec `migration:revert`.

### Requêtes allégées

- **Listes de workouts** (`GET /workouts/completed` et `/planned`) : le nombre d'exercices est compté en SQL au lieu de charger et d'hydrater toutes les lignes d'exercice, leur jointure `eager` sur `Exercise` et le JSON des séries pour lire `.length`. La réponse est strictement identique. Le tri a un critère secondaire (`createdAt`, `id`) : l'ordre entre deux workouts de même date n'était pas déterministe.
- **Écritures** (création et mise à jour de workouts, de plans et de programmes) : les exercices ou les workouts référencés sont résolus par une seule requête `IN (...)` au lieu d'une par élément. Les messages d'erreur sont inchangés.
- **`GET /users/:id/profile`** : le statut de follow passe de 3 requêtes à 1, les quatre compteurs de 4 requêtes à 1, et les posts sont chargés en parallèle du reste quand le profil est public ou que c'est celui de l'appelant. De 7 requêtes à 3, sur deux étapes séquentielles (trois pour un profil privé) au lieu de quatre.
- **Stats et recommandations** : lectures indépendantes lancées en parallèle (`resolveBodyWeight` avec les entraînements dans `summary` et `workout/:id`, `getMutualFollowersRecommendations` avec `getFollowing`).

Les réponses des endpoints modifiés ont été comparées octet pour octet, ancien et nouveau build sur la même base : profils (propre, public, privé suivi, privé non suivi, abonné), statuts de follow, listes de workouts, `stats/summary`, feeds et `stats/workout/:id` sur 12 workouts sont identiques.

### Observabilité

- `DB_SLOW_QUERY_MS` (300 par défaut) journalise toute requête plus lente que le seuil, **sans ses paramètres** : une requête lente sur `users` ne doit pas laisser un email ou un hash dans les logs PM2. `pm2 logs grinta-api | grep "Slow query"` suffit pour repérer les endpoints à surveiller.
- `DB_LOGGING=true` imprime toutes les requêtes avec leurs paramètres. Développement uniquement.

## Volontairement non modifié

- **Sous-requêtes des feeds.** Le CLAUDE.md suggère un `LEFT JOIN` + `GROUP BY` ou des colonnes dénormalisées. Avec les index, `feed/following` coûte 1,5 ms de base et `feed/top` 4,2 ms, pour 24 000 posts et 291 000 likes. Une dénormalisation ajouterait une écriture et un risque d'incohérence pour un gain sous la milliseconde. **Seuil de réévaluation** : `feed/top` doit calculer le score de tous les posts publics du mois avant de trier, son coût croît donc avec le nombre de posts du mois, pas avec la limite. À surveiller via le log de requêtes lentes ; si le mois dépasse environ 100 000 posts, passer à un score précalculé. **Corrigé depuis, voir « Egress et taille des réponses » : ce seuil était beaucoup trop optimiste.** Avec 10 000 posts dans le mois (le même jeu de données mesuré en fin de mois), `feed/top` coûte 150 à 800 ms selon l'état du cache de Postgres.
- **`eager: true` sur `Programme.days`.** `GET /programmes` fait 1 requête et 7 ms pour 3 programmes de 7 jours. Rien à corriger. (La liste compte maintenant les jours en SQL, voir « Egress et taille des réponses ».)
- **Stats calculées en mémoire.** `summary`, `muscle-distribution` et `balance` chargent les workouts d'une semaine ou d'un mois (environ 15 à 30 pour le compte de test) et coûtent 6 à 13 ms de bout en bout. Les descendre en SQL n'est justifié que pour les agrégats sur tout l'historique, ce que font les nouveaux endpoints de la Phase 3.
- **`GET /users/search`** : 12 à 18 ms pour 2 000 utilisateurs. `similarity()` n'est pas indexable, donc le coût croît linéairement avec le nombre d'utilisateurs (de l'ordre de la demi-seconde vers 50 000). La correction (index GIN `gin_trgm_ops` sur `LOWER("uniqueName")` et prédicat réécrit avec l'opérateur `%`) change le seuil de similarité effectif et donc les résultats : à décider avant de le faire.
- **Pagination.** Non ajoutée à l'époque (ajoutée depuis pour l'historique, en option, voir « Egress et taille des réponses ») : elle change le contrat de l'API et le frontend n'envoie aucun paramètre. Pour mémoire, `GET /workouts/completed` pèse 56 ko pour 300 workouts et croît linéairement. Proposition opt-in compatible : `?limit=` et `?before=<completionDate>` avec le tri déterministe ajouté ici, l'absence de paramètre gardant le comportement actuel.
- **Insertions de TypeORM** : déjà groupées en un seul `INSERT` pour les exercices d'un workout, rien de plus à gagner.

## Nouveaux endpoints Stats (Phase 3)

Mesurés sur le même jeu de données, régime établi (médiane de 10 appels), compte de 300 workouts :

| Endpoint | p50 (ms) | Requêtes | Coût principal |
| --- | ---: | ---: | --- |
| `GET /stats/records` | 43 | 5, en parallèle | 4 agrégations sur tout l'historique (25, 14 et 13 ms de base pour les trois plus lourdes) |
| `GET /stats/comparisons?period=month` | 38 | 4 | hydratation ORM de 6 mois de workouts, la base ne prend que 3 ms |
| `GET /stats/progression` | 12 | 2 | 2 ms de base |
| `GET /stats/heatmap` | 7 | 1 | `Index Only Scan` sur `IDX_completed_workouts_user_date` |
| `GET /stats/workout-type-breakdown` | 6 | 2, en parallèle | 1 ms de base |

Aucun nouvel index : `EXPLAIN` montre `IDX_completed_workouts_user_date` puis `IDX_completed_workout_exercises_workout` pour `progression`, `records` et `heatmap`.

`records` est le seul endpoint qui relit tout l'historique de l'utilisateur à chaque appel, son temps croît donc linéairement avec le nombre de workouts : 43 ms à 300 workouts, de l'ordre de 400 ms à 3 000 (extrapolation linéaire, non mesurée). Le résultat ne change que lorsqu'un workout est ajouté, modifié ou supprimé : si cela devient visible, le mettre en cache par utilisateur ou le tenir à jour à l'écriture règle le problème.

## Stats par exercice et badges

Mesuré sur le même jeu de données, compte de 300 séances, séance de 6 exercices que le compte a déjà pratiqués souvent (environ 50 séances d'historique chacun), médiane de 20 appels :

| Endpoint | Requêtes | p50 (ms) | Note |
| --- | ---: | ---: | --- |
| `POST /workouts/completed` avant | 5 | 13,6 | |
| `POST /workouts/completed` après | 7 | 19,8 | + chargement de l'historique des exercices, + upsert groupé des stats ; + 1 insertion quand des badges sont gagnés |
| `GET /exercises/stats` | 1 | 11 | 57 ko pour une centaine d'exercices, dont les séries de la dernière séance |
| `GET /exercises/:id/stats` | 1 | 4 | |
| `GET /badges` | 1 | 3 | index `badges (userId, achievedAt)` |

En production, le surcoût de l'enregistrement d'une séance est surtout les 2 allers-retours supplémentaires vers Supabase. Les stats de tous les exercices de la séance sont écrites en une seule requête (`INSERT ... ON CONFLICT DO UPDATE`), pas une par exercice. Le rechargement de l'historique passe par `IDX_completed_workouts_user_date` puis `IDX_completed_workout_exercises_workout` : son coût croît avec le nombre de séances de l'utilisateur, quelques millisecondes à 300 séances.

## Défaut découvert, à décider

**L'ordre des exercices d'un workout n'est pas garanti.** Aucune colonne de position n'existe sur `completed_workout_exercises` ni `planned_workout_exercises` : l'ordre renvoyé est celui des lignes en base, que Postgres ne promet pas (il peut changer après une mise à jour, un vacuum ou un changement de plan). Pour un workout, la séquence des exercices a un sens pour l'utilisateur. Correction proposée : colonne `position` entière, renseignée à partir de l'index dans le tableau reçu, tri sur cette colonne, migration avec remplissage des lignes existantes.

## Egress et taille des réponses

Sur le plan gratuit de Supabase, la ressource qui s'épuise en premier est l'egress (5 Go par mois), qui compte aussi les résultats des requêtes envoyés par Postgres à l'API. Cette passe mesure donc, en plus du temps, les octets envoyés par Postgres pour chaque requête HTTP (`perf/db-egress-proxy.mjs`, un proxy TCP entre l'API et la base, lu par `perf/bench.mjs` via `DB_EGRESS_URL`) et la taille de chaque réponse sur le réseau quand le client accepte la compression, comme un téléphone.

Même jeu de données que plus haut, exercices dotés d'un contenu de taille réelle (environ 1 ko de description, consignes et URL de photos). Avant et après mesurés sur deux copies de la même base, chacune ayant subi exactement un passage précédent du banc.

| Endpoint | Postgres → API avant | après | Réponse sur le réseau avant | après |
| --- | ---: | ---: | ---: | ---: |
| `GET /stats/comparisons` | 1 370 ko | 443 ko | 1,3 ko | 0,5 ko |
| `GET /stats/muscle-frequency` | 789 ko | 250 ko | 4,9 ko | 0,6 ko |
| `GET /stats/summary` | 619 ko | 195 ko | 0,9 ko | 0,9 ko |
| `GET /stats/muscle-distribution`, `balance` | 432 ko | 132 ko | 1,7 ko | 0,4 ko |
| `GET /stats/workout/:id` | 325 ko | 123 ko | 1,8 ko | 0,6 ko |
| `GET /programmes` | 85 ko | 3 ko | 4,5 ko | 0,9 ko |
| `GET /exercises` | 45 ko | 0 (cache) | 58 ko | 4,9 ko |
| `GET /workouts/completed` (300 séances) | 43 ko | 43 ko | 76 ko | 12 ko |
| `GET /workouts/completed?limit=20` | | 2,4 ko | | 0,6 ko |
| `GET /workouts/completed/:id`, `planned/:id` | 11 ko | 5 ko | 9 ko | 0,8 ko |
| `POST /workouts/completed` (même historique) | 77 ko | 73 ko | | |

Temps : A/B entrelacé sur la même base, les deux versions côte à côte. `/stats/summary` passe de 41 à 20 ms (moins de lignes à transférer et à hydrater). La compression coûte 2 à 4 ms de CPU sur les réponses de plusieurs dizaines de ko (`/workouts/completed` : 13,5 → 17,4 ms en local), contre 60 ko de moins à transmettre, soit des dizaines de millisecondes sur un réseau mobile. Les petites réponses (moins de 1 ko) ne sont pas compressées.

Réponses comparées champ par champ entre les deux versions sur 31 endpoints : identiques, sauf les champs qui dépendent de l'heure (`rangeEnd`, `elapsedPct`), l'ordre des programmes à semaine égale (arbitraire avant, par id maintenant) et le détail des séances et des plans, qui n'embarque plus la description, les consignes et les photos de chaque exercice.

### Ce qui a été fait

- **Colonnes de contenu des exercices en `select: false`.** Régression introduite avec les descriptions, consignes et photos : les exercices sont joints (`eager`) dans chaque séance, plan et programme et dans les stats, et chaque jointure ramenait environ 1 ko de texte par exercice et par séance. Seul `GET /exercises/:id` les lit maintenant.
- **Stats : seules les colonnes lues par le calcul sont chargées** (`WORKOUT_STATS_SELECT`). TypeORM charge une séance et ses exercices en une jointure, une ligne par exercice : chaque colonne inutile (description de la séance, URL de photo de l'exercice, dates) voyageait une fois par exercice de chaque séance de la période.
- **`GET /programmes` compte les jours en SQL** au lieu de charger chaque jour et son plan pour en faire `length`.
- **Catalogue d'exercices en mémoire** (`GET /exercises`) : identique pour tous, il change seulement à la création, modification ou suppression d'un exercice, qui vident le cache. Durée de vie de 5 minutes, qui borne le retard d'un autre processus si PM2 tourne en mode cluster. Un `npm run seed` est visible au plus 5 minutes après, ou tout de suite après `pm2 restart`.
- **Compression des réponses** (brotli si le client l'accepte, sinon gzip, au-dessus de 1 ko). Les photos, déjà compressées, ne sont pas touchées. Si nginx compresse déjà, il ne recompresse pas une réponse qui a un `Content-Encoding`.
- **Pagination facultative de l'historique** : `GET /workouts/completed?limit=20&before=<id de la dernière séance reçue>`, par keyset sur (`completionDate`, `createdAt`, `id`), servi par l'index existant. Sans paramètre, la réponse est la même qu'avant.

### Deuxième passe, après arbitrage

- **Compteurs `likesCount` et `commentsCount` sur `posts`** (migration `AddPostCounters`, qui les remplit). Ils sont tenus à jour par `PostsService` dans la transaction du like, du commentaire, de sa suppression ou de son masquage automatique, et ne bougent que si une ligne a réellement été insérée, supprimée ou masquée. Un double appui, des likes simultanés ou des signalements simultanés ne les font donc pas dériver. Vérifié sur base réelle avec des requêtes concurrentes : compteurs égaux au comptage des lignes, et aucun écart sur les 24 000 posts après remplissage.
  - Tous les fils, le détail d'un post et le profil lisent les compteurs au lieu de compter.
  - `GET /posts/feed/top` passe de 180 à 30 ms de base. Il parcourt encore les posts du mois, mais sans rien compter.
  - Bug trouvé en route : `returning(['postId'])` de TypeORM ignore sans erreur une clé étrangère qui n'est pas une propriété de l'entité. Le `RETURNING` est maintenant écrit en SQL, et l'incrément utilise un `WHERE id = :postId` explicite, car `increment()` ignore un critère `undefined` et mettrait alors à jour tous les posts.
  - Contrôle de cohérence à lancer en cas de doute (doit renvoyer 0) :

    ```sql
    SELECT count(*) FROM posts p
     WHERE "likesCount" <> (SELECT count(*) FROM post_likes l WHERE l."postId" = p.id)
        OR "commentsCount" <> (SELECT count(*) FROM post_comments c WHERE c."postId" = p.id AND NOT c."isHidden");
    ```

    Le `UPDATE` de la migration `AddPostCounters` les recalcule.
- **Stats d'une nouvelle séance ajoutées sans relire l'historique.** Les stats stockées contiennent déjà toutes les meilleures valeurs qu'une nouvelle séance doit battre. `addSession` et `recordsAgainst` donnent exactement le même résultat que le recalcul complet : vérifié sur 5 000 historiques aléatoires (dates égales, séances vides, poids du corps, exercice en double dans une séance) et sur base réelle avec 48 séances, dont 8 simultanées sur le même exercice.
  - Les lignes de stats sont verrouillées (`FOR UPDATE`) pendant l'ajout, donc deux séances enregistrées en même temps s'ajoutent l'une après l'autre. Le recalcul complet n'avait pas cette garantie.
  - La modification et la suppression d'une séance gardent le recalcul complet.
  - `POST /workouts/completed` : 17 → 1 ms de base, 32 → 6 ko lus, et le coût ne croît plus avec l'historique.
- **Miniature d'avatar de 128 px** (`avatarThumbnailUrl`, environ 5 ko pour une vraie photo contre 50), renvoyée par les listes avec repli sur l'avatar complet si l'utilisateur n'en a pas encore.

### Reste

- **`GET /stats/records`** : 163 ko lus pour 12 ko de réponse compressée, car le nom et le muscle de l'exercice sont répétés sur chaque ligne « meilleure série par nombre de répétitions ».
- **`GET /posts/feed/top`** croît toujours avec le nombre de posts du mois (30 ms pour 10 000). Au-delà de quelques centaines de milliers, il faudra un classement précalculé.
- **Frontend** :
  - `explore/workout-detail.tsx` retélécharge le catalogue complet à chaque ouverture ;
  - l'historique peut passer à la pagination ;
  - les listes doivent afficher les miniatures.

## Migrations et `synchronize`

La branche `backend` ne contenait ni `data-source.ts` ni scripts de migration, contrairement à ce que décrit le CLAUDE.md. Ils sont ajoutés :

| Commande | Rôle |
| --- | --- |
| `npm run migration:show` | liste les migrations appliquées ou en attente |
| `npm run migration:run` | applique les migrations en attente (ts-node, pour le développement) |
| `npm run migration:revert` | annule la dernière migration |
| `npm run migration:generate -- src/migrations/Nom` | génère une migration à partir de l'écart entre entités et base |
| `npm run migration:run:prod` | applique les migrations depuis `dist/` (sur la VM, après `npm run build`) |

Variables d'environnement ajoutées, toutes optionnelles : `DB_SYNCHRONIZE` (défaut `true`, comportement historique), `DB_SSL` (`false` pour un Postgres local sans TLS), `DB_SLOW_QUERY_MS`, `DB_LOGGING`.

**Ce qui se passe au prochain déploiement.** `deploy.sh` n'a pas été modifié. Comme `synchronize: true` reste actif, TypeORM crée les treize index au démarrage à partir des entités : des `CREATE INDEX` classiques qui verrouillent brièvement l'écriture sur chaque table, négligeable à la taille de la beta. Aucune action manuelle n'est requise, et lancer ensuite `npm run migration:run:prod` est sans effet (`IF NOT EXISTS`).

**`synchronize` est désactivé (octobre 2026).** Il restait un risque pour la prod : au démarrage, n'importe quel changement d'entité modifiait le schéma, y compris de façon destructive (colonne supprimée ou renommée). Ce qui est en place :

1. **Migration de référence `InitialSchema`.** C'est le schéma de la branche `backend`, généré par `migration:generate` sur une base vide à partir de ses entités, avec chaque instruction rendue conditionnelle (`IF NOT EXISTS`, blocs `DO` pour les types et les clés étrangères). Elle ne change rien sur la prod, et crée le schéma de départ sur une base vide. Son `down()` supprime toutes les tables : il refuse de s'exécuter sans `ALLOW_BASELINE_REVERT=true`.
2. **`DB_SYNCHRONIZE` vaut `false` par défaut.** `true` reste possible sur une base jetable.
3. **`deploy.sh` lance `npm run migration:run:prod` après le build et avant `pm2 restart`.** Avec `set -e`, une migration en échec arrête le déploiement et l'ancienne version continue de tourner.
4. **L'API applique aussi les migrations en attente au démarrage** (`migrationsRun`, désactivable par `DB_MIGRATIONS_RUN=false`). C'est sans effet quand `deploy.sh` les a déjà appliquées. C'est indispensable au premier déploiement : `deploy.sh` se met lui-même à jour par `git pull`, mais bash continue d'exécuter la version qu'il a commencé à lire, donc ce premier déploiement ne lance pas les migrations (vérifié). Ne pas passer PM2 en mode cluster sans retirer ce réglage : TypeORM ne verrouille pas la table des migrations.

Vérifié sur deux bases :

- **Base vierge** : l'API crée tout le schéma par les migrations au démarrage, `migration:generate` ne trouve aucun écart, et le scénario des partenaires passe (26/26).
- **Premier déploiement simulé** : base créée et remplie par le code actuellement en prod (`origin/backend`, TLS imposé), puis nouvelle API démarrée sans migration manuelle. Résultat :
  - les 10 migrations sont appliquées, sans contrainte ni index en double, et aucun écart de schéma ne reste ;
  - données intactes : un ancien compte se connecte, les compteurs sont remplis, les anciennes séances pointent vers les exercices renommés, une nouvelle séance reconstruit les stats sur tout l'historique.

Pour les index d'une grosse table à l'avenir, préférer `CREATE INDEX CONCURRENTLY`, qui ne bloque pas les écritures mais doit s'exécuter hors transaction (`transaction = false` sur la migration).

## Reproduire les mesures

```bash
# base de test jetable avec pg_stat_statements (shared_preload_libraries) et pg_trgm
# 1. lancer l'API une fois sur la base vide pour que le schéma soit créé, puis s'inscrire
curl -X POST localhost:3100/users/register -H 'Content-Type: application/json' \
  -d '{"displayName":"Perf Main","uniqueName":"perfmain","email":"perf_main@example.com","password":"Password123!"}'

# 2. charger le jeu de données (environ une minute)
psql -v main_email=perf_main@example.com -f perf/seed-perf.sql <base>

# 3. mesurer
node perf/bench.mjs --label after --out perf/results.json
```

`perf/bench.mjs` lit `API_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `RUNS` et `DB_EGRESS_URL`. Pour mesurer les octets envoyés par Postgres, lancer `perf/db-egress-proxy.mjs` (il écoute sur 5434 et relaie vers `PGHOST`/`PGPORT`), démarrer l'API avec `DB_PORT=5434`, puis le banc avec `DB_EGRESS_URL=http://localhost:5435`. Ne jamais lancer ces scripts contre une base réelle : ils écrivent des milliers de lignes.
