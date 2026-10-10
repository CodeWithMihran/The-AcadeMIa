import {createAdaptiveStyles} from '../theme';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {BottomTabBarProps, BottomTabHeaderProps, createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAuth} from '../context/AuthContext';
import {useAppTheme} from '../context/ThemeContext';
import {WorkspaceBottomBar, WorkspaceHeader} from '../components/TopNavigationBar';
import {AuthScreen} from '../screens/AuthScreen';
import {OnboardingScreen} from '../screens/OnboardingScreen';
import {DashboardScreen} from '../screens/DashboardScreen';
import {SubjectCatalogScreen} from '../screens/SubjectCatalogScreen';
import {StudyToolsScreen as StudyToolsPage} from '../screens/StudyToolsScreen';
import {ProgressScreen} from '../screens/ProgressScreen';
import {SubjectProgressScreen} from '../screens/SubjectProgressScreen';
import {RankingsScreen} from '../screens/RankingsScreen';
import {ProfileScreen} from '../screens/ProfileScreen';
import {CommunityScreen} from '../screens/CommunityScreen';
import {AdminConsoleScreen} from '../screens/AdminConsoleScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {AppTabParamList, AuthStackParamList, RootStackParamList} from './types';
import {AdminSection, AdminSectionProvider} from './AdminSectionContext';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tabs = createBottomTabNavigator<AppTabParamList>();
const AdminTabs = createBottomTabNavigator<AppTabParamList>();
const renderWorkspaceHeader = (props: BottomTabHeaderProps) => <WorkspaceHeader {...props} />;
const renderWorkspaceBottomBar = (props: BottomTabBarProps) => <WorkspaceBottomBar {...props} />;

function AuthFlow(): React.JSX.Element {
  const {reduceMotion} = useAppTheme();
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false, animation: reduceMotion ? 'none' : 'slide_from_right'}}>
      <AuthStack.Screen name="SignIn" component={AuthScreen} />
      <AuthStack.Screen name="Register" component={AuthScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs(): React.JSX.Element {
  const {user} = useAuth();
  const {reduceMotion} = useAppTheme();
  return (
    <Tabs.Navigator
      tabBar={renderWorkspaceBottomBar}
      screenOptions={{
        header: renderWorkspaceHeader,
        headerShown: true,
        animation: reduceMotion ? 'none' : 'fade',
      }}>
      <Tabs.Screen name="Dashboard" component={DashboardScreen} options={{title: 'Dashboard'}} />
      <Tabs.Screen name="Subjects" component={SubjectCatalogScreen} options={{title: 'Subjects'}} />
      <Tabs.Screen name="StudyTools" component={StudyToolsPage} options={{title: 'Study tools'}} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{tabBarButton: () => null}} />
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{tabBarButton: () => null}} />
      <Tabs.Screen name="Progress" component={ProgressScreen} options={{title: 'Progress'}} />
      <Tabs.Screen name="SubjectProgress" component={SubjectProgressScreen} options={{tabBarButton: () => null}} />
      <Tabs.Screen name="Rankings" component={RankingsScreen} options={{tabBarButton: () => null}} />
      {user?.track === 'UNIVERSITY' && <Tabs.Screen name="Campus" component={CommunityScreen} options={{title: 'Campus', tabBarButton: () => null}} />}
    </Tabs.Navigator>
  );
}

function AdminWorkspace(): React.JSX.Element {
  const {reduceMotion} = useAppTheme();
  const [section, setSection] = React.useState<AdminSection>('Overview');
  return (
    <AdminSectionProvider value={{section, setSection}}>
      <AdminTabs.Navigator tabBar={() => null} screenOptions={{header: renderWorkspaceHeader, headerShown: true, animation: reduceMotion ? 'none' : 'fade'}}>
        <AdminTabs.Screen name="Admin" component={AdminConsoleScreen} options={{title: 'Admin console'}} />
        <AdminTabs.Screen name="Settings" component={SettingsScreen} options={{title: 'Settings'}} />
      </AdminTabs.Navigator>
    </AdminSectionProvider>
  );
}

function SessionLoading(): React.JSX.Element {
  return (
    <View style={styles.loading} accessibilityRole="progressbar" accessibilityLabel="Restoring your session">
      <ActivityIndicator size="large" color="#16794b" />
      <Text style={styles.loadingText}>Preparing your workspace…</Text>
    </View>
  );
}

export function RootNavigator(): React.JSX.Element {
  const {reduceMotion} = useAppTheme();
  const {user, loading} = useAuth();
  if (loading) return <SessionLoading />;

  if (user && user.role === 'student' && user.onboardingCompleted === false) {
    return <OnboardingScreen />;
  }
  if (user?.role === 'admin') return <AdminWorkspace />;

  return (
    <RootStack.Navigator screenOptions={{headerShown: false, animation: reduceMotion ? 'none' : 'slide_from_right'}}>
      {user ? (
        <RootStack.Screen name="Main" component={MainTabs} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthFlow} />
      )}
    </RootStack.Navigator>
  );
}

const styles = createAdaptiveStyles(StyleSheet.create({
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f8fc'},
  loadingText: {marginTop: 14, color: '#687187', fontSize: 14, fontWeight: '600'},
}));

export type SignInScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;
