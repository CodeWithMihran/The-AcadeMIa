import {useAppTheme} from '../context/ThemeContext';
import {createAdaptiveStyles} from '../theme';
import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {API_BASE_URL} from '../services/api';
import {clearGoogleCodeVerifier, saveGoogleCodeVerifier} from '../services/tokenStore';
import {RegisterScreenProps, SignInScreenProps} from '../navigation/RootNavigator';

type AuthScreenProps = SignInScreenProps | RegisterScreenProps;
type TextInputHandle = React.ElementRef<typeof TextInput>;

export function AuthScreen({navigation, route}: AuthScreenProps): React.JSX.Element {
  const {isDark} = useAppTheme();
  const registering = route.name === 'Register';
  const {login, register, authError, clearAuthError} = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const emailRef = useRef<TextInputHandle>(null);
  const passwordRef = useRef<TextInputHandle>(null);
  const confirmPasswordRef = useRef<TextInputHandle>(null);

  const submit = async () => {
    setError('');
    clearAuthError();
    const normalizedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }
    if (registering) {
      if (name.trim().length < 2) {
        setError('Enter your name (at least 2 characters).');
        return;
      }
      if (password !== confirmPassword) {
        setError('Your passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (registering) {
        await register({name, email: normalizedEmail, password, confirmPassword});
      } else {
        await login(normalizedEmail, password);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not sign in. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const startGoogleSignIn = async () => {
    setError('');
    clearAuthError();
    setGoogleSubmitting(true);
    try {
      const secureModule = NativeModules.AcademiaDocumentPicker as {createPkceChallenge?: () => Promise<{verifier: string; challenge: string}>} | undefined;
      if (!secureModule?.createPkceChallenge) throw new Error('This app build does not include secure Google sign-in support. Rebuild the native app.');
      const {verifier, challenge} = await secureModule.createPkceChallenge();
      if (!/^[A-Za-z0-9_-]{43}$/.test(verifier) || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) {
        throw new Error('Could not prepare secure Google sign-in. Update and rebuild the app.');
      }
      await saveGoogleCodeVerifier(verifier);
      await Linking.openURL(`${API_BASE_URL}/auth/google/mobile/start?code_challenge=${encodeURIComponent(challenge)}`);
    } catch {
      await clearGoogleCodeVerifier().catch(() => undefined);
      setError('Could not open secure Google sign-in. Check your API configuration and try again.');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets>
        <View style={styles.brandMark} accessibilityLabel="The AcadeMIa logo">
          <Text style={styles.brandA}>A</Text>
        </View>
        <Text style={styles.brandName}>The Acade<Text style={styles.brandAccent}>MI</Text>a</Text>
        <Text style={styles.brandSubtitle}>YOUR ACADEMIC WORKSPACE</Text>

        <View style={styles.form}>
          <Text style={styles.eyebrow}>{registering ? 'START YOUR JOURNEY' : 'WELCOME BACK'}</Text>
          <Text style={styles.title}>{registering ? 'Create your account' : 'Sign in to continue'}</Text>
          <Text style={styles.description}>
            {registering ? 'One account for your subjects, study tools, and campus.' : 'Pick up where you left off in your academic workspace.'}
          </Text>

          {registering && (
            <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} />
          )}
          <Field
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            inputRef={emailRef}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            autoComplete={registering ? 'new-password' : 'password'}
            inputRef={passwordRef}
            returnKeyType={registering ? 'next' : 'done'}
            onSubmitEditing={() => registering ? confirmPasswordRef.current?.focus() : submit()}
          />
          {registering && (
            <Field
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Enter your password again"
              secureTextEntry
              autoComplete="new-password"
              inputRef={confirmPasswordRef}
              returnKeyType="done"
              onSubmitEditing={() => submit()}
            />
          )}

          {(error || authError) ? (
            <Text accessibilityRole="alert" style={styles.error}>{error || authError}</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{disabled: submitting}}
            disabled={submitting}
            onPress={() => submit()}
            style={({pressed}) => [styles.submit, pressed && !submitting && styles.pressed, submitting && styles.disabled]}>
            {submitting ? <ActivityIndicator color="#ffffff" /> : (
              <Text style={styles.submitLabel}>{registering ? 'CREATE ACCOUNT' : 'SIGN IN'}</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{disabled: googleSubmitting}}
            disabled={googleSubmitting}
            onPress={() => { startGoogleSignIn().catch(() => {}); }}
            style={({pressed}) => [styles.googleButton, pressed && styles.pressed, googleSubmitting && styles.disabled]}>
            {googleSubmitting ? <ActivityIndicator color={isDark ? '#f2f4f7' : '#101828'} /> : <Text style={styles.googleLabel}>CONTINUE WITH GOOGLE</Text>}
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{registering ? 'Already have an account?' : 'New to The AcadeMIa?'}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setError('');
                clearAuthError();
                navigation.navigate(registering ? 'SignIn' : 'Register');
              }}>
              <Text style={styles.switchAction}>{registering ? 'Sign in' : 'Create account'}</Text>
            </Pressable>
          </View>
          <Text style={styles.privacyNote}>Your account is shared with the website. Your sign-in token is stored securely on this device.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  autoComplete?: 'email' | 'password' | 'new-password';
  secureTextEntry?: boolean;
  inputRef?: React.RefObject<TextInputHandle | null>;
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
}

function Field(props: FieldProps): React.JSX.Element {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        accessibilityLabel={props.label}
        ref={props.inputRef}
        autoCapitalize={props.autoCapitalize || 'none'}
        autoComplete={props.autoComplete}
        keyboardType={props.keyboardType || 'default'}
        onChangeText={props.onChangeText}
        onSubmitEditing={props.onSubmitEditing}
        placeholder={props.placeholder}
        placeholderTextColor="#929bad"
        returnKeyType={props.returnKeyType || 'next'}
        secureTextEntry={props.secureTextEntry}
        style={styles.input}
        value={props.value}
      />
    </View>
  );
}

const styles = createAdaptiveStyles(StyleSheet.create({
  root: {flex: 1, backgroundColor: '#ffffff'},
  scrollContent: {flexGrow: 1, justifyContent: 'center', paddingHorizontal: 26, paddingTop: 28, paddingBottom: 32},
  brandMark: {alignSelf: 'center', width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#16794b'},
  brandA: {color: '#fff', fontSize: 32, fontWeight: '900', fontStyle: 'italic'},
  brandName: {marginTop: 12, alignSelf: 'center', color: '#101828', fontSize: 22, fontWeight: '900'},
  brandAccent: {color: '#16794b'},
  brandSubtitle: {marginTop: 4, marginBottom: 34, alignSelf: 'center', color: '#7e8799', fontSize: 9, fontWeight: '800', letterSpacing: 2},
  form: {width: '100%', maxWidth: 440, alignSelf: 'center', paddingHorizontal: 2},
  eyebrow: {color: '#16794b', fontSize: 10, fontWeight: '900', letterSpacing: 1.4},
  title: {marginTop: 8, color: '#111827', fontSize: 25, fontWeight: '900', letterSpacing: -0.5},
  description: {marginTop: 8, marginBottom: 22, color: '#687187', fontSize: 14, lineHeight: 21},
  field: {marginBottom: 15},
  label: {marginBottom: 7, color: '#394256', fontSize: 12, fontWeight: '800'},
  input: {minHeight: 51, paddingHorizontal: 14, borderWidth: 1, borderColor: '#dfe4ed', borderRadius: 13, backgroundColor: '#fff', color: '#111827', fontSize: 15},
  error: {marginTop: 2, marginBottom: 14, padding: 11, borderRadius: 11, backgroundColor: '#fff1f1', color: '#b42318', fontSize: 13, lineHeight: 19},
  submit: {minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 7, borderRadius: 14, backgroundColor: '#16794b'},
  submitLabel: {color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.8},
  googleButton: {minHeight: 48, marginTop: 10, borderWidth: 1, borderColor: '#dfe4ed', borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'},
  googleLabel: {color: '#101828', fontSize: 11, fontWeight: '900', letterSpacing: 0.6},
  pressed: {opacity: 0.86, transform: [{scale: 0.99}]},
  disabled: {opacity: 0.62},
  switchRow: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: 5, rowGap: 4, marginTop: 19},
  switchText: {color: '#687187', fontSize: 13},
  switchAction: {padding: 3, color: '#16794b', fontSize: 13, fontWeight: '800'},
  privacyNote: {marginTop: 20, color: '#8a93a4', fontSize: 11, lineHeight: 16, textAlign: 'center'},
}));
