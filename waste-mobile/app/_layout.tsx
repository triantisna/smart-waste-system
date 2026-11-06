import { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { supabase } from "../lib/supabase";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Cek sesi aktif saat aplikasi pertama kali dibuka
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
      }
      setInitializing(false);
    });

    // Listener untuk perubahan status auth (Login / Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
