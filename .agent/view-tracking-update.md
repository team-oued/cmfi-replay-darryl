# Mise à jour : Tracking des vues basé sur le visionnage effectif

## Changement implémenté

Le système de tracking des vues a été amélioré pour compter **uniquement le temps de visionnage effectif** de la vidéo, et non pas simplement le temps de présence sur la page.

## Différence entre les deux approches

### ❌ Ancienne implémentation (30s sur la page)
```
Utilisateur ouvre la vidéo → Timer démarre
├─ 0s : Vidéo en pause
├─ 10s : Vidéo en pause
├─ 20s : Vidéo en pause
└─ 30s : ✅ Vue enregistrée (même si la vidéo n'a jamais été lue !)
```

### ✅ Nouvelle implémentation (30s de visionnage)
```
Utilisateur ouvre la vidéo → Timer démarre
├─ 0s : Vidéo en pause → Timer ne compte pas
├─ 5s : Vidéo en lecture → Timer compte (5s)
├─ 15s : Vidéo en pause → Timer ne compte pas (toujours 5s)
├─ 20s : Vidéo en lecture → Timer compte (6s, 7s, 8s...)
└─ 50s : Après 30s de lecture effective → ✅ Vue enregistrée
```

## Modifications techniques

### 1. Composant `VideoPlayer`

**Ajout d'un callback `onPlayingStateChange` :**
```typescript
const VideoPlayer: React.FC<{ 
  src: string, 
  poster: string, 
  onEnded?: () => void,
  onPlayingStateChange?: (isPlaying: boolean) => void // ← Nouveau
}> = ({ src, poster, onEnded, onPlayingStateChange }) => {
```

**Notification du parent lors des changements d'état :**
```typescript
const handlePlay = () => {
    setIsPlaying(true);
    if (onPlayingStateChange) onPlayingStateChange(true); // ← Notifie le parent
};

const handlePause = () => {
    setIsPlaying(false);
    if (onPlayingStateChange) onPlayingStateChange(false); // ← Notifie le parent
};
```

### 2. MoviePlayerScreen & EpisodePlayerScreen

**Ajout d'un état pour tracker la lecture :**
```typescript
const [videoIsPlaying, setVideoIsPlaying] = useState(false);
```

**Passage du callback au VideoPlayer :**
```typescript
<VideoPlayer
    src={movieData?.video_path_hd || item.video_path_hd}
    poster={movieData?.picture_path || item.imageUrl}
    onEnded={handleVideoEnded}
    onPlayingStateChange={setVideoIsPlaying} // ← Nouveau
/>
```

**Modification du timer de tracking :**
```typescript
// Incrémenter le temps de visionnage chaque seconde UNIQUEMENT si la vidéo est en lecture
viewTimer = setInterval(() => {
    if (videoIsPlaying) { // ← Condition ajoutée
        watchTime += 1;
        checkViewThreshold();
    }
}, 1000);
```

**Ajout de la dépendance au useEffect :**
```typescript
}, [movieData, userProfile, videoIsPlaying]); // ← videoIsPlaying ajouté
```

## Comportement détaillé

### Scénarios de test

#### Scénario 1 : Visionnage continu
```
0s  → Play  → Timer : 0s
10s → Play  → Timer : 10s
20s → Play  → Timer : 20s
30s → Play  → Timer : 30s ✅ Vue enregistrée
```

#### Scénario 2 : Visionnage avec pauses
```
0s  → Play  → Timer : 0s
10s → Pause → Timer : 10s (arrêt du compteur)
20s → Pause → Timer : 10s (toujours 10s)
30s → Play  → Timer : 11s, 12s, 13s...
50s → Play  → Timer : 30s ✅ Vue enregistrée
```

#### Scénario 3 : Vidéo jamais lancée
```
0s  → Pause → Timer : 0s
60s → Pause → Timer : 0s ❌ Pas de vue enregistrée
```

## Avantages de cette approche

✅ **Précision** : Reflète le visionnage réel de l'utilisateur  
✅ **Équité** : Évite les vues "fantômes" (page ouverte mais vidéo non regardée)  
✅ **Analytics fiables** : Les statistiques de vues sont plus représentatives de l'engagement  
✅ **Compatibilité** : Fonctionne avec les pauses, le scrubbing, etc.

## Fichiers modifiés

- ✅ `screens/MoviePlayerScreen.tsx`
- ✅ `screens/EpisodePlayerScreen.tsx`

## Test

Pour vérifier le bon fonctionnement :

1. Ouvrir un film ou un épisode
2. Laisser la vidéo en pause pendant 1 minute
3. **Résultat attendu** : Aucune vue enregistrée
4. Lancer la vidéo et la regarder pendant 30 secondes
5. **Résultat attendu** : Vue enregistrée dans Firestore

## Build

✅ Compilation réussie sans erreurs
