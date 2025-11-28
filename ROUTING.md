# Système de Routage de l'Application CMFI Replay

## Vue d'ensemble

L'application utilise maintenant **React Router DOM v7** pour gérer la navigation entre les différentes pages. Toutes les routes sont définies dans `App.tsx` et utilisent le composant `BrowserRouter`.

## Routes Disponibles

### Routes d'Authentification (Non authentifié)
- `/login` - Page de connexion
- `/register` - Page d'inscription
- `/forgot-password` - Page de réinitialisation du mot de passe
- `/get-started` - Redirige vers `/home` (écran de démarrage géré par état local)

### Routes Principales (Authentifié)
- `/home` - Page d'accueil avec le contenu principal
- `/search` - Page de recherche de contenu
- `/profile` - Page de profil utilisateur

### Routes de Catégories
- `/movies` - Liste de tous les films
- `/series` - Liste de toutes les séries
- `/podcasts` - Liste de tous les podcasts

### Routes de Détails
- `/movie/:uid` - Détails d'un film spécifique
- `/serie/:uid` - Détails d'une série spécifique
- `/podcast/:uid` - Détails d'un podcast spécifique

### Route de Lecture
- `/watch/:uid` - Lecteur vidéo pour films et épisodes
  - Si `:uid` est un film → affiche `MoviePlayerScreen`
  - Si `:uid` est un épisode → affiche `EpisodePlayerScreen`

### Routes du Profil
- `/favorites` - Liste des favoris (bookmarks)
- `/preferences` - Paramètres de l'application
- `/editprofile` - Édition du profil utilisateur

## Architecture des Composants

### Composants Wrapper

Deux composants wrapper ont été créés pour gérer les routes avec paramètres dynamiques :

#### `MediaDetailWrapper.tsx`
- Récupère le média (film/série/podcast) depuis Firestore en utilisant l'UID de l'URL
- Affiche `MediaDetailScreen` avec les données récupérées
- Gère les états de chargement et les erreurs

#### `WatchScreen.tsx`
- Récupère le contenu à lire (film ou épisode) depuis Firestore
- Détermine automatiquement s'il s'agit d'un film ou d'un épisode
- Affiche le lecteur approprié (`MoviePlayerScreen` ou `EpisodePlayerScreen`)
- Gère la navigation entre épisodes

### Écrans de Catégories

Trois nouveaux écrans ont été créés pour les catégories :

- `MoviesScreen.tsx` - Utilise `CategoryScreen` avec `MediaType.Movie`
- `SeriesScreen.tsx` - Utilise `CategoryScreen` avec `MediaType.Series`
- `PodcastsScreen.tsx` - Utilise `CategoryScreen` avec `MediaType.Podcast`

### Écrans d'Authentification Séparés

Les écrans d'authentification ont été séparés pour une meilleure organisation :

- `LoginScreen.tsx` - Connexion avec email/password et Google
- `RegisterScreen.tsx` - Inscription avec email/password et Google
- `ForgotPasswordScreen.tsx` - Réinitialisation du mot de passe

## Navigation

### Composant `BottomNav`

Le composant `BottomNav` a été mis à jour pour utiliser React Router :
- Utilise `useNavigate()` pour la navigation
- Utilise `useLocation()` pour détecter la route active
- Affiche les onglets : Home, Search, Profile

### Navigation Programmatique

Dans `App.tsx`, la navigation utilise :
```typescript
window.location.href = '/path'
```

Cette approche a été choisie pour garantir un rechargement complet de la page et éviter les problèmes de state management entre les routes.

## Gestion de l'État

### État Global
- `isAuthenticated` - Géré par `AppContext`
- `hasStarted` - État local pour l'écran "Get Started"

### État Local par Route
Chaque écran gère son propre état local (chargement, données, erreurs)

## Redirections

- Routes non authentifiées → `/login`
- Routes authentifiées invalides → `/home`
- `/` → `/home`
- `/get-started` → `/home`

## Types de Médias

L'application distingue trois types de médias :
```typescript
enum MediaType {
    Series = 'Series',
    Movie = 'Movie',
    Podcast = 'Podcast',
}
```

Les podcasts sont stockés dans la collection `series` avec `serie_type: 'podcast'`.

## Services Firestore Utilisés

- `movieService` - Gestion des films
- `serieService` - Gestion des séries et podcasts
- `seasonSerieService` - Gestion des saisons
- `episodeSerieService` - Gestion des épisodes

## Améliorations Futures Possibles

1. **Lazy Loading** - Charger les composants de route de manière asynchrone
2. **Route Guards** - Protéger les routes avec des guards personnalisés
3. **Breadcrumbs** - Ajouter un fil d'Ariane pour la navigation
4. **Deep Linking** - Améliorer le support des liens profonds
5. **Route Transitions** - Ajouter des animations de transition entre les routes
6. **Error Boundaries** - Ajouter des error boundaries pour chaque route
7. **Prefetching** - Précharger les données des routes suivantes probables

## Notes Importantes

1. **Compatibilité** - L'application utilise React Router DOM v7.9.6
2. **TypeScript** - Tous les composants sont typés avec TypeScript
3. **Responsive** - Toutes les routes sont responsive et fonctionnent sur mobile
4. **SEO** - Les routes utilisent des URLs sémantiques pour un meilleur SEO
