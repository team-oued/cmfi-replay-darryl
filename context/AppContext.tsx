import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { i18n, Language, TranslationKey } from '../lib/i18n';
import { auth } from '../lib/firebase';
import { userService, UserProfile } from '../lib/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

type Theme = 'light' | 'dark';

interface AppContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string>) => string;
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuth: boolean) => void;
  bookmarkedIds: string[];
  toggleBookmark: (id: string) => void;
  user: User | null;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        const savedTheme = window.localStorage.getItem('theme') as 'light' | 'dark';
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });
  
  const [language, setLanguage] = useState<Language>('en');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsAuthenticated(!!user);
      setLoading(true);
      
      if (user) {
        try {
          const profile = await userService.getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
            setThemeState(profile.theme);
            setBookmarkedIds(profile.bookmarkedIds || []);
          } else {
            await userService.createUserProfile({
              uid: user.uid,
              email: user.email || '',
              theme,
              language,
              bookmarkedIds: []
            });
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setUserProfile(null);
        setBookmarkedIds([]);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userProfile && user) {
      const updates: Partial<UserProfile> = {};
      if (theme !== undefined) updates.theme = theme;
      if (bookmarkedIds !== undefined) updates.bookmarkedIds = bookmarkedIds;
      
      if (Object.keys(updates).length > 0) {
        userService.updateUserProfile(user.uid, updates);
      }
    }
  }, [theme, bookmarkedIds, userProfile, user]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  const toggleBookmark = async (id: string) => {
    if (!user) return;
    
    try {
      await userService.toggleBookmark(user.uid, id);
      setBookmarkedIds(prev => 
          prev.includes(id) 
              ? prev.filter(bookmarkedId => bookmarkedId !== id)
              : [...prev, id]
      );
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
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
    user,
    userProfile,
    setUserProfile,
    loading,
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