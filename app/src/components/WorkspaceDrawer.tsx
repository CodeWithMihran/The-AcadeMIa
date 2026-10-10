import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Alert, Animated, Easing, Image, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';
import {useAppTheme} from '../context/ThemeContext';
import {createAdaptiveStyles} from '../theme';
import {AppMenuItem} from './AppMenuItem';
import {TabGlyphName} from './TabGlyph';
import {AdminSection} from '../navigation/AdminSectionContext';

export type WorkspaceRoute = 'Dashboard' | 'Subjects' | 'StudyTools' | 'Progress' | 'Rankings' | 'Campus' | 'Profile' | 'Settings' | 'Admin';

type WorkspaceDrawerProps = {
  visible: boolean;
  activeRoute: string;
  activeAdminSection?: AdminSection;
  onAdminSectionSelect?: (section: AdminSection) => void;
  onNavigate: (route: WorkspaceRoute) => void;
  onClose: () => void;
};

const learningItems: Array<{route: WorkspaceRoute; icon: TabGlyphName; title: string; subtitle: string}> = [
  {route: 'Dashboard', icon: 'Dashboard', title: 'Dashboard', subtitle: 'Your daily academic overview'},
  {route: 'Subjects', icon: 'Subjects', title: 'Subjects', subtitle: 'Syllabus, notes, questions, and lectures'},
  {route: 'StudyTools', icon: 'StudyTools', title: 'Study tools', subtitle: 'Attendance, marks, and grade planning'},
  {route: 'Progress', icon: 'Progress', title: 'Progress', subtitle: 'Syllabus readiness and career skills'},
];

const insightItems: Array<{route: WorkspaceRoute; icon: TabGlyphName; title: string; subtitle: string}> = [
  {route: 'Rankings', icon: 'Rankings', title: 'Rankings', subtitle: 'Your opted-in campus cohort'},
];

export function WorkspaceDrawer({visible, activeRoute, activeAdminSection, onAdminSectionSelect, onNavigate, onClose}: WorkspaceDrawerProps): React.JSX.Element | null {
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {isDark, reduceMotion} = useAppTheme();
  const {user, logout} = useAuth();
  const drawerWidth = Math.min(width * 0.88, 360);
  const translateX = useRef(new Animated.Value(-drawerWidth)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const mounted = useRef(false);
  const [renderModal, setRenderModal] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      translateX.stopAnimation();
      backdropOpacity.stopAnimation();
      if (visible) {
        mounted.current = true;
        setRenderModal(true);
        translateX.setValue(0);
        backdropOpacity.setValue(1);
      } else {
        mounted.current = false;
        setRenderModal(false);
        translateX.setValue(-drawerWidth);
        backdropOpacity.setValue(0);
      }
      return;
    }
    if (visible) {
      translateX.stopAnimation();
      backdropOpacity.stopAnimation();
      mounted.current = true;
      setRenderModal(true);
      translateX.setValue(-drawerWidth);
      backdropOpacity.setValue(0);
      requestAnimationFrame(() => Animated.parallel([
        Animated.timing(translateX, {toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
        Animated.timing(backdropOpacity, {toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true}),
      ]).start());
    } else if (mounted.current) {
      translateX.stopAnimation();
      backdropOpacity.stopAnimation();
      Animated.parallel([
        Animated.timing(translateX, {toValue: -drawerWidth, duration: 190, easing: Easing.in(Easing.cubic), useNativeDriver: true}),
        Animated.timing(backdropOpacity, {toValue: 0, duration: 170, easing: Easing.in(Easing.quad), useNativeDriver: true}),
      ]).start(({finished}) => {
        if (finished) {
          mounted.current = false;
          setRenderModal(false);
        }
      });
    }
  }, [visible, drawerWidth, translateX, backdropOpacity, reduceMotion]);

  const drawerStyle = useMemo(() => ({width: drawerWidth, transform: [{translateX}]}), [drawerWidth, translateX]);
  const safePanelStyle = useMemo(() => ({paddingTop: insets.top, paddingBottom: insets.bottom}), [insets.bottom, insets.top]);

  const navigate = (route: WorkspaceRoute) => {
    onClose();
    onNavigate(route);
  };

  const confirmSignOut = () => Alert.alert('Sign out?', 'You can sign in again at any time.', [
    {text: 'Cancel', style: 'cancel'},
    {text: 'Sign out', style: 'destructive', onPress: () => { onClose(); logout().catch(() => undefined); }},
  ]);

  if (!renderModal) return null;

  const isAdmin = user?.role === 'admin';
  const firstName = user?.name?.trim().split(/\s+/)[0] || (isAdmin ? 'Admin' : 'Student');
  return (
    <Modal transparent visible={renderModal} animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.modalRoot} accessibilityViewIsModal onAccessibilityEscape={onClose}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.backdrop, {opacity: backdropOpacity}]} />
        <Pressable accessibilityRole="button" accessibilityLabel="Close navigation menu" style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.drawer, drawerStyle]}>
          <SafeAreaView style={[styles.safePanel, safePanelStyle]} edges={['left', 'right']}>
            <View style={styles.header}>
              <Image source={require('../assets/academia-logo.png')} resizeMode="contain" style={styles.brandLogo} accessibilityLabel="The AcadeMIa logo" />
              <View style={styles.headerCopy}>
                <Text style={styles.headerTitle}>The AcadeMIa</Text>
                <Text style={styles.headerSubtitle}>{isAdmin ? 'ADMIN WORKSPACE' : 'YOUR ACADEMIC WORKSPACE'}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close navigation menu" hitSlop={8} onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <View style={styles.welcome}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{firstName.slice(0, 1).toUpperCase()}</Text></View>
                <View style={styles.welcomeCopy}>
                  <Text style={styles.welcomeEyebrow}>SIGNED IN AS</Text>
                  <Text numberOfLines={1} style={styles.welcomeName}>{user?.name || 'Student'}</Text>
                  <Text numberOfLines={1} style={styles.email}>{user?.email || ''}</Text>
                </View>
              </View>

              {isAdmin ? <MenuSection title="Admin console">
                {([
                  ['Overview', 'Admin', 'Platform summary and review queue'],
                  ['Users', 'Profile', 'Student accounts and access'],
                  ['Subjects', 'Subjects', 'Syllabus and learning resources'],
                  ['Review', 'Campus', 'Review contributed campus notes'],
                  ['Reports', 'Settings', 'Triage broken resource links'],
                  ['Campus', 'Campus', 'Ambassadors and campus controls'],
                ] as Array<[AdminSection, TabGlyphName, string]>).map(([section, icon, subtitle]) => (
                  <AppMenuItem
                    key={section}
                    icon={icon}
                    title={section}
                    subtitle={subtitle}
                    active={activeRoute === 'Admin' && activeAdminSection === section}
                    onPress={() => { onClose(); onAdminSectionSelect?.(section); }}
                  />
                ))}
              </MenuSection> : <MenuSection title="Learning">
                {learningItems.map(item => <AppMenuItem key={item.route} {...item} active={activeRoute === item.route} onPress={() => navigate(item.route)} />)}
              </MenuSection>}
              {!isAdmin ? <MenuSection title="Insights">
                {insightItems.map(item => <AppMenuItem key={item.route} {...item} active={activeRoute === item.route} onPress={() => navigate(item.route)} />)}
              </MenuSection> : null}
              {!isAdmin && user?.track === 'UNIVERSITY' ? <MenuSection title="Campus community">
                <AppMenuItem icon="Campus" title="Campus desk" subtitle="Peer notes, contributions, and bounties" active={activeRoute === 'Campus'} onPress={() => navigate('Campus')} />
              </MenuSection> : null}
              <MenuSection title="Account">
                {!isAdmin ? <AppMenuItem icon="Profile" title="Profile" subtitle="Study track, university, and account details" active={activeRoute === 'Profile'} onPress={() => navigate('Profile')} /> : null}
                <AppMenuItem icon="Settings" title="Settings" subtitle="Appearance and app preferences" active={activeRoute === 'Settings'} onPress={() => navigate('Settings')} />
              </MenuSection>
              <Pressable accessibilityRole="button" onPress={confirmSignOut} style={styles.signOut}>
                <Text style={styles.signOutText}>Sign out</Text>
              </Pressable>
              <Text style={styles.footer}>Your learning space, wherever you study.</Text>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function MenuSection({children, title}: React.PropsWithChildren<{title: string}>): React.JSX.Element {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.sectionCard}>{children}</View></View>;
}

const styles = createAdaptiveStyles(StyleSheet.create({
  modalRoot: {flex: 1, flexDirection: 'row'},
  backdrop: {backgroundColor: '#080a0d'},
  drawer: {height: '100%', backgroundColor: '#ffffff', elevation: 24, shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 22, shadowOffset: {width: 8, height: 0}},
  safePanel: {flex: 1, backgroundColor: '#ffffff'},
  header: {flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 17, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e7eaf1'},
  brandLogo: {width: 42, height: 38, borderRadius: 6},
  headerCopy: {flex: 1},
  headerTitle: {color: '#101828', fontSize: 15, fontWeight: '900'},
  headerSubtitle: {marginTop: 3, color: '#737b8c', fontSize: 8, fontWeight: '800', letterSpacing: 1},
  closeButton: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#f2f4f8'},
  closeText: {marginTop: -2, color: '#4e586a', fontSize: 28, lineHeight: 31},
  content: {paddingHorizontal: 16, paddingTop: 14, paddingBottom: 25},
  welcome: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, borderColor: '#e6eaf2', borderRadius: 16, backgroundColor: '#ffffff'},
  avatar: {width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#ecfdf3'},
  avatarText: {color: '#16794b', fontSize: 20, fontWeight: '900'},
  welcomeCopy: {flex: 1},
  welcomeEyebrow: {color: '#16794b', fontSize: 8, fontWeight: '900', letterSpacing: 1},
  welcomeName: {marginTop: 3, color: '#101828', fontSize: 14, fontWeight: '900'},
  email: {marginTop: 2, color: '#737b8c', fontSize: 10},
  section: {marginTop: 17},
  sectionTitle: {marginBottom: 7, color: '#737b8c', fontSize: 9, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase'},
  sectionCard: {overflow: 'hidden', borderWidth: 1, borderColor: '#e7eaf1', borderRadius: 15, backgroundColor: '#ffffff'},
  signOut: {alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: 18, borderWidth: 1, borderColor: '#f0d6d6', borderRadius: 13, backgroundColor: '#ffffff'},
  signOutText: {color: '#a12f36', fontSize: 13, fontWeight: '900'},
  footer: {marginTop: 15, color: '#929bad', fontSize: 10, textAlign: 'center'},
}));
