import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  RefreshControl,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import {
  colors,
  spacing,
  radius,
  type,
  shadow,
  MIN_TOUCH,
} from "../../lib/theme";

// [UI saja] Warna badge status. Teks status asli dari database tidak diubah.
function statusStyle(status: string | null | undefined) {
  const s = (status || "").toLowerCase();
  if (/(selesai|resolved|done|complete|diterima|approved)/.test(s)) {
    return { bg: colors.successSoft, fg: colors.primaryDark };
  }
  if (/(proses|progress|diproses|ditangani)/.test(s)) {
    return { bg: colors.infoSoft, fg: colors.info };
  }
  if (/(tolak|reject|batal|cancel)/.test(s)) {
    return { bg: colors.dangerSoft, fg: colors.danger };
  }
  return { bg: colors.warningSoft, fg: colors.warning }; // Pending / default
}

// [UI saja] Skeleton berdenyut sebagai pengganti spinner layar penuh.
function SkeletonList() {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View
      style={styles.listContainer}
      accessibilityLabel="Memuat riwayat laporan"
    >
      {[0, 1, 2, 3].map((i) => (
        <Animated.View key={i} style={[styles.card, { opacity: pulse }]}>
          <View style={[styles.thumbnail, styles.skelBlock]} />
          <View style={styles.cardInfo}>
            <View style={[styles.skelLine, { width: "75%", height: 16 }]} />
            <View style={[styles.skelLine, { width: "50%" }]} />
            <View style={[styles.skelLine, { width: "35%" }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

export default function HistoryScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // [UI saja] state untuk pull-to-refresh & tampilan error
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    fetchUserReports();
  }, []);

  const fetchUserReports = async () => {
    try {
      setHasError(false);
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
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  // Pull-to-refresh memakai fungsi fetch yang sama
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserReports();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SkeletonList />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          reports.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        // Empty state & error state ada di dalam list agar pull-to-refresh
        // tetap bisa dipakai saat data kosong.
        ListEmptyComponent={
          hasError ? (
            <View style={styles.center}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: colors.dangerSoft },
                ]}
              >
                <Ionicons
                  name="cloud-offline-outline"
                  size={36}
                  color={colors.danger}
                />
              </View>
              <Text style={styles.emptyTitle}>Riwayat gagal dimuat</Text>
              <Text style={styles.emptyText}>
                Periksa koneksi internet, lalu coba lagi.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={onRefresh}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.retryText}>Muat ulang</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.center}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="leaf-outline"
                  size={36}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>Belum ada laporan</Text>
              <Text style={styles.emptyText}>
                Belum ada laporan sampah yang dikirim.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const st = statusStyle(item.status);
          return (
            <View style={styles.card}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.thumbnail}
                  accessibilityLabel={`Foto laporan ${item.title}`}
                />
              ) : (
                <View style={[styles.thumbnail, styles.thumbPlaceholder]}>
                  <Ionicons
                    name="image-outline"
                    size={24}
                    color={colors.placeholder}
                  />
                </View>
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.cardCategory} numberOfLines={1}>
                  Kategori: {item.waste_category}
                </Text>

                <View style={styles.metaRow}>
                  <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                    <Text style={[styles.statusBadge, { color: st.fg }]}>
                      {item.status}
                    </Text>
                  </View>
                  <Text style={styles.cardDate}>
                    {new Date(item.created_at).toLocaleDateString("id-ID", {
                      dateStyle: "medium",
                    })}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  listContainer: {
    padding: spacing.md,
    width: "100%",
    maxWidth: 640, // tetap nyaman dibaca di tablet
    alignSelf: "center",
  },
  listEmpty: { flexGrow: 1 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md - 2,
    marginBottom: spacing.md - 4,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow(1),
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.border,
    marginRight: spacing.md - 2,
  },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  cardTitle: { ...type.heading, color: colors.text, marginBottom: spacing.xs },
  cardCategory: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  statusPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  statusBadge: { fontSize: 12, fontWeight: "700" },
  cardDate: { fontSize: 12, color: colors.textSubtle },

  // Skeleton
  skelBlock: { backgroundColor: colors.border },
  skelLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },

  // Empty / error state
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: { ...type.title, color: colors.text, marginBottom: spacing.sm },
  emptyText: {
    ...type.body,
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: 300,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: MIN_TOUCH,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  retryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
