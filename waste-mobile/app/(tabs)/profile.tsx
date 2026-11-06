import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, type, shadow } from "../../lib/theme";

export default function ProfileScreen() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || "Warga Smart Waste");
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Gagal Logout", error.message);
    } else {
      router.replace("/login");
    }
  };

  // [UI saja] inisial untuk avatar, diturunkan dari email yang sudah ada
  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : "";

  return (
    // PERUBAHAN LAYOUT: ScrollView + maxWidth agar rapi di layar kecil & tablet
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        <View style={styles.card}>
          {/* Banner hijau di atas kartu */}
          <View style={styles.banner} />

          <View style={styles.avatarContainer}>
            {initial ? (
              <Text style={styles.avatarInitial}>{initial}</Text>
            ) : (
              <Ionicons name="person" size={40} color={colors.primary} />
            )}
          </View>

          <Text style={styles.title}>Akun Warga</Text>

          {/* Skeleton sederhana selama email belum dimuat */}
          {userEmail ? (
            <Text style={styles.email} numberOfLines={1}>
              {userEmail}
            </Text>
          ) : (
            <View style={styles.emailSkeleton} />
          )}

          <View style={styles.roleBadge}>
            <Ionicons name="leaf" size={14} color={colors.primaryDark} />
            <Text style={styles.roleText}>Pelapor Smart Waste</Text>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Keluar dari akun"
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color="#fff"
              style={{ marginRight: spacing.sm }}
            />
            <Text style={styles.logoutText}>Keluar (Logout)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  inner: { width: "100%", maxWidth: 440, alignSelf: "center" },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow(2),
  },
  banner: {
    alignSelf: "stretch",
    height: 88,
    marginHorizontal: -spacing.lg,
    backgroundColor: colors.primary,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySoft,
    borderWidth: 4,
    borderColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -44, // avatar menimpa banner
    marginBottom: spacing.md,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  title: { ...type.title, color: colors.text, marginBottom: spacing.xs },
  email: {
    ...type.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
    maxWidth: "100%",
  },
  emailSkeleton: {
    width: 180,
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  roleText: { ...type.caption, color: colors.primaryDark, fontWeight: "700" },
  divider: {
    alignSelf: "stretch",
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },

  logoutButton: {
    flexDirection: "row",
    backgroundColor: colors.danger,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
