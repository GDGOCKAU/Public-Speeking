// GDG KAU design tokens.
// Every color, radius, shadow and font in the identity lives here so no component has to
// invent one. Call `theme(darkMode)` for the resolved palette of the current mode.

/* ── Google brand four ───────────────────────────────────────────────── */

export const GOOGLE = {
  blue: "#4285F4",
  red: "#EA4335",
  yellow: "#FBBC04",
  green: "#34A853",
};

// The bottom bar keeps the historical #FBBC05 yellow. Nothing else does.
export const GOOGLE_BAR = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];

// Cycle in this order when assigning colors to teams, series, or avatars.
export const SERIES = [
  "#4285F4", "#34A853", "#EA4335", "#FBBC04", "#9C27B0", "#FF7043", "#78909C",
];

export const AVATAR_COLORS = ["#4285F4", "#EA4335", "#34A853", "#FBBC04", "#9C27B0"];

/* ── Interactive blue — the only clickable color ──────────────────────── */

export const PRIMARY = {
  base: "#3A7CF5",
  hover: "#2563EB",
  tintLight: "#E8F0FE",
  tintDark: "#1A2E4B",
  onTint: "#1967D2",
};

/* ── Palettes ─────────────────────────────────────────────────────────── */

const LIGHT = {
  bg: "#F8F9FA",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F3F4",
  surfaceDeep: "#F8F9FA",
  rowHover: "#FAFAFA",
  border: "#E0E0E0",
  borderSubtle: "#F1F3F4",
  textPrimary: "#1C1B1F",
  textSecondary: "#3C4043",
  textMuted: "#5F6368",
  textFaint: "#9AA0A6",
  textGhost: "#C4C7CC",
  primaryTint: PRIMARY.tintLight,
};

const DARK = {
  bg: "#121212",
  surface: "#1E1E1E",
  surfaceAlt: "#2A2A2A",
  surfaceDeep: "#222222",
  rowHover: "#2A2A2A",
  border: "#333333",
  borderSubtle: "#3C3C3C",
  textPrimary: "#E0E0E0",
  textSecondary: "#CCCCCC",
  textMuted: "#AAAAAA",
  textFaint: "#888888",
  textGhost: "#666666",
  primaryTint: PRIMARY.tintDark,
};

/**
 * Resolved palette for the current mode.
 * Usage:  const t = theme(darkMode);  →  style={{ backgroundColor: t.surface }}
 */
export function theme(darkMode) {
  return darkMode ? DARK : LIGHT;
}

/* ── Semantic status scales ───────────────────────────────────────────── */

export const STATUS = {
  success: { bg: "#E8F5E9", text: "#2E7D32", dot: "#34A853", darkBg: "rgba(52,168,83,0.15)",   darkText: "#4ADE80" },
  error:   { bg: "#FFEBEE", text: "#B71C1C", dot: "#EA4335", darkBg: "rgba(234,67,53,0.15)",   darkText: "#FCA5A5" },
  warning: { bg: "#FFF8E1", text: "#E65100", dot: "#FBBC04", darkBg: "rgba(251,188,4,0.15)",   darkText: "#FBBF24" },
  info:    { bg: "#E8F0FE", text: "#1967D2", dot: "#4285F4", darkBg: "rgba(66,133,244,0.15)",  darkText: "#60A5FA" },
  neutral: { bg: "#F1F3F4", text: "#5F6368", dot: "#9AA0A6", darkBg: "rgba(148,163,184,0.15)", darkText: "#A3A3A3" },
  special: { bg: "#F3E5F5", text: "#6A1B9A", dot: "#9C27B0", darkBg: "rgba(156,39,176,0.15)",  darkText: "#D8B4FE" },
};

/** Resolve one status scale for the current mode. */
export function status(name, darkMode) {
  const s = STATUS[name] || STATUS.neutral;
  return {
    bg: darkMode ? s.darkBg : s.bg,
    text: darkMode ? s.darkText : s.text,
    dot: s.dot,
  };
}

export const BANNER = {
  light: { bg: "#FFEBEE", border: "#FFCDD2", text: "#C62828" },
  dark:  { bg: "rgba(234,67,53,0.12)", border: "rgba(234,67,53,0.35)", text: "#FCA5A5" },
};

/* ── Typography ───────────────────────────────────────────────────────── */

export const FONT = {
  // Headings, buttons, nav, stat numbers, entity names.
  display: "'DM Sans', sans-serif",
  // Body copy, labels, captions, help text.
  body: "'Roboto', sans-serif",
  // Code, access codes, IDs, sample I/O.
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

export const TEXT = {
  hero:      { fontSize: "42px", fontWeight: 700, letterSpacing: "-0.5px" },
  pageTitle: { fontSize: "26px", fontWeight: 700, letterSpacing: "-0.4px" },
  section:   { fontSize: "22px", fontWeight: 700, letterSpacing: "-0.3px" },
  stat:      { fontSize: "32px", fontWeight: 700, lineHeight: 1 },
  cardTitle: { fontSize: "18px", fontWeight: 700, letterSpacing: "-0.2px" },
  body:      { fontSize: "14px", fontWeight: 400 },
  label:     { fontSize: "13px", fontWeight: 500 },
  caption:   { fontSize: "12px", fontWeight: 400 },
  badge:     { fontSize: "11px", fontWeight: 700 },
};

/* ── Radius, elevation, motion ────────────────────────────────────────── */

export const RADIUS = {
  chip: "6px",
  input: "8px",
  button: "10px",
  card: "12px",
  panel: "16px",
  modal: "20px",
  modalForm: "24px",
  pill: "100px",
};

export const SHADOW = {
  card: "0 1px 2px rgba(0,0,0,0.04)",
  hero: "0 1px 2px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
  primary: "0 2px 8px rgba(58,124,245,0.30)",
  primaryHover: "0 4px 12px rgba(58,124,245,0.40), 0 2px 4px rgba(58,124,245,0.20)",
  danger: "0 2px 6px rgba(234,67,53,0.30)",
};

export const SCRIM = {
  confirm: { backgroundColor: "rgba(28,27,31,0.40)", backdropFilter: "blur(2px)" },
  form:    { backgroundColor: "rgba(28,27,31,0.45)", backdropFilter: "blur(3px)" },
};

export const MOTION = {
  duration: "150ms",
  ease: "cubic-bezier(0.33, 0, 0.66, 1)",
};

/* ── Helpers ──────────────────────────────────────────────────────────── */

/** Stable brand color for an arbitrary name (teams, users, tags). */
export function colorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Up to two uppercase initials, split on spaces, underscores or hyphens. */
export function getInitials(name) {
  if (!name) return "--";
  return name
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
