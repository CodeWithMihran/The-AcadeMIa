import React from 'react';
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';
import {colors, radii, spacing, typography, createAdaptiveStyles} from '../theme';
import {PrimaryButton} from './PrimaryButton';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  style,
}: ErrorStateProps): React.JSX.Element {
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {Boolean(onRetry) && (
        <PrimaryButton
          label="Try again"
          onPress={onRetry!}
          variant="outline"
          style={styles.retryButton}
        />
      )}
    </View>
  );
}

const styles = createAdaptiveStyles(StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.danger.border,
    backgroundColor: colors.danger.bg,
  },
  title: {
    ...typography.titleSm,
    color: colors.danger.text,
  },
  message: {
    ...typography.bodySm,
    marginTop: spacing.xxs,
    color: colors.danger.text,
    lineHeight: 18,
  },
  retryButton: {
    marginTop: spacing.md,
    borderColor: colors.danger.border,
  },
}));
