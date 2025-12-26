import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';

const THEME_STORAGE_KEY = '@coffee_date_theme';

type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  theme: typeof Colors.light;
  isDark: boolean;
  colorScheme: ColorScheme;
  setIsDark: (isDark: boolean) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme() ?? 'light';
  const [manualColorScheme, setManualColorScheme] = useState<ColorScheme | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadStoredTheme();
  }, []);

  const loadStoredTheme = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        setManualColorScheme(stored);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveTheme = async (scheme: ColorScheme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const colorScheme: ColorScheme = manualColorScheme ?? systemColorScheme;
  const isDark = colorScheme === 'dark';
  const theme = Colors[colorScheme];

  const setIsDark = (dark: boolean) => {
    const newScheme: ColorScheme = dark ? 'dark' : 'light';
    setManualColorScheme(newScheme);
    saveTheme(newScheme);
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, colorScheme, setIsDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
