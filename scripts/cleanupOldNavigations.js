/**
 * Script de nettoyage périodique des anciennes navigations
 * 
 * Ce script nettoie automatiquement les navigations de plus de 30 jours
 * et limite à 50 navigations maximum par utilisateur.
 * 
 * À exécuter périodiquement (par exemple via un cron job ou Cloud Functions)
 * 
 * Usage: node scripts/cleanupOldNavigations.js
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '../server/.env') });

const MAX_NAVIGATIONS_PER_USER = 50;
const NAVIGATION_RETENTION_DAYS = 30;

async function cleanupOldNavigations() {
    try {
        // Initialiser Firebase Admin
        if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT non défini dans .env');
        }

        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        
        if (!initializeApp().length) {
            initializeApp({
                credential: cert(serviceAccount)
            });
        }

        const db = getFirestore();
        const USER_NAVIGATION_COLLECTION = 'user_navigation';

        console.log('🧹 Début du nettoyage des anciennes navigations...');

        // Calculer la date limite
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - NAVIGATION_RETENTION_DAYS);
        const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

        console.log(`📅 Suppression des navigations antérieures au ${cutoffDate.toLocaleDateString('fr-FR')}`);

        // Récupérer toutes les navigations de plus de 30 jours
        const oldNavigationsSnapshot = await db.collection(USER_NAVIGATION_COLLECTION)
            .where('timestamp', '<', cutoffTimestamp)
            .limit(500)
            .get();

        let deletedCount = 0;
        const batch = db.batch();
        let batchCount = 0;

        oldNavigationsSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
            batchCount++;
            deletedCount++;

            // Commit par batch de 500 (limite Firestore)
            if (batchCount >= 500) {
                batch.commit();
                batchCount = 0;
            }
        });

        // Commit le dernier batch
        if (batchCount > 0) {
            await batch.commit();
        }

        console.log(`✅ ${deletedCount} navigation(s) de plus de ${NAVIGATION_RETENTION_DAYS} jours supprimée(s)`);

        // Nettoyer les navigations en excès par utilisateur
        console.log('🔍 Nettoyage des navigations en excès par utilisateur...');

        // Récupérer tous les utilisateurs uniques
        const allNavigationsSnapshot = await db.collection(USER_NAVIGATION_COLLECTION)
            .orderBy('timestamp', 'desc')
            .get();

        const navigationsByUser = {};
        allNavigationsSnapshot.forEach((doc) => {
            const data = doc.data();
            const userUid = data.user_uid;
            if (!navigationsByUser[userUid]) {
                navigationsByUser[userUid] = [];
            }
            navigationsByUser[userUid].push({ id: doc.id, ref: doc.ref, ...data });
        });

        let excessDeletedCount = 0;
        const excessBatch = db.batch();
        let excessBatchCount = 0;

        // Pour chaque utilisateur, garder seulement les N plus récentes
        for (const [userUid, navigations] of Object.entries(navigationsByUser)) {
            if (navigations.length > MAX_NAVIGATIONS_PER_USER) {
                const excessNavigations = navigations.slice(MAX_NAVIGATIONS_PER_USER);
                excessNavigations.forEach((nav) => {
                    excessBatch.delete(nav.ref);
                    excessBatchCount++;
                    excessDeletedCount++;

                    // Commit par batch de 500
                    if (excessBatchCount >= 500) {
                        excessBatch.commit();
                        excessBatchCount = 0;
                    }
                });
            }
        }

        // Commit le dernier batch
        if (excessBatchCount > 0) {
            await excessBatch.commit();
        }

        console.log(`✅ ${excessDeletedCount} navigation(s) en excès supprimée(s)`);
        console.log(`🎉 Nettoyage terminé: ${deletedCount + excessDeletedCount} navigation(s) supprimée(s) au total`);

    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
        process.exit(1);
    }
}

// Exécuter le nettoyage
cleanupOldNavigations()
    .then(() => {
        console.log('✅ Script terminé avec succès');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });

