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
        <TabGlyph name={icon} color={isDark ? '#60a5fa' : '#2563eb'} focused={false} />
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
  row: {flexDirection: 'row', alignItems: 'center', minHeight: 68, gap: 14, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#edf0f5', backgroundColor: '#fff'},
  pressed: {backgroundColor: '#f1f4f9'},
  activeRow: {backgroundColor: '#dbeafe'},
  focusedRow: {borderWidth: 2, borderColor: '#2563eb'},
  iconBox: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#eff6ff'},
  icon: {color: '#2563eb', fontSize: 18, fontWeight: '900'},
  copy: {flex: 1},
  title: {color: '#101828', fontSize: 15, fontWeight: '900'},
  activeTitle: {color: '#1d4ed8'},
  subtitle: {marginTop: 2, color: '#687187', fontSize: 11, lineHeight: 16},
  chevron: {color: '#929bad', fontSize: 22},
}));
