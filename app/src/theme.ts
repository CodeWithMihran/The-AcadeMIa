/**
 * The AcadeMIa Mobile Design System Tokens
 * Aligned with the website's brand colors, typography hierarchy, and spacing rules.
 */

export const colors = {
  // Brand & Accent
  primary: '#315cf5',
  primaryDark: '#1e40af',
  primarySubtle: '#eef3ff',
  primaryPill: '#f0f4ff',
  primaryBorder: '#c7d7fe',

  // Dark & Inverse Surfaces (Mobile header & prominent actions)
  darkSurface: '#111318',
  darkSurfaceRaised: '#1c1f26',
  darkSurfaceBorder: '#282b32',

  // Backgrounds & Surfaces
  background: '#f7f8fc',
  surface: '#ffffff',
  surfaceRaised: '#ffffff',
  surfaceMuted: '#f1f4f9',
  surfaceSubtle: '#f8f9fc',
  surfaceHover: '#eef2f7',

  // Text / Content Hierarchy
  textPrimary: '#101828',
  textSecondary: '#475467',
  textMuted: '#687187',
  textFaint: '#929bad',
  textInverse: '#ffffff',
  textInverseMuted: '#aebbe7',

  // Lines & Borders
  line: '#e7eaf1',
  lineLight: '#edf0f5',
  lineStrong: '#cfd6e3',
  lineSubtle: '#dfe4ed',

  // Status & Semantics
  success: {
    bg: '#edfcf2',
    border: '#abefc6',
    text: '#067647',
    indicator: '#12b76a',
  },
  warning: {
    bg: '#fef8e7',
    border: '#fedf89',
    text: '#b54708',
    indicator: '#f79009',
  },
  danger: {
    bg: '#fff5f5',
    border: '#fecdca',
    text: '#b42318',
    indicator: '#f04438',
  },
  indigo: {
    bg: '#eef2ff',
    border: '#c7d2fe',
    text: '#4338ca',
  },
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const radii = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  eyebrow: {
    fontSize: 10,
    fontWeight: '900' as const,
    letterSpacing: 1.2,
    color: colors.primary,
  },
  titleLg: {
    fontSize: 27,
    fontWeight: '900' as const,
    lineHeight: 33,
    color: colors.textPrimary,
  },
  titleMd: {
    fontSize: 20,
    fontWeight: '900' as const,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  titleSm: {
    fontSize: 16,
    fontWeight: '800' as const,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  bodySm: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    color: colors.textMuted,
  },
  caption: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 15,
    color: colors.textMuted,
  },
  pill: {
    fontSize: 9,
    fontWeight: '900' as const,
    letterSpacing: 0.5,
  },
};
