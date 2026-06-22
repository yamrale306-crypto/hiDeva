import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
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

import { CallStatus, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function statusColor(status: CallStatus, colors: ReturnType<typeof useColors>) {
  switch (status) {
    case "handled": return colors.success;
    case "spam": return colors.destructive;
    case "important": return colors.warning;
    case "screened": return colors.primary;
    case "missed": return colors.mutedForeground;
  }
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number) {
  if (!seconds) return "No answer";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function CallDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { calls, markCallImportant } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const call = calls.find((c) => c.id === id);
  if (!call) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.mutedForeground }}>Call not found</Text>
      </View>
    );
  }

  const sColor = statusColor(call.status, colors);
  const initials = call.callerName === "Unknown"
    ? "?"
    : call.callerName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Call Details",
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.container, { paddingBottom: Platform.OS === "web" ? 34 : 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Caller Info */}
        <View style={[styles.callerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
          </View>
          <Text style={[styles.callerName, { color: colors.foreground }]}>{call.callerName}</Text>
          <Text style={[styles.callerNumber, { color: colors.mutedForeground }]}>{call.callerNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: sColor + "18" }]}>
            <View style={[styles.statusDot, { backgroundColor: sColor }]} />
            <Text style={[styles.statusText, { color: sColor }]}>
              {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="clock" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{formatDate(call.timestamp)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="activity" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{formatDuration(call.duration)}</Text>
            </View>
          </View>
        </View>

        {/* AI Summary */}
        {call.summary && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Feather name="cpu" size={14} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI Summary</Text>
            </View>
            <Text style={[styles.summaryText, { color: colors.foreground }]}>{call.summary}</Text>
          </View>
        )}

        {/* Action Items */}
        {call.actionItems && call.actionItems.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Feather name="check-square" size={14} color={colors.success} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Action Items</Text>
            </View>
            <View style={styles.actionList}>
              {call.actionItems.map((item, i) => (
                <View key={i} style={styles.actionItem}>
                  <View style={[styles.actionDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.actionText, { color: colors.foreground }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Transcript */}
        {call.transcript && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Feather name="message-square" size={14} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Transcript</Text>
            </View>
            {call.transcript.split("\n").map((line, i) => {
              const isAI = line.startsWith("Deva AI:");
              return (
                <View
                  key={i}
                  style={[
                    styles.transcriptLine,
                    { backgroundColor: isAI ? colors.primary + "10" : colors.surface },
                  ]}
                >
                  <Text style={[styles.transcriptSpeaker, { color: isAI ? colors.primary : colors.mutedForeground }]}>
                    {isAI ? "Deva AI" : "Caller"}
                  </Text>
                  <Text style={[styles.transcriptText, { color: colors.foreground }]}>
                    {line.replace("Deva AI:", "").replace("Caller:", "").trim()}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Actions */}
        {call.status !== "important" && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.warning + "18", borderColor: colors.warning + "40" }]}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              markCallImportant(call.id);
              router.back();
            }}
          >
            <Feather name="star" size={16} color={colors.warning} />
            <Text style={[styles.actionBtnText, { color: colors.warning }]}>Mark as Important</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  callerCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  callerName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  callerNumber: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  section: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  summaryText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  actionList: {
    gap: 8,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  actionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  actionText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 20,
  },
  transcriptLine: {
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  transcriptSpeaker: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  transcriptText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  surface: {
    backgroundColor: "transparent",
  },
});
