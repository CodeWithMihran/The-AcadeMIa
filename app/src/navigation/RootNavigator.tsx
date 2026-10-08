import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';
import {TabGlyph} from '../components/TabGlyph';
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
import {MoreScreen} from '../screens/MoreScreen';
import {AppTabParamList, AuthStackParamList, RootStackParamList} from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tabs = createBottomTabNavigator<AppTabParamList>();

type TabIconProps = {focused: boolean; color: string; size: number};
const DashboardTabIcon = ({color, focused}: TabIconProps) => <TabGlyph name="Dashboard" color={color} focused={focused} />;
const SubjectsTabIcon = ({color, focused}: TabIconProps) => <TabGlyph name="Subjects" color={color} focused={focused} />;
const StudyToolsTabIcon = ({color, focused}: TabIconProps) => <TabGlyph name="StudyTools" color={color} focused={focused} />;
const MenuTabIcon = ({color, focused}: TabIconProps) => <TabGlyph name="Menu" color={color} focused={focused} />;
const ProfileTabIcon = ({color, focused}: TabIconProps) => <TabGlyph name="Profile" color={color} focused={focused} />;

function AuthFlow(): React.JSX.Element {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
      <AuthStack.Screen name="SignIn" component={AuthScreen} />
      <AuthStack.Screen name="Register" component={AuthScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs(): React.JSX.Element {
  const {user} = useAuth();
  const insets = useSafeAreaInsets();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarPosition: 'top',
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#8a93a6',
        tabBarLabelStyle: {fontSize: 9, fontWeight: '800', letterSpacing: 0.2},
        tabBarStyle: {
          height: 64 + insets.top,
          paddingTop: insets.top ? 2 : 6,
          paddingBottom: 4,
          borderBottomColor: '#242730',
          borderTopWidth: 0,
          backgroundColor: '#111318',
        },
        tabBarItemStyle: {minWidth: 58, paddingHorizontal: 1},
      }}>
      <Tabs.Screen name="Dashboard" component={DashboardScreen} options={{tabBarIcon: DashboardTabIcon}} />
      <Tabs.Screen name="Subjects" component={SubjectCatalogScreen} options={{tabBarIcon: SubjectsTabIcon}} />
      <Tabs.Screen name="StudyTools" component={StudyToolsPage} options={{title: 'Study tools', tabBarIcon: StudyToolsTabIcon}} />
      <Tabs.Screen name="More" component={MoreScreen} options={{title: 'Menu', tabBarIcon: MenuTabIcon}} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{tabBarIcon: ProfileTabIcon}} />
      <Tabs.Screen name="Progress" component={ProgressScreen} options={{tabBarButton: () => null}} />
      <Tabs.Screen name="SubjectProgress" component={SubjectProgressScreen} options={{tabBarButton: () => null}} />
      <Tabs.Screen name="Rankings" component={RankingsScreen} options={{tabBarButton: () => null}} />
      {user?.track === 'UNIVERSITY' && <Tabs.Screen name="Campus" component={CommunityScreen} options={{title: 'Campus', tabBarButton: () => null}} />}
    </Tabs.Navigator>
  );
}

function SessionLoading(): React.JSX.Element {
  return (
    <View style={styles.loading} accessibilityRole="progressbar" accessibilityLabel="Restoring your session">
      <ActivityIndicator size="large" color="#315cf5" />
      <Text style={styles.loadingText}>Preparing your workspace…</Text>
    </View>
  );
}

export function RootNavigator(): React.JSX.Element {
  const {user, loading} = useAuth();
  if (loading) return <SessionLoading />;

  if (user && user.role === 'student' && user.onboardingCompleted === false) {
    return <OnboardingScreen />;
  }
  if (user?.role === 'admin') return <AdminConsoleScreen />;

  return (
    <RootStack.Navigator screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
      {user ? (
        <RootStack.Screen name="Main" component={MainTabs} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthFlow} />
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f8fc'},
  loadingText: {marginTop: 14, color: '#687187', fontSize: 14, fontWeight: '600'},
});

export type SignInScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;
