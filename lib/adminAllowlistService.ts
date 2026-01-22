import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';

const ALLOWLIST_COLLECTION = 'admin_allowlist';

export interface AdminAllowlistEntry {
    id?: string;
    email: string;
    isActive: boolean;
    role?: 'admin' | 'editor';
    createdAt: Date | Timestamp;
    createdBy?: string;
}

/**
 * Service pour gérer l'allowlist admin
 */
export const adminAllowlistService = {
    /**
     * Vérifie si un email est dans l'allowlist
     */
    async isEmailAllowed(email: string): Promise<boolean> {
        try {
            const q = query(
                collection(db, ALLOWLIST_COLLECTION),
                where('email', '==', email.toLowerCase()),
                where('isActive', '==', true)
            );
            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (error) {
            console.error('Error checking allowlist:', error);
            return false;
        }
    },

    /**
     * Récupère toutes les entrées de l'allowlist (admin only)
     */
    async getAllEntries(): Promise<AdminAllowlistEntry[]> {
        try {
            const snapshot = await getDocs(collection(db, ALLOWLIST_COLLECTION));
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as AdminAllowlistEntry));
        } catch (error) {
            console.error('Error getting allowlist entries:', error);
            return [];
        }
    },

    /**
     * Ajoute un email à l'allowlist (admin only)
     */
    async addEmail(email: string, role: 'admin' | 'editor' = 'admin', createdBy?: string): Promise<string> {
        try {
            const entry = {
                email: email.toLowerCase(),
                isActive: true,
                role,
                createdAt: Timestamp.now(),
                createdBy: createdBy || null
            };
            const docRef = await addDoc(collection(db, ALLOWLIST_COLLECTION), entry);
            return docRef.id;
        } catch (error) {
            console.error('Error adding email to allowlist:', error);
            throw error;
        }
    },

    /**
     * Active/désactive un email dans l'allowlist (admin only)
     */
    async toggleEmailStatus(id: string, isActive: boolean): Promise<void> {
        try {
            await updateDoc(doc(db, ALLOWLIST_COLLECTION, id), {
                isActive,
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            console.error('Error toggling email status:', error);
            throw error;
        }
    }
};


