import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

interface Props {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

export function AppMenuItem({icon, title, subtitle, onPress}: Props): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={({pressed}) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.iconBox} accessible={false}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron} accessibilityElementsHidden>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', minHeight: 70, gap: 13, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#edf0f5', backgroundColor: '#fff'},
  pressed: {backgroundColor: '#f5f7fc'},
  iconBox: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#eef3ff'},
  icon: {color: '#315cf5', fontSize: 18, fontWeight: '900'},
  copy: {flex: 1},
  title: {color: '#101828', fontSize: 14, fontWeight: '900'},
  subtitle: {marginTop: 3, color: '#737b8c', fontSize: 11, lineHeight: 16},
  chevron: {color: '#929bad', fontSize: 23},
});
