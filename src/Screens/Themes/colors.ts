// src/Screens/Themes/colors.ts
// HydroFind design tokens — based on the UI/UX Concept in the project proposal:
// "Primary Colors: shades of blue and white (water/cleanliness), light gray
// accent for backgrounds. Typography: clean sans-serif (Roboto/Poppins)."

export const colors = {
  // Core brand blues
  primary: '#1565D8',
  primaryDark: '#0D47A1',
  primaryLight: '#E9F1FD',
  primarySoft: '#DCEBFF',

  // Neutrals
  white: '#FFFFFF',
  background: '#F3F5F8',
  card: '#FFFFFF',
  border: '#E7EBF0',
  textDark: '#1C2733',
  textMuted: '#6B7684',
  textFaint: '#9CA6B2',

  // Status colors (order lifecycle)
  pendingBg: '#FFF3DC',
  pendingText: '#B4790E',
  onTheWayBg: '#E3EEFF',
  onTheWayText: '#1565D8',
  deliveredBg: '#E4F7EC',
  deliveredText: '#1E9E5A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};