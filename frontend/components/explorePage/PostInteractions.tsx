import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { PostsService, ReportReason } from "@/services/posts.service";
import { isNotFound } from "@/services/api";
import Modal from "@/components/ui/AppModal";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { WorkoutTheme } from "@/constants/Colors";
import Avatar from "@/components/ui/Avatar";
import PressableScale from "@/components/ui/PressableScale";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { TextField } from "@/components/ui/FormField";
import Chip from "@/components/ui/Chip";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";

const REPORT_REASONS: ReportReason[] = [
  "spam",
  "harassment",
  "hate_speech",
  "inappropriate",
  "other",
];

type Options = {
  userProfilePath?: string;
};

export function usePostInteractions(
  userId: string,
  { userProfilePath = "/(tabs)/explore/user-profile" }: Options = {},
) {
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const { keyboardY, bottomOffset } = useKeyboardOffset(-30);
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
  const [reportReason, setReportReason] = useState<ReportReason | null>(null);
  const [postOwnerId, setPostOwnerId] = useState<string | null>(null);

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
    setReportReason(null);
  }, []);

  const closeReport = useCallback(() => {
    setReportCommentId(null);
    setReportReason(null);
  }, []);

  const handleSubmitReport = useCallback(async () => {
    if (!reportCommentId) return;
    if (!reportReason) {
      Alert.alert(t.reportTitle, t.reportReasonRequired);
      return;
    }

    try {
      await PostsService.reportComment(reportCommentId, reportReason);
      closeReport();
      Alert.alert(t.reportTitle, t.reportSentMsg);
    } catch (error: any) {
      Alert.alert(t.error, error?.message || t.cannotReportComment);
    }
  }, [t, reportCommentId, reportReason, closeReport]);

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
    setReportCommentId(null);
    setReportReason(null);
    setPostOwnerId(null);
    setPostModalVisible(false);
    setPostModalTitle("");
    setPostModalType(null);
    setPostModalPostId(null);
    setPostModalData([]);
    setCommentDraft("");
  }, []);


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
        if (postModalType === "comments") {
          PostsService.getPostById(postModalPostId)
            .then((post) => setPostOwnerId(post?.userId ?? null))
            .catch(() => {});
        }
      } catch (error) {
        setPostModalData([]);
        // Post d'un compte privé (ou supprimé) : le serveur répond 404.
        if (isNotFound(error)) {
          closePostModal();
          Alert.alert(t.error, t.postUnavailable);
        }
      } finally {
        setPostModalLoading(false);
      }
    };

    fetchPostModalData();
  }, [postModalVisible, postModalType, postModalPostId, closePostModal, t]);


  const openLikes = useCallback(
    (postId: string) => openPostModal(t.likesTitle, "likes", postId),
    [openPostModal, t],
  );
  const openComments = useCallback(
    (postId: string) => openPostModal(t.commentsTitle, "comments", postId),
    [openPostModal, t],
  );

  const reportReasonLabels: Record<ReportReason, string> = {
    spam: t.reportReasonSpam,
    harassment: t.reportReasonHarassment,
    hate_speech: t.reportReasonHateSpeech,
    inappropriate: t.reportReasonInappropriate,
    other: t.reportReasonOther,
  };

  const modalsElement = (
    <>
      <Modal
        isVisible={postModalVisible}
        onBackdropPress={closePostModal}
        onSwipeComplete={closePostModal}
        swipeDirection="down"
        animationIn="slideInUp"
        style={{ justifyContent: "flex-end", margin: 0 }}
      >
        <View
          className="rounded-t-hero bg-surface px-5 pb-6 pt-3"
          style={{ height: windowHeight * 0.8 }}
        >
          <View className="mb-5 h-1.5 w-12 self-center rounded-full bg-raised" />
          <View className="mb-5 flex-row items-center justify-between">
            <Text className="text-2xl font-semibold text-ink">
              {postModalTitle}
            </Text>
            <IconButton icon="close" label={t.back} onPress={closePostModal} />
          </View>

          {postModalLoading ? (
            <ActivityIndicator
              size="small"
              color={WorkoutTheme.accent.purple}
              style={{ marginTop: 24 }}
            />
          ) : postModalType === "likes" ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 12 }}
            >
              {postModalData.length > 0 ? (
                <View className="gap-3">
                  {postModalData.map((like: any) => (
                    <PressableScale
                      key={like.id}
                      className="flex-row items-center gap-3 rounded-tile bg-raised p-4"
                      disabled={String(like.id) === String(userId)}
                      onPress={() => {
                        closePostModal();
                        router.push({
                          pathname: userProfilePath as any,
                          params: { userId: like.userId ?? like.id },
                        });
                      }}
                    >
                      <Avatar
                        uri={like.avatarThumbnailUrl}
                        name={like.displayName ?? t.userLabel}
                        size={44}
                      />
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                          {like.displayName ?? t.userLabel}
                        </Text>
                        <Text className="mt-0.5 text-sm text-ink-muted" numberOfLines={1}>
                          @{like.uniqueName ?? "unknown"}
                        </Text>
                      </View>
                      <Ionicons name="heart" size={18} color={WorkoutTheme.status.danger} />
                    </PressableScale>
                  ))}
                </View>
              ) : (
                <View className="items-center gap-2 rounded-card bg-raised p-8">
                  <Ionicons name="heart-outline" size={28} color={WorkoutTheme.text.tertiary} />
                  <Text className="text-center text-sm text-ink-muted">
                    {t.noLikesOnPost}
                  </Text>
                </View>
              )}
            </ScrollView>
          ) : postModalType === "comments" ? (
            <View className="flex-1">
              <Text className="mb-3 ml-1 text-sm text-ink-muted">
                {format(t.commentsCount, { n: postModalData.length })}
              </Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 90 }}
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
                      const isPostOwner =
                        !!postOwnerId && String(postOwnerId) === String(userId);
                      const isEditingThisComment =
                        editingCommentId === comment.id;
                      const author =
                        comment.displayName ?? comment.userName ?? t.userLabel;

                      return (
                        <View
                          key={
                            comment.id ??
                            `${commentUserId}-${comment.createdAt}`
                          }
                          className="gap-3 rounded-tile bg-raised p-4"
                        >
                          <View className="flex-row items-center gap-3">
                            <Avatar uri={comment.avatarThumbnailUrl} name={author} size={36} />
                            <Text className="flex-1 text-sm font-semibold text-ink" numberOfLines={1}>
                              {author}
                            </Text>

                            {!isEditingThisComment && (
                              <View className="flex-row items-center gap-2">
                                {isOwnComment ? (
                                  <PressableScale
                                    onPress={() => handleStartEditingComment(comment)}
                                    accessibilityRole="button"
                                    accessibilityLabel={t.editYourComment}
                                    className="h-9 w-9 items-center justify-center rounded-full bg-surface"
                                  >
                                    <Ionicons
                                      name="create-outline"
                                      size={16}
                                      color={WorkoutTheme.text.primary}
                                    />
                                  </PressableScale>
                                ) : (
                                  <PressableScale
                                    onPress={() => openReportComment(comment.id)}
                                    accessibilityRole="button"
                                    accessibilityLabel={t.reportThisComment}
                                    className="h-9 w-9 items-center justify-center rounded-full bg-surface"
                                  >
                                    <Ionicons
                                      name="flag-outline"
                                      size={16}
                                      color={WorkoutTheme.text.primary}
                                    />
                                  </PressableScale>
                                )}
                                {isOwnComment || isPostOwner ? (
                                  <PressableScale
                                    onPress={() => handleDeleteComment(comment.id)}
                                    accessibilityRole="button"
                                    accessibilityLabel={t.delete}
                                    className="h-9 w-9 items-center justify-center rounded-full bg-danger-tint"
                                  >
                                    <Ionicons
                                      name="trash-outline"
                                      size={16}
                                      color={WorkoutTheme.status.danger}
                                    />
                                  </PressableScale>
                                ) : null}
                              </View>
                            )}
                          </View>

                          {isEditingThisComment ? (
                            <View className="gap-3">
                              <TextField
                                value={editingCommentText}
                                onChangeText={setEditingCommentText}
                                multiline
                                placeholder={t.editYourComment}
                              />
                              <View className="flex-row justify-end gap-2">
                                <PressableScale
                                  onPress={() => {
                                    setEditingCommentId(null);
                                    setEditingCommentText("");
                                  }}
                                  className="h-10 justify-center rounded-full bg-surface px-5"
                                >
                                  <Text className="text-sm text-ink-soft">{t.cancel}</Text>
                                </PressableScale>
                                <PressableScale
                                  onPress={handleSaveEditedComment}
                                  className="h-10 justify-center rounded-full bg-accent px-5"
                                >
                                  <Text className="text-sm font-semibold text-ink">{t.save}</Text>
                                </PressableScale>
                              </View>
                            </View>
                          ) : (
                            <Text className="text-base text-ink-soft">
                              {comment.content ??
                                comment.message ??
                                t.noCommentsShort}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View className="items-center gap-2 rounded-card bg-raised p-8">
                    <Ionicons name="chatbubble-outline" size={28} color={WorkoutTheme.text.tertiary} />
                    <Text className="text-center text-sm text-ink-muted">
                      {t.noCommentsOnPost}
                    </Text>
                  </View>
                )}
              </ScrollView>

              <Animated.View
                className="absolute left-0 right-0"
                style={{
                  bottom: bottomOffset,
                  transform: [{ translateY: keyboardY }],
                }}
              >
                <View className="flex-row items-end gap-2 rounded-[28px] bg-raised p-2 pl-5">
                  <TextInput
                    value={commentDraft}
                    onChangeText={setCommentDraft}
                    placeholder={t.writeComment}
                    placeholderTextColor={WorkoutTheme.text.tertiary}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="center"
                    blurOnSubmit={false}
                    returnKeyType="default"
                    submitBehavior="newline"
                    className="max-h-[120px] min-h-[44px] flex-1 py-2.5 text-base text-ink"
                  />
                  <PressableScale
                    onPress={handleSubmitComment}
                    accessibilityRole="button"
                    accessibilityLabel={t.sendLabel}
                    className="h-11 w-11 items-center justify-center rounded-full bg-accent"
                    disabled={!commentDraft.trim()}
                    style={{ opacity: commentDraft.trim() ? 1 : 0.5 }}
                  >
                    <Ionicons name="send" size={16} color={WorkoutTheme.text.primary} />
                  </PressableScale>
                </View>
              </Animated.View>
            </View>
          ) : (
            <Text className="text-sm text-ink-muted">
              {t.noContentAvailable}
            </Text>
          )}
          {reportCommentId && postModalType === "comments" ? (
            <View className="absolute inset-0 gap-4 rounded-t-hero bg-surface px-5 pb-6 pt-6">
              <View className="gap-1">
                <Text className="text-2xl font-semibold text-ink">
                  {t.reportThisComment}
                </Text>
                <Text className="text-sm text-ink-muted">{t.reportExplain}</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {REPORT_REASONS.map((reason) => (
                  <Chip
                    key={reason}
                    label={reportReasonLabels[reason]}
                    active={reportReason === reason}
                    onPress={() => setReportReason(reason)}
                  />
                ))}
              </View>
              <View className="mt-2 flex-row gap-3">
                <Button
                  className="flex-1"
                  variant="secondary"
                  label={t.cancel}
                  onPress={closeReport}
                />
                <Button
                  className="flex-1"
                  label={t.sendLabel}
                  onPress={handleSubmitReport}
                />
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );

  return { openLikes, openComments, modals: modalsElement };
}
