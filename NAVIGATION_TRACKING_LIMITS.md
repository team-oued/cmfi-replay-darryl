# Limites et Optimisation du Tracking de Navigation

## 📊 Stratégie de Limitation des Données

Pour éviter que la base de données Firestore ne devienne trop volumineuse, plusieurs mécanismes de limitation ont été implémentés :

### 1. **Déduplication Intelligente**
- **Minimum 5 secondes** entre deux navigations vers la même page
- Évite d'enregistrer les clics rapides ou les retours en arrière accidentels
- Réduit significativement le nombre de documents créés

### 2. **Limite par Utilisateur**
- **Maximum 50 navigations** par utilisateur
- Les navigations les plus anciennes sont automatiquement supprimées
- Garantit que chaque utilisateur n'a jamais plus de 50 documents

### 3. **Rétention Temporelle**
- **30 jours de rétention** maximum
- Les navigations de plus de 30 jours sont automatiquement supprimées
- Même si un utilisateur a moins de 50 navigations, les anciennes (>30 jours) sont supprimées

### 4. **Nettoyage Automatique**
- Nettoyage automatique à chaque nouvelle navigation
- Suppression des navigations en excès et des anciennes navigations
- Pas besoin d'intervention manuelle

## 🔧 Configuration

Les limites peuvent être ajustées dans `lib/firestore.ts` :

```typescript
export const navigationTrackingService = {
    MAX_NAVIGATIONS_PER_USER: 50,        // Maximum par utilisateur
    NAVIGATION_RETENTION_DAYS: 30,       // Jours de rétention
    MIN_TIME_BETWEEN_SAME_PAGE: 5000,    // 5 secondes en millisecondes
    // ...
}
```

## 📈 Estimation des Coûts

### Scénario Optimiste (avec déduplication)
- **100 utilisateurs actifs par jour**
- **10 navigations par utilisateur** (après déduplication)
- **= 1,000 documents/jour**
- **= 30,000 documents/mois**
- **Coût Firestore** : ~$0.18/mois (gratuit jusqu'à 50,000 lectures/jour)

### Scénario Réaliste
- **500 utilisateurs actifs par jour**
- **20 navigations par utilisateur** (après déduplication)
- **= 10,000 documents/jour**
- **= 300,000 documents/mois**
- **Coût Firestore** : ~$1.80/mois (gratuit jusqu'à 1M de lectures/jour)

## 🧹 Nettoyage Périodique (Optionnel)

Un script de nettoyage périodique est disponible dans `scripts/cleanupOldNavigations.js`.

### Exécution Manuelle
```bash
node scripts/cleanupOldNavigations.js
```

### Exécution Automatique (Cloud Functions)
Vous pouvez créer une Cloud Function qui s'exécute quotidiennement :

```javascript
// functions/index.js
const functions = require('firebase-functions');
const { navigationTrackingService } = require('./lib/firestore');

exports.cleanupOldNavigations = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
        await navigationTrackingService.cleanupAllOldNavigations();
    });
```

## ✅ Avantages de cette Approche

1. **Contrôle des coûts** : Limite garantie du nombre de documents
2. **Performance** : Moins de données = requêtes plus rapides
3. **Pertinence** : Garde seulement les navigations récentes et utiles
4. **Automatique** : Pas besoin d'intervention manuelle
5. **Flexible** : Les limites peuvent être ajustées facilement

## 📝 Notes Importantes

- Les navigations sont supprimées automatiquement, pas besoin d'action manuelle
- Le nettoyage se fait en arrière-plan et n'affecte pas les performances
- Les utilisateurs voient toujours leurs 50 dernières navigations
- Les données de plus de 30 jours sont perdues (par design)

