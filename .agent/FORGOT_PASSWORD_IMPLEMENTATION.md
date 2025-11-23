# Implémentation de la fonctionnalité Forgot Password

## Résumé

La fonctionnalité "Forgot Password" (Mot de passe oublié) a été complètement implémentée avec l'envoi réel d'emails de réinitialisation via Firebase Authentication.

## Fonctionnement

### Flux utilisateur

1. **Accès au formulaire**
   - L'utilisateur clique sur "Forgot Password?" depuis l'écran de connexion
   - Il est redirigé vers le formulaire de réinitialisation

2. **Saisie de l'email**
   - L'utilisateur entre son adresse email
   - Clic sur "Send Reset Link" (Envoyer le lien de réinitialisation)

3. **Envoi de l'email**
   - Firebase Auth envoie automatiquement un email à l'adresse fournie
   - L'email contient un lien sécurisé pour réinitialiser le mot de passe

4. **Confirmation**
   - Un message de confirmation s'affiche
   - L'utilisateur peut retourner à l'écran de connexion

5. **Réinitialisation**
   - L'utilisateur clique sur le lien dans l'email
   - Il est redirigé vers une page Firebase pour définir un nouveau mot de passe
   - Après réinitialisation, il peut se connecter avec le nouveau mot de passe

## Modifications apportées

### `screens/AuthScreen.tsx`

#### Imports
```typescript
import { sendPasswordResetEmail } from 'firebase/auth';
```

#### État
```typescript
const [resetEmail, setResetEmail] = useState('');
```

#### Fonction `handleForgotPassword`
Nouvelle fonction qui gère l'envoi de l'email de réinitialisation :

```typescript
const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
        setError(t('fillAllFields') || 'Veuillez entrer votre adresse email');
        return;
    }

    setAuthLoading(true);
    setError('');

    try {
        await sendPasswordResetEmail(auth, resetEmail);
        setResetRequested(true);
        console.log('Email de réinitialisation envoyé à:', resetEmail);
    } catch (error: any) {
        // Gestion des erreurs
    } finally {
        setAuthLoading(false);
    }
};
```

#### Formulaire
Le formulaire a été mis à jour pour :
- Utiliser un état séparé `resetEmail` pour l'email de réinitialisation
- Appeler `handleForgotPassword` lors de la soumission
- Afficher un état de chargement pendant l'envoi
- Réinitialiser le champ email lors du retour à la connexion

## Gestion des erreurs

### Codes d'erreur Firebase Auth

| Code d'erreur | Message affiché | Action |
|---------------|-----------------|--------|
| `auth/user-not-found` | (Message de succès) | Pour des raisons de sécurité, on affiche le même message de succès |
| `auth/invalid-email` | "Adresse email invalide" | L'utilisateur doit corriger l'email |
| `auth/too-many-requests` | "Trop de tentatives. Veuillez réessayer plus tard." | Protection contre les abus |

### Sécurité

Pour des raisons de sécurité, même si l'email n'existe pas dans la base de données, le système affiche un message de succès. Cela empêche les attaquants de déterminer quels emails sont enregistrés dans le système.

## Configuration Firebase

### Email de réinitialisation

Firebase Auth envoie automatiquement un email avec :
- Un lien sécurisé valide pendant 1 heure
- Le nom de l'application (CMFI Replay)
- Des instructions claires

### Personnalisation (optionnel)

Pour personnaliser l'email, vous pouvez :
1. Aller dans la console Firebase
2. Authentication > Templates
3. Modifier le template "Password reset"
4. Personnaliser le contenu, le sujet, et le design

## Messages de traduction

Les clés de traduction utilisées :
- `forgotPasswordScreenTitle` : "Forgot Password" / "Mot de passe oublié"
- `forgotPasswordInstruction` : Instructions pour l'utilisateur
- `sendResetLink` : "Send Reset Link" / "Envoyer le lien de réinitialisation"
- `resetLinkSent` : "Reset Link Sent" / "Lien de réinitialisation envoyé"
- `resetLinkSentInstruction` : Message de confirmation
- `backToLogin` : "Back to Login" / "Retour à la connexion"
- `fillAllFields` : "Please fill in all fields" / "Veuillez remplir tous les champs"

## Test de la fonctionnalité

### Test manuel

1. Aller sur l'écran de connexion
2. Cliquer sur "Forgot Password?"
3. Entrer une adresse email valide
4. Cliquer sur "Send Reset Link"
5. Vérifier la boîte de réception de l'email
6. Cliquer sur le lien dans l'email
7. Définir un nouveau mot de passe
8. Se connecter avec le nouveau mot de passe

### Points à vérifier

- ✅ L'email est bien envoyé
- ✅ Le lien fonctionne
- ✅ Le nouveau mot de passe est accepté
- ✅ Les erreurs sont bien gérées
- ✅ Le message de succès s'affiche
- ✅ Le retour à la connexion fonctionne

## Limitations

- Le lien de réinitialisation expire après 1 heure
- Un utilisateur ne peut demander qu'un nombre limité de réinitialisations par heure (protection Firebase)
- L'email doit être configuré dans Firebase (déjà fait)

## Améliorations futures possibles

1. **Email personnalisé** : Créer un template d'email personnalisé avec le branding CMFI
2. **Page de réinitialisation personnalisée** : Au lieu d'utiliser la page Firebase par défaut, créer une page personnalisée dans l'application
3. **Vérification en deux étapes** : Ajouter une couche de sécurité supplémentaire
4. **Historique des réinitialisations** : Logger les demandes de réinitialisation pour détecter les abus
