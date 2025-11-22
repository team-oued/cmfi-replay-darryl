import { auth, googleProvider } from './firebase';
import {
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    UserCredential
} from 'firebase/auth';

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
