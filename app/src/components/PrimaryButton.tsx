import React, {useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import {colors, radii, spacing, createAdaptiveStyles} from '../theme';
import {useAppTheme} from '../context/ThemeContext';

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
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  labelStyle,
  accessibilityLabel,
}: PrimaryButtonProps): React.JSX.Element {
  const {isDark} = useAppTheme();
  const [focused, setFocused] = useState(false);
  const isInteractive = !loading && !disabled;
  const config = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{disabled: !isInteractive, busy: loading}}
      disabled={!isInteractive}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({pressed}) => [
        styles.button,
        config.button,
        isDark && variant === 'primary' && styles.darkPrimary,
        isDark && variant === 'outline' && styles.darkOutline,
        style,
        focused && styles.focused,
        pressed && isInteractive && styles.pressed,
        disabled && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textInverse}
        />
      ) : (
        <Text style={[styles.label, config.label, isDark && variant === 'outline' && styles.darkOutlineLabel, isDark && variant === 'ghost' && styles.darkGhostLabel, labelStyle]}>{label}</Text>
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

const styles = createAdaptiveStyles(StyleSheet.create({
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
  focused: {borderWidth: 2, borderColor: colors.primaryDark},
  darkPrimary: {backgroundColor: '#134f33', borderColor: '#134f33'},
  darkOutline: {backgroundColor: '#1c1f26', borderColor: '#424957'},
  darkOutlineLabel: {color: '#f2f4f7'},
  darkGhostLabel: {color: '#62d49b'},
}));
