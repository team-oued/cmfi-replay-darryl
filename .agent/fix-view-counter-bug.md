# Correction du bug : Compteur de vues qui se réinitialise

## 🐛 Problème identifié

Le compteur de vues ne fonctionnait pas car il se réinitialisait à chaque changement d'état de lecture (play/pause).

### Cause du bug

Le `useEffect` avait `videoIsPlaying` dans ses dépendances :

```typescript
useEffect(() => {
    let watchTime = 0;  // ❌ Se réinitialise à chaque changement de videoIsPlaying
    let isWatching = false;
    
    viewTimer = setInterval(() => {
        if (videoIsPlaying) {
            watchTime += 1;  // Le compteur repart toujours de 0 !
        }
    }, 1000);
    
}, [movieData, userProfile, videoIsPlaying]);  // ← videoIsPlaying déclenche la réexécution
```

### Scénario du bug

```
0s  → Play  → useEffect s'exécute, watchTime = 0
1s  → Play  → watchTime = 1
2s  → Play  → watchTime = 2
3s  → Pause → videoIsPlaying change → useEffect se réexécute → watchTime = 0 ❌
4s  → Pause → watchTime = 0
5s  → Play  → videoIsPlaying change → useEffect se réexécute → watchTime = 0 ❌
6s  → Play  → watchTime = 1
...
```

**Résultat** : Le compteur ne peut jamais atteindre 30 secondes !

## ✅ Solution appliquée

Utiliser `useRef` pour persister les valeurs entre les réexécutions du `useEffect`.

### Code corrigé

```typescript
// Utiliser useRef pour persister les valeurs
const watchTimeRef = useRef(0);
const hasRecordedViewRef = useRef(false);

useEffect(() => {
    if (!movieData?.uid || !userProfile?.uid) return;

    const viewTimer = setInterval(() => {
        if (videoIsPlaying && !hasRecordedViewRef.current) {
            watchTimeRef.current += 1;  // ✅ Persiste entre les réexécutions
            
            if (watchTimeRef.current >= 30) {
                hasRecordedViewRef.current = true;
                viewService.recordView(movieData.uid, 'movie', userProfile.uid)
                    .then(() => {
                        console.log('Vue enregistrée avec succès après 30 secondes de visionnage');
                    })
                    .catch((error) => {
                        console.error('Erreur lors de l\'enregistrement de la vue:', error);
                    });
            }
        }
    }, 1000);

    return () => {
        clearInterval(viewTimer);
    };
}, [movieData, userProfile, videoIsPlaying]);

// Reset watch time when movie changes
useEffect(() => {
    watchTimeRef.current = 0;
    hasRecordedViewRef.current = false;
}, [movieData?.uid]);
```

### Scénario corrigé

```
0s  → Play  → watchTimeRef.current = 0
1s  → Play  → watchTimeRef.current = 1
2s  → Play  → watchTimeRef.current = 2
3s  → Pause → videoIsPlaying change → useEffect se réexécute → watchTimeRef.current = 2 ✅ (persiste)
4s  → Pause → watchTimeRef.current = 2 (ne s'incrémente pas car en pause)
5s  → Play  → videoIsPlaying change → useEffect se réexécute → watchTimeRef.current = 2 ✅ (persiste)
6s  → Play  → watchTimeRef.current = 3
7s  → Play  → watchTimeRef.current = 4
...
30s → Play  → watchTimeRef.current = 30 → ✅ Vue enregistrée !
```

## 🔑 Points clés

### Pourquoi `useRef` ?

- ✅ **Persiste** entre les rendus du composant
- ✅ **Ne déclenche pas** de re-render quand la valeur change
- ✅ **Mutable** : on peut modifier `.current` sans problème
- ✅ **Parfait** pour les compteurs et les flags

### Différence avec `useState`

| `useState` | `useRef` |
|------------|----------|
| Déclenche un re-render | Ne déclenche pas de re-render |
| Réinitialise dans useEffect | Persiste dans useEffect |
| Pour les données UI | Pour les données techniques |

### Deux useEffect distincts

1. **Premier useEffect** : Gère le timer et l'incrémentation
   - Dépendances : `[movieData, userProfile, videoIsPlaying]`
   - Se réexécute quand la vidéo change d'état

2. **Deuxième useEffect** : Reset le compteur quand le film change
   - Dépendances : `[movieData?.uid]`
   - Garantit qu'on compte bien 30s pour chaque film différent

## 📝 Fichiers modifiés

- ✅ `screens/MoviePlayerScreen.tsx`
- ✅ `screens/EpisodePlayerScreen.tsx`

## 🧪 Test

Pour vérifier que ça fonctionne maintenant :

1. Ouvrir la console du navigateur (F12)
2. Lancer un film ou un épisode
3. Regarder pendant 30 secondes (vous pouvez mettre en pause et reprendre)
4. Après 30 secondes cumulées de lecture, vous devriez voir :
   ```
   Vue enregistrée avec succès après 30 secondes de visionnage
   Vue enregistrée pour movie abc123xyz
   ```

## ✅ Build

Compilation réussie sans erreurs !
