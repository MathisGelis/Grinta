import { getItem, saveItem } from "@/core/services/storage";
import { useTranslation } from "@/contexts/LanguageContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Animated,
} from "react-native";
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
  const { t } = useTranslation();
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
      displayName: "Vous",
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
        "Erreur",
        error?.message || "Impossible d'envoyer le commentaire.",
      );
    }
  }, [commentDraft, postModalPostId, userId]);

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
        "Erreur",
        error?.message || "Impossible de modifier ce commentaire.",
      );
    }
  }, [editingCommentId, editingCommentText, postModalData]);

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!commentId) return;

      Alert.alert("Supprimer", "Voulez-vous supprimer ce commentaire ?", [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
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
                "Erreur",
                error?.message || "Impossible de supprimer ce commentaire.",
              );
            }
          },
        },
      ]);
    },
    [postModalData],
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
      Alert.alert("Signalement", "Veuillez renseigner une raison.");
      return;
    }

    try {
      await PostsService.reportComment(reportCommentId, trimmedReason);
      setReportModalVisible(false);
      setReportCommentId(null);
      setReportReason("");
      Alert.alert("Signalement", "Le commentaire a bien été signalé.");
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error?.message || "Impossible de signaler ce commentaire.",
      );
    }
  }, [reportCommentId, reportReason]);

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
      // silently fail
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

  function getFormattedDate(): string {
    const now = new Date();
    return `${t.days[(now.getDay() + 6) % 7]} ${now.getDate()} ${t.months[now.getMonth()].slice(0, 3)}`;
  }

  return (
    <View className="flex-1 bg-[#101114] pt-4">
      <StatusBar barStyle="light-content" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center px-4 pb-3 pt-2">
          <View className="flex-1">
            <Text className="text-[22px] font-bold text-white">
              {t.hello}
              {userName ? ` ${userName}` : ""}
            </Text>
            <Text className="mt-1 text-[15px] text-[#B9B7C8]">
              {t[getGreetingKey()]}
            </Text>
          </View>
        </View>

        <View className="mx-4 mt-2 mb-3 flex-row items-center justify-between">
          <Text className="text-[18px] font-bold text-white">
            {t.todaysCommunityFavorite}
          </Text>
          <Text className="text-[13px] font-semibold text-[#8B5CF6]">
            {getFormattedDate()}
          </Text>
        </View>

        <View className="mx-4 mb-4 flex-row rounded-xl bg-[#1A1A1A] p-1">
          <TouchableOpacity
            className={`flex-1 rounded-lg px-3 py-2 ${
              postFeed === "top" ? "bg-[#7B5CF0]" : ""
            }`}
            onPress={() => setPostFeed("top")}
          >
            <Text className="text-center text-sm font-semibold text-white">
              Tops posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 rounded-lg px-3 py-2 ${
              postFeed === "followed" ? "bg-[#7B5CF0]" : ""
            }`}
            onPress={() => setPostFeed("followed")}
          >
            <Text className="text-center text-sm font-semibold text-white">
              Personnes suivies
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#7B5CF0"
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            <View className="mb-4">
              {topPosts.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingBottom: 4,
                    gap: 12,
                  }}
                >
                  {topPosts.map((post) => (
                    <TouchableOpacity
                      key={post.id}
                      className="w-[200px] rounded-2xl bg-[#1a1a1a] p-4"
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
                        <View className="h-9 w-9 items-center justify-center rounded-full bg-[#2a1f4a]">
                          <Text className="text-sm font-bold text-white">
                            {post.displayName?.[0]?.toUpperCase() ?? "?"}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-sm font-semibold text-white"
                            numberOfLines={1}
                          >
                            {post.displayName}
                          </Text>
                          <Text className="mt-0.5 text-[12px] text-[#888]">
                            {new Date(post.createdAt).toLocaleDateString(
                              "fr-FR",
                            )}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row w-full items-center justify-evenly gap-3">
                        <TouchableOpacity
                          className="flex-row items-center gap-1 px-6 py-1"
                          onPress={() => handleToggleLike(post)}
                          onLongPress={() =>
                            openPostModal("Likes", "likes", post.id)
                          }
                          delayLongPress={300}
                        >
                          {post.isLiked ? (
                            <Ionicons name="heart" size={20} color="#FF6B6B" />
                          ) : (
                            <Ionicons
                              name="heart-outline"
                              size={20}
                              color="#FF6B6B"
                            />
                          )}
                          <Text className="text-[16px] text-white">
                            {post.likesCount}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-row items-center gap-1 px-6 py-1"
                          onPress={() =>
                            openPostModal("Commentaires", "comments", post.id)
                          }
                        >
                          <Ionicons
                            name="chatbubble-outline"
                            size={20}
                            color="#7B5CF0"
                          />
                          <Text className="text-[16px] text-white">
                            {post.commentsCount}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View className="mx-4 rounded-2xl bg-[#1a1a1a] px-8 py-8">
                  <Text className="text-center text-base font-semibold text-[#888]">
                    Aucun post populaire pour le moment.
                  </Text>
                </View>
              )}
            </View>
            <RequestedUsers requests={requests} setRequests={setRequests} />
            <ProgrammeSection programmes={programmes} />
            <RecentWorkout recentWorkouts={recentWorkouts} />
          </>
        )}
      </ScrollView>

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
        style={{ justifyContent: "center", margin: 24 }}
      >
        <View className="rounded-2xl bg-[#181A1F] p-4">
          <Text className="mb-2 text-lg font-semibold text-white">
            Signaler ce commentaire
          </Text>
          <Text className="mb-3 text-sm text-[#B8B8B8]">
            Expliquez la raison du signalement.
          </Text>
          <TextInput
            value={reportReason}
            onChangeText={setReportReason}
            multiline
            textAlignVertical="top"
            placeholder="Raison du signalement..."
            placeholderTextColor="#7A7A7A"
            className="min-h-[100px] rounded-xl border border-[#2F2F2F] bg-[#101114] px-3 py-3 text-sm text-white"
          />
          <View className="mt-4 flex-row justify-end gap-2">
            <TouchableOpacity
              onPress={() => {
                setReportModalVisible(false);
                setReportReason("");
                setReportCommentId(null);
              }}
              className="rounded-xl bg-[#2A2A2A] px-3 py-2"
            >
              <Text className="text-sm text-[#B8B8B8]">Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmitReport}
              className="rounded-xl bg-[#7C5DB7] px-3 py-2"
            >
              <Text className="text-sm font-semibold text-white">Envoyer</Text>
            </TouchableOpacity>
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
        style={{ justifyContent: "flex-end", margin: 0 }}
      >
        <View className="h-[80%] rounded-t-3xl bg-[#121212] p-4 pb-6">
          <View className="mb-4 h-1.5 w-16 self-center rounded-full bg-[#3A3A3A]" />
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-semibold text-white">
              {postModalTitle}
            </Text>
            <TouchableOpacity onPress={closePostModal}>
              <Ionicons name="close" size={22} color="#B8B8B8" />
            </TouchableOpacity>
          </View>

          {postModalLoading ? (
            <Text className="text-center text-sm text-[#B8B8B8]">
              Chargement...
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
                    <TouchableOpacity
                      key={like.id}
                      className="rounded-2xl bg-[#1A1A1A] p-3"
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/explore/user-profile",
                          params: { userId: like.userId },
                        })
                      }
                    >
                      <Text className="text-sm font-semibold text-white">
                        {like.displayName ?? "Utilisateur"}
                      </Text>
                      <Text className="mt-1 text-xs text-[#B8B8B8]">
                        @{like.uniqueName ?? "unknown"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text className="justify-center text-sm text-[#B8B8B8]">
                  Aucun like pour ce post.
                </Text>
              )}
            </ScrollView>
          ) : postModalType === "comments" ? (
            <View className="flex-1">
              <View className="mb-2">
                <Text className="text-xs text-[#B8B8B8]">
                  {postModalData.length} commentaire
                  {postModalData.length > 1 ? "s" : ""}
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
                        <TouchableOpacity
                          key={
                            comment.id ??
                            `${commentUserId}-${comment.createdAt}`
                          }
                          activeOpacity={0.9}
                          onLongPress={() => openReportComment(comment.id)}
                          className="rounded-2xl bg-[#1A1A1A] p-3"
                        >
                          <View className="mb-2 flex-row items-center justify-between gap-2">
                            <Text className="text-sm font-semibold text-white">
                              {comment.displayName ??
                                comment.userName ??
                                "Utilisateur"}
                            </Text>

                            {isOwnComment && !isEditingThisComment && (
                              <View className="flex-row items-center gap-2">
                                <TouchableOpacity
                                  onPress={() =>
                                    handleStartEditingComment(comment)
                                  }
                                >
                                  <Ionicons
                                    name="create-outline"
                                    size={16}
                                    color="#8AB4F8"
                                  />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() =>
                                    handleDeleteComment(comment.id)
                                  }
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={16}
                                    color="#FF6B6B"
                                  />
                                </TouchableOpacity>
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
                                placeholder="Modifier votre commentaire"
                                placeholderTextColor="#7A7A7A"
                                className="min-h-[80px] rounded-xl border border-[#2F2F2F] bg-[#151515] px-3 py-2 text-sm text-white"
                              />
                              <View className="flex-row justify-end gap-2">
                                <TouchableOpacity
                                  onPress={() => {
                                    setEditingCommentId(null);
                                    setEditingCommentText("");
                                  }}
                                  className="rounded-lg bg-[#2A2A2A] px-3 py-2"
                                >
                                  <Text className="text-xs text-[#B8B8B8]">
                                    Annuler
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={handleSaveEditedComment}
                                  className="rounded-lg bg-[#7C5DB7] px-3 py-2"
                                >
                                  <Text className="text-xs font-semibold text-white">
                                    Enregistrer
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ) : (
                            <Text className="mt-2 text-xs text-[#B8B8B8]">
                              {comment.content ??
                                comment.message ??
                                "Aucun commentaire."}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text className="text-sm text-[#B8B8B8]">
                    Aucun commentaire pour ce post.
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
                <View className="flex-row items-end gap-2 rounded-2xl border border-[#2F2F2F] bg-[#1A1A1A] p-2">
                  <TextInput
                    value={commentDraft}
                    onChangeText={setCommentDraft}
                    placeholder="Écrire un commentaire…"
                    placeholderTextColor="#8A8A8A"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    blurOnSubmit={false}
                    returnKeyType="default"
                    submitBehavior="newline"
                    className="flex-1 min-h-[40px] max-h-[120px] px-2 py-2 text-sm text-white"
                  />
                  <TouchableOpacity
                    onPress={handleSubmitComment}
                    className="h-10 w-10 items-center justify-center rounded-full bg-[#7C5DB7]"
                    disabled={!commentDraft.trim()}
                    style={{ opacity: commentDraft.trim() ? 1 : 0.5 }}
                  >
                    <Ionicons name="send" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          ) : (
            <Text className="text-sm text-[#B8B8B8]">
              Aucun contenu disponible.
            </Text>
          )}
        </View>
      </Modal>
    </View>
  );
}
