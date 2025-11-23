# Implémentation de la fonctionnalité Sign Up

## Résumé des modifications

La fonctionnalité de Sign Up a été complètement implémentée avec la création automatique d'un profil utilisateur dans Firestore.

## Format du profil utilisateur créé

Lorsqu'un utilisateur s'inscrit (via email/password ou Google), un document est créé dans la collection `users` avec la structure suivante :

```json
{
  "created_time": "23 novembre 2025 à 21:23:20 UTC+1",
  "email": "pekacoe@mail.com",
  "hasAcceptedPrivacyPolicy": false,
  "presence": "offline",
  "uid": "MyaFIFoe4Ud74KVgM6RFffijQJi2",
  "display_name": "Nom Complet",
  "theme": "dark",
  "language": "en",
  "bookmarkedIds": []
}
```

## Fichiers modifiés

### 1. `screens/AuthScreen.tsx`
- **Ajout** : Import de `userService` depuis `../lib/firestore`
- **Ajout** : Fonction `formatCreatedTime()` pour formater la date au format demandé
- **Modification** : Fonction `handleAuth()` pour créer le profil utilisateur dans Firestore immédiatement après le sign up
- Le profil est créé avec :
  - `uid` : ID de l'utilisateur Firebase Auth
  - `email` : Email de l'utilisateur
  - `display_name` : Nom complet saisi dans le formulaire
  - `created_time` : Date formatée "DD MMMM YYYY à HH:mm:ss UTC+X"
  - `presence` : "offline" par défaut
  - `hasAcceptedPrivacyPolicy` : false par défaut
  - `theme` : "dark" par défaut
  - `language` : Langue actuelle de l'application
  - `bookmarkedIds` : Tableau vide

### 2. `lib/authService.ts`
- **Ajout** : Import de `userService` depuis `./firestore`
- **Ajout** : Fonction `formatCreatedTime()` pour formater la date
- **Modification** : `signInWithGooglePopup()` pour créer automatiquement le profil utilisateur s'il n'existe pas
- **Modification** : `getGoogleRedirectResult()` pour créer automatiquement le profil utilisateur s'il n'existe pas lors de la redirection Google
- Les profils Google sont créés avec les mêmes champs, en utilisant `displayName` et `photoURL` de Google si disponibles

### 3. `lib/i18n.ts`
- **Ajout** : Clé de traduction `fillAllFields` (EN: "Please fill in all fields", FR: "Veuillez remplir tous les champs")
- **Ajout** : Clé de traduction `authError` (EN: "An error occurred during authentication", FR: "Une erreur est survenue lors de l'authentification")

## Fonctionnement

### Sign Up avec Email/Password
1. L'utilisateur remplit le formulaire (nom complet, email, mot de passe)
2. Clic sur "Get Started"
3. Création du compte Firebase Auth
4. Création immédiate du profil utilisateur dans Firestore avec le format demandé
5. Connexion automatique

### Sign Up/Login avec Google
1. L'utilisateur clique sur "Continue with Google"
2. Authentification Google (popup ou redirect selon l'appareil)
3. Vérification si le profil existe déjà dans Firestore
4. Si non, création automatique du profil avec les informations Google
5. Connexion automatique

## Format de la date

La date `created_time` est formatée selon le format français :
- Format : "DD MMMM YYYY à HH:mm:ss UTC+X"
- Exemple : "23 novembre 2025 à 21:23:20 UTC+1"
- Les mois sont en français (janvier, février, mars, etc.)
- Le décalage UTC est calculé automatiquement selon le fuseau horaire de l'utilisateur

## Notes importantes

- Le profil est créé **immédiatement** après le sign up, avant même que `AppContext` ne détecte le changement d'état d'authentification
- Cela évite les doublons et garantit que le profil existe toujours quand l'utilisateur est connecté
- Le `AppContext` a également une logique de fallback pour créer le profil s'il n'existe pas (lignes 84-94), mais avec la nouvelle implémentation, cette logique ne devrait plus être nécessaire pour les nouveaux utilisateurs
- La présence est définie à "offline" par défaut lors de la création, elle sera mise à jour par l'application selon l'activité de l'utilisateur
