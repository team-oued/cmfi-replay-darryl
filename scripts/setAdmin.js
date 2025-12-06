/**
 * Script temporaire pour définir un utilisateur comme admin
 * 
 * UTILISATION:
 * 1. Remplacez 'VOTRE_UID_ICI' par l'UID de l'utilisateur
 * 2. Exécutez: node scripts/setAdmin.js
 * 
 * OU utilisez directement dans la console du navigateur après import
 */

// Pour utiliser dans la console du navigateur, importez d'abord:
// import { userService } from './lib/firestore';
// Puis: userService.setAdminStatus('VOTRE_UID', true);

// Exemple d'utilisation:
// userService.setAdminStatus('abc123xyz', true); // Définir comme admin
// userService.setAdminStatus('abc123xyz', false); // Retirer les droits admin

console.log(`
Pour définir un utilisateur comme admin:

1. Via Firebase Console (RECOMMANDÉ):
   - Allez sur Firebase Console
   - Collection: users
   - Trouvez le document de l'utilisateur (ID = UID)
   - Ajoutez le champ: isAdmin = true (boolean)

2. Via la console du navigateur:
   - Ouvrez la console (F12)
   - Importez: import { userService } from './lib/firestore';
   - Exécutez: userService.setAdminStatus('VOTRE_UID', true);

3. Pour trouver votre UID:
   - Connectez-vous à l'application
   - Ouvrez la console (F12)
   - Tapez: localStorage.getItem('user') ou vérifiez dans AppContext
`);

