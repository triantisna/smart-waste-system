import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { router } from "expo-router";
import { colors, spacing, radius, type, shadow, MIN_TOUCH } from "../lib/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // [UI saja] state visual: field yang sedang fokus & toggle lihat password
  const [focused, setFocused] = useState<"email" | "password" | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Fungsi untuk menyinkronkan profil user ke tabel public.users di Supabase
  const syncUserProfile = async (user: any) => {
    try {
      const { error } = await supabase.from("users").upsert(
        [
          {
            id: user.id,
            email: user.email,
            name: user.email ? user.email.split("@")[0] : "Warga", // Menggunakan bagian depan email sebagai nama default
            role: "user", // Set role otomatis sebagai user biasa
          },
        ],
        { onConflict: "id" },
      );

      if (error) {
        console.error(
          "Gagal sinkronisasi profil ke tabel users:",
          error.message,
        );
      }
    } catch (err: any) {
      console.error("Error sync user profile:", err.message);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email dan password tidak boleh kosong.");
      return;
    }

    setLoading(true);
    if (isRegistering) {
      // Proses Register
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);

      if (error) {
        Alert.alert("Gagal Daftar", error.message);
      } else {
        // Jika registrasi sukses dan langsung membuat sesi atau user objek tersedia
        if (data.user) {
          await syncUserProfile(data.user);
        }
        Alert.alert(
          "Sukses",
          "Akun berhasil dibuat dan disinkronkan! Silakan login.",
        );
        setIsRegistering(false);
      }
    } else {
      // Proses Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);

      if (error) {
        Alert.alert("Gagal Login", error.message);
      } else {
        // Berhasil login, sinkronkan profil untuk memastikan data user ada di tabel public.users
        if (data.user) {
          await syncUserProfile(data.user);
        }
        // Arahkan ke halaman utama tabs
        router.replace("/(tabs)");
      }
    }
  };

  return (
    // PERUBAHAN LAYOUT: KeyboardAvoidingView + ScrollView agar form tidak
    // tertutup keyboard dan tetap bisa di-scroll di layar kecil / landscape.
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          {/* Brand header: logo + nama aplikasi */}
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Ionicons name="leaf" size={36} color="#fff" />
            </View>
            <Text style={styles.title} accessibilityRole="header">
              Smart Waste App
            </Text>
            <Text style={styles.subtitle}>
              {isRegistering
                ? "Daftar Akun Baru Warga"
                : "Masuk untuk Melapor Sampah"}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View
              style={[
                styles.inputWrap,
                focused === "email" && styles.inputWrapFocused,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={focused === "email" ? colors.primary : colors.textSubtle}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                accessibilityLabel="Email"
              />
            </View>

            <Text style={styles.fieldLabel}>Password</Text>
            <View
              style={[
                styles.inputWrap,
                focused === "password" && styles.inputWrapFocused,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={
                  focused === "password" ? colors.primary : colors.textSubtle
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                accessibilityLabel="Password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={colors.textSubtle}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.buttonPrimary, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading, busy: loading }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isRegistering ? "Daftar Sekarang" : "Masuk"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setIsRegistering(!isRegistering)}
            style={styles.switchButton}
            accessibilityRole="button"
          >
            <Text style={styles.switchText}>
              {isRegistering
                ? "Sudah punya akun? Masuk di sini"
                : "Belum punya akun? Daftar sekarang"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  // maxWidth menjaga form tetap proporsional di tablet
  inner: { width: "100%", maxWidth: 440, alignSelf: "center" },

  brand: { alignItems: "center", marginBottom: spacing.lg },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadow(2),
  },
  title: { ...type.display, color: colors.primaryDark, textAlign: "center" },
  subtitle: {
    ...type.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xs,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow(2),
  },
  fieldLabel: {
    ...type.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: MIN_TOUCH + 4,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  inputWrapFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    fontSize: 16, // 16px mencegah auto-zoom di iOS
    color: colors.text,
    paddingVertical: spacing.sm + 4,
  },
  eyeButton: {
    width: 36,
    height: MIN_TOUCH,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonPrimary: {
    backgroundColor: colors.primary,
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  switchButton: {
    minHeight: MIN_TOUCH,
    marginTop: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  switchText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
});
