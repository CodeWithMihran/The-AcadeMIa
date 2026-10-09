import {createAdaptiveStyles} from '../theme';
import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useAppTheme} from '../context/ThemeContext';
import {TabGlyph, TabGlyphName} from './TabGlyph';

interface Props {
  icon: TabGlyphName;
  title: string;
  subtitle: string;
  onPress: () => void;
  active?: boolean;
}

export function AppMenuItem({icon, title, subtitle, onPress, active = false}: Props): React.JSX.Element {
  const {isDark} = useAppTheme();
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      accessibilityState={{selected: active}}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      focusable
      style={({pressed}) => [styles.row, active && styles.activeRow, focused && styles.focusedRow, pressed && styles.pressed]}>
      <View style={styles.iconBox} accessible={false}>
        <TabGlyph name={icon} color={isDark ? '#62d49b' : '#16794b'} focused={false} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, active && styles.activeTitle]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron} accessibilityElementsHidden>›</Text>
    </Pressable>
  );
}

const styles = createAdaptiveStyles(StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', minHeight: 70, gap: 13, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#edf0f5', backgroundColor: '#fff'},
  pressed: {backgroundColor: '#f5f7fc'},
  activeRow: {backgroundColor: '#f0fdf4'},
  focusedRow: {borderWidth: 2, borderColor: '#16794b'},
  iconBox: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#ecfdf3'},
  icon: {color: '#16794b', fontSize: 18, fontWeight: '900'},
  copy: {flex: 1},
  title: {color: '#101828', fontSize: 14, fontWeight: '900'},
  activeTitle: {color: '#145c38'},
  subtitle: {marginTop: 3, color: '#737b8c', fontSize: 11, lineHeight: 16},
  chevron: {color: '#929bad', fontSize: 23},
}));
