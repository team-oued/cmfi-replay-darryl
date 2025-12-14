import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { i18n, Language, TranslationKey } from '../lib/i18n';
import { auth, db } from '../lib/firebase';
import { userService, UserProfile, bookDocService, bookSeriesService, subscriptionService } from '../lib/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
import { ActiveTab } from '../types';

type Theme = 'light' | 'dark';
type HomeViewMode = 'default' | 'prime' | 'netflix';

interface AppContextType {
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: TranslationKey, vars?: Record<string, string>) => string;
    isAuthenticated: boolean;
    setIsAuthenticated: (isAuth: boolean) => void;
    bookmarkedIds: string[];
    toggleBookmark: (id: string, title: string, description: string, image: string, isseries?: boolean) => Promise<void>;
    toggleSeriesBookmark: (id: string, title: string, description: string, image: string, moviepath: string, runtime: string) => Promise<void>;
    user: User | null;
    userProfile: UserProfile | null;
    setUserProfile: (profile: UserProfile | null) => void;
    loading: boolean;
    autoplay: boolean;
    setAutoplay: (value: boolean) => void;
    isSidebarCollapsed: boolean;
    setIsSidebarCollapsed: (value: boolean) => void;
    toggleSidebarCollapse: () => void;
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    isPremium: boolean;
    subscriptionDetails: {
        planType: string;
        endDate: Date | null;
        daysRemaining: number | null;
    } | null;
    refreshSubscription: () => Promise<void>;
    homeViewMode: HomeViewMode;
    setHomeViewMode: (mode: HomeViewMode) => void;
}

export type { HomeViewMode };

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = window.localStorage.getItem('theme') as 'light' | 'dark';
            if (savedTheme) {
                // Appliquer le thème au chargement
                const root = window.document.documentElement;
                root.classList.remove('light', 'dark');
                root.classList.add(savedTheme);
                return savedTheme;
            }
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const defaultTheme = prefersDark ? 'dark' : 'light';
            localStorage.setItem('theme', defaultTheme);
            return defaultTheme;
        }
        return 'light';
    });

    const setTheme = useCallback((newTheme: 'light' | 'dark') => {
        setThemeState(prevTheme => {
            if (prevTheme !== newTheme) {
                if (typeof window !== 'undefined') {
                    const root = window.document.documentElement;
                    root.classList.remove(prevTheme);
                    root.classList.add(newTheme);
                    localStorage.setItem('theme', newTheme);
                }
                return newTheme;
            }
            return prevTheme;
        });
    }, []);

    const [language, setLanguage] = useState<Language>('en');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const savedState = window.localStorage.getItem('sidebarCollapsed');
            return savedState === 'true';
        }
        return false;
    });

    const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Home);

    const [autoplay, setAutoplayState] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const savedAutoplay = window.localStorage.getItem('autoplay');
            return savedAutoplay === 'true';
        }
        return false;
    });

    const setAutoplay = (value: boolean) => {
        setAutoplayState(value);
        localStorage.setItem('autoplay', String(value));
    };

    // État pour le mode d'affichage de la page d'accueil
    const [homeViewMode, setHomeViewModeState] = useState<HomeViewMode>('default');
    const [loadingViewMode, setLoadingViewMode] = useState(true);

    // Charger le mode d'affichage depuis Firestore (paramètres globaux)
    useEffect(() => {
        const loadViewMode = async () => {
            try {
                const { appSettingsService } = await import('../lib/firestore');
                const settings = await appSettingsService.getAppSettings();
                if (settings) {
                    setHomeViewModeState(settings.homeViewMode);
                }
            } catch (error) {
                console.error('Error loading view mode:', error);
                // Fallback sur localStorage si erreur
                if (typeof window !== 'undefined') {
                    const saved = window.localStorage.getItem('homeViewMode') as HomeViewMode;
                    if (saved) {
                        setHomeViewModeState(saved);
                    }
                }
            } finally {
                setLoadingViewMode(false);
            }
        };

        loadViewMode();
    }, []);

    // Écouter les changements de mode d'affichage en temps réel
    useEffect(() => {
        const settingsRef = doc(db, 'appSettings', 'global');
        const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                if (data.homeViewMode) {
                    setHomeViewModeState(data.homeViewMode);
                }
            }
        }, (error) => {
            console.error('Error listening to view mode changes:', error);
        });

        return () => unsubscribe();
    }, []);

    const setHomeViewMode = async (mode: HomeViewMode) => {
        // Mise à jour optimiste
        setHomeViewModeState(mode);
        
        // Sauvegarder dans Firestore si l'utilisateur est admin
        if (userProfile?.isAdmin && user) {
            try {
                const { appSettingsService } = await import('../lib/firestore');
                await appSettingsService.setHomeViewMode(mode, user.uid);
            } catch (error) {
                console.error('Error saving view mode to Firestore:', error);
                // En cas d'erreur, sauvegarder dans localStorage comme fallback
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem('homeViewMode', mode);
                }
            }
        } else {
            // Si l'utilisateur n'est pas admin, sauvegarder uniquement dans localStorage
            if (typeof window !== 'undefined') {
                window.localStorage.setItem('homeViewMode', mode);
            }
        }
    };

    // États pour le statut premium
    const [isPremium, setIsPremium] = useState<boolean | null>(null); // null signifie que le chargement est en cours
    const [subscriptionDetails, setSubscriptionDetails] = useState<{
        planType: string;
        endDate: Date | null;
        daysRemaining: number | null;
    } | null>(null);

    // Fonction pour rafraîchir le statut d'abonnement
    const refreshSubscription = useMemo(() => {
        return async () => {
            console.log(' [refreshSubscription] Début de la vérification du statut premium');
            const currentUser = auth.currentUser; // Utiliser directement auth.currentUser
            
            if (!currentUser) {
                console.log(' [refreshSubscription] Aucun utilisateur connecté, statut premium désactivé');
                setIsPremium(false);
                setSubscriptionDetails(null);
                return;
            }

            try {
                console.log(' [refreshSubscription] Vérification du statut premium pour l\'utilisateur:', currentUser.uid);
                const details = await subscriptionService.getSubscriptionDetails(currentUser.uid);
                console.log(' [refreshSubscription] Détails de l\'abonnement:', details);

                setIsPremium(details.isPremium);
                setSubscriptionDetails({
                    planType: details.planType,
                    endDate: details.endDate,
                    daysRemaining: details.daysRemaining
                });

                // Stocker en localStorage pour une récupération immédiate au chargement
                if (typeof window !== 'undefined') {
                    // Vérifier que endDate est une Date valide avant d'appeler toISOString()
                    const endDateISO = details.endDate && details.endDate instanceof Date && !isNaN(details.endDate.getTime())
                        ? details.endDate.toISOString()
                        : null;
                    
                    localStorage.setItem('premiumStatus', JSON.stringify({
                        isPremium: details.isPremium,
                        planType: details.planType,
                        endDate: endDateISO,
                        timestamp: new Date().toISOString()
                    }));
                }

                console.log(' [refreshSubscription] Statut premium mis à jour:', details.isPremium);
            } catch (error) {
                console.error('Error refreshing subscription:', error);
                setIsPremium(false);
                setSubscriptionDetails(null);
            }
        };
    }, []);

    // Mettre à jour le statut de présence de l'utilisateur
    const updateUserPresence = async (uid: string, status: 'online' | 'offline' | 'idle' | 'away') => {
        try {
            await userService.updateUserProfile(uid, { presence: status });
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut de présence:', error);
        }
    };

    // Gérer la visibilité de l'onglet
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (user && user.uid) {
                if (document.visibilityState === 'visible') {
                    await updateUserPresence(user.uid, 'online');
                } else {
                    await updateUserPresence(user.uid, 'away');
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user]);

    // Initialiser l'état avec l'utilisateur actuel s'il est déjà connecté
    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
        }
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log(' État d\'authentification changé:', user ? `Utilisateur connecté: ${user.uid}` : 'Déconnecté');
            setUser(user);
            setIsAuthenticated(!!user);
            setLoading(true);

            if (user) {
                try {
                    // Mettre à jour le statut en ligne lors de la connexion
                    await updateUserPresence(user.uid, 'online');
                    
                    const profile = await userService.getUserProfile(user.uid);
                    if (profile) {
                        setUserProfile(profile);
                        setThemeState(profile.theme);
                        setBookmarkedIds(profile.bookmarkedIds || []);

                        // Charger les bookmarks depuis bookDoc et bookSeries
                        const bookDocs = await bookDocService.getUserBookmarks(user.email!);
                        const bookSeries = await bookSeriesService.getUserBookmarks(user.email!);
                        const allBookmarkIds = [
                            ...bookDocs.map(doc => doc.uid),
                            ...bookSeries.map(series => series.uid)
                        ];
                        setBookmarkedIds(allBookmarkIds);

                        // Charger le statut d'abonnement
                        await refreshSubscription();
                    } else {
                        await userService.createUserProfile({
                            uid: user.uid,
                            email: user.email || '',
                            display_name: user.displayName || 'User',
                            presence: 'online',
                            hasAcceptedPrivacyPolicy: false,
                            created_time: new Date().toISOString(),
                            theme,
                            language,
                            bookmarkedIds: []
                        });

                        // Créer un abonnement gratuit pour le nouvel utilisateur
                        await subscriptionService.createFreeSubscription(user.uid);
                        await refreshSubscription();
                    }
                } catch (error) {
                    console.error('Error loading user profile:', error);
                }
            } else {
                // Mettre à jour le statut hors ligne lors de la déconnexion
                if (userProfile?.uid) {
                    try {
                        await updateUserPresence(userProfile.uid, 'offline');
                    } catch (error) {
                        console.error('Erreur lors de la mise à jour du statut hors ligne:', error);
                    }
                }
                setUserProfile(null);
                setBookmarkedIds([]);
                setIsPremium(false);
                setSubscriptionDetails(null);
            }

            setLoading(false);
        });

        // Nettoyage lors du démontage du composant
        return () => {
            // Mettre à jour le statut hors ligne lors de la déconnexion
            if (userProfile?.uid) {
                updateUserPresence(userProfile.uid, 'offline').catch(console.error);
            }
            unsubscribe();
        };
    }, []);

    // Mettre à jour le thème dans le profil utilisateur uniquement si nécessaire
    useEffect(() => {
        if (userProfile && user && theme !== undefined) {
            // Vérifier si le thème a réellement changé avant de mettre à jour
            if (theme !== userProfile.theme) {
                const updates: Partial<UserProfile> = { theme };
                // Ne pas attendre la fin de la mise à jour pour éviter les retards d'UI
                userService.updateUserProfile(user.uid, updates).catch(error => {
                    console.error('Failed to update user theme:', error);
                });
            }
        }
    }, [theme, userProfile, user]);

    const toggleBookmark = async (id: string, title: string, description: string, image: string, isseries: boolean = false) => {
        if (!user || !user.email) return;

        try {
            const isBookmarked = await bookDocService.toggleBookmark(
                id,
                user.email,
                title,
                description,
                image,
                isseries
            );

            setBookmarkedIds(prev =>
                isBookmarked
                    ? [...prev, id]
                    : prev.filter(bookmarkedId => bookmarkedId !== id)
            );

            // Mettre à jour aussi dans le userProfile
            await userService.toggleBookmark(user.uid, id);
        } catch (error) {
            console.error('Error toggling bookmark:', error);
        }
    };

    const toggleSeriesBookmark = async (
        id: string,
        title: string,
        description: string,
        image: string,
        moviepath: string,
        runtime: string
    ) => {
        if (!user || !user.email) return;

        try {
            const isBookmarked = await bookSeriesService.toggleBookmark(
                id,
                user.email,
                title,
                description,
                image,
                moviepath,
                runtime
            );

            setBookmarkedIds(prev =>
                isBookmarked
                    ? [...prev, id]
                    : prev.filter(bookmarkedId => bookmarkedId !== id)
            );

            // Mettre à jour aussi dans le userProfile
            await userService.toggleBookmark(user.uid, id);
        } catch (error) {
            console.error('Error toggling series bookmark:', error);
        }
    };

    const t = useMemo(() => i18n(language), [language]);

    const toggleSidebarCollapse = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const value = useMemo(() => ({
        theme,
        setTheme,
        language,
        setLanguage,
        t,
        isAuthenticated,
        setIsAuthenticated,
        bookmarkedIds,
        toggleBookmark,
        toggleSeriesBookmark,
        user,
        userProfile,
        setUserProfile,
        loading,
        autoplay,
        setAutoplay,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebarCollapse,
        activeTab,
        setActiveTab,
        isPremium: isPremium ?? false,
        subscriptionDetails,
        refreshSubscription,
        homeViewMode,
        setHomeViewMode,
    }), [
        theme,
        language,
        t,
        isAuthenticated,
        bookmarkedIds,
        user,
        userProfile,
        loading,
        autoplay,
        isSidebarCollapsed,
        activeTab,
        isPremium,
        subscriptionDetails,
        homeViewMode,
        // Fonctions
        setTheme,
        setLanguage,
        setIsAuthenticated,
        toggleBookmark,
        toggleSeriesBookmark,
        setUserProfile,
        setAutoplay,
        setIsSidebarCollapsed,
        toggleSidebarCollapse,
        setActiveTab,
        refreshSubscription,
        setHomeViewMode,
    ]);

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