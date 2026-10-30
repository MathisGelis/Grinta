import type { Post, PostWorkout } from "@/services/posts.service";
import type { ShareCardData } from "./ShareCardSheet";

/** Données de card de partage d'un post : détail du post + séance (séries, totaux). */
export function buildPostShareData(
  post: Post,
  workout: PostWorkout,
  fallbackTitle: string,
): ShareCardData {
  return {
    title: post.workoutTitle ?? post.workout?.title ?? fallbackTitle,
    username: post.uniqueName,
    photoUrl: post.workoutPhotoUrl,
    durationSeconds: post.workoutDurationSeconds,
    totalVolume: workout.stats.totalVolume,
    totalSets: workout.stats.totalSets,
    totalReps: workout.stats.totalReps,
    realLife: workout.stats.realLifeComparison,
    exercises: workout.exercises.map((entry) => ({
      name: entry.exercise?.name ?? "–",
      sets: entry.sets ?? [],
    })),
  };
}
