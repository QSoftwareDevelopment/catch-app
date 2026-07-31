/**
 * Design tokens. One place to change so the auth screens stay visually coherent, and so
 * later slices inherit the same vocabulary instead of inventing new hex codes.
 */

export const colors = {
  /** Deep navy. Landing background and primary brand surface. */
  ink: '#0B1220',
  inkSoft: '#16203A',

  /** Signal green — the "send" colour, used for primary actions. */
  accent: '#2BD98B',
  accentPressed: '#22B473',
  accentInk: '#04140C',

  surface: '#FFFFFF',
  surfaceAlt: '#F4F6FB',
  border: '#DDE2EE',
  borderStrong: '#B9C1D4',

  text: '#0B1220',
  textMuted: '#5A6478',
  textInverse: '#FFFFFF',
  textInverseMuted: '#9AA6C0',

  danger: '#D8443C',
  dangerSurface: '#FDECEB',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  display: 34,
} as const;
