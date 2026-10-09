import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {AxiosError} from 'axios';
import {resetSessionExpiration, subscribeToSessionExpiration} from '../services/authSession';
import {authApi, getApiErrorMessage, tenantApi} from '../services/api';
import {clearAuthToken, readAuthToken, saveAuthToken} from '../services/tokenStore';

export interface AcademiaUser {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'moderator' | string;
  track?: 'UNIVERSITY' | 'JEE' | 'NEET' | string;
  tenant?: { _id?: string; id?: string; name?: string; shortCode?: string; type?: string } | string | null;
  college?: string;
  branch?: string;
  year?: number;
  semester?: number;
  targetExam?: string;
  targetYear?: number;
  onboardingCompleted?: boolean;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: AcademiaUser | null;
  loading: boolean;
  authError: string;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  completeGoogleSignIn: (code: string, verifier: string) => Promise<void>;
  failGoogleSignIn: (message: string) => void;
  completeOnboarding: (input: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AcademiaUser) => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function responseUser(data: unknown): AcademiaUser {
  const user = (data as {user?: AcademiaUser} | undefined)?.user;
  if (!user || typeof user.email !== 'string' || typeof user.name !== 'string') {
    throw new Error('The server returned an invalid account response.');
  }
  return user;
}

export function AuthProvider({children}: PropsWithChildren): React.JSX.Element {
  const [user, setUser] = useState<AcademiaUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => subscribeToSessionExpiration(() => {
    setUser(null);
    setAuthError('Your session expired. Sign in again to continue.');
  }), []);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const token = await readAuthToken();
        if (!token) {
          if (active) setLoading(false);
          return;
        }

        const response = await authApi.currentUser();
        if (active) {
          setUser(responseUser(response.data));
          resetSessionExpiration();
        }
      } catch (error) {
        const status = (error as AxiosError).response?.status;
        if (status === 401) {
          await clearAuthToken();
        } else if (active) {
          setAuthError(getApiErrorMessage(error, 'Could not restore your sign-in.'));
        }
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    restoreSession().catch(error => {
      if (active) {
        setAuthError(getApiErrorMessage(error, 'Could not restore your sign-in.'));
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const acceptAuthResponse = useCallback(async (data: unknown) => {
    const payload = data as {success?: boolean; token?: string; message?: string};
    if (!payload?.success || typeof payload.token !== 'string') {
      throw new Error(payload?.message || 'The server did not return a sign-in token.');
    }

    const authenticatedUser = responseUser(data);
    await saveAuthToken(payload.token);
    resetSessionExpiration();
    setAuthError('');
    setUser(authenticatedUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authApi.login(email.trim(), password);
      await acceptAuthResponse(response.data);
    } catch (error) {
      const message = getApiErrorMessage(error, 'Sign-in failed. Please try again.');
      setAuthError(message);
      throw new Error(message);
    }
  }, [acceptAuthResponse]);

  const register = useCallback(async (input: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      const response = await authApi.register({
        ...input,
        name: input.name.trim(),
        email: input.email.trim(),
      });
      await acceptAuthResponse(response.data);
    } catch (error) {
      const message = getApiErrorMessage(error, 'Registration failed. Please try again.');
      setAuthError(message);
      throw new Error(message);
    }
  }, [acceptAuthResponse]);

  const completeGoogleSignIn = useCallback(async (code: string, verifier: string) => {
    try {
      const response = await authApi.exchangeMobileGoogleCode(code, verifier);
      await acceptAuthResponse(response.data);
    } catch (error) {
      const message = getApiErrorMessage(error, 'Google sign-in could not be completed. Please try again.');
      setAuthError(message);
      throw new Error(message);
    }
  }, [acceptAuthResponse]);

  const failGoogleSignIn = useCallback((message: string) => setAuthError(message), []);

  const completeOnboarding = useCallback(async (input: Record<string, unknown>) => {
    try {
      const response = await tenantApi.completeOnboarding(input);
      const data = response.data as {success?: boolean; user?: AcademiaUser; message?: string};
      if (!data.success || !data.user) {
        throw new Error(data.message || 'Could not save your academic profile.');
      }
      setUser(data.user);
      setAuthError('');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Could not save your academic profile.');
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Always clear local credentials, even if the server cannot be reached.
    } finally {
      try {
        await clearAuthToken();
      } catch {
        // Clear the in-memory session even if secure storage reports an error.
      }
      setAuthError('');
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((nextUser: AcademiaUser) => setUser(nextUser), []);
  const clearAuthError = useCallback(() => setAuthError(''), []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    authError,
    login,
    register,
    completeGoogleSignIn,
    failGoogleSignIn,
    completeOnboarding,
    logout,
    updateUser,
    clearAuthError,
  }), [user, loading, authError, login, register, completeGoogleSignIn, failGoogleSignIn, completeOnboarding, logout, updateUser, clearAuthError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be rendered within AuthProvider.');
  }
  return context;
}
