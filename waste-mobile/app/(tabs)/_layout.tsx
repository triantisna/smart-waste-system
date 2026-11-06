import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Scan Sampah",
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="camera"
              size={size}
              color={
                typeof color === "string"
                  ? color
                  : focused
                    ? "#2563eb"
                    : "#9ca3af"
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Riwayat",
          headerShown: true,
          headerTitle: "Riwayat Laporan Saya",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="list"
              size={size}
              color={
                typeof color === "string"
                  ? color
                  : focused
                    ? "#2563eb"
                    : "#9ca3af"
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          headerShown: true,
          headerTitle: "Profil Pengguna",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="person-circle"
              size={size}
              color={
                typeof color === "string"
                  ? color
                  : focused
                    ? "#2563eb"
                    : "#9ca3af"
              }
            />
          ),
        }}
      />
    </Tabs>
  );
}
