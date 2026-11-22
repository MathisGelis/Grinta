import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { api } from "./api";
import { TokenService } from "./token.service";

export interface AvatarUrls {
  avatarUrl: string | null;
  avatarThumbnailUrl: string | null;
}

export interface WorkoutPhotoUrls {
  photoUrl: string | null;
  photoThumbnailUrl: string | null;
}

const MAX_WIDTH = 2000;

/** Choisit une image dans la galerie et renvoie son URI, ou null si annulé. */
export async function pickImage(aspect?: [number, number]): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: !!aspect,
    aspect,
    quality: 1,
  });
  return result.canceled ? null : result.assets[0].uri;
}

/** HEIC refusé (415) : on convertit en JPEG et on réduit à ~2000 px avant l'envoi. */
async function toJpeg(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

async function uploadPhoto<T>(path: string, uri: string): Promise<T> {
  const token = await TokenService.get();
  if (!token) throw new Error("Not authenticated");
  return api.upload<T>(path, await toJpeg(uri), token);
}

export const PhotoService = {
  uploadAvatar: (uri: string) =>
    uploadPhoto<AvatarUrls>("/users/me/avatar", uri),

  async removeAvatar(): Promise<AvatarUrls> {
    const token = await TokenService.get();
    return api.delete<AvatarUrls>("/users/me/avatar", token ?? undefined);
  },

  uploadWorkoutPhoto: (workoutId: string, uri: string) =>
    uploadPhoto<WorkoutPhotoUrls>(`/workouts/completed/${workoutId}/photo`, uri),

  async removeWorkoutPhoto(workoutId: string): Promise<WorkoutPhotoUrls> {
    const token = await TokenService.get();
    return api.delete<WorkoutPhotoUrls>(
      `/workouts/completed/${workoutId}/photo`,
      token ?? undefined,
    );
  },
};
