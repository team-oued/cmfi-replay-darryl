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
            console.log('🔄 Tentative de connexion Google via popup...');
            
            // Vérifier si les popups sont possibles
            if (typeof window === 'undefined') {
                throw new Error('Window object not available');
            }

            const result = await signInWithPopup(auth, googleProvider);
            console.log('✅ Popup Google réussie, utilisateur:', result.user.email);

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
                console.log('✅ Profil utilisateur Google créé:', {
                    uid: user.uid,
                    email: user.email,
                    created_time: createdTime
                });
            } else {
                console.log('✅ Profil utilisateur existant trouvé');
            }

            return result;
        } catch (error: any) {
            console.error('❌ Erreur lors de la connexion Google (popup):', error);
            console.error('Code d\'erreur:', error.code);
            console.error('Message d\'erreur:', error.message);
            
            // Si la popup est bloquée, signaler pour utiliser le fallback
            if (error.code === 'auth/popup-blocked') {
                console.log('⚠️ Popup bloquée, signalement pour fallback...');
                throw new Error('POPUP_BLOCKED');
            }
            
            throw error;
        }
    },

    /**
     * Connexion avec Google via redirection
     * Recommandé pour mobile
     */
    signInWithGoogleRedirect: async (): Promise<void> => {
        try {
            console.log('Tentative de connexion Google via redirection...');
            await signInWithRedirect(auth, googleProvider);
            // Note: La fonction ne retourne rien car l'utilisateur sera redirigé
            // Le résultat sera récupéré via getGoogleRedirectResult() après le retour
        } catch (error: any) {
            console.error('Erreur lors de la connexion Google (redirect):', error);
            console.error('Code d\'erreur:', error.code);
            console.error('Message d\'erreur:', error.message);
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
                console.log('✅ Résultat de redirection Google trouvé:', result.user.email);
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
                    console.log('✅ Profil utilisateur Google créé (redirect):', {
                        uid: user.uid,
                        email: user.email,
                        created_time: createdTime
                    });
                } else {
                    console.log('✅ Profil utilisateur existant trouvé (redirect)');
                }
            }
            // Note: Si result est null, c'est normal - soit aucune redirection n'a eu lieu,
            // soit l'utilisateur est déjà authentifié via onAuthStateChanged

            return result;
        } catch (error: any) {
            // Ne logger que les vraies erreurs de configuration
            if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/unauthorized-domain') {
                console.error('❌ Erreur de configuration Firebase:', error.message);
                throw error;
            }
            // Pour les autres erreurs, les logger mais ne pas les propager si c'est juste qu'il n'y a pas de résultat
            if (error.message && !error.message.includes('no redirect result')) {
                console.error('❌ Erreur lors de la récupération du résultat de redirection:', error);
            }
            // Ne pas throw pour éviter d'afficher des erreurs inutiles à l'utilisateur
            return null;
        }
    },

    /**
     * Détecte si l'appareil est mobile
     */
    isMobileDevice: (): boolean => {
        if (typeof window === 'undefined' || !navigator) {
            return false;
        }
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
    },

    /**
     * Connexion Google intelligente (choisit automatiquement popup ou redirect)
     * Essaie d'abord la popup, puis fallback sur redirect si bloquée
     */
    signInWithGoogle: async (): Promise<UserCredential | void> => {
        if (authService.isMobileDevice()) {
            // Sur mobile, utiliser redirect pour éviter les problèmes de popup
            console.log('📱 Appareil mobile détecté, utilisation de la redirection');
            return authService.signInWithGoogleRedirect();
        } else {
            // Sur desktop, essayer popup d'abord
            console.log('💻 Appareil desktop détecté, tentative avec popup');
            try {
                return await authService.signInWithGooglePopup();
            } catch (error: any) {
                // Si la popup est bloquée, utiliser la redirection comme fallback
                if (error.message === 'POPUP_BLOCKED' || error.code === 'auth/popup-blocked') {
                    console.log('⚠️ Popup bloquée, utilisation de la redirection comme fallback');
                    return authService.signInWithGoogleRedirect();
                }
                // Sinon, propager l'erreur
                throw error;
            }
        }
    }
};
