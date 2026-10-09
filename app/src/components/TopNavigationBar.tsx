import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {createAdaptiveStyles} from '../theme';
import {useAppTheme} from '../context/ThemeContext';
import {WorkspaceDrawer, WorkspaceRoute} from './WorkspaceDrawer';
import {TabGlyph, TabGlyphName} from './TabGlyph';

const primaryTabs: Array<{route: 'Dashboard' | 'Subjects' | 'StudyTools'; title: string; icon: TabGlyphName}> = [
  {route: 'Dashboard', title: 'Dashboard', icon: 'Dashboard'},
  {route: 'Subjects', title: 'Subjects', icon: 'Subjects'},
  {route: 'StudyTools', title: 'Study tools', icon: 'StudyTools'},
];

export function TopNavigationBar({state, navigation}: BottomTabBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [keyboardFocusedRoute, setKeyboardFocusedRoute] = useState('');
  const {reduceMotion} = useAppTheme();
  const activeRoute = state.routes[state.index]?.name || 'Dashboard';
  const activeIsPrimary = primaryTabs.some(item => item.route === activeRoute);
  const menuSelected = drawerOpen || !activeIsPrimary;

  const handleNavigate = (route: WorkspaceRoute) => navigation.navigate(route);
  const safeStyle = {paddingTop: insets.top, paddingLeft: Math.max(insets.left, 12), paddingRight: Math.max(insets.right, 12)};

  return (
    <View style={[styles.shell, safeStyle]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.brandRow}>
        <View style={styles.brand} accessible accessibilityLabel="The AcadeMIa">
          <View style={styles.brandMark}><Text style={styles.brandLetter}>A</Text></View>
          <Text style={styles.brandName}>The Acade<Text style={styles.brandAccent}>MI</Text>a</Text>
        </View>
        <AnimatedMenuButton expanded={drawerOpen} selected={menuSelected} reduceMotion={reduceMotion} onPress={() => setDrawerOpen(open => !open)} />
      </View>

      <View style={[styles.tabs, width < 340 && styles.tabsCompact]}>
        {primaryTabs.map(item => {
          const focused = activeRoute === item.route;
          const route = state.routes.find(candidate => candidate.name === item.route);
          return (
            <Pressable
              key={item.route}
              accessibilityRole="tab"
              accessibilityLabel={item.title}
              accessibilityState={{selected: focused}}
              accessibilityHint={`Opens ${item.title}`}
              focusable
              onFocus={() => setKeyboardFocusedRoute(item.route)}
              onBlur={() => setKeyboardFocusedRoute(current => current === item.route ? '' : current)}
              onPress={() => {
                if (!route) return;
                const event = navigation.emit({type: 'tabPress', target: route.key, canPreventDefault: true});
                if (!focused && !event.defaultPrevented) navigation.navigate(item.route);
              }}
              onLongPress={() => route && navigation.emit({type: 'tabLongPress', target: route.key})}
              style={({pressed}) => [styles.tab, focused && styles.tabFocused, keyboardFocusedRoute === item.route && styles.tabKeyboardFocus, pressed && styles.tabPressed]}>
              <TabGlyph name={item.icon} color={focused ? '#ffffff' : '#aeb8c9'} focused={focused} showActiveDot={false} reduceMotion={reduceMotion} />
              <Text numberOfLines={1} style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{item.title}</Text>
              {focused && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>

      <WorkspaceDrawer
        visible={drawerOpen}
        activeRoute={activeRoute}
        onNavigate={handleNavigate}
        onClose={() => setDrawerOpen(false)}
      />
    </View>
  );
}

function AnimatedMenuButton({expanded, selected, reduceMotion, onPress}: {expanded: boolean; selected: boolean; reduceMotion: boolean; onPress: () => void}): React.JSX.Element {
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const [keyboardFocused, setKeyboardFocused] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(expanded ? 1 : 0);
      return;
    }
    Animated.timing(progress, {toValue: expanded ? 1 : 0, duration: 190, easing: Easing.inOut(Easing.quad), useNativeDriver: true}).start();
  }, [expanded, progress, reduceMotion]);

  const topStyle = {transform: [
    {translateY: progress.interpolate({inputRange: [0, 1], outputRange: [0, 6]})},
    {rotate: progress.interpolate({inputRange: [0, 1], outputRange: ['0deg', '45deg']})},
  ]};
  const middleStyle = {opacity: progress.interpolate({inputRange: [0, 0.45, 1], outputRange: [1, 0.3, 0]}), transform: [{translateX: progress.interpolate({inputRange: [0, 1], outputRange: [0, -8]})}]};
  const bottomStyle = {transform: [
    {translateY: progress.interpolate({inputRange: [0, 1], outputRange: [0, -6]})},
    {rotate: progress.interpolate({inputRange: [0, 1], outputRange: ['0deg', '-45deg']})},
  ]};

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={expanded ? 'Close navigation menu' : 'Open navigation menu'}
      accessibilityState={{expanded, selected}}
      onFocus={() => setKeyboardFocused(true)}
      onBlur={() => setKeyboardFocused(false)}
      focusable
      hitSlop={4}
      onPress={onPress}
      style={({pressed}) => [styles.menuButton, selected && styles.menuButtonSelected, keyboardFocused && styles.menuButtonFocus, pressed && styles.menuButtonPressed]}>
      <View style={styles.menuIcon}>
        <Animated.View style={[styles.menuLine, topStyle]} />
        <Animated.View style={[styles.menuLine, middleStyle]} />
        <Animated.View style={[styles.menuLine, bottomStyle]} />
      </View>
    </Pressable>
  );
}

const styles = createAdaptiveStyles(StyleSheet.create({
  shell: {zIndex: 20, backgroundColor: '#111318', borderBottomWidth: 1, borderBottomColor: '#282b32', shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: {width: 0, height: 4}, elevation: 8},
  brandRow: {minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3},
  brand: {flexDirection: 'row', alignItems: 'center', gap: 9},
  brandMark: {width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#16794b'},
  brandLetter: {color: '#ffffff', fontSize: 19, fontWeight: '900', fontStyle: 'italic'},
  brandName: {color: '#ffffff', fontSize: 15, fontWeight: '900', letterSpacing: -0.25},
  brandAccent: {color: '#a8e2c3'},
  menuButton: {width: 46, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343841', borderRadius: 13, backgroundColor: '#1c1f26'},
  menuButtonSelected: {borderColor: '#16794b', backgroundColor: '#183a29'},
  menuButtonFocus: {borderWidth: 2, borderColor: '#a8e2c3'},
  menuButtonPressed: {opacity: 0.76, transform: [{scale: 0.96}]},
  menuIcon: {width: 20, height: 16, justifyContent: 'space-between'},
  menuLine: {width: 20, height: 2, borderRadius: 2, backgroundColor: '#f2f4f7'},
  tabs: {height: 48, flexDirection: 'row', alignItems: 'stretch', gap: 4, paddingTop: 2},
  tabsCompact: {gap: 1},
  tab: {position: 'relative', flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 5, borderRadius: 10},
  tabFocused: {backgroundColor: '#1c1f26'},
  tabKeyboardFocus: {borderWidth: 2, borderColor: '#a8e2c3'},
  tabPressed: {opacity: 0.72},
  tabLabel: {maxWidth: '75%', color: '#aeb8c9', fontSize: 10, fontWeight: '700'},
  tabLabelFocused: {color: '#ffffff', fontWeight: '900'},
  activeIndicator: {position: 'absolute', bottom: 0, width: 21, height: 2, borderRadius: 2, backgroundColor: '#62d49b'},
}));
