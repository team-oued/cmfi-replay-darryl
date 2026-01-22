# Admin Backup Videos - Backend API

Backend Node.js/Express pour la gestion des vidéos Vimeo et des épisodes de l'application CMFI Replay.

## Installation

```bash
npm install
```

## Configuration

1. Copiez `.env.example` vers `.env`
2. Remplissez les variables d'environnement (voir `ADMIN_BACKUP_VIDEOS_SETUP.md`)

## Démarrage

### Mode développement (avec watch)
```bash
npm run dev
```

### Mode production
```bash
npm start
```

## Structure

```
server/
├── index.js              # Point d'entrée du serveur
├── middleware/
│   └── auth.js          # Middleware d'authentification et allowlist
├── routes/
│   ├── admin.js         # Routes pour la gestion des vidéos app
│   └── vimeo.js         # Routes pour l'intégration Vimeo
└── services/
    └── firestore.js     # Services Firestore (placeholder)
```

## Endpoints

Tous les endpoints sont préfixés par `/admin` et nécessitent :
- Un token Firebase valide dans le header `Authorization: Bearer <token>`
- Un email présent dans `admin_allowlist` avec `isActive: true`

### Admin
- `GET /admin/me` - Vérifie si l'utilisateur est admin
- `GET /admin/app/videos` - Liste les vidéos de l'app
- `PATCH /admin/app/videos/:id` - Met à jour un épisode
- `GET /admin/seasons` - Liste les saisons
- `POST /admin/seasons` - Crée une nouvelle saison
- `POST /admin/import/vimeo-to-app` - Importe une vidéo Vimeo
- `GET /admin/audit/logs` - Récupère les logs d'audit

### Vimeo
- `GET /admin/vimeo/folders` - Liste les dossiers Vimeo
- `GET /admin/vimeo/videos` - Liste les vidéos Vimeo
- `POST /admin/vimeo/upload` - Upload une vidéo vers Vimeo

## Notes importantes

### Upload Vimeo

L'upload Vimeo utilise l'API Tus (Resumable Upload). Pour une implémentation complète en production, il est recommandé d'utiliser la bibliothèque `tus-js-client` côté client ou d'implémenter un client Tus côté serveur.

L'implémentation actuelle crée la vidéo sur Vimeo et retourne l'URL d'upload. L'upload réel du fichier peut être fait :
1. Via l'interface web Vimeo
2. Via un client Tus côté client
3. Via une implémentation Tus complète côté serveur

### Sécurité

- Tous les secrets Vimeo sont stockés côté serveur uniquement
- L'authentification Firebase est requise pour tous les endpoints
- L'allowlist vérifie l'email de l'utilisateur avant d'autoriser l'accès
- Les logs d'audit enregistrent toutes les actions admin


