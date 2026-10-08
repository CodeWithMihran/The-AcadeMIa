import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {colors, radii, spacing, typography} from '../theme';

interface LoadingStateProps {
  message?: string;
  style?: StyleProp<ViewStyle>;
  minHeight?: number;
}

export function LoadingState({
  message = 'Loading…',
  style,
  minHeight = 160,
}: LoadingStateProps): React.JSX.Element {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      style={[styles.card, {minHeight}, style]}>
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    ...typography.bodySm,
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
