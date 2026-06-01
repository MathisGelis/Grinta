export type ModerationFlagSource = 'local' | 'remote' | null;

export interface ModerationResult {
  ok: boolean;
  flaggedBy: ModerationFlagSource;
  matchCount: number;
}
