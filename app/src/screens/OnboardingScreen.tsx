import {useAppTheme} from '../context/ThemeContext';
import {createAdaptiveStyles} from '../theme';
import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {getApiErrorMessage, subjectApi, tenantApi} from '../services/api';

type Track = 'UNIVERSITY' | 'JEE' | 'NEET';
interface College { _id?: string; name: string }
interface Tenant {
  _id: string;
  name: string;
  type: string;
  affiliatedColleges?: College[];
}

const CURRENT_YEAR = new Date().getFullYear();
const FALLBACK_BRANCHES = ['CSE', 'AIML', 'AIDS', 'IT', 'ECE', 'EEE', 'EE', 'ME', 'CE', 'CHE', 'BT'];

export function OnboardingScreen(): React.JSX.Element {
  useAppTheme();
  const {user, completeOnboarding, logout} = useAuth();
  const [track, setTrack] = useState<Track>('UNIVERSITY');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [campus, setCampus] = useState('');
  const [branch, setBranch] = useState('');
  const [branches, setBranches] = useState<string[]>([]);
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);
  const [targetExam, setTargetExam] = useState('JEE_MAINS');
  const [targetYear, setTargetYear] = useState(CURRENT_YEAR + 1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedTenant = tenants.find(item => item._id === tenantId);
  const colleges = selectedTenant?.affiliatedColleges || [];
  const semesterOptions = useMemo(() => [year * 2 - 1, year * 2], [year]);

  const loadTenants = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await tenantApi.getTenants();
      const data = response.data as {tenants?: Tenant[]};
      const available = (data.tenants || []).filter(item => item.type === 'UNIVERSITY');
      setTenants(available);
      const currentTenantId = typeof user?.tenant === 'object' && user.tenant
        ? user.tenant._id || user.tenant.id
        : typeof user?.tenant === 'string' ? user.tenant : undefined;
      const initialTenant = available.find(item => item._id === currentTenantId) || available[0];
      if (initialTenant) {
        setTenantId(initialTenant._id);
        const matchedCollege = initialTenant.affiliatedColleges?.find(item => item.name === user?.college);
        setCampus(matchedCollege?.name || '');
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not load universities. Check your connection and retry.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants().catch(() => {});
    // The onboarding gate is shown once after auth; do not refetch on profile object updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    setBranches([]);
    setBranch('');
    if (track !== 'UNIVERSITY' || !tenantId) return () => { active = false; };

    subjectApi.getBranches(tenantId)
      .then(response => {
        const values = (response.data as {branches?: string[]}).branches || [];
        if (!active) return;
        const options = values.length ? values : FALLBACK_BRANCHES;
        setBranches(options);
        const currentBranch = user?.branch?.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const matchedBranch = options.find(option => option.toUpperCase().replace(/[^A-Z0-9]/g, '') === currentBranch);
        setBranch(matchedBranch || options[0] || '');
      })
      .catch(requestError => {
        if (!active) return;
        setBranches(FALLBACK_BRANCHES);
        setBranch(FALLBACK_BRANCHES[0]);
        setError(getApiErrorMessage(requestError, 'Could not load branches; common options are shown.'));
      });

    return () => { active = false; };
  }, [track, tenantId, user?.branch]);

  const chooseTenant = (nextTenantId: string) => {
    setTenantId(nextTenantId);
    setCampus('');
  };

  const submit = async () => {
    setError('');
    if (track === 'UNIVERSITY') {
      if (!tenantId || !campus.trim() || campus.trim() === 'Other' || !branch) {
        setError('Choose your university, campus, and branch to continue.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = track === 'UNIVERSITY'
        ? {track, tenantId, college: campus.trim(), branch, year, semester}
        : {track, targetExam: track === 'NEET' ? 'NEET' : targetExam, targetYear};
      await completeOnboarding(payload);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} automaticallyAdjustKeyboardInsets>
      <View style={styles.header}>
        <Image source={require('../assets/academia-logo.png')} resizeMode="contain" style={styles.brandLogo} accessibilityLabel="The AcadeMIa logo" />
        <Text style={styles.brand}>The Acade<Text style={styles.accent}>MI</Text>a</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>PERSONALIZE YOUR WORKSPACE</Text>
        <Text style={styles.title}>Set up your learning track</Text>
        <Text style={styles.description}>Choose your course details so your subjects and tools match your studies.</Text>

        <Text style={styles.label}>LEARNING TRACK</Text>
        <View style={styles.row}>
          <Choice label="University" selected={track === 'UNIVERSITY'} onPress={() => setTrack('UNIVERSITY')} />
          <Choice label="JEE" selected={track === 'JEE'} onPress={() => setTrack('JEE')} />
          <Choice label="NEET" selected={track === 'NEET'} onPress={() => setTrack('NEET')} />
        </View>

        {track === 'UNIVERSITY' ? (
          loading ? <ActivityIndicator style={styles.loader} color="#16794b" /> : (
            <>
              <Text style={styles.label}>UNIVERSITY</Text>
              {tenants.length ? (
                <View style={styles.optionList}>
                  {tenants.map(item => (
                    <Choice key={item._id} label={item.name} selected={tenantId === item._id} onPress={() => chooseTenant(item._id)} />
                  ))}
                </View>
              ) : <Text style={styles.helper}>No universities are configured yet. You can retry after checking your connection.</Text>}

              {!!selectedTenant && <>
                <Text style={styles.label}>COLLEGE / CAMPUS</Text>
                {colleges.length ? (
                  <View style={styles.optionList}>
                    {colleges.map((item, index) => (
                      <Choice key={item._id || item.name || index} label={item.name} selected={campus === item.name} onPress={() => setCampus(item.name)} />
                    ))}
                  </View>
                ) : null}
                <TextInput
                  accessibilityLabel="College or campus name"
                  value={campus}
                  onChangeText={setCampus}
                  placeholder={colleges.length ? 'Or enter your campus name' : 'Enter your college or campus'}
                  placeholderTextColor="#929bad"
                  style={styles.input}
                />
                <Text style={styles.label}>BRANCH</Text>
                <View style={styles.rowWrap}>
                  {branches.map(value => <Choice key={value} label={value} selected={branch === value} onPress={() => setBranch(value)} />)}
                </View>
                <Text style={styles.label}>YEAR</Text>
                <View style={styles.row}>
                  {[1, 2, 3, 4].map(value => <Choice key={value} label={`${value}${value === 1 ? 'st' : value === 2 ? 'nd' : value === 3 ? 'rd' : 'th'}`} selected={year === value} onPress={() => { setYear(value); setSemester(value * 2 - 1); }} />)}
                </View>
                <Text style={styles.label}>SEMESTER</Text>
                <View style={styles.row}>
                  {semesterOptions.map(value => <Choice key={value} label={`Semester ${value}`} selected={semester === value} onPress={() => setSemester(value)} />)}
                </View>
              </>}
            </>
          )
        ) : (
          <>
            {track === 'JEE' && <>
              <Text style={styles.label}>TARGET EXAM</Text>
              <View style={styles.row}>
                <Choice label="JEE Main" selected={targetExam === 'JEE_MAINS'} onPress={() => setTargetExam('JEE_MAINS')} />
                <Choice label="JEE Advanced" selected={targetExam === 'JEE_ADVANCED'} onPress={() => setTargetExam('JEE_ADVANCED')} />
              </View>
            </>}
            <Text style={styles.label}>TARGET YEAR</Text>
            <View style={styles.rowWrap}>
              {[CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2, CURRENT_YEAR + 3].map(value => <Choice key={value} label={String(value)} selected={targetYear === value} onPress={() => setTargetYear(value)} />)}
            </View>
          </>
        )}

        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{disabled: saving || loading}}
          disabled={saving || loading}
          onPress={() => submit()}
          style={({pressed}) => [styles.submit, pressed && styles.pressed, (saving || loading) && styles.disabled]}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitLabel}>SAVE AND CONTINUE</Text>}
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => logout()} style={styles.logout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Choice({label, selected, onPress}: {label: string; selected: boolean; onPress: () => void}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{selected}}
      onPress={onPress}
      style={({pressed}) => [styles.choice, selected && styles.choiceSelected, pressed && styles.choicePressed]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = createAdaptiveStyles(StyleSheet.create({
  root: {flex: 1, backgroundColor: '#ffffff'},
  page: {flexGrow: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 34, backgroundColor: '#ffffff'},
  header: {alignItems: 'center', marginBottom: 20},
  brandLogo: {width: 60, height: 54, borderRadius: 7},
  brand: {marginTop: 9, color: '#101828', fontSize: 20, fontWeight: '900'},
  accent: {color: '#16794b'},
  card: {width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 2, paddingVertical: 4},
  eyebrow: {color: '#16794b', fontSize: 10, fontWeight: '900', letterSpacing: 1.2},
  title: {marginTop: 8, color: '#111827', fontSize: 23, fontWeight: '900'},
  description: {marginTop: 7, marginBottom: 20, color: '#687187', fontSize: 14, lineHeight: 21},
  label: {marginTop: 17, marginBottom: 8, color: '#737b8c', fontSize: 10, fontWeight: '900', letterSpacing: 0.8},
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  rowWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  optionList: {gap: 7},
  choice: {minHeight: 42, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#e1e5ee', borderRadius: 12, backgroundColor: '#fff'},
  choiceSelected: {borderColor: '#16794b', backgroundColor: '#f0fdf4'},
  choicePressed: {opacity: 0.8},
  choiceText: {color: '#515b70', fontSize: 12, fontWeight: '700'},
  choiceTextSelected: {color: '#145c38'},
  input: {minHeight: 48, paddingHorizontal: 13, borderWidth: 1, borderColor: '#dfe4ed', borderRadius: 12, color: '#111827', fontSize: 14},
  helper: {color: '#687187', fontSize: 13, lineHeight: 20},
  loader: {paddingVertical: 16},
  error: {marginTop: 17, padding: 11, borderRadius: 10, backgroundColor: '#fff1f1', color: '#b42318', fontSize: 13, lineHeight: 19},
  submit: {minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 23, borderRadius: 13, backgroundColor: '#16794b'},
  submitLabel: {color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 0.8},
  pressed: {opacity: 0.85},
  disabled: {opacity: 0.6},
  logout: {alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 13},
  logoutText: {color: '#687187', fontSize: 13, fontWeight: '700'},
}));
