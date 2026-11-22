import React from "react";
import { View } from "react-native";
import { Skeleton, SkeletonCircle, SkeletonList, SkeletonText } from "./Skeleton";

/* Squelettes composés, calqués sur les vraies cartes/écrans pour éviter les sauts de mise en page. */

/** Ligne utilisateur : avatar + deux lignes (+ bouton à droite). */
export function UserRowSkeleton({ action = false }: { action?: boolean }) {
  return (
    <View className="flex-row items-center gap-3 rounded-tile bg-surface p-3">
      <SkeletonCircle size={40} />
      <View className="flex-1 gap-2">
        <Skeleton width="45%" height={13} />
        <Skeleton width="30%" height={11} />
      </View>
      {action ? <Skeleton width={72} height={32} radius={16} /> : null}
    </View>
  );
}

export function UserListSkeleton({ count = 6, action = false }: { count?: number; action?: boolean }) {
  return (
    <SkeletonList count={count} gap={8}>
      <UserRowSkeleton action={action} />
    </SkeletonList>
  );
}

/** Carte de post (explorer, profil). */
export function PostCardSkeleton() {
  return (
    <View className="w-full gap-3 rounded-card bg-surface p-4">
      <View className="flex-row items-center gap-3 py-2">
        <SkeletonCircle size={40} />
        <View className="flex-1 gap-2">
          <Skeleton width="40%" height={13} />
          <Skeleton width="25%" height={11} />
        </View>
      </View>
      <View className="gap-2 px-1">
        <Skeleton width="70%" height={18} />
        <SkeletonText lines={2} />
      </View>
      <Skeleton height={150} radius={22} />
      <View className="flex-row gap-3">
        <Skeleton width={64} height={32} radius={16} />
        <Skeleton width={64} height={32} radius={16} />
      </View>
    </View>
  );
}

export function PostListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <SkeletonList count={count} gap={12}>
      <PostCardSkeleton />
    </SkeletonList>
  );
}

/** Carte de séance (liste des workouts). */
export function WorkoutCardSkeleton() {
  return (
    <View className="gap-4 rounded-card bg-surface p-5">
      <View className="flex-row items-center gap-3">
        <Skeleton width={48} height={48} radius={16} />
        <View className="flex-1 gap-2">
          <Skeleton width="55%" height={16} />
          <Skeleton width="35%" height={12} />
        </View>
      </View>
      <View className="flex-row gap-3">
        <Skeleton height={64} radius={22} className="flex-1" />
        <Skeleton height={64} radius={22} className="flex-1" />
      </View>
    </View>
  );
}

export function WorkoutListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonList count={count} gap={12}>
      <WorkoutCardSkeleton />
    </SkeletonList>
  );
}

/** Ligne d'exercice (catalogue, séance, recherche). */
export function ExerciseRowSkeleton() {
  return (
    <View className="flex-row items-center gap-3 rounded-tile bg-surface p-3.5">
      <SkeletonCircle size={48} />
      <View className="flex-1 gap-2">
        <Skeleton width="60%" height={14} />
        <Skeleton width="35%" height={11} />
      </View>
    </View>
  );
}

export function ExerciseListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <SkeletonList count={count} gap={8}>
      <ExerciseRowSkeleton />
    </SkeletonList>
  );
}

/** Ligne générique d'une liste (séances terminées, records, groupes…). */
export function ListRowSkeleton() {
  return (
    <View className="flex-row items-center gap-3 rounded-card bg-surface p-4">
      <View className="flex-1 gap-2">
        <Skeleton width="55%" height={15} />
        <Skeleton width="35%" height={12} />
      </View>
      <Skeleton width={44} height={24} radius={12} />
    </View>
  );
}

export function ListSkeleton({ count = 6, gap = 8 }: { count?: number; gap?: number }) {
  return (
    <SkeletonList count={count} gap={gap}>
      <ListRowSkeleton />
    </SkeletonList>
  );
}

/** Rangée de tuiles de stats (2 colonnes). */
export function StatTilesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View className="flex-row flex-wrap gap-3" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} className="flex-1 basis-[45%] gap-2 rounded-tile bg-surface p-4">
          <Skeleton width="50%" height={11} />
          <Skeleton width="70%" height={22} />
        </View>
      ))}
    </View>
  );
}

/** Carte graphique (stats, progression). */
export function ChartCardSkeleton({ height = 160 }: { height?: number }) {
  return (
    <View className="gap-3 rounded-card bg-surface p-5" accessibilityRole="progressbar">
      <Skeleton width="40%" height={14} />
      <Skeleton height={height} radius={18} />
    </View>
  );
}

/** Onglet Stats : héro + tuiles + graphique. */
export function StatsSkeleton() {
  return (
    <View className="gap-4">
      <View className="gap-2 rounded-hero bg-surface p-5">
        <Skeleton width="35%" height={12} />
        <Skeleton width="55%" height={30} />
      </View>
      <StatTilesSkeleton />
      <ChartCardSkeleton />
    </View>
  );
}

/** Profil (le sien ou celui d'un autre) : avatar, nom, compteurs, bouton. */
export function ProfileHeaderSkeleton() {
  return (
    <View className="items-center gap-3 py-5" accessibilityRole="progressbar">
      <SkeletonCircle size={102} tone="surface" />
      <Skeleton width={160} height={20} tone="surface" />
      <Skeleton width={100} height={13} tone="surface" />
      <View className="flex-row gap-3 pt-2">
        <Skeleton width={96} height={52} radius={22} tone="surface" />
        <Skeleton width={96} height={52} radius={22} tone="surface" />
        <Skeleton width={96} height={52} radius={22} tone="surface" />
      </View>
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View className="gap-4">
      <ProfileHeaderSkeleton />
      <StatTilesSkeleton />
      <PostListSkeleton count={1} />
    </View>
  );
}

/** Page de détail (séance, programme, exercice, groupe) : titre + bloc héro + lignes. */
export function DetailSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View className="gap-4" accessibilityRole="progressbar">
      <View className="gap-3 rounded-hero bg-surface p-5">
        <Skeleton width="60%" height={22} />
        <SkeletonText lines={2} />
        <View className="flex-row gap-3 pt-1">
          <Skeleton height={56} radius={22} className="flex-1" />
          <Skeleton height={56} radius={22} className="flex-1" />
          <Skeleton height={56} radius={22} className="flex-1" />
        </View>
      </View>
      <ExerciseListSkeleton count={rows} />
    </View>
  );
}

/** Formulaire (édition de profil, création d'exercice). */
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <View className="gap-5" accessibilityRole="progressbar">
      {Array.from({ length: fields }, (_, i) => (
        <View key={i} className="gap-2">
          <Skeleton width={90} height={12} tone="surface" />
          <Skeleton height={52} radius={22} tone="surface" />
        </View>
      ))}
    </View>
  );
}

/** Aperçu de séance en direct : carte du corps + liste numérotée, puis tuiles de l'exercice. */
export function WorkoutPreviewSkeleton({
  cardHeight,
  mapWidth,
}: {
  cardHeight: number;
  mapWidth: number;
}) {
  return (
    <View accessibilityRole="progressbar">
      <View className="flex-row gap-3" style={{ height: cardHeight }}>
        <Skeleton width={mapWidth} height={cardHeight} radius={28} tone="surface" />
        <View className="flex-1 gap-4 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} className="flex-row items-center gap-3 rounded-tile bg-surface px-3 py-3">
              <SkeletonCircle size={28} />
              <Skeleton width={i % 2 ? "55%" : "75%"} height={14} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/** Écran « séance en direct » complet : sélecteur, résumé, aperçu et bouton de départ. */
export function CurrentWorkoutSkeleton({
  cardHeight,
  mapWidth,
}: {
  cardHeight: number;
  mapWidth: number;
}) {
  return (
    <View className="flex-1" accessibilityRole="progressbar">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-1">
        <Skeleton height={64} radius={22} tone="surface" className="flex-1" />
        <Skeleton width={44} height={44} radius={22} tone="surface" />
      </View>
      <View className="flex-1 px-4 pb-3 pt-2">
        <View className="mb-3 px-1">
          <Skeleton width="60%" height={14} />
        </View>
        <WorkoutPreviewSkeleton cardHeight={cardHeight} mapWidth={mapWidth} />
      </View>
      <View className="px-4 pb-6 pt-3">
        <Skeleton height={56} radius={28} tone="surface" />
      </View>
    </View>
  );
}

/** Ligne de la feuille « Ajouter un exercice » : nom + muscle à gauche, bouton rond à droite. */
export function ExercisePickRowSkeleton() {
  return (
    <View className="flex-row items-center justify-between gap-3 rounded-tile bg-surface p-4">
      <View className="flex-1 gap-2">
        <Skeleton width="60%" height={16} />
        <Skeleton width="30%" height={11} />
      </View>
      <SkeletonCircle size={24} />
    </View>
  );
}

export function ExercisePickListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <SkeletonList count={count} gap={8}>
      <ExercisePickRowSkeleton />
    </SkeletonList>
  );
}

/** Carte d'un modèle de programme : titre, description, résumé et bouton. */
export function TemplateCardSkeleton() {
  return (
    <View className="gap-3 rounded-card bg-surface p-5">
      <Skeleton width="55%" height={20} />
      <SkeletonText lines={2} />
      <Skeleton width="40%" height={12} />
      <Skeleton height={56} radius={28} />
    </View>
  );
}

export function TemplateListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <SkeletonList count={count} gap={12}>
      <TemplateCardSkeleton />
    </SkeletonList>
  );
}

/** Aperçu d'un modèle : cartes « Jour N » avec leurs exercices. */
export function TemplatePreviewListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View className="gap-2" accessibilityRole="progressbar">
      <Skeleton width={90} height={11} />
      {Array.from({ length: count }, (_, i) => (
        <View key={i} className="gap-2 rounded-tile bg-raised p-4">
          <View className="flex-row items-center justify-between gap-3">
            <Skeleton width={50} height={14} tone="surface" />
            <Skeleton width="35%" height={14} tone="surface" />
          </View>
          <View className="flex-row justify-between gap-3">
            <Skeleton width="50%" height={12} tone="surface" />
            <Skeleton width={36} height={12} tone="surface" />
          </View>
          <View className="flex-row justify-between gap-3">
            <Skeleton width="40%" height={12} tone="surface" />
            <Skeleton width={36} height={12} tone="surface" />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Formulaire de création d'exercice : nom, 2 listes, puces des muscles secondaires, 1 liste, bouton. */
export function ExerciseFormSkeleton() {
  const field = (labelWidth: number, key: string) => (
    <View key={key} className="gap-2">
      <Skeleton width={labelWidth} height={12} className="ml-4" tone="surface" />
      <Skeleton height={56} radius={28} tone="surface" />
    </View>
  );
  const chipWidths = [72, 88, 64, 96, 80, 70, 90, 66, 84, 76];
  return (
    <View className="gap-5" accessibilityRole="progressbar">
      {field(60, "name")}
      {field(110, "equipment")}
      {field(120, "muscle")}
      <View className="gap-2">
        <Skeleton width={130} height={12} className="ml-4" tone="surface" />
        <View className="flex-row flex-wrap gap-2">
          {chipWidths.map((w, i) => (
            <Skeleton key={i} width={w} height={36} radius={18} tone="surface" />
          ))}
        </View>
      </View>
      {field(100, "type")}
      <Skeleton height={56} radius={28} className="mt-3" tone="surface" />
    </View>
  );
}

function SectionHeaderSkeleton({ title }: { title: number }) {
  return (
    <View className="mb-4 flex-row items-center justify-between" accessibilityRole="progressbar">
      <Skeleton width={title} height={22} tone="surface" />
      <View className="flex-row gap-2">
        <SkeletonCircle size={40} tone="surface" />
        <SkeletonCircle size={40} tone="surface" />
      </View>
    </View>
  );
}

/** Page Séances : programme en cours, liste horizontale des programmes, puis séances en liste verticale. */
export function WorkoutsPageSkeleton({ workouts = 4 }: { workouts?: number }) {
  return (
    <View className="gap-6" accessibilityRole="progressbar">
      {/* Programme en cours (≈ ProgrammeHero) */}
      <Skeleton height={216} radius={36} tone="surface" />

      {/* Programmes : rail horizontal de tuiles 176×128 */}
      <View>
        <SectionHeaderSkeleton title={130} />
        <View className="flex-row gap-3 overflow-hidden">
          {Array.from({ length: 3 }, (_, i) => (
            <View key={i} className="h-32 w-44 justify-between rounded-tile bg-surface p-4">
              <SkeletonCircle size={36} />
              <View className="gap-2">
                <Skeleton width="75%" height={15} />
                <Skeleton width="55%" height={11} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Séances : cartes verticales (≈ WorkoutCardHeader) */}
      <View>
        <SectionHeaderSkeleton title={100} />
        <View className="gap-3">
          {Array.from({ length: workouts }, (_, i) => (
            <View key={i} className="flex-row items-center gap-4 rounded-card bg-surface p-4">
              <SkeletonCircle size={48} />
              <View className="flex-1 gap-2">
                <Skeleton width="55%" height={17} />
                <View className="flex-row gap-4">
                  <Skeleton width={70} height={12} />
                  <Skeleton width={50} height={12} />
                </View>
              </View>
              <Skeleton width={18} height={18} radius={9} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
