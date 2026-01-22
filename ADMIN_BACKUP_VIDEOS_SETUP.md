# Configuration Admin Backup Videos

Ce document explique comment configurer et utiliser la fonctionnalité "Admin Backup Videos" pour gérer les vidéos Vimeo et les épisodes de l'application.

## 📋 Prérequis

1. **Compte Vimeo** avec accès API
2. **Firebase Admin SDK** configuré
3. **Node.js** installé (version 18+)

## 🔧 Configuration Backend

### 1. Installation des dépendances

```bash
cd server
npm install
```

### 2. Configuration des variables d'environnement

Créez un fichier `.env` dans le dossier `server/` basé sur `.env.example` :

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=c-m-f-i-replay-f-63xui3
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@c-m-f-i-replay-f-63xui3.iam.gserviceaccount.com

# Vimeo API
VIMEO_CLIENT_ID=your_vimeo_client_id
VIMEO_CLIENT_SECRET=your_vimeo_client_secret
VIMEO_ACCESS_TOKEN=your_vimeo_access_token

# Server
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

#### Obtenir les credentials Firebase Admin SDK

1. Allez dans [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Allez dans **Paramètres du projet** → **Comptes de service**
4. Cliquez sur **Générer une nouvelle clé privée**
5. Téléchargez le fichier JSON
6. Extrayez les valeurs :
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (gardez les `\n`)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

#### Obtenir les credentials Vimeo

1. Allez sur [Vimeo Developer](https://developer.vimeo.com/)
2. Créez une nouvelle application
3. Notez le **Client ID** et **Client Secret**
4. Générez un **Access Token** avec les permissions :
   - `public` (lecture publique)
   - `private` (lecture privée)
   - `upload` (upload de vidéos)
   - `edit` (modification de vidéos)
   - `delete` (suppression de vidéos)
   - `interact` (interaction avec les vidéos)

### 3. Démarrer le serveur backend

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3001`

## 🔐 Configuration Allowlist Admin

### Créer la collection `admin_allowlist` dans Firestore

1. Allez dans [Firebase Console](https://console.firebase.google.com/)
2. Ouvrez **Firestore Database**
3. Créez une collection nommée `admin_allowlist`
4. Ajoutez un document avec les champs suivants :

```json
{
  "email": "admin@example.com",
  "isActive": true,
  "role": "admin",
  "createdAt": [timestamp],
  "createdBy": null
}
```

**Important** : L'email doit être en **minuscules** et correspondre exactement à l'email de l'utilisateur Firebase.

### Ajouter un utilisateur à l'allowlist

Vous pouvez ajouter des utilisateurs via le code ou directement dans Firestore :

```typescript
import { adminAllowlistService } from './lib/adminAllowlistService';

await adminAllowlistService.addEmail('admin@example.com', 'admin', 'current-admin-uid');
```

## 🚀 Configuration Frontend

### 1. Variable d'environnement

Créez ou modifiez `.env` à la racine du projet :

```env
VITE_ADMIN_API_URL=http://localhost:3001
```

### 2. Démarrer le frontend

```bash
npm run dev
```

## 📱 Utilisation

### Accéder à la page Admin

1. Connectez-vous avec un compte autorisé (présent dans `admin_allowlist`)
2. Allez dans **Profil** → **Administration** → **Admin - Gestion des vidéos**
3. Vous verrez 3 onglets :
   - **Vidéos App** : Liste et modification des épisodes existants
   - **Vimeo** : Liste et import des vidéos Vimeo
   - **Upload Vimeo** : Upload de nouvelles vidéos vers Vimeo

### Onglet 1 : Vidéos App

- **Rechercher** : Recherche par titre, description
- **Filtrer par saison** : Affiche uniquement les épisodes d'une saison
- **Modifier** : Cliquez sur "Modifier" pour éditer :
  - Titre
  - Description
  - Statut (masqué/visible)
  - Numéro d'épisode
  - Saison

### Onglet 2 : Vimeo

- **Sélectionner un dossier** : Filtre les vidéos par dossier Vimeo
- **Importer** : Importe une vidéo Vimeo dans l'app
  - Choisir une saison existante OU
  - Créer une nouvelle saison

### Onglet 3 : Upload Vimeo

- **Sélectionner un fichier** : Choisir un fichier vidéo (max 5GB)
- **Titre** : Titre de la vidéo sur Vimeo
- **Description** : Description de la vidéo
- **Dossier** : Dossier Vimeo de destination (optionnel)
- **Confidentialité** : Public / Non listé / Privé
- **Upload** : Lance l'upload avec barre de progression

## 🔍 Logs d'Audit

Toutes les actions admin sont enregistrées dans la collection `admin_audit_logs` :

- `action` : Type d'action (upload_vimeo_video, import_vimeo_video, update_video, etc.)
- `details` : Détails de l'action (JSON)
- `userId` : UID de l'utilisateur
- `userEmail` : Email de l'utilisateur
- `timestamp` : Date et heure de l'action

## 🛡️ Sécurité

### Protection des endpoints

Tous les endpoints `/admin/*` sont protégés par :
1. **Authentification Firebase** : Vérification du token JWT
2. **Allowlist** : Vérification de l'email dans `admin_allowlist`
3. **Statut actif** : Seuls les emails avec `isActive: true` sont autorisés

### Secrets Vimeo

Les secrets Vimeo (Client ID, Client Secret, Access Token) sont stockés **uniquement côté serveur** dans les variables d'environnement. Ils ne sont jamais exposés au frontend.

## 🐛 Dépannage

### Erreur 403 "Accès refusé"

1. Vérifiez que votre email est dans `admin_allowlist`
2. Vérifiez que `isActive: true`
3. Vérifiez que l'email correspond exactement (minuscules)

### Erreur "Token invalide"

1. Déconnectez-vous et reconnectez-vous
2. Vérifiez que Firebase Auth est correctement configuré

### Erreur lors de l'upload Vimeo

1. Vérifiez que le fichier ne dépasse pas 5GB
2. Vérifiez que le token Vimeo a les permissions `upload`
3. Vérifiez les quotas Vimeo

### Le serveur backend ne démarre pas

1. Vérifiez que toutes les variables d'environnement sont définies
2. Vérifiez que le port 3001 n'est pas déjà utilisé
3. Vérifiez les logs d'erreur dans la console

## 📝 Structure des données

### Épisode (episodesSeries)

```typescript
{
  uid_episode: string;
  uid_season: string;
  title: string;
  embedUrl: string; // URL Vimeo embed
  video_path_hd: string; // Lien Vimeo
  vimeoId: string; // ID Vimeo
  vimeoUri: string; // URI Vimeo
  status: 'imported' | 'uploaded';
  // ... autres champs
}
```

### Saison (seasonsSeries)

```typescript
{
  uid_season: string;
  uid_serie: string;
  title_season: string;
  season_number: number;
  nb_episodes: number;
  // ... autres champs
}
```

## 🚀 Déploiement

### Backend

1. Déployez le serveur Node.js sur votre plateforme (Heroku, Railway, etc.)
2. Configurez les variables d'environnement sur la plateforme
3. Mettez à jour `VITE_ADMIN_API_URL` dans le frontend

### Frontend

1. Build : `npm run build`
2. Déployez les fichiers générés sur votre hébergeur (Netlify, Vercel, etc.)

## 📚 API Endpoints

### GET /admin/me
Vérifie si l'utilisateur est admin

### GET /admin/app/videos
Liste les vidéos de l'app (query: `seasonId`, `status`, `search`)

### PATCH /admin/app/videos/:id
Met à jour un épisode

### GET /admin/seasons
Liste les saisons (query: `serieId`)

### POST /admin/seasons
Crée une nouvelle saison

### GET /admin/vimeo/folders
Liste les dossiers Vimeo

### GET /admin/vimeo/videos
Liste les vidéos Vimeo (query: `folderId`, `per_page`, `page`)

### POST /admin/vimeo/upload
Upload une vidéo vers Vimeo (multipart/form-data)

### POST /admin/import/vimeo-to-app
Importe une vidéo Vimeo dans l'app

### GET /admin/audit/logs
Récupère les logs d'audit (query: `limit`, `action`)

## ✅ Checklist de configuration

- [ ] Backend installé et configuré
- [ ] Variables d'environnement définies
- [ ] Credentials Vimeo obtenus
- [ ] Credentials Firebase Admin obtenus
- [ ] Collection `admin_allowlist` créée
- [ ] Au moins un email ajouté à l'allowlist
- [ ] Serveur backend démarré
- [ ] Frontend configuré avec `VITE_ADMIN_API_URL`
- [ ] Test d'accès à la page Admin réussi


