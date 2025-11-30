# Implémentation de la gestion des vues

## Résumé
Implémentation d'un système de tracking des vues pour les films et épisodes. Une vue est enregistrée après 30 secondes de visionnage.

## Modifications apportées

### 1. Nouvelle collection Firestore : `user_view`

Structure d'un document :
```typescript
{
  "view_date": "12 juin 2025 à 08:19:16 UTC+2",
  "uid": "S9ZEBOUfhSFD", // uid du film ou uid_episode de l'épisode
  "video_type": "movie|episode",
  "user_uid": "yufeyeyyu" // uid de l'utilisateur
}
```

### 2. Fichier `lib/firestore.ts`

#### Interface ajoutée :
```typescript
export interface UserView {
    view_date: string;
    uid: string;
    video_type: 'movie' | 'episode';
    user_uid: string;
}
```

#### Service ajouté : `viewService`

Méthodes disponibles :
- `recordView(uid, videoType, userUid)` : Enregistre une vue et incrémente le compteur
- `incrementMovieViews(movieUid)` : Incrémente le champ `views` dans la collection `movies`
- `incrementEpisodeViews(episodeUid)` : Incrémente le champ `views` dans la collection `episodesSeries`
- `getViewCount(uid, videoType)` : Récupère le nombre total de vues
- `hasUserViewed(uid, videoType, userUid)` : Vérifie si un utilisateur a déjà vu la vidéo

### 3. `screens/MoviePlayerScreen.tsx`

Ajout d'un `useEffect` qui :
- Démarre un timer dès le chargement du composant
- Incrémente un compteur chaque seconde
- Enregistre une vue après 30 secondes de visionnage
- Se nettoie automatiquement au démontage du composant

### 4. `screens/EpisodePlayerScreen.tsx`

Même logique que pour `MoviePlayerScreen.tsx`, adaptée pour les épisodes.

## Fonctionnement

1. **Démarrage** : Quand l'utilisateur ouvre un film ou un épisode, un timer démarre
2. **Comptage** : Le temps de visionnage est incrémenté chaque seconde
3. **Seuil atteint** : Après 30 secondes, une vue est enregistrée :
   - Un document est créé dans la collection `user_view`
   - Le champ `views` est incrémenté dans la collection `movies` ou `episodesSeries`
4. **Une seule vue par session** : Le flag `isWatching` empêche l'enregistrement de vues multiples

## Avantages

- ✅ Tracking automatique sans intervention de l'utilisateur
- ✅ Seuil de 30 secondes pour éviter les vues accidentelles
- ✅ Mise à jour automatique des compteurs dans les collections
- ✅ Historique complet des vues avec date et utilisateur
- ✅ Nettoyage automatique des timers pour éviter les fuites mémoire

## Notes importantes

- Le tracking ne fonctionne que si l'utilisateur est connecté (`userProfile.uid` requis)
- Les vues sont enregistrées même si l'utilisateur met en pause ou change de page après 30 secondes
- Le compteur `views` dans les collections `movies` et `episodesSeries` doit exister (initialisé à 0 si absent)
