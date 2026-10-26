# Changements du backend à intégrer dans l'app

Branche backend : `claude/eloquent-franklin-77c84i`, à merger dans `backend`. Ce document liste tout ce que l'app voit changer : comportements, formats de réponse, nouvelles routes. Le détail technique côté serveur est dans `backend/CHANGELOG.md`, et tous les schémas de requête et de réponse sont dans Swagger (`GET /api` sur l'API).

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
- Elles valent `/uploads/...` (chemin relatif) si le serveur n'a pas `UPLOADS_PUBLIC_URL`, ou `https://<api>/uploads/...` s'il l'a. **Gérez les deux** : `url.startsWith("http") ? url : BASE_URL + url`.
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
- `GET /uploads/...` (fichiers des photos)

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
