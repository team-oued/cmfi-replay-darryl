# Accès Public à la Route /watch/:uid

## Objectif

Permettre aux utilisateurs **non connectés** de regarder des vidéos via la route `/watch/:uid`, tout en leur demandant de se connecter pour effectuer des actions protégées (like, commentaire, ajout aux favoris).

## Modifications Apportées

### 1. **Nouveau Composant: AuthPrompt**

**Fichier**: `components/AuthPrompt.tsx`

Un composant modal élégant qui s'affiche lorsqu'un utilisateur non connecté tente d'effectuer une action protégée.

**Fonctionnalités**:
- ✅ Modal avec backdrop blur et animation
- ✅ Message personnalisé selon l'action (liker, commenter, ajouter aux favoris)
- ✅ Boutons "Se connecter" et "Créer un compte"
- ✅ Option "Continuer sans compte" (optionnelle)
- ✅ Design cohérent avec le thème de l'application
- ✅ Compatible dark mode

**Utilisation**:
```typescript
import AuthPrompt from '../components/AuthPrompt';

const [showAuthPrompt, setShowAuthPrompt] = useState(false);

// Lors d'une action protégée
const handleLike = () => {
    if (!isAuthenticated) {
        setShowAuthPrompt(true);
        return;
    }
    // Logique de like
};

// Dans le JSX
{showAuthPrompt && (
    <AuthPrompt 
        action="liker cette vidéo" 
        onClose={() => setShowAuthPrompt(false)}
    />
)}
```

### 2. **Modification de App.tsx**

#### Détection de la Route Watch

```typescript
// Route publique pour /watch/:uid (accessible sans authentification)
const isWatchRoute = location.pathname.startsWith('/watch/');
```

#### Logique d'Authentification Conditionnelle

```typescript
// Avant: Toutes les routes nécessitaient une authentification
if (!isAuthenticated) {
    return <Routes>...</Routes>;
}

// Après: Seules les routes non-watch nécessitent une authentification
if (!isAuthenticated && !isWatchRoute) {
    return <Routes>...</Routes>;
}
```

#### Route Watch en Premier

La route `/watch/:uid` est maintenant définie **avant** les routes protégées et **en dehors** du bloc conditionnel `isAuthenticated`:

```typescript
<Routes>
    {/* Watch Route - Accessible sans authentification */}
    <Route path="/watch/:uid" element={
        <WatchScreen onReturnHome={handleReturnHome} />
    } />

    {/* Routes protégées - Nécessitent une authentification */}
    {isAuthenticated && (
        <>
            <Route path="/home" element={...} />
            {/* Autres routes protégées */}
        </>
    )}
</Routes>
```

#### Affichage Conditionnel des Composants UI

```typescript
// Breadcrumbs: Masqués sur /watch/:uid
const showBreadcrumbs = !['/home', '/search', '/profile', '/login', '/register', '/forgot-password'].includes(location.pathname) && !isWatchRoute;

// Bottom Nav: Affichée uniquement pour les utilisateurs connectés
const showBottomNav = ['/home', '/search', '/profile'].includes(location.pathname) && isAuthenticated;
```

## Comportement de l'Application

### Pour les Utilisateurs Non Connectés

#### ✅ **Actions Autorisées**
1. **Regarder des vidéos** via `/watch/:uid`
2. **Naviguer entre les épisodes** (si série/podcast)
3. **Voir les informations** du média
4. **Contrôler la lecture** (play, pause, volume, plein écran)

#### ❌ **Actions Protégées** (Affichent AuthPrompt)
1. **Liker** une vidéo
2. **Commenter** une vidéo
3. **Ajouter aux favoris**
4. **Créer une playlist**
5. **Suivre la progression** de visionnage

### Pour les Utilisateurs Connectés

#### ✅ **Toutes les Actions Disponibles**
- Toutes les actions des utilisateurs non connectés
- Plus toutes les actions protégées

## Flux Utilisateur

### Scénario 1: Utilisateur Non Connecté Regarde une Vidéo

```
1. Utilisateur accède à /watch/abc123
2. ✅ Vidéo se charge et commence à jouer
3. Utilisateur clique sur "❤️ Like"
4. ⚠️ AuthPrompt s'affiche: "Vous devez être connecté pour liker cette vidéo"
5. Utilisateur a 3 options:
   a) Se connecter → Redirigé vers /login
   b) Créer un compte → Redirigé vers /register
   c) Continuer sans compte → Modal se ferme, continue de regarder
```

### Scénario 2: Utilisateur Connecté Regarde une Vidéo

```
1. Utilisateur accède à /watch/abc123
2. ✅ Vidéo se charge et commence à jouer
3. Utilisateur clique sur "❤️ Like"
4. ✅ Like est enregistré immédiatement
5. Aucune interruption
```

### Scénario 3: Partage de Lien

```
1. Utilisateur A (connecté) partage le lien /watch/abc123
2. Utilisateur B (non connecté) clique sur le lien
3. ✅ Utilisateur B peut regarder la vidéo immédiatement
4. Pas besoin de créer un compte pour voir le contenu
```

## Avantages de cette Approche

### 1. **Meilleure Acquisition d'Utilisateurs**
- Les utilisateurs peuvent découvrir le contenu avant de s'inscrire
- Réduit la friction pour les nouveaux visiteurs
- Augmente le taux de conversion

### 2. **Partage Facilité**
- Les liens de vidéos fonctionnent pour tout le monde
- Pas de mur de connexion frustrant
- Meilleur pour le SEO et le partage social

### 3. **Expérience Utilisateur Améliorée**
- Les utilisateurs décident quand créer un compte
- Pas de pression immédiate
- Découverte du contenu en premier

### 4. **Conversion Progressive**
- L'utilisateur voit la valeur du contenu
- Puis est incité à créer un compte pour les fonctionnalités premium
- Conversion plus naturelle et moins forcée

## Sécurité et Limitations

### Actions Protégées

Les actions suivantes **nécessitent** une authentification:

```typescript
// Dans MoviePlayerScreen.tsx ou EpisodePlayerScreen.tsx
const handleLike = () => {
    if (!isAuthenticated) {
        setShowAuthPrompt(true);
        return;
    }
    // Logique de like
};

const handleAddToFavorites = () => {
    if (!isAuthenticated) {
        setShowAuthPrompt(true);
        return;
    }
    // Logique d'ajout aux favoris
};

const handleComment = () => {
    if (!isAuthenticated) {
        setShowAuthPrompt(true);
        return;
    }
    // Logique de commentaire
};
```

### Données Protégées

Les données suivantes ne sont **pas** accessibles sans authentification:
- Historique de visionnage
- Favoris personnels
- Playlists personnelles
- Préférences utilisateur
- Profil utilisateur

## Prochaines Étapes

### 1. **Intégrer AuthPrompt dans les Écrans de Lecture**

✅ **FAIT**: `MoviePlayerScreen.tsx` et `EpisodePlayerScreen.tsx` ont été modifiés pour:
- Importer `AuthPrompt`
- Ajouter l'état `showAuthPrompt`
- Vérifier `isAuthenticated` avant les actions protégées
- Afficher `AuthPrompt` quand nécessaire
- Gérer l'événement `onEnded` pour proposer la connexion à la fin de la vidéo

### 2. **Ajouter des Indicateurs Visuels**

- Badge "Connectez-vous pour plus de fonctionnalités"
- Icônes de cadenas sur les boutons protégés
- Tooltips explicatifs

### 3. **Analytics**

Tracker:
- Nombre de vues par utilisateurs non connectés
- Taux de conversion (vue → inscription)
- Actions bloquées les plus fréquentes

### 4. **Optimisations SEO**

- Ajouter des meta tags pour `/watch/:uid`
- Implémenter Open Graph pour le partage social
- Ajouter des données structurées (Schema.org)

## Test de Validation

### Tests à Effectuer

1. **Accès Public**:
   ```
   ✅ Ouvrir /watch/abc123 sans être connecté
   ✅ Vérifier que la vidéo se charge
   ✅ Vérifier que les contrôles fonctionnent
   ```

2. **Actions Protégées**:
   ```
   ✅ Cliquer sur "Like" sans être connecté
   ✅ Vérifier que AuthPrompt s'affiche
   ✅ Cliquer sur "Se connecter"
   ✅ Vérifier la redirection vers /login
   ```

3. **Navigation**:
   ```
   ✅ Depuis /watch/:uid, cliquer sur "Retour"
   ✅ Vérifier la redirection appropriée
   ✅ Tester la navigation entre épisodes
   ```

4. **UI Conditionnelle**:
   ```
   ✅ Vérifier que Bottom Nav n'apparaît pas sur /watch/:uid
   ✅ Vérifier que Breadcrumbs n'apparaissent pas sur /watch/:uid
   ```

## Conclusion

Cette implémentation permet un équilibre parfait entre:
- **Accessibilité**: Le contenu est accessible à tous
- **Engagement**: Les utilisateurs peuvent découvrir avant de s'engager
- **Monétisation**: Les fonctionnalités premium incitent à l'inscription
- **Sécurité**: Les données sensibles restent protégées

L'expérience utilisateur est grandement améliorée, et le taux de conversion devrait augmenter grâce à cette approche progressive.
