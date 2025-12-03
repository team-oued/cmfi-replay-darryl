import { db } from './firebase';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { subscriptionService } from './subscriptionService';

export interface Coupon {
  code: string;
  is_active: boolean;
  paid_by: string;
  type_coupon: 'monthly' | 'yearly' | 'lifetime';
  used_by?: string;
  used_at?: Date;
}

export const checkCoupon = async (code: string): Promise<{ success: boolean; data?: Coupon; error?: string }> => {
  try {
    console.log('🔍 Checking coupon with code:', code);

    // Chercher dans la collection "coupon" (singulier) avec le champ "code"
    const couponRef = collection(db, 'coupon');
    const q = query(couponRef, where('code', '==', code), limit(1));

    console.log('📄 Querying collection "coupon" with code:', code);

    const querySnapshot = await getDocs(q);
    console.log('✅ Query returned documents:', querySnapshot.size);

    if (querySnapshot.empty) {
      console.log('❌ No coupon found with this code');
      return { success: false, error: 'Code promo invalide' };
    }

    const couponDoc = querySnapshot.docs[0];
    const couponData = { ...couponDoc.data(), id: couponDoc.id } as Coupon & { id: string };
    console.log('📦 Coupon data:', couponData);

    return { success: true, data: couponData };
  } catch (error) {
    console.error('❌ Error checking coupon:', error);
    return { success: false, error: 'Une erreur est survenue' };
  }
};

export const redeemCoupon = async (code: string, userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🎫 Redeeming coupon:', code, 'for user:', userId);

    // Trouver le coupon d'abord
    const checkResult = await checkCoupon(code);

    if (!checkResult.success || !checkResult.data) {
      return { success: false, error: checkResult.error || 'Code promo invalide' };
    }

    const couponData = checkResult.data as Coupon & { id: string };

    if (!couponData.is_active) {
      console.log('❌ Coupon already used');
      return { success: false, error: 'Ce code a déjà été utilisé' };
    }

    // Chercher le document pour le mettre à jour
    const couponRef = collection(db, 'coupon');
    const q = query(couponRef, where('code', '==', code), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: 'Code promo introuvable' };
    }

    const couponDoc = querySnapshot.docs[0];

    // Activer l'abonnement premium pour l'utilisateur
    try {
      await subscriptionService.activatePremiumSubscription(userId, couponData.type_coupon);
      console.log('✅ Premium subscription activated');
    } catch (error) {
      console.error('❌ Error activating subscription:', error);
      return { success: false, error: 'Erreur lors de l\'activation de l\'abonnement' };
    }

    // Mettre à jour le coupon comme utilisé
    await updateDoc(couponDoc.ref, {
      is_active: false,
      used_by: userId,
      used_at: serverTimestamp()
    });

    console.log('✅ Coupon redeemed successfully');

    return { success: true };
  } catch (error) {
    console.error('❌ Error redeeming coupon:', error);
    return { success: false, error: 'Une erreur est survenue lors de la validation du code' };
  }
};
