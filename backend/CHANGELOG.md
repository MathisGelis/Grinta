# Changelog backend

## Non publié : corrections de l'audit front

- **B-04** :
  - `GET /health` vérifie la base (`SELECT 1`), sans authentification ni limite de débit, et répond 503 si la base ne répond pas. `GET /` répond `{ status: "ok" }`. Le contrôleur racine est enregistré.
  - La configuration HTTP (proxy, compression, validation, format des erreurs) est extraite dans `configureApp` (`src/app.setup.ts`), commune à `main.ts` et aux tests e2e.
  - Les tests e2e (`npm run test:e2e`) démarrent toute l'API sur une base jetable. Ils refusent de tourner si `DB_NAME` ne contient pas « e2e » ou « test », ce qui empêche un `.env` de prod d'être utilisé par erreur.
- **B-12** :
  - « Baesyan Curl » est renommé « Bayesian Curl » (Cable et Dumbbell) dans `base-exercises.json`.
  - Les bases existantes sont corrigées sur place, ids conservés, par la migration réversible `FixExerciseNames` et par le seed (`NAME_FIXES_2026_10`, liste figée appliquée avant les upserts).
  - `GET /exercises` renvoie `Cache-Control: private, no-cache`. Express y ajoutait déjà un ETag et répondait 304 à un `If-None-Match` à jour, mais rien ne disait à l'app de garder la liste et de la revalider.
  - Tests e2e : migration, retour arrière, seed sur une base à l'ancien nom, 304.
- **B-06** : `gender` (`male`, `female`, `other`) et `goal` (`gain_weight`, `lose_weight`, `get_fitter`, `flexibility`, `learn_basics`) sur les utilisateurs. Ce sont des enums Postgres nullables, ajoutés par la migration réversible `AddUserGenderAndGoal`, et modifiables par `PATCH /users/:id`. Comme les mensurations, ils ne sont visibles que de leur propriétaire : `GET /users/:id` sur un autre compte ne renvoie que l'identité publique (vérifié en e2e).
- **B-03** : `GET /workouts/planned` renvoie `totalSets` (séries prévues, calculées en SQL) et `estimatedDurationMinutes`. Ce dernier est saisi en création et en édition (entier de 1 à 600, `null` l'efface). Il est stocké dans la colonne `planned_workouts.estimatedDurationMinutes`, ajoutée par la migration réversible `AddPlannedWorkoutDuration`. Tests e2e.
- **B-07** : les commentaires sont limités à 500 caractères (`COMMENT_MAX_LENGTH`, création et édition), avec le code `FIELD_TOO_LONG`. La limite existait déjà ; elle est maintenant partagée, documentée dans Swagger et testée en e2e.
- **B-02** : les erreurs de validation ont un format structuré `{ statusCode: 400, code: 'VALIDATION_ERROR', message, errors: [{ field, code, message }] }`, avec 22 codes stables documentés dans le README. Les messages sont en français et reprennent la limite du décorateur (« 500 caractères »). Un message déjà écrit dans un DTO, comme celui du pseudo, est conservé. Le chemin des champs imbriqués est donné en entier. Un seul `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`), déjà le cas sur cette branche. Les autres erreurs ne changent pas de format.
- **B-01** : les charges acceptent 2 décimales (`@IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(1000)`). Les 4 `SetPairDto` dupliqués sont remplacés par une classe partagée (`src/workouts/dto/set-pair.dto.ts`). Volume, 1RM, records et stats étaient déjà calculés en flottants et arrondis à 2 décimales seulement en sortie. Tests unitaires et e2e : 62,5 kg relu à l'identique, volume 762,5, 1RM 77,08, record battu de 2,5 kg.

## Non publié : suivre un programme et suggestions de séance

- **`POST /programmes/:id/start`** commence un de mes programmes (migration réversible `AddActiveProgrammes`, table `active_programmes`). Un seul programme est suivi à la fois : en démarrer un autre le remplace. `startDate` (`AAAA-MM-JJ`) est le jour 1, aujourd'hui en UTC par défaut. Le suivi disparaît avec le programme ou le compte.
- **`GET /programmes/active/today?date=`** renvoie la séance planifiée du jour.
  - Le jour se compte en jours calendaires depuis le départ, entraînement ou non, et le programme recommence après son dernier jour (`cycle`).
  - Un jour absent du programme ou sans séance est un jour de repos.
  - `status` vaut `workout`, `rest` ou `not_started`.
  - Les dates sont des dates de calendrier sans heure : l'app envoie la date locale de l'utilisateur, faute de quoi la date UTC s'applique.
- **`GET /workouts/planned/suggestion?period=week|month&date=`** classe mes séances planifiées selon les muscles qu'elles travaillent et que la période a délaissés.
  - Séries effectives par muscle comme `/stats/muscle-distribution`.
  - Chaque muscle d'une séance pèse ses séries prévues × 1 / (1 + séries déjà faites).
  - `score` entre 0 et 1, deux alternatives, et le détail par muscle.
  - Une séance planifiée sans séries compte une série par exercice.
- Vérifié sur le programme Push Pull Legs de la démo, en 22 contrôles HTTP :
  - jour 3 = Legs, jour 4 = repos, jour 8 = Push du cycle 2, date avant le départ ;
  - remplacement du programme suivi, arrêt par suppression ;
  - suggestion identique au calcul de `/stats/muscle-distribution` ;
  - séance d'un muscle non travaillé classée en tête avec un score de 1 ;
  - utilisateur sans séance planifiée.

## Non publié : groupes, comparaisons, duplication, séance d'un post

- **Fil populaire** : `GET /posts/feed/top` n'affiche plus les posts de l'utilisateur connecté.
- **Exercices et stats de la séance dans les fils** : `feed/following`, `feed/top`, `/posts/mine` et les posts du profil renvoient `workoutId`, `exercises[]` (nom, nombre de séries, meilleure série) et `stats` (durée, volume, séries, reps, records battus). Deux requêtes par page, quelle que soit sa taille. Les séries complètes restent dans le détail.
- **`GET /posts/:postId/workout`** : exercices, séries et totaux de la séance d'un post, avec la même visibilité que le post. L'accès se fait uniquement par le post, donc une séance non publiée reste inaccessible. Pour les autres que l'auteur, les calories sont calculées pour le poids par défaut (70 kg) afin de ne pas révéler le poids de l'auteur. Un post sans séance renvoie 404.
- **Comparaisons avec la vie réelle** (`realLifeComparison: { object, count }`, clé en anglais traduite par l'app) : sur `GET /stats/workout/:id` et la séance d'un post (volume total), et sur les badges `heaviest_weight` et `best_session_volume`. 12 objets de 7 kg à 225 t, poids typiques arrondis (`src/common/utils/real-life-comparison.ts`).
- **`GET /exercises/:id/stats/compare/:userId`** : mes stats d'un exercice à côté de celles d'une personne que je suis. Les siennes sont recalculées à partir de ses seules séances publiées. 403 si je ne la suis pas.
- **Duplication** : `POST /workouts/planned/from-post/:postId` (tout post visible) et `POST /workouts/planned/from-completed/:id` (mes séances) créent une séance planifiée avec le titre et les exercices dans le même ordre, sans les séries ni la description. Les exercices sont insérés en une requête, car un enregistrement en cascade réordonnait parfois les lignes.
- **Groupes** (`/groups`, migration réversible `AddGroups`) :
  - invitation par pseudo entre personnes qui se suivent mutuellement, puis acceptation ;
  - 20 membres au plus, invitations en attente comprises, sous verrou de ligne pour qu'aucune course ne dépasse la limite ;
  - tout membre peut renommer et inviter, seul le créateur supprime ;
  - si le créateur part, le membre le plus ancien prend sa place, et le dernier à partir supprime le groupe ;
  - fil d'activité : séances publiées par les membres depuis leur arrivée, avec les records qu'elles ont battus (`type: "workout"`) ;
  - envoi d'un post dans le groupe (`POST /groups/:id/shares`, migration réversible `AddGroupShares`) : tout membre, pour tout post qu'il peut voir, une fois par post et par groupe. Dans le fil (`type: "share"`), un post envoyé n'est montré qu'aux membres autorisés à voir ce post, si bien que le post d'un compte privé reste réservé à ses abonnés. Seul l'expéditeur peut le retirer. L'envoi disparaît avec le post, ou quand l'expéditeur quitte le groupe ;
  - un non-membre reçoit 404.
- Vérifié sur une base de démo (61 comptes, 2 772 séances) : 57 contrôles HTTP de bout en bout, plus 18 pour l'envoi de posts dans un groupe. Ils couvrent les cas d'erreur, les limites de taille et la passation du créateur. Le contrôle de schéma confirme que la migration correspond aux entités, et le revert de la migration a aussi été testé.

## Non publié : schéma de prod réparé et vérifié à chaque déploiement

**Incident du 29 octobre.** Après le déploiement, l'API renvoyait des 500 : `column User.avatarUrl does not exist`, `stats.pr_reps`, `exercise.description`. Le login était cassé. La table `migrations` de prod indiquait les 10 migrations comme appliquées, mais les colonnes qu'elles ajoutent manquaient. Les trois colonnes de contenu des exercices ont même disparu de nouveau après avoir été restaurées. Rien dans le repo ne lance de migration en arrière ; la cause de ces suppressions n'est pas identifiée. La prod a été réparée à la main avec des `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

Correctifs :

- **Migration `RepairSchemaDrift`** : rejoue une fois les changements de schéma de toutes les migrations depuis la baseline. Elles sont toutes idempotentes, donc ce qui existe déjà est laissé tel quel, et les compteurs des posts sont recalculés. Son `down()` ne fait rien : les colonnes appartiennent aux migrations précédentes.
- **`npm run schema:check:prod`** : compare les entités au schéma réel, en lecture seule.
  - S'il manque une colonne, une table ou un index utilisé par le code, il les liste et sort en erreur. `deploy.sh` s'arrête alors avant `pm2 restart` et l'ancienne version continue de tourner.
  - Ce que seule la base contient est signalé sans faire échouer.
  - Les instructions SQL affichées ne doivent jamais être lancées telles quelles : TypeORM y devine des renommages de colonnes.
- **Au démarrage, l'API journalise en `ERROR` ce qui manque dans la base.** Une colonne supprimée entre deux déploiements apparaît ainsi dans `pm2 logs` au lieu de 500 sans explication. Ce n'est pas bloquant : une API cassée sur une route vaut mieux qu'une API arrêtée.
- **`migration:run` affiche enfin sa progression** : migrations déjà en base, en attente, chacune exécutée. Le logger supprimait ces messages, si bien qu'une exécution qui n'appliquait rien ressemblait à une exécution complète. L'API et le contrôle de schéma n'affichent pas ces messages, car une comparaison à blanc y écrit « new columns added » sans rien modifier.
- **`base-exercises.json` est copié dans `dist/` au build** (asset dans `nest-cli.json`). `node dist/scripts/seed.js`, désormais `npm run seed:prod`, échouait en prod faute de fichier. Le build vide `dist/` à chaque fois (`deleteOutDir`), donc une copie manuelle ne tenait pas.

**Prochain déploiement.** Bash exécute la version de `deploy.sh` qu'il a lue avant le `git pull`, donc le contrôle de schéma ne tournera automatiquement qu'au déploiement suivant. Après le prochain déploiement, lancer une fois `npm run schema:check:prod` sur la VM, qui doit afficher « Schema OK ». Les logs du job montrent maintenant la migration `RepairSchemaDrift` exécutée.

Vérifié sur une copie de l'état de prod : journal complet, six colonnes supprimées, une colonne en trop.
- Le contrôle échoue (code 1) et liste les six manques.
- `migration:run:prod` exécute la réparation, avec sa progression affichée.
- Le contrôle passe ensuite, avec un simple avertissement sur la colonne en trop.
- Une seconde exécution répond « No migrations are pending ».
- `seed:prod` trouve son fichier.
- L'API démarrée sur une base privée de `exercises.description` journalise l'erreur et renvoie 500 sur le détail d'un exercice ; une fois la colonne remise, il y a 200 et aucun log.
- Sur une base neuve, les 11 migrations passent et le contrôle est propre. Annuler la réparation ne supprime rien.

## Non publié : données de démonstration

- **`npm run demo:seed`** (`demo:seed:prod` sur la VM) remplit la base avec des comptes fictifs et plusieurs mois d'activité pour une démo : 60 personnes par défaut (`-- --users=N`), abonnements, programmes et séances planifiées, séances terminées avec une progression réaliste, posts, likes, commentaires, partenaires tagués par @, avatars générés, stats par exercice et badges calculés avec les mêmes fonctions que l'API.
- Compte vitrine : `lucas.moreau`, suivi par la plupart des autres comptes.
- **Sécurité** :
  - tous les comptes de démo ont une adresse sur le domaine réservé `grinta-demo.example.com`, ce qui empêche d'écrire sur une vraie boîte mail et permet de les retrouver ;
  - leur mot de passe commun est lu dans `DEMO_PASSWORD` (8 caractères minimum). Il n'est ni généré ni affiché, donc jamais écrit dans un log ;
  - le script refuse de tourner si des comptes de démo existent déjà.
- **`npm run demo:clear`** (`demo:clear:prod`) supprime les comptes de démo et tout ce qui en dépend, ainsi que leurs photos dans le stockage. Il recalcule ensuite les compteurs des vrais posts que ces comptes avaient likés ou commentés. Les vrais comptes ne sont pas modifiés, sauf qu'ils perdent leurs likes, commentaires et abonnements liés aux comptes de démo.
- Les comptes de démo sont visibles par les vrais utilisateurs (recherche, recommandations, feed top) : lancer `demo:clear` après la présentation.

## Non publié : photos stockées dans Supabase Storage

- **Les photos (avatars, photos de séance et leurs miniatures) sont stockées dans un bucket public de Supabase Storage**, et non plus sur le disque de la VM. L'API envoie et supprime les fichiers avec la clé de service, qui reste sur le serveur. L'app charge les photos directement depuis le CDN de Supabase.
- Rien d'autre ne change : traitement des images (WebP, métadonnées retirées, miniatures), routes et formats de réponse sont identiques. Les URL stockées sont maintenant absolues (`https://<projet>.supabase.co/storage/v1/object/public/photos/...`).
- **Configuration**, dans le `.env` du serveur :
  - `SUPABASE_URL` : l'URL du projet ;
  - `SUPABASE_SERVICE_ROLE_KEY` : clé `service_role`, ou nouvelle clé secrète `sb_secret_...` ;
  - `SUPABASE_STORAGE_BUCKET` : facultatif, `photos` par défaut.

  Si `SUPABASE_URL` est défini sans clé, l'API refuse de démarrer. Sans `SUPABASE_URL`, les photos restent sur le disque local (développement) ; `PHOTOS_STORAGE=local` force ce mode. Au démarrage, l'API indique dans ses logs le stockage utilisé.
- **`npm run photos:setup`** :
  - crée le bucket s'il manque : public, WebP uniquement, 5 Mo par fichier ;
  - le rend public s'il ne l'est pas ;
  - vérifie le tout par un vrai aller-retour : envoi, lecture par l'URL publique, suppression.

  Il peut être relancé sans risque.
- `npm run photos:gc` fonctionne sur le bucket comme sur le disque.
- **Bande passante** : chaque photo affichée compte dans l'egress de Supabase (5 Go par mois sur le plan gratuit). Les miniatures, réduites à environ 22 ko pour une séance et 5 ko pour un avatar, et le cache permanent des URL limitent ce coût. Voir PERFORMANCE.md.
- Testé sans projet Supabase réel, contre une imitation de l'API Storage : mêmes routes, mêmes en-têtes et mêmes corps que le client officiel `storage-js`. Le parcours complet a été vérifié par l'API : envoi, remplacement, suppression avec la séance, nettoyage des orphelins. **Le premier vrai test est `npm run photos:setup` sur la VM**, à lancer avant de compter sur les photos.

## Non publié : schéma géré par les migrations, `synchronize` désactivé

- **`DB_SYNCHRONIZE` vaut maintenant `false` par défaut.** Le schéma de prod ne change plus au démarrage selon les entités : une colonne supprimée ou renommée par erreur dans le code ne peut plus détruire de données. Il évolue uniquement par les migrations.
- **Migration de référence `InitialSchema`** : schéma de la branche `backend`, conditionnel. Elle ne change rien sur la prod et crée le schéma complet sur une base vide (nouvel environnement, poste de développeur). Son annulation, qui supprime toutes les tables, demande `ALLOW_BASELINE_REVERT=true`.
- **`deploy.sh` applique les migrations avant de redémarrer l'API.** Une migration en échec arrête le déploiement, et l'ancienne version continue de tourner.
- **L'API applique aussi les migrations en attente au démarrage** (`DB_MIGRATIONS_RUN`, `true` par défaut). Au premier déploiement, c'est elle qui applique les migrations : bash exécute l'ancien `deploy.sh` jusqu'au bout, même après son `git pull` (vérifié).
- Vérifié sur une base créée et remplie par le code actuellement en prod, et sur une base vierge. Détails dans PERFORMANCE.md, section « Migrations et `synchronize` ».

### Conséquences pratiques

- **Plus besoin de lancer `npm run migration:run:prod` à la main après un déploiement**, premier déploiement compris. `npm run seed`, `npm run backfill:exercise-stats:prod` et les vérifications restent manuels.
- Toute modification d'entité doit maintenant être accompagnée d'une migration (`npm run migration:generate -- src/migrations/Nom`, puis la rendre idempotente comme les autres). Sinon, le schéma de prod ne suit pas le code. Vérification : `migration:generate --dr` doit répondre « No changes ».
- En développement (`docker-compose.dev.yml`, `npm run start:dev`), l'API applique les migrations au démarrage : une base vide est prête sans `synchronize`.
- Ne pas passer PM2 en mode cluster avec `DB_MIGRATIONS_RUN=true` : TypeORM ne verrouille pas la table des migrations.

### Non fait, à décider

Les posts publiés avant la fonctionnalité de partenaires n'ont pas de partenaires, même si leur séance contient des `@`. Ils en auront à la prochaine modification du titre ou de la description. Une migration peut les remplir rétroactivement, avec la même règle (abonnés de l'auteur seulement).

## Non publié : partenaires de séance identifiés par @ dans un post

### Ce qui change

- **Identifier les personnes avec qui on s'est entraîné.** Un post affiche le titre et la description de sa séance : chaque `@pseudo` qu'ils contiennent identifie l'utilisateur correspondant comme partenaire du post.
  - **Seuls les abonnés de l'auteur peuvent être identifiés** : personne ne peut afficher le nom et la photo d'un inconnu sur son post. Un abonné qui se désabonne disparaît des posts où il était identifié, et y réapparaît s'il se réabonne, sauf s'il s'est retiré.
  - Règles : majuscules indifférentes ; un point final est ignoré (`merci @paul.`) ; une adresse e-mail (`paul@mail.com`) n'est pas une mention ; un pseudo inconnu ou d'un non-abonné reste du texte ; l'auteur ne s'identifie pas lui-même.
  - 10 partenaires au plus, les premiers mentionnés.
- **Les partenaires apparaissent partout où le post est lu**, dans un champ `partners` : `[{ id, uniqueName, displayName, avatarThumbnailUrl }]`. C'est le cas à la création (`POST /posts`), dans le détail d'un post, les fils following et top, `GET /posts/mine` et les posts du profil. Ils sont lus en une petite requête indexée par post, dans la même requête SQL que le reste.
- **Ils suivent le texte** : modifier le titre ou la description d'une séance publiée (`PATCH /workouts/completed/:id`) met les partenaires à jour. Une modification qui ne touche pas au texte ne les change pas.
- **Une personne identifiée peut se retirer** : `DELETE /posts/:postId/partners/me`. Son `@` reste dans le texte mais ne l'identifie plus, définitivement pour ce post, même si l'auteur retire puis remet la mention. Le refus est conservé en base pour ça. Si l'appelant n'est pas identifié, la route renvoie 404 avec un message en français.
- Nouvelle table `post_partners` (migration `AddPostPartners`, idempotente et réversible). Les lignes disparaissent avec le post ou l'utilisateur.
- Tests :
  - extraction des mentions (fonction pure) et resynchronisation à la modification d'une séance ;
  - scénario de bout en bout sur base réelle, 26 vérifications : compte privé, non-abonné, désabonnement, refus, resynchronisation, plafond de 10, suppression du post, format des pseudos ;
  - migration vérifiée sans écart de schéma, sur une base vierge comme sur une base dont `synchronize` a déjà créé la table, puis annulée et rejouée.

### Format des pseudos (correctif)

- **Corrigé : un pseudo pouvait contenir des espaces, des accents ou n'importe quel caractère**, `jean dupont` comme `élodie` ou un emoji. Seules la longueur (3 à 30) et la mise en minuscules étaient vérifiées. Un tel pseudo ne pouvait pas être mentionné.
- Règle, à l'inscription et au changement de pseudo : lettres sans accent, chiffres, `_` et `.`, sans point au début ni à la fin. Le message d'erreur est en français. Les pseudos générés (suggestion quand un pseudo est pris, seed) suivent la même règle : « Élodie Martin » donne `elodiemartin`, et non plus `lodiemartin`.
- **Comptes existants** : rien n'est renommé automatiquement, car le pseudo sert d'identifiant de connexion et un renommage empêcherait ces utilisateurs de se connecter avec. Ils restent valides, peuvent modifier le reste de leur profil (l'app n'envoie le pseudo que s'il a changé), mais ne peuvent pas être mentionnés. Pour les compter :

  ```sql
  SELECT count(*) FROM users WHERE "uniqueName" !~ '^[a-z0-9_]([a-z0-9_.]*[a-z0-9_])?$';
  ```

  S'il y en a, deux options : les prévenir de changer de pseudo, ou les renommer par migration en leur disant d'utiliser leur nouveau pseudo ou leur e-mail pour se connecter.

### Reste ouvert

- **Notification et visibilité côté identifié.** Il n'existe pas de système de notification : la personne identifiée ne le sait que si elle voit le post. Une route « posts où je suis identifié » est simple à ajouter, l'index `IDX_post_partners_user` est déjà en place.

### Côté frontend, à faire

Afficher `partners` sous le post. Rendre cliquables les `@pseudo` du titre et de la description qui correspondent à un partenaire. Proposer « Me retirer » à la personne identifiée.

### Déploiement

`npm run migration:run:prod`. La table est aussi créée par `synchronize`, et la migration le tolère.

## Non publié : optimisations de bande passante, de stockage et de temps de réponse

Mesures détaillées dans PERFORMANCE.md, section « Egress et taille des réponses ». Les octets envoyés par Postgres à l'API comptent dans l'egress Supabase, la ressource la plus limitée du plan gratuit. Ils baissent de 60 à 70 % sur les stats et de 96 % sur la liste des programmes. Le catalogue d'exercices ne touche plus la base.

### Ce qui change

- **Corrigé : le contenu des exercices voyageait avec chaque séance.** Les descriptions, consignes et photos ajoutées plus haut étaient chargées à chaque fois qu'un exercice est joint à une séance, un plan, un programme ou un calcul de stats, soit environ 1 ko par exercice et par séance. Elles ne sont plus lues que par `GET /exercises/:id`.
  - Conséquence visible : `GET /workouts/completed/:id` et `GET /workouts/planned/:id` ne renvoient plus `description`, `instructions` et `image_urls` dans chaque exercice. Le détail d'une séance passe de 9 à 3,5 ko.
- **Stats : seules les colonnes utiles au calcul sont chargées.**
  - `/stats/comparisons` : 1,37 Mo lus en base par appel → 443 ko.
  - `/stats/muscle-frequency` : 789 → 250 ko.
  - `/stats/summary` : 619 → 195 ko, et 41 → 20 ms.
  - Les réponses sont identiques, vérifiées champ par champ contre la version précédente.
- **`GET /programmes`** compte les jours en SQL : 85 → 3 ko lus en base.
- **Catalogue d'exercices en mémoire** : `GET /exercises` ne lit plus la base, sauf après une création, une modification ou une suppression d'exercice, ou au bout de 5 minutes.
- **Réponses compressées** (brotli ou gzip, au-dessus de 1 ko), de 4 à 12 fois :
  - catalogue d'exercices : 58 → 5 ko ;
  - historique de 300 séances : 76 → 12 ko.

  Coût : 2 à 4 ms de CPU sur les grosses réponses.
- **Pagination facultative de l'historique** : `GET /workouts/completed?limit=20`, puis `&before=<id de la dernière séance reçue>` pour la page suivante. Sans paramètre, rien ne change.
- **Nettoyage des photos orphelines** : `npm run photos:gc` liste les fichiers que plus aucune ligne ne référence, et `-- --delete` les supprime. Ce cas n'arrive qu'après un arrêt brutal entre l'écriture d'un fichier et celle de son URL. Les fichiers de moins d'une heure ne sont jamais touchés, leur envoi peut être en cours. Le script signale aussi les URL dont le fichier manque, utile après une restauration de sauvegarde.
- Outillage de mesure : `perf/db-egress-proxy.mjs` compte les octets envoyés par Postgres, et `perf/bench.mjs` affiche aussi la taille compressée des réponses.
- Nouvelle dépendance : `compression`.

### Deuxième passe : compteurs, stats incrémentales, miniature d'avatar

- **Compteurs de likes et de commentaires sur les posts** (migration `AddPostCounters`, qui les remplit à partir des lignes existantes).
  - Tenus à jour dans la même transaction que le like, le commentaire, sa suppression ou son masquage après 5 signalements.
  - Les fils, le détail d'un post et le profil les lisent au lieu de recompter.
  - `GET /posts/feed/top` passe de 180 à 30 ms de base sur 10 000 posts dans le mois.
  - Les compteurs restent exacts avec des likes, un double appui ou des signalements simultanés (vérifié sur base réelle).
- **Enregistrement d'une séance sans relire l'historique.**
  - La séance est ajoutée aux stats stockées et comparée aux records stockés : 6 ko lus au lieu de 32 et 1 ms de base au lieu de 17, pour un compte de 350 séances. Le coût ne croît plus avec l'historique.
  - Résultat identique au recalcul complet, prouvé sur 5 000 historiques aléatoires.
  - Les stats sont verrouillées pendant l'ajout, donc deux séances enregistrées en même temps ne s'écrasent plus.
  - La modification et la suppression recalculent toujours tout.
- **Miniature d'avatar de 128 px** : `PUT /users/me/avatar` renvoie `{ avatarUrl, avatarThumbnailUrl }`. Migration `AddAvatarThumbnails`.
  - Les listes renvoient maintenant `avatarThumbnailUrl` à la place de `avatarUrl` : recherche, followers, following, demandes d'abonnement, recommandations, likes, commentaires, fils, auteur d'un post. Si l'utilisateur n'a pas encore de miniature, c'est l'avatar complet.
  - Le profil et `GET /users/:id` renvoient les deux.
  - Ces champs n'ont jamais été publiés, rien ne casse côté app.
- **Bug évité avant publication** : la première version des compteurs ne décrémentait pas à la suppression ou au masquage d'un commentaire. TypeORM ignore sans erreur une clé étrangère passée à `returning([...])`. Le scénario de bout en bout l'a détecté, il est corrigé et documenté dans PERFORMANCE.md.

### Déploiement

1. `npm run migration:run:prod` **obligatoire**. Avec `synchronize: true` seul, les colonnes de compteurs seraient créées à 0 et les compteurs resteraient faux. La migration les remplit, même si `synchronize` a déjà créé les colonnes. Elle prend environ 2 s pour 24 000 posts et 290 000 likes.
2. `npm ci` et redémarrage.

Optionnel côté nginx :

- servir `/uploads/` directement (`location /uploads/ { alias <UPLOADS_DIR>/; expires max; add_header X-Content-Type-Options nosniff; }`), ce qui décharge Node des photos ;
- si nginx a déjà `gzip on` avec `gzip_proxied any`, il laisse passer les réponses déjà compressées par l'API.

## Non publié : photo de profil, photo de séance, développé couché à la barre

### Ce qui change

- **Photo de profil.** `PUT /users/me/avatar` (multipart, champ `photo`) enregistre la photo et renvoie `{ avatarUrl }`. `DELETE /users/me/avatar` la retire. Une nouvelle photo remplace l'ancienne, dont le fichier est supprimé.
- **Photo de séance.** `PUT /workouts/completed/:id/photo` et `DELETE /workouts/completed/:id/photo`, même fonctionnement, propriétaire seulement (404 sinon, comme les autres routes de modification). Une photo par séance. La séance est créée d'abord, la photo envoyée ensuite : le JSON de `POST /workouts/completed` ne change pas. La réponse contient `{ photoUrl, photoThumbnailUrl }`.
- **Miniature de la photo de séance, pour limiter la bande passante.** Chaque photo affichée est un téléchargement, et c'est le défilement des fils qui en consomme le plus. Chaque envoi produit donc aussi une miniature de 600 px.
  - Taille mesurée : environ 22 ko, contre 108 ko pour une photo de salle réaliste (5 fois moins) et 568 ko dans le pire cas (25 fois moins).
  - Coût : 80 à 115 ms de plus par envoi. La miniature est tirée de la photo déjà réduite, l'original n'est décodé qu'une fois.
  - Les listes et les fils ne renvoient que la miniature. La photo complète n'est renvoyée que là où elle s'affiche en grand : détail de la séance, détail d'un post, et `GET /posts/mine`.
  - Ordre de grandeur, avec 20 nouvelles photos vues par jour dans le fil : environ 13 Mo par mois et par utilisateur actif, au lieu d'environ 150 Mo.
- **Où les URL apparaissent.**
  - `avatarUrl` : le compte (`GET /users/:id`, y compris l'identité publique vue par les autres), le profil, la recherche, les followers et following, les demandes d'abonnement, les recommandations, les posts (détail, fils, likes, commentaires).
  - `photoUrl` et `photoThumbnailUrl` : l'historique (`GET /workouts/completed`, où l'app doit afficher la miniature) et le détail d'une séance.
  - `workoutPhotoUrl` et `workoutPhotoThumbnailUrl` : le détail d'un post et `GET /posts/mine`.
  - `workoutPhotoThumbnailUrl` seule : les fils (`/posts/feed/following`, `/posts/feed/top`) et les posts du profil.
  - Le champ `image_url` documenté dans `UserListDto`, jamais rempli, est remplacé par `avatarUrl`.
- **Les deux URL ne se modifient que par ces routes.** `PATCH /users/:id` et `PATCH /workouts/completed/:id` refusent `avatarUrl` et `photoUrl` (400), sinon on pourrait faire pointer son avatar vers n'importe quelle image.
- **Les fichiers suivent les données** : supprimer une séance supprime sa photo et sa miniature, supprimer son compte supprime son avatar et les photos de ses séances.
- **« Bench Press (Barbell) »** : le développé couché à plat à la barre, avec description, consignes et les deux photos de free-exercise-db (relues : barre bras tendus, puis barre à la poitrine). Le catalogue passe à 429 exercices, dont 273 illustrés. Aucun renommage : le seed crée simplement la ligne.
- Migrations `AddPhotos` (colonnes `users.avatarUrl` et `completed_workouts.photoUrl`) et `AddPhotoThumbnails` (`completed_workouts.photoThumbnailUrl`), idempotentes et réversibles. Nouvelle dépendance `sharp` 0.34 (traitement d'image, Node 18.17 ou plus récent).

### Sécurité des envois

- **La photo stockée n'est jamais le fichier envoyé.** Elle est décodée puis réencodée en WebP par le serveur.
  - Avatar : carré de 512 px.
  - Photo de séance : 1600 px au plus, proportions conservées, jamais agrandie.
  - Un fichier piégé (SVG avec script, polyglotte, faux JPEG) ne peut donc pas être servi tel quel.
- **Les métadonnées sont supprimées** : une photo de téléphone contient en EXIF la position GPS et le modèle de l'appareil. Une photo de séance prise chez soi publierait son adresse. L'orientation EXIF est appliquée aux pixels avant d'être retirée.
- **Formats acceptés : JPEG, PNG, WebP**, reconnus au contenu et pas au type déclaré. Le reste reçoit un 415, y compris SVG, GIF, AVIF et HEIC : le binaire de `sharp` ne décode pas le HEIC de l'iPhone, l'app doit envoyer du JPEG.
- **Limites** :
  - 10 Mo par fichier (413) ;
  - 50 mégapixels (413), vérifiés sur l'en-tête avant tout décodage. Un PNG de quelques centaines de ko peut déclarer 56 Mpx et saturer la mémoire de la VM ;
  - un seul fichier par requête ;
  - 10 envois par minute et par adresse, car un envoi coûte bien plus qu'une requête JSON.
- **Messages d'erreur en français**, y compris ceux de multer (fichier trop lourd, mauvais champ).
- **Suppression des fichiers bornée** : le chemin à supprimer est déduit de l'URL stockée par un motif strict (`avatars|workouts/<uuid>.webp`), donc rien en dehors du dossier des photos ne peut être effacé.
- **Ordre des écritures** : la photo est traitée et écrite avant de verrouiller la ligne (`SELECT ... FOR UPDATE`), l'URL est remplacée, puis l'ancien fichier est supprimé. Si la ligne a disparu entre-temps, le nouveau fichier est supprimé. Deux envois simultanés ne laissent pas de fichier orphelin.
- **Service des fichiers** sous `/uploads` par l'API :
  - `X-Content-Type-Options: nosniff` ;
  - cache `immutable` d'un an, possible car un nom de fichier n'est jamais réutilisé ;
  - pas d'index de dossier ni de fichiers cachés ;
  - un fichier absent renvoie le 404 JSON habituel.

### Choix à valider

- **Stockage sur le disque de la VM.** Il fonctionne dès le déploiement, sans service ni clé supplémentaires. Contreparties : c'est la seule copie des photos (le dossier doit être sauvegardé), l'espace disque de la VM s'épuise, aucune mise en cache CDN, et l'API ne peut pas tourner sur plusieurs machines.
  - Alternative : Supabase Storage, déjà disponible avec le projet Supabase de la base. Stockage durable et CDN, au prix d'une clé de service sur la VM et d'un bucket à créer.
  - Argument pour garder le disque : sur le plan gratuit de Supabase, c'est l'egress (5 Go/mois) qui serait limitant, avant le stockage et la base. Les photos servies par la VM n'en consomment pas.
  - Seule la classe `PhotoStorage` changerait. Les URL déjà stockées se réécrivent en une requête (`replace` du préfixe) après copie des fichiers.
- **Les URL des photos sont publiques**, sans jeton : elles sont imprévisibles (UUID v4) mais quiconque obtient l'URL voit la photo. C'est le fonctionnement habituel des applications sociales, et `<Image>` en React Native n'envoie pas d'en-tête d'authentification. L'avatar est visible de tous, compte privé compris.
- **La photo de séance a la visibilité de la séance**, et `GET /workouts/completed/:id` reste ouvert à tout utilisateur authentifié (règle du projet) : la photo d'une séance d'un compte privé est lisible par qui connaît l'id de la séance. Restreindre cette route aux abonnés réglerait les deux.

### Mesures

Photo de téléphone de 12 Mpx (3,1 Mo, contenu bruité, le cas le plus défavorable), sur 4 cœurs : avatar en 127 ms (47 ko), photo de séance en 559 ms (569 ko ; une vraie photo se compresse mieux). Le travail de `sharp` tourne hors de la boucle d'événements de Node : les autres requêtes ne sont pas bloquées pendant un envoi.

Vérifié de bout en bout sur une base créée avec le code précédent : migration puis seed (« 429 new »), aucune dérive de schéma, revert de la migration, 56 vérifications HTTP (dont miniature servie en 450 x 600, présente dans les fils sans la photo complète, supprimée avec la photo). Ce scénario a trouvé un bug : `user."avatarUrl"` dans une requête casse, car `user` est un mot réservé de Postgres ; corrigé en `user.avatarUrl`, que TypeORM entoure de guillemets.

### Côté frontend, à faire

L'app ne fait encore rien de ces routes :

- **Envoi** : `FormData` avec le champ `photo`. Le helper `request` de `services/api.ts` force `Content-Type: application/json` et doit être contourné pour ces appels, le `boundary` étant fixé par `fetch`.
- **Affichage** : utiliser `photoThumbnailUrl` / `workoutPhotoThumbnailUrl` dans les listes et les fils, `photoUrl` seulement sur l'écran de la séance. `avatarUrl` et les URL de photos sont des chemins relatifs (`/uploads/...`) tant que `UPLOADS_PUBLIC_URL` n'est pas défini, à préfixer par l'URL de l'API.
- **HEIC** : sur iPhone, convertir en JPEG avant l'envoi (`expo-image-manipulator`, par exemple), sinon le backend répond 415.
- **Écran de séance** : le sélecteur de photo existant (`WorkoutImagePicker`) n'envoie aujourd'hui l'image nulle part.

### Déploiement

1. `npm ci` installe `sharp` et son binaire précompilé (linux x64 et arm64, glibc et musl). Le `deploy.sh` actuel le fait déjà.
2. `npm run migration:run:prod`, ou rien tant que `synchronize: true` est actif.
3. **nginx : `client_max_body_size 10m;`** dans le bloc qui sert l'API. La valeur par défaut est de 1 Mo : sans ce réglage, la plupart des photos de téléphone seraient refusées par nginx (413 en HTML) avant d'atteindre l'API.
4. Variables d'environnement, toutes deux facultatives :
   - `UPLOADS_DIR` : dossier des photos, par défaut `uploads` dans le dossier de lancement, soit `~/Grinta/backend/uploads` sous PM2. Il est ignoré par git et n'est pas touché par le build. **À inclure dans les sauvegardes.**
   - `UPLOADS_PUBLIC_URL` : préfixe des URL renvoyées, par exemple `https://<domaine de l'API>/uploads`, pour que l'app les affiche telles quelles. Par défaut `/uploads`, relatif.
5. `npm run seed` pour créer « Bench Press (Barbell) ».
6. Avec le Dockerfile, monter un volume sur `/app/uploads`, sinon les photos disparaissent à chaque redémarrage du conteneur.

## Non publié : description, consignes et photos des exercices, équipement dans le nom des variantes

### Ce qui change

- **Les 428 entrées de `base-exercises.json` ont une description et des consignes.** La description dit en une ou deux phrases ce qu'est l'exercice et ce qu'il travaille. Les consignes donnent les étapes, dans l'ordre. Quand le geste dépend de l'équipement (barre, haltères, poulie, machine...), une étape de mise en place propre à la variante est ajoutée. Les textes sont en anglais, comme les noms des exercices, que le frontend n'a jamais traduits.
- **272 entrées ont deux photos** : position de départ puis position d'arrivée (`image_urls`), la première servant aussi de miniature (`image_url`, champ que le frontend lit déjà). Elles viennent de [free-exercise-db](https://github.com/yuhonas/free-exercise-db), sous Unlicense (domaine public, licence vérifiée dans le dépôt source). Les URL sont épinglées sur un commit de la source, et les 460 ont été vérifiées : toutes répondent en `image/jpeg`.
- **Une photo n'est associée que si elle montre le même mouvement avec un équipement compatible.** Chaque appariement a été relu contre les consignes de la source, et 20 ont été écartés car ils montraient une autre posture, une autre prise ou un autre exercice de même nom. Exemples : le « Wind Sprints » de la source est un exercice d'abdos suspendu, et sa « Rear Pull-Up » tire derrière la nuque. Une mauvaise photo est pire que pas de photo.
- **API** : nouvelles colonnes `description`, `instructions` et `image_urls` sur `exercises` (migration `AddExerciseContent`, idempotente et réversible).
  - `GET /exercises/:id` renvoie tout.
  - `GET /exercises` reste léger (97 ko au lieu de 260 ko pour le catalogue, que l'app télécharge et met en cache en entier) : les champs lourds sont réservés au détail. L'écran de l'exercice doit donc appeler `GET /exercises/:id`.
- **Bug corrigé : les muscles secondaires n'étaient jamais enregistrés.** Le JSON utilisait la clé `secondary_muscle` alors que l'entité attend `secondary_muscles`, et le seed copie les clés telles quelles. Après le seed, 322 exercices ont leurs muscles secondaires, contre 0 avant, ce qui corrige aussi les statistiques par muscle (`muscle-distribution`, `balance`, `muscle-frequency`) qui les ignoraient.
- Test d'intégrité du JSON (enums, présence des textes, paires de photos épinglées) et README de provenance dans `src/exercise/data/`.

### Pourquoi pas de GIF

Aucune source de GIF d'exercices sous licence libre n'a été trouvée. Les GIF des bases commerciales (ExerciseDB, etc.) sont soumis à copyright et ne peuvent pas être redistribués sans licence. Les deux photos départ/arrivée en tiennent lieu : affichées en alternance (toutes les 0,6 à 0,8 s, par exemple), elles animent le mouvement dans l'app. Si de vrais GIF sont nécessaires, deux options : les générer à partir de ces paires et les héberger (Supabase Storage), ou souscrire une licence chez un fournisseur.

### Équipement dans le nom des variantes

Le JSON contenait **430 entrées pour 294 noms** : « Squat » existait en 7 équipements, « Bicep Curl » en 6, « Deadlift » en 4. Or `Exercise.name` est unique en base et le seed met à jour par nom : chaque variante écrasait la précédente et seule la dernière du fichier survivait. 136 variantes n'arrivaient jamais en base, dont le soulevé de terre et le squat à la barre (« Deadlift » en base était la variante Smith machine, « Squat » la variante au poids du corps), et seules 178 des entrées illustrées.

- **Chaque variante porte maintenant son équipement dans son nom**, comme dans Hevy ou Strong : « Deadlift (Barbell) », « Deadlift (Smith Machine) », « Squat (Bodyweight) ». Un qualificatif existant est conservé devant l'équipement : « Bench Press (Incline, Dumbbell) », « Calf Raise (Seated, Plate Loaded) ». Exceptions : « Cycling (Stationary Bike) » et « Cycling (Outdoor) », plus parlants que Machine et Bodyweight, et « Bicep Curl (EZ Bar) » et « Reverse Curl (EZ Bar) » qui restent la variante à la barre (la variante poulie devient « ..., Cable) »). Les noms qui n'existaient qu'en un équipement ne changent pas.
- 203 noms changent, et 2 entrées en double strict sont supprimées : **428 entrées, 428 noms**, toutes en base après le seed, dont les 272 illustrées.
- **Migration `RenameExerciseVariants`** : renomme sur place la ligne existante de chaque nom partagé d'après son `equipment_type`, qui est celui de la variante qui avait survécu. La ligne garde son id, donc les séances, stats et badges qui la référencent restent attachés au bon exercice. Le seed crée ensuite les 134 variantes manquantes. Le seed applique le même renommage avant d'écrire, donc l'ordre seed puis migration donne le même résultat. Idempotente, réversible : `down()` rend l'ancien nom à la plus ancienne ligne de chaque groupe, sauf si ce nom est de nouveau pris (après le seed, « Bicep Curl (EZ Bar) » désigne la variante à la barre et la ligne poulie garde son nouveau nom).
- Si un exercice créé par un utilisateur porte déjà un des nouveaux noms, la ligne d'origine n'est pas renommée (pas de conflit d'unicité) et garde son ancien nom. Après déploiement, `SELECT name FROM exercises WHERE name IN ('Squat', 'Deadlift', 'Bicep Curl')` doit être vide ; sinon, c'est ce cas.
- Vérifié sur une base créée avec le code précédent et contenant des séances sur « Squat », « Deadlift » et « Bicep Curl (EZ Bar) » : 71 lignes renommées avec leurs ids, stats et badges (`GET /exercises/stats` renvoie les nouveaux noms), seed « 134 new, 294 updated » puis « 0 new, 428 updated », catalogue en base identique au JSON, même état final dans l'ordre seed puis migration, `migration:revert` sans seed intermédiaire qui restaure exactement l'état d'origine.
- Tests : noms uniques dans le JSON, et liste de renommage cohérente avec le JSON (même équipement, un seul nouveau nom par couple nom et équipement).

**Impact frontend** : les noms affichés changent. L'app met le catalogue en cache (`exercises_cache`) et montrera les anciens noms jusqu'au prochain rafraîchissement. Les séances et programmes référencent les exercices par id et ne sont pas affectés.

**Manque constaté** : le catalogue n'avait pas de développé couché à plat à la barre. Ajouté depuis, voir « Bench Press (Barbell) » plus haut.

### Déploiement

1. Schéma et renommage : `npm run migration:run:prod`. Les colonnes sont aussi créées au démarrage tant que `synchronize: true` est actif, mais pas le renommage, que seuls la migration et le seed appliquent.
2. Contenu : relancer `npm run seed` sur la VM. Le seed renomme les variantes si la migration n'a pas tourné, puis met à jour les exercices existants par leur nom et crée les variantes manquantes, sans toucher aux exercices créés par les utilisateurs. Il est idempotent.

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
