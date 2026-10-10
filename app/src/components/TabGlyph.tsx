import {createAdaptiveStyles} from '../theme';
import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';

export type TabGlyphName = 'Dashboard' | 'Subjects' | 'StudyTools' | 'Progress' | 'Rankings' | 'Campus' | 'Settings' | 'Profile' | 'Admin';

interface Props {
  name: TabGlyphName;
  color: string;
  focused: boolean;
  showActiveDot?: boolean;
  reduceMotion?: boolean;
}

export function TabGlyph({name, color, focused, showActiveDot = true, reduceMotion = false}: Props): React.JSX.Element {
  const scale = useRef(new Animated.Value(1)).current;
  const line = {backgroundColor: color};

  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(1);
      return;
    }
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
  }, [focused, reduceMotion, scale]);

  return (
    <Animated.View style={[styles.frame, {transform: [{scale}]}]} accessible={false}>
      {name === 'Dashboard' ? (
        <View style={styles.home}>
          <View style={[styles.roofLeft, line]} /><View style={[styles.roofRight, line]} />
          <View style={[styles.homeBody, {borderColor: color}]} /><View style={[styles.homeDoor, line]} />
        </View>
      ) : name === 'Subjects' ? (
        <View style={styles.book}>
          <View style={[styles.pageLeft, {borderColor: color}]} />
          <View style={[styles.pageRight, {borderColor: color}]} />
          <View style={[styles.bookSeam, line]} />
        </View>
      ) : name === 'StudyTools' ? (
        <View style={[styles.calculator, {borderColor: color}]}>
          <View style={[styles.calcDisplay, {borderColor: color}]} />
          <View style={styles.calcGrid}>{[0, 1, 2, 3].map(cell => <View key={cell} style={[styles.calcCell, line]} />)}</View>
        </View>
      ) : name === 'Progress' ? (
        <View style={styles.chart}>{[8, 13, 17].map((height, index) => <View key={index} style={[styles.chartBar, {height, backgroundColor: color}]} />)}</View>
      ) : name === 'Rankings' ? (
        <View style={styles.medal}><View style={[styles.medalCore, {borderColor: color}]} /><View style={[styles.medalStem, line]} /></View>
      ) : name === 'Campus' ? (
        <View style={styles.community}><View style={[styles.personHead, {borderColor: color}]} /><View style={[styles.personHeadSmall, {borderColor: color}]} /><View style={[styles.personBody, {borderColor: color}]} /></View>
      ) : name === 'Settings' ? (
        <View style={[styles.settings, {borderColor: color}]}><View style={[styles.settingsCore, {borderColor: color}]} /></View>
      ) : name === 'Admin' ? (
        <View style={[styles.adminShield, {borderColor: color}]}><View style={[styles.adminCheckLeft, line]} /><View style={[styles.adminCheckRight, line]} /></View>
      ) : (
        <View style={styles.profileIcon}>
          <View style={[styles.profileHead, {borderColor: color}]} />
          <View style={[styles.profileShoulders, {borderColor: color}]} />
        </View>
      )}
      {focused && showActiveDot && <View style={[styles.activeDot, line]} />}
    </Animated.View>
  );
}

const styles = createAdaptiveStyles(StyleSheet.create({
  frame: {width: 25, height: 26, alignItems: 'center', justifyContent: 'center'},
  activeDot: {position: 'absolute', bottom: -1, width: 3.5, height: 3.5, borderRadius: 2},
  home: {width: 20, height: 20, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 2},
  roofLeft: {position: 'absolute', top: 5, left: 2, width: 11, height: 2, borderRadius: 2, transform: [{rotate: '-38deg'}]},
  roofRight: {position: 'absolute', top: 5, right: 2, width: 11, height: 2, borderRadius: 2, transform: [{rotate: '38deg'}]},
  homeBody: {width: 14, height: 11, borderWidth: 1.7, borderTopWidth: 0, borderBottomLeftRadius: 2, borderBottomRightRadius: 2},
  homeDoor: {position: 'absolute', bottom: 2, width: 2, height: 5},
  book: {width: 20, height: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 1},
  pageLeft: {width: 8, height: 15, borderWidth: 1.8, borderTopLeftRadius: 3, borderBottomLeftRadius: 3},
  pageRight: {width: 8, height: 15, borderWidth: 1.8, borderTopRightRadius: 3, borderBottomRightRadius: 3},
  bookSeam: {position: 'absolute', width: 1.5, height: 13},
  calculator: {width: 17, height: 20, padding: 2, borderWidth: 1.7, borderRadius: 3, gap: 3},
  calcDisplay: {height: 4, borderBottomWidth: 1},
  calcGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2},
  calcCell: {width: 3.5, height: 3.5, borderRadius: 1},
  chart: {height: 19, flexDirection: 'row', alignItems: 'flex-end', gap: 3},
  chartBar: {width: 4, borderRadius: 2},
  medal: {width: 19, height: 21, alignItems: 'center'},
  medalCore: {width: 13, height: 13, borderWidth: 1.7, borderRadius: 7},
  medalStem: {width: 2, height: 6, marginTop: 1},
  community: {width: 22, height: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center'},
  personHead: {position: 'absolute', top: 1, left: 3, width: 8, height: 8, borderWidth: 1.6, borderRadius: 5},
  personHeadSmall: {position: 'absolute', top: 3, right: 2, width: 6, height: 6, borderWidth: 1.4, borderRadius: 4},
  personBody: {position: 'absolute', bottom: 1, left: 1, width: 15, height: 8, borderWidth: 1.6, borderBottomWidth: 0, borderTopLeftRadius: 8, borderTopRightRadius: 8},
  settings: {width: 17, height: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1.6, borderRadius: 9},
  settingsCore: {width: 6, height: 6, borderWidth: 1.4, borderRadius: 4},
  adminShield: {width: 17, height: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1.7, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderBottomLeftRadius: 10, borderBottomRightRadius: 10},
  adminCheckLeft: {position: 'absolute', width: 4, height: 1.7, left: 3, top: 9, borderRadius: 2, transform: [{rotate: '45deg'}]},
  adminCheckRight: {position: 'absolute', width: 7, height: 1.7, left: 6, top: 8, borderRadius: 2, transform: [{rotate: '-48deg'}]},
  profileIcon: {alignItems: 'center', justifyContent: 'center', gap: 2},
  profileHead: {width: 7, height: 7, borderWidth: 1.8, borderRadius: 4},
  profileShoulders: {width: 16, height: 8, borderWidth: 1.8, borderBottomWidth: 0, borderTopLeftRadius: 9, borderTopRightRadius: 9},
}));
