import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {colors, spacing, typography, createAdaptiveStyles} from '../theme';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeading({
  eyebrow,
  title,
  actionLabel,
  onAction,
  style,
}: SectionHeadingProps): React.JSX.Element {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.copy}>
        {Boolean(eyebrow) && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      {Boolean(actionLabel && onAction) && (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          hitSlop={8}
          style={({pressed}) => [styles.action, pressed && styles.actionPressed]}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = createAdaptiveStyles(StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 4,
    marginTop: spacing.md,
  },
  copy: {
    flex: 1,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.textFaint,
    fontSize: 9,
    letterSpacing: 1.1,
  },
  title: {
    ...typography.titleMd,
    marginTop: 2,
  },
  action: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs + 2,
  },
  actionPressed: {
    opacity: 0.75,
  },
  actionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
}));
