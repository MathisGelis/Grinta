import { api } from "./api";
import { TokenService } from "./token.service";
import type { RealLifeComparison } from "@/utils/realLife";

export type BadgeType =
  | "heaviest_weight"
  | "best_estimated_1rm"
  | "best_session_volume"
  | "most_reps";

export interface Badge {
  id: string;
  type: BadgeType;
  exercise: { id: string; name: string };
  workoutId: string;
  unit: "kg" | "reps";
  value: number;
  previousValue: number;
  improvement: number;
  improvementPct: number;
  weight: number | null;
  reps: number | null;
  achievedAt: string;
  /** Seulement pour la charge max et le volume ; `null` sinon. */
  realLifeComparison?: RealLifeComparison | null;
}

export const BadgesService = {
  async list(params: { exerciseId?: string; type?: BadgeType; limit?: number } = {}): Promise<Badge[]> {
    const token = await TokenService.get();
    const query = new URLSearchParams();
    if (params.exerciseId) query.set("exerciseId", params.exerciseId);
    if (params.type) query.set("type", params.type);
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return api.get<Badge[]>(`/badges${qs ? `?${qs}` : ""}`, token ?? undefined);
  },
};
