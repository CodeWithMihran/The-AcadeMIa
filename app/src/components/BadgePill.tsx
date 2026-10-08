import React from 'react';
import {StyleSheet, Text, View, ViewStyle} from 'react-native';
import {colors, radii, typography} from '../theme';

export type BadgeVariant = 'blue' | 'emerald' | 'amber' | 'danger' | 'indigo' | 'muted' | 'dark';

interface BadgePillProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function BadgePill({label, variant = 'blue', style}: BadgePillProps): React.JSX.Element {
  const variantStyles = VARIANT_MAP[variant] || VARIANT_MAP.blue;
  return (
    <View style={[styles.pill, variantStyles.container, style]}>
      <Text numberOfLines={1} style={[styles.text, variantStyles.text]}>
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

const styles = StyleSheet.create({
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
});
