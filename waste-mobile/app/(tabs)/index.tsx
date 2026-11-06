import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { supabase } from "../../lib/supabase";
import { CONFIG } from "../../lib/config";
import {
  colors,
  spacing,
  radius,
  type,
  shadow,
  MIN_TOUCH,
} from "../../lib/theme";

// [UI saja] Kartu hasil dengan animasi slide-up + bar confidence.
// Komponen terpisah agar hook animasinya tidak mengganggu urutan hook ScanScreen.
function ResultCard({
  category,
  confidence,
  onReset,
  bottomInset,
}: {
  category: string;
  confidence: number;
  onReset: () => void;
  bottomInset: number;
}) {
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [slide]);

  const pct = Math.max(0, Math.min(100, confidence * 100));

  return (
    <Animated.View
      style={[
        styles.resultCard,
        { bottom: spacing.md + bottomInset },
        {
          opacity: slide,
          transform: [
            {
              translateY: slide.interpolate({
                inputRange: [0, 1],
                outputRange: [40, 0],
              }),
            },
          ],
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.resultHeader}>
        <View style={styles.resultIcon}>
          <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
        </View>
        <Text style={styles.resultTitle}>Hasil Deteksi AI</Text>
      </View>

      <Text style={styles.resultCategory}>Kategori: {category}</Text>

      <View style={styles.confRow}>
        <Text style={styles.resultConfidence}>
          Confidence: {pct.toFixed(1)}%
        </Text>
      </View>
      <View style={styles.confTrack}>
        <View style={[styles.confFill, { width: `${pct}%` }]} />
      </View>

      <View style={styles.successPill}>
        <Ionicons name="cloud-done-outline" size={16} color={colors.success} />
        <Text style={styles.successSubtext}>
          Laporan & foto berhasil terkirim ke Admin!
        </Text>
      </View>

      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={onReset}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <Ionicons name="scan-outline" size={20} color="#fff" />
        <Text style={styles.buttonText}>Scan Sampah Lain</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<{
    category: string;
    confidence: number;
  } | null>(null);

  // Permission masih dimuat -> tampilkan indikator (sebelumnya layar kosong)
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // PERUBAHAN LAYOUT: empty state izin kamera dengan ikon & penjelasan
  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.permIcon}>
          <Ionicons name="camera-outline" size={40} color={colors.primary} />
        </View>
        <Text style={styles.permTitle}>Izin kamera diperlukan</Text>
        <Text style={styles.message}>
          Kami memerlukan izin akses kamera untuk memindai sampah.
        </Text>
        <TouchableOpacity
          style={[styles.buttonPrimary, styles.permButton]}
          onPress={requestPermission}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Berikan Izin Kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({
          quality: 0.7,
          skipProcessing: true,
        });
        setCapturedImage(photo.uri);

        let latitude = null;
        let longitude = null;

        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const location = (await Promise.race([
              Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              }),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("GPS Timeout")), 5000),
              ),
            ])) as any;

            latitude = location.coords.latitude;
            longitude = location.coords.longitude;
          }
        } catch (gpsError) {
          console.warn(
            "GPS gagal/timeout, melanjutkan tanpa koordinat presisi:",
            gpsError,
          );
        }

        // Jalankan analisis AI setelah foto dan koordinat siap
        simulateAIAnalysis(photo.uri, latitude, longitude);
      } catch (error: any) {
        Alert.alert("Gagal mengambil foto", error.message);
        setAnalyzing(false);
      }
    }
  };

  const simulateAIAnalysis = async (
    imageUri: string,
    latitude: number | null,
    longitude: number | null,
  ) => {
    setAnalyzing(true);
    setScanResult(null);

    try {
      if (!CONFIG.ML_API_URL) {
        throw new Error("URL ML API belum terkonfigurasi di file .env");
      }

      // 1. Kirim gambar ke FastAPI untuk diprediksi AI
      const uploadResult = await FileSystem.uploadAsync(
        `${CONFIG.ML_API_URL}/predict`,
        imageUri,
        {
          fieldName: "file",
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        },
      );

      if (uploadResult.status !== 200) {
        throw new Error("Gagal mendapatkan respons dari server AI FastAPI.");
      }

      const result = JSON.parse(uploadResult.body);
      const detectedCategory = result.category; // Contoh: "Plastic Waste"
      const confidenceScore = result.confidence; // Contoh: 0.954

      setScanResult({
        category: detectedCategory,
        confidence: confidenceScore,
      });

      // 2. Upload foto ke Supabase Storage terlebih dahulu agar bisa diakses Web Dashboard
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileName = `waste_${Date.now()}.jpg`;
      const filePath = `public/${fileName}`;

      const { error: storageError } = await supabase.storage
        .from("waste-images")
        .upload(filePath, decode(base64), {
          contentType: "image/jpeg",
        });

      if (storageError) throw storageError;

      // Ambil Public URL dari file yang baru di-upload
      const { data: publicUrlData } = supabase.storage
        .from("waste-images")
        .getPublicUrl(filePath);

      const publicImageUrl = publicUrlData.publicUrl;

      setAnalyzing(false);

      // 3. Simpan laporan lengkap ke tabel Supabase 'reports'
      await saveReportToSupabase(
        detectedCategory,
        confidenceScore,
        publicImageUrl,
        latitude,
        longitude,
      );
    } catch (error: any) {
      console.error("AI Analysis Error:", error.message);
      Alert.alert(
        "Gagal Analisis AI",
        "Pastikan koneksi internet stabil dan URL API sudah benar.",
      );
      setAnalyzing(false);
    }
  };

  const saveReportToSupabase = async (
    category: string,
    confidence: number,
    publicImageUrl: string,
    latitude: number | null,
    longitude: number | null,
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "Sesi login habis, silakan login kembali.");
        return;
      }

      const { data, error } = await supabase
        .from("reports")
        .insert([
          {
            user_id: user.id,
            title: `Sampah ${category} Terdeteksi`,
            description: `Terdeteksi otomatis oleh AI dengan keyakinan ${(
              confidence * 100
            ).toFixed(1)}%.`,
            waste_category: category,
            confidence: confidence, // Disimpan sebagai desimal agar dashboard web tidak "N/A"
            image_url: publicImageUrl, // Menggunakan URL publik dari Supabase Storage
            status: "Pending",
            latitude: latitude,
            longitude: longitude,
          },
        ])
        .select();

      if (error) {
        console.error("Supabase Insert Error:", error.message);
        Alert.alert("Gagal Simpan", error.message);
      } else {
        console.log("Laporan berhasil masuk ke database & storage:", data);
        Alert.alert(
          "Sukses",
          "Laporan beserta foto publik & lokasi GPS berhasil dikirim ke Admin!",
        );
      }
    } catch (err: any) {
      console.error("Network Error:", err.message);
    }
  };

  const resetScan = () => {
    setCapturedImage(null);
    setScanResult(null);
  };

  return (
    <View style={styles.container}>
      {!capturedImage ? (
        <View style={styles.cameraWrapper}>
          <CameraView
            style={styles.camera}
            facing={facing}
            ref={(ref) => setCameraRef(ref)}
          />

          {/* PERUBAHAN LAYOUT: overlay dibagi 3 zona (instruksi / bingkai
              bidik / kontrol) dan memakai safe-area insets. */}
          <View
            style={[
              styles.absoluteOverlay,
              {
                paddingTop: insets.top + spacing.md,
                paddingBottom: spacing.lg,
              },
            ]}
            pointerEvents="box-none"
          >
            <Text style={styles.instructionText}>
              Arahkan kamera ke sampah yang ingin dipindai
            </Text>

            {/* Bingkai bidik (dekoratif, tidak menangkap sentuhan) */}
            <View style={styles.frame} pointerEvents="none">
              <View style={[styles.corner, styles.cTL]} />
              <View style={[styles.corner, styles.cTR]} />
              <View style={[styles.corner, styles.cBL]} />
              <View style={[styles.corner, styles.cBR]} />
            </View>

            <View style={styles.controlsRow}>
              {/* spacer agar tombol shutter tetap di tengah */}
              <View style={styles.sideSlot} />

              <TouchableOpacity
                style={styles.captureButtonContainer}
                onPress={takePicture}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Ambil foto sampah"
              >
                <View style={styles.captureButtonOuter}>
                  <View style={styles.captureButtonInner} />
                </View>
              </TouchableOpacity>

              <View style={styles.sideSlot}>
                <TouchableOpacity
                  style={styles.flipButton}
                  onPress={() =>
                    setFacing((f) => (f === "back" ? "front" : "back"))
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Balik kamera"
                >
                  <Ionicons
                    name="camera-reverse-outline"
                    size={24}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />

          {analyzing && (
            <View
              style={styles.loadingOverlay}
              accessibilityLiveRegion="polite"
            >
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                  Mengunggah foto & menganalisis sampah...
                </Text>
              </View>
            </View>
          )}

          {scanResult && !analyzing && (
            <ResultCard
              category={scanResult.category}
              confidence={scanResult.confidence}
              onReset={resetScan}
              bottomInset={insets.bottom}
            />
          )}

          {/* [UI saja] Error/idle state: bila analisis gagal, pengguna sebelumnya
              terjebak di layar foto. Tombol ini memakai resetScan yang sudah ada. */}
          {!scanResult && !analyzing && (
            <View
              style={[styles.retryBar, { bottom: spacing.md + insets.bottom }]}
            >
              <Text style={styles.retryText}>
                Analisis belum selesai atau gagal.
              </Text>
              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={resetScan}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Ionicons name="camera-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Kembali ke Kamera</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const CORNER = 28;
const CORNER_W = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  // --- Izin kamera / loading awal ---
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  permIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  permTitle: { ...type.title, color: colors.text, marginBottom: spacing.sm },
  message: {
    ...type.body,
    textAlign: "center",
    marginBottom: spacing.lg,
    color: colors.textMuted,
    maxWidth: 320,
  },
  permButton: { maxWidth: 320 },

  // --- Kamera ---
  cameraWrapper: { flex: 1, position: "relative" },
  camera: { flex: 1, width: "100%", height: "100%" },
  absoluteOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  instructionText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  frame: {
    width: "72%",
    aspectRatio: 1,
    maxWidth: 320,
  },
  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: colors.accent,
  },
  cTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderTopLeftRadius: radius.md,
  },
  cTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderTopRightRadius: radius.md,
  },
  cBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderBottomLeftRadius: radius.md,
  },
  cBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderBottomRightRadius: radius.md,
  },

  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 400,
  },
  sideSlot: { width: 64, alignItems: "center", justifyContent: "center" },
  flipButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ffffff",
  },

  // --- Preview & analisis ---
  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: { ...StyleSheet.absoluteFill, resizeMode: "cover" },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
    zIndex: 20,
  },
  loadingBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    maxWidth: 320,
    ...shadow(3),
  },
  loadingText: {
    ...type.label,
    color: colors.text,
    marginTop: spacing.md,
    textAlign: "center",
  },

  // --- Kartu hasil ---
  resultCard: {
    position: "absolute",
    width: "92%",
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    zIndex: 30,
    ...shadow(3),
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: { ...type.title, color: colors.text },
  resultCategory: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  confRow: { flexDirection: "row", justifyContent: "space-between" },
  resultConfidence: {
    ...type.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  confTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  confFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  successPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  successSubtext: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: colors.primaryDark,
  },

  // --- Retry bar (error/idle) ---
  retryBar: {
    position: "absolute",
    width: "92%",
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    zIndex: 30,
    ...shadow(3),
  },
  retryText: { ...type.body, color: colors.textMuted, textAlign: "center" },

  buttonPrimary: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
