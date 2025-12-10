import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const APP_SETTINGS_COLLECTION = 'appSettings';
const GLOBAL_SETTINGS_DOC = 'global';

export interface AppSettings {
    premiumForAll: boolean;
    updatedAt: Date;
}

export const appSettingsService = {
    /**
     * Récupère les paramètres globaux de l'application
     */
    async getGlobalSettings(): Promise<AppSettings> {
        try {
            const docRef = doc(db, APP_SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as AppSettings;
            } else {
                // Créer les paramètres par défaut s'ils n'existent pas
                const defaultSettings: AppSettings = {
                    premiumForAll: false,
                    updatedAt: new Date()
                };
                await setDoc(docRef, defaultSettings);
                return defaultSettings;
            }
        } catch (error) {
            console.error('Error getting app settings:', error);
            // Retourner des valeurs par défaut en cas d'erreur
            return {
                premiumForAll: false,
                updatedAt: new Date()
            };
        }
    },

    /**
     * Met à jour le paramètre premiumForAll
     */
    async setPremiumForAll(enabled: boolean): Promise<boolean> {
        try {
            const docRef = doc(db, APP_SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC);
            await updateDoc(docRef, {
                premiumForAll: enabled,
                updatedAt: new Date()
            });
            return true;
        } catch (error) {
            console.error('Error updating premiumForAll setting:', error);
            return false;
        }
    },

    /**
     * Vérifie si l'accès premium est activé pour tous
     */
    async isPremiumForAll(): Promise<boolean> {
        try {
            const settings = await this.getGlobalSettings();
            return settings.premiumForAll || false;
        } catch (error) {
            console.error('Error checking premiumForAll setting:', error);
            return false;
        }
    }
};
