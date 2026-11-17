import { formatDate } from "@/utils/formatDate";
import { useUnits } from "@/contexts/UnitsContext";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "@/components/ui/AppModal";
import Avatar from "@/components/ui/Avatar";
import PressableScale from "@/components/ui/PressableScale";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { ApiError } from "@/services/api";
import { ConnectionsService, type UserListItem } from "@/services/connections.service";
import {
  compareExerciseStats,
  type CompareStats,
  type ExerciseComparison,
} from "@/services/exercises.service";
import { UserService, type CurrentUser } from "@/services/user.service";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { ListSkeleton, UserListSkeleton } from "@/components/ui/skeletons";

type Props = {
  exerciseId: string;
  visible: boolean;
  onClose: () => void;
};

const round = (n: number) => Math.round(n * 10) / 10;

/** Compare mes stats à celles d'une personne suivie (ses séances publiées uniquement). */
export default function CompareSheet({ exerciseId, visible, onClose }: Props) {
  const { t, lang } = useTranslation();
  const { formatWeight } = useUnits();
  const myId = useCurrentUserId();
  const [me, setMe] = useState<CurrentUser | null>(null);
  const { height: windowHeight } = useWindowDimensions();
  const [following, setFollowing] = useState<UserListItem[] | null>(null);
  const [comparison, setComparison] = useState<ExerciseComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !myId) return;
    let cancelled = false;
    ConnectionsService.getFollowing(myId)
      .then((data) => !cancelled && setFollowing(data))
      .catch(() => !cancelled && setFollowing([]));
    return () => {
      cancelled = true;
    };
  }, [visible, myId]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    UserService.getMe()
      .then((data) => !cancelled && setMe(data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setComparison(null);
      setError(null);
    }
  }, [visible]);

  const pick = async (user: UserListItem) => {
    try {
      setLoading(true);
      setError(null);
      setComparison(await compareExerciseStats(exerciseId, user.id));
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 403
          ? t.cmpNotFollowing
          : err instanceof Error
            ? err.message
            : t.loadingError,
      );
    } finally {
      setLoading(false);
    }
  };

  const rows = (stats: CompareStats | null) => [
    { label: t.heaviestWeightLabel, value: stats?.heaviestWeight ?? null, unit: "kg" },
    { label: t.oneRepMaxLabel, value: stats?.estimatedOneRepMax ?? null, unit: "kg" },
    { label: t.recordSessionVolume, value: stats?.bestSessionVolume ?? null, unit: "kg" },
    { label: t.cmpMaxReps, value: stats?.maxReps ?? null, unit: "" },
    { label: t.cmpSessions, value: stats?.totalSessions ?? 0, unit: "" },
  ];

  const cell = (value: number | null, unit: string) =>
    value == null
      ? "–"
      : unit === "kg"
        ? formatWeight(value)
        : `${round(value)}${unit ? ` ${unit}` : ""}`;

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={{ justifyContent: "flex-end", margin: 0 }}
    >
      <View
        className="rounded-t-hero bg-surface px-5 pb-8 pt-3"
        style={{ maxHeight: windowHeight * 0.8 }}
      >
        <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-raised" />
        <Text className="mb-4 text-xl font-semibold text-ink">
          {comparison ? comparison.exercise.name : t.cmpPickUser}
        </Text>

        {error ? <Text className="mb-3 text-sm text-danger">{error}</Text> : null}

        {loading ? (
          <ListSkeleton count={4} />
        ) : comparison ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3">
            <View className="flex-row items-center rounded-tile bg-raised px-3 py-4">
              <View className="flex-1 items-center gap-1.5">
                <Avatar uri={me?.avatarThumbnailUrl ?? me?.avatarUrl} name={me?.displayName} size={44} />
                <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
                  {me?.displayName ?? t.cmpMe}
                </Text>
                <Text className="text-center text-xs text-ink-muted">
                  {t.cmpLastPerformed} :{" "}
                  {comparison.me?.lastPerformedAt
                    ? formatDate(comparison.me.lastPerformedAt, lang)
                    : t.cmpNever}
                </Text>
              </View>
              <PressableScale
                halo={false}
                hitSlop={12}
                onPress={() => setComparison(null)}
                accessibilityRole="button"
                accessibilityLabel={t.cmpPickUser}
                className="px-3"
              >
                <Ionicons name="swap-horizontal" size={20} color={WorkoutTheme.text.tertiary} />
              </PressableScale>
              <View className="flex-1 items-center gap-1.5">
                <Avatar
                  uri={comparison.user.avatarThumbnailUrl}
                  name={comparison.user.displayName}
                  size={44}
                />
                <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
                  {comparison.user.displayName}
                </Text>
                <Text className="text-center text-xs text-ink-muted">
                  {t.cmpLastPerformed} :{" "}
                  {comparison.them?.lastPerformedAt
                    ? formatDate(comparison.them.lastPerformedAt, lang)
                    : t.cmpNever}
                </Text>
              </View>
            </View>

            <Text className="px-1 text-center text-xs text-ink-muted">{t.cmpOnlyPublished}</Text>

            {rows(comparison.me).map((row, index) => {
              const theirs = rows(comparison.them)[index];
              return (
                <View key={row.label} className="flex-row items-center rounded-tile bg-raised px-3 py-3">
                  <Text className="flex-1 text-center text-base font-semibold text-ink">
                    {cell(row.value, row.unit)}
                  </Text>
                  <Text className="flex-[1.3] px-2 text-center text-xs text-ink-muted">
                    {row.label}
                  </Text>
                  <Text className="flex-1 text-center text-base font-semibold text-ink">
                    {cell(theirs.value, theirs.unit)}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        ) : following === null ? (
          <UserListSkeleton count={4} />
        ) : following.length === 0 ? (
          <Text className="py-6 text-center text-sm text-ink-muted">{t.cmpNoFollowing}</Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-2">
            {following.map((user) => (
              <PressableScale
                key={user.id}
                halo={false}
                onPress={() => pick(user)}
                className="flex-row items-center gap-3 rounded-tile bg-raised p-3"
              >
                <Avatar uri={user.avatarThumbnailUrl} name={user.displayName} size={40} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
                    {user.displayName}
                  </Text>
                  <Text className="text-xs text-ink-muted" numberOfLines={1}>
                    @{user.uniqueName}
                  </Text>
                </View>
              </PressableScale>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
