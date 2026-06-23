import { api } from "./api";
import { TokenService } from "./token.service";

export interface SmallProgramm {
  id: string;
  title: string;
  totalDays: number,
  workoutDays: number,
  difficulty: string;
}

export interface SmallProgrammDay {
  dayNumber: number;
  workoutId: string | null;
}

export interface ProgrammeDay {
  dayNumber: number;
  workout: SmallWorkout | null;
}

export interface SmallWorkout {
  id: string;
  title: string;
  description?: string;
}

export interface Programm {
  id: string;
  weekNumber: number;
  difficulty: string;
  locationType: string;
  title: string;
  description?: string;
  totalWorkoutDays: number;
  days: ProgrammeDay[];
}

export interface createProgramm {
  weekNumber: number;
  difficulty: string;
  locationType: string;
  title: string;
  description?: string;
  days: {
    dayNumber: number;
    workoutId: string | null;
  }[];
}

export interface editProgramm {
  weekNumber: number;
  difficulty: string;
  locationType: string;
  title: string;
  description?: string;
  days: {
    dayNumber: number;
    workoutId: string | null;
  }[];
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
  programmeData: createProgramm,
): Promise<createProgramm> {
  try {
    const token = await TokenService.get() || undefined;
    console.log("Création du programme avec les données:", JSON.stringify(programmeData, null, 2));
    return await api.post<createProgramm>("/programmes", programmeData, token);
  } catch (error) {
    console.error("Error lors de la création du programme:", error);
    throw error;
  }
}

export async function updateProgramme(
  id: string,
  programmeData: editProgramm,
): Promise<editProgramm> {
  try {
    const token = await TokenService.get() || undefined;
    console.log(`Mise à jour du programme ${id} avec les données:`, JSON.stringify(programmeData, null, 2));
    return await api.patch<editProgramm>(`/programmes/${id}`, programmeData, token);
  } catch (error) {
    console.error("Error lors de la mise à jour du programme:", error);
    throw error;
  }
}


export async function deleteProgramme(id: string): Promise<void> {
  try {
    const token = await TokenService.get() || undefined;
    await api.delete(`/programmes/${id}`, token);
  } catch (error) {
    console.error("Error lors de la suppression du programme:", error);
    throw error;
  }
}