import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CallRecord, CallStatus } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface CallCardProps {
  call: CallRecord;
}

function statusConfig(status: CallStatus, colors: ReturnType<typeof useColors>) {
  switch (status) {
    case "handled":
      return { label: "AI Handled", color: colors.success, icon: "check-circle" as const };
    case "spam":
      return { label: "Spam Blocked", color: colors.destructive, icon: "slash" as const };
    case "important":
      return { label: "Important", color: colors.warning, icon: "star" as const };
    case "screened":
      return { label: "Screened", color: colors.primary, icon: "shield" as const };
    case "missed":
      return { label: "Missed", color: colors.mutedForeground, icon: "phone-missed" as const };
  }
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return "";
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function CallCard({ call }: CallCardProps) {
  const colors = useColors();
  const router = useRouter();
  const cfg = statusConfig(call.status, colors);

  const initials = call.callerName === "Unknown"
    ? "?"
    : call.callerName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        Haptics.selectionAsync();
        router.push({ pathname: "/calls/[id]", params: { id: call.id } });
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
        <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {call.callerName}
          </Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {formatTime(call.timestamp)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={[styles.badge, { backgroundColor: cfg.color + "18" }]}>
            <Feather name={cfg.icon} size={10} color={cfg.color} />
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          {call.duration > 0 && (
            <Text style={[styles.duration, { color: colors.mutedForeground }]}>
              {formatDuration(call.duration)}
            </Text>
          )}
        </View>
        {call.summary ? (
          <Text style={[styles.summary, { color: colors.mutedForeground }]} numberOfLines={1}>
            {call.summary}
          </Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={16} color={colors.border} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  duration: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  summary: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
