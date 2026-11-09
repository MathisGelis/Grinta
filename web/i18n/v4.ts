import type { Lang } from "./translations";

/** Textes du troisième lot : mot de passe, onboarding, modèles, nouveaux graphiques, import. */
export interface V4Strings {
  // Groupes
  grpSettings: string;
  grpNewGroup: string;
  emptyProgrammesHint: string;
  emptyOtherProgrammesHint: string;
  emptyWorkoutsHint: string;
  reorderDay: string;
  prgMine: string;
  prgPredefined: string;
  sortDayCount: string;
  searchProgramme: string;
  grpAddMember: string;
  grpSearchMutual: string;
  grpNoMutual: string;
  grpInvited: string;
  grpInviteBtn: string;

  // Changement de mot de passe
  pwChange: string;
  pwCurrent: string;
  pwNew: string;
  pwChangeSubmit: string;
  pwChanged: string;
  pwCurrentInvalid: string;
  pwSameAsCurrent: string;

  // Onboarding : niveau, jours, lieu
  obTrainingTitle: string;
  obTrainingIntro: string;
  obLevel: string;
  levelBeginner: string;
  levelIntermediate: string;
  levelAdvanced: string;
  obDays: string;
  obDaysValue: string;
  obLocation: string;
  obContinue: string;

  // Modèles
  tplTitle: string;
  tplIntro: string;
  tplRecommended: string;
  tplUse: string;
  tplUsed: string;
  tplUsedMessage: string;
  tplDaysPerWeek: string;
  tplWorkoutsCount: string;
  tplSkip: string;
  tplEmpty: string;
  tplFinish: string;

  // Stats d'un autre utilisateur
  stUserHidden: string;

  // Graphiques
  stHeatmapTitle: string;
  stHeatmapLegend: string;
  stHeatmapDay: string;
  stProgressionTitle: string;
  stMetricVolume: string;
  stMetricRm: string;
  stPeriod1m: string;
  stPeriod3m: string;
  stPeriod6m: string;
  stPeriod1y: string;
  stPeriodAll: string;
  stNoProgression: string;
  stNoPracticed: string;
  stComparisonTitle: string;
  stComparisonElapsed: string;
  stComparisonWorkouts: string;
  stComparisonVolume: string;
  stComparisonUsual: string;
  insights: Record<string, string>;

  // Import depuis des notes
  imTitle: string;
  imIntro: string;
  imPlaceholder: string;
  imAnalyse: string;
  imDraft: string;
  imWorkoutLine: string;
  imUnrecognized: string;
  imUnrecognizedLine: string;
  imReasonUnknown: string;
  imReasonNoExercise: string;
  imRemoveLine: string;
  imProgrammeTitle: string;
  imSave: string;
  imSaved: string;
  imSavedMessage: string;
  imNothing: string;
  imEntry: string;
  imDayRest: string;
}

const en: V4Strings = {
  grpSettings: "Group settings",
  grpNewGroup: "New group",
  emptyProgrammesHint: "No programme yet. Create one to plan your week.",
  emptyOtherProgrammesHint: "No other programme. Create another one to vary your training.",
  emptyWorkoutsHint: "No workout yet. Create your first one to get started.",
  reorderDay: "Reorder day",
  prgMine: "Mine",
  prgPredefined: "Predefined",
  sortDayCount: "Number of days",
  searchProgramme: "Search a programme",
  grpAddMember: "Add a member",
  grpSearchMutual: "Search among people you follow each other",
  grpNoMutual: "No one to invite. You can only invite people you follow and who follow you back.",
  grpInvited: "Invited",
  grpInviteBtn: "Invite",

  pwChange: "Change password",
  pwCurrent: "Current password",
  pwNew: "New password",
  pwChangeSubmit: "Update password",
  pwChanged: "Password updated. Your other devices have been signed out.",
  pwCurrentInvalid: "The current password is incorrect.",
  pwSameAsCurrent: "The new password must be different.",

  obTrainingTitle: "Your training",
  obTrainingIntro: "We use this to suggest programmes that fit you.",
  obLevel: "Level",
  levelBeginner: "Beginner",
  levelIntermediate: "Intermediate",
  levelAdvanced: "Advanced",
  obDays: "Days per week",
  obDaysValue: "{n} days",
  obLocation: "Where do you train?",
  obContinue: "Continue",

  tplTitle: "Pick a programme",
  tplIntro: "Ready-made programmes, best matches first. You can edit them afterwards.",
  tplRecommended: "Recommended",
  tplUse: "Use this programme",
  tplUsed: "Programme added",
  tplUsedMessage: "Your workouts and the 7-day programme are ready. Start it from the Workouts tab.",
  tplDaysPerWeek: "{n} days / week",
  tplWorkoutsCount: "{n} workouts",
  tplSkip: "Skip",
  tplEmpty: "No programme available right now.",
  tplFinish: "Done",

  stUserHidden: "This user's statistics are private.",

  stHeatmapTitle: "Activity",
  stHeatmapLegend: "Less → more",
  stHeatmapDay: "{date}: {calories} kcal",
  stProgressionTitle: "Progression",
  stMetricVolume: "Volume",
  stMetricRm: "Estimated 1RM",
  stPeriod1m: "1M",
  stPeriod3m: "3M",
  stPeriod6m: "6M",
  stPeriod1y: "1Y",
  stPeriodAll: "All",
  stNoProgression: "Not enough data for this exercise (bodyweight exercises have no curve).",
  stNoPracticed: "Complete a workout to see your progression.",
  stComparisonTitle: "Versus your usual",
  stComparisonElapsed: "{pct}% of the period elapsed",
  stComparisonWorkouts: "Workouts",
  stComparisonVolume: "Volume",
  stComparisonUsual: "Usual: {n}",
  insights: {
    INSUFFICIENT_PULL_VOLUME: "Not enough pulling volume to judge your push/pull balance.",
    PUSH_DOMINANT: "Pushing dominates: add some pulling work.",
    PULL_DOMINANT: "Pulling dominates: add some pushing work.",
    PUSH_PULL_BALANCED: "Your push/pull balance looks good.",
    NO_LOWER_BODY_VOLUME: "No lower-body volume over this period.",
    UPPER_BODY_DOMINANT: "Upper body dominates: train your legs more.",
    LOWER_BODY_DOMINANT: "Lower body dominates: your upper body may be neglected.",
    NOT_ENOUGH_HISTORY: "Not enough history yet to compare.",
    WORKOUTS_ON_TRACK: "Your workout count is in line with your usual.",
    WORKOUTS_ABOVE_USUAL: "You train more than usual.",
    WORKOUTS_BELOW_USUAL: "You train less than usual.",
    VOLUME_ON_TRACK: "Your volume is in line with your usual.",
    VOLUME_ABOVE_USUAL: "Your volume is above your usual.",
    VOLUME_BELOW_USUAL: "Your volume is below your usual.",
  },

  imTitle: "Import from notes",
  imIntro: "Paste a programme written in your notes (French or English). Nothing is saved until you confirm.",
  imPlaceholder: "Monday: Push\nBench press 4x8 60kg\nDips 3x10\n\nTuesday: rest",
  imAnalyse: "Analyse",
  imDraft: "Draft",
  imWorkoutLine: "{sets} sets",
  imUnrecognized: "Not recognised",
  imUnrecognizedLine: "Line {n}: {text}",
  imReasonUnknown: "Unknown exercise",
  imReasonNoExercise: "Sets without an exercise above",
  imRemoveLine: "Ignore",
  imProgrammeTitle: "Programme",
  imSave: "Save",
  imSaved: "Imported",
  imSavedMessage: "Your workouts have been added.",
  imNothing: "Nothing recognised in these notes.",
  imEntry: "Import from notes",
  imDayRest: "Rest",
};

const fr: V4Strings = {
  grpSettings: "Réglages du groupe",
  grpNewGroup: "Nouveau groupe",
  emptyProgrammesHint: "Aucun programme pour l'instant. Créez-en un pour planifier votre semaine.",
  emptyOtherProgrammesHint: "Aucun autre programme. Créez-en un autre pour varier vos entraînements.",
  emptyWorkoutsHint: "Aucune séance pour l'instant. Créez votre première séance pour commencer.",
  reorderDay: "Réordonner le jour",
  prgMine: "Mes programmes",
  prgPredefined: "Prédéfinis",
  sortDayCount: "Nombre de jours",
  searchProgramme: "Rechercher un programme",
  grpAddMember: "Ajouter un membre",
  grpSearchMutual: "Rechercher parmi vos abonnements mutuels",
  grpNoMutual: "Personne à inviter. Vous ne pouvez inviter que les personnes que vous suivez et qui vous suivent aussi.",
  grpInvited: "Invité",
  grpInviteBtn: "Inviter",

  pwChange: "Changer le mot de passe",
  pwCurrent: "Mot de passe actuel",
  pwNew: "Nouveau mot de passe",
  pwChangeSubmit: "Mettre à jour",
  pwChanged: "Mot de passe mis à jour. Vos autres appareils ont été déconnectés.",
  pwCurrentInvalid: "Le mot de passe actuel est incorrect.",
  pwSameAsCurrent: "Le nouveau mot de passe doit être différent.",

  obTrainingTitle: "Votre entraînement",
  obTrainingIntro: "Cela nous permet de vous proposer des programmes adaptés.",
  obLevel: "Niveau",
  levelBeginner: "Débutant",
  levelIntermediate: "Intermédiaire",
  levelAdvanced: "Avancé",
  obDays: "Jours par semaine",
  obDaysValue: "{n} jours",
  obLocation: "Où vous entraînez-vous ?",
  obContinue: "Continuer",

  tplTitle: "Choisissez un programme",
  tplIntro: "Des programmes prêts à l'emploi, les plus adaptés d'abord. Vous pourrez les modifier.",
  tplRecommended: "Recommandé",
  tplUse: "Utiliser ce programme",
  tplUsed: "Programme ajouté",
  tplUsedMessage: "Vos séances et le programme de 7 jours sont prêts. Lancez-le depuis l'onglet Séances.",
  tplDaysPerWeek: "{n} jours / semaine",
  tplWorkoutsCount: "{n} séances",
  tplSkip: "Passer",
  tplEmpty: "Aucun programme disponible pour le moment.",
  tplFinish: "Terminer",

  stUserHidden: "Les statistiques de cet utilisateur sont privées.",

  stHeatmapTitle: "Activité",
  stHeatmapLegend: "Moins → plus",
  stHeatmapDay: "{date} : {calories} kcal",
  stProgressionTitle: "Progression",
  stMetricVolume: "Volume",
  stMetricRm: "1RM estimé",
  stPeriod1m: "1M",
  stPeriod3m: "3M",
  stPeriod6m: "6M",
  stPeriod1y: "1A",
  stPeriodAll: "Tout",
  stNoProgression: "Pas assez de données pour cet exercice (les exercices au poids du corps n'ont pas de courbe).",
  stNoPracticed: "Terminez une séance pour voir votre progression.",
  stComparisonTitle: "Par rapport à d'habitude",
  stComparisonElapsed: "{pct} % de la période écoulée",
  stComparisonWorkouts: "Séances",
  stComparisonVolume: "Volume",
  stComparisonUsual: "Habituel : {n}",
  insights: {
    INSUFFICIENT_PULL_VOLUME: "Pas assez de tirage pour juger l'équilibre poussée/tirage.",
    PUSH_DOMINANT: "La poussée domine : ajoutez du tirage.",
    PULL_DOMINANT: "Le tirage domine : ajoutez de la poussée.",
    PUSH_PULL_BALANCED: "Votre équilibre poussée/tirage est correct.",
    NO_LOWER_BODY_VOLUME: "Aucun volume bas du corps sur la période.",
    UPPER_BODY_DOMINANT: "Le haut du corps domine : travaillez plus les jambes.",
    LOWER_BODY_DOMINANT: "Le bas du corps domine : le haut est peut-être négligé.",
    NOT_ENOUGH_HISTORY: "Pas encore assez d'historique pour comparer.",
    WORKOUTS_ON_TRACK: "Votre nombre de séances est dans la moyenne.",
    WORKOUTS_ABOVE_USUAL: "Vous vous entraînez plus que d'habitude.",
    WORKOUTS_BELOW_USUAL: "Vous vous entraînez moins que d'habitude.",
    VOLUME_ON_TRACK: "Votre volume est dans la moyenne.",
    VOLUME_ABOVE_USUAL: "Votre volume est au-dessus de d'habitude.",
    VOLUME_BELOW_USUAL: "Votre volume est en dessous de d'habitude.",
  },

  imTitle: "Importer depuis des notes",
  imIntro: "Collez un programme écrit dans vos notes (français ou anglais). Rien n'est enregistré avant votre confirmation.",
  imPlaceholder: "Lundi : Push\nDéveloppé couché 4x8 60kg\nDips 3x10\n\nMardi : repos",
  imAnalyse: "Analyser",
  imDraft: "Brouillon",
  imWorkoutLine: "{sets} séries",
  imUnrecognized: "Non reconnu",
  imUnrecognizedLine: "Ligne {n} : {text}",
  imReasonUnknown: "Exercice inconnu",
  imReasonNoExercise: "Des séries sans exercice au-dessus",
  imRemoveLine: "Ignorer",
  imProgrammeTitle: "Programme",
  imSave: "Enregistrer",
  imSaved: "Importé",
  imSavedMessage: "Vos séances ont été ajoutées.",
  imNothing: "Rien n'a été reconnu dans ces notes.",
  imEntry: "Importer depuis des notes",
  imDayRest: "Repos",
};

// Les autres langues retombent sur l'anglais tant qu'elles ne sont pas traduites.
const overrides: Partial<Record<Lang, V4Strings>> = { fr };

export const v4Strings = (lang: Lang): V4Strings => overrides[lang] ?? en;
