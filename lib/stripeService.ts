import { loadStripe, Stripe } from '@stripe/stripe-js';

// Clé publique Stripe (à remplacer par votre clé publique)
// IMPORTANT: Cette clé doit être stockée dans les variables d'environnement
const STRIPE_PUBLIC_KEY = (import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY || 'pk_test_YOUR_KEY_HERE';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
    }
    return stripePromise;
};

// Prix de l'abonnement mensuel (en centimes)
export const MONTHLY_PRICE_CENTS = 100; // 1€
export const MONTHLY_PRICE_DISPLAY = '1€';

// Types pour les sessions de paiement
export interface CreateCheckoutSessionRequest {
    userId: string;
    planType: 'monthly';
    successUrl: string;
    cancelUrl: string;
}

export interface CreateCheckoutSessionResponse {
    sessionId: string;
    url?: string;
}

/**
 * Crée une session de paiement Stripe
 * Cette fonction doit appeler votre backend (Firebase Functions)
 */
export const createCheckoutSession = async (
    request: CreateCheckoutSessionRequest
): Promise<CreateCheckoutSessionResponse> => {
    try {
        // TODO: Remplacer par l'URL de votre Firebase Function
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
};

/**
 * Redirige vers la page de paiement Stripe
 */
export const redirectToCheckout = async (sessionId: string) => {
    const stripe = await getStripe();
    if (!stripe) {
        throw new Error('Stripe failed to load');
    }

    // Utiliser la méthode correcte pour Stripe.js v3+
    const result = await stripe.redirectToCheckout({ sessionId });

    if (result.error) {
        console.error('Error redirecting to checkout:', result.error);
        throw result.error;
    }
};

/**
 * Crée un portail client Stripe pour gérer l'abonnement
 */
export const createCustomerPortalSession = async (userId: string): Promise<string> => {
    try {
        // TODO: Remplacer par l'URL de votre Firebase Function
        const response = await fetch('/api/create-portal-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            throw new Error('Failed to create portal session');
        }

        const data = await response.json();
        return data.url;
    } catch (error) {
        console.error('Error creating portal session:', error);
        throw error;
    }
};
