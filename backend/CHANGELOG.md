# Changelog backend

## Non publié : description, consignes et photos des exercices

### Ce qui change

- **Les 430 entrées de `base-exercises.json` ont une description et des consignes.** La description dit en une ou deux phrases ce qu'est l'exercice et ce qu'il travaille. Les consignes donnent les étapes, dans l'ordre. Quand le geste dépend de l'équipement (barre, haltères, poulie, machine...), une étape de mise en place propre à la variante est ajoutée. Les textes sont en anglais, comme les noms des exercices, que le frontend n'a jamais traduits.
- **274 entrées ont deux photos** : position de départ puis position d'arrivée (`image_urls`), la première servant aussi de miniature (`image_url`, champ que le frontend lit déjà). Elles viennent de [free-exercise-db](https://github.com/yuhonas/free-exercise-db), sous Unlicense (domaine public, licence vérifiée dans le dépôt source). Les URL sont épinglées sur un commit de la source, et les 460 ont été vérifiées : toutes répondent en `image/jpeg`.
- **Une photo n'est associée que si elle montre le même mouvement avec un équipement compatible.** Chaque appariement a été relu contre les consignes de la source, et 20 ont été écartés car ils montraient une autre posture, une autre prise ou un autre exercice de même nom. Exemples : le « Wind Sprints » de la source est un exercice d'abdos suspendu, et sa « Rear Pull-Up » tire derrière la nuque. Une mauvaise photo est pire que pas de photo.
- **API** : nouvelles colonnes `description`, `instructions` et `image_urls` sur `exercises` (migration `AddExerciseContent`, idempotente et réversible).
  - `GET /exercises/:id` renvoie tout.
  - `GET /exercises` reste léger (97 ko au lieu de 260 ko pour le catalogue, que l'app télécharge et met en cache en entier) : les champs lourds sont réservés au détail. L'écran de l'exercice doit donc appeler `GET /exercises/:id`.
- **Bug corrigé : les muscles secondaires n'étaient jamais enregistrés.** Le JSON utilisait la clé `secondary_muscle` alors que l'entité attend `secondary_muscles`, et le seed copie les clés telles quelles. Après le seed, 234 exercices ont leurs muscles secondaires, contre 0 avant, ce qui corrige aussi les statistiques par muscle (`muscle-distribution`, `balance`, `muscle-frequency`) qui les ignoraient.
- Test d'intégrité du JSON (enums, présence des textes, paires de photos épinglées) et README de provenance dans `src/exercise/data/`.

### Pourquoi pas de GIF

Aucune source de GIF d'exercices sous licence libre n'a été trouvée. Les GIF des bases commerciales (ExerciseDB, etc.) sont soumis à copyright et ne peuvent pas être redistribués sans licence. Les deux photos départ/arrivée en tiennent lieu : affichées en alternance (toutes les 0,6 à 0,8 s, par exemple), elles animent le mouvement dans l'app. Si de vrais GIF sont nécessaires, deux options : les générer à partir de ces paires et les héberger (Supabase Storage), ou souscrire une licence chez un fournisseur.

### Déploiement

1. Schéma : créé au démarrage tant que `synchronize: true` est actif, sinon `npm run migration:run:prod`.
2. Contenu : relancer `npm run seed` sur la VM. Le seed met à jour les exercices existants par leur nom, sans toucher aux exercices créés par les utilisateurs. Il est idempotent.

### Problème découvert, à décider : 136 variantes d'exercices n'arrivent jamais en base

Le JSON contient **430 entrées pour 294 noms** : « Squat » existe en 7 équipements, « Bicep Curl » en 6, « Deadlift » en 4. Or `Exercise.name` est unique en base et le seed met à jour par nom : chaque variante écrase la précédente, et seule la dernière du fichier survit (le seed affiche « 294 new, 136 updated » sur une base vide). Conséquences concrètes, vérifiées sur une base de test :

- « Deadlift » en base est la variante **Smith machine**, sans photo. Le soulevé de terre à la barre n'existe pas dans le catalogue.
- « Squat » en base est la variante **poids du corps**. Le squat à la barre n'existe pas.
- Sur les 274 entrées illustrées, seules 178 arrivent en base.

Correction proposée, à valider car elle change des noms visibles dans l'app : suffixer l'équipement dans le nom des variantes, sur le modèle de Hevy ou Strong (« Deadlift (Barbell) », « Deadlift (Smith Machine) »). Il faut l'accompagner d'une migration qui renomme d'abord la ligne existante d'après son `equipment_type` (elle porte l'équipement de la variante qui a survécu), pour que les séances qui la référencent restent attachées au bon exercice. Le seed crée ensuite les variantes manquantes.

## Non publié : stats par exercice et badges de record personnel

### Ce qui change

- **Stats par exercice, tenues à jour automatiquement.** Chaque séance terminée met à jour, pour chacun de ses exercices : dernière performance (série la plus lourde de la dernière séance, et toutes ses séries), records (charge maximale et répétitions faites à cette charge, 1RM estimé, meilleur volume sur une séance, maximum de répétitions sans charge) et totaux (séances, séries, répétitions, volume).
  - `GET /exercises/stats` : tous les exercices pratiqués, le plus récent d'abord.
  - `GET /exercises/:id/stats` : un exercice. 404 tant qu'aucune séance terminée ne le contient.
- **Badges de record personnel.** Une séance qui bat, sur un exercice, la meilleure valeur de toutes les autres séances gagne un badge par record battu, sur quatre types : `heaviest_weight`, `best_estimated_1rm`, `best_session_volume`, `most_reps` (séries sans charge).
  - `GET /badges` liste les badges de l'utilisateur, filtrables par `exerciseId`, `type` et `limit`.
  - `POST /workouts/completed` et `PATCH /workouts/completed/:id` renvoient en plus `badges`, les records établis par la séance, pour que l'app affiche « Nouveau record ! » sans requête supplémentaire. Le frontend actuel ignore la réponse, l'ajout ne le casse pas.
- **Enregistrement d'une séance transactionnel.** La séance, les stats et les badges sont écrits dans une seule transaction : si une étape échoue, rien n'est enregistré (vérifié en rendant l'écriture des stats impossible : 500 générique, aucune séance créée).
- **`PATCH /exercises/:id/stats` supprimé.** Les stats sont maintenant dérivées des séances, et ce sont elles qui servent de référence aux badges : une valeur saisie à la main fausserait les records et permettrait de s'attribuer des badges. Le frontend ne l'appelait pas, et jusqu'à la Phase 1 la route répondait toujours 400.

### Règles des badges, à valider

- **Pas de badge sur la première séance d'un exercice**, ni sur la première série chargée après des séances au poids du corps : il faut une valeur à battre. Sinon chaque nouvel exercice donnerait des badges.
- **Une égalité ne compte pas** : il faut strictement dépasser l'ancien record.
- **La comparaison porte sur toutes les autres séances, quelle que soit leur date.** Une séance saisie après coup qui bat tout ce qui existe obtient le badge ; elle devient le record, mais pas la « dernière performance », qui suit la date de la séance.
- **Un badge appartient à sa séance.** Modifier la séance réévalue ses badges (corriger un 1000 kg en 100 kg retire le record), la supprimer les supprime. Les badges des *autres* séances ne changent pas : un badge dit que la séance battait toutes les autres au moment où elle a été enregistrée.
- **Plusieurs badges par séance sont possibles** : une séance plus lourde donne souvent à la fois `heaviest_weight` et `best_estimated_1rm`. C'est l'app qui choisit comment les regrouper.

### Pourquoi les stats sont recalculées plutôt qu'incrémentées

À chaque création, modification ou suppression, les stats des exercices concernés sont recalculées à partir de tout leur historique. Ajouter la séance aux totaux existants coûterait une requête de moins, mais une séance corrigée ou supprimée laisserait des stats fausses pour toujours. Coût mesuré, voir PERFORMANCE.md : 2 requêtes de plus par enregistrement de séance.

### Déploiement

1. Rien à faire pour le schéma tant que `synchronize: true` est actif : les nouvelles colonnes de `user_exercise_stats` et la table `badges` sont créées au démarrage. Sur une base sans `synchronize`, lancer `npm run migration:run:prod` (migration `AddExerciseStatsAndBadges`, idempotente et réversible ; `down()` supprime les badges, les stats sont reconstructibles).
2. **Une fois, après le déploiement** : `npm run backfill:exercise-stats:prod` sur la VM, pour calculer les stats des séances passées. Sans ça, un utilisateur n'a de stats que pour les exercices des séances terminées après la mise en production. Le script n'attribue aucun badge rétroactif : les badges commencent avec les séances enregistrées après déploiement. Il peut être relancé sans risque (mesuré : 41 s pour 2 000 utilisateurs et 69 000 séances, résultat identique à celui tenu par l'API).

### Limite connue

Deux séances du même utilisateur enregistrées au même instant (deux appareils) peuvent laisser des stats qui ignorent l'une d'elles, chaque transaction ne voyant pas la séance de l'autre. La séance suivante, ou le script de rattrapage, corrige. Les badges d'une séance, eux, dépendent seulement de ce qui était enregistré avant elle.

## Non publié : Phase 3, nouveaux endpoints de statistiques

Les six endpoints proposés par le CLAUDE.md sont ajoutés au module `stats`. Tous sont authentifiés, typés (DTO de requête validés, DTO de réponse documentés dans Swagger) et ne renvoient que les données de l'appelant. Le SQL réduit l'historique aux quelques lignes utiles (un utilisateur, un exercice, une fenêtre, ou un agrégat par exercice, type ou jour) et `StatsCalculatorService` porte tout le calcul, couvert par des tests unitaires.

| Endpoint | Rôle |
| --- | --- |
| `GET /stats/progression?exerciseId=&metric=volume\|1rm&period=1m\|3m\|6m\|1y\|all` | Série temporelle d'un exercice, un point par jour d'entraînement, avec premier, dernier et meilleur point et une tendance. `metric` vaut `volume` par défaut et `period` vaut `3m` |
| `GET /stats/records` | Pour chaque exercice : meilleur 1RM estimé, poids le plus lourd, meilleur volume sur un workout. Globalement : workout le plus long, workout au plus gros volume, plus longue série de jours consécutifs |
| `GET /stats/adherence?completedWorkoutId=&plannedWorkoutId=` | Compare un workout réalisé à son plan : statut par exercice (`completed`, `exceeded`, `partial`, `skipped`), exercices hors plan, score de 0 à 100 et note (`full`, `high`, `partial`, `low`) |
| `GET /stats/comparisons?period=week\|month&date=` | Période en cours contre la moyenne personnelle des 8 semaines ou 6 mois précédents |
| `GET /stats/workout-type-breakdown?period=week\|month&date=` | Séries, volume et nombre d'exercices par `exercise_type` et par `equipment_type`, avec la part de chacun |
| `GET /stats/heatmap?year=` | Calendrier annuel : jours avec au moins un workout et niveau d'intensité de 1 à 4 |

Vérification : chaque endpoint a été comparé à un calcul indépendant sur la base de test (69 000 workouts). Progression et records recalculés depuis les lignes brutes pour tous les exercices, heatmap et breakdown contre du SQL direct et contre `/stats/summary`, baseline de `comparisons` contre la moyenne de huit appels `/stats/summary`. Temps en régime établi sur un compte de 300 workouts : `records` 43 ms, `comparisons` 38 ms, `progression` 12 ms, `heatmap` 7 ms, `workout-type-breakdown` 6 ms. Les plans d'exécution passent tous par les index de la Phase 2, aucune migration n'est nécessaire.

### Choix de conception à connaître

- **`comparisons` proratise la moyenne.** Comparer le mardi les séances de la semaine à la moyenne d'une semaine entière afficherait toujours « très en dessous ». La moyenne de référence est donc multipliée par la part de la période déjà écoulée (`elapsedPct`) pour donner `expectedByNow`, et `changePct` est calculé contre cette valeur. `baselineAverage` reste exposé pour qui préfère la comparaison brute. Une période terminée (`date` dans le passé) utilise la moyenne entière. Contrepartie : l'entraînement est irrégulier, la semaine d'un mercredi après une séance de jambes le lundi n'est qu'une approximation.
- **Une période n'entre dans la moyenne que si l'utilisateur avait déjà commencé avant son début**, ce qui écarte la première période partielle et le temps d'avant l'inscription. Sans aucune période éligible, `baseline` vaut `null`, tous les verdicts `unknown` et le message demande plus d'historique. Les périodes sans séance après le premier workout comptent bien pour zéro.
- **Seuil `on_track` de 5 %** (`constants/comparison.ts`). Le seuil de tendance de `progression` est aussi de 5 %, calculé sur la moyenne des trois premiers et des trois derniers points pour qu'une mauvaise séance ne retourne pas la tendance.
- **Niveaux de la heatmap relatifs à la journée la plus longue de l'année** (4 pour la plus longue, 1 au minimum pour tout jour actif). Simple et déterministe, mais une journée exceptionnelle écrase les autres vers le niveau 1. Des quartiles sont une alternative si le rendu le demande.
- **`progression` ne compte que les séries avec un poids et des répétitions positifs.** Un exercice au poids du corps ne renvoie donc aucun point. Une métrique `reps` serait nécessaire pour les suivre, non demandée ici.
- **`adherence` : le workout réalisé doit appartenir à l'appelant, le plan peut être n'importe quel plan lisible**, comme `GET /workouts/planned/:id` qui reste ouvert à tout utilisateur authentifié. Un utilisateur peut donc suivre le programme d'un autre. Les exercices sortent dans l'ordre stocké du plan, non garanti (voir PERFORMANCE.md).
- **Les jours sont en UTC** (calendrier de `progression` et `heatmap`, groupement des records). Identique aux autres endpoints tant que le serveur tourne en UTC.

## Non publié : Phase 2, optimisation des temps de réponse

Détail des mesures, des plans d'exécution et des décisions dans [PERFORMANCE.md](PERFORMANCE.md). Réponses des endpoints modifiés comparées à celles de la Phase 1 sur la même base : identiques.

- **Treize index sur les clés étrangères** (migration `AddForeignKeyIndexes`, réversible, et déclarations `@Index` sur les entités). `GET /posts/feed/top` passe de 4,4 s à 13 ms, `GET /users/:id/profile` de 1,1 s à 8 ms, `GET /posts/mine` de 688 ms à 7 ms (mesuré sur 69 000 workouts, 291 000 likes, hors latence réseau).
- **Moins de requêtes** : profil de 7 à 3, création de workout de 10 à 5, création de programme de 12 à 5. Les exercices et workouts référencés sont résolus en une requête au lieu d'une par élément, les listes de workouts comptent leurs exercices en SQL.
- **Tri déterministe** des listes de workouts (critère secondaire `createdAt` puis `id`).
- **Infrastructure de migration** absente de cette branche : `data-source.ts`, configuration de base partagée entre l'application et la CLI, scripts `migration:*`.
- **Journal des requêtes lentes** (`DB_SLOW_QUERY_MS`, 300 ms par défaut) sans paramètres, pour ne jamais écrire un email ou un hash dans les logs. `DB_LOGGING=true` imprime toutes les requêtes, développement uniquement.
- Nouvelles variables d'environnement, toutes optionnelles : `DB_SYNCHRONIZE` (défaut `true`), `DB_SSL`, `DB_SLOW_QUERY_MS`, `DB_LOGGING`, `TRUST_PROXY_HOPS`.

**Déploiement** : `deploy.sh` n'est pas modifié. Tant que `synchronize: true` est actif, les index sont créés au démarrage suivant, sans action manuelle (brève prise de verrou en écriture par table, négligeable à la taille de la beta). Passer à `synchronize: false` demande une migration de référence, voir PERFORMANCE.md.

**À décider** : l'ordre des exercices d'un workout n'est pas garanti en base (pas de colonne de position), voir PERFORMANCE.md.

## Non publié : Phase 1, audit sécurité et qualité

Chaque correctif a été vérifié contre une vraie base Postgres. Le même scénario a été joué sur le code d'origine (`origin/backend`, 17 contrôles sur 40 passaient) et sur le code corrigé (40 sur 40).

### Failles corrigées, par gravité

| Problème | Impact avant correctif | Correctif |
| --- | --- | --- |
| `PATCH /users/:id` et `DELETE /users/:id` sans contrôle de propriétaire | Tout utilisateur authentifié pouvait changer le mot de passe d'un autre (prise de compte) ou supprimer son compte | 403 si l'id n'est pas celui du token. Le frontend n'appelle ces routes qu'avec l'id de l'utilisateur connecté |
| Le hash bcrypt était sérialisé dans les réponses (`POST /users/register`, `GET /users/:id`, `PATCH /users/:id`) | Fuite du hash de n'importe quel utilisateur | `@Exclude` sur `User.password` et `ClassSerializerInterceptor` global : le hash est retiré même quand un `User` est imbriqué dans une autre entité |
| `GET /users/:id` renvoyait email, date de naissance, taille et poids de n'importe quel utilisateur | Fuite de données personnelles | Le propriétaire reçoit son compte complet, les autres uniquement `id`, `displayName`, `uniqueName`, `isPublic` |
| `POST /posts` ne vérifiait pas que le workout appartient à l'appelant | On pouvait publier le workout d'un autre utilisateur sous son propre nom | 404 si le workout n'est pas à l'appelant, 400 s'il est déjà publié (avant : 500 sur la contrainte d'unicité) |
| Posts d'un compte privé lisibles par id (détail, likes, commentaires, like, commentaire) | Contournement de `isPublic` | 404 si l'auteur est privé et que l'appelant ne le suit pas. Même statut pour « inexistant » et « invisible », pour qu'on ne puisse pas sonder un id. Les écrans du frontend ne montrent déjà que des posts visibles, pas de régression attendue |
| `AllExceptionsFilter` renvoyait `exception.message` pour toute erreur non HTTP | Fuite de messages SQL, noms de contraintes, structure de la base | 500 générique côté client, détail et stack dans le log serveur. Un uuid mal formé donne un 400 `Identifiant invalide` au lieu d'un 500 |
| JWT valable 90 jours | Un token volé donnait 3 mois d'accès | 7 jours (`JWT_EXPIRES_IN` dans `auth/auth.constants.ts`). Algorithme figé à HS256 à la signature et à la vérification |
| `/auth/login` limité à 60 requêtes par minute | Brute force possible | 5 tentatives par 15 minutes et par adresse client |
| Email et pseudo enregistrés tels quels alors que le login met l'identifiant en minuscules | Un utilisateur inscrit avec une majuscule ne pouvait plus se connecter (401), et `Foo@x.com` / `foo@x.com` créaient deux comptes | Email et `uniqueName` passés en minuscules et `trim` à l'inscription et à la mise à jour (voir la normalisation des comptes existants plus bas) |
| `limit` non borné sur les feeds | `limit=-5` donnait un 500, `limit=100000` renvoyait toute la table | Valeur par défaut 20, plafond 100 (`common/utils/limit.ts`) |
| `PATCH /exercises/:id/stats` renvoyait toujours 400 | Endpoint inutilisable : le DTO n'avait aucun validateur, donc `whitelist` retirait tous les champs | Validateurs `@IsNumber` et `@Min(0)` ajoutés |

### Autres changements

- `AuthUser` et `AuthenticatedRequest` (`src/auth/auth-user.interface.ts`) remplacent `user: any` dans Stats et `user: User` dans Workouts, Programmes et Exercise (le type annonçait une entité `User` alors que `req.user` ne contient que `{ id, email }`). Tous les `@Req() req` sont typés.
- `Object.assign(entity, dto)` est remplacé par une fusion des seuls champs scalaires dans les mises à jour de programme, de workout et d'utilisateur. Dans `updateProgramme`, `days` n'est plus posé brut sur l'entité avant d'être reconstruit.
- Compteurs `COUNT(*)` castés en `::int` dans les feeds, le profil et les recommandations (ils étaient renvoyés en chaîne). Les feeds et le profil ne comptent plus les commentaires masqués, comme le fait déjà le détail d'un post.
- `main.ts` : le serveur écoute sur `PORT` (il ignorait la variable et écoutait toujours 3000), `trust proxy` configuré, `x-powered-by` retiré.
- `JWT_SECRET` : le démarrage échoue s'il est absent et un avertissement est loggué s'il fait moins de 32 caractères (la valeur n'est jamais loggée).
- Bornes de longueur sur les DTO d'inscription, de mise à jour et de login : `displayName` 50, `uniqueName` 30, `email` 254, `password` 72 (limite de bcrypt).
- La route `PATCH /users/me/toggle-visibility` est déclarée avant les routes `:id`.

### À faire sur la VM au déploiement

1. **Vérifier que nginx transmet l'adresse du client.** Le limiteur de débit s'appuie sur `req.ip`. Derrière nginx, sans `trust proxy` et sans en-tête `X-Forwarded-For`, tous les utilisateurs partageraient un seul compteur : 5 échecs de login n'importe où verrouilleraient tout le monde. Le code fait confiance à un seul relais (`TRUST_PROXY_HOPS=1` par défaut). La config nginx doit contenir `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`. Je n'ai pas accès à la config de la VM, c'est le point à contrôler en premier.
2. **Les tokens déjà émis restent valides** jusqu'à leur propre expiration (jusqu'à 90 jours). Pour tous les invalider immédiatement, changer `JWT_SECRET` (`openssl rand -hex 64`), ce qui déconnecte tous les utilisateurs.
3. **Normaliser les comptes existants** si la beta en contient avec des majuscules. Vérifier d'abord l'absence de collision, puis appliquer :

```sql
SELECT lower(email), count(*) FROM users GROUP BY 1 HAVING count(*) > 1;
SELECT lower("uniqueName"), count(*) FROM users GROUP BY 1 HAVING count(*) > 1;

UPDATE users
SET email = lower(email), "uniqueName" = lower("uniqueName")
WHERE email <> lower(email) OR "uniqueName" <> lower("uniqueName");
```

### Vérifié et déjà en place

- **Timing attack sur `validateUser`** : déjà mitigé. Le hash factice existant coûtait autant qu'un vrai (environ 65 ms des deux côtés, mesuré). Il est maintenant généré au démarrage avec le même facteur de coût que les mots de passe réels, au lieu d'être une chaîne codée en dur qui cesserait d'être équivalente si le facteur changeait.
- **`.env`** est dans `.gitignore` et n'est pas suivi par git.
- **Ordre des routes** : vérifié dans tous les controllers, `mine`, `search` et les segments statiques précèdent les routes paramétrées.
- **Routes publiques `getPlannedWorkoutById` et `getCompletedWorkoutById`** : laissées ouvertes, décision explicite du projet. Les routes de modification et de suppression restent réservées au propriétaire.
- Les lectures de Stats et de Workouts filtraient déjà sur `user.id` : le bug `user.userId` décrit dans le CLAUDE.md n'existe plus dans cette branche.

### Écarts entre le CLAUDE.md et la branche `backend`

- `main.ts` déclarait deux `ValidationPipe`. Le premier avait `forbidNonWhitelisted: true`, donc les propriétés inconnues sont **rejetées avec un 400** et non retirées silencieusement comme l'indique le CLAUDE.md. Les deux pipes sont fusionnés en un seul avec le même comportement.
- `data-source.ts` et les scripts `migration:*` n'existent pas dans cette branche. Ils sont ajoutés en Phase 2.

### Non traité : décisions à prendre

1. **Vérification d'email et réinitialisation du mot de passe.** Volontairement pas implémentées. Bloquer le login tant que `emailVerified` est faux verrouillerait tous les comptes beta existants, il faut un fournisseur d'envoi (Resend, domaine d'envoi à vérifier, `RESEND_API_KEY` sur la VM) et le frontend n'a aucun écran de vérification ni de réinitialisation. Proposition : colonnes `emailVerified` (`true` pour les lignes existantes via la migration, `false` pour les nouvelles), `emailVerificationToken` stocké haché, `emailVerificationExpiresAt`, `POST /auth/verify-email`, `POST /auth/resend-verification`, puis `POST /auth/forgot-password` et `POST /auth/reset-password` avec la même mécanique et une réponse identique que le compte existe ou non. À décider avec le frontend avant de coder.
2. **Catalogue d'exercices ouvert en écriture.** `POST`, `PATCH` et `DELETE /exercises` acceptent tout utilisateur authentifié, et le catalogue est partagé : n'importe qui peut renommer ou modifier un exercice que tout le monde utilise. Le frontend utilise `POST` et `DELETE` (exercices créés par les utilisateurs), donc je ne peux pas simplement verrouiller. Option recommandée : colonne nullable `createdById` sur `Exercise`, renseignée à la création, puis `PATCH` et `DELETE` réservés au créateur (les exercices du seed, `createdById` nul, deviennent non modifiables via l'API). Contrepartie : les exercices déjà créés en beta n'ont pas de créateur et ne seraient plus supprimables depuis l'app. Alternative : un rôle admin pour `PATCH` seulement (le frontend ne l'appelle pas), sans toucher à `DELETE`. Nécessite une migration, à trancher.
3. **Listes de followers et de following** (`GET /connections/:id/followers`, `/following`) visibles par tout utilisateur authentifié, y compris pour un compte privé.
4. **Swagger accessible en production sur `/api`.** À désactiver ou protéger si la beta n'en a plus besoin.
5. **`ssl: { rejectUnauthorized: false }`** sur la connexion Postgres : le certificat du serveur n'est pas vérifié. Utiliser le certificat CA de Supabase.
6. **`POST /users/register`** n'a pas de limite de débit spécifique, et `Email already in use` permet de savoir si une adresse est inscrite.
7. **Pas de révocation de token.** Un token volé reste utilisable jusqu'à expiration. Cible : access token de 15 minutes et refresh token.
8. **`DELETE /users/:id` échoue pour un compte qui possède des données** (vérifié : 500 pour un utilisateur avec un workout), car les clés étrangères de `completed_workouts`, `planned_workouts`, `posts`, etc. n'ont pas de `ON DELETE CASCADE`. Avant la correction cette route était de toute façon ouverte à tous. Une vraie suppression de compte demande une décision (cascade ou anonymisation).
9. **`synchronize: true`** reste actif : traité en Phase 2 avec les migrations.
