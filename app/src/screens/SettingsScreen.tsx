import {useAppTheme} from '../context/ThemeContext';
import {createAdaptiveStyles} from '../theme';
import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import {AppTabParamList} from '../navigation/types';
import {AppCard, AppHeader, PrimaryButton, SectionHeading} from '../components';

type SettingsNavigation = BottomTabNavigationProp<AppTabParamList, 'Settings'>;

export function SettingsScreen(): React.JSX.Element {
  const {isDark, preference, setThemePreference} = useAppTheme();
  const {user, logout} = useAuth();
  const navigation = useNavigation<SettingsNavigation>();
  const options: Array<{value: 'system' | 'light' | 'dark'; label: string; description: string}> = [
    {value: 'system', label: 'System', description: 'Follow your device setting'},
    {value: 'light', label: 'Light', description: 'White and green appearance'},
    {value: 'dark', label: 'Dark', description: 'Comfortable low-light appearance'},
  ];

  const confirmSignOut = () => Alert.alert('Sign out?', 'You can sign in again at any time.', [
    {text: 'Cancel', style: 'cancel'},
    {text: 'Sign out', style: 'destructive', onPress: () => { logout().catch(() => undefined); }},
  ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <AppHeader
        eyebrow="PREFERENCES"
        title="Settings"
        subtitle="Make The AcadeMIa feel right for your study routine."
      />

      <SectionHeading title="Appearance" />
      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>Theme</Text>
        <Text style={styles.muted}>Current appearance: {preference === 'system' ? `System · ${isDark ? 'dark' : 'light'}` : preference === 'dark' ? 'Dark' : 'Light'}</Text>
        <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Appearance theme">
          {options.map(option => {
            const selected = preference === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{selected}}
                onPress={() => setThemePreference(option.value)}
                style={({pressed}) => [styles.option, selected && styles.optionSelected, pressed && styles.optionPressed]}>
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>{option.label}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <SectionHeading title="Account" />
      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>{user?.name || 'Your account'}</Text>
        <Text style={styles.muted}>{user?.email || ''}</Text>
        <PrimaryButton label="Open profile and study setup" variant="outline" onPress={() => navigation.navigate('Profile')} style={styles.profileButton} />
      </AppCard>

      <SectionHeading title="About" />
      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>The AcadeMIa</Text>
        <Text style={styles.muted}>Your academic workspace for subjects, study tools, progress, and campus learning.</Text>
        <Text style={styles.version}>Mobile app · Settings and preferences</Text>
      </AppCard>

      <Pressable accessibilityRole="button" onPress={confirmSignOut} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = createAdaptiveStyles(StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f7f8fc'},
  content: {padding: 20, paddingBottom: 36},
  card: {marginTop: 5, padding: 16, borderWidth: 1, borderColor: '#e7eaf1', borderRadius: 16, backgroundColor: '#ffffff'},
  cardTitle: {color: '#101828', fontSize: 14, fontWeight: '900'},
  muted: {marginTop: 5, color: '#687187', fontSize: 12, lineHeight: 18},
  options: {gap: 8, marginTop: 14},
  option: {minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#dfe4ed', borderRadius: 12, backgroundColor: '#ffffff'},
  optionSelected: {borderColor: '#16794b', backgroundColor: '#f0fdf4'},
  optionPressed: {opacity: 0.78},
  optionCopy: {flex: 1},
  optionTitle: {color: '#101828', fontSize: 12, fontWeight: '900'},
  optionTitleSelected: {color: '#145c38'},
  optionDescription: {marginTop: 3, color: '#687187', fontSize: 10},
  radio: {width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#929bad', borderRadius: 10},
  radioSelected: {borderColor: '#16794b'},
  radioDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: '#16794b'},
  profileButton: {marginTop: 13},
  version: {marginTop: 10, color: '#929bad', fontSize: 10},
  signOut: {minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 20, borderWidth: 1, borderColor: '#fecdca', borderRadius: 12, backgroundColor: '#ffffff'},
  signOutText: {color: '#b42318', fontSize: 12, fontWeight: '900'},
}));
