# Démarrage rapide - Admin Backup Videos

## ⚠️ Erreur : "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

Cette erreur signifie que le **backend n'est pas démarré**. Le frontend essaie de se connecter à l'API mais reçoit une page HTML d'erreur au lieu de JSON.

## ✅ Solution : Démarrer le backend

### 1. Installer les dépendances du backend (si pas déjà fait)

```bash
cd server
npm install
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` dans le dossier `server/` :

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=c-m-f-i-replay-f-63xui3
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@c-m-f-i-replay-f-63xui3.iam.gserviceaccount.com

# Vimeo API (optionnel pour tester l'accès)
VIMEO_CLIENT_ID=your_vimeo_client_id
VIMEO_CLIENT_SECRET=your_vimeo_client_secret
VIMEO_ACCESS_TOKEN=your_vimeo_access_token

# Server
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

**Note** : Pour tester uniquement l'accès à la page Admin, vous pouvez laisser les credentials Vimeo vides pour l'instant. L'important est d'avoir les credentials Firebase Admin.

### 3. Démarrer le serveur backend

Dans un **nouveau terminal**, exécutez :

```bash
cd server
npm run dev
```

Vous devriez voir :
```
✅ Firebase Admin initialized
🚀 Admin API server running on port 3001
📡 CORS enabled for: http://localhost:5173
```

### 4. Vérifier que le backend fonctionne

Ouvrez votre navigateur et allez sur : `http://localhost:3001/health`

Vous devriez voir :
```json
{"status":"ok","timestamp":"2024-..."}
```

### 5. Redémarrer le frontend (si nécessaire)

Si le frontend était déjà lancé, redémarrez-le pour qu'il détecte le backend :

```bash
npm run dev
```

## 🔍 Vérifications

1. ✅ Le backend est démarré sur le port 3001
2. ✅ Le frontend peut accéder à `http://localhost:3001/health`
3. ✅ Votre email est dans `admin_allowlist` avec `isActive: true`
4. ✅ Vous êtes connecté avec cet email dans l'application

## 🐛 Si l'erreur persiste

1. **Vérifiez que le port 3001 n'est pas utilisé** :
   ```bash
   netstat -ano | findstr :3001
   ```

2. **Vérifiez les logs du backend** pour voir les erreurs

3. **Vérifiez que les credentials Firebase Admin sont corrects** dans `server/.env`

4. **Vérifiez la variable d'environnement frontend** :
   - Créez un fichier `.env` à la racine du projet avec :
   ```env
   VITE_ADMIN_API_URL=http://localhost:3001
   ```
   - Redémarrez le serveur frontend

## 📝 Commandes utiles

**Démarrer le backend** :
```bash
cd server
npm run dev
```

**Démarrer le frontend** (dans un autre terminal) :
```bash
npm run dev
```

**Vérifier que le backend répond** :
```bash
curl http://localhost:3001/health
```


