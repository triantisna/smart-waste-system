import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";
import { router } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

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
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Smart Waste App</Text>
        <Text style={styles.subtitle}>
          {isRegistering
            ? "Daftar Akun Baru Warga"
            : "Masuk untuk Melapor Sampah"}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isRegistering ? "Daftar Sekarang" : "Masuk"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsRegistering(!isRegistering)}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
            {isRegistering
              ? "Sudah punya akun? Masuk di sini"
              : "Belum punya akun? Daftar sekarang"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1f2937",
    marginBottom: 16,
  },
  buttonPrimary: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  switchButton: { marginTop: 16, alignItems: "center" },
  switchText: { color: "#2563eb", fontSize: 14, fontWeight: "500" },
});
