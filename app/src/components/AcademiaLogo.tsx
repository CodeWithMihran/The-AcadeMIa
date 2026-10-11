import React from 'react';
import {Image, StyleSheet, View, ViewStyle} from 'react-native';

type AcademiaLogoProps = {
  height?: number;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

/** Displays the supplied logo artwork without squeezing or clipping its book edges. */
export function AcademiaLogo({
  height = 40,
  accessibilityLabel = 'The AcadeMIa logo',
  style,
}: AcademiaLogoProps): React.JSX.Element {
  const width = height * (1047 / 921);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[styles.frame, {width, height}, style]}>
      <Image
        source={require('../assets/academia-logo.png')}
        resizeMode="contain"
        style={styles.image}
        accessible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 9,
    backgroundColor: '#ffffff',
  },
  image: {width: '100%', height: '100%'},
});
