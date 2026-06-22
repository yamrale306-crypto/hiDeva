import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="dark" />
      <ScrollView className="px-5 py-8">
        <Text className="text-3xl font-semibold text-slate-950">hiDeva OS</Text>
        <Text className="mt-3 text-sm text-slate-600">
          Mobile workspace built for AI knowledge, tasks, projects, and connectors.
        </Text>
        <View className="mt-6 rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/80">
          <Text className="text-lg font-semibold text-slate-900">Dashboard</Text>
          <Text className="mt-3 text-sm leading-6 text-slate-600">
            This app is configured for Android APK generation, offline storage, and push notifications.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
