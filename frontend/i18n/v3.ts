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
  pcSetsCount: "{n} sets",
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
  pcSetsCount: "{n} séries",
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
