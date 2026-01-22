import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { logAdminAction } from '../middleware/auth.js';

const router = express.Router();

// Configuration multer pour l'upload de fichiers
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024 * 1024 // 5GB max
    }
});

const VIMEO_API_BASE = 'https://api.vimeo.com';
const VIMEO_CLIENT_ID = process.env.VIMEO_CLIENT_ID;
const VIMEO_CLIENT_SECRET = process.env.VIMEO_CLIENT_SECRET;
const VIMEO_ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN;

/**
 * GET /admin/vimeo/folders
 * Liste les dossiers Vimeo
 */
router.get('/vimeo/folders', async (req, res) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📁 DÉBUT: Récupération des dossiers Vimeo');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        console.log('🔍 Étape 1: Vérification du token Vimeo...');
        if (!VIMEO_ACCESS_TOKEN || VIMEO_ACCESS_TOKEN.trim() === '') {
            console.error('❌ Token Vimeo non configuré ou vide');
            console.error('   - VIMEO_ACCESS_TOKEN:', VIMEO_ACCESS_TOKEN ? 'défini mais vide' : 'undefined');
            return res.status(500).json({ 
                error: 'Vimeo Access Token non configuré',
                details: 'Veuillez configurer VIMEO_ACCESS_TOKEN dans server/.env. Vous pouvez obtenir un token depuis https://developer.vimeo.com/apps'
            });
        }
        console.log('✅ Token Vimeo présent:', VIMEO_ACCESS_TOKEN.substring(0, 15) + '...');

        console.log('🔍 Étape 2: Préparation de la requête HTTP...');
        const requestUrl = `${VIMEO_API_BASE}/me/projects`;
        const requestParams = {
            per_page: 100,
            fields: 'uri,name,created_time,modified_time'
        };
        console.log('   - URL:', requestUrl);
        console.log('   - Paramètres:', JSON.stringify(requestParams, null, 2));
        console.log('   - Headers:', {
            'Authorization': `bearer ${VIMEO_ACCESS_TOKEN.substring(0, 15)}...`,
            'Content-Type': 'application/json'
        });

        console.log('🔍 Étape 3: Envoi de la requête à l\'API Vimeo...');
        const startTime = Date.now();
        const response = await axios.get(requestUrl, {
            headers: {
                'Authorization': `bearer ${VIMEO_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            params: requestParams
        });
        const requestDuration = Date.now() - startTime;
        
        console.log('✅ Réponse reçue de l\'API Vimeo');
        console.log('   - Status HTTP:', response.status);
        console.log('   - Durée de la requête:', requestDuration + 'ms');
        console.log('   - Structure de la réponse:', {
            hasData: !!response.data.data,
            dataLength: response.data.data?.length || 0,
            total: response.data.total || 0,
            hasPaging: !!response.data.paging
        });

        console.log('🔍 Étape 4: Vérification de la structure de la réponse...');
        if (!response.data.data || !Array.isArray(response.data.data)) {
            console.error('❌ Structure de réponse inattendue!');
            console.error('   - response.data:', JSON.stringify(response.data, null, 2).substring(0, 500));
            return res.status(500).json({ 
                error: 'Structure de réponse Vimeo inattendue',
                details: 'La réponse de l\'API Vimeo n\'a pas la structure attendue. Vérifiez les logs du serveur.'
            });
        }
        console.log('✅ Structure de réponse valide');
        console.log('   - Nombre de dossiers dans la réponse:', response.data.data.length);

        console.log('🔍 Étape 5: Transformation des données dossiers...');
        const folders = response.data.data.map((project, index) => {
            console.log(`   - Dossier ${index + 1}/${response.data.data.length}:`, {
                uri: project.uri || 'N/A',
                name: project.name || 'Sans nom',
                hasCreatedTime: !!project.created_time,
                hasModifiedTime: !!project.modified_time
            });
            
            if (!project.uri) {
                console.warn(`     ⚠ Dossier sans URI:`, project);
            }
            
            return {
                id: project.uri ? project.uri.split('/').pop() : null,
                uri: project.uri || '',
                name: project.name || 'Sans nom',
                created_time: project.created_time || '',
                modified_time: project.modified_time || ''
            };
        });

        console.log(`✅ Transformation terminée: ${folders.length} dossiers mappés`);

        console.log('🔍 Étape 6: Enregistrement de l\'action admin...');
        try {
            await logAdminAction('list_vimeo_folders', { count: folders.length }, req.user.uid, req.user.email);
            console.log('✅ Action admin enregistrée');
        } catch (logError) {
            console.warn('⚠ Erreur lors de l\'enregistrement (non-bloquant):', logError.message);
        }

        console.log('🔍 Étape 7: Construction de la réponse finale...');
        console.log('   - Nombre de dossiers à retourner:', folders.length);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ SUCCÈS: Réponse envoyée au client');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        res.json({ folders, count: folders.length });
    } catch (error) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('❌ ERREUR: Récupération des dossiers Vimeo échouée');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('   - Message d\'erreur:', error.message);
        console.error('   - Status HTTP:', error.response?.status || 'N/A');
        console.error('   - Status Text:', error.response?.statusText || 'N/A');
        console.error('   - Données d\'erreur:', error.response?.data ? JSON.stringify(error.response.data, null, 2).substring(0, 500) : 'N/A');
        console.error('   - Code d\'erreur:', error.code || 'N/A');
        console.error('   - Stack trace:', error.stack?.substring(0, 300) || 'N/A');
        
        if (error.response?.status === 401) {
            return res.status(500).json({ 
                error: 'Token Vimeo invalide ou expiré',
                details: 'Le VIMEO_ACCESS_TOKEN configuré n\'est pas valide. Veuillez générer un nouveau token depuis https://developer.vimeo.com/apps'
            });
        }
        
        if (error.response?.status === 403) {
            return res.status(500).json({ 
                error: 'Accès refusé par Vimeo',
                details: 'Le token Vimeo n\'a pas les permissions nécessaires pour accéder aux projets.'
            });
        }

        res.status(500).json({ 
            error: 'Erreur lors de la récupération des dossiers Vimeo',
            details: error.response?.data?.error || error.response?.data?.message || error.message
        });
    }
});

/**
 * GET /admin/vimeo/videos
 * Liste les vidéos Vimeo (optionnellement filtrées par folder)
 */
router.get('/vimeo/videos', async (req, res) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📹 DÉBUT: Récupération des vidéos Vimeo');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        console.log('🔍 Étape 1: Vérification du token Vimeo...');
        if (!VIMEO_ACCESS_TOKEN || VIMEO_ACCESS_TOKEN.trim() === '') {
            console.error('❌ Token Vimeo non configuré ou vide');
            return res.status(500).json({ 
                error: 'Vimeo Access Token non configuré',
                details: 'Veuillez configurer VIMEO_ACCESS_TOKEN dans server/.env'
            });
        }
        console.log('✅ Token Vimeo présent:', VIMEO_ACCESS_TOKEN.substring(0, 15) + '...');

        console.log('🔍 Étape 2: Récupération des paramètres de requête...');
        const { folderId, per_page = 25, page = 1 } = req.query;
        console.log('   - folderId:', folderId || 'aucun (toutes les vidéos)');
        console.log('   - per_page:', per_page);
        console.log('   - page:', page);
        
        console.log('🔍 Étape 3: Construction de l\'URL de l\'API Vimeo...');
        let url = `${VIMEO_API_BASE}/me/videos`;
        if (folderId) {
            url = `${VIMEO_API_BASE}/me/projects/${folderId}/videos`;
            console.log('   - URL avec dossier:', url);
        } else {
            console.log('   - URL sans dossier (toutes les vidéos):', url);
        }

        console.log('🔍 Étape 4: Préparation de la requête HTTP...');
        const requestParams = {
            per_page: parseInt(per_page),
            page: parseInt(page),
            fields: 'uri,name,description,duration,created_time,modified_time,pictures,privacy,embed,link'
        };
        console.log('   - Paramètres de requête:', JSON.stringify(requestParams, null, 2));
        console.log('   - Headers:', {
            'Authorization': `bearer ${VIMEO_ACCESS_TOKEN.substring(0, 15)}...`,
            'Content-Type': 'application/json'
        });

        console.log('🔍 Étape 5: Envoi de la requête à l\'API Vimeo...');
        const startTime = Date.now();
        const response = await axios.get(url, {
            headers: {
                'Authorization': `bearer ${VIMEO_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            params: requestParams
        });
        const requestDuration = Date.now() - startTime;
        
        console.log('✅ Réponse reçue de l\'API Vimeo');
        console.log('   - Status HTTP:', response.status);
        console.log('   - Durée de la requête:', requestDuration + 'ms');
        console.log('   - Structure de la réponse:', {
            hasData: !!response.data.data,
            dataLength: response.data.data?.length || 0,
            total: response.data.total || 0,
            hasPaging: !!response.data.paging,
            pagingNext: response.data.paging?.next || 'aucun',
            pagingPrev: response.data.paging?.previous || 'aucun'
        });

        console.log('🔍 Étape 6: Vérification de la structure de la réponse...');
        if (!response.data.data || !Array.isArray(response.data.data)) {
            console.error('❌ Structure de réponse inattendue!');
            console.error('   - response.data:', JSON.stringify(response.data, null, 2).substring(0, 500));
            return res.status(500).json({ 
                error: 'Structure de réponse Vimeo inattendue',
                details: 'La réponse de l\'API Vimeo pour les vidéos n\'a pas la structure attendue. Vérifiez les logs du serveur.'
            });
        }
        console.log('✅ Structure de réponse valide');
        console.log('   - Nombre de vidéos dans la réponse:', response.data.data.length);

        console.log('🔍 Étape 7: Transformation des données vidéo...');
        const videos = response.data.data.map((video, index) => {
            console.log(`   - Vidéo ${index + 1}/${response.data.data.length}:`, {
                uri: video.uri || 'N/A',
                name: video.name || 'Sans nom',
                hasPictures: !!video.pictures,
                hasEmbed: !!video.embed
            });
            // Extraire l'embed URL depuis embed.html si disponible
            let embedUrl = '';
            if (video.embed?.html) {
                const embedMatch = video.embed.html.match(/src="([^"]+)"/);
                embedUrl = embedMatch ? embedMatch[1] : '';
                if (embedUrl) {
                    console.log(`     ✓ Embed URL extraite: ${embedUrl.substring(0, 50)}...`);
                } else {
                    console.log(`     ⚠ Embed HTML présent mais URL non extraite`);
                }
            } else {
                console.log(`     ⚠ Pas d'embed HTML disponible`);
            }

            // Récupérer la meilleure image disponible
            let thumbnail = '';
            if (video.pictures?.sizes && Array.isArray(video.pictures.sizes)) {
                // Prendre la plus grande image disponible
                const sortedSizes = video.pictures.sizes.sort((a, b) => (b.width || 0) - (a.width || 0));
                thumbnail = sortedSizes[0]?.link || '';
                if (thumbnail) {
                    console.log(`     ✓ Thumbnail trouvée (${sortedSizes[0].width}x${sortedSizes[0].height}): ${thumbnail.substring(0, 50)}...`);
                } else {
                    console.log(`     ⚠ Pictures disponibles mais pas de lien`);
                }
            } else {
                console.log(`     ⚠ Pas de pictures disponibles`);
            }

            return {
                id: video.uri ? video.uri.split('/').pop() : null,
                uri: video.uri || '',
                name: video.name || 'Sans nom',
                description: video.description || '',
                duration: video.duration || 0,
                thumbnail: thumbnail,
                link: video.link || '',
                embedUrl: embedUrl,
                privacy: video.privacy?.view || 'unknown',
                created_time: video.created_time || '',
                modified_time: video.modified_time || ''
            };
        });

        console.log(`✅ Transformation terminée: ${videos.length} vidéos mappées`);
        console.log('   - Résumé des vidéos:', {
            avecEmbedUrl: videos.filter(v => v.embedUrl).length,
            avecThumbnail: videos.filter(v => v.thumbnail).length,
            avecLink: videos.filter(v => v.link).length
        });

        console.log('🔍 Étape 8: Enregistrement de l\'action admin...');
        try {
            await logAdminAction('list_vimeo_videos', { 
                count: videos.length, 
                folderId: folderId || null 
            }, req.user.uid, req.user.email);
            console.log('✅ Action admin enregistrée');
        } catch (logError) {
            console.warn('⚠ Erreur lors de l\'enregistrement (non-bloquant):', logError.message);
        }

        console.log('🔍 Étape 9: Construction de la réponse finale...');
        // Construire la réponse de pagination
        const pagination = {
            page: parseInt(page),
            per_page: parseInt(per_page),
            total: response.data.total || videos.length,
            has_more: !!response.data.paging?.next
        };

        console.log('   - Pagination:', JSON.stringify(pagination, null, 2));
        console.log('   - Nombre de vidéos à retourner:', videos.length);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ SUCCÈS: Réponse envoyée au client');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        res.json({
            videos,
            count: videos.length,
            pagination: pagination
        });
    } catch (error) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('❌ ERREUR: Récupération des vidéos Vimeo échouée');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('   - Message d\'erreur:', error.message);
        console.error('   - Status HTTP:', error.response?.status || 'N/A');
        console.error('   - Status Text:', error.response?.statusText || 'N/A');
        console.error('   - Données d\'erreur:', error.response?.data ? JSON.stringify(error.response.data, null, 2).substring(0, 500) : 'N/A');
        console.error('   - Stack trace:', error.stack?.substring(0, 300) || 'N/A');
        
        if (error.response?.status === 401) {
            return res.status(500).json({ 
                error: 'Token Vimeo invalide ou expiré',
                details: 'Le VIMEO_ACCESS_TOKEN configuré n\'est pas valide. Veuillez générer un nouveau token depuis https://developer.vimeo.com/apps'
            });
        }
        
        if (error.response?.status === 403) {
            return res.status(500).json({ 
                error: 'Accès refusé par Vimeo',
                details: 'Le token Vimeo n\'a pas les permissions nécessaires pour accéder aux vidéos.'
            });
        }

        res.status(500).json({ 
            error: 'Erreur lors de la récupération des vidéos Vimeo',
            details: error.response?.data?.error || error.response?.data?.message || error.message
        });
    }
});

/**
 * POST /admin/vimeo/upload
 * Upload une vidéo vers Vimeo
 */
router.post('/vimeo/upload', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier vidéo fourni' });
        }

        const { title, description, folderId, privacy = 'unlisted' } = req.body;

        // Étape 1: Créer la vidéo sur Vimeo (Tus upload)
        const createVideoResponse = await axios.post(
            `${VIMEO_API_BASE}/me/videos`,
            {
                upload: {
                    approach: 'tus',
                    size: req.file.size
                },
                name: title || req.file.originalname,
                description: description || '',
                privacy: {
                    view: privacy // 'anybody', 'nobody', 'password', 'disable', 'unlisted'
                }
            },
            {
                headers: {
                    'Authorization': `bearer ${VIMEO_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const uploadLink = createVideoResponse.data.upload.upload_link;
        const videoUri = createVideoResponse.data.uri;
        const videoId = videoUri.split('/').pop();

        // Étape 2: Upload du fichier via Tus
        // L'upload Tus nécessite plusieurs requêtes PATCH avec offset
        // Pour simplifier, on fait un upload direct avec POST
        const fileStream = fs.createReadStream(req.file.path);
        const fileSize = req.file.size;
        
        // Upload direct via POST (approche simplifiée)
        // Note: Pour les gros fichiers, utiliser un client Tus complet
        try {
            // Lire le fichier en buffer
            const fileBuffer = fs.readFileSync(req.file.path);
            
            // Upload via PATCH Tus
            let offset = 0;
            const chunkSize = 5 * 1024 * 1024; // 5MB chunks
            
            while (offset < fileSize) {
                const chunk = fileBuffer.slice(offset, Math.min(offset + chunkSize, fileSize));
                
                await axios.patch(uploadLink, chunk, {
                    headers: {
                        'Tus-Resumable': '1.0.0',
                        'Upload-Offset': offset.toString(),
                        'Content-Type': 'application/offset+octet-stream',
                        'Content-Length': chunk.length.toString()
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                });
                
                offset += chunk.length;
                
                // Log progress
                const progress = Math.round((offset / fileSize) * 100);
                console.log(`Upload progress: ${progress}%`);
            }
        } catch (uploadError) {
            console.error('Tus upload error:', uploadError.response?.data || uploadError.message);
            // Si l'upload échoue, on retourne quand même les infos de la vidéo créée
            // L'utilisateur pourra uploader manuellement via l'interface Vimeo
            console.warn('Upload failed, but video created on Vimeo. User can upload manually.');
        }

        // Nettoyer le fichier temporaire
        fs.unlinkSync(req.file.path);

        // Attendre un peu pour que Vimeo traite la vidéo
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Récupérer les infos de la vidéo uploadée
        const videoInfoResponse = await axios.get(
            `${VIMEO_API_BASE}${videoUri}`,
            {
                headers: {
                    'Authorization': `bearer ${VIMEO_ACCESS_TOKEN}`
                },
                params: {
                    fields: 'uri,name,description,duration,created_time,pictures,privacy,embed,link'
                }
            }
        );

        const videoData = videoInfoResponse.data;

        // Si un dossier est spécifié, ajouter la vidéo au dossier
        if (folderId) {
            try {
                await axios.put(
                    `${VIMEO_API_BASE}/me/projects/${folderId}/videos/${videoId}`,
                    {},
                    {
                        headers: {
                            'Authorization': `bearer ${VIMEO_ACCESS_TOKEN}`
                        }
                    }
                );
            } catch (folderError) {
                console.warn('Error adding video to folder:', folderError.message);
            }
        }

        await logAdminAction('upload_vimeo_video', {
            vimeoId: videoId,
            title: videoData.name,
            folderId: folderId || null
        }, req.user.uid, req.user.email);

        res.json({
            success: true,
            vimeoId: videoId,
            vimeoUri: videoData.uri,
            link: videoData.link,
            embedUrl: videoData.embed?.html || '',
            duration: videoData.duration || 0,
            thumbnail: videoData.pictures?.sizes?.[videoData.pictures.sizes.length - 1]?.link || '',
            title: videoData.name,
            description: videoData.description || ''
        });
    } catch (error) {
        // Nettoyer le fichier en cas d'erreur
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        console.error('Error uploading to Vimeo:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Erreur lors de l\'upload vers Vimeo',
            details: error.response?.data || error.message
        });
    }
});

export default router;

