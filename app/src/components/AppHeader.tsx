import React from 'react';
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';
import {colors, spacing, typography} from '../theme';

interface AppHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AppHeader({
  eyebrow,
  title,
  subtitle,
  rightElement,
  style,
}: AppHeaderProps): React.JSX.Element {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.content}>
        {Boolean(eyebrow) && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.title}>{title}</Text>
        {Boolean(subtitle) && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {Boolean(rightElement) && <View style={styles.right}>{rightElement}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: spacing.xxs,
  },
  title: {
    ...typography.titleLg,
  },
  subtitle: {
    ...typography.bodySm,
    marginTop: spacing.xxs + 2,
    color: colors.textMuted,
  },
  right: {
    marginLeft: spacing.md,
    alignSelf: 'center',
  },
});
