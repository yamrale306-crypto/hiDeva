import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type CallStatus = "handled" | "missed" | "spam" | "important" | "screened";
export type Priority = "high" | "medium" | "low";
export type Language = "english" | "hindi" | "marathi" | "gujarati" | "kannada" | "tamil" | "telugu";

export interface CallRecord {
  id: string;
  callerName: string;
  callerNumber: string;
  timestamp: number;
  duration: number;
  status: CallStatus;
  transcript?: string;
  summary?: string;
  actionItems?: string[];
  isKnown: boolean;
  callPurpose?: string;
}

export interface Rule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: Priority;
  enabled: boolean;
  icon: string;
}

export interface AppSettings {
  language: Language;
  aiVoice: "female" | "male";
  autoHandleDelivery: boolean;
  autoHandleSpam: boolean;
  screenUnknown: boolean;
  businessMode: boolean;
  greeting: string;
}

interface AppContextValue {
  calls: CallRecord[];
  rules: Rule[];
  settings: AppSettings;
  stats: {
    callsHandled: number;
    spamBlocked: number;
    importantCalls: number;
    timeSaved: number;
  };
  addCall: (call: CallRecord) => void;
  addRule: (rule: Rule) => void;
  updateRule: (id: string, updates: Partial<Rule>) => void;
  deleteRule: (id: string) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  markCallImportant: (id: string) => void;
}

const DEFAULT_CALLS: CallRecord[] = [
  {
    id: "1",
    callerName: "Rahul Sharma",
    callerNumber: "+91 98765 43210",
    timestamp: Date.now() - 1000 * 60 * 15,
    duration: 45,
    status: "handled",
    transcript: "Caller: Hello, is Deva available?\nDeva AI: May I know the purpose of your call?\nCaller: I'm calling regarding the project proposal.\nDeva AI: I'll pass on the message. Deva will call you back shortly.",
    summary: "Rahul called about the project proposal. Requested a callback.",
    actionItems: ["Call back Rahul about project proposal", "Review proposal documents"],
    isKnown: true,
    callPurpose: "Project discussion",
  },
  {
    id: "2",
    callerName: "Unknown",
    callerNumber: "+91 80000 12345",
    timestamp: Date.now() - 1000 * 60 * 42,
    duration: 20,
    status: "spam",
    transcript: "Caller: Congratulations! You've won a prize...\nDeva AI: This appears to be a promotional call. Blocking.",
    summary: "Spam call detected — promotional scam about prize winning.",
    actionItems: [],
    isKnown: false,
    callPurpose: "Spam",
  },
  {
    id: "3",
    callerName: "Priya (Mom)",
    callerNumber: "+91 99887 76655",
    timestamp: Date.now() - 1000 * 60 * 90,
    duration: 180,
    status: "important",
    transcript: "Caller: Hi, just checking if you're coming home this weekend.\nDeva AI: Connecting you directly — this is a priority contact.",
    summary: "Mom called about weekend visit plans.",
    actionItems: ["Confirm weekend plans with Mom"],
    isKnown: true,
    callPurpose: "Family",
  },
  {
    id: "4",
    callerName: "Courier Delivery",
    callerNumber: "+91 80012 34567",
    timestamp: Date.now() - 1000 * 60 * 180,
    duration: 35,
    status: "handled",
    transcript: "Caller: Hello, I have a parcel for delivery.\nDeva AI: I'll notify the owner. Please leave it at the door or come after 6 PM.",
    summary: "Delivery person called. Notified to leave parcel at door or return after 6 PM.",
    actionItems: ["Collect parcel from door"],
    isKnown: false,
    callPurpose: "Courier delivery",
  },
  {
    id: "5",
    callerName: "Amit Patel",
    callerNumber: "+91 70001 23456",
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
    duration: 0,
    status: "missed",
    transcript: undefined,
    summary: "Missed call from Amit Patel. No voicemail left.",
    actionItems: ["Return call to Amit Patel"],
    isKnown: true,
    callPurpose: undefined,
  },
  {
    id: "6",
    callerName: "SBI Bank",
    callerNumber: "+91 18001 234567",
    timestamp: Date.now() - 1000 * 60 * 60 * 8,
    duration: 60,
    status: "screened",
    transcript: "Caller: This is SBI calling about your account.\nDeva AI: Please state your purpose. The owner will be notified.\nCaller: Account verification required.",
    summary: "SBI Bank called for account verification. Screened and flagged for follow-up.",
    actionItems: ["Call SBI back to verify — use official number"],
    isKnown: false,
    callPurpose: "Banking",
  },
];

const DEFAULT_RULES: Rule[] = [
  {
    id: "1",
    name: "Family Always Rings",
    condition: "Contact tagged as Family",
    action: "Always connect directly",
    priority: "high",
    enabled: true,
    icon: "heart",
  },
  {
    id: "2",
    name: "Delivery Auto-Handle",
    condition: "Mentions courier / delivery / parcel",
    action: "Auto handle & notify me",
    priority: "medium",
    enabled: true,
    icon: "package",
  },
  {
    id: "3",
    name: "Screen Unknown Numbers",
    condition: "Number not in contacts",
    action: "Screen caller first",
    priority: "medium",
    enabled: true,
    icon: "shield",
  },
  {
    id: "4",
    name: "Block Sales Calls",
    condition: "Promotional or sales intent detected",
    action: "Block & log as spam",
    priority: "low",
    enabled: true,
    icon: "x-circle",
  },
  {
    id: "5",
    name: "Emergency Always Rings",
    condition: "Contact tagged as Emergency",
    action: "Always connect directly",
    priority: "high",
    enabled: true,
    icon: "alert-triangle",
  },
  {
    id: "6",
    name: "Business Hours Rule",
    condition: "Call received after 9 PM",
    action: "Screen & take message",
    priority: "low",
    enabled: false,
    icon: "clock",
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  language: "english",
  aiVoice: "female",
  autoHandleDelivery: true,
  autoHandleSpam: true,
  screenUnknown: true,
  businessMode: false,
  greeting: "Hello, Deva is unavailable right now. May I know the purpose of your call?",
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [calls, setCalls] = useState<CallRecord[]>(DEFAULT_CALLS);
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const load = async () => {
      try {
        const [storedCalls, storedRules, storedSettings] = await Promise.all([
          AsyncStorage.getItem("hideva_calls"),
          AsyncStorage.getItem("hideva_rules"),
          AsyncStorage.getItem("hideva_settings"),
        ]);
        if (storedCalls) setCalls(JSON.parse(storedCalls));
        if (storedRules) setRules(JSON.parse(storedRules));
        if (storedSettings) setSettings(JSON.parse(storedSettings));
      } catch {}
    };
    load();
  }, []);

  const saveCalls = useCallback(async (data: CallRecord[]) => {
    await AsyncStorage.setItem("hideva_calls", JSON.stringify(data)).catch(() => {});
  }, []);
  const saveRules = useCallback(async (data: Rule[]) => {
    await AsyncStorage.setItem("hideva_rules", JSON.stringify(data)).catch(() => {});
  }, []);
  const saveSettings = useCallback(async (data: AppSettings) => {
    await AsyncStorage.setItem("hideva_settings", JSON.stringify(data)).catch(() => {});
  }, []);

  const addCall = useCallback((call: CallRecord) => {
    setCalls((prev) => {
      const updated = [call, ...prev];
      saveCalls(updated);
      return updated;
    });
  }, [saveCalls]);

  const addRule = useCallback((rule: Rule) => {
    setRules((prev) => {
      const updated = [...prev, rule];
      saveRules(updated);
      return updated;
    });
  }, [saveRules]);

  const updateRule = useCallback((id: string, updates: Partial<Rule>) => {
    setRules((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      saveRules(updated);
      return updated;
    });
  }, [saveRules]);

  const deleteRule = useCallback((id: string) => {
    setRules((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveRules(updated);
      return updated;
    });
  }, [saveRules]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...updates };
      saveSettings(updated);
      return updated;
    });
  }, [saveSettings]);

  const markCallImportant = useCallback((id: string) => {
    setCalls((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, status: "important" as CallStatus } : c
      );
      saveCalls(updated);
      return updated;
    });
  }, [saveCalls]);

  const stats = {
    callsHandled: calls.filter((c) => c.status === "handled" || c.status === "screened").length,
    spamBlocked: calls.filter((c) => c.status === "spam").length,
    importantCalls: calls.filter((c) => c.status === "important").length,
    timeSaved: calls.filter((c) => c.status === "handled" || c.status === "spam").length * 2,
  };

  return (
    <AppContext.Provider
      value={{ calls, rules, settings, stats, addCall, addRule, updateRule, deleteRule, updateSettings, markCallImportant }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
