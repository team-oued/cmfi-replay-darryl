import express from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';
import { logAdminAction } from '../middleware/auth.js';
import { episodeSerieService, seasonSerieService } from '../services/firestore.js';

const router = express.Router();

function getDb() {
    if (getApps().length === 0) {
        throw new Error('Firebase Admin not initialized. Please configure Firebase credentials in .env file.');
    }
    return getFirestore();
}

/**
 * GET /admin/me
 * Retourne les infos de l'admin connecté
 */
router.get('/me', async (req, res) => {
    try {
        res.json({
            isAdmin: true,
            email: req.user.email,
            uid: req.user.uid,
            role: req.user.allowlistDoc.role || 'admin'
        });
    } catch (error) {
        console.error('Error in GET /admin/me:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des informations' });
    }
});

/**
 * GET /admin/app/videos
 * Liste toutes les vidéos/épisodes de l'app
 */
router.get('/app/videos', async (req, res) => {
    try {
        const db = getDb();
        const { seasonId, status, search } = req.query;
        
        let query = db.collection('episodesSeries');
        
        // Filtres optionnels
        if (seasonId) {
            query = query.where('uid_season', '==', seasonId);
        }
        
        if (status) {
            query = query.where('status', '==', status);
        }

        const snapshot = await query.get();
        let episodes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Filtre de recherche côté serveur (peut être optimisé avec Firestore)
        if (search) {
            const searchLower = search.toLowerCase();
            episodes = episodes.filter(ep => 
                ep.title?.toLowerCase().includes(searchLower) ||
                ep.original_title?.toLowerCase().includes(searchLower) ||
                ep.overview?.toLowerCase().includes(searchLower)
            );
        }

        // Trier par episode_numero
        episodes.sort((a, b) => (a.episode_numero || 0) - (b.episode_numero || 0));

        try {
            await logAdminAction('list_videos', { count: episodes.length }, req.user.uid, req.user.email);
        } catch (logError) {
            console.warn('Error logging action (non-blocking):', logError);
        }

        res.json({ videos: episodes, count: episodes.length });
    } catch (error) {
        console.error('Error in GET /admin/app/videos:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des vidéos' });
    }
});

/**
 * PATCH /admin/app/videos/:id
 * Modifie un épisode
 */
router.patch('/app/videos/:id', async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const updates = req.body;

        // Champs autorisés à modifier
        const allowedFields = [
            'title', 'original_title', 'overview', 'overviewFr',
            'picture_path', 'backdrop_path', 'hidden',
            'search_keywords', 'uid_season', 'episode_numero',
            'episode_number', 'embedUrl', 'video_path_hd', 'video_path_sd',
            'runtime', 'runtime_h_m', 'status', 'TranscriptText',
            'title_lowercase', 'title_serie'
        ];

        const filteredUpdates = {};
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        // Ajouter updatedAt
        filteredUpdates.updatedAt = new Date();

        const episodeRef = db.collection('episodesSeries').doc(id);
        await episodeRef.update(filteredUpdates);

        const updatedDoc = await episodeRef.get();

        try {
            await logAdminAction('update_video', {
                videoId: id,
                updates: filteredUpdates
            }, req.user.uid, req.user.email);
        } catch (logError) {
            console.warn('Error logging action (non-blocking):', logError);
        }

        res.json({
            success: true,
            video: { id: updatedDoc.id, ...updatedDoc.data() }
        });
    } catch (error) {
        console.error('Error in PATCH /admin/app/videos/:id:', error);
        if (error.message && error.message.includes('Firebase Admin not initialized')) {
            res.status(500).json({ 
                error: 'Firebase Admin non initialisé',
                details: 'Veuillez configurer FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, et FIREBASE_CLIENT_EMAIL dans server/.env pour utiliser cette fonctionnalité.'
            });
        } else {
            res.status(500).json({ error: 'Erreur lors de la mise à jour de la vidéo', details: error.message });
        }
    }
});

/**
 * GET /admin/series
 * Liste toutes les séries
 */
router.get('/series', async (req, res) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📺 GET /admin/series - Début');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    try {
        const db = getDb();
        console.log('✅ Firebase Admin DB accessible');
        
        const snapshot = await db.collection('series').get();
        console.log(`✅ ${snapshot.size} séries trouvées dans Firestore`);
        
        const series = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('✅ Retour de', series.length, 'séries');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        res.json({ series, count: series.length });
    } catch (error) {
        console.error('❌ Error in GET /admin/series:', error);
        console.error('   - Message:', error.message);
        console.error('   - Stack:', error.stack?.substring(0, 300));
        if (error.message && error.message.includes('Firebase Admin not initialized')) {
            res.status(500).json({ 
                error: 'Firebase Admin non initialisé',
                details: 'Veuillez configurer les credentials Firebase Admin dans server/.env pour utiliser cette fonctionnalité.'
            });
        } else {
            res.status(500).json({ error: 'Erreur lors de la récupération des séries', details: error.message });
        }
    }
});

/**
 * GET /admin/seasons
 * Liste toutes les saisons
 */
router.get('/seasons', async (req, res) => {
    try {
        const db = getDb();
        const { serieId } = req.query;
        
        let query = db.collection('seasonsSeries');
        if (serieId) {
            query = query.where('uid_serie', '==', serieId);
        }

        const snapshot = await query.get();
        const seasons = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({ seasons, count: seasons.length });
    } catch (error) {
        console.error('Error in GET /admin/seasons:', error);
        if (error.message && error.message.includes('Firebase Admin not initialized')) {
            res.status(500).json({ 
                error: 'Firebase Admin non initialisé',
                details: 'Veuillez configurer les credentials Firebase Admin dans server/.env pour utiliser cette fonctionnalité.'
            });
        } else {
            res.status(500).json({ error: 'Erreur lors de la récupération des saisons', details: error.message });
        }
    }
});

/**
 * PATCH /admin/seasons/:id
 * Modifie une saison
 */
router.patch('/seasons/:id', async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const updates = req.body;

        // Champs autorisés à modifier
        const allowedFields = [
            'title_season',
            'title_serie',
            'overview',
            'poster_path',
            'backdrop_path',
            'season_number',
            'year_season',
            'premium_text',
            'nb_episodes'
        ];

        const filteredUpdates = {};
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        // Ajouter updatedAt
        filteredUpdates.updatedAt = new Date();

        const seasonRef = db.collection('seasonsSeries').doc(id);
        await seasonRef.update(filteredUpdates);

        const updatedDoc = await seasonRef.get();

        try {
            await logAdminAction('update_season', {
                seasonId: id,
                updates: filteredUpdates
            }, req.user.uid, req.user.email);
        } catch (logError) {
            console.warn('Error logging action (non-blocking):', logError);
        }

        res.json({
            success: true,
            season: { id: updatedDoc.id, ...updatedDoc.data() }
        });
    } catch (error) {
        console.error('Error in PATCH /admin/seasons/:id:', error);
        if (error.message && error.message.includes('Firebase Admin not initialized')) {
            res.status(500).json({ 
                error: 'Firebase Admin non initialisé',
                details: 'Veuillez configurer FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, et FIREBASE_CLIENT_EMAIL dans server/.env pour utiliser cette fonctionnalité.'
            });
        } else {
            res.status(500).json({ error: 'Erreur lors de la mise à jour de la saison', details: error.message });
        }
    }
});

/**
 * POST /admin/seasons
 * Crée une nouvelle saison
 */
router.post('/seasons', async (req, res) => {
    try {
        const db = getDb();
        const {
            uid_serie,
            title_season,
            title_serie,
            overview,
            poster_path,
            backdrop_path,
            season_number,
            year_season,
            premium_text
        } = req.body;

        if (!uid_serie || !title_season || !season_number) {
            return res.status(400).json({ error: 'uid_serie, title_season et season_number sont requis' });
        }

        // Générer un uid_season unique
        const uid_season = `season_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const seasonData = {
            uid_season,
            uid_serie,
            title_season,
            title_serie: title_serie || '',
            overview: overview || '',
            poster_path: poster_path || '',
            backdrop_path: backdrop_path || '',
            season_number: parseInt(season_number),
            nb_episodes: 0,
            year_season: year_season ? parseInt(year_season) : new Date().getFullYear(),
            premium_text: premium_text || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const seasonRef = await db.collection('seasonsSeries').add(seasonData);
        const newSeason = await seasonRef.get();

        try {
            await logAdminAction('create_season', {
                seasonId: seasonRef.id,
                uid_season,
                title_season
            }, req.user.uid, req.user.email);
        } catch (logError) {
            console.warn('Error logging action (non-blocking):', logError);
        }

        res.status(201).json({
            success: true,
            season: { id: newSeason.id, ...newSeason.data() }
        });
    } catch (error) {
        console.error('Error in POST /admin/seasons:', error);
        if (error.message && error.message.includes('Firebase Admin not initialized')) {
            res.status(500).json({ 
                error: 'Firebase Admin non initialisé',
                details: 'Veuillez configurer FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, et FIREBASE_CLIENT_EMAIL dans server/.env pour utiliser cette fonctionnalité.'
            });
        } else {
            res.status(500).json({ error: 'Erreur lors de la création de la saison', details: error.message });
        }
    }
});

/**
 * POST /admin/import/vimeo-to-app
 * Importe une vidéo Vimeo dans l'app
 */
router.post('/import/vimeo-to-app', async (req, res) => {
    try {
        const db = getDb();
        const {
            vimeoId,
            vimeoUri,
            vimeoLink,
            embedUrl,
            title,
            description,
            thumbnail,
            duration,
            seasonId,
            createNewSeason,
            newSeasonData
        } = req.body;

        if (!vimeoId || !embedUrl) {
            return res.status(400).json({ error: 'vimeoId et embedUrl sont requis' });
        }

        let finalSeasonId = seasonId;
        let finalSeasonUid = null;

        // Créer une nouvelle saison si demandé
        if (createNewSeason && newSeasonData) {
            const uid_season = `season_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const seasonData = {
                uid_season,
                uid_serie: newSeasonData.uid_serie,
                title_season: newSeasonData.title_season,
                title_serie: newSeasonData.title_serie || '',
                overview: newSeasonData.overview || '',
                poster_path: newSeasonData.poster_path || '',
                backdrop_path: newSeasonData.backdrop_path || '',
                season_number: parseInt(newSeasonData.season_number || 1),
                nb_episodes: 0,
                year_season: parseInt(newSeasonData.year_season || new Date().getFullYear()),
                premium_text: newSeasonData.premium_text || '',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const seasonRef = await db.collection('seasonsSeries').add(seasonData);
            finalSeasonId = seasonRef.id;
            finalSeasonUid = uid_season;
        } else if (seasonId) {
            // Récupérer l'uid_season depuis la saison existante
            const seasonDoc = await db.collection('seasonsSeries').doc(seasonId).get();
            if (!seasonDoc.exists) {
                return res.status(404).json({ error: 'Saison non trouvée' });
            }
            finalSeasonUid = seasonDoc.data().uid_season;
        } else {
            return res.status(400).json({ error: 'seasonId ou createNewSeason requis' });
        }

        // Récupérer le nombre d'épisodes existants dans la saison pour déterminer episode_numero
        const episodesSnapshot = await db.collection('episodesSeries')
            .where('uid_season', '==', finalSeasonUid)
            .get();
        const episode_numero = episodesSnapshot.size + 1;

        // Générer un uid_episode unique
        const uid_episode = `episode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Convertir la durée (secondes) en format h:m
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const runtime_h_m = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        // Récupérer les infos de la saison pour title_serie
        const seasonDoc = await db.collection('seasonsSeries')
            .where('uid_season', '==', finalSeasonUid)
            .limit(1)
            .get();
        const seasonData = seasonDoc.docs[0]?.data() || {};

        const episodeData = {
            uid_episode,
            uid_season: finalSeasonUid,
            title: title || 'Nouvel épisode',
            original_title: title || 'Nouvel épisode',
            title_lowercase: (title || 'Nouvel épisode').toLowerCase(),
            title_serie: seasonData.title_serie || '',
            overview: description || '',
            overviewFr: description || '',
            embedUrl,
            video_path_hd: vimeoLink || '',
            video_path_sd: vimeoLink || '',
            picture_path: thumbnail || '',
            backdrop_path: thumbnail || '',
            episode_numero,
            runtime: duration || 0,
            runtime_h_m,
            hidden: false,
            search_keywords: [],
            TranscriptText: '',
            views: 0,
            status: 'imported',
            vimeoId,
            vimeoUri: vimeoUri || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const episodeRef = await db.collection('episodesSeries').add(episodeData);

        // Mettre à jour nb_episodes de la saison
        if (finalSeasonId) {
            await db.collection('seasonsSeries').doc(finalSeasonId).update({
                nb_episodes: episodesSnapshot.size + 1,
                updatedAt: new Date()
            });
        }

        try {
            await logAdminAction('import_vimeo_video', {
                episodeId: episodeRef.id,
                vimeoId,
                seasonId: finalSeasonId,
                title
            }, req.user.uid, req.user.email);
        } catch (logError) {
            console.warn('Error logging action (non-blocking):', logError);
        }

        res.status(201).json({
            success: true,
            episode: { id: episodeRef.id, ...episodeData }
        });
    } catch (error) {
        console.error('Error in POST /admin/import/vimeo-to-app:', error);
        if (error.message && error.message.includes('Firebase Admin not initialized')) {
            res.status(500).json({ 
                error: 'Firebase Admin non initialisé',
                details: 'Veuillez configurer FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, et FIREBASE_CLIENT_EMAIL dans server/.env pour utiliser cette fonctionnalité.'
            });
        } else {
            res.status(500).json({ error: 'Erreur lors de l\'import de la vidéo', details: error.message });
        }
    }
});

/**
 * GET /admin/audit/logs
 * Récupère les logs d'audit
 */
router.get('/audit/logs', async (req, res) => {
    try {
        const db = getDb();
        const { limit = 50, action } = req.query;
        
        let query = db.collection('admin_audit_logs')
            .orderBy('timestamp', 'desc')
            .limit(parseInt(limit));

        if (action) {
            query = query.where('action', '==', action);
        }

        const snapshot = await query.get();
        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
        }));

        res.json({ logs, count: logs.length });
    } catch (error) {
        console.error('Error in GET /admin/audit/logs:', error);
        if (error.message && error.message.includes('Firebase Admin not initialized')) {
            res.status(500).json({ 
                error: 'Firebase Admin non initialisé',
                details: 'Veuillez configurer FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, et FIREBASE_CLIENT_EMAIL dans server/.env pour utiliser cette fonctionnalité.'
            });
        } else {
            res.status(500).json({ error: 'Erreur lors de la récupération des logs', details: error.message });
        }
    }
});

export default router;

