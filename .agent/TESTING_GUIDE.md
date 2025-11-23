# Guide de test - Fonctionnalités d'authentification

## Préparation

Avant de commencer les tests, assurez-vous que :
- [ ] L'application est lancée (`npm run dev`)
- [ ] Firebase est correctement configuré
- [ ] Vous avez accès à une boîte email de test

---

## Test 1 : Sign Up avec Email/Password

### Objectif
Vérifier que l'inscription par email fonctionne et crée bien le profil utilisateur.

### Étapes

1. **Accéder à l'écran Sign Up**
   - Ouvrir l'application
   - Cliquer sur "Sign Up" depuis l'écran de connexion
   - ✅ L'écran Sign Up s'affiche

2. **Remplir le formulaire**
   - Nom complet : `Test User`
   - Email : `test@example.com` (utilisez un email de test)
   - Mot de passe : `Test123456!`
   - ✅ Les champs sont bien remplis

3. **Soumettre le formulaire**
   - Cliquer sur "Get Started"
   - ✅ Un indicateur de chargement s'affiche
   - ✅ Pas de message d'erreur

4. **Vérifier la connexion**
   - ✅ Redirection automatique vers l'écran Home
   - ✅ L'utilisateur est connecté

5. **Vérifier le profil dans Firestore**
   - Ouvrir Firebase Console
   - Aller dans Firestore Database
   - Collection `users`
   - Trouver le document avec l'email `test@example.com`
   - ✅ Le document existe
   - ✅ `display_name` = "Test User"
   - ✅ `created_time` au format "DD MMMM YYYY à HH:mm:ss UTC+X"
   - ✅ `presence` = "offline"
   - ✅ `hasAcceptedPrivacyPolicy` = false
   - ✅ `theme` = "dark"
   - ✅ `language` = "en"
   - ✅ `bookmarkedIds` = []

### Résultat attendu
✅ Compte créé avec profil complet dans Firestore

---

## Test 2 : Sign Up avec Google

### Objectif
Vérifier que l'inscription Google fonctionne et crée le profil.

### Étapes

1. **Accéder à l'écran Sign Up**
   - Ouvrir l'application
   - Aller sur l'écran Sign Up

2. **Connexion Google**
   - Cliquer sur "Continue with Google"
   - ✅ Popup Google s'ouvre (ou redirection sur mobile)

3. **Sélectionner un compte Google**
   - Choisir un compte Google de test
   - ✅ Authentification réussie

4. **Vérifier la connexion**
   - ✅ Retour à l'application
   - ✅ Redirection vers Home
   - ✅ Utilisateur connecté

5. **Vérifier le profil dans Firestore**
   - Ouvrir Firebase Console
   - Collection `users`
   - Trouver le document avec l'email Google
   - ✅ Le document existe
   - ✅ `display_name` = nom du compte Google
   - ✅ `photo_url` = URL de la photo Google
   - ✅ `email` = email Google
   - ✅ Tous les autres champs présents

### Résultat attendu
✅ Compte Google créé avec profil complet incluant la photo

---

## Test 3 : Forgot Password - Email valide

### Objectif
Vérifier que la réinitialisation de mot de passe fonctionne.

### Étapes

1. **Créer un compte de test**
   - Si pas déjà fait, créer un compte avec email/password
   - Email : `reset-test@example.com`
   - Mot de passe : `OldPassword123!`
   - Se déconnecter

2. **Accéder à Forgot Password**
   - Écran de connexion
   - Cliquer sur "Forgot Password?"
   - ✅ Écran Forgot Password s'affiche

3. **Entrer l'email**
   - Email : `reset-test@example.com`
   - Cliquer sur "Send Reset Link"
   - ✅ Indicateur de chargement

4. **Vérifier le message de succès**
   - ✅ Message "Reset Link Sent" s'affiche
   - ✅ Instructions affichées

5. **Vérifier l'email**
   - Ouvrir la boîte email `reset-test@example.com`
   - ✅ Email de Firebase reçu
   - ✅ Sujet contient "Reset your password"
   - ✅ Email contient un lien

6. **Cliquer sur le lien**
   - Cliquer sur le lien dans l'email
   - ✅ Redirection vers page Firebase
   - ✅ Formulaire de nouveau mot de passe

7. **Définir nouveau mot de passe**
   - Nouveau mot de passe : `NewPassword123!`
   - Confirmer : `NewPassword123!`
   - Cliquer sur "Save"
   - ✅ Confirmation de succès

8. **Tester la connexion**
   - Retourner à l'application
   - Se connecter avec :
     - Email : `reset-test@example.com`
     - Mot de passe : `NewPassword123!`
   - ✅ Connexion réussie

9. **Vérifier l'ancien mot de passe**
   - Se déconnecter
   - Essayer de se connecter avec `OldPassword123!`
   - ✅ Erreur "Wrong password"

### Résultat attendu
✅ Mot de passe réinitialisé avec succès

---

## Test 4 : Forgot Password - Email invalide

### Objectif
Vérifier la gestion des emails invalides.

### Étapes

1. **Accéder à Forgot Password**
   - Écran de connexion → "Forgot Password?"

2. **Entrer un email invalide**
   - Email : `invalid-email`
   - Cliquer sur "Send Reset Link"
   - ✅ Message d'erreur "Adresse email invalide"

3. **Corriger l'email**
   - Email : `valid@example.com`
   - Cliquer sur "Send Reset Link"
   - ✅ Message de succès (même si email n'existe pas)

### Résultat attendu
✅ Validation d'email fonctionne

---

## Test 5 : Forgot Password - Email inexistant

### Objectif
Vérifier la sécurité (pas de révélation si email existe).

### Étapes

1. **Accéder à Forgot Password**
   - Écran de connexion → "Forgot Password?"

2. **Entrer un email inexistant**
   - Email : `nonexistent@example.com`
   - Cliquer sur "Send Reset Link"
   - ✅ Message de succès affiché (pour la sécurité)
   - ✅ Pas d'indication que l'email n'existe pas

3. **Vérifier l'email**
   - ✅ Aucun email reçu (normal)

### Résultat attendu
✅ Pas de fuite d'information sur l'existence des comptes

---

## Test 6 : Validation des formulaires

### Objectif
Vérifier que les validations fonctionnent.

### Test 6.1 : Sign Up - Champs vides

1. Écran Sign Up
2. Laisser tous les champs vides
3. Cliquer sur "Get Started"
4. ✅ Message d'erreur "Please fill in all fields"

### Test 6.2 : Sign Up - Email invalide

1. Écran Sign Up
2. Nom : `Test`
3. Email : `invalid-email`
4. Mot de passe : `Test123!`
5. Cliquer sur "Get Started"
6. ✅ Erreur de validation email

### Test 6.3 : Sign Up - Mot de passe trop court

1. Écran Sign Up
2. Nom : `Test`
3. Email : `test@example.com`
4. Mot de passe : `123`
5. Cliquer sur "Get Started"
6. ✅ Erreur Firebase "Password should be at least 6 characters"

### Résultat attendu
✅ Toutes les validations fonctionnent

---

## Test 7 : Navigation entre écrans

### Objectif
Vérifier que la navigation fonctionne bien.

### Étapes

1. **Login → Sign Up**
   - Écran Login
   - Cliquer sur "Sign Up"
   - ✅ Écran Sign Up s'affiche

2. **Sign Up → Login**
   - Écran Sign Up
   - Cliquer sur "Login" (sous le formulaire)
   - ✅ Retour à l'écran Login

3. **Login → Forgot Password**
   - Écran Login
   - Cliquer sur "Forgot Password?"
   - ✅ Écran Forgot Password s'affiche

4. **Forgot Password → Login**
   - Écran Forgot Password
   - Cliquer sur "Back to Login"
   - ✅ Retour à l'écran Login

5. **Après envoi reset → Login**
   - Écran Forgot Password
   - Envoyer un reset
   - Cliquer sur "Back to Login"
   - ✅ Retour à Login
   - ✅ Champ email réinitialisé

### Résultat attendu
✅ Navigation fluide entre tous les écrans

---

## Test 8 : États de chargement

### Objectif
Vérifier que les indicateurs de chargement s'affichent.

### Test 8.1 : Sign Up loading

1. Écran Sign Up
2. Remplir le formulaire
3. Cliquer sur "Get Started"
4. ✅ Bouton affiche "Loading..." ou "Chargement..."
5. ✅ Bouton désactivé pendant le chargement

### Test 8.2 : Login loading

1. Écran Login
2. Remplir le formulaire
3. Cliquer sur "Login"
4. ✅ Indicateur de chargement

### Test 8.3 : Forgot Password loading

1. Écran Forgot Password
2. Entrer email
3. Cliquer sur "Send Reset Link"
4. ✅ Indicateur de chargement

### Test 8.4 : Google Sign In loading

1. Écran Login ou Sign Up
2. Cliquer sur "Continue with Google"
3. ✅ Bouton affiche "Loading..."
4. ✅ Bouton désactivé

### Résultat attendu
✅ Tous les états de chargement fonctionnent

---

## Checklist finale

### Sign Up
- [ ] Inscription email/password fonctionne
- [ ] Profil créé dans Firestore
- [ ] Format `created_time` correct
- [ ] Inscription Google fonctionne
- [ ] Photo Google sauvegardée
- [ ] Validation des champs
- [ ] Messages d'erreur clairs

### Forgot Password
- [ ] Email de reset envoyé
- [ ] Lien de reset fonctionne
- [ ] Nouveau mot de passe accepté
- [ ] Ancien mot de passe refusé
- [ ] Email invalide détecté
- [ ] Email inexistant géré (sécurité)
- [ ] Limite de tentatives respectée

### UX
- [ ] Navigation fluide
- [ ] États de chargement visibles
- [ ] Messages d'erreur compréhensibles
- [ ] Traductions correctes (FR/EN)
- [ ] Design cohérent
- [ ] Responsive (mobile/desktop)

---

## Problèmes courants et solutions

### Problème : Email de reset non reçu

**Solutions :**
1. Vérifier les spams
2. Vérifier que Firebase Email Provider est activé
3. Vérifier la console Firebase pour les erreurs
4. Attendre quelques minutes (délai d'envoi)

### Problème : Popup Google bloquée

**Solutions :**
1. Autoriser les popups dans le navigateur
2. Tester en mode redirect (mobile)
3. Vérifier les credentials OAuth dans Firebase

### Problème : Profil non créé dans Firestore

**Solutions :**
1. Vérifier les règles Firestore
2. Vérifier la console pour les erreurs
3. Vérifier que `userService.createUserProfile` est appelé

### Problème : Erreur "Permission denied"

**Solutions :**
1. Vérifier les règles Firestore
2. S'assurer que l'utilisateur est authentifié
3. Vérifier que l'UID correspond

---

## Rapport de test

Utilisez ce template pour documenter vos tests :

```
Date : _______________
Testeur : _______________
Version : _______________

Test 1 - Sign Up Email : ☐ PASS ☐ FAIL
Notes : _________________________________

Test 2 - Sign Up Google : ☐ PASS ☐ FAIL
Notes : _________________________________

Test 3 - Forgot Password : ☐ PASS ☐ FAIL
Notes : _________________________________

Test 4 - Email invalide : ☐ PASS ☐ FAIL
Notes : _________________________________

Test 5 - Email inexistant : ☐ PASS ☐ FAIL
Notes : _________________________________

Test 6 - Validations : ☐ PASS ☐ FAIL
Notes : _________________________________

Test 7 - Navigation : ☐ PASS ☐ FAIL
Notes : _________________________________

Test 8 - Loading states : ☐ PASS ☐ FAIL
Notes : _________________________________

Bugs trouvés :
1. _________________________________
2. _________________________________
3. _________________________________

Améliorations suggérées :
1. _________________________________
2. _________________________________
3. _________________________________
```
