import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

import { Rule } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface RuleCardProps {
  rule: Rule;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
}

const priorityColors = (p: Rule["priority"], colors: ReturnType<typeof useColors>) => {
  if (p === "high") return colors.destructive;
  if (p === "medium") return colors.warning;
  return colors.mutedForeground;
};

export function RuleCard({ rule, onToggle, onDelete }: RuleCardProps) {
  const colors = useColors();
  const pColor = priorityColors(rule.priority, colors);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.top}>
        <View style={[styles.iconWrap, { backgroundColor: pColor + "18" }]}>
          <Feather name={rule.icon as keyof typeof Feather.glyphMap} size={16} color={pColor} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]}>{rule.name}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: pColor + "18" }]}>
            <Text style={[styles.priorityText, { color: pColor }]}>
              {rule.priority.toUpperCase()}
            </Text>
          </View>
        </View>
        <Switch
          value={rule.enabled}
          onValueChange={(v) => {
            Haptics.selectionAsync();
            onToggle(rule.id, v);
          }}
          trackColor={{ false: colors.muted, true: colors.primary + "80" }}
          thumbColor={rule.enabled ? colors.primary : colors.mutedForeground}
        />
      </View>
      <View style={styles.detail}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>If:</Text>
          <Text style={[styles.value, { color: colors.foreground }]}>{rule.condition}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Then:</Text>
          <Text style={[styles.value, { color: colors.primary }]}>{rule.action}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onDelete(rule.id);
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="trash-2" size={14} color={colors.destructive} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  detail: {
    gap: 4,
    paddingLeft: 46,
  },
  row: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    width: 28,
  },
  value: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  deleteBtn: {
    position: "absolute",
    bottom: 14,
    right: 14,
  },
});
