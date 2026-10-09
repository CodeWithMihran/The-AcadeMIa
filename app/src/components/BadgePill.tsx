import React from 'react';
import {StyleSheet, Text, TextStyle, View, ViewStyle} from 'react-native';
import {colors, radii, typography, createAdaptiveStyles} from '../theme';
import {useAppTheme} from '../context/ThemeContext';

export type BadgeVariant = 'blue' | 'emerald' | 'amber' | 'danger' | 'indigo' | 'muted' | 'dark';

interface BadgePillProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function BadgePill({label, variant = 'blue', style}: BadgePillProps): React.JSX.Element {
  const {isDark} = useAppTheme();
  const variantStyles = VARIANT_MAP[variant] || VARIANT_MAP.blue;
  return (
    <View style={[styles.pill, variantStyles.container, isDark && DARK_VARIANT_OVERRIDES[variant]?.container, style]}>
      <Text numberOfLines={1} style={[styles.text, variantStyles.text, isDark && DARK_VARIANT_OVERRIDES[variant]?.text]}>
        {label}
      </Text>
    </View>
  );
}

const VARIANT_MAP: Record<BadgeVariant, {container: ViewStyle; text: {color: string}}> = {
  blue: {
    container: {backgroundColor: colors.primaryPill, borderColor: colors.primaryBorder},
    text: {color: colors.primary},
  },
  emerald: {
    container: {backgroundColor: colors.success.bg, borderColor: colors.success.border},
    text: {color: colors.success.text},
  },
  amber: {
    container: {backgroundColor: colors.warning.bg, borderColor: colors.warning.border},
    text: {color: colors.warning.text},
  },
  danger: {
    container: {backgroundColor: colors.danger.bg, borderColor: colors.danger.border},
    text: {color: colors.danger.text},
  },
  indigo: {
    container: {backgroundColor: colors.indigo.bg, borderColor: colors.indigo.border},
    text: {color: colors.indigo.text},
  },
  muted: {
    container: {backgroundColor: colors.surfaceMuted, borderColor: colors.line},
    text: {color: colors.textMuted},
  },
  dark: {
    container: {backgroundColor: colors.darkSurface, borderColor: colors.darkSurfaceBorder},
    text: {color: colors.textInverse},
  },
};

const DARK_VARIANT_OVERRIDES: Partial<Record<BadgeVariant, {container: ViewStyle; text: TextStyle}>> = {
  blue: {container: {backgroundColor: '#153425', borderColor: '#245d40'}, text: {color: '#62d49b'}},
  emerald: {container: {backgroundColor: '#10291e', borderColor: '#245d40'}, text: {color: '#6ee7a8'}},
  amber: {container: {backgroundColor: '#332715', borderColor: '#68501d'}, text: {color: '#ffca80'}},
  danger: {container: {backgroundColor: '#351d20', borderColor: '#623237'}, text: {color: '#ff9898'}},
  indigo: {container: {backgroundColor: '#153425', borderColor: '#245d40'}, text: {color: '#62d49b'}},
  muted: {container: {backgroundColor: '#242832', borderColor: '#30343e'}, text: {color: '#aeb8c9'}},
};

const styles = createAdaptiveStyles(StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...typography.pill,
  },
}));
