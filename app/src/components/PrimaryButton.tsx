import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import {colors, radii, spacing} from '../theme';

export type ButtonVariant = 'dark' | 'primary' | 'outline' | 'ghost';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export function PrimaryButton({
  label,
  onPress,
  variant = 'dark',
  loading = false,
  disabled = false,
  style,
  labelStyle,
  accessibilityLabel,
}: PrimaryButtonProps): React.JSX.Element {
  const isInteractive = !loading && !disabled;
  const config = VARIANT_STYLES[variant] || VARIANT_STYLES.dark;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{disabled: !isInteractive, busy: loading}}
      disabled={!isInteractive}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        config.button,
        style,
        pressed && isInteractive && styles.pressed,
        disabled && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textInverse}
        />
      ) : (
        <Text style={[styles.label, config.label, labelStyle]}>{label}</Text>
      )}
    </Pressable>
  );
}

const VARIANT_STYLES: Record<
  ButtonVariant,
  {button: ViewStyle; label: TextStyle}
> = {
  dark: {
    button: {
      backgroundColor: colors.darkSurface,
      borderColor: colors.darkSurface,
    },
    label: {
      color: colors.textInverse,
    },
  },
  primary: {
    button: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    label: {
      color: colors.textInverse,
    },
  },
  outline: {
    button: {
      backgroundColor: colors.surface,
      borderColor: colors.lineStrong,
    },
    label: {
      color: colors.textPrimary,
    },
  },
  ghost: {
    button: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    label: {
      color: colors.primary,
    },
  },
};

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.84,
    transform: [{scale: 0.99}],
  },
  disabled: {
    opacity: 0.5,
  },
});
