import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RuleCard } from "@/components/RuleCard";
import { Rule, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const PRESET_RULES = [
  { condition: "Contact tagged as College", action: "Always connect directly", priority: "high" as const, icon: "book" },
  { condition: "Mentions appointment / booking", action: "Auto-handle & book slot", priority: "medium" as const, icon: "calendar" },
  { condition: "Work contact calls after 7 PM", action: "Screen & take message", priority: "low" as const, icon: "moon" },
];

export default function RulesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { rules, addRule, updateRule, deleteRule } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newAction, setNewAction] = useState("");
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleAdd = () => {
    if (!newName || !newCondition || !newAction) return;
    addRule({
      id: Date.now().toString(),
      name: newName,
      condition: newCondition,
      action: newAction,
      priority: "medium",
      enabled: true,
      icon: "zap",
    });
    setNewName("");
    setNewCondition("");
    setNewAction("");
    setShowModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Rules</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowModal(true)}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add Rule</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rules}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={() => (
          <View style={[styles.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <Feather name="info" size={14} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.primary }]}>
              Rules tell Deva AI how to handle your calls. Higher priority rules run first.
            </Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Feather name="sliders" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No rules yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Add rules to customize how Deva handles your calls
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <RuleCard
            rule={item}
            onToggle={(id, v) => updateRule(id, { enabled: v })}
            onDelete={deleteRule}
          />
        )}
      />

      {/* Add Rule Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Rule</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Presets */}
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Quick presets</Text>
              <View style={styles.presets}>
                {PRESET_RULES.map((p, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.preset, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      setNewCondition(p.condition);
                      setNewAction(p.action);
                      setNewName(p.condition.split(" ").slice(0, 3).join(" "));
                    }}
                  >
                    <Text style={[styles.presetText, { color: colors.foreground }]}>{p.condition}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Rule name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                placeholder="e.g. Screen work calls"
                placeholderTextColor={colors.mutedForeground}
                value={newName}
                onChangeText={setNewName}
              />

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>If (condition)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                placeholder="e.g. Unknown number calls after 9 PM"
                placeholderTextColor={colors.mutedForeground}
                value={newCondition}
                onChangeText={setNewCondition}
                multiline
              />

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Then (action)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                placeholder="e.g. Screen caller and take a message"
                placeholderTextColor={colors.mutedForeground}
                value={newAction}
                onChangeText={setNewAction}
                multiline
              />

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: newName && newCondition && newAction ? colors.primary : colors.muted },
                ]}
                onPress={handleAdd}
                disabled={!newName || !newCondition || !newAction}
              >
                <Text style={[styles.saveBtnText, { color: newName && newCondition && newAction ? "#fff" : colors.mutedForeground }]}>
                  Add Rule
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  list: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 100,
    gap: 0,
  },
  infoBox: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  emptySub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
    marginTop: 14,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  presets: {
    gap: 6,
    marginBottom: 4,
  },
  preset: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 44,
  },
  saveBtn: {
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
