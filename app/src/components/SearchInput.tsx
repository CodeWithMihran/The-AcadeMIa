import React, {useState} from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import {colors, radii, spacing, createAdaptiveStyles} from '../theme';

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
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.container, focused && styles.focused, style]}>
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
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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

const styles = createAdaptiveStyles(StyleSheet.create({
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
  focused: {borderWidth: 2, borderColor: colors.primary},
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
}));
