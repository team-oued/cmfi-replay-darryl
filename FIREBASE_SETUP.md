# Firebase Integration Guide

## Configuration requise

1. **Installer les dépendances**:
   ```bash
   npm install firebase
   ```

2. **Configurer Firebase**:
   - Allez sur la [Console Firebase](https://console.firebase.google.com/)
   - Créez un nouveau projet ou utilisez un projet existant
   - Activez Authentication (Email/Password)
   - Activez Firestore Database
   - Copiez votre configuration Firebase

3. **Mettre à jour la configuration**:
   - Ouvrez `lib/firebase.ts`
   - Remplacez les valeurs de configuration par les vôtres

## Structure des données

### Collection `users`
```typescript
{
  uid: string,
  email: string,
  displayName?: string,
  photoURL?: string,
  theme: 'light' | 'dark',
  language: string,
  bookmarkedIds: string[],
  createdAt: Date,
  updatedAt: Date
}
```

### Collection `bookmarks` (optionnelle)
```typescript
{
  id: string,
  userId: string,
  mediaId: string,
  mediaType: string,
  createdAt: Date
}
```

## Fonctionnalités implémentées

- ✅ Authentification par email/mot de passe
- ✅ Création de comptes utilisateurs
- ✅ Synchronisation des préférences (thème, langue)
- ✅ Synchronisation des favoris
- ✅ Gestion automatique des sessions

## Prochaines étapes

1. Configurez votre projet Firebase
2. Mettez à jour `lib/firebase.ts` avec vos clés
3. Testez l'authentification
4. Vérifiez la synchronisation des données

## Sécurité

Règles Firestore recommandées:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /bookmarks/{bookmarkId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```
