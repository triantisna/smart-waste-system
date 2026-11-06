import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { supabase } from "../../lib/supabase";

const { width, height } = Dimensions.get("window");

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<{
    category: string;
    confidence: number;
  } | null>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.message}>
          Kami memerlukan izin akses kamera untuk memindai sampah.
        </Text>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={requestPermission}
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
      // 1. Kirim gambar ke FastAPI lokal untuk diprediksi AI
      const uploadResult = await FileSystem.uploadAsync(
        "http://192.168.1.5:8000/predict",
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
        "Pastikan server FastAPI Python aktif dan IP address sudah benar.",
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

          <View style={styles.absoluteOverlay}>
            <Text style={styles.instructionText}>
              Arahkan kamera ke sampah yang ingin dipindai
            </Text>

            <TouchableOpacity
              style={styles.captureButtonContainer}
              onPress={takePicture}
            >
              <View style={styles.captureButtonOuter}>
                <View style={styles.captureButtonInner} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />

          {analyzing && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>
                Mengunggah foto & menganalisis sampah...
              </Text>
            </View>
          )}

          {scanResult && !analyzing && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Hasil Deteksi AI</Text>
              <Text style={styles.resultCategory}>
                Kategori: {scanResult.category}
              </Text>
              <Text style={styles.resultConfidence}>
                Confidence: {(scanResult.confidence * 100).toFixed(1)}%
              </Text>
              <Text style={styles.successSubtext}>
                Laporan & foto berhasil terkirim ke Admin!
              </Text>

              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={resetScan}
              >
                <Text style={styles.buttonText}>Scan Sampah Lain</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 16,
    color: "#333",
  },
  cameraWrapper: { flex: 1, position: "relative" },
  camera: { flex: 1, width: "100%", height: "100%" },
  absoluteOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 60,
    zIndex: 10,
  },
  instructionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  captureButtonContainer: {
    marginBottom: 20,
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
  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: { width: width, height: height, position: "absolute" },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  loadingText: {
    color: "#fff",
    marginTop: 15,
    fontSize: 16,
    fontWeight: "500",
  },
  resultCard: {
    position: "absolute",
    bottom: 40,
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 30,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  resultCategory: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2563eb",
    marginBottom: 4,
  },
  resultConfidence: { fontSize: 14, color: "#4b5563", marginBottom: 12 },
  successSubtext: {
    fontSize: 12,
    color: "#16a34a",
    marginBottom: 20,
    fontStyle: "italic",
  },
  buttonPrimary: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
