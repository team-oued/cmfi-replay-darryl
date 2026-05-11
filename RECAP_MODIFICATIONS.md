# Récapitulatif des modifications (détectées par Git)

Ce document résume les modifications récentes apportées au projet, telles que détectées par `git diff`.

## 1. Optimisations et Performance
- **`lib/firestore.ts`** : Refactorisation de `getAllHistory` pour utiliser des requêtes par lots (batch) et des appels parallèles. Cela réduit considérablement le nombre de requêtes à Firestore lors du chargement de l'historique.
- **`components/HistorySection.tsx`** : Utilisation de `React.memo` pour le composant `HistoryCard` afin d'éviter des re-rendus inutiles.
- **`screens/HistoryScreen.tsx`** : Améliorations de performance (chargement asynchrone optimisé).

## 2. Améliorations du Lecteur Vidéo
*Concerne `EpisodePlayerScreen.tsx` et `MoviePlayerScreen.tsx`*
- **Correction du conflit Espace** : Désactivation des raccourcis clavier (Espace pour play/pause) lorsque l'utilisateur tape dans un champ de commentaire ou une zone de saisie.
- **Double-tap pour chercher** : Ajout du support pour avancer/reculer de 10 secondes en double-tapant sur les côtés de la vidéo (mobile/tactile).
- **Feedback Visuel** : Affichage d'un indicateur "-10s" ou "+10s" lors des recherches rapides.
- **Indicateur de Chargement** : Amélioration du spinner de chargement ("Glide Spinner") pour une meilleure visibilité.
- **Gestion des Clics** : Amélioration de la logique de clic sur la vidéo pour alterner entre play/pause de manière plus fluide.

## 3. Interface Utilisateur (UI/UX)
- **`screens/HomeScreen.tsx`** :
    - Refonte complète de la structure des sections.
    - Uniformisation des espacements et des titres de catégories.
    - Remplacement des boutons "Voir tout" par des liens textuels plus discrets et élégants.
    - Nettoyage des logs de débogage et des sections inutilisées.
- **`screens/SeriesScreen.tsx`** :
    - Les statistiques (saisons/épisodes) sont désormais affichées sous l'affiche de la série plutôt qu'en superposition, améliorant la lisibilité.
    - Ajout d'une légende pour les icônes de statistiques en bas de page.
- **`components/HeroPrimeVideo.tsx`** : Simplification du Hero en supprimant les dégradés superposés et l'image redondante sur le côté droit en version bureau.

## 4. Métadonnées et Partage
- Mise à jour automatique des balises Open Graph (`title`, `description`, `image`) lors de la lecture d'un film ou d'un épisode pour un meilleur rendu lors du partage sur les réseaux sociaux.
