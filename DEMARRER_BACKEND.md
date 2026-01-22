# 🚀 Comment démarrer le backend Admin

## ⚠️ Erreur actuelle

Vous voyez cette erreur car le **backend n'est pas démarré** :
```
Backend returned HTML instead of JSON: <!DOCTYPE html>
Le serveur backend n'est pas accessible. Vérifiez qu'il est démarré sur http://localhost:3001
```

## ✅ Solution en 3 étapes

### Étape 1 : Installer les dépendances

Ouvrez un **nouveau terminal** (laissez le frontend tourner dans l'autre) et exécutez :

```bash
cd server
npm install
```

### Étape 2 : Créer le fichier `.env`

Créez un fichier `.env` dans le dossier `server/` avec ce contenu :

```env
# Firebase Admin SDK (OBLIGATOIRE)
FIREBASE_PROJECT_ID=c-m-f-i-replay-f-63xui3
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVOTRE_CLE_PRIVEE_ICI\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@c-m-f-i-replay-f-63xui3.iam.gserviceaccount.com

# Vimeo API (OPTIONNEL - peut être vide pour tester)
VIMEO_CLIENT_ID=
VIMEO_CLIENT_SECRET=
VIMEO_ACCESS_TOKEN=

# Server
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

#### 🔑 Comment obtenir les credentials Firebase Admin ?

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet **c-m-f-i-replay-f-63xui3**
3. Cliquez sur l'icône ⚙️ **Paramètres du projet**
4. Allez dans l'onglet **Comptes de service**
5. Cliquez sur **Générer une nouvelle clé privée**
6. Téléchargez le fichier JSON
7. Ouvrez le JSON et copiez :
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (gardez les `\n`)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### Étape 3 : Démarrer le serveur

Toujours dans le terminal, exécutez :

```bash
npm run dev
```

Vous devriez voir :
```
✅ Firebase Admin initialized
🚀 Admin API server running on port 3001
📡 CORS enabled for: http://localhost:5173
```

## ✅ Vérification

1. **Testez le backend** : Ouvrez `http://localhost:3001/health` dans votre navigateur
   - Vous devriez voir : `{"status":"ok","timestamp":"..."}`

2. **Rechargez la page Admin** dans votre application
   - L'erreur devrait disparaître
   - Vous devriez voir les 3 onglets (Vidéos App, Vimeo, Upload)

## 🐛 Si ça ne marche toujours pas

### Vérifier que le port 3001 est libre

```bash
netstat -ano | findstr :3001
```

Si quelque chose utilise le port 3001, arrêtez-le ou changez le port dans `.env`.

### Vérifier les logs du backend

Le terminal du backend devrait afficher les erreurs. Vérifiez :
- ✅ Firebase Admin initialisé
- ✅ Serveur démarré sur le port 3001
- ❌ S'il y a des erreurs, corrigez-les

### Vérifier les credentials Firebase

Assurez-vous que :
- `FIREBASE_PRIVATE_KEY` est entre guillemets et contient `\n` pour les retours à la ligne
- `FIREBASE_CLIENT_EMAIL` correspond exactement à l'email du compte de service
- `FIREBASE_PROJECT_ID` est correct

## 📝 Commandes rapides

**Démarrer le backend** :
```bash
cd server
npm install  # (une seule fois)
npm run dev
```

**Vérifier que ça fonctionne** :
```bash
curl http://localhost:3001/health
# ou ouvrez http://localhost:3001/health dans votre navigateur
```

## 💡 Astuce

Laissez **2 terminaux ouverts** :
- **Terminal 1** : Frontend (`npm run dev` à la racine)
- **Terminal 2** : Backend (`cd server && npm run dev`)

Les deux doivent tourner en même temps pour que l'application fonctionne !


