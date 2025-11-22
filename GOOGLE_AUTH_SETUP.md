# Configuration de l'authentification Google pour CMFI Replay

## Étapes à suivre dans la Console Firebase

### 1. Accéder à la Console Firebase
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet : **c-m-f-i-replay-f-63xui3**

### 2. Activer Google Sign-In
1. Dans le menu de gauche, cliquez sur **Authentication** (Authentification)
2. Cliquez sur l'onglet **Sign-in method** (Méthode de connexion)
3. Dans la liste des fournisseurs, trouvez **Google**
4. Cliquez sur **Google** pour l'activer
5. Activez le bouton **Enable** (Activer)
6. Configurez les informations suivantes :
   - **Nom du projet** : CMFI Replay (ou le nom que vous souhaitez afficher)
   - **Email d'assistance** : Sélectionnez votre email dans la liste déroulante
7. Cliquez sur **Save** (Enregistrer)

### 3. Configurer les domaines autorisés
1. Toujours dans **Authentication** > **Settings** (Paramètres)
2. Allez dans l'onglet **Authorized domains** (Domaines autorisés)
3. Assurez-vous que les domaines suivants sont autorisés :
   - `localhost` (pour le développement local)
   - Votre domaine de production (si vous en avez un)

### 4. (Optionnel) Obtenir les identifiants OAuth
Si vous souhaitez personnaliser davantage l'expérience :
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet Firebase
3. Allez dans **APIs & Services** > **Credentials**
4. Vous y trouverez vos identifiants OAuth 2.0

## Comment tester

### En développement local
1. Lancez votre application : `npm run dev`
2. Allez sur la page de connexion
3. Cliquez sur le bouton **"Continuer avec Google"**
4. Une popup s'ouvrira (ou une redirection sur mobile)
5. Sélectionnez votre compte Google
6. Autorisez l'application
7. Vous serez automatiquement connecté !

### Sur mobile
L'application détecte automatiquement si vous êtes sur mobile et utilisera une redirection au lieu d'une popup pour une meilleure compatibilité.

## Fonctionnalités implémentées

✅ Connexion Google via popup (desktop)
✅ Connexion Google via redirection (mobile)
✅ Détection automatique du type d'appareil
✅ Gestion des erreurs (popup bloquée, connexion annulée, etc.)
✅ États de chargement
✅ Récupération automatique du résultat de redirection

## Gestion des erreurs

L'application gère automatiquement les erreurs suivantes :
- Popup fermée par l'utilisateur
- Popup bloquée par le navigateur
- Connexion annulée
- Erreurs réseau
- Autres erreurs Firebase

## Code implémenté

### Fichiers modifiés/créés :
1. **lib/firebase.ts** - Ajout du GoogleAuthProvider
2. **lib/authService.ts** - Service d'authentification Google (NOUVEAU)
3. **screens/AuthScreen.tsx** - Intégration de la connexion Google

### Utilisation du service :
```typescript
import { authService } from '../lib/authService';

// Connexion intelligente (popup ou redirect selon l'appareil)
await authService.signInWithGoogle();

// Ou spécifiquement :
await authService.signInWithGooglePopup(); // Pour desktop
await authService.signInWithGoogleRedirect(); // Pour mobile
```

## Prochaines étapes recommandées

1. ✅ Activer Google Sign-In dans Firebase Console (voir ci-dessus)
2. 🔄 Tester la connexion en local
3. 📱 Tester sur mobile
4. 🎨 (Optionnel) Personnaliser l'écran de consentement OAuth dans Google Cloud Console
5. 🚀 Déployer en production

## Dépannage

### La popup est bloquée
- Assurez-vous que les popups sont autorisées pour localhost
- Sur mobile, l'application utilisera automatiquement la redirection

### Erreur "This domain is not authorized"
- Vérifiez que localhost est dans les domaines autorisés de Firebase
- Vérifiez que votre domaine de production est autorisé

### L'utilisateur n'est pas redirigé après la connexion
- Vérifiez que `useEffect` dans AuthScreen.tsx s'exécute correctement
- Vérifiez la console pour les erreurs

## Support

Pour plus d'informations :
- [Documentation Firebase Authentication](https://firebase.google.com/docs/auth/web/google-signin)
- [Documentation Google Sign-In](https://developers.google.com/identity/sign-in/web)
