import * as Keychain from 'react-native-keychain';

const TOKEN_SERVICE = 'com.theacademia.mobile.auth';
const TOKEN_ACCOUNT = 'access-token';

/** Stores the API bearer token in Android Keystore-backed secure storage. */
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
