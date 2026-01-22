/**
 * Script pour tester les notifications
 * 
 * UTILISATION:
 * 1. Ouvrez la console du navigateur (F12)
 * 2. Copiez-collez ce code
 * 3. Remplacez 'VOTRE_UID' par votre UID utilisateur
 * 4. Exécutez les fonctions
 */

// Exemple d'utilisation dans la console du navigateur :
// import { notificationService } from './lib/firestore';
// await notificationService.createNotification('VOTRE_UID', 'Test', 'Ceci est une notification de test', 'info');

console.log(`
=== GUIDE DE TEST DES NOTIFICATIONS ===

1. VIA LA CONSOLE DU NAVIGATEUR (RECOMMANDÉ):
   
   a) Trouvez votre UID:
      - Ouvrez la console (F12)
      - Tapez: localStorage.getItem('user') ou vérifiez dans AppContext
   
   b) Créez une notification:
      import { notificationService } from './lib/firestore';
      await notificationService.createNotification(
          'VOTRE_UID',
          'Titre de la notification',
          'Message de la notification',
          'info' // ou 'success', 'warning', 'error'
      );

2. VIA FIRESTORE CONSOLE:
   - Allez dans Firebase Console → Firestore
   - Collection: notifications
   - Ajoutez un document avec:
     * userId: votre UID
     * title: "Test Notification"
     * message: "Ceci est un test"
     * type: "info"
     * read: false
     * createdAt: Timestamp.now()
     * link: null (optionnel)

3. VÉRIFICATIONS:
   ✓ Le badge apparaît dans le Header
   ✓ Le compteur affiche le bon nombre
   ✓ La page /notifications affiche les notifications
   ✓ Marquer comme lu fonctionne
   ✓ Supprimer fonctionne
`);


