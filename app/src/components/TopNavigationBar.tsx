import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, Image, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {BottomTabBarProps, BottomTabHeaderProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {createAdaptiveStyles} from '../theme';
import {useAppTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import {useAdminSection} from '../navigation/AdminSectionContext';
import {WorkspaceDrawer, WorkspaceRoute} from './WorkspaceDrawer';
import {TabGlyph, TabGlyphName} from './TabGlyph';

const studentTabs: Array<{route: 'Dashboard' | 'Subjects' | 'StudyTools' | 'Progress'; title: string; icon: TabGlyphName}> = [
  {route: 'Dashboard', title: 'Dashboard', icon: 'Dashboard'},
  {route: 'Subjects', title: 'Subjects', icon: 'Subjects'},
  {route: 'StudyTools', title: 'Study tools', icon: 'StudyTools'},
  {route: 'Progress', title: 'Progress', icon: 'Progress'},
];

/** Shared safe-area-aware app header. The drawer and brand live at the true top of the screen. */
export function WorkspaceHeader({route, navigation}: BottomTabHeaderProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const {reduceMotion, isDark} = useAppTheme();
  const {user} = useAuth();
  const adminSection = useAdminSection();
  const activeRoute = route.name || (user?.role === 'admin' ? 'Admin' : 'Dashboard');
  const topInset = {paddingTop: insets.top, paddingLeft: Math.max(insets.left, 12), paddingRight: Math.max(insets.right, 12)};

  const handleNavigate = (destination: WorkspaceRoute) => navigation.navigate(destination as never);

  return (
    <View style={[styles.shell, topInset]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.brandRow}>
        <AnimatedMenuButton expanded={drawerOpen} isDark={isDark} reduceMotion={reduceMotion} onPress={() => setDrawerOpen(open => !open)} />
        <View style={styles.brand} accessible accessibilityLabel="The AcadeMIa">
          <Image source={require('../assets/academia-logo.png')} resizeMode="contain" style={styles.brandLogo} accessibilityLabel="The AcadeMIa logo" />
          <Text style={styles.brandName}>The Acade<Text style={styles.brandAccent}>MI</Text>a</Text>
        </View>
      </View>
      <WorkspaceDrawer
        visible={drawerOpen}
        activeRoute={activeRoute}
        activeAdminSection={adminSection?.section}
        onAdminSectionSelect={section => {
          adminSection?.setSection(section);
          setDrawerOpen(false);
          navigation.navigate('Admin' as never);
        }}
        onNavigate={handleNavigate}
        onClose={() => setDrawerOpen(false)}
      />
    </View>
  );
}

/** Primary student destinations stay in the bottom bar; admin sections belong in the drawer. */
export function WorkspaceBottomBar({state, navigation}: BottomTabBarProps): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const {reduceMotion} = useAppTheme();
  const {user} = useAuth();
  const [keyboardFocusedRoute, setKeyboardFocusedRoute] = useState('');
  if (user?.role === 'admin') return null;

  return (
    <View style={[styles.bottomShell, {paddingBottom: Math.max(insets.bottom, 6)}]}>
      <View style={[styles.tabs, width < 340 && styles.tabsCompact]}>
        {studentTabs.map(item => {
          const focused = state.routes[state.index]?.name === item.route;
          const tabRoute = state.routes.find(candidate => candidate.name === item.route);
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
                if (!tabRoute) return;
                const event = navigation.emit({type: 'tabPress', target: tabRoute.key, canPreventDefault: true});
                if (!focused && !event.defaultPrevented) navigation.navigate(item.route);
              }}
              onLongPress={() => tabRoute && navigation.emit({type: 'tabLongPress', target: tabRoute.key})}
              style={({pressed}) => [styles.tab, focused && styles.tabFocused, keyboardFocusedRoute === item.route && styles.tabKeyboardFocus, pressed && styles.tabPressed]}>
              <TabGlyph name={item.icon} color={focused ? '#ffffff' : '#aeb8c9'} focused={focused} showActiveDot={false} reduceMotion={reduceMotion} />
              <Text numberOfLines={1} style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{item.title}</Text>
              {focused && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function AnimatedMenuButton({expanded, isDark, reduceMotion, onPress}: {expanded: boolean; isDark: boolean; reduceMotion: boolean; onPress: () => void}): React.JSX.Element {
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const [keyboardFocused, setKeyboardFocused] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(expanded ? 1 : 0);
      return;
    }
    Animated.timing(progress, {toValue: expanded ? 1 : 0, duration: 190, easing: Easing.inOut(Easing.quad), useNativeDriver: true}).start();
  }, [expanded, progress, reduceMotion]);

  const topStyle = {transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [0, 6]})}, {rotate: progress.interpolate({inputRange: [0, 1], outputRange: ['0deg', '45deg']})}]};
  const middleStyle = {opacity: progress.interpolate({inputRange: [0, 0.45, 1], outputRange: [1, 0.3, 0]}), transform: [{translateX: progress.interpolate({inputRange: [0, 1], outputRange: [0, -8]})}]};
  const bottomStyle = {transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [0, -6]})}, {rotate: progress.interpolate({inputRange: [0, 1], outputRange: ['0deg', '-45deg']})}]};

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={expanded ? 'Close navigation menu' : 'Open navigation menu'}
      accessibilityState={{expanded}}
      onFocus={() => setKeyboardFocused(true)}
      onBlur={() => setKeyboardFocused(false)}
      focusable
      hitSlop={4}
      onPress={onPress}
      style={({pressed}) => [styles.menuButton, isDark && styles.menuButtonDark, keyboardFocused && styles.menuButtonFocus, pressed && styles.menuButtonPressed]}>
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
  brandRow: {minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 12, paddingHorizontal: 3},
  brand: {flexDirection: 'row', alignItems: 'center', gap: 9},
  brandLogo: {width: 40, height: 36, borderRadius: 6},
  brandName: {color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: -0.25},
  brandAccent: {color: '#a8e2c3'},
  menuButton: {width: 46, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343841', borderRadius: 13, backgroundColor: '#1c1f26'},
  menuButtonDark: {width: 48, height: 46, borderWidth: 2, borderColor: '#62d49b', backgroundColor: '#242832'},
  menuButtonFocus: {borderWidth: 2, borderColor: '#a8e2c3'},
  menuButtonPressed: {opacity: 0.76, transform: [{scale: 0.96}]},
  menuIcon: {width: 20, height: 16, justifyContent: 'space-between'},
  menuLine: {width: 20, height: 2, borderRadius: 2, backgroundColor: '#f2f4f7'},
  bottomShell: {backgroundColor: '#111318', borderTopWidth: 1, borderTopColor: '#282b32'},
  tabs: {minHeight: 56, flexDirection: 'row', alignItems: 'stretch', gap: 4, paddingHorizontal: 8, paddingTop: 3},
  tabsCompact: {gap: 1, paddingHorizontal: 3},
  tab: {position: 'relative', flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 4, borderRadius: 10},
  tabFocused: {backgroundColor: '#1c1f26'},
  tabKeyboardFocus: {borderWidth: 2, borderColor: '#a8e2c3'},
  tabPressed: {opacity: 0.72},
  tabLabel: {maxWidth: '75%', color: '#aeb8c9', fontSize: 10, fontWeight: '700'},
  tabLabelFocused: {color: '#ffffff', fontWeight: '900'},
  activeIndicator: {position: 'absolute', bottom: 0, width: 21, height: 2, borderRadius: 2, backgroundColor: '#62d49b'},
}));
