# Correction du problème de disposition du lecteur vidéo sur mobile

## Problème identifié

Sur mobile, le lecteur vidéo était surmonté par le header fixe de navigation, rendant une partie de la vidéo invisible.

### Cause
- Le header mobile est en position `fixed` avec `z-20` (dans `components/Header.tsx`)
- Le lecteur vidéo commençait à `top: 0`, ce qui le faisait passer sous le header fixe
- Le bouton de retour était également mal positionné

## Solution appliquée

### 1. Ajout de padding-top sur mobile

**Fichiers modifiés :**
- `screens/MoviePlayerScreen.tsx`
- `screens/EpisodePlayerScreen.tsx`

**Changements :**

```tsx
// AVANT
<div className="relative">
    <header className="absolute top-0 left-0 z-10 p-2 sm:p-4">

// APRÈS
<div className="relative pt-16 md:pt-0">
    <header className="absolute top-16 md:top-0 left-0 z-10 p-2 sm:p-4">
```

### 2. Explication des classes

- `pt-16` : Ajoute un padding-top de 4rem (64px) sur mobile pour compenser la hauteur du header fixe
- `md:pt-0` : Supprime le padding sur les écrans moyens et plus grands (≥768px)
- `top-16` : Positionne le bouton de retour à 4rem du haut sur mobile
- `md:top-0` : Repositionne le bouton en haut sur les écrans plus grands

## Résultat

✅ **Sur mobile (< 768px) :**
- Le lecteur vidéo commence en dessous du header fixe
- Le bouton de retour est correctement positionné
- Aucun chevauchement

✅ **Sur desktop (≥ 768px) :**
- Comportement inchangé
- Le lecteur vidéo occupe toute la largeur
- Le bouton de retour est en haut à gauche du lecteur

## Test

Pour vérifier la correction :
1. Ouvrir l'application sur mobile ou en mode responsive
2. Naviguer vers un film ou un épisode
3. Vérifier que le lecteur vidéo est entièrement visible
4. Vérifier que le bouton de retour est accessible

## Build

✅ Le build a été testé et réussi sans erreurs.
