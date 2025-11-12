import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { i18n, Language, TranslationKey } from '../lib/i18n';

type Theme = 'light' | 'dark';

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string>) => string;
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuth: boolean) => void;
  bookmarkedIds: string[];
  toggleBookmark: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
        const savedTheme = window.localStorage.getItem('theme') as Theme;
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });
  
  const [language, setLanguage] = useState<Language>('en');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
        const savedBookmarks = window.localStorage.getItem('bookmarkedIds');
        return savedBookmarks ? JSON.parse(savedBookmarks) : [];
    }
    return [];
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('bookmarkedIds', JSON.stringify(bookmarkedIds));
    }
  }, [bookmarkedIds]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => 
        prev.includes(id) 
            ? prev.filter(bookmarkedId => bookmarkedId !== id)
            : [...prev, id]
    );
  };
  
  const t = useMemo(() => i18n(language), [language]);

  const value = {
    theme,
    setTheme,
    language,
    setLanguage,
    t,
    isAuthenticated,
    setIsAuthenticated,
    bookmarkedIds,
    toggleBookmark,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};