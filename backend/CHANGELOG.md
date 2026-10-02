# Changelog backend

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
