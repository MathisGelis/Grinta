import type { Lang } from "./translations";

export type RealLifeObject =
  | "bowling_ball"
  | "golden_retriever"
  | "washing_machine"
  | "giant_panda"
  | "upright_piano"
  | "horse"
  | "car"
  | "white_rhinoceros"
  | "african_elephant"
  | "school_bus"
  | "boeing_737"
  | "statue_of_liberty";

/** Textes de la livraison backend v3 (comparaisons, groupes, duplication, partage). */
export interface V3Strings {
  rlTitle: string;
  rlLine: string;
  rlObjects: Record<RealLifeObject, string>;

  pcBestSet: string;
  pcSetsCount: string;
  pcMoreExercises: string;
  pcRecords: string;
  pcVolume: string;

  cmpButton: string;
  cmpTitle: string;
  cmpPickUser: string;
  cmpNoFollowing: string;
  cmpNotFollowing: string;
  cmpMe: string;
  cmpOnlyPublished: string;
  cmpMaxReps: string;
  cmpSessions: string;
  cmpLastPerformed: string;
  cmpNever: string;

  dupButton: string;
  dupDone: string;
  dupDoneMessage: string;
  dupView: string;

  apiErrors: Record<string, string>;
  invalidEmail: string;
  passwordTooShort: string;
  passwordHint: string;
  retryIn: string;
  forgotTitle: string;
  forgotIntro: string;
  forgotSend: string;
  forgotSent: string;
  backToLogin: string;
  resetTitle: string;
  resetIntro: string;
  newPasswordLabel: string;
  resetSubmit: string;
  resetDone: string;
  resetTokenInvalid: string;
  resetRequestNew: string;

  skipBtn: string;
  preferNotToSay: string;
  haveAccount: string;
  slide1Title: string;
  slide1Subtitle: string;
  slide2Title: string;
  slide2Subtitle: string;
  slide3Title: string;
  slide3Subtitle: string;
  noFollowedPosts: string;
  findAthletes: string;
  createFirstWorkoutTitle: string;
  createFirstWorkoutHint: string;
  createFirstWorkoutBtn: string;
  prgToday: string;
  prgStartDay: string;
  zeroWeightTitle: string;
  zeroWeightMessage: string;
  zeroWeightConfirm: string;
  restBetweenSets: string;
  loadFailedTitle: string;
  newsTab: string;
  newsBetaTag: string;
  newsBetaTitle: string;
  newsBetaBody: string;

  grpTitle: string;
  grpEmpty: string;
  grpCreate: string;
  grpNamePlaceholder: string;
  grpMembers: string;
  grpMemberCount: string;
  grpInvitations: string;
  grpNoInvitations: string;
  grpInviteLabel: string;
  grpInvitePlaceholder: string;
  grpInviteSend: string;
  grpPending: string;
  grpInvitedBy: string;
  grpAccept: string;
  grpDecline: string;
  grpRename: string;
  grpLeave: string;
  grpLeaveConfirm: string;
  grpDelete: string;
  grpDeleteConfirm: string;
  grpActivity: string;
  grpNoActivity: string;
  grpLoadMore: string;
  grpWorkoutEvent: string;
  grpRecordEvent: string;
  grpShareEvent: string;
  grpRemoveShare: string;
  grpSend: string;
  grpSendTitle: string;
  grpSent: string;
  grpOpen: string;
  grpCreator: string;

  prgStart: string;
  prgStarted: string;
  prgStartedMessage: string;

  tdTitle: string;
  tdDay: string;
  tdStart: string;
  tdRest: string;
  tdNotStarted: string;
  tdCycle: string;

  cmNone: string;
  cmNoneRest: string;
  cmFromProgramme: string;
  cmChoose: string;
  cmChosen: string;

  sgTitle: string;
  sgSubtitle: string;
  sgMuscleLine: string;
  sgAlternatives: string;
  sgStart: string;

  shrCard: string;
  shrCardTitle: string;
  shrCardUnavailable: string;
  shrTypeSummary: string;
  shrTypeSets: string;
  shrLayoutPoster: string;
  shrLayoutMinimal: string;
  shrLayoutTop: string;
  shrVolumeBig: string;
  shrBgDark: string;
  shrBgLight: string;
  shrBgTransparent: string;
  shrBgPhoto: string;
  shrTransparentHint: string;
  shrMoreSets: string;
}

const en: V3Strings = {
  rlTitle: "In real life",
  rlLine: "≈ {count} × {object}",
  rlObjects: {
    bowling_ball: "bowling ball",
    golden_retriever: "golden retriever",
    washing_machine: "washing machine",
    giant_panda: "giant panda",
    upright_piano: "upright piano",
    horse: "horse",
    car: "car",
    white_rhinoceros: "white rhinoceros",
    african_elephant: "African elephant",
    school_bus: "school bus",
    boeing_737: "Boeing 737",
    statue_of_liberty: "Statue of Liberty",
  },

  pcBestSet: "Best set",
  pcSetsCount: "{n} set|{n} sets",
  pcMoreExercises: "+{n} more",
  pcRecords: "Records",
  pcVolume: "Volume",

  cmpButton: "Compare with…",
  cmpTitle: "Comparison",
  cmpPickUser: "Compare with someone you follow",
  cmpNoFollowing: "You don't follow anyone yet.",
  cmpNotFollowing: "You can only compare with people you follow.",
  cmpMe: "Me",
  cmpOnlyPublished: "Only the workouts they published are counted.",
  cmpMaxReps: "Most reps",
  cmpSessions: "Sessions",
  cmpLastPerformed: "Last performed",
  cmpNever: "Never",

  dupButton: "Duplicate",
  dupDone: "Workout duplicated",
  dupDoneMessage: "It was added to your planned workouts.",
  dupView: "View",

  apiErrors: {
    EMAIL_INVALID: "Invalid email address.",
    PASSWORD_TOO_SHORT: "The password must be at least 8 characters long.",
    PASSWORD_TOO_LONG: "The password is too long.",
    USERNAME_INVALID: "Invalid username: 3 to 30 characters among a-z, 0-9, _ and .",
    FIELD_REQUIRED: "A required field is missing.",
    FIELD_TOO_SHORT: "A text is too short.",
    FIELD_TOO_LONG: "A text is too long.",
    NUMBER_INVALID: "Invalid number (2 decimals at most).",
    INTEGER_EXPECTED: "A whole number is expected.",
    VALUE_TOO_SMALL: "A value is too small.",
    VALUE_TOO_LARGE: "A value is too large.",
    VALUE_NOT_ALLOWED: "This value is not accepted.",
    DATE_INVALID: "Invalid date.",
    CURRENT_PASSWORD_INVALID: "The current password is incorrect.",
    RESET_TOKEN_INVALID: "This link is invalid or has expired.",
  },
  invalidEmail: "Enter a valid email address.",
  passwordTooShort: "The password must be at least 8 characters long.",
  passwordHint: "At least 8 characters",
  retryIn: "Too many attempts. Try again in {time}.",
  forgotTitle: "Forgot password",
  forgotIntro: "Enter your email address and we will send you a link to choose a new password.",
  forgotSend: "Send the link",
  forgotSent: "If an account exists for this address, an email has been sent.",
  backToLogin: "Back to login",
  resetTitle: "New password",
  resetIntro: "Choose a new password for your account.",
  newPasswordLabel: "New password",
  resetSubmit: "Change the password",
  resetDone: "Password changed. Sign in with your new password.",
  resetTokenInvalid: "This link is invalid or has expired.",
  resetRequestNew: "Request a new link",

  skipBtn: "Skip",
  preferNotToSay: "Prefer not to say",
  haveAccount: "I already have an account",
  slide1Title: "Track your progress,",
  slide1Subtitle: "Push your limits",
  slide2Title: "Don't train alone,",
  slide2Subtitle: "Join the Grinta community",
  slide3Title: "Set your goals",
  slide3Subtitle: "Achieve them with Grinta",
  noFollowedPosts: "The people you follow have not posted yet.",
  findAthletes: "Find athletes",
  createFirstWorkoutTitle: "Create your first workout",
  createFirstWorkoutHint: "Build a session, train, then share it with the community.",
  createFirstWorkoutBtn: "New workout",
  prgToday: "Today",
  prgStartDay: "Start",
  zeroWeightTitle: "0 kg entered",
  zeroWeightMessage: "You usually lift weight on this exercise. Validate this set at 0?",
  zeroWeightConfirm: "Validate",
  restBetweenSets: "Rest between sets",
  loadFailedTitle: "Unable to load",
  newsTab: "News",
  newsBetaTag: "Beta",
  newsBetaTitle: "Grinta is in beta!",
  newsBetaBody:
    "Welcome to the first version of Grinta. Some features are still being polished and you may run into a few bugs. Your feedback helps us improve the app, so don't hesitate to share it. Thanks for being part of the adventure!",

  grpTitle: "Groups",
  grpEmpty: "You are not in any group yet.",
  grpCreate: "Create a group",
  grpNamePlaceholder: "Group name",
  grpMembers: "Members",
  grpMemberCount: "{n} members",
  grpInvitations: "Invitations",
  grpNoInvitations: "No pending invitations.",
  grpInviteLabel: "Invite someone",
  grpInvitePlaceholder: "@username",
  grpInviteSend: "Invite",
  grpPending: "Pending",
  grpInvitedBy: "Invited by {name}",
  grpAccept: "Accept",
  grpDecline: "Decline",
  grpRename: "Rename",
  grpLeave: "Leave the group",
  grpLeaveConfirm: "Do you really want to leave this group?",
  grpDelete: "Delete the group",
  grpDeleteConfirm: "This deletes the group for all its members.",
  grpActivity: "Activity",
  grpNoActivity: "Nothing yet. Published workouts and shared posts show up here.",
  grpLoadMore: "Load more",
  grpWorkoutEvent: "{name} trained",
  grpRecordEvent: "Broke their record: {exercise}",
  grpShareEvent: "{name} shared {author}'s workout",
  grpRemoveShare: "Remove",
  grpSend: "Send to a group",
  grpSendTitle: "Choose a group",
  grpSent: "Post sent to the group.",
  grpOpen: "Open the post",
  grpCreator: "Creator",

  prgStart: "Start this programme",
  prgStarted: "Programme started",
  prgStartedMessage: "It replaces the programme you were following.",

  tdTitle: "Today's workout",
  tdDay: "Day {n} of {total}",
  tdStart: "Start",
  tdRest: "Rest day",
  tdNotStarted: "Your programme starts in {n} day(s)",
  tdCycle: "Round {n}",

  cmNone: "No workout chosen yet",
  cmNoneRest: "Rest day in your programme",
  cmFromProgramme: "Today's workout · Day {n} of {total}",
  cmChoose: "Choose",
  cmChosen: "Chosen",

  sgTitle: "What should I do today?",
  sgSubtitle: "Targets the muscles you trained the least",
  sgMuscleLine: "{muscle}: {n} sets this week",
  sgAlternatives: "Other ideas",
  sgStart: "Start",

  shrCard: "Share",
  shrCardTitle: "Share card",
  shrCardUnavailable: "Sharing is not available on this device.",
  shrTypeSummary: "Classic",
  shrTypeSets: "Working sets",
  shrLayoutPoster: "Poster",
  shrLayoutMinimal: "Minimal",
  shrLayoutTop: "Top lifts",
  shrVolumeBig: "Total volume",
  shrBgDark: "Dark",
  shrBgLight: "Light",
  shrBgTransparent: "Transparent",
  shrBgPhoto: "Photo",
  shrTransparentHint: "Transparent PNG: place it on any photo or story.",
  shrMoreSets: "+{n}",
};

const fr: V3Strings = {
  rlTitle: "Dans la vraie vie",
  rlLine: "≈ {count} × {object}",
  rlObjects: {
    bowling_ball: "boule de bowling",
    golden_retriever: "golden retriever",
    washing_machine: "machine à laver",
    giant_panda: "panda géant",
    upright_piano: "piano droit",
    horse: "cheval",
    car: "voiture",
    white_rhinoceros: "rhinocéros blanc",
    african_elephant: "éléphant d'Afrique",
    school_bus: "bus scolaire",
    boeing_737: "Boeing 737",
    statue_of_liberty: "statue de la Liberté",
  },

  pcBestSet: "Meilleure série",
  pcSetsCount: "{n} série|{n} séries",
  pcMoreExercises: "+{n} autres",
  pcRecords: "Records",
  pcVolume: "Volume",

  cmpButton: "Comparer avec…",
  cmpTitle: "Comparaison",
  cmpPickUser: "Comparer avec une personne suivie",
  cmpNoFollowing: "Vous ne suivez personne pour l'instant.",
  cmpNotFollowing: "Vous ne pouvez comparer qu'avec les personnes que vous suivez.",
  cmpMe: "Moi",
  cmpOnlyPublished: "Seules les séances qu'elle a publiées sont comptées.",
  cmpMaxReps: "Max de reps",
  cmpSessions: "Séances",
  cmpLastPerformed: "Dernière fois",
  cmpNever: "Jamais",

  dupButton: "Dupliquer",
  dupDone: "Séance dupliquée",
  dupDoneMessage: "Elle a été ajoutée à vos séances planifiées.",
  dupView: "Voir",

  apiErrors: {
    EMAIL_INVALID: "Adresse e-mail invalide.",
    PASSWORD_TOO_SHORT: "Le mot de passe doit contenir au moins 8 caractères.",
    PASSWORD_TOO_LONG: "Le mot de passe est trop long.",
    USERNAME_INVALID: "Pseudo invalide : 3 à 30 caractères parmi a-z, 0-9, _ et .",
    FIELD_REQUIRED: "Un champ obligatoire est manquant.",
    FIELD_TOO_SHORT: "Un texte est trop court.",
    FIELD_TOO_LONG: "Un texte est trop long.",
    NUMBER_INVALID: "Nombre invalide (2 décimales au maximum).",
    INTEGER_EXPECTED: "Un nombre entier est attendu.",
    VALUE_TOO_SMALL: "Une valeur est trop petite.",
    VALUE_TOO_LARGE: "Une valeur est trop grande.",
    VALUE_NOT_ALLOWED: "Cette valeur n'est pas acceptée.",
    DATE_INVALID: "Date invalide.",
    CURRENT_PASSWORD_INVALID: "Le mot de passe actuel est incorrect.",
    RESET_TOKEN_INVALID: "Ce lien est invalide ou a expiré.",
  },
  invalidEmail: "Saisissez une adresse e-mail valide.",
  passwordTooShort: "Le mot de passe doit contenir au moins 8 caractères.",
  passwordHint: "Au moins 8 caractères",
  retryIn: "Trop de tentatives. Réessayez dans {time}.",
  forgotTitle: "Mot de passe oublié",
  forgotIntro: "Saisissez votre adresse e-mail, nous vous enverrons un lien pour choisir un nouveau mot de passe.",
  forgotSend: "Envoyer le lien",
  forgotSent: "Si un compte existe pour cette adresse, un e-mail vient d'être envoyé.",
  backToLogin: "Retour à la connexion",
  resetTitle: "Nouveau mot de passe",
  resetIntro: "Choisissez un nouveau mot de passe pour votre compte.",
  newPasswordLabel: "Nouveau mot de passe",
  resetSubmit: "Changer le mot de passe",
  resetDone: "Mot de passe modifié. Connectez-vous avec le nouveau.",
  resetTokenInvalid: "Ce lien est invalide ou a expiré.",
  resetRequestNew: "Demander un nouveau lien",

  skipBtn: "Passer",
  preferNotToSay: "Je préfère ne pas dire",
  haveAccount: "J'ai déjà un compte",
  slide1Title: "Suivez vos progrès,",
  slide1Subtitle: "Repoussez vos limites",
  slide2Title: "Ne vous entraînez pas seul,",
  slide2Subtitle: "Rejoignez la communauté Grinta",
  slide3Title: "Fixez vos objectifs",
  slide3Subtitle: "Atteignez-les avec Grinta",
  noFollowedPosts: "Les personnes que vous suivez n'ont pas encore publié.",
  findAthletes: "Trouver des athlètes",
  createFirstWorkoutTitle: "Créez votre première séance",
  createFirstWorkoutHint: "Composez une séance, entraînez-vous, puis partagez-la avec la communauté.",
  createFirstWorkoutBtn: "Nouvelle séance",
  prgToday: "Aujourd'hui",
  prgStartDay: "Démarrer",
  zeroWeightTitle: "0 kg saisi",
  zeroWeightMessage: "Vous soulevez habituellement une charge sur cet exercice. Valider cette série à 0 ?",
  zeroWeightConfirm: "Valider",
  restBetweenSets: "Repos entre les séries",
  loadFailedTitle: "Impossible de charger",
  newsTab: "Actualités",
  newsBetaTag: "Bêta",
  newsBetaTitle: "Grinta est en bêta !",
  newsBetaBody:
    "Bienvenue dans la première version de Grinta. Certaines fonctionnalités sont encore en cours de finition et vous pouvez rencontrer quelques bugs. Vos retours nous aident à améliorer l'application, n'hésitez pas à nous les partager. Merci de faire partie de l'aventure !",

  grpTitle: "Groupes",
  grpEmpty: "Vous n'êtes dans aucun groupe pour l'instant.",
  grpCreate: "Créer un groupe",
  grpNamePlaceholder: "Nom du groupe",
  grpMembers: "Membres",
  grpMemberCount: "{n} membres",
  grpInvitations: "Invitations",
  grpNoInvitations: "Aucune invitation en attente.",
  grpInviteLabel: "Inviter quelqu'un",
  grpInvitePlaceholder: "@pseudo",
  grpInviteSend: "Inviter",
  grpPending: "En attente",
  grpInvitedBy: "Invité par {name}",
  grpAccept: "Accepter",
  grpDecline: "Refuser",
  grpRename: "Renommer",
  grpLeave: "Quitter le groupe",
  grpLeaveConfirm: "Voulez-vous vraiment quitter ce groupe ?",
  grpDelete: "Supprimer le groupe",
  grpDeleteConfirm: "Le groupe sera supprimé pour tous ses membres.",
  grpActivity: "Activité",
  grpNoActivity: "Rien pour l'instant. Les séances publiées et les posts partagés apparaissent ici.",
  grpLoadMore: "Voir plus",
  grpWorkoutEvent: "{name} s'est entraîné",
  grpRecordEvent: "Record battu : {exercise}",
  grpShareEvent: "{name} a partagé la séance de {author}",
  grpRemoveShare: "Retirer",
  grpSend: "Envoyer dans un groupe",
  grpSendTitle: "Choisir un groupe",
  grpSent: "Post envoyé dans le groupe.",
  grpOpen: "Ouvrir le post",
  grpCreator: "Créateur",

  prgStart: "Commencer ce programme",
  prgStarted: "Programme commencé",
  prgStartedMessage: "Il remplace le programme suivi jusque-là.",

  tdTitle: "Séance du jour",
  tdDay: "Jour {n} sur {total}",
  tdStart: "Démarrer",
  tdRest: "Jour de repos",
  tdNotStarted: "Votre programme commence dans {n} jour(s)",
  tdCycle: "Tour {n}",

  cmNone: "Aucune séance choisie",
  cmNoneRest: "Jour de repos au programme",
  cmFromProgramme: "Séance du jour · Jour {n} sur {total}",
  cmChoose: "Choisir",
  cmChosen: "Choisie",

  sgTitle: "Que faire aujourd'hui ?",
  sgSubtitle: "Vise les muscles les moins entraînés",
  sgMuscleLine: "{muscle} : {n} séries cette semaine",
  sgAlternatives: "Autres idées",
  sgStart: "Démarrer",

  shrCard: "Partager",
  shrCardTitle: "Card de partage",
  shrCardUnavailable: "Le partage n'est pas disponible sur cet appareil.",
  shrTypeSummary: "Classique",
  shrTypeSets: "Séries de travail",
  shrLayoutPoster: "Affiche",
  shrLayoutMinimal: "Épurée",
  shrLayoutTop: "Top charges",
  shrVolumeBig: "Volume total",
  shrBgDark: "Sombre",
  shrBgLight: "Clair",
  shrBgTransparent: "Transparent",
  shrBgPhoto: "Photo",
  shrTransparentHint: "PNG transparent : posez-le sur n'importe quelle photo ou story.",
  shrMoreSets: "+{n}",
};

// Les autres langues retombent sur l'anglais tant qu'elles ne sont pas traduites.
const overrides: Partial<Record<Lang, V3Strings>> = { fr };

export const v3Strings = (lang: Lang): V3Strings => overrides[lang] ?? en;
