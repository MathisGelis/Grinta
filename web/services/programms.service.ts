import { api } from "./api";
import { TokenService } from "./token.service";
import { createListCache } from "./listCache";
import { isNotFound } from "./api";

export interface SmallProgramm {
  id: string;
  title: string;
  totalDays: number,
  workoutDays: number,
  difficulty: string;
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

interface createProgramm {
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

interface editProgramm {
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

export const programmsList = createListCache<SmallProgramm>(getProgramms);

export interface TodayWorkout {
  id: string;
  title: string;
  description?: string | null;
  exercises: { id: string; exercise?: { id: string; name: string }; sets?: unknown }[];
}

export interface ProgrammeToday {
  programme: { id: string; title: string };
  startedOn: string;
  date: string;
  cycleLength: number;
  status: "workout" | "rest" | "not_started";
  dayNumber?: number;
  cycle?: number;
  daysUntilStart?: number;
  workout: TodayWorkout | null;
}

/** `date` : jour local de l'utilisateur (AAAA-MM-JJ), sinon c'est la date UTC qui sert. */
export async function startProgramme(id: string, startDate?: string): Promise<ProgrammeToday> {
  const token = await TokenService.get();
  return api.post<ProgrammeToday>(
    `/programmes/${encodeURIComponent(id)}/start`,
    startDate ? { startDate } : {},
    token ?? undefined,
  );
}

/** `null` quand aucun programme n'est suivi (`404`). */
export async function getTodayProgramme(date: string): Promise<ProgrammeToday | null> {
  const token = await TokenService.get();
  try {
    return await api.get<ProgrammeToday>(
      `/programmes/active/today?date=${date}`,
      token ?? undefined,
    );
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}
