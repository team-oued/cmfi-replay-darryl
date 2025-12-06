# Intégration Stripe - Guide de Configuration

Ce document explique comment configurer l'intégration Stripe pour les paiements par carte bancaire.

## 📋 Vue d'ensemble

L'application utilise Stripe pour gérer les paiements d'abonnement mensuel à **1€/mois**.

### Composants créés

1. **`lib/stripeService.ts`** - Service côté client pour Stripe
2. **`components/StripeCheckout.tsx`** - Composant de paiement
3. **`screens/PaymentSuccessScreen.tsx`** - Écran de confirmation
4. **`screens/ManageSubscriptionScreen.tsx`** - Gestion d'abonnement (mis à jour)

## 🔧 Configuration

### 1. Créer un compte Stripe

1. Allez sur [https://stripe.com](https://stripe.com)
2. Créez un compte
3. Récupérez vos clés API dans le Dashboard

### 2. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet (copier depuis `.env.example`) :

```bash
VITE_STRIPE_PUBLIC_KEY=pk_test_votre_cle_publique_ici
```

**Important** : 
- Utilisez `pk_test_` pour le mode test
- Utilisez `pk_live_` pour la production
- **NE JAMAIS** commiter le fichier `.env` dans Git

### 3. Créer un produit dans Stripe

1. Dans le Dashboard Stripe, allez dans **Products**
2. Créez un nouveau produit "Abonnement Premium"
3. Ajoutez un prix récurrent : **1€/mois**
4. Notez l'ID du prix (commence par `price_`)

### 4. Configuration Firebase Functions

Vous devez créer une Firebase Function pour gérer les paiements de manière sécurisée.

#### Installation

```bash
cd functions
npm install stripe
npm install @stripe/stripe-js
```

#### Créer la fonction `create-checkout-session`

Créez `functions/src/stripe.ts` :

```typescript
import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

// Initialiser Stripe avec votre clé secrète
const stripe = new Stripe(functions.config().stripe.secret_key, {
    apiVersion: '2023-10-16',
});

export const createCheckoutSession = functions.https.onCall(async (data, context) => {
    // Vérifier que l'utilisateur est authentifié
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be authenticated'
        );
    }

    const { userId, planType, successUrl, cancelUrl } = data;

    try {
        // Créer ou récupérer le customer Stripe
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();

        let customerId = userData?.stripeCustomerId;

        if (!customerId) {
            // Créer un nouveau customer
            const customer = await stripe.customers.create({
                email: userData?.email,
                metadata: {
                    firebaseUID: userId,
                },
            });
            customerId = customer.id;

            // Sauvegarder l'ID du customer
            await admin.firestore().collection('users').doc(userId).update({
                stripeCustomerId: customerId,
            });
        }

        // Créer la session de paiement
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: 'price_VOTRE_PRICE_ID_ICI', // Remplacer par votre Price ID
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                userId,
                planType,
            },
        });

        return {
            sessionId: session.id,
            url: session.url,
        };
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw new functions.https.HttpsError('internal', 'Unable to create checkout session');
    }
});
```

#### Créer le webhook pour gérer les événements

Créez `functions/src/webhooks.ts` :

```typescript
import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

const stripe = new Stripe(functions.config().stripe.secret_key, {
    apiVersion: '2023-10-16',
});

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = functions.config().stripe.webhook_secret;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gérer les événements
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            await handleCheckoutSessionCompleted(session);
            break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            await handleSubscriptionChange(subscription);
            break;
        }
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) return;

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    // Calculer la date de fin
    const endDate = new Date(subscription.current_period_end * 1000);

    // Mettre à jour l'abonnement dans Firestore
    const userRef = admin.firestore().collection('users').doc(userId);
    const subscriptionsRef = admin.firestore().collection('subscription');

    const q = subscriptionsRef.where('user', '==', userRef);
    const querySnapshot = await q.get();

    const subscriptionData = {
        end_subscription: endDate.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
        isPremium: true,
        type_plan: 'monthly',
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
    };

    if (querySnapshot.empty) {
        await subscriptionsRef.add({
            ...subscriptionData,
            user: userRef,
        });
    } else {
        await querySnapshot.docs[0].ref.update(subscriptionData);
    }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
    // Trouver l'utilisateur par customer ID
    const usersRef = admin.firestore().collection('users');
    const userQuery = await usersRef.where('stripeCustomerId', '==', subscription.customer).get();

    if (userQuery.empty) return;

    const userId = userQuery.docs[0].id;
    const userRef = usersRef.doc(userId);

    const subscriptionsRef = admin.firestore().collection('subscription');
    const q = subscriptionsRef.where('user', '==', userRef);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) return;

    const isActive = subscription.status === 'active';
    const endDate = new Date(subscription.current_period_end * 1000);

    await querySnapshot.docs[0].ref.update({
        end_subscription: endDate.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
        isPremium: isActive,
        stripeSubscriptionId: subscription.id,
    });
}
```

### 5. Déployer les Functions

```bash
# Configurer la clé secrète Stripe
firebase functions:config:set stripe.secret_key="sk_test_votre_cle_secrete"
firebase functions:config:set stripe.webhook_secret="whsec_votre_webhook_secret"

# Déployer
firebase deploy --only functions
```

### 6. Configurer le Webhook Stripe

1. Dans le Dashboard Stripe, allez dans **Developers > Webhooks**
2. Cliquez sur "Add endpoint"
3. URL : `https://VOTRE_REGION-VOTRE_PROJECT.cloudfunctions.net/stripeWebhook`
4. Sélectionnez les événements :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copiez le "Signing secret" et configurez-le dans Firebase

### 7. Mettre à jour le code client

Dans `lib/stripeService.ts`, remplacez l'URL de l'API :

```typescript
const response = await fetch('https://VOTRE_REGION-VOTRE_PROJECT.cloudfunctions.net/createCheckoutSession', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
});
```

## 🧪 Test

### Mode Test

1. Utilisez les cartes de test Stripe :
   - **Succès** : `4242 4242 4242 4242`
   - **Échec** : `4000 0000 0000 0002`
   - Date d'expiration : n'importe quelle date future
   - CVC : n'importe quel 3 chiffres

2. Testez le flux complet :
   - Cliquez sur "Payer par carte" dans Manage Subscription
   - Remplissez le formulaire avec une carte de test
   - Vérifiez la redirection vers `/payment-success`
   - Vérifiez que l'abonnement est activé dans Firestore

## 📱 Flux utilisateur

1. **Non-abonné** → Clique sur "Manage Subscription"
2. Voit le plan mensuel à 1€
3. Clique sur "Payer par carte"
4. Modal Stripe Checkout s'ouvre
5. Remplit les informations de carte
6. Stripe traite le paiement
7. Webhook met à jour Firestore
8. Redirection vers `/payment-success`
9. L'utilisateur est maintenant Premium

## 🔒 Sécurité

- ✅ Clé publique côté client (safe)
- ✅ Clé secrète côté serveur uniquement
- ✅ Webhook avec signature vérifiée
- ✅ Authentification Firebase requise
- ✅ Validation des données côté serveur

## 📊 Suivi

Dans le Dashboard Stripe, vous pouvez :
- Voir tous les paiements
- Gérer les abonnements
- Voir les métriques
- Gérer les remboursements

## 🆘 Dépannage

### Le paiement ne fonctionne pas

1. Vérifiez les clés API dans `.env`
2. Vérifiez que les Functions sont déployées
3. Vérifiez les logs Firebase Functions
4. Vérifiez les webhooks dans Stripe Dashboard

### L'abonnement n'est pas activé

1. Vérifiez que le webhook est configuré
2. Vérifiez les logs du webhook dans Stripe
3. Vérifiez la collection `subscription` dans Firestore

## 📝 Notes

- Le prix est fixé à **1€/mois**
- L'abonnement se renouvelle automatiquement
- L'utilisateur peut annuler à tout moment
- Les webhooks gèrent automatiquement les renouvellements et annulations
