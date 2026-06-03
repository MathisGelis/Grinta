import { api } from "./api";

export interface Programm {
  id: string;
  weekNumber: number;
  difficulty: string;
  locationType: string;
  title: string;
  description: string;
  days?: Array<{
    dayNumber: number;
    workoutId?: string;
    workout?: {
      id?: string;
      title?: string;
      description?: string;
    };
  }>;
}

export interface ProgrammeDayDto {
  dayNumber: number;
  workoutId?: string;
}

export interface CreateProgrammeDto {
  weekNumber: number;
  difficulty: string;
  locationType: string;
  title: string;
  description?: string;
  days: ProgrammeDayDto[];
}

export interface UpdateProgrammeDto {
  weekNumber?: number;
  difficulty?: string;
  locationType?: string;
  title?: string;
  description?: string;
  days?: ProgrammeDayDto[];
}

export async function getProgramms(token?: string): Promise<Programm[]> {
  try {
    const response = await api.get<Programm[]>("/programmes", token);
    return response;
  } catch (error) {
    console.error("Error lors de la récupération des programmes:", error);
    throw error;
  }
}

export async function createProgramme(
  programmeData: CreateProgrammeDto,
  token?: string,
): Promise<Programm> {
  try {
    console.log("Création du programme avec les données:", JSON.stringify(programmeData, null, 2));
    return await api.post<Programm>("/programmes", programmeData, token);
  } catch (error) {
    console.error("Error lors de la création du programme:", error);
    throw error;
  }
}

export async function updateProgramme(
  id: string,
  programmeData: UpdateProgrammeDto,
  token?: string,
): Promise<Programm> {
  try {
    return await api.patch<Programm>(`/programmes/${id}`, programmeData, token);
  } catch (error) {
    console.error("Error lors de la mise à jour du programme:", error);
    throw error;
  }
}
