import { api } from "./api";
import { TokenService } from "./token.service";

export interface Programme {
  id: string;
  title: string;
  description?: string;
  workouts: any[];
}

export const ProgrammeService = {
  async getAll(): Promise<Programme[]> {
    const token = await TokenService.get();
    return api.get<Programme[]>("/programmes", token ?? undefined);
  },

  async getById(id: string): Promise<Programme> {
    const token = await TokenService.get();
    return api.get<Programme>(`/programmes/${id}`, token ?? undefined);
  },
};
