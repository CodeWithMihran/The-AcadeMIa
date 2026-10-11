/**
 * The AcadeMIa Mobile Design System Tokens
 * Aligned with the website's brand colors, typography hierarchy, and spacing rules.
 */

export const colors = {
  // Brand & Accent
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primarySubtle: '#eff6ff',
  primaryPill: '#dbeafe',
  primaryBorder: '#bfdbfe',

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
  textInverseMuted: '#bfdbfe',

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
    bg: '#eff6ff',
    border: '#bfdbfe',
    text: '#1d4ed8',
  },
};

export type AppThemeMode = 'light' | 'dark';
let activeThemeMode: AppThemeMode = 'light';

export function setAdaptiveThemeMode(mode: AppThemeMode): void {
  activeThemeMode = mode;
}

function darkenStyle(style: Record<string, unknown>): Record<string, unknown> {
  const colorMap: Record<string, string> = {
    // Canvas & backgrounds: Deep rich obsidian slate
    '#f7f8fc': '#0b0d12',
    '#f8f9fc': '#0b0d12',
    '#ffffff': '#13161f',
    '#fff': '#13161f',
    // Elevated & secondary card surfaces
    '#f1f4f9': '#1a1e29',
    '#f1f3f8': '#1a1e29',
    '#f2f4f8': '#1a1e29',
    '#eef2f7': '#1a1e29',
    '#f8f9ff': '#181c26',
    '#f7f9ff': '#181c26',
    '#fbfcff': '#181c26',
    '#f5f7fc': '#181c26',
    // Primary subtle & pill backgrounds (blue brand)
    '#eff6ff': '#172554',
    '#dbeafe': '#1e3a8a',
    '#bfdbfe': '#93c5fd',
    '#2563eb': '#60a5fa',
    '#1d4ed8': '#93c5fd',
    // Status badges & surfaces
    '#edfcf2': '#0e261a',
    '#abefc6': '#225d3c',
    '#fef8e7': '#2a2012',
    '#fedf89': '#78561d',
    '#fff5f5': '#2c1417',
    '#fff7f7': '#2c1417',
    '#fecdca': '#6b272d',
    '#fffafa': '#2c1417',
    // Borders & dividers: Crisp, visible borders that separate cards cleanly
    '#e7eaf1': '#252a38',
    '#edf0f5': '#252a38',
    '#dfe4ed': '#2e3546',
    '#cfd6e3': '#3b4357',
    '#e6eaf2': '#252a38',
    '#f0f1f5': '#252a38',
    '#edf1f7': '#252a38',
    '#edf0f6': '#252a38',
    '#dce2ef': '#2e3546',
    '#e1e5ed': '#2e3546',
    '#e1e5ee': '#2e3546',
    '#e1e6ef': '#2e3546',
    '#e3e8f2': '#2e3546',
    '#d7deeb': '#2e3546',
    '#f0d6d6': '#4a2529',
    '#f1c9c9': '#572b2f',
    // Text colors: High-contrast, crystal clear hierarchy
    '#101828': '#f8fafc',
    '#111827': '#f8fafc',
    '#182033': '#f8fafc',
    '#20283a': '#f1f5f9',
    '#303846': '#f1f5f9',
    '#394256': '#e2e8f0',
    '#475467': '#cbd5e1',
    '#4d586d': '#cbd5e1',
    '#515b70': '#cbd5e1',
    '#596478': '#cbd5e1',
    '#4e586a': '#cbd5e1',
    '#687187': '#94a3b8',
    '#737b8c': '#94a3b8',
    '#7e8799': '#94a3b8',
    '#8a93a4': '#94a3b8',
    '#8a93a6': '#94a3b8',
    '#858da0': '#94a3b8',
    '#929bad': '#94a3b8',
    // Vibrant accent indicators
    '#067647': '#34d399',
    '#b54708': '#fbbf24',
    '#b42318': '#f87171',
    '#9b1c1c': '#f87171',
    '#a12f36': '#f87171',
  };
  const result: Record<string, unknown> = {...style};
  for (const property of ['backgroundColor', 'borderColor', 'borderBottomColor', 'borderTopColor', 'borderLeftColor', 'borderRightColor', 'color', 'shadowColor']) {
    const value = result[property];
    if (typeof value !== 'string') continue;
    const normalized = value.toLowerCase();
    // White is both a surface token and an inverse text color. Only remap it
    // on non-text properties so white labels/icons stay visible on dark UI.
    if ((normalized === '#ffffff' || normalized === '#fff') && property === 'color') continue;
    if (colorMap[normalized]) { result[property] = colorMap[normalized]; continue; }
    const match = normalized.match(/^#([0-9a-f]{6})$/);
    if (!match) continue;
    const red = parseInt(match[1].slice(0,2),16);
    const green = parseInt(match[1].slice(2,4),16);
    const blue = parseInt(match[1].slice(4,6),16);
    const brightness = (red*299 + green*587 + blue*114)/1000;
    const saturation = Math.max(red,green,blue)-Math.min(red,green,blue);
    if (property.toLowerCase().includes('border') && brightness > 165) result[property] = '#252a38';
    else if (property === 'backgroundColor' && brightness > 230) result[property] = '#13161f';
    else if (property === 'backgroundColor' && brightness > 200 && saturation < 100) result[property] = '#1a1e29';
    else if (property === 'color' && brightness < 165 && saturation < 75) result[property] = '#cbd5e1';
  }
  return result;
}

/** Applies the mobile dark palette at render time to shared and screen-local styles. */
export function createAdaptiveStyles<T extends Record<string, unknown>>(styles: T): T {
  return new Proxy(styles, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (activeThemeMode !== 'dark' || !value || typeof value !== 'object' || Array.isArray(value)) return value;
      return darkenStyle(value as Record<string, unknown>);
    },
  });
}

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
