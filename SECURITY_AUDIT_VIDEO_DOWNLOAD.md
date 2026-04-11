# Audit de Sécurité - Failles de Téléchargement Vidéo

## Résumé Exécutif

Cet audit identifie les failles de sécurité potentielles qui pourraient permettre aux utilisateurs de télécharger illégalement des fichiers vidéo depuis l'application CMFI Replay. **Plusieurs vulnérabilités critiques ont été identifiées** qui nécessitent une attention immédiate.

## 🔴 Vulnérabilités Critiques Identifiées

### 1. Exposition Directe des URLs des Vidéos

**Localisation:** `MoviePlayerScreen.tsx` ligne 476, `EpisodePlayerScreen.tsx` ligne 558

**Problème:** Les URLs des vidéos sont directement exposées dans l'attribut `src` des balises `<video>` :

```tsx
<video ref={videoRef} src={src} poster={poster} className="w-full h-full" onClick={togglePlay} />
```

**Risque:** 
- Les utilisateurs peuvent accéder à l'URL directement via les outils de développement
- L'URL peut être copiée et partagée
- Possibilité d'utiliser des outils externes pour télécharger la vidéo

**Impact:** Élevé - Permet le téléchargement non autorisé des contenus vidéo

### 2. Absence de Protection contre le Clic Droit

**Localisation:** Tous les lecteurs vidéo

**Problème:** Aucune protection contre le clic droit n'est implémentée sur les éléments vidéo

**Risque:**
- Les utilisateurs peuvent faire un clic droit et sélectionner "Enregistrer la vidéo sous..."
- Accès direct au menu contextuel du navigateur pour le téléchargement

**Impact:** Moyen - Facilite le téléchargement pour les utilisateurs non techniques

### 3. Pas de Validation des Permissions Côté Client

**Localisation:** `WatchScreen.tsx` lignes 31-94

**Problème:** La vérification des permissions est basée sur l'authentification mais pas sur les droits d'accès spécifiques aux vidéos

```tsx
// Aucune vérification approfondie des droits de l'utilisateur sur cette vidéo spécifique
const movie = await movieService.getMovieByUid(uid);
```

**Risque:**
- Un utilisateur authentifié peut potentiellement accéder à n'importe quelle vidéo
- Pas de validation si l'utilisateur a les droits premium requis

**Impact:** Élevé - Accès non autorisé à des contenus payants

### 4. URLs des Vidéos Stockées en Clair

**Localisation:** `types.ts` ligne 49, `firestore.ts` interface Movie

**Problème:** Les chemins des vidéos sont stockés en clair dans la base de données

```typescript
video_path_hd?: string;
```

**Risque:**
- Les URLs sont visibles dans la base de données Firestore
- En cas de compromission de la base, toutes les URLs sont exposées

**Impact:** Moyen - Exposition des données sensibles

### 5. Absence de Token d'Accès Temporaire

**Localisation:** Tous les accès vidéo

**Problème:** Les URLs des vidéos sont statiques et n'expirent pas

**Risque:**
- Une URL obtenue peut être réutilisée indéfiniment
- Partage facile des URLs de vidéo

**Impact:** Élevé - Perte de contrôle sur l'accès aux contenus

## 🟡 Vulnérabilités Modérées

### 6. Pas de Surveillance des Téléchargements

**Problème:** Aucun système de détection de téléchargement anormal n'est implémenté

**Risque:**
- Impossible de détecter les tentatives de téléchargement massif
- Pas d'alertes en cas d'activité suspecte

**Impact:** Moyen - Perte de visibilité sur l'abus

### 7. Absence de Watermarking

**Problème:** Les vidéos ne contiennent pas de watermark dynamique

**Risque:**
- Si une vidéo est téléchargée, elle peut être redistribuée sans attribution
- Difficile de tracer la source d'une fuite

**Impact:** Moyen - Perte de contrôle sur la distribution

## 🔵 Vulnérabilités Faibles

### 8. Métadonnées Exposées

**Localisation:** `MoviePlayerScreen.tsx`, `EpisodePlayerScreen.tsx`

**Problème:** Les métadonnées vidéo sont accessibles via les outils de développement

**Risque:**
- Informations techniques sur la vidéo exposées
- Peut aider à contourner certaines protections

**Impact:** Faible - Aide technique limitée

## 📋 Recommendations de Sécurité

### Actions Immédiates (Critique)

1. **Implémenter des URLs signées et temporaires**
   ```typescript
   // Générer des URLs qui expirent après un certain temps
   const signedUrl = await generateSignedVideoUrl(videoId, userId, expiration: 3600);
   ```

2. **Ajouter la protection contre le clic droit**
   ```tsx
   <video 
     ref={videoRef} 
     src={src} 
     poster={poster} 
     className="w-full h-full" 
     onClick={togglePlay}
     onContextMenu={(e) => e.preventDefault()}
     controlsList="nodownload"
   />
   ```

3. **Valider les permissions côté serveur**
   ```typescript
   // Vérifier les droits de l'utilisateur avant de retourner l'URL
   const hasAccess = await validateVideoAccess(userId, videoId);
   if (!hasAccess) throw new Error('Access denied');
   ```

### Actions à Court Terme (Important)

4. **Implémenter un système de détection**
   - Surveiller les tentatives d'accès multiples
   - Alerter en cas d'activité suspecte
   - Limiter le nombre de requêtes par utilisateur

5. **Ajouter des watermark dynamiques**
   - Inclure l'ID utilisateur ou session dans le watermark
   - Rendre les vidéos moins attrayantes pour la redistribution

6. **Chiffrer les URLs en base de données**
   - Stocker les chemins de manière chiffrée
   - Déchiffrer uniquement lors de l'accès autorisé

### Actions à Moyen Terme (Amélioration)

7. **Implémenter le DRM (Digital Rights Management)**
   - Utiliser des solutions comme Widevine ou FairPlay
   - Chiffrement bout-en-bout du contenu

8. **Système de tracking avancé**
   - Suivi détaillé des visionnages
   - Détection de partage de compte

## 🛠️ Implémentation Technique Suggérée

### 1. Service de Vidéo Sécurisé

```typescript
class SecureVideoService {
  async getVideoUrl(videoId: string, userId: string): Promise<string> {
    // Valider les permissions
    const hasAccess = await this.validateAccess(videoId, userId);
    if (!hasAccess) throw new Error('Unauthorized');
    
    // Générer URL temporaire
    const token = jwt.sign(
      { videoId, userId, exp: Math.floor(Date.now() / 1000) + 3600 },
      process.env.VIDEO_SECRET_KEY
    );
    
    return `${process.env.VIDEO_CDN}/${videoId}?token=${token}`;
  }
  
  private async validateAccess(videoId: string, userId: string): Promise<boolean> {
    // Logique de validation complexe
    // - Vérifier l'abonnement premium
    // - Vérifier les restrictions géographiques
    // - Vérifier les limites de visionnage
    return true;
  }
}
```

### 2. Composant Vidéo Sécurisé

```tsx
const SecureVideoPlayer: React.FC<{videoId: string}> = ({ videoId }) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const { userProfile } = useAppContext();
  
  useEffect(() => {
    const loadVideo = async () => {
      try {
        const url = await secureVideoService.getVideoUrl(videoId, userProfile.uid);
        setVideoUrl(url);
      } catch (error) {
        console.error('Access denied:', error);
      }
    };
    loadVideo();
  }, [videoId, userProfile.uid]);
  
  return (
    <video
      src={videoUrl}
      onContextMenu={(e) => e.preventDefault()}
      controlsList="nodownload nofullscreen"
      className="w-full h-full"
    />
  );
};
```

## 📊 Évaluation des Risques

| Vulnérabilité | Probabilité | Impact | Risque Global | Priorité |
|---------------|-------------|---------|---------------|-----------|
| Exposition URLs | Élevée | Élevé | **Critique** | P0 |
| Clic droit | Élevée | Moyen | **Élevé** | P1 |
| Validation permissions | Moyenne | Élevé | **Élevé** | P1 |
| URLs statiques | Élevée | Élevé | **Critique** | P0 |
| Absence surveillance | Moyenne | Moyen | **Modéré** | P2 |

## 🎯 Plan d'Action

### Semaine 1 (Urgent)
- [ ] Implémenter la protection contre le clic droit
- [ ] Ajouter la validation des permissions côté serveur
- [ ] Commencer l'implémentation des URLs temporaires

### Semaine 2-3 (Critique)
- [ ] Déployer le système d'URLs signées
- [ ] Mettre en place le monitoring des accès
- [ ] Chiffrer les URLs en base de données

### Mois 2 (Important)
- [ ] Implémenter le watermark dynamique
- [ ] Ajouter le système de détection d'anomalies
- [ ] Tester et valider toutes les mesures

## Conclusion

L'application présente **plusieurs vulnérabilités critiques** qui permettent actuellement le téléchargement facile des contenus vidéo. La priorité absolue doit être donnée à l'implémentation d'URLs temporaires et signées, ainsi qu'à une validation stricte des permissions côté serveur.

Un investissement dans ces mesures de sécurité est essentiel pour protéger la propriété intellectuelle et maintenir la viabilité économique de la plateforme.

---

*Audit réalisé le 24 mars 2026*
*Évaluateur: Senior Fullstack Security Specialist*
