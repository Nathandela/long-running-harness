export const tokens = {
  color: {
    black: "#000000",
    white: "#ffffff",
    blue: "#0066ff",
    pink: "#ff2d6f",
    green: "#39ff14",
    amber: "#ffb800",
    red: "#ff0000",
    gray900: "#111111",
    gray700: "#333333",
    gray500: "#666666",
    gray300: "#999999",
    gray100: "#e5e5e5",
  },
  font: {
    mono: "'JetBrains Mono', monospace",
    sans: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  space: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    6: 24,
    8: 32,
    12: 48,
    16: 64,
  },
  text: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 20,
    "2xl": 24,
    "3xl": 32,
    "4xl": 48,
  },
  border: {
    width: 2,
  },
} as const;

export type ThemeTokens = typeof tokens;
