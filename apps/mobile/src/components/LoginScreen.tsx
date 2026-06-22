import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { supabase } from '@/lib/supabase';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'exp://localhost:19000',
      },
    });
    setMessage(error ? error.message : 'Check your inbox for the sign-in link.');
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-slate-50 px-6 py-10">
      <Text className="text-3xl font-semibold text-slate-950">hiDeva Mobile</Text>
      <Text className="mt-3 text-sm text-slate-600">Sign in to sync your workspace and connectors.</Text>
      <View className="mt-8 rounded-3xl bg-white p-6 shadow-card">
        <Text className="text-sm font-medium text-slate-700">Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="name@company.com"
          className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
        />
        <Pressable
          onPress={handleLogin}
          disabled={loading}
          className="mt-5 rounded-2xl bg-slate-950 px-4 py-3"
        >
          <Text className="text-center text-sm font-semibold text-white">{loading ? 'Sending...' : 'Sign in'}</Text>
        </Pressable>
        {message ? <Text className="mt-4 text-sm text-slate-600">{message}</Text> : null}
      </View>
    </View>
  );
}
