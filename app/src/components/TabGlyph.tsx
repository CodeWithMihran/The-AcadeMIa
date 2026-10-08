import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';

export type TabGlyphName = 'Dashboard' | 'Subjects' | 'StudyTools' | 'Menu' | 'Profile';

interface Props {
  name: TabGlyphName;
  color: string;
  focused: boolean;
}

export function TabGlyph({name, color, focused}: Props): React.JSX.Element {
  const scale = useRef(new Animated.Value(1)).current;
  const line = {backgroundColor: color};

  useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.timing(scale, {toValue: 0.82, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true}),
        Animated.spring(scale, {toValue: 1.16, speed: 24, bounciness: 7, useNativeDriver: true}),
        Animated.spring(scale, {toValue: 1, speed: 20, bounciness: 5, useNativeDriver: true}),
      ]).start();
    } else {
      Animated.timing(scale, {toValue: 1, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true}).start();
    }
    return () => scale.stopAnimation();
  }, [focused, scale]);

  return (
    <Animated.View style={[styles.frame, {transform: [{scale}]}]} accessible={false}>
      {name === 'Dashboard' ? (
        <View style={styles.grid}>{[0, 1, 2, 3].map(cell => <View key={cell} style={[styles.gridCell, line]} />)}</View>
      ) : name === 'Subjects' ? (
        <View style={styles.book}>
          <View style={[styles.pageLeft, {borderColor: color}]} />
          <View style={[styles.pageRight, {borderColor: color}]} />
          <View style={[styles.bookSeam, line]} />
        </View>
      ) : name === 'StudyTools' ? (
        <View style={[styles.clock, {borderColor: color}]}>
          <View style={[styles.clockHandVertical, line]} />
          <View style={[styles.clockHandHorizontal, line]} />
        </View>
      ) : name === 'Menu' ? (
        <View style={styles.menuBars}>{[0, 1, 2].map(bar => <View key={bar} style={[styles.menuBar, line]} />)}</View>
      ) : (
        <View style={styles.profileIcon}>
          <View style={[styles.profileHead, {borderColor: color}]} />
          <View style={[styles.profileShoulders, {borderColor: color}]} />
        </View>
      )}
      {focused && <View style={[styles.activeDot, line]} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: {width: 25, height: 26, alignItems: 'center', justifyContent: 'center'},
  activeDot: {position: 'absolute', bottom: -1, width: 3.5, height: 3.5, borderRadius: 2},
  grid: {width: 18, height: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 3},
  gridCell: {width: 7.5, height: 7.5, borderRadius: 2},
  book: {width: 20, height: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 1},
  pageLeft: {width: 8, height: 15, borderWidth: 1.8, borderTopLeftRadius: 3, borderBottomLeftRadius: 3},
  pageRight: {width: 8, height: 15, borderWidth: 1.8, borderTopRightRadius: 3, borderBottomRightRadius: 3},
  bookSeam: {position: 'absolute', width: 1.5, height: 13},
  clock: {width: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.8, borderRadius: 9},
  clockHandVertical: {position: 'absolute', top: 4, width: 1.5, height: 5, borderRadius: 2},
  clockHandHorizontal: {position: 'absolute', top: 8, left: 8, width: 5, height: 1.5, borderRadius: 2},
  menuBars: {gap: 4},
  menuBar: {width: 18, height: 2, borderRadius: 2},
  profileIcon: {alignItems: 'center', justifyContent: 'center', gap: 2},
  profileHead: {width: 7, height: 7, borderWidth: 1.8, borderRadius: 4},
  profileShoulders: {width: 16, height: 8, borderWidth: 1.8, borderBottomWidth: 0, borderTopLeftRadius: 9, borderTopRightRadius: 9},
});
