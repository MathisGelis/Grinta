import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import BottomBar from "../bottomBar";
import { LineChart, BarChart } from "react-native-chart-kit";

export default function StatsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("week");

  const caloriesData = {
    week: {
      labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
      datasets: [
        {
          data: [520, 680, 750, 420, 890, 730, 600],
          color: () => "#8A2BE2",
          strokeWidth: 2,
        },
      ],
    },
    month: {
      labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
      datasets: [
        {
          data: [3200, 4100, 3750, 4500],
          color: () => "#8A2BE2",
          strokeWidth: 2,
        },
      ],
    },
  };

  const activitiesData = {
    labels: ["Course", "Musculation", "Cardio", "Yoga"],
    datasets: [
      {
        data: [45, 25, 20, 10],
      },
    ],
  };

  const metricsData = [
    {
      title: "Calories",
      value: "12,540",
      unit: "kcal",
      change: "+8%",
      timeframe: "ce mois",
    },
    {
      title: "Temps d'activité",
      value: "18.5",
      unit: "heures",
      change: "+12%",
      timeframe: "ce mois",
    },
    {
      title: "Distance",
      value: "42.7",
      unit: "km",
      change: "+5%",
      timeframe: "ce mois",
    },
    {
      title: "Entraînements",
      value: "24",
      unit: "",
      change: "+3",
      timeframe: "ce mois",
    },
  ];

  const goalsData = [
    { title: "Brûler 3000 kcal/semaine", progress: 85 },
    { title: "S'entraîner 5x par semaine", progress: 100 },
    { title: "Courir 20km par semaine", progress: 65 },
  ];

  const screenWidth = Dimensions.get("window").width;

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: () => "#8A2BE2",
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
    },
  };

  const renderTabs = () => {
    return (
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "week" && styles.activeTab]}
          onPress={() => setActiveTab("week")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "week" && styles.activeTabText,
            ]}
          >
            Semaine
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "month" && styles.activeTab]}
          onPress={() => setActiveTab("month")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "month" && styles.activeTabText,
            ]}
          >
            Mois
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMetrics = () => {
    return (
      <View style={styles.metricsContainer}>
        {metricsData.map((metric, index) => (
          <View key={index} style={styles.metricCard}>
            <Text style={styles.metricTitle}>{metric.title}</Text>
            <View style={styles.metricValueContainer}>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricUnit}>{metric.unit}</Text>
            </View>
            <Text
              style={[
                styles.metricChange,
                metric.change.includes("+") ? styles.positive : styles.negative,
              ]}
            >
              {metric.change} {metric.timeframe}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderGoals = () => {
    return (
      <View style={styles.goalsContainer}>
        <Text style={styles.sectionTitle}>Objectifs</Text>
        {goalsData.map((goal, index) => (
          <View key={index} style={styles.goalItem}>
            <View style={styles.goalTextContainer}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <Text style={styles.goalPercentage}>{goal.progress}%</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View
                style={[styles.progressBar, { width: `${goal.progress}%` }]}
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes Statistiques</Text>
          <Text style={styles.headerSubtitle}>
            Vue d'ensemble de vos performances
          </Text>
        </View>

        {renderMetrics()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calories Brûlées</Text>
          {renderTabs()}
          <LineChart
            data={caloriesData[activeTab]}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Répartition des Activités</Text>
          <BarChart
            data={activitiesData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(138, 43, 226, ${opacity})`,
            }}
            style={styles.chart}
            fromZero
          />
        </View>

        {renderGoals()}
      </ScrollView>
      <BottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 15,
    margin: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#f0f0f0",
  },
  activeTab: {
    backgroundColor: "#8A2BE2",
  },
  tabText: {
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#fff",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 10,
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 10,
  },
  metricCard: {
    backgroundColor: "#fff",
    width: "48%",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  metricTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  metricValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  metricUnit: {
    fontSize: 12,
    color: "#666",
    marginLeft: 3,
  },
  metricChange: {
    fontSize: 12,
    marginTop: 5,
  },
  positive: {
    color: "#4CAF50",
  },
  negative: {
    color: "#F44336",
  },
  goalsContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    margin: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 90,
  },
  goalItem: {
    marginBottom: 15,
  },
  goalTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  goalTitle: {
    fontSize: 14,
    color: "#333",
  },
  goalPercentage: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8A2BE2",
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#8A2BE2",
    borderRadius: 4,
  },
});
