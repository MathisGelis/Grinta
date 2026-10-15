import { getItem, saveItem } from "@/core/services/storage";
import { useTranslation } from "@/contexts/LanguageContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, Alert, ScrollView, StatusBar, Text, View, TextInput, Animated } from "react-native";
import { ProgrammeService } from "@/services/programme.service";
import { WorkoutService, CompletedWorkout } from "@/services/workout.service";
import {
  ConnectionsService,
  FollowRequest,
} from "@/services/connections.service";
import { UserService } from "@/services/user.service";
import { Ionicons } from "@expo/vector-icons";
import { Post, PostsService } from "@/services/posts.service";
import Modal from "react-native-modal";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import RecentWorkout from "@/components/explorePage/RecentsWorkout";
import ProgrammeSection from "@/components/explorePage/ProgrammeSection";
import RequestedUsers from "@/components/explorePage/RequestedUsers";

import { WorkoutTheme } from "@/constants/Colors";
import Screen, { FLOATING_HEADER_OFFSET } from "@/components/ui/Screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SectionHeader from "@/components/ui/SectionHeader";
import SegmentedControl from "@/components/ui/SegmentedControl";
import PressableScale from "@/components/ui/PressableScale";
import { format } from "@/i18n/translations";
import { LOCALES } from "@/i18n/labels";
function getGreetingKey(): "goodMorning" | "goodAfternoon" | "goodEvening" {
  const hour = new Date().getHours();
  if (hour < 12) return "goodMorning";
  if (hour < 18) return "goodAfternoon";
  return "goodEvening";
}

type Programme = {
  id: string;
  title: string;
  description?: string;
  workouts: any[];
};

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang } = useTranslation();
  const { keyboardY, bottomOffset } = useKeyboardOffset(-30);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<CompletedWorkout[]>([]);
  const [userId, setUserId] = useState("");
  const [requests, setRequests] = useState<FollowRequest[]>([]);

  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [postFeed, setPostFeed] = useState<"top" | "followed">("top");
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [postModalTitle, setPostModalTitle] = useState("");
  const [postModalType, setPostModalType] = useState<
    "likes" | "comments" | null
  >(null);
  const [postModalPostId, setPostModalPostId] = useState<string | null>(null);
  const [postModalData, setPostModalData] = useState<any[]>([]);
  const [postModalLoading, setPostModalLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const handleSubmitComment = useCallback(async () => {
    const trimmed = commentDraft.trim();
    if (!trimmed || !postModalPostId) return;

    const optimisticComment = {
      id: `local-${Date.now()}`,
      displayName: t.youLabel,
      content: trimmed,
      createdAt: new Date().toISOString(),
      userId: userId,
    };

    setPostModalData((prev) => [optimisticComment, ...prev]);
    setCommentDraft("");

    try {
      await PostsService.commentOnPost(postModalPostId, trimmed);
    } catch (error: any) {
      setPostModalData((prev) =>
        prev.filter((comment) => comment.id !== optimisticComment.id),
      );
      Alert.alert(
        t.error,
        error?.message || t.cannotSendComment,
      );
    }
  }, [t, commentDraft, postModalPostId, userId]);

  const handleStartEditingComment = useCallback((comment: any) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content ?? comment.message ?? "");
  }, []);

  const handleSaveEditedComment = useCallback(async () => {
    if (!editingCommentId) return;

    const trimmed = editingCommentText.trim();
    if (!trimmed) return;

    const original = postModalData.find(
      (comment) => comment.id === editingCommentId,
    );
    const previousContent = original?.content ?? original?.message ?? "";

    setPostModalData((prev) =>
      prev.map((comment) =>
        comment.id === editingCommentId
          ? { ...comment, content: trimmed }
          : comment,
      ),
    );
    setEditingCommentId(null);
    setEditingCommentText("");

    try {
      await PostsService.EditComment(editingCommentId, trimmed);
    } catch (error: any) {
      setPostModalData((prev) =>
        prev.map((comment) =>
          comment.id === editingCommentId
            ? { ...comment, content: previousContent }
            : comment,
        ),
      );
      Alert.alert(
        t.error,
        error?.message || t.cannotEditComment,
      );
    }
  }, [t, editingCommentId, editingCommentText, postModalData]);

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!commentId) return;

      Alert.alert(t.delete, t.deleteCommentConfirm, [
        { text: t.cancel, style: "cancel" },
        {
          text: t.delete,
          style: "destructive",
          onPress: async () => {
            const previous = postModalData;
            setPostModalData((prev) =>
              prev.filter((comment) => comment.id !== commentId),
            );

            try {
              await PostsService.deleteComment(commentId);
            } catch (error: any) {
              setPostModalData(previous);
              Alert.alert(
                t.error,
                error?.message || t.cannotDeleteComment,
              );
            }
          },
        },
      ]);
    },
    [t, postModalData],
  );

  const openReportComment = useCallback((commentId: string) => {
    setReportCommentId(commentId);
    setReportReason("");
    setReportModalVisible(true);
  }, []);

  const handleSubmitReport = useCallback(async () => {
    if (!reportCommentId) return;
    const trimmedReason = reportReason.trim();
    if (!trimmedReason) {
      Alert.alert(t.reportTitle, t.reportReasonRequired);
      return;
    }

    try {
      await PostsService.reportComment(reportCommentId, trimmedReason);
      setReportModalVisible(false);
      setReportCommentId(null);
      setReportReason("");
      Alert.alert(t.reportTitle, t.reportSentMsg);
    } catch (error: any) {
      Alert.alert(
        t.error,
        error?.message || t.cannotReportComment,
      );
    }
  }, [t, reportCommentId, reportReason]);

  const openPostModal = useCallback(
    (title: string, type: "likes" | "comments", postId: string) => {
      setPostModalTitle(title);
      setPostModalType(type);
      setPostModalPostId(postId);
      setPostModalVisible(true);
      if (type === "comments") {
        setCommentDraft("");
      }
    },
    [],
  );

  const closePostModal = useCallback(() => {
    setPostModalVisible(false);
    setPostModalTitle("");
    setPostModalType(null);
    setPostModalPostId(null);
    setPostModalData([]);
    setCommentDraft("");
  }, []);

  const handleToggleLike = useCallback(async (post: Post) => {
    setTopPosts((prev) =>
      prev.map((item) => {
        if (item.id !== post.id) return item;

        const nextLiked = !item.isLiked;
        const currentLikes = Number(item.likesCount ?? 0);

        return {
          ...item,
          isLiked: nextLiked,
          likesCount: String(Math.max(0, currentLikes + (nextLiked ? 1 : -1))),
        };
      }),
    );

    try {
      await PostsService.likePost(post.id);
    } catch {
      setTopPosts((prev) =>
        prev.map((item) => {
          if (item.id !== post.id) return item;
          const currentLikes = Number(item.likesCount ?? 0);
          const revertedLiked = !item.isLiked;

          return {
            ...item,
            isLiked: revertedLiked,
            likesCount: String(
              Math.max(0, currentLikes + (revertedLiked ? 1 : -1)),
            ),
          };
        }),
      );
    }
  }, []);

  useEffect(() => {
    getItem("user_name").then((name) => {
      if (name) setUserName(name);
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const me = await UserService.getMe();
      setUserId(me.id);
      if (me.displayName) {
        setUserName(me.displayName);
        saveItem("user_name", me.displayName);
      }

      const [programmesData, workoutsData, requestsData, postsData] =
        await Promise.all([
          ProgrammeService.getAll().catch(() => []),
          WorkoutService.getCompleted().catch(() => []),
          ConnectionsService.getRequests().catch(() => []),
          postFeed === "top"
            ? PostsService.getTopPosts(5)
            : PostsService.getFollowedPosts(5),
        ]);
      setProgrammes(programmesData);
      setRecentWorkouts(workoutsData.slice(0, 3));
      setRequests(requestsData);
      setTopPosts(postsData);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [postFeed]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!postModalVisible || !postModalType || !postModalPostId) return;

    const fetchPostModalData = async () => {
      setPostModalLoading(true);
      try {
        const data =
          postModalType === "likes"
            ? await PostsService.getPostLikes(postModalPostId)
            : await PostsService.getPostComments(postModalPostId);

        setPostModalData(data);
      } catch {
        setPostModalData([]);
      } finally {
        setPostModalLoading(false);
      }
    };

    fetchPostModalData();
  }, [postModalVisible, postModalType, postModalPostId]);

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      <Screen
        topInset={false}
        contentContainerStyle={{ paddingTop: insets.top + FLOATING_HEADER_OFFSET }}
      >
        <View>
          <Text className="text-sm text-ink-muted">{t[getGreetingKey()]}</Text>
          <Text
            className="mt-1 text-[32px] font-semibold text-ink"
            style={{ letterSpacing: -0.5 }}
            numberOfLines={1}
          >
            {t.hello}
            {userName ? ` ${userName}` : ""}
          </Text>
        </View>

        <View className="gap-4">
          <SectionHeader title={t.todaysCommunityFavorite} />
          <SegmentedControl
            variant="glass"
            value={postFeed}
            onChange={setPostFeed}
            options={[
              { value: "top", label: t.topPostsTab },
              { value: "followed", label: t.followedPeopleTab },
            ]}
          />
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={WorkoutTheme.accent.purple}
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            <View className="-mx-5">
              {topPosts.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-3 px-5"
                >
                  {topPosts.map((post) => (
                    <PressableScale
                      key={post.id}
                      className="w-[220px] rounded-card bg-surface p-5"
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/explore/userPost",
                          params: {
                            postId: post.id,
                            post: JSON.stringify(post),
                          },
                        } as any)
                      }
                    >
                      <View className="mb-6 flex-row items-center gap-3">
                        <View className="h-9 w-9 items-center justify-center rounded-full bg-accent-tint">
                          <Text className="text-sm font-bold text-ink">
                            {post.displayName?.[0]?.toUpperCase() ?? "?"}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-sm font-semibold text-ink"
                            numberOfLines={1}
                          >
                            {post.displayName}
                          </Text>
                          <Text className="mt-0.5 text-[12px] text-ink-muted">
                            {new Date(post.createdAt).toLocaleDateString(LOCALES[lang])}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row w-full items-center justify-evenly gap-3">
                        <PressableScale
                          className="flex-row items-center gap-1 px-6 py-1"
                          onPress={() => handleToggleLike(post)}
                          onLongPress={() =>
                            openPostModal(t.likesTitle, "likes", post.id)
                          }
                          delayLongPress={300}
                        >
                          {post.isLiked ? (
                            <Ionicons name="heart" size={20} color={WorkoutTheme.status.danger} />
                          ) : (
                            <Ionicons
                              name="heart-outline"
                              size={20}
                              color={WorkoutTheme.status.danger}
                            />
                          )}
                          <Text className="text-[16px] text-ink">
                            {post.likesCount}
                          </Text>
                        </PressableScale>
                        <PressableScale
                          className="flex-row items-center gap-1 px-6 py-1"
                          onPress={() =>
                            openPostModal(t.commentsTitle, "comments", post.id)
                          }
                        >
                          <Ionicons
                            name="chatbubble-outline"
                            size={20}
                            color={WorkoutTheme.accent.purple}
                          />
                          <Text className="text-[16px] text-ink">
                            {post.commentsCount}
                          </Text>
                        </PressableScale>
                      </View>
                    </PressableScale>
                  ))}
                </ScrollView>
              ) : (
                <View className="mx-5 rounded-card bg-surface p-8">
                  <Text className="text-center text-base font-semibold text-ink-muted">
                    {t.noPopularPosts}
                  </Text>
                </View>
              )}
            </View>
            <RequestedUsers requests={requests} setRequests={setRequests} />
            <ProgrammeSection programmes={programmes} />
            <RecentWorkout recentWorkouts={recentWorkouts} />
          </>
        )}
      </Screen>

      <Modal
        isVisible={reportModalVisible}
        onBackdropPress={() => {
          setReportModalVisible(false);
          setReportCommentId(null);
          setReportReason("");
        }}
        animationIn="fadeIn"
        animationOut="fadeOut"
        useNativeDriverForBackdrop
        useNativeDriver
        hideModalContentWhileAnimating
        style={{ justifyContent: "center", margin: 24 }}
      >
        <View className="rounded-full bg-surface p-4">
          <Text className="mb-2 text-lg font-semibold text-ink">
            {t.reportThisComment}
          </Text>
          <Text className="mb-3 text-sm text-ink-soft">
            {t.reportExplain}
          </Text>
          <TextInput
            value={reportReason}
            onChangeText={setReportReason}
            multiline
            textAlignVertical="top"
            placeholder={t.reportPlaceholder}
            placeholderTextColor={WorkoutTheme.text.tertiary}
            className="min-h-[100px] rounded-full border border-line bg-background px-3 py-3 text-sm text-ink"
          />
          <View className="mt-4 flex-row justify-end gap-2">
            <PressableScale
              onPress={() => {
                setReportModalVisible(false);
                setReportReason("");
                setReportCommentId(null);
              }}
              className="rounded-full bg-raised px-3 py-2"
            >
              <Text className="text-sm text-ink-soft">{t.cancel}</Text>
            </PressableScale>
            <PressableScale
              onPress={handleSubmitReport}
              className="rounded-full bg-accent px-3 py-2"
            >
              <Text className="text-sm font-semibold text-ink">{t.sendLabel}</Text>
            </PressableScale>
          </View>
        </View>
      </Modal>

      <Modal
        isVisible={postModalVisible}
        onBackdropPress={closePostModal}
        onSwipeComplete={closePostModal}
        swipeDirection="down"
        propagateSwipe
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriverForBackdrop
        useNativeDriver
        hideModalContentWhileAnimating
        style={{ justifyContent: "flex-end", margin: 0 }}
      >
        <View className="h-[80%] rounded-t-hero bg-background p-4 pb-6">
          <View className="mb-4 h-1.5 w-16 self-center rounded-full bg-line" />
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-semibold text-ink">
              {postModalTitle}
            </Text>
            <PressableScale onPress={closePostModal}>
              <Ionicons name="close" size={22} color={WorkoutTheme.text.secondary} />
            </PressableScale>
          </View>

          {postModalLoading ? (
            <Text className="text-center text-sm text-ink-soft">
              {t.loadingEllipsis}
            </Text>
          ) : postModalType === "likes" ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              scrollEnabled
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 12 }}
            >
              {postModalData.length > 0 ? (
                <View className="gap-3">
                  {postModalData.map((like: any) => (
                    <PressableScale
                      key={like.id}
                      className="rounded-full bg-surface p-3"
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/explore/user-profile",
                          params: { userId: like.userId },
                        })
                      }
                    >
                      <Text className="text-sm font-semibold text-ink">
                        {like.displayName ?? t.userLabel}
                      </Text>
                      <Text className="mt-1 text-xs text-ink-soft">
                        @{like.uniqueName ?? "unknown"}
                      </Text>
                    </PressableScale>
                  ))}
                </View>
              ) : (
                <Text className="justify-center text-sm text-ink-soft">
                  {t.noLikesOnPost}
                </Text>
              )}
            </ScrollView>
          ) : postModalType === "comments" ? (
            <View className="flex-1">
              <View className="mb-2">
                <Text className="text-xs text-ink-soft">
                  {format(t.commentsCount, { n: postModalData.length })}
                </Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                scrollEnabled
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 82 }}
                keyboardShouldPersistTaps="handled"
              >
                {postModalData.length > 0 ? (
                  <View className="gap-3">
                    {postModalData.map((comment: any) => {
                      const commentUserId =
                        comment.userId ??
                        comment.user_id ??
                        comment.authorId ??
                        "";
                      const isOwnComment =
                        String(commentUserId) === String(userId);
                      const isEditingThisComment =
                        editingCommentId === comment.id;

                      return (
                        <PressableScale
                          key={
                            comment.id ??
                            `${commentUserId}-${comment.createdAt}`
                          }
                          onLongPress={() => openReportComment(comment.id)}
                          className="rounded-tile bg-surface p-3"
                        >
                          <View className="mb-2 flex-row items-center justify-between gap-2">
                            <Text className="text-sm font-semibold text-ink">
                              {comment.displayName ??
                                comment.userName ??
                                t.userLabel}
                            </Text>

                            {isOwnComment && !isEditingThisComment && (
                              <View className="flex-row items-center gap-2">
                                <PressableScale
                                  onPress={() =>
                                    handleStartEditingComment(comment)
                                  }
                                >
                                  <Ionicons
                                    name="create-outline"
                                    size={16}
                                    color={WorkoutTheme.status.info}
                                  />
                                </PressableScale>
                                <PressableScale
                                  onPress={() =>
                                    handleDeleteComment(comment.id)
                                  }
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={16}
                                    color={WorkoutTheme.status.danger}
                                  />
                                </PressableScale>
                              </View>
                            )}
                          </View>

                          {isEditingThisComment ? (
                            <View className="gap-2">
                              <TextInput
                                value={editingCommentText}
                                onChangeText={setEditingCommentText}
                                multiline
                                textAlignVertical="top"
                                placeholder={t.editYourComment}
                                placeholderTextColor={WorkoutTheme.text.tertiary}
                                className="min-h-[80px] rounded-xl border border-line bg-background px-3 py-2 text-sm text-ink"
                              />
                              <View className="flex-row justify-end gap-2">
                                <PressableScale
                                  onPress={() => {
                                    setEditingCommentId(null);
                                    setEditingCommentText("");
                                  }}
                                  className="rounded-lg bg-raised px-3 py-2"
                                >
                                  <Text className="text-xs text-ink-soft">
                                    {t.cancel}
                                  </Text>
                                </PressableScale>
                                <PressableScale
                                  onPress={handleSaveEditedComment}
                                  className="rounded-full bg-accent px-3 py-2"
                                >
                                  <Text className="text-xs font-semibold text-ink">
                                    {t.save}
                                  </Text>
                                </PressableScale>
                              </View>
                            </View>
                          ) : (
                            <Text className="mt-2 text-xs text-ink-soft">
                              {comment.content ??
                                comment.message ??
                                t.noCommentsShort}
                            </Text>
                          )}
                        </PressableScale>
                      );
                    })}
                  </View>
                ) : (
                  <Text className="text-sm text-ink-soft">
                    {t.noCommentsOnPost}
                  </Text>
                )}
              </ScrollView>

              <Animated.View
                className="absolute left-0 right-0"
                style={{
                  bottom: bottomOffset,
                  transform: [{ translateY: keyboardY }],
                }}
              >
                <View className="flex-row items-end gap-2 rounded-tile border border-line bg-surface p-2">
                  <TextInput
                    value={commentDraft}
                    onChangeText={setCommentDraft}
                    placeholder={t.writeComment}
                    placeholderTextColor={WorkoutTheme.text.tertiary}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    blurOnSubmit={false}
                    returnKeyType="default"
                    submitBehavior="newline"
                    className="flex-1 min-h-[40px] max-h-[120px] px-2 py-2 text-sm text-ink"
                  />
                  <PressableScale
                    onPress={handleSubmitComment}
                    className="h-10 w-10 items-center justify-center rounded-full bg-accent"
                    disabled={!commentDraft.trim()}
                    style={{ opacity: commentDraft.trim() ? 1 : 0.5 }}
                  >
                    <Ionicons name="send" size={16} color={WorkoutTheme.text.primary} />
                  </PressableScale>
                </View>
              </Animated.View>
            </View>
          ) : (
            <Text className="text-sm text-ink-soft">
              {t.noContentAvailable}
            </Text>
          )}
        </View>
      </Modal>
    </View>
  );
}
