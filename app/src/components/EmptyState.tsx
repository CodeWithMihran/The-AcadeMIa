import React from 'react';
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';
import {colors, radii, spacing, typography, createAdaptiveStyles} from '../theme';
import {PrimaryButton} from './PrimaryButton';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon = '📚',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps): React.JSX.Element {
  return (
    <View style={[styles.card, style]}>
      {Boolean(icon) && (
        <View style={styles.iconCircle} accessible={false}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {Boolean(actionLabel && onAction) && (
        <PrimaryButton
          label={actionLabel!}
          onPress={onAction!}
          variant="dark"
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = createAdaptiveStyles(StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    textAlign: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    ...typography.titleSm,
    textAlign: 'center',
  },
  description: {
    ...typography.bodySm,
    marginTop: spacing.xxs,
    textAlign: 'center',
    color: colors.textMuted,
    lineHeight: 19,
  },
  action: {
    marginTop: spacing.md,
    alignSelf: 'center',
  },
}));
