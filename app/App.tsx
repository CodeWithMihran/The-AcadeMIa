import React, {useEffect, useRef} from 'react';
import {Linking, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {AuthProvider} from './src/context/AuthContext';
import {ThemeProvider, useAppTheme} from './src/context/ThemeContext';
import {RootNavigator} from './src/navigation/RootNavigator';
import {useAuth} from './src/context/AuthContext';
import {clearGoogleCodeVerifier, takeGoogleCodeVerifier} from './src/services/tokenStore';

function GoogleAuthLinkHandler(): null {
  const {completeGoogleSignIn, failGoogleSignIn} = useAuth();
  const consumedCodes = useRef(new Set<string>());

  useEffect(() => {
    let mounted = true;
    const handleUrl = async (url: string | null) => {
      if (!url || !mounted) return;
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return;
      }
      if (parsed.protocol !== 'theacademia:' || parsed.hostname !== 'auth' || parsed.pathname !== '/callback') return;
      const code = parsed.searchParams.get('code');
      if (code && /^[a-f0-9]{64}$/i.test(code)) {
        if (consumedCodes.current.has(code)) return;
        consumedCodes.current.add(code);
        try {
          const verifier = await takeGoogleCodeVerifier();
          if (!verifier) throw new Error('Secure Google sign-in state is missing. Start again.');
          await completeGoogleSignIn(code, verifier);
        } catch (error) {
          await clearGoogleCodeVerifier().catch(() => undefined);
          failGoogleSignIn(error instanceof Error ? error.message : 'Google sign-in could not be completed. Please try again.');
        }
        return;
      }
      if (parsed.searchParams.has('error')) {
        clearGoogleCodeVerifier().catch(() => undefined);
        const error = parsed.searchParams.get('error');
        failGoogleSignIn(error === 'google_sign_in_failed'
          ? 'Google sign-in was cancelled or could not be verified. Try again.'
          : 'Google sign-in could not be completed. Please try again.');
      }
    };
    const subscription = Linking.addEventListener('url', event => { handleUrl(event.url).catch(() => {}); });
    Linking.getInitialURL().then(url => handleUrl(url ?? null)).catch(() => {});
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [completeGoogleSignIn, failGoogleSignIn]);

  return null;
}

function AppContent(): React.JSX.Element {
  const {isDark} = useAppTheme();
  return (
    <>
      <GoogleAuthLinkHandler />
      <NavigationContainer>
        <View style={isDark ? styles.containerDark : styles.container}>
          <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
          <RootNavigator />
        </View>
      </NavigationContainer>
    </>
  );
}

function App(): React.JSX.Element {
  return <SafeAreaProvider><ThemeProvider><AuthProvider><AppContent /></AuthProvider></ThemeProvider></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#ffffff'},
  containerDark: {flex: 1, backgroundColor: '#111318'},
});

export default App;
