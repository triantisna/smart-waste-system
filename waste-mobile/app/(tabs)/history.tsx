import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function HistoryScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserReports();
  }, []);

  const fetchUserReports = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err: any) {
      console.error("Gagal memuat riwayat:", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {reports.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            Belum ada laporan sampah yang dikirim.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.image_url && (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.thumbnail}
                />
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardCategory}>
                  Kategori: {item.waste_category}
                </Text>
                <Text style={styles.cardStatus}>
                  Status: <Text style={styles.statusBadge}>{item.status}</Text>
                </Text>
                <Text style={styles.cardDate}>
                  {new Date(item.created_at).toLocaleDateString("id-ID", {
                    dateStyle: "medium",
                  })}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  listContainer: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
    marginRight: 14,
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  cardCategory: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "600",
    marginBottom: 2,
  },
  cardStatus: { fontSize: 13, color: "#4b5563", marginBottom: 2 },
  statusBadge: { color: "#d97706", fontWeight: "bold" },
  cardDate: { fontSize: 11, color: "#9ca3af" },
  emptyText: { fontSize: 15, color: "#6b7280", textAlign: "center" },
});
