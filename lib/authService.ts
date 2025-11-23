import { auth, googleProvider } from './firebase';
import {
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    UserCredential
} from 'firebase/auth';
import { userService } from './firestore';

// Fonction utilitaire pour formater la date au format demandé
const formatCreatedTime = (date: Date): string => {
    const months = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Obtenir le décalage UTC
    const offset = -date.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetSign = offset >= 0 ? '+' : '-';

    return `${day} ${month} ${year} à ${hours}:${minutes}:${seconds} UTC${offsetSign}${offsetHours}`;
};

/**
 * Service d'authentification Google
 */
export const authService = {
    /**
     * Connexion avec Google via popup
     * Recommandé pour desktop
     */
    signInWithGooglePopup: async (): Promise<UserCredential> => {
        try {
            const result = await signInWithPopup(auth, googleProvider);

            // Vérifier si le profil utilisateur existe, sinon le créer
            const user = result.user;
            const existingProfile = await userService.getUserProfile(user.uid);

            if (!existingProfile) {
                const createdTime = formatCreatedTime(new Date());
                await userService.createUserProfile({
                    uid: user.uid,
                    email: user.email || '',
                    display_name: user.displayName || 'User',
                    photo_url: user.photoURL || undefined,
                    presence: 'offline',
                    hasAcceptedPrivacyPolicy: false,
                    created_time: createdTime,
                    theme: 'dark',
                    language: 'en',
                    bookmarkedIds: []
                });
                console.log('Profil utilisateur Google créé:', {
                    uid: user.uid,
                    email: user.email,
                    created_time: createdTime
                });
            }

            return result;
        } catch (error: any) {
            console.error('Erreur lors de la connexion Google (popup):', error);
            throw error;
        }
    },

    /**
     * Connexion avec Google via redirection
     * Recommandé pour mobile
     */
    signInWithGoogleRedirect: async (): Promise<void> => {
        try {
            await signInWithRedirect(auth, googleProvider);
        } catch (error: any) {
            console.error('Erreur lors de la connexion Google (redirect):', error);
            throw error;
        }
    },

    /**
     * Récupère le résultat de la redirection Google
     * À appeler au chargement de la page
     */
    getGoogleRedirectResult: async (): Promise<UserCredential | null> => {
        try {
            const result = await getRedirectResult(auth);

            if (result) {
                // Vérifier si le profil utilisateur existe, sinon le créer
                const user = result.user;
                const existingProfile = await userService.getUserProfile(user.uid);

                if (!existingProfile) {
                    const createdTime = formatCreatedTime(new Date());
                    await userService.createUserProfile({
                        uid: user.uid,
                        email: user.email || '',
                        display_name: user.displayName || 'User',
                        photo_url: user.photoURL || undefined,
                        presence: 'offline',
                        hasAcceptedPrivacyPolicy: false,
                        created_time: createdTime,
                        theme: 'dark',
                        language: 'en',
                        bookmarkedIds: []
                    });
                    console.log('Profil utilisateur Google créé (redirect):', {
                        uid: user.uid,
                        email: user.email,
                        created_time: createdTime
                    });
                }
            }

            return result;
        } catch (error: any) {
            console.error('Erreur lors de la récupération du résultat de redirection:', error);
            throw error;
        }
    },

    /**
     * Détecte si l'appareil est mobile
     */
    isMobileDevice: (): boolean => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
    },

    /**
     * Connexion Google intelligente (choisit automatiquement popup ou redirect)
     */
    signInWithGoogle: async (): Promise<UserCredential | void> => {
        if (authService.isMobileDevice()) {
            // Sur mobile, utiliser redirect pour éviter les problèmes de popup
            return authService.signInWithGoogleRedirect();
        } else {
            // Sur desktop, utiliser popup pour une meilleure UX
            return authService.signInWithGooglePopup();
        }
    }
};
