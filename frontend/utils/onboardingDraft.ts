import type { UpdateUserData } from "@/services/user.service";

/**
 * Réponses du questionnaire, recueillies avant la création du compte.
 * Gardées en mémoire puis envoyées au profil juste après l'inscription.
 */
let draft: UpdateUserData = {};

export function mergeOnboardingDraft(data: UpdateUserData) {
  draft = { ...draft, ...data };
}

export function takeOnboardingDraft(): UpdateUserData {
  const data = draft;
  draft = {};
  return data;
}

export function clearOnboardingDraft() {
  draft = {};
}
