import { api } from "./api";

export interface User {
  id: string;
  uniqueName: string;
  displayName: string;
  followerscount: string;
}

export const getRecommendedUsers = async (): Promise<User[]> => {
  return api.get<User[]>("/users/recommended");
}
