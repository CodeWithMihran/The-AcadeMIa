import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import {colors, radii, spacing} from '../theme';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search…',
  style,
  accessibilityLabel = 'Search',
}: SearchInputProps): React.JSX.Element {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.searchIcon} aria-hidden>
        🔍
      </Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {Boolean(value.length > 0) && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search text"
          onPress={() => onChangeText('')}
          hitSlop={8}
          style={styles.clearButton}>
          <Text style={styles.clearIcon}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lineSubtle,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  clearIcon: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
});
