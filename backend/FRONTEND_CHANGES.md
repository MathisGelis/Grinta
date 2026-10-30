# Changements du backend à intégrer dans l'app

Deux livraisons backend :
- **Sections 1 à 6** : branche `claude/eloquent-franklin-77c84i`, **déjà en production** depuis le 29 octobre.
- **Section 7** : branche `feat/backend-v3`, **pas encore déployée**. Ses routes répondront `404` tant qu'elle ne l'est pas.

Ce document liste tout ce que l'app voit changer : comportements, formats de réponse, nouvelles routes. Le détail technique côté serveur est dans `backend/CHANGELOG.md`, et tous les schémas de requête et de réponse sont dans Swagger (`GET /api` sur l'API).

Ordre de lecture conseillé :

1. Conventions générales
2. Changements cassants, à corriger avant de livrer
3. Nouvelles fonctionnalités
4. Référence des réponses
5. Optimisations côté app
6. Checklist

---

## 1. Conventions générales

### Authentification

- **Le token JWT dure 7 jours**, contre 90 avant. Passé ce délai, toute route authentifiée répond `401` : l'app doit renvoyer vers l'écran de connexion au lieu d'afficher une erreur. Il n'y a pas de refresh token.
- `POST /auth/login` est limité à **5 tentatives par 15 minutes et par adresse IP**. Au-delà : `429`. Il faut afficher un message du type « Trop de tentatives, réessayez dans quelques minutes ».
- L'email et le pseudo sont enregistrés en minuscules et sans espaces autour, et le login met l'identifiant en minuscules. Rien à faire côté app, mais il est inutile de forcer la casse.

### Format des erreurs

Toutes les erreurs ont la même forme :

```json
{ "statusCode": 400, "message": { "message": "...", "error": "Bad Request", "statusCode": 400 } }
```

- `message.message` est **une chaîne ou un tableau de chaînes**, ce dernier cas pour les erreurs de validation (un élément par champ en faute). Le helper `request` de `services/api.ts` gère déjà les deux cas, il faut le garder.
- Les nouveaux messages d'erreur sont **en français** et peuvent être affichés tels quels : photos, pseudo, identification sur un post, etc. Certains anciens messages restent en anglais (`Post not found`, `Workout not found`, etc.).
- Une erreur serveur inattendue renvoie toujours `500` avec `"Internal server error"`. Le détail technique n'est plus jamais envoyé au client.
- Un identifiant mal formé (pas un UUID) dans une URL donne `400 "Identifiant invalide"`, au lieu d'un `500`.
- **Une propriété inconnue dans un body ou une query donne `400`** (`property xxx should not exist`). C'était déjà le cas, mais c'est maintenant appliqué partout de la même façon. N'envoyez que les champs documentés. En particulier, ne renvoyez jamais un objet entier reçu de l'API dans un `PATCH`.

### Limites de débit

| Route | Limite |
| --- | --- |
| Toutes les routes | 60 requêtes par minute et par IP |
| `POST /auth/login` | 5 par 15 minutes |
| `POST /posts` | 20 par minute |
| `POST /posts/:postId/comments` | 10 par minute |
| `POST /posts/comments/:commentId/report` | 5 par minute |
| Envoi de photo (`PUT .../avatar`, `PUT .../photo`) | 10 par minute |

Au-delà de la limite, la route répond `429`.

### Divers

- **Les réponses sont compressées** (brotli ou gzip) au-delà de 1 ko. `fetch` sur iOS et Android décompresse tout seul, rien à faire.
- Les **compteurs** (`likesCount`, `commentsCount`, `followersCount`, `totalExercises`, etc.) sont des **nombres**. Certains arrivaient avant sous forme de chaîne (`"12"`) : retirez les `parseInt` ou `Number()` éventuels, ou gardez-les, ils restent sans effet.
- Le paramètre `limit` des fils et de `GET /posts/mine` vaut 20 par défaut et 100 au maximum. Une valeur invalide reprend la valeur par défaut.

---

## 2. Changements cassants

### 2.1 Utilisateurs

- **`GET /users/:id` sur un autre utilisateur ne renvoie plus que son identité publique** : `{ id, displayName, uniqueName, isPublic, avatarUrl, avatarThumbnailUrl }`. Email, date de naissance, taille et poids ne sont renvoyés que pour son propre compte. Tout écran qui lisait ces champs chez un autre utilisateur ne les recevra plus.
- **`PATCH /users/:id` et `DELETE /users/:id` ne fonctionnent que sur son propre id**. Avec un autre id : `403 "Vous ne pouvez modifier que votre propre compte."`.
- Le **hash du mot de passe n'apparaît plus jamais** dans une réponse, `POST /users/register` compris.
- **Format du pseudo (`uniqueName`)** à l'inscription et au changement de pseudo :
  - 3 à 30 caractères ;
  - **uniquement des lettres sans accent, des chiffres, `_` et `.`** ;
  - pas de point au début ni à la fin, pas d'espace.

  Sinon : `400` avec le message `Le pseudo ne peut contenir que des lettres sans accent, des chiffres, « _ » et « . » (pas au début ni à la fin), sans espace.`

  Le formulaire d'inscription et `edit-profile.tsx` devraient valider ce format avant l'envoi, avec cette regex sur la valeur en minuscules : `^[a-z0-9_](?:[a-z0-9_.]*[a-z0-9_])?$`. Des comptes existants peuvent avoir un pseudo qui ne respecte pas la règle. Ils peuvent modifier le reste de leur profil, mais **pas renvoyer ce pseudo** : `edit-profile.tsx` ne l'envoie déjà que s'il a changé, il faut garder ce comportement.
- Longueurs maximales : `displayName` 50, `uniqueName` 30, `email` 254, `password` 72 caractères.

### 2.2 Exercices

- **Les variantes d'exercices ont été renommées avec leur équipement** : « Squat » devient « Squat (Bodyweight) », « Squat (Barbell) », etc., et « Deadlift » devient « Deadlift (Smith Machine) », « Deadlift (Barbell) », etc.
  - Format : `Nom (Équipement)` ou `Nom (Qualificatif, Équipement)`, par exemple « Bench Press (Incline, Dumbbell) ».
  - Libellés d'équipement : Barbell, Dumbbell, Machine, Plate Loaded, Smith Machine, Cable, Kettlebell, Band, Bodyweight.
  - Le catalogue passe de 294 à 429 exercices. Nouveaux, entre autres : « Bench Press (Barbell) », « Squat (Barbell) », « Deadlift (Barbell) ».
  - Les **ids des exercices existants ne changent pas** : les séances, programmes et exercices créés par les utilisateurs restent valides.
  - **À faire : invalider le cache `exercises_cache`**, par exemple en changeant la clé en `exercises_cache_v2`. Sinon l'app affiche les anciens noms et ne voit pas les nouvelles variantes.
  - Ne codez aucun nom d'exercice en dur. Utilisez les ids.
- **`GET /exercises` ne renvoie pas** `description`, `instructions` ni `image_urls`, qui sont réservés au détail pour garder la liste légère. Il renvoie `id, name, equipment_type, primary_muscle, secondary_muscles, exercise_type, image_url, createdAt`.
- **`GET /exercises/:id`** renvoie en plus :
  - `description` : texte en anglais ;
  - `instructions` : tableau d'étapes, dans l'ordre ;
  - `image_urls` : `[photo de départ, photo d'arrivée]`, ou `[]`.
- `secondary_muscles` est maintenant rempli pour la plupart des exercices. Il était toujours vide à cause d'un bug du seed, ce qui change les stats par muscle.

### 2.3 Séances et plans

- `GET /workouts/completed/:id` et `GET /workouts/planned/:id` : chaque `exercises[].exercise` contient seulement `id, name, equipment_type, primary_muscle, secondary_muscles, exercise_type, image_url, createdAt`. **La description, les consignes et les photos ne sont plus incluses**. Pour les afficher, appelez `GET /exercises/:id`.
- `GET /workouts/completed` renvoie en plus `photoUrl` et `photoThumbnailUrl` (voir 3.1).
- `POST /workouts/completed` et `PATCH /workouts/completed/:id` renvoient en plus `badges` : les records personnels battus par la séance (voir 3.3).

### 2.4 Stats par exercice

- **`PATCH /exercises/:id/stats` est supprimé** (`404`). Les stats sont calculées automatiquement à partir des séances terminées.
- **`GET /exercises/:id/stats` change de format** et répond **`404`** tant qu'aucune séance terminée ne contient l'exercice. Avant, il répondait `200` avec un corps vide. Format complet en 3.3.

### 2.5 Posts et social

- **Les posts d'un compte privé sont invisibles pour les non-abonnés** : détail, likes, liste des likes, commentaires, ajout de commentaire. Réponse `404` (le même statut que pour un post inexistant). Les écrans actuels ne montrent déjà que des posts visibles, mais gérez proprement ce `404`.
- `POST /posts` :
  - `404 "Workout not found"` si la séance n'appartient pas à l'utilisateur ;
  - **`400 "Ce workout est déjà publié."`** si elle est déjà publiée (avant : `500`).
- **Les listes renvoient `avatarThumbnailUrl`, et plus `avatarUrl`**. C'est le cas de la recherche, des followers, following, demandes d'abonnement, recommandations, likes, commentaires, fils, et de l'auteur d'un post. C'est une miniature de 128 px, ou l'avatar complet si l'utilisateur n'a pas de miniature. Le profil et `GET /users/:id` renvoient les deux champs.
- Les fils et le profil ne comptent plus les commentaires masqués par modération, comme le faisait déjà le détail d'un post.

---

## 3. Nouvelles fonctionnalités

### 3.1 Photos : photo de profil et photo de séance

**Routes**

| Méthode et route | Rôle | Réponse |
| --- | --- | --- |
| `PUT /users/me/avatar` | Définit ou remplace sa photo de profil | `{ avatarUrl, avatarThumbnailUrl }` |
| `DELETE /users/me/avatar` | Retire sa photo de profil | `{ avatarUrl: null, avatarThumbnailUrl: null }` |
| `PUT /workouts/completed/:id/photo` | Définit ou remplace la photo d'une de ses séances | `{ photoUrl, photoThumbnailUrl }` |
| `DELETE /workouts/completed/:id/photo` | Retire la photo de la séance | `{ photoUrl: null, photoThumbnailUrl: null }` |

Une seule photo par séance. Le flux est : créer la séance (`POST /workouts/completed`), puis envoyer la photo avec l'id reçu. Sur la séance de quelqu'un d'autre : `404`.

**Envoi** : `multipart/form-data`, **un seul fichier dans le champ `photo`**, aucun autre champ.

```ts
// Ne pas passer par le helper `request` de services/api.ts : il force
// Content-Type: application/json et fait JSON.stringify du body.
async function uploadPhoto(path: string, uri: string, token: string) {
  const form = new FormData();
  form.append("photo", { uri, name: "photo.jpg", type: "image/jpeg" } as any);
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    // Ne pas fixer Content-Type : fetch ajoute lui-même le boundary multipart.
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(/* même extraction de message que api.ts */);
  return data;
}
// uploadPhoto("/users/me/avatar", uri, token)
// uploadPhoto(`/workouts/completed/${workoutId}/photo`, uri, token)
```

**Contraintes et erreurs** (messages en français) :

| Cas | Statut |
| --- | --- |
| Aucun fichier, ou envoi en JSON | `400` « Aucune photo reçue… » |
| Mauvais nom de champ, plusieurs fichiers, champs en plus | `400` « Envoyez une seule photo, dans le champ « photo »… » |
| Fichier illisible ou tronqué | `400` « Le fichier envoyé n'est pas une image lisible. » |
| Plus de 10 Mo | `413` « Photo trop lourde : 10 Mo au maximum. » |
| Plus de 50 mégapixels | `413` |
| Format autre que JPEG, PNG ou WebP (HEIC, GIF, SVG, AVIF…) | `415` |
| Plus de 10 envois par minute | `429` |

- **iPhone : convertir en JPEG avant l'envoi**. Les photos HEIC sont refusées (`415`). Utilisez par exemple `expo-image-manipulator` : `manipulateAsync(uri, [{ resize: { width: 2000 } }], { compress: 0.8, format: SaveFormat.JPEG })`. Réduire à environ 2000 px avant l'envoi accélère aussi l'upload et économise les données mobiles. Le serveur réduit de toute façon à 1600 px.
- Avant la mise à jour de la config nginx, une photo de plus de 1 Mo peut recevoir un `413` en **HTML** venant de nginx. Le parsing JSON échouera dans ce cas : gérez une réponse non JSON comme une erreur générique.

**Ce que fait le serveur** :
- l'avatar devient un carré de 512 px, plus une miniature de 128 px ;
- la photo de séance est réduite à 1600 px de côté au maximum, plus une miniature de 600 px ;
- tout est réencodé en WebP ;
- les **métadonnées sont supprimées**, position GPS comprise ;
- l'orientation est corrigée.

**URL des photos** :
- **En production, les photos sont stockées dans Supabase Storage** et l'API renvoie des URL absolues, de la forme `https://<projet>.supabase.co/storage/v1/object/public/photos/avatars/<uuid>.webp`. L'app les charge directement depuis Supabase, sans passer par l'API.
- En développement, sans configuration Supabase, le serveur stocke sur disque et renvoie un chemin relatif `/uploads/...`. Pour gérer les deux cas : `url.startsWith("http") ? url : BASE_URL + url`.
- Elles sont publiques (pas de token à envoyer) et **ne changent jamais de contenu** : une nouvelle photo a une nouvelle URL. L'app peut les mettre en cache sans limite de durée. Avec `expo-image`, utilisez `cachePolicy="disk"`.
- WebP est affiché nativement par `Image` et `expo-image` sur iOS et Android.

**Quelle URL afficher, et où** :

| Contexte | Champ |
| --- | --- |
| Listes : recherche, followers, likes, commentaires, fils, auteur d'un post | `avatarThumbnailUrl` |
| Écran de profil (grand avatar) | `avatarUrl` |
| Historique des séances, fils, posts du profil | `photoThumbnailUrl` / `workoutPhotoThumbnailUrl` |
| Écran de détail d'une séance ou d'un post | `photoUrl` / `workoutPhotoUrl` |

Sans photo, tous ces champs valent `null` : gardez l'affichage actuel (initiales, etc.).

**Où brancher** :
- `profile/edit-profile.tsx` et `profile/index.tsx` affichent aujourd'hui les initiales. Il faut afficher l'avatar s'il existe, et ajouter « Changer la photo » et « Retirer la photo ».
- `WorkoutImagePicker` (`createWorkout.tsx` / `createWorkoutPrev.tsx`) récupère une image mais **ne l'envoie nulle part**. Il faut l'envoyer après la création de la séance terminée.

### 3.2 Contenu des exercices

Dans `GET /exercises/:id` :
- `description` et `instructions` sont en anglais, comme les noms ;
- `image_urls` contient deux photos, départ puis arrivée. **Les afficher en alternance (toutes les 0,6 à 0,8 s) anime le mouvement**, à la manière d'un GIF ;
- 273 exercices sur 429 ont des photos ; les autres ont `image_urls: []` et `image_url: ""`.

Les images viennent de GitHub (free-exercise-db) avec une URL figée : mettez-les en cache.

### 3.3 Stats par exercice et badges de record personnel

**Stats d'un exercice**, mises à jour automatiquement à chaque séance créée, modifiée ou supprimée :

| Méthode et route | Rôle |
| --- | --- |
| `GET /exercises/stats` | Tous les exercices pratiqués, du plus récent au plus ancien |
| `GET /exercises/:id/stats` | Un exercice. `404` « Aucune statistique pour cet exercice… » s'il n'a jamais été pratiqué |

Format :

```ts
{
  exerciseId, exerciseName, primaryMuscle,
  lastPerformedAt: string | null,
  lastWeight: number | null, lastReps: number | null, // série la plus lourde de la dernière séance
  lastSets: { reps: number, weight: number }[],       // toutes les séries de la dernière séance
  prWeight: number | null, prReps: number | null,     // charge max, et répétitions faites à cette charge
  bestEstimatedOneRepMax: number | null,              // 1RM estimé (formule d'Epley)
  bestSessionVolume: number | null,                   // reps x poids sur une séance
  maxReps: number | null,                             // max de répétitions sans charge
  totalSessions, totalSets, totalReps, totalVolume,
  updatedAt,
}
```

**Badges** :
- `GET /badges?exerciseId=&type=&limit=` liste les badges de l'utilisateur, du plus récent au plus ancien. `limit` vaut 50 par défaut, 100 au maximum.
- `POST /workouts/completed` et `PATCH /workouts/completed/:id` renvoient **`badges`**, la liste des records battus par cette séance. **C'est là qu'il faut afficher « Nouveau record ! »** après l'enregistrement, sans requête supplémentaire.

```ts
{
  id, type: "heaviest_weight" | "best_estimated_1rm" | "best_session_volume" | "most_reps",
  exercise: { id, name }, workoutId,
  unit: "kg" | "reps",
  value, previousValue, improvement, improvementPct,
  weight: number | null, reps: number | null, // la série du record
  achievedAt,
}
```

Règles à connaître pour l'affichage :
- pas de badge sur la première séance d'un exercice, car il n'y a pas de valeur à battre ;
- une égalité ne compte pas ;
- une séance peut donner plusieurs badges : c'est souvent le cas pour charge max et 1RM, à regrouper visuellement si besoin ;
- modifier une séance réévalue ses badges, et la supprimer les supprime.

### 3.4 Nouvelles stats (module `stats`)

Toutes ces routes sont authentifiées et ne renvoient que les données de l'appelant. Les formats complets sont dans Swagger.

| Route | Rôle |
| --- | --- |
| `GET /stats/progression?exerciseId=&metric=volume\|1rm&period=1m\|3m\|6m\|1y\|all` | Courbe d'un exercice, un point par jour d'entraînement, avec tendance. Par défaut `volume` sur `3m`. Les exercices au poids du corps n'ont pas de points |
| `GET /stats/records` | Records par exercice (1RM, charge max, volume), séance la plus longue, séance au plus gros volume, plus longue série de jours consécutifs |
| `GET /stats/adherence?completedWorkoutId=&plannedWorkoutId=` | Séance réalisée comparée à un plan : statut par exercice, score de 0 à 100, note |
| `GET /stats/comparisons?period=week\|month&date=` | Période en cours comparée à la moyenne personnelle, proratisée selon la part déjà écoulée de la période (`elapsedPct`). `baseline` vaut `null` sans historique suffisant |
| `GET /stats/workout-type-breakdown?period=week\|month&date=` | Répartition par type d'exercice et par équipement |
| `GET /stats/heatmap?year=` | Calendrier annuel, niveau d'intensité de 1 à 4 par jour actif |

Les jours sont calculés en UTC.

### 3.5 Pagination de l'historique

`GET /workouts/completed?limit=20`, puis `&before=<id de la dernière séance reçue>` pour la page suivante. Une page vide signifie la fin de l'historique.
- `limit` va de 1 à 100. Hors de cette plage : `400`.
- Sans paramètre, tout l'historique est renvoyé, comme avant.
- Recommandé dès que l'historique peut dépasser quelques dizaines de séances : la réponse complète pèse environ 75 ko pour 300 séances.

### 3.6 Partenaires de séance (`@` dans un post)

- Un post affiche le titre et la description de sa séance. **Chaque `@pseudo` qui s'y trouve identifie l'utilisateur comme partenaire du post**, à condition qu'il **suive l'auteur**.
- Ce qui n'identifie personne et reste du texte :
  - un pseudo inconnu ;
  - un utilisateur qui ne suit pas l'auteur ;
  - l'auteur lui-même ;
  - une adresse e-mail.
- Les majuscules ne comptent pas, et un point final est ignoré (`merci @paul.`). Maximum 10 partenaires, les premiers mentionnés.
- Champ **`partners`** dans `POST /posts`, le détail d'un post, les fils following et top, `GET /posts/mine` et les posts du profil :

  ```ts
  partners: { id, uniqueName, displayName, avatarThumbnailUrl }[]
  ```

- Les partenaires suivent les modifications du titre ou de la description de la séance (`PATCH /workouts/completed/:id`). Un partenaire qui se désabonne de l'auteur disparaît du post.
- **`DELETE /posts/:postId/partners/me`** retire l'utilisateur connecté des partenaires d'un post. Réponse : `{ declined: true }`, ou `404 « Vous n'êtes pas identifié sur ce post. »`. C'est définitif pour ce post.

À faire côté app :
- afficher les partenaires sous le post (« avec @paul, @julie ») ;
- rendre cliquables les `@pseudo` du titre et de la description **qui figurent dans `partners`** : ce sont les seuls fiables, les autres restent du texte ;
- ajouter « Me retirer » quand l'utilisateur connecté fait partie des partenaires ;
- **en option, proposer une autocomplétion des `@`** dans le titre et la description de la séance, à partir des abonnés de l'utilisateur (`GET /connections/:id/followers`), puisque seuls eux peuvent être identifiés.

### 3.7 Compteurs des posts

`likesCount` et `commentsCount` sont maintenant des compteurs tenus à jour par le serveur. Le format ne change pas. Après un like ou un commentaire, l'app peut mettre à jour son affichage localement (+1 / -1) : la valeur serveur sera la même au prochain chargement.

---

## 4. Référence des réponses modifiées

Champs ajoutés en **gras**, champs retirés ~~barrés~~.

| Route | Champs |
| --- | --- |
| `GET /users/:id` (autre utilisateur) | `id, displayName, uniqueName, isPublic,` **`avatarUrl, avatarThumbnailUrl`** ~~email, birthDate, height, weight, createdAt~~ |
| `GET /users/:id` (soi-même) | compte complet + **`avatarUrl, avatarThumbnailUrl`**, sans `password` |
| `GET /users/:id/profile` | `id, displayName, uniqueName,` **`avatarUrl, avatarThumbnailUrl`**`, followersCount, followingCount, workoutsCount, postsCount, followStatus, isPrivate, posts[]`. Chaque post : `id, createdAt,` **`workoutPhotoThumbnailUrl`**`, likesCount, commentsCount, isLiked,` **`partners`** |
| `GET /users/search?q=` | `id, uniqueName, displayName,` **`avatarThumbnailUrl`** |
| `GET /connections/:id/followers`, `/following`, `/recommendations` | `id, uniqueName, displayName,` **`avatarThumbnailUrl`** (+ `score` ou `followersCount` selon la source des recommandations) |
| `GET /connections/requests` | clés brutes `request_id, request_createdAt, user_id, user_displayName, user_uniqueName,` **`user_avatarThumbnailUrl`** |
| `GET /posts/:postId` | `id, createdAt, userId, displayName, uniqueName,` **`avatarThumbnailUrl`**`, workoutId, workoutTitle, workoutDescription, workoutCompletionDate, workoutDurationSeconds,` **`workoutPhotoUrl, workoutPhotoThumbnailUrl`**`, likesCount, commentsCount, isLiked,` **`partners`** |
| `GET /posts/feed/following` | `id, createdAt, displayName,` **`avatarThumbnailUrl, workoutPhotoThumbnailUrl`**`, likesCount, commentsCount, isLiked,` **`partners`** |
| `GET /posts/feed/top` | idem + `score` |
| `GET /posts/mine` | `id, createdAt, workoutId, workoutTitle, workoutCompletionDate,` **`workoutPhotoUrl, workoutPhotoThumbnailUrl`**`, likesCount, commentsCount,` **`partners`** |
| `GET /posts/:postId/likes` | `id, displayName, uniqueName,` **`avatarThumbnailUrl`**`, createdAt` |
| `GET /posts/:postId/comments` | `id, content, createdAt, userId, displayName,` **`avatarThumbnailUrl`** |
| `POST /posts` | post créé + **`partners`** |
| `GET /workouts/completed` | `id, title, description, completionDate, totalDurationSeconds,` **`photoUrl, photoThumbnailUrl`**`, totalExercises` |
| `GET /workouts/completed/:id` | `{ workout, totalExercises }`. `workout` contient en plus **`photoUrl, photoThumbnailUrl`**. Dans `exercises[].exercise` : ~~`description, instructions, image_urls`~~ |
| `GET /workouts/planned/:id` | `exercises[].exercise` : ~~`description, instructions, image_urls`~~ |
| `POST /workouts/completed`, `PATCH /workouts/completed/:id` | séance + **`badges`** |
| `GET /exercises` | inchangé (noms renommés) |
| `GET /exercises/:id` | + **`description, instructions, image_urls`** |
| `GET /exercises/:id/stats` | nouveau format (3.3), `404` si aucune donnée |

**Nouvelles routes** :
- `PUT` et `DELETE /users/me/avatar`
- `PUT` et `DELETE /workouts/completed/:id/photo`
- `GET /exercises/stats`
- `GET /badges`
- `GET /stats/progression`, `/records`, `/adherence`, `/comparisons`, `/workout-type-breakdown`, `/heatmap`
- `DELETE /posts/:postId/partners/me`
- `GET /uploads/...` : fichiers des photos, **en développement seulement**. En production, ils sont servis par Supabase.

**Route supprimée** : `PATCH /exercises/:id/stats`.

---

## 5. Optimisations côté app

L'egress (données sortantes) est la ressource la plus limitée du plan gratuit de Supabase. Ces points comptent :

1. **`explore/workout-detail.tsx` retélécharge tout le catalogue** (`GET /exercises`) à chaque ouverture. Il faut utiliser `getAllExercises()` (cache local) comme les autres écrans.
2. **Afficher les miniatures dans les listes et les fils** (tableau en 3.1), pas les photos complètes. C'est le plus gros gain sur la bande passante.
3. **Paginer l'historique** (3.5).
4. Mettre les photos en cache disque. Leurs URL sont immuables.
5. Réduire les photos à environ 2000 px en JPEG avant l'envoi (3.1).

---

## 6. Checklist d'intégration

- [ ] Le `401` après expiration du token (7 jours) renvoie vers la connexion.
- [ ] `429` sur le login : message dédié.
- [ ] Formulaires d'inscription et de profil : validation du format du pseudo, et pas de renvoi du pseudo inchangé.
- [ ] Écrans d'un autre utilisateur : ne plus lire email, date de naissance, taille et poids.
- [ ] Clé de cache du catalogue changée (`exercises_cache_v2`), aucun nom d'exercice en dur.
- [ ] Écran d'un exercice : `GET /exercises/:id` pour la description, les consignes et l'animation des deux photos.
- [ ] Détail d'une séance ou d'un plan : ne plus lire `description`, `instructions` ni `image_urls` dans `exercises[].exercise`.
- [ ] Plus d'appel à `PATCH /exercises/:id/stats`. `GET /exercises/:id/stats` : nouveau format, et gestion du `404`.
- [ ] Après `POST` ou `PATCH` d'une séance terminée : afficher `badges` (« Nouveau record ! »).
- [ ] Écrans de stats : nouvelles routes de 3.4 si souhaité. `GET /exercises/stats` et `GET /badges` pour un écran « Mes records ».
- [ ] Photos : envoi en multipart (champ `photo`, conversion HEIC vers JPEG), affichage avatar et photo de séance, URL relatives ou absolues, `null` géré.
- [ ] Listes : `avatarThumbnailUrl` à la place de `avatarUrl`.
- [ ] Posts : `partners` affichés, `@` cliquables, « Me retirer », `404` des posts privés géré.
- [ ] `POST /posts` : message « Ce workout est déjà publié. » sur `400`.
- [ ] Historique paginé.
- [ ] `workout-detail.tsx` utilise le cache du catalogue.
- [ ] Une réponse non JSON (`413` en HTML de nginx) est traitée comme une erreur générique.

---

## 7. Nouveautés de la branche `feat/backend-v3`

Tous les détails des routes sont aussi dans Swagger (`GET /api`). Les erreurs gardent le format habituel : `{ statusCode, message: { message, ... } }`.

### 7.1 Le fil populaire n'affiche plus mes propres posts

`GET /posts/feed/top` exclut les posts de l'utilisateur connecté. Rien à changer côté app.

### 7.2 Exercices et stats de la séance dans les fils

Chaque post de `GET /posts/feed/following`, `GET /posts/feed/top`, `GET /posts/mine` et des `posts` de `GET /users/:id/profile` contient maintenant :

```json
{
  "workoutId": "uuid",
  "exercises": [
    { "exerciseId": "uuid", "name": "Bench Press (Barbell)", "sets": 4, "bestSet": { "reps": 6, "weight": 85 } }
  ],
  "stats": { "durationSeconds": 3600, "totalVolume": 6400, "totalSets": 15, "totalReps": 120, "recordsCount": 2 }
}
```

- `bestSet` : la série la plus lourde, et à poids égal celle avec le plus de reps. `null` pour un exercice sans série. Poids `0` = poids du corps.
- `recordsCount` : nombre de records personnels battus pendant la séance.
- Les séries complètes ne sont pas dans les fils : elles sont dans le détail (7.3).
- `workoutId` est nouveau dans `feed/following`, `feed/top` et les posts du profil.

### 7.3 Détail de la séance d'un post : `GET /posts/:postId/workout`

C'est la route de la spec front, livrée telle quelle.

- **Visibilité** : la même que `GET /posts/:postId` (l'auteur, tout le monde pour un compte public, les abonnés pour un compte privé). Sinon `404` avec le message `Post not found`.
- **Accès** : uniquement par le post. Une séance non publiée reste inaccessible.
- **Réponse** : `{ workoutId, totalExercises, exercises, stats }`.
  - `exercises` a exactement le format de `GET /workouts/completed/:id`.
  - `stats` contient `{ estimatedCalories, totalVolume, totalSets, totalReps, realLifeComparison }`.
- **Calories** : pour un autre que l'auteur, elles sont calculées pour un poids de corps par défaut de 70 kg. Avec le poids de l'auteur, elles révéleraient son poids. L'auteur voit les mêmes calories que dans `GET /stats/workout/:id`.
- **Point à trancher de la spec** : un post sans séance renvoie `404 Post not found`. L'API ne peut pas créer un tel post.
- **Erreurs** : `400` avec le message `Identifiant invalide` pour un id mal formé, `401` sans token.
- **Correction de la spec** : `GET /workouts/completed/:id` ne filtre pas sur le propriétaire. Cette lecture est ouverte par choix. La nouvelle route reste la bonne pour les posts, car elle respecte la confidentialité des comptes privés.

### 7.4 Comparaisons avec la vie réelle

Le champ `realLifeComparison` vaut `{ "object": "car", "count": 3.2 }` ou `null`. L'app traduit `object`. `count` vaut toujours 1 ou plus, avec une décimale.

Où il apparaît :
- `GET /stats/workout/:id` et `stats` de `GET /posts/:postId/workout` : à partir du volume total de la séance ;
- les badges (`GET /badges`, `badges` après `POST` ou `PATCH /workouts/completed`) : seulement pour `heaviest_weight` (la charge) et `best_session_volume` (le volume). Il vaut `null` pour le 1RM estimé (jamais réellement soulevé) et pour les reps.

Il vaut aussi `null` sous 7 kg.

Clés à traduire, avec leur poids de référence :

| Clé | Poids | Clé | Poids |
| --- | --- | --- | --- |
| `bowling_ball` | 7 kg | `car` | 1,5 t |
| `golden_retriever` | 30 kg | `white_rhinoceros` | 2,3 t |
| `washing_machine` | 70 kg | `african_elephant` | 6 t |
| `giant_panda` | 100 kg | `school_bus` | 11 t |
| `upright_piano` | 230 kg | `boeing_737` | 41 t |
| `horse` | 500 kg | `statue_of_liberty` | 225 t |

L'objet choisi est le plus lourd que la charge atteint au moins une fois. Exemple : 9,2 t donne `{ "object": "african_elephant", "count": 1.5 }`.

### 7.5 Comparer ses stats à celles d'une personne suivie

`GET /exercises/:id/stats/compare/:userId`

```json
{
  "exercise": { "id": "uuid", "name": "Bench Press (Barbell)" },
  "me": { "heaviestWeight": 90, "estimatedOneRepMax": 101.3, "bestSessionVolume": 2880, "maxReps": null, "totalSessions": 26, "lastPerformedAt": "..." },
  "user": { "id": "uuid", "uniqueName": "paul.martin", "displayName": "Paul Martin", "avatarThumbnailUrl": null },
  "them": { "heaviestWeight": 80, "...": "..." }
}
```

- `me` : toutes mes séances.
- `them` : **uniquement les séances que la personne a publiées**. Ses séances non postées ne comptent jamais.
- `null` quand l'exercice n'a jamais été fait (ou jamais publié, pour `them`).
- Erreurs : `403` si je ne suis pas cette personne, `400` si `userId` est moi-même, `404` pour un exercice inconnu.

### 7.6 Dupliquer une séance

Les deux routes créent une **séance planifiée** chez moi, avec le même titre et les mêmes exercices dans le même ordre. Elles ne copient ni les séries, ni les charges, ni la description. La réponse a le format de `GET /workouts/planned/:id` : `{ workout, totalExercises }`, avec `sets: null` sur chaque exercice.

- `POST /workouts/planned/from-post/:postId` : depuis n'importe quel post que je peux voir. Sinon `404`.
- `POST /workouts/planned/from-completed/:id` : depuis une de mes séances terminées. `404` si ce n'est pas la mienne.

### 7.7 Groupes

Règles :
- **Inviter** : n'importe quel membre peut inviter par pseudo (avec ou sans `@`), à condition que l'invitant et l'invité **se suivent mutuellement**. L'invité doit accepter.
- **Taille** : 20 membres au plus, créateur compris. Les invitations en attente comptent dans la limite.
- **Renommer** : n'importe quel membre.
- **Supprimer** : seulement le créateur.
- **Partir** : n'importe quel membre. Si le créateur part, le membre le plus ancien devient créateur. Le dernier à partir supprime le groupe.
- **Compte supprimé** : la suppression du compte du créateur supprime ses groupes.
- **Confidentialité** : un groupe dont je ne suis pas membre répond `404`.

| Route | Rôle | Réponse |
| --- | --- | --- |
| `POST /groups` `{ name }` | créer (1 à 50 caractères) | détail du groupe |
| `GET /groups` | mes groupes | `[{ id, name, creatorId, createdAt, joinedAt, memberCount }]` |
| `GET /groups/:id` | détail | `{ id, name, creatorId, createdAt, members: [{ id, uniqueName, displayName, avatarThumbnailUrl, joinedAt }], invitations: [{ id, createdAt, invitee: {...}, invitedById }] }` |
| `PATCH /groups/:id` `{ name }` | renommer | détail |
| `DELETE /groups/:id` | supprimer (`403` si pas créateur) | `{ deleted: true }` |
| `POST /groups/:id/invitations` `{ uniqueName }` | inviter | invitations en attente du groupe |
| `GET /groups/invitations` | invitations reçues | `[{ id, createdAt, group: { id, name, memberCount }, invitedBy: {...} }]` |
| `POST /groups/invitations/:invitationId/accept` | accepter | détail du groupe |
| `DELETE /groups/invitations/:invitationId` | refuser | `{ declined: true }` |
| `DELETE /groups/:id/members/me` | partir | `{ left: true }` |
| `POST /groups/:id/shares` `{ postId }` | envoyer un post dans le groupe | `{ id, postId, createdAt }` |
| `DELETE /groups/:id/shares/:shareId` | retirer un post que j'ai envoyé | `{ deleted: true }` |
| `GET /groups/:id/activity?limit=20&before=...` | fil du groupe | voir ci-dessous |

Erreurs à l'invitation :
- `403` : vous ne vous suivez pas mutuellement ;
- `404` : pseudo inconnu ;
- `409` : déjà membre, déjà invité, ou groupe complet.

**Envoyer un post dans le groupe** : n'importe quel membre peut envoyer un post, d'une autre personne ou le sien, à condition de pouvoir le voir (même règle que `GET /posts/:postId`).
- Un même post n'est envoyé qu'une fois par groupe : `409` la deuxième fois.
- `404` pour un post invisible ou inexistant, ou si je ne suis pas membre. `400` (`Identifiant invalide`) pour un `postId` mal formé.
- **Confidentialité** : le post envoyé n'apparaît dans le fil du groupe que pour les membres qui ont le droit de le voir. Le post d'un compte privé n'est visible que des membres qui suivent ce compte.
- Seule la personne qui l'a envoyé peut le retirer. Il disparaît aussi si le post est supprimé, ou si cette personne quitte le groupe.
- Bouton à prévoir sur un post : « Envoyer dans un groupe », avec le choix parmi `GET /groups`.

**Fil du groupe** : deux sortes d'événements, de la plus récente à la plus ancienne, distinguées par `type`.
- `workout` : une séance qu'un membre a **publiée après être entré dans le groupe**, avec ses records. Les séances non publiées n'apparaissent jamais.
- `share` : un post qu'un membre a envoyé dans le groupe. `user` est la personne qui l'a envoyé, `author` l'auteur du post.

```json
[{
  "type": "workout",
  "postId": "uuid", "at": "2026-10-29T18:05:00.000Z",
  "user": { "id": "uuid", "uniqueName": "paul.martin", "displayName": "Paul Martin", "avatarThumbnailUrl": null },
  "workout": { "id": "uuid", "title": "Push" },
  "records": [{ "exercise": { "id": "uuid", "name": "Bench Press (Barbell)" }, "type": "heaviest_weight", "value": 100, "unit": "kg" }]
}, {
  "type": "share",
  "shareId": "uuid", "postId": "uuid", "at": "2026-10-29T17:40:00.000Z",
  "user": { "id": "uuid", "uniqueName": "julie.roux", "...": "..." },
  "author": { "id": "uuid", "uniqueName": "hugo.blanc", "...": "..." },
  "workout": { "id": "uuid", "title": "Leg day" }
}]
```

- `workout` : l'app affiche « Paul s'est entraîné », et « Paul a battu son record de … » pour chaque `records[]`.
- `share` : l'app affiche « Julie a partagé la séance de Hugo », qui ouvre le post (`postId`).
- Page suivante : `before` = le `at` du dernier événement reçu.
- Il n'y a pas de notification push : l'app consulte le fil.

### 7.8 Cards de partage

Elles sont entièrement côté app : dessiner la card puis la capturer en image, par exemple avec `react-native-view-shot`, et l'ouvrir dans le partage natif.

Données disponibles :
- `GET /posts/:postId/workout`, ou `GET /stats/workout/:id` pour ses propres séances : séries, totaux, comparaison avec la vie réelle ;
- les `badges` de la séance pour ses records.

### 7.9 Suivre un programme

Un programme (liste de jours, repos compris) peut maintenant être « commencé ». Un seul est suivi à la fois.

- **`POST /programmes/:id/start`** `{ startDate?: "2026-10-30" }` démarre un de mes programmes. `startDate` est le jour 1, aujourd'hui par défaut. Le programme remplace celui suivi jusque-là. La réponse est la même que la route suivante, pour le jour de départ.
- **`GET /programmes/active/today?date=2026-10-30`** renvoie la séance prévue pour ce jour :
  - le jour se compte **au calendrier** : le jour de départ est le jour 1, le lendemain le jour 2, qu'on se soit entraîné ou non ;
  - après le dernier jour, le programme **recommence** au jour 1, et `cycle` compte les tours.

```json
{
  "programme": { "id": "uuid", "title": "Programme Push Pull Legs" },
  "startedOn": "2026-10-26", "date": "2026-10-28", "cycleLength": 7,
  "status": "workout", "dayNumber": 3, "cycle": 1,
  "workout": { "id": "uuid", "title": "Legs", "description": "...", "exercises": [ ... ] }
}
```

- `status` peut prendre trois valeurs :
  - `workout` : la séance du jour est dans `workout`, au format de `GET /workouts/planned/:id` (le champ `workout` de cette route) ;
  - `rest` : jour de repos, `workout` vaut `null` ;
  - `not_started` : la date est avant le départ, avec `daysUntilStart`.
- **Envoyez toujours `date`, la date locale de l'utilisateur** (`AAAA-MM-JJ`). Sans elle, c'est la date UTC qui sert. En France, entre minuit et 1 h ou 2 h du matin, ce serait encore la veille. Même conseil pour `startDate`.
- Erreurs :
  - `404` `Aucun programme en cours.` si rien n'est commencé ;
  - `404` pour démarrer le programme de quelqu'un d'autre ;
  - `400` pour une date qui n'est pas au format `AAAA-MM-JJ`.
- Supprimer le programme suivi l'arrête. Une séance planifiée supprimée transforme son jour en jour de repos.
- Il n'y a pas de route pour arrêter un programme sans le supprimer : ce n'était pas demandé.

### 7.10 Suggérer une séance selon les muscles délaissés

**`GET /workouts/planned/suggestion?period=week&date=2026-10-30`** choisit, parmi mes séances planifiées, celle qui travaille le plus les muscles **les moins entraînés sur la période**. La période est la semaine en cours par défaut, ou le mois avec `period=month`.

```json
{
  "period": "week", "rangeStart": "...", "rangeEnd": "...",
  "workedMuscles": [{ "muscle": "quads", "effectiveSets": 12.5 }],
  "suggestion": {
    "workout": { "id": "uuid", "title": "Push", "description": null, "totalExercises": 6 },
    "score": 1,
    "muscles": [{ "muscle": "triceps", "plannedSets": 7, "workedSets": 0 }]
  },
  "alternatives": [ { "...": "même format, les deux suivantes" } ]
}
```

- `workedMuscles` : séries effectives par muscle sur la période (1 par série pour le muscle principal, 0,5 pour un secondaire). C'est le même calcul que `GET /stats/muscle-distribution`.
- `score` va de 0 à 1. Il vaut 1 quand aucun des muscles de la séance n'a été travaillé sur la période.
- `muscles` donne le pourquoi : les muscles de la séance, du moins entraîné au plus entraîné. Exemple d'affichage : « Triceps : 0 série cette semaine ».
- `suggestion` vaut `null` si je n'ai aucune séance planifiée.

### 7.11 Checklist

- [ ] Fil populaire : rien à faire (mes posts n'y sont plus).
- [ ] Cartes de post : afficher `exercises` (nom, séries, meilleure série) et `stats`.
- [ ] `userPost.tsx` : un seul appel à `GET /posts/:postId/workout` pour tous les posts.
- [ ] Traduire les clés de `realLifeComparison` (7.4) et l'afficher sur le résumé de séance et sur les badges de charge et de volume.
- [ ] Écran d'un exercice : bouton « Comparer avec… » parmi les personnes suivies (gérer `403`).
- [ ] « Dupliquer » sur un post et sur mes séances terminées, puis ouvrir la séance planifiée créée.
- [ ] Groupes : liste, création, invitations (reçues et envoyées), fil d'activité (`type` `workout` et `share`), départ, suppression par le créateur.
- [ ] « Envoyer dans un groupe » sur un post (gérer `409` déjà partagé), et « Retirer » sur mes partages dans le fil.
- [ ] Cards de partage (7.8).
- [ ] Bouton « Commencer ce programme » (`POST /programmes/:id/start`), et carte « Séance du jour » (`GET /programmes/active/today?date=` avec la date locale) : séance, repos ou départ à venir.
- [ ] « Que faire aujourd'hui ? » : `GET /workouts/planned/suggestion` avec la raison (`muscles`) et les alternatives.

---

## 8. Corrections de l'audit front (branche `feat/backend-v3`)

Une entrée par tâche de l'audit (B-xx).

### B-04 Route de santé

- `GET /health` → `200 { status: "ok", database: "ok" }`. Elle exécute un `SELECT 1` sur la base. Pas de token ni de limite de débit. Elle répond `503 { status: "error", database: "unreachable" }` si la base ne répond pas. **C'est la route à utiliser pour `checkServerHealth`.**
- `GET /` → `200 { status: "ok" }`, sans vérifier la base. Elle répondait `Hello World!` avant, ou `404` sur le backend périmé.

### B-01 Charges décimales

- `weight` accepte maintenant **jusqu'à 2 décimales**, de 0 à 1000 kg, dans les séances terminées et planifiées (création et modification). Exemples : `62.5`, `1.25`. Les `reps` restent entières.
- 3 décimales, une charge négative ou une charge au-dessus de 1000 kg donnent un `400`.
- Les charges sont relues telles quelles. Volume, 1RM, records, badges et stats sont calculés sans arrondi de la charge (résultats arrondis à 2 décimales).
- Côté app : autoriser la virgule et le point dans le champ de charge, et envoyer un nombre (pas une chaîne).

### B-02 Erreurs de validation structurées

Un `400` de validation a maintenant ce format, **au premier niveau** :

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Adresse e-mail invalide.",
  "errors": [
    { "field": "email", "code": "EMAIL_INVALID", "message": "Adresse e-mail invalide." },
    { "field": "password", "code": "PASSWORD_TOO_SHORT", "message": "Le mot de passe doit contenir au moins 8 caractères." }
  ]
}
```

- `message` est une chaîne : le premier message, en français. `extractMessage` le lit déjà sans changement.
- `errors[].code` est stable : c'est lui qu'il faut traduire. La liste complète est dans `backend/README.md`, section « Validation errors ». Les plus utiles : `EMAIL_INVALID`, `PASSWORD_TOO_SHORT`, `USERNAME_INVALID`, `FIELD_TOO_LONG`, `FIELD_REQUIRED`, `FIELD_NOT_ALLOWED`, `NUMBER_INVALID`, `VALUE_TOO_LARGE`.
- `errors[].field` donne le chemin du champ, y compris imbriqué (`exercises.0.sets.1.weight`), pour afficher l'erreur sous le bon champ.
- Les autres erreurs (`401`, `403`, `404`, `409`, `429`…) gardent leur format `{ statusCode, message: { message, … } }`.
- Il n'y avait déjà qu'un seul `ValidationPipe` sur cette branche. Le doublon signalé par l'audit vient du backend périmé de la branche front (voir B-00).

### B-07 Longueur des commentaires

- Un commentaire fait **1 à 500 caractères**, à la création comme à la modification. La limite existait déjà côté serveur, elle est maintenant documentée et renvoie un code exploitable.
- Au-delà : `400` avec `errors: [{ field: "content", code: "FIELD_TOO_LONG", message: "« content » ne doit pas dépasser 500 caractères." }]`.
- Côté app : `maxLength={500}` sur le champ, et un compteur à l'approche de la limite.

### B-03 Résumé des séances planifiées

- `GET /workouts/planned` renvoie en plus :
  - `totalSets` : séries prévues de tous les exercices, `0` pour un exercice sans séries ;
  - `estimatedDurationMinutes` : nombre ou `null`.
- `estimatedDurationMinutes` est accepté en option dans `POST /workouts/planned` et `PATCH /workouts/planned/:id` : un entier de 1 à 600. `null` en `PATCH` l'efface. Il est aussi relu dans `GET /workouts/planned/:id`.
- Hors bornes : `400` avec le code `VALUE_TOO_SMALL`, `VALUE_TOO_LARGE` ou `INTEGER_EXPECTED`.
- Côté app : envoyer le champ « Durée estimée » du formulaire.

### B-06 Genre et objectif

- `PATCH /users/:id` accepte :
  - `gender` : `male`, `female` ou `other` ;
  - `goal` : `gain_weight`, `lose_weight`, `get_fitter`, `flexibility` ou `learn_basics`.
- Les deux sont optionnels. `null` les efface. Une autre valeur donne `400` avec le code `VALUE_NOT_ALLOWED`.
- Ils sont relus dans `GET /users/:id` **pour son propre compte uniquement**. Les autres utilisateurs ne les voient jamais.
- Côté app : envoyer les réponses de l'onboarding par `PATCH /users/:id` une fois le compte créé. L'inscription (`POST /users/register`) ne les accepte pas : l'audit ne demandait que l'édition. Dis-le si l'onboarding a lieu avant l'inscription.

### B-12 Catalogue : Bayesian Curl et cache

- « Baesyan Curl (Cable) » et « Baesyan Curl (Dumbbell) » deviennent **« Bayesian Curl (Cable) »** et **« Bayesian Curl (Dumbbell) »**. Les ids ne changent pas : historique, stats et séances restent liés.
- `GET /exercises` renvoie un `ETag` et `Cache-Control: private, no-cache`. L'app garde la liste et la revalide à chaque appel :
  - elle renvoie l'ETag reçu dans `If-None-Match` ;
  - un catalogue inchangé répond `304` sans corps : on garde la liste locale ;
  - sinon `200` avec la nouvelle liste et un nouvel ETag.
- Le cache HTTP natif d'iOS et Android applique déjà ces règles avec `fetch`. Si l'app garde son propre cache (`exercises_cache_v2`), qu'elle stocke l'ETag à côté et traite le `304`.

### B-10 Codes à la place des phrases dans les stats

`insights` reste un tableau de chaînes, mais ce sont maintenant **des codes à traduire**, plus des phrases anglaises. Les chiffres sont dans les champs voisins de la réponse.

`GET /stats/balance`, avec les chiffres `pushPullRatio` et `upperLowerRatio` :

| Code | Sens |
| --- | --- |
| `INSUFFICIENT_PULL_VOLUME` | Pas assez de tirage pour juger l'équilibre poussée/tirage |
| `PUSH_DOMINANT` | Poussée > 1,3 × tirage : ajouter du tirage |
| `PULL_DOMINANT` | Tirage dominant (ratio < 0,77) : ajouter de la poussée |
| `PUSH_PULL_BALANCED` | Équilibre poussée/tirage correct |
| `NO_LOWER_BODY_VOLUME` | Aucun volume bas du corps sur la période |
| `UPPER_BODY_DOMINANT` | Haut > 2 × bas : plus de jambes |
| `LOWER_BODY_DOMINANT` | Bas dominant (ratio < 0,5) : haut du corps peut-être négligé |

`GET /stats/comparisons`, avec les chiffres `comparison.workouts.changePct`, `comparison.volume.changePct`, `baseline.periodsConsidered` et `elapsedPct` :

| Code | Sens |
| --- | --- |
| `NOT_ENOUGH_HISTORY` | Pas encore assez d'historique pour comparer |
| `WORKOUTS_ON_TRACK` / `WORKOUTS_ABOVE_USUAL` / `WORKOUTS_BELOW_USUAL` | Nombre de séances dans la moyenne, au-dessus ou en dessous |
| `VOLUME_ON_TRACK` / `VOLUME_ABOVE_USUAL` / `VOLUME_BELOW_USUAL` | Volume dans la moyenne, au-dessus ou en dessous |

### B-09 Calories calculées par le serveur

- `GET /workouts/completed` : chaque séance a **`calories`** (kcal estimées).
- `GET /stats/heatmap` : chaque jour a **`calories`**, et la réponse a **`totalCalories`** pour l'année.
- C'est exactement le même chiffre que `estimatedCalories` de `GET /stats/workout/:id` : même formule (MET par type d'exercice × poids de corps × durée), même poids de corps (celui du profil, sinon 70 kg), même arrondi. Le test e2e le vérifie.
- **L'app ne doit plus calculer les calories elle-même.** C'est son calcul local qui donnait 31 au lieu de 47 kcal.

### B-08 Limiteur de connexion

- Le login n'est plus bloqué par adresse IP seule. Les limites sont désormais :
  - **5 tentatives par 15 minutes pour un même identifiant depuis une même adresse** : les autres personnes derrière le même réseau ne sont plus bloquées ;
  - **50 tentatives par 15 minutes par adresse**, tous comptes confondus.
- Le `429` a un format exploitable, au premier niveau, avec l'en-tête `Retry-After` (mêmes secondes) :

```json
{ "statusCode": 429, "code": "TOO_MANY_LOGIN_ATTEMPTS", "message": "Trop de tentatives de connexion. Réessayez dans 15 min.", "retryAfterSeconds": 900 }
```

- La limite générale (60 requêtes par minute) renvoie le même format avec `code: "RATE_LIMITED"`.
- Côté app : afficher le délai à partir de `retryAfterSeconds`, par exemple un compte à rebours sur le bouton de connexion.

### B-05 Mot de passe oublié et changement de mot de passe

Trois routes :

| Route | Corps | Réponse |
| --- | --- | --- |
| `POST /auth/forgot-password` | `{ email }` | **toujours `204`**, que le compte existe ou non |
| `POST /auth/reset-password` | `{ token, password }` | `204` |
| `PATCH /users/me/password` (connecté) | `{ currentPassword, newPassword }` | `200 { access_token }` |

**Mot de passe oublié**
- L'e-mail contient un lien `grinta://reset-password?token=…`. Le préfixe est réglable côté serveur (`RESET_PASSWORD_URL`), par exemple un lien web si l'app gère les universal links.
- Le lien marche **une fois, pendant 1 h**. Une nouvelle demande remplace l'ancien lien.
- L'app doit ouvrir un écran « Nouveau mot de passe » sur ce lien, puis appeler `reset-password` avec le `token`.
- Erreurs de `reset-password` :
  - `400 { code: "RESET_TOKEN_INVALID" }` : lien inconnu, déjà utilisé ou expiré. Proposer de redemander un lien ;
  - `400` avec `errors: [{ field: "password", code: "PASSWORD_TOO_SHORT" }]` : moins de 8 caractères.
- Après une réinitialisation, **toutes les sessions du compte sont déconnectées**. Les anciens tokens répondent `401`. L'utilisateur se reconnecte avec le nouveau mot de passe.

**Changement de mot de passe connecté**
- Il renvoie un **nouveau `access_token`** : l'app doit le stocker à la place de l'ancien, qui est désormais refusé, comme ceux des autres appareils.
- Mot de passe actuel incorrect : `400 { code: "CURRENT_PASSWORD_INVALID" }`. C'est volontairement un 400 et pas un 401, pour ne pas déclencher la déconnexion de l'app.

**Limites de débit** : `429 { code: "TOO_MANY_ATTEMPTS", retryAfterSeconds }`.
- 3 demandes de lien par heure par e-mail et par adresse, 10 par adresse ;
- 5 changements par 15 min par utilisateur.

**À savoir** : `PATCH /users/:id` accepte encore `password` sans demander l'actuel, pour ne pas casser l'app. Il faudrait passer à `PATCH /users/me/password`, puis retirer `password` de `PATCH /users/:id`.

### B-13 Jeton invalide ou expiré → 401 partout

- Toutes les routes protégées (88 aujourd'hui) répondent `401` avec un jeton absent, expiré, mal signé, malformé, en `alg: none`, ou appartenant à un compte supprimé. Un test e2e le vérifie route par route et découvre les routes automatiquement. Une route ajoutée plus tard sera testée, et toute nouvelle route publique doit y être déclarée.
- Les seules routes publiques : `GET /`, `GET /health`, `GET /exercises`, `GET /exercises/:id`, `POST /users/register`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`.
- Nouveau depuis B-05 : un jeton est aussi refusé après une réinitialisation ou un changement de mot de passe, ou si le compte a été supprimé. Le `handleSessionExpired` de l'app sur `401` couvre ces cas.
