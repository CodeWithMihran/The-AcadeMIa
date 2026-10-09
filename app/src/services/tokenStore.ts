import * as Keychain from 'react-native-keychain';

const TOKEN_SERVICE = 'com.theacademia.mobile.auth';
const TOKEN_ACCOUNT = 'access-token';
const PKCE_SERVICE = 'com.theacademia.mobile.google-pkce';
const PKCE_ACCOUNT = 'google-code-verifier';
const PREFERENCES_SERVICE = 'com.theacademia.mobile.preferences';

/** Stores the API bearer token in Android Keystore / iOS Keychain secure storage. */
export async function saveAuthToken(token: string): Promise<void> {
  const normalizedToken = token?.trim();
  if (!normalizedToken) {
    throw new Error('Cannot save an empty authentication token.');
  }

  const saved = await Keychain.setGenericPassword(TOKEN_ACCOUNT, normalizedToken, {
    service: TOKEN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });

  if (!saved) {
    throw new Error('Secure storage could not save the sign-in token.');
  }
}

export async function readAuthToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({service: TOKEN_SERVICE});
  return credentials ? credentials.password : null;
}

export async function clearAuthToken(): Promise<void> {
  const removed = await Keychain.resetGenericPassword({service: TOKEN_SERVICE});
  if (!removed) {
    // No stored token is a valid signed-out state.
    return;
  }
}

export async function saveGoogleCodeVerifier(verifier: string): Promise<void> {
  await Keychain.setGenericPassword(PKCE_ACCOUNT, verifier, {
    service: PKCE_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function takeGoogleCodeVerifier(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({service: PKCE_SERVICE});
  await Keychain.resetGenericPassword({service: PKCE_SERVICE});
  return credentials ? credentials.password : null;
}

export async function clearGoogleCodeVerifier(): Promise<void> {
  await Keychain.resetGenericPassword({service: PKCE_SERVICE});
}

export async function readThemePreference(): Promise<'system' | 'light' | 'dark' | null> {
  const credentials = await Keychain.getGenericPassword({service: PREFERENCES_SERVICE});
  const value = credentials && credentials.password;
  return value === 'system' || value === 'light' || value === 'dark' ? value : null;
}

export async function saveThemePreference(value: 'system' | 'light' | 'dark'): Promise<void> {
  await Keychain.setGenericPassword('theme', value, {
    service: PREFERENCES_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}
