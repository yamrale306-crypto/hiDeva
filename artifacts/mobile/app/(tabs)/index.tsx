import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CallCard } from "@/components/CallCard";
import { StatCard } from "@/components/StatCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { calls, stats, settings } = useApp();
  const router = useRouter();

  const recentCalls = calls.slice(0, 4);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: topInset + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Good {getGreeting()}
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>hiDeva</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: colors.success + "20", borderColor: colors.success + "40" }]}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={[styles.statusText, { color: colors.success }]}>Active</Text>
        </View>
      </View>

      {/* AI Active Banner */}
      <View style={[styles.banner, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
        <View style={styles.bannerLeft}>
          <Feather name="cpu" size={20} color="#fff" />
          <View>
            <Text style={styles.bannerTitle}>Deva AI is screening your calls</Text>
            <Text style={styles.bannerSub}>
              {settings.language.charAt(0).toUpperCase() + settings.language.slice(1)} · {settings.aiVoice === "female" ? "Female" : "Male"} voice
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/settings")}
          style={styles.bannerBtn}
        >
          <Feather name="settings" size={14} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Summary</Text>
      <View style={styles.statsRow}>
        <StatCard
          label="Handled"
          value={stats.callsHandled}
          icon="phone-call"
          color={colors.success}
          subtitle="by AI"
        />
        <StatCard
          label="Spam Blocked"
          value={stats.spamBlocked}
          icon="slash"
          color={colors.destructive}
        />
      </View>
      <View style={styles.statsRow}>
        <StatCard
          label="Important"
          value={stats.importantCalls}
          icon="star"
          color={colors.warning}
        />
        <StatCard
          label="Mins Saved"
          value={stats.timeSaved}
          icon="clock"
          color={colors.primary}
          subtitle="approx."
        />
      </View>

      {/* Recent Calls */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/calls")}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.callsList}>
        {recentCalls.map((call) => (
          <CallCard key={call.id} call={call} />
        ))}
      </View>

      {/* Business Mode Banner */}
      {!settings.businessMode && (
        <TouchableOpacity
          style={[styles.bizBanner, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/(tabs)/settings")}
          activeOpacity={0.8}
        >
          <View style={[styles.bizIcon, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="briefcase" size={18} color={colors.primary} />
          </View>
          <View style={styles.bizText}>
            <Text style={[styles.bizTitle, { color: colors.foreground }]}>
              Enable Business Mode
            </Text>
            <Text style={[styles.bizSub, { color: colors.mutedForeground }]}>
              Auto-book appointments, capture leads & answer FAQs
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}

      <View style={{ height: Platform.OS === "web" ? 34 : 32 }} />
    </ScrollView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  statusDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  banner: {
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  bannerSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  bannerBtn: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  callsList: {
    gap: 8,
  },
  bizBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginTop: 4,
  },
  bizIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bizText: {
    flex: 1,
    gap: 2,
  },
  bizTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  bizSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
