import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, DocumentReference, Timestamp } from 'firebase/firestore';

export interface Subscription {
    end_subscription: string;
    isPremium: boolean;
    type_plan: 'free' | 'monthly' | 'yearly' | 'lifetime';
    user: DocumentReference | string;
}

const SUBSCRIPTIONS_COLLECTION = 'subscription';

export const subscriptionService = {
    /**
     * Récupère l'abonnement d'un utilisateur
     */
    async getUserSubscription(userUid: string): Promise<Subscription | null> {
        try {
            console.log('🔍 [getUserSubscription] Fetching subscription for user:', userUid);
            const userRef = doc(db, 'users', userUid);
            console.log('🔍 [getUserSubscription] User reference:', userRef.path);
            
            const q = query(
                collection(db, SUBSCRIPTIONS_COLLECTION),
                where('user', '==', userRef)
            );
            console.log('🔍 [getUserSubscription] Query:', q);

            const querySnapshot = await getDocs(q);
            console.log('🔍 [getUserSubscription] Query result:', {
                size: querySnapshot.size,
                empty: querySnapshot.empty,
                docs: querySnapshot.docs.map(d => d.data())
            });

            if (querySnapshot.empty) {
                console.log('🔍 [getUserSubscription] No subscription found for user:', userUid);
                return null;
            }

            const subscriptionDoc = querySnapshot.docs[0];
            const subscriptionData = subscriptionDoc.data();
            console.log('🔍 [getUserSubscription] Found subscription:', {
                id: subscriptionDoc.id,
                ...subscriptionData
            });
            return subscriptionData as Subscription;
        } catch (error) {
            console.error('Error getting user subscription:', error);
            return null;
        }
    },

    /**
     * Vérifie si un utilisateur est premium
     */
    async isUserPremium(userUid: string): Promise<boolean> {
        try {
            const subscription = await this.getUserSubscription(userUid);

            if (!subscription) {
                return false;
            }

            // Vérifier si l'abonnement est premium et non expiré
            if (!subscription.isPremium) {
                return false;
            }

            // Si c'est un abonnement à vie, toujours premium
            if (subscription.type_plan === 'lifetime') {
                return true;
            }

            // Vérifier la date d'expiration
            const endDate = new Date(subscription.end_subscription);
            const now = new Date();

            return endDate > now;
        } catch (error) {
            console.error('Error checking premium status:', error);
            return false;
        }
    },

    /**
     * Crée un abonnement gratuit pour un nouvel utilisateur
     */
    async createFreeSubscription(userUid: string): Promise<void> {
        try {
            const userRef = doc(db, 'users', userUid);

            // Vérifier si l'utilisateur a déjà un abonnement
            const existing = await this.getUserSubscription(userUid);
            if (existing) {
                console.log('User already has a subscription');
                return;
            }

            const subscription: Subscription = {
                end_subscription: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
                isPremium: false,
                type_plan: 'free',
                user: userRef
            };

            await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), subscription);
            console.log('Free subscription created for user:', userUid);
        } catch (error) {
            console.error('Error creating free subscription:', error);
            throw error;
        }
    },

    /**
     * Active un abonnement premium via un coupon
     */
    async activatePremiumSubscription(
        userUid: string,
        planType: 'monthly' | 'yearly' | 'lifetime'
    ): Promise<void> {
        try {
            const userRef = doc(db, 'users', userUid);
            console.log("Ref user", userRef)

            // Calculer la date de fin d'abonnement
            let endDate = new Date();

            switch (planType) {
                case 'monthly':
                    endDate.setMonth(endDate.getMonth() + 1);
                    break;
                case 'yearly':
                    endDate.setFullYear(endDate.getFullYear() + 1);
                    break;
                case 'lifetime':
                    // Pour un abonnement à vie, mettre une date très lointaine
                    endDate.setFullYear(endDate.getFullYear() + 100);
                    break;
            }

            const endSubscription = endDate.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

            // Chercher l'abonnement existant
            const q = query(
                collection(db, SUBSCRIPTIONS_COLLECTION),
                where('user', '==', userRef)
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // Créer un nouvel abonnement premium
                const subscription: Subscription = {
                    end_subscription: endSubscription,
                    isPremium: true,
                    type_plan: planType,
                    user: userRef
                };

                await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), subscription);
                console.log('Premium subscription created for user:', userUid);
            } else {
                // Mettre à jour l'abonnement existant
                const subscriptionDoc = querySnapshot.docs[0];
                await updateDoc(subscriptionDoc.ref, {
                    end_subscription: endSubscription,
                    isPremium: true,
                    type_plan: planType
                });
                console.log('Subscription updated to premium for user:', userUid);
            }
        } catch (error) {
            console.error('Error activating premium subscription:', error);
            throw error;
        }
    },

    /**
     * Désactive l'abonnement premium (retour au gratuit)
     */
    async deactivatePremiumSubscription(userUid: string): Promise<void> {
        try {
            const userRef = doc(db, 'users', userUid);

            const q = query(
                collection(db, SUBSCRIPTIONS_COLLECTION),
                where('user', '==', userRef)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const subscriptionDoc = querySnapshot.docs[0];
                await updateDoc(subscriptionDoc.ref, {
                    end_subscription: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
                    isPremium: false,
                    type_plan: 'free'
                });
                console.log('Subscription downgraded to free for user:', userUid);
            }
        } catch (error) {
            console.error('Error deactivating premium subscription:', error);
            throw error;
        }
    },

    /**
     * Obtient les informations détaillées de l'abonnement
     */
    async getSubscriptionDetails(userUid: string): Promise<{
        isPremium: boolean;
        planType: string;
        endDate: Date | null;
        daysRemaining: number | null;
    }> {
        console.log('🔍 [subscriptionService] getSubscriptionDetails called for user:', userUid);
        try {
            const subscription = await this.getUserSubscription(userUid);

            if (!subscription) {
                console.log('🔍 [subscriptionService] No subscription found, returning free tier');
                return {
                    isPremium: false,
                    planType: 'free',
                    endDate: null,
                    daysRemaining: null
                };
            }

            const endDate = new Date(subscription.end_subscription);
            const now = new Date();
            console.log('🔍 [subscriptionService] Current date:', now);
            console.log('🔍 [subscriptionService] Subscription end date:', endDate);
            
            const daysRemaining = subscription.type_plan === 'lifetime'
                ? null
                : Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
            console.log('🔍 [subscriptionService] Days remaining:', daysRemaining);

            const isPremiumStatus = subscription.isPremium && (subscription.type_plan === 'lifetime' || endDate > now);
            console.log('🔍 [subscriptionService] Calculated isPremium:', isPremiumStatus);
            
            const result = {
                isPremium: isPremiumStatus,
                planType: subscription.type_plan,
                endDate: subscription.type_plan === 'lifetime' ? null : endDate,
                daysRemaining
            };
            
            console.log('🔍 [subscriptionService] Final subscription details:', result);
            return result;
        } catch (error) {
            console.error('Error getting subscription details:', error);
            return {
                isPremium: false,
                planType: 'free',
                endDate: null,
                daysRemaining: null
            };
        }
    }
};
