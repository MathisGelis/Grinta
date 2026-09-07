import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Post } from "@/services/posts.service";

export default function UserPostScreen() {
  const params = useLocalSearchParams<{ post?: string }>();
  const serializedPost = Array.isArray(params.post)
    ? params.post[0]
    : params.post;
  const [post, setPost] = useState<Post | null>(null);
  const [workoutPreview, setWorkoutPreview] = useState<{
    id: string;
    title: string;
    description?: string;
    durationSeconds?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPost = useCallback(async () => {
    if (!serializedPost) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = JSON.parse(serializedPost) as Post;
      setPost(data);

      if (!data) {
        return;
      }

      const workoutId = data?.workoutId ?? data?.workout?.id;
      if (!workoutId) {
        setWorkoutPreview(null);
        return;
      }

      setWorkoutPreview({
        id: workoutId,
        title: data.workoutTitle ?? data.workout?.title ?? "Workout terminé",
        description: data.workoutDescription ?? data.workout?.description,
        durationSeconds: data.workoutDurationSeconds,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Erreur lors du chargement du post:", message);
      Alert.alert("Erreur", `Impossible de charger ce post.\n${message}`);
    } finally {
      setLoading(false);
    }
  }, [serializedPost]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  if (loading) {
    return (
      <View style={styles.containerCentered}>
        <ActivityIndicator size="large" color="#7B5CF0" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.containerCentered}>
        <Text style={styles.emptyText}>Impossible de charger ce post.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Publication</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        <View style={styles.card}>
          <View style={styles.userRow}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>
                {post.displayName?.[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{post.displayName}</Text>
              <Text style={styles.dateText}>
                {new Date(post.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>

          <View style={styles.contentBlock}>
            <Text style={styles.contentLabel}>Détails du post</Text>
            <Text style={styles.metaText}>
              Posté le {new Date(post.createdAt).toLocaleString("fr-FR")}
            </Text>
          </View>

          {workoutPreview ? (
            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>Workout associé</Text>
              <View style={styles.workoutPreviewCard}>
                <View style={styles.workoutIconWrap}>
                  <Ionicons name="checkmark-circle" size={26} color="#34D399" />
                </View>
                <View style={styles.workoutPreviewContent}>
                  <Text style={styles.workoutTitle}>
                    {workoutPreview.title}
                  </Text>
                  {!!workoutPreview.description && (
                    <Text style={styles.workoutDescription}>
                      {workoutPreview.description}
                    </Text>
                  )}
                  {workoutPreview.durationSeconds !== undefined && (
                    <Text style={styles.workoutDuration}>
                      {Math.round(workoutPreview.durationSeconds / 60)} min
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderText}>
                Aucun workout associé à ce post.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  containerCentered: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2a1f4a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  userName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  dateText: {
    color: "#8e8e93",
    fontSize: 12,
    marginTop: 2,
  },
  contentBlock: {
    backgroundColor: "#151515",
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  contentLabel: {
    color: "#b9b7c8",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  metaText: {
    color: "#fff",
    fontSize: 15,
    marginBottom: 6,
  },
  previewSection: {
    marginTop: 8,
  },
  previewLabel: {
    color: "#b9b7c8",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  workoutPreviewCard: {
    backgroundColor: "#151515",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  workoutIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#1a2f1a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  workoutPreviewContent: {
    flex: 1,
  },
  workoutTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  workoutDescription: {
    color: "#b9b7c8",
    fontSize: 13,
    marginTop: 4,
  },
  workoutDuration: {
    color: "#8e8e93",
    fontSize: 12,
    marginTop: 6,
  },
  placeholderCard: {
    backgroundColor: "#151515",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#8e8e93",
    fontSize: 14,
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#7B5CF0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
