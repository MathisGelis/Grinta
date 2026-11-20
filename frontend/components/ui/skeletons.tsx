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
