import { FollowersView } from "@/app/(tabs)/profile/followers";

/** Abonnés / abonnements d'un profil ouvert depuis l'onglet explorer : le retour revient à ce profil. */
export default function ExploreFollowersScreen() {
  return <FollowersView userProfilePath="/(tabs)/explore/user-profile" />;
}
