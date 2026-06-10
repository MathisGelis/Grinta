import { api } from "./api";
import { TokenService } from "./token.service";

export interface SmallProgramm {
  id: string;
  title: string;
  weekNumber: number;
  difficulty: string;
}

export interface ProgrammeDay {
  dayNumber: number;
  workoutId?: string;
}

export interface Programm {
  weekNumber: number;
  difficulty: string;
  locationType: string;
  title: string;
  description?: string;
  days: ProgrammeDay[];
}

export async function getProgramms(): Promise<SmallProgramm[]> {
  try {
    const token = await TokenService.get() || undefined;
    const response = await api.get<SmallProgramm[]>("/programmes", token);
    return response;
  } catch (error) {
    console.error("Error lors de la récupération des programmes:", error);
    throw error;
  }
}

export async function getProgrammeById(
  id: string,
): Promise<Programm> {
  try {
    const token = await TokenService.get() || undefined;
    const response = await api.get<Programm>(`/programmes/${id}`, token);
    return response;
  } catch (error) {
    console.error(`Error lors de la récupération du programme ${id}:`, error);
    throw error;
  }
}

export async function createProgramme(
  programmeData: Programm,
): Promise<Programm> {
  try {
    const token = await TokenService.get() || undefined;
    return await api.post<Programm>("/programmes", programmeData, token);
  } catch (error) {
    console.error("Error lors de la création du programme:", error);
    throw error;
  }
}

export async function updateProgramme(
  id: string,
  programmeData: Programm,
): Promise<Programm> {
  try {
    const token = await TokenService.get() || undefined;
    return await api.patch<Programm>(`/programmes/${id}`, programmeData, token);
  } catch (error) {
    console.error("Error lors de la mise à jour du programme:", error);
    throw error;
  }
}
