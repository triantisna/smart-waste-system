// FILE BARU: design tokens bersama untuk seluruh layar mobile.
// Seluruh spacing mengikuti grid 8px (4px untuk detail kecil).
import { Platform, ViewStyle } from "react-native";

export const colors = {
  primary: "#15803D", // putih di atas warna ini = kontras ~5:1 (AA)
  primaryDark: "#14532D",
  primarySoft: "#DCFCE7",
  primaryTint: "#F0FDF4",
  accent: "#FACC15", // dipakai hanya untuk sudut bingkai scan

  bg: "#F6FAF7",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",

  text: "#0F172A",
  textMuted: "#475569",
  textSubtle: "#64748B",
  placeholder: "#94A3B8",

  danger: "#B91C1C",
  dangerSoft: "#FEE2E2",
  warning: "#B45309",
  warningSoft: "#FEF3C7",
  info: "#1D4ED8",
  infoSoft: "#DBEAFE",
  success: "#15803D",
  successSoft: "#DCFCE7",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: "800" as const },
  title: { fontSize: 20, lineHeight: 26, fontWeight: "700" as const },
  heading: { fontSize: 16, lineHeight: 22, fontWeight: "700" as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" as const },
};

export const MIN_TOUCH = 48; // di atas minimum 44px

export const shadow = (level: 1 | 2 | 3 = 1): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: level * 2 },
      shadowOpacity: 0.05 + level * 0.02,
      shadowRadius: level * 6,
    },
    android: { elevation: level * 2 },
    default: {},
  }) as ViewStyle;
