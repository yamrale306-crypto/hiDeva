import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppSettings, Language, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const LANGUAGES: { key: Language; label: string; native: string }[] = [
  { key: "english", label: "English", native: "English" },
  { key: "hindi", label: "Hindi", native: "हिन्दी" },
  { key: "marathi", label: "Marathi", native: "मराठी" },
  { key: "gujarati", label: "Gujarati", native: "ગુજરાતી" },
  { key: "kannada", label: "Kannada", native: "ಕನ್ನಡ" },
  { key: "tamil", label: "Tamil", native: "தமிழ்" },
  { key: "telugu", label: "Telugu", native: "తెలుగు" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const toggle = (key: keyof AppSettings) => {
    Haptics.selectionAsync();
    updateSettings({ [key]: !settings[key as keyof typeof settings] } as Partial<AppSettings>);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: topInset + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>

      {/* Language */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AI LANGUAGE</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.langGrid}>
          {LANGUAGES.map((lang) => {
            const active = settings.language === lang.key;
            return (
              <TouchableOpacity
                key={lang.key}
                style={[
                  styles.langPill,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  updateSettings({ language: lang.key });
                }}
              >
                <Text style={[styles.langNative, { color: active ? "#fff" : colors.foreground }]}>
                  {lang.native}
                </Text>
                <Text style={[styles.langLabel, { color: active ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* AI Voice */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AI VOICE</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.voiceRow}>
          {(["female", "male"] as const).map((v) => {
            const active = settings.aiVoice === v;
            return (
              <TouchableOpacity
                key={v}
                style={[
                  styles.voiceBtn,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                    flex: 1,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  updateSettings({ aiVoice: v });
                }}
              >
                <Feather name={v === "female" ? "user" : "user"} size={16} color={active ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.voiceBtnText, { color: active ? "#fff" : colors.foreground }]}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* AI Behavior */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AI BEHAVIOR</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ToggleRow
          label="Auto-handle delivery calls"
          description="Deva handles courier calls and notifies you"
          value={settings.autoHandleDelivery}
          onToggle={() => toggle("autoHandleDelivery")}
          colors={colors}
          icon="package"
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <ToggleRow
          label="Block spam automatically"
          description="Spam calls are blocked without ringing"
          value={settings.autoHandleSpam}
          onToggle={() => toggle("autoHandleSpam")}
          colors={colors}
          icon="slash"
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <ToggleRow
          label="Screen unknown callers"
          description="Ask purpose before connecting unknown numbers"
          value={settings.screenUnknown}
          onToggle={() => toggle("screenUnknown")}
          colors={colors}
          icon="shield"
        />
      </View>

      {/* Business Mode */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>BUSINESS MODE</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ToggleRow
          label="Business Mode"
          description="Enable appointment booking, FAQ answering & lead capture"
          value={settings.businessMode}
          onToggle={() => toggle("businessMode")}
          colors={colors}
          icon="briefcase"
          accent={colors.primary}
        />
      </View>
      {settings.businessMode && (
        <View style={[styles.bizFeatures, { backgroundColor: colors.primary + "0D", borderColor: colors.primary + "30" }]}>
          {["Appointment booking", "FAQ answering", "Lead collection", "Order taking"].map((f) => (
            <View key={f} style={styles.bizFeature}>
              <Feather name="check-circle" size={14} color={colors.success} />
              <Text style={[styles.bizFeatureText, { color: colors.foreground }]}>{f}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Plan */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>YOUR PLAN</Text>
      <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.planRow}>
          <View>
            <Text style={[styles.planName, { color: colors.foreground }]}>Free Plan</Text>
            <Text style={[styles.planSub, { color: colors.mutedForeground }]}>
              Limited AI calls · Basic summaries · Spam detection
            </Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}>
          <Feather name="zap" size={14} color="#fff" />
          <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
        </TouchableOpacity>
        <Text style={[styles.proFeatures, { color: colors.mutedForeground }]}>
          Pro: Unlimited summaries · Advanced screening · All 7 languages · Smart priorities
        </Text>
      </View>

      <View style={{ height: Platform.OS === "web" ? 34 : 40 }} />
    </ScrollView>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onToggle,
  colors,
  icon,
  accent,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof useColors>;
  icon: keyof typeof Feather.glyphMap;
  accent?: string;
}) {
  const accentColor = accent ?? colors.primary;
  return (
    <View style={styles.toggleRow}>
      <View style={[styles.toggleIcon, { backgroundColor: accentColor + "15" }]}>
        <Feather name={icon} size={15} color={accentColor} />
      </View>
      <View style={styles.toggleText}>
        <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.toggleDesc, { color: colors.mutedForeground }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.muted, true: accentColor + "80" }}
        thumbColor={value ? accentColor : colors.mutedForeground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  langGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 12,
  },
  langPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  langNative: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  langLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  voiceRow: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  voiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  voiceBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  toggleIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    flex: 1,
    gap: 2,
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  toggleDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  bizFeatures: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  bizFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bizFeatureText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  planName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  planSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    lineHeight: 18,
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  upgradeBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  proFeatures: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
  },
});
