import { auth, googleProvider } from './firebase';
import { signInWithPopup, UserCredential, signOut as firebaseSignOut } from 'firebase/auth';
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
                console.error('❌ La connexion a échoué car la popup a été bloquée. Veuillez autoriser les popups pour ce site.');
            }
            throw error;
        }
    },

    /**
     * Connexion Google (uniquement via popup)
     */
    signInWithGoogle: async (): Promise<UserCredential> => {
        console.log('💻 Tentative de connexion Google via popup...');
        try {
            return await authService.signInWithGooglePopup();
        } catch (error: any) {
            console.error('❌ Erreur lors de la connexion Google:', error);
            throw error;
        }
    },

    /**
     * Déconnexion de l'utilisateur
     */
    signOut: async (): Promise<void> => {
        try {
            // Mettre à jour le statut de présence avant la déconnexion
            const user = auth.currentUser;
            if (user) {
                try {
                    // Mettre à jour le statut à offline ET lastSeen pour éviter qu'il soit remis à online
                    await userService.updateUserProfile(user.uid, { 
                        presence: 'offline',
                        lastSeen: new Date() // Mettre à jour lastSeen pour éviter qu'il soit remis à online
                    });
                } catch (error) {
                    console.error('Erreur lors de la mise à jour du statut hors ligne:', error);
                }
            }
            
            // Déconnexion de Firebase
            await firebaseSignOut(auth);
            console.log('✅ Déconnexion réussie');
        } catch (error) {
            console.error('❌ Erreur lors de la déconnexion:', error);
            throw error;
        }
    }
};
