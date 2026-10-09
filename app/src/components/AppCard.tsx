import React, {useState} from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {colors, radii, spacing, createAdaptiveStyles} from '../theme';
import {useAppTheme} from '../context/ThemeContext';

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
  const {isDark} = useAppTheme();
  const [focused, setFocused] = useState(false);
  const variantStyle = isDark ? DARK_VARIANT_STYLES[variant] : VARIANT_STYLES[variant];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        focusable
        style={({pressed}) => [
          styles.card,
          variantStyle,
          style,
          focused && styles.focused,
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

const DARK_VARIANT_STYLES: Record<'default' | 'muted' | 'inverse' | 'accent', ViewStyle> = {
  default: {backgroundColor: '#1c1f26', borderColor: '#30343e'},
  muted: {backgroundColor: '#242832', borderColor: '#30343e'},
  inverse: {backgroundColor: '#111318', borderColor: '#282b32'},
  accent: {backgroundColor: '#153425', borderColor: '#245d40'},
};

const styles = createAdaptiveStyles(StyleSheet.create({
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
  focused: {borderWidth: 2, borderColor: colors.primary},
}));
