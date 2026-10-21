# Catalogue d'exercices de base

`base-exercises.json` est chargé en base par `npm run seed` (`src/exercise/seed/exercise.seed.ts`), qui met à jour les exercices existants par leur nom.

## Champs

| Champ | Contenu |
| --- | --- |
| `name`, `equipment_type`, `primary_muscle`, `secondary_muscles`, `exercise_type` | Identité de l'exercice, valeurs des enums de `src/exercise/enums` |
| `description` | Ce qu'est l'exercice et ce qu'il travaille, en une ou deux phrases |
| `instructions` | Comment le faire, une étape par élément, dans l'ordre. La première étape décrit la mise en place propre à l'équipement quand elle diffère |
| `image_urls` | Photo de la position de départ puis de la position d'arrivée. Les afficher en alternance anime le mouvement |
| `image_url` | Miniature : la première photo de `image_urls`, chaîne vide sans photo |

Les textes sont en anglais, comme les noms des exercices.

## Photos

Elles viennent de [free-exercise-db](https://github.com/yuhonas/free-exercise-db), publié sous [Unlicense](https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE.md) (domaine public). Les URL pointent vers le commit `f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5` et non vers `main`, pour qu'un renommage en amont ne casse pas les images.

Une photo n'est associée que si la source montre le même mouvement avec un équipement compatible : une mauvaise photo est pire que pas de photo. 274 entrées sur 430 en ont une. Il n'y en a pas pour les variantes absentes de la source (la plupart des variantes à l'élastique, au kettlebell ou à la machine guidée), ni pour les activités (natation, yoga, boxe...).

Il n'y a pas de GIF : aucune source de GIF d'exercices sous licence libre n'a été trouvée. Les GIF des bases commerciales (ExerciseDB, etc.) sont soumis à copyright et ne peuvent pas être redistribués sans licence.
