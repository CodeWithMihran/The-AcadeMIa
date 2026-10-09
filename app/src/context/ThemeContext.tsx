import React, {createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {AccessibilityInfo, useColorScheme} from 'react-native';
import {setAdaptiveThemeMode} from '../theme';
import {readThemePreference, saveThemePreference} from '../services/tokenStore';

type ThemePreference = 'system' | 'light' | 'dark';
type ThemeContextValue = {isDark: boolean; preference: ThemePreference; reduceMotion: boolean; toggleTheme: () => void; setThemePreference: (value: ThemePreference) => void};
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({children}: PropsWithChildren): React.JSX.Element {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [reduceMotion, setReduceMotion] = useState(false);
  const isDark = preference === 'system' ? systemScheme === 'dark' : preference === 'dark';
  setAdaptiveThemeMode(isDark ? 'dark' : 'light');

  useEffect(() => {
    let active = true;
    readThemePreference().then(saved => { if (active && saved) setPreference(saved); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => { if (active) setReduceMotion(enabled); })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const setThemePreference = useCallback((value: ThemePreference) => {
    setPreference(value);
    saveThemePreference(value).catch(() => undefined);
  }, []);
  const toggleTheme = useCallback(() => setThemePreference(isDark ? 'light' : 'dark'), [isDark, setThemePreference]);
  const value = useMemo(() => ({isDark, preference, reduceMotion, toggleTheme, setThemePreference}), [isDark, preference, reduceMotion, toggleTheme, setThemePreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be rendered inside ThemeProvider.');
  return context;
}
