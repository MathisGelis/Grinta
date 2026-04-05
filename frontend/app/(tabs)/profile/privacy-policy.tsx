import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "We collect information you provide directly to us, such as when you create an account, update your profile, or use our fitness tracking features. This includes your name, email address, fitness goals, and workout data.",
  },
  {
    title: "2. How We Use Your Information",
    body: "We use the information we collect to provide, maintain, and improve our services, personalize your experience, track your fitness progress, send notifications about your workouts and achievements, and communicate with you about updates and new features.",
  },
  {
    title: "3. Data Storage & Security",
    body: "Your data is stored securely on our servers. We use industry-standard encryption and security measures to protect your personal information from unauthorized access, disclosure, or misuse. We retain your data for as long as your account is active.",
  },
  {
    title: "4. Sharing Your Information",
    body: "We do not sell, trade, or transfer your personal information to third parties without your consent, except where required by law or to provide our core services. Aggregated, anonymized data may be used for research and analytics.",
  },
  {
    title: "5. Your Rights",
    body: "You have the right to access, correct, or delete your personal data at any time. You may also request a copy of your data or opt out of certain data processing activities by contacting us or using the settings in the app.",
  },
  {
    title: "6. Cookies & Tracking",
    body: "We may use cookies and similar tracking technologies to enhance your experience. You can control cookie settings through your device or browser. Disabling cookies may affect some features of the app.",
  },
  {
    title: "7. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. We will notify you of significant changes via the app or by email. Continued use of the app after changes constitutes acceptance of the updated policy.",
  },
  {
    title: "8. Contact Us",
    body: "If you have any questions about this Privacy Policy or how we handle your data, please contact us at privacy@grinta.app. We are committed to addressing your concerns promptly.",
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 80 }}
      >
        <Text style={styles.lastUpdated}>Last updated: March 2025</Text>

        <Text style={styles.intro}>
          At Grinta, we are committed to protecting your privacy and ensuring
          the security of your personal information. This policy explains how
          we collect, use, and safeguard your data when you use our app.
        </Text>

        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },

  lastUpdated: { color: "#555", fontSize: 13, marginBottom: 16 },
  intro: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 28,
  },

  section: { marginBottom: 24 },
  sectionTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 8 },
  sectionBody: { color: "#888", fontSize: 14, lineHeight: 22 },
});
