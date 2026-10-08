import React from 'react';
import {Alert, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppMenuItem} from '../components/AppMenuItem';
import {useAuth} from '../context/AuthContext';
import {AppTabParamList} from '../navigation/types';

type MoreNavigation = BottomTabNavigationProp<AppTabParamList, 'More'>;
type MenuRoute = 'Dashboard' | 'Subjects' | 'StudyTools' | 'Progress' | 'Rankings' | 'Campus' | 'Profile';

const primaryItems: Array<{route: MenuRoute; icon: string; title: string; subtitle: string}> = [
  {route: 'Dashboard', icon: '⌂', title: 'Dashboard', subtitle: 'Your daily academic overview'},
  {route: 'Subjects', icon: '▤', title: 'Subjects', subtitle: 'Syllabus, notes, questions, and lectures'},
  {route: 'StudyTools', icon: '◷', title: 'Daily study tools', subtitle: 'Attendance, marks, and grade planning'},
];

const insightItems: Array<{route: MenuRoute; icon: string; title: string; subtitle: string}> = [
  {route: 'Progress', icon: '↗', title: 'Progress', subtitle: 'Syllabus readiness and career skills'},
  {route: 'Rankings', icon: '#', title: 'Rankings', subtitle: 'Your opted-in campus cohort'},
];

export function MoreScreen(): React.JSX.Element {
  const navigation = useNavigation<MoreNavigation>();
  const focused = useIsFocused();
  const {user, logout} = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Student';

  const goTo = (route: MenuRoute) => navigation.jumpTo(route);
  const closeMenu = () => navigation.jumpTo('Dashboard');
  const confirmSignOut = () => Alert.alert('Sign out?', 'You can sign in again at any time.', [
    {text: 'Cancel', style: 'cancel'},
    {text: 'Sign out', style: 'destructive', onPress: () => { logout().catch(() => undefined); }},
  ]);

  return (
    <Modal visible={focused} animationType="slide" presentationStyle="fullScreen" onRequestClose={closeMenu}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>A</Text></View>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Workspace menu</Text>
            <Text style={styles.headerSubtitle}>The AcadeMIa</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={closeMenu} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.welcome}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{firstName.slice(0, 1).toUpperCase()}</Text></View>
            <View style={styles.welcomeCopy}>
              <Text style={styles.welcomeEyebrow}>SIGNED IN AS</Text>
              <Text numberOfLines={1} style={styles.welcomeName}>{user?.name || 'Student'}</Text>
              <Text numberOfLines={1} style={styles.email}>{user?.email || ''}</Text>
            </View>
          </View>

          <MenuSection title="Your workspace">
            {primaryItems.map(item => <AppMenuItem key={item.route} {...item} onPress={() => goTo(item.route)} />)}
          </MenuSection>

          <MenuSection title="Learning insights">
            {insightItems.map(item => <AppMenuItem key={item.route} {...item} onPress={() => goTo(item.route)} />)}
          </MenuSection>

          {user?.track === 'UNIVERSITY' ? (
            <MenuSection title="Campus community">
              <AppMenuItem icon="✦" title="Campus desk" subtitle="Peer notes, contributions, and bounties" onPress={() => goTo('Campus')} />
            </MenuSection>
          ) : null}

          <MenuSection title="Account">
            <AppMenuItem icon="○" title="Profile and preferences" subtitle="Study track, university, and account details" onPress={() => goTo('Profile')} />
          </MenuSection>

          <Pressable accessibilityRole="button" onPress={confirmSignOut} style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
          <Text style={styles.footer}>Your learning space, wherever you study.</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function MenuSection({children, title}: React.PropsWithChildren<{title: string}>): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f7f8fc'},
  header: {flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 18, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#e7eaf1', backgroundColor: '#fff'},
  brandMark: {width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#315cf5'},
  brandMarkText: {color: '#fff', fontSize: 20, fontWeight: '900'},
  headerCopy: {flex: 1},
  headerTitle: {color: '#101828', fontSize: 15, fontWeight: '900'},
  headerSubtitle: {marginTop: 2, color: '#737b8c', fontSize: 10, fontWeight: '700'},
  closeButton: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#f1f3f8'},
  closeText: {marginTop: -2, color: '#4e586a', fontSize: 28, lineHeight: 31},
  content: {paddingHorizontal: 18, paddingTop: 17, paddingBottom: 28},
  welcome: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderWidth: 1, borderColor: '#e6eaf2', borderRadius: 17, backgroundColor: '#fff'},
  avatar: {width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#eef3ff'},
  avatarText: {color: '#315cf5', fontSize: 20, fontWeight: '900'},
  welcomeCopy: {flex: 1},
  welcomeEyebrow: {color: '#315cf5', fontSize: 8, fontWeight: '900', letterSpacing: 1},
  welcomeName: {marginTop: 3, color: '#101828', fontSize: 15, fontWeight: '900'},
  email: {marginTop: 2, color: '#737b8c', fontSize: 10},
  section: {marginTop: 20},
  sectionTitle: {marginBottom: 8, color: '#737b8c', fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase'},
  sectionCard: {overflow: 'hidden', borderWidth: 1, borderColor: '#e7eaf1', borderRadius: 16, backgroundColor: '#fff'},
  signOut: {alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: 20, borderWidth: 1, borderColor: '#f0d6d6', borderRadius: 13, backgroundColor: '#fff'},
  signOutText: {color: '#a12f36', fontSize: 13, fontWeight: '900'},
  footer: {marginTop: 16, color: '#929bad', fontSize: 10, textAlign: 'center'},
});
