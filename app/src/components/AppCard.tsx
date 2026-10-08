import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {colors, radii, spacing} from '../theme';

interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'none';
  variant?: 'default' | 'muted' | 'inverse' | 'accent';
}

export function AppCard({
  children,
  style,
  onPress,
  accessibilityLabel,
  accessibilityRole = onPress ? 'button' : 'none',
  variant = 'default',
}: AppCardProps): React.JSX.Element {
  const variantStyle = VARIANT_STYLES[variant];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({pressed}) => [
          styles.card,
          variantStyle,
          style,
          pressed && styles.pressed,
        ]}>
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, variantStyle, style]}>
      {children}
    </View>
  );
}

const VARIANT_STYLES: Record<'default' | 'muted' | 'inverse' | 'accent', ViewStyle> = {
  default: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
  },
  muted: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.lineLight,
  },
  inverse: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkSurfaceBorder,
  },
  accent: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primaryBorder,
  },
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.85,
    transform: [{scale: 0.995}],
  },
});
