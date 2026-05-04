#!/usr/bin/env node

/**
 * Script pour mettre à jour les statistiques pré-calculées des séries
 * Résout le problème N+1 queries en pré-calculant seasonsCount, episodesCount et totalDuration
 * 
 * Usage:
 * node scripts/updateSeriesStats.js --all          # Mettre à jour toutes les séries
 * node scripts/updateSeriesStats.js --uid XXXX    # Mettre à jour une série spécifique
 * node scripts/updateSeriesStats.js --check        # Vérifier les séries sans stats
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, updateDoc, Timestamp } = require('firebase/firestore');

// Configuration Firebase (utiliser les mêmes configs que l'app)
const firebaseConfig = {
  // Copier la configuration depuis firebase.ts ou utiliser les variables d'environnement
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SERIES_COLLECTION = 'series';
const SEASONS_SERIES_COLLECTION = 'seasonsSeries';
const EPISODES_SERIES_COLLECTION = 'episodesSeries';

/**
 * Calcule et met à jour les stats pour une série spécifique
 */
async function updateSeriesStats(uid_serie) {
  try {
    console.log(`🔄 Mise à jour des stats pour la série ${uid_serie}...`);
    
    // Récupérer toutes les saisons de la série
    const seasonsQuery = query(
      collection(db, SEASONS_SERIES_COLLECTION),
      where('uid_serie', '==', uid_serie)
    );
    const seasonsSnapshot = await getDocs(seasonsQuery);
    const seasonsCount = seasonsSnapshot.size;
    
    // Récupérer tous les épisodes de toutes les saisons
    let episodesCount = 0;
    let totalDuration = 0;
    
    for (const seasonDoc of seasonsSnapshot.docs) {
      const season = seasonDoc.data();
      
      const episodesQuery = query(
        collection(db, EPISODES_SERIES_COLLECTION),
        where('uid_season', '==', season.uid_season)
      );
      const episodesSnapshot = await getDocs(episodesQuery);
      
      episodesCount += episodesSnapshot.size;
      
      // Calculer la durée totale
      for (const episodeDoc of episodesSnapshot.docs) {
        const episode = episodeDoc.data();
        if (episode.runtime) {
          totalDuration += episode.runtime;
        }
      }
    }
    
    // Mettre à jour la série avec les stats pré-calculées
    const serieQuery = query(
      collection(db, SERIES_COLLECTION),
      where('uid_serie', '==', uid_serie),
      limit(1)
    );
    const serieSnapshot = await getDocs(serieQuery);
    
    if (serieSnapshot.empty) {
      console.warn(`⚠️ Série avec UID ${uid_serie} non trouvée`);
      return;
    }
    
    const serieRef = doc(db, SERIES_COLLECTION, serieSnapshot.docs[0].id);
    await updateDoc(serieRef, {
      seasonsCount,
      episodesCount,
      totalDuration,
      statsUpdatedAt: Timestamp.now()
    });
    
    console.log(`✅ Stats mises à jour pour ${uid_serie}: ${seasonsCount} saisons, ${episodesCount} épisodes, ${totalDuration}s total`);
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de la série ${uid_serie}:`, error);
    throw error;
  }
}

/**
 * Met à jour toutes les séries (batch processing)
 */
async function updateAllSeriesStats() {
  try {
    console.log('🔄 Début de la mise à jour des stats pour toutes les séries...');
    
    // Récupérer toutes les séries
    const seriesQuery = query(collection(db, SERIES_COLLECTION), where('is_hidden', '==', false));
    const seriesSnapshot = await getDocs(seriesQuery);
    const allSeries = seriesSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    
    console.log(`📊 ${allSeries.length} séries trouvées`);
    
    const batchSize = 10; // Limiter pour éviter l'overload
    let processedCount = 0;
    
    for (let i = 0; i < allSeries.length; i += batchSize) {
      const batch = allSeries.slice(i, i + batchSize);
      
      console.log(`📦 Traitement du batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allSeries.length / batchSize)} (${batch.length} séries)`);
      
      await Promise.all(
        batch.map(serie => 
          updateSeriesStats(serie.uid_serie)
          .catch(error => console.error(`❌ Erreur pour la série ${serie.uid_serie}:`, error.message))
        )
      );
      
      processedCount += batch.length;
      console.log(`✅ Batch terminé - ${processedCount}/${allSeries.length} séries traitées`);
      
      // Pause entre les batches pour éviter de surcharger Firestore
      if (i + batchSize < allSeries.length) {
        console.log('⏱️ Pause de 2 secondes...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('🎉 Mise à jour des stats terminée pour toutes les séries!');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour globale:', error);
    process.exit(1);
  }
}

/**
 * Vérifie les séries qui n'ont pas de stats pré-calculées
 */
async function checkSeriesWithoutStats() {
  try {
    console.log('🔍 Vérification des séries sans stats pré-calculées...');
    
    const seriesQuery = query(collection(db, SERIES_COLLECTION), where('is_hidden', '==', false));
    const seriesSnapshot = await getDocs(seriesQuery);
    const allSeries = seriesSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    
    const seriesWithoutStats = allSeries.filter(serie => 
      serie.seasonsCount === undefined || 
      serie.episodesCount === undefined ||
      serie.statsUpdatedAt === undefined
    );
    
    console.log(`📊 Résultats:`);
    console.log(`   - Total séries: ${allSeries.length}`);
    console.log(`   - Séries sans stats: ${seriesWithoutStats.length}`);
    console.log(`   - Séries avec stats: ${allSeries.length - seriesWithoutStats.length}`);
    
    if (seriesWithoutStats.length > 0) {
      console.log('\n⚠️ Séries nécessitant une mise à jour:');
      seriesWithoutStats.forEach(serie => {
        console.log(`   - ${serie.title_serie} (${serie.uid_serie})`);
      });
      
      console.log('\n💡 Pour mettre à jour ces séries, exécutez:');
      console.log('   node scripts/updateSeriesStats.js --all');
    } else {
      console.log('\n✅ Toutes les séries ont des stats pré-calculées!');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  }
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const param = args[1];
  
  switch (command) {
    case '--all':
      await updateAllSeriesStats();
      break;
      
    case '--uid':
      if (!param) {
        console.error('❌ Veuillez spécifier un UID de série: --uid XXXX');
        process.exit(1);
      }
      await updateSeriesStats(param);
      break;
      
    case '--check':
      await checkSeriesWithoutStats();
      break;
      
    default:
      console.log('📖 Usage:');
      console.log('   node scripts/updateSeriesStats.js --all          # Mettre à jour toutes les séries');
      console.log('   node scripts/updateSeriesStats.js --uid XXXX    # Mettre à jour une série spécifique');
      console.log('   node scripts/updateSeriesStats.js --check        # Vérifier les séries sans stats');
      process.exit(0);
  }
}

// Gérer les erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Lancer le script
if (require.main === module) {
  main();
}

module.exports = {
  updateSeriesStats,
  updateAllSeriesStats,
  checkSeriesWithoutStats
};
