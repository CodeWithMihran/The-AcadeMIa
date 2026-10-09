/**
 * The AcadeMIa Mobile Design System Tokens
 * Aligned with the website's brand colors, typography hierarchy, and spacing rules.
 */

export const colors = {
  // Brand & Accent
  primary: '#16794b',
  primaryDark: '#145c38',
  primarySubtle: '#ecfdf3',
  primaryPill: '#f0fdf4',
  primaryBorder: '#b7e4c7',

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
  textInverseMuted: '#a8e2c3',

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
    bg: '#ecfdf3',
    border: '#b7e4c7',
    text: '#145c38',
  },
};

export type AppThemeMode = 'light' | 'dark';
let activeThemeMode: AppThemeMode = 'light';

export function setAdaptiveThemeMode(mode: AppThemeMode): void {
  activeThemeMode = mode;
}

function darkenStyle(style: Record<string, unknown>): Record<string, unknown> {
  const colorMap: Record<string, string> = {
    '#f7f8fc': '#111318', '#f8f9fc': '#111318', '#ffffff': '#1c1f26', '#fff': '#1c1f26',
    '#f1f4f9': '#242832', '#f1f3f8': '#242832', '#f2f4f8': '#242832', '#eef2f7': '#242832',
    '#f8f9ff': '#202432', '#f7f9ff': '#202432', '#fbfcff': '#202432', '#f5f7fc': '#202432', '#ecfdf3': '#153425', '#f0fdf4': '#183a29', '#b7e4c7': '#245d40',
    '#16794b': '#62d49b', '#145c38': '#79e2ac', '#a8e2c3': '#a8e2c3',
    '#edfcf2': '#10291e', '#abefc6': '#245d40', '#fef8e7': '#332715', '#fedf89': '#68501d',
    '#fff5f5': '#351d20', '#fff7f7': '#351d20', '#fecdca': '#623237', '#fffafa': '#351d20',
    '#e7eaf1': '#30343e', '#edf0f5': '#30343e', '#dfe4ed': '#3a404c', '#cfd6e3': '#424957',
    '#e6eaf2': '#30343e', '#f0f1f5': '#2a2e37', '#edf1f7': '#30343e', '#edf0f6': '#30343e', '#dce2ef': '#3a404c', '#e1e5ed': '#3a404c', '#e1e5ee': '#3a404c', '#e1e6ef': '#3a404c', '#e3e8f2': '#3a404c', '#d7deeb': '#3a404c',
    '#101828': '#f2f4f7', '#20283a': '#e4e8f1', '#303846': '#e4e8f1',
    '#475467': '#c5cedb', '#4d586d': '#c5cedb', '#515b70': '#c5cedb', '#596478': '#c5cedb', '#687187': '#aeb8c9', '#737b8c': '#aeb8c9', '#7e8799': '#aeb8c9', '#8a93a4': '#aeb8c9', '#8a93a6': '#aeb8c9', '#4e586a': '#c5cedb',
    '#858da0': '#aeb8c9', '#929bad': '#929bad', '#067647': '#6ee7a8', '#278458': '#6ee7a8',
    '#b54708': '#ffca80', '#b42318': '#ff9898', '#9b1c1c': '#ff9898',
    '#a12f36': '#ff9898',
  };
  const result: Record<string, unknown> = {...style};
  for (const property of ['backgroundColor', 'borderColor', 'borderBottomColor', 'borderTopColor', 'borderLeftColor', 'borderRightColor', 'color', 'shadowColor']) {
    const value = result[property];
    if (typeof value !== 'string') continue;
    const normalized = value.toLowerCase();
    if (colorMap[normalized]) { result[property] = colorMap[normalized]; continue; }
    const match = normalized.match(/^#([0-9a-f]{6})$/);
    if (!match) continue;
    const red = parseInt(match[1].slice(0,2),16);
    const green = parseInt(match[1].slice(2,4),16);
    const blue = parseInt(match[1].slice(4,6),16);
    const brightness = (red*299 + green*587 + blue*114)/1000;
    const saturation = Math.max(red,green,blue)-Math.min(red,green,blue);
    if (property.toLowerCase().includes('border') && brightness > 165) result[property] = '#30343e';
    else if (property === 'backgroundColor' && brightness > 230) result[property] = '#1c1f26';
    else if (property === 'backgroundColor' && brightness > 200 && saturation < 100) result[property] = '#242832';
    else if (property === 'color' && brightness < 165 && saturation < 75) result[property] = '#aeb8c9';
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
