import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApiService } from '../lib/adminApiService';
import { adminAllowlistService } from '../lib/adminAllowlistService';
import { serieService, seasonSerieService, episodeSerieService, serieCategoryService, Serie, SeasonSerie, EpisodeSerie, SerieCategory } from '../lib/firestore';
import CategoriesTab from './CategoriesTab';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAppContext } from '../context/AppContext';
import { ArrowLeftIcon, SearchIcon, ChevronRightIcon, ChevronDownIcon } from '../components/icons';

type Tab = 'app-videos' | 'vimeo' | 'upload' | 'categories';

const AdminBackupVideosScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user, userProfile } = useAppContext();
    const [activeTab, setActiveTab] = useState<Tab>('app-videos');
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    // Vérifier l'autorisation au chargement
    useEffect(() => {
        const checkAuthorization = async () => {
            if (!user) {
                setIsAuthorized(false);
                setLoading(false);
                toast.error('Vous devez être connecté pour accéder à cette page.');
                return;
            }

            if (!user.email) {
                setIsAuthorized(false);
                setLoading(false);
                toast.error('Email non trouvé. Veuillez vous reconnecter.');
                return;
            }

            try {
                // Vérifier d'abord côté Firestore
                const isAllowed = await adminAllowlistService.isEmailAllowed(user.email);
                if (!isAllowed) {
                    setIsAuthorized(false);
                    setLoading(false);
                    toast.error('Accès refusé. Votre email n\'est pas dans la liste des administrateurs autorisés.');
                    return;
                }

                // Vérifier côté API (mais ne pas bloquer si le backend n'est pas disponible)
                try {
                    await adminApiService.checkAdmin();
                    setIsAuthorized(true);
                } catch (apiError: any) {
                    // Si le backend n'est pas disponible, on autorise quand même l'accès
                    // car la vérification Firestore a réussi
                    if (apiError.message.includes('backend n\'est pas accessible') || 
                        apiError.message.includes('se connecter au serveur') ||
                        apiError.message.includes('Unexpected token')) {
                        console.warn('Backend non disponible, mais autorisation Firestore OK. Accès autorisé.');
                        setIsAuthorized(true);
                        toast.warn('⚠️ Le serveur backend n\'est pas démarré. Démarrez-le avec: cd server && npm run dev', {
                            autoClose: 10000
                        });
                    } else {
                        // Autre erreur (403, etc.)
                        throw apiError;
                    }
                }
            } catch (error: any) {
                console.error('Error checking authorization:', error);
                setIsAuthorized(false);
                if (error.message.includes('403') || error.message.includes('refusé')) {
                    toast.error('Accès refusé. Vous n\'êtes pas autorisé à accéder à cette page.');
                } else {
                    toast.error('Erreur lors de la vérification des permissions.');
                }
            } finally {
                setLoading(false);
            }
        };

        checkAuthorization();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FBF9F3] dark:bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[#FBF9F3] dark:bg-black flex items-center justify-center">
                <div className="text-center px-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Accès refusé</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Vous n'êtes pas autorisé à accéder à cette page.
                    </p>
                    <button
                        onClick={() => navigate('/profile')}
                        className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                        Retour au profil
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FBF9F3] dark:bg-black">
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-4 px-4 py-4">
                    <button
                        onClick={() => navigate('/profile')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeftIcon className="w-6 h-6 text-gray-900 dark:text-white" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Admin - Gestion des vidéos
                    </h1>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-800">
                    <button
                        onClick={() => setActiveTab('app-videos')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'app-videos'
                                ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        Vidéos App
                    </button>
                    <button
                        onClick={() => setActiveTab('vimeo')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'vimeo'
                                ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        Vimeo
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'upload'
                                ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        Upload Vimeo
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'categories'
                                ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        Catégories
                    </button>
                </div>
            </div>

            <div className="px-4 md:px-6 lg:px-8 py-6">
                {activeTab === 'app-videos' && <AppVideosTab />}
                {activeTab === 'vimeo' && <VimeoTab />}
                {activeTab === 'upload' && <UploadTab />}
                {activeTab === 'categories' && <CategoriesTab />}
            </div>
        </div>
    );
};

// Onglet 1: Vidéos App - Arborescence Séries → Saisons → Épisodes
const AppVideosTab: React.FC = () => {
    const [series, setSeries] = useState<any[]>([]);
    const [seriesData, setSeriesData] = useState<Record<string, { seasons: any[]; episodes: Record<string, any[]> }>>({});
    const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
    const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingVideo, setEditingVideo] = useState<any | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [editingSeason, setEditingSeason] = useState<any | null>(null);
    const [editSeasonForm, setEditSeasonForm] = useState<any>({});
    const [editingSerie, setEditingSerie] = useState<any | null>(null);
    const [editSerieForm, setEditSerieForm] = useState<any>({});
    const [categories, setCategories] = useState<SerieCategory[]>([]);

    useEffect(() => {
        loadData();
        loadCategories();
    }, []);
    
    // S'assurer que les épisodes sont chargés quand on édite un épisode
    useEffect(() => {
        if (editingVideo && editingVideo.uid_season && editingVideo.uid_serie) {
            const episodes = seriesData[editingVideo.uid_serie]?.episodes[editingVideo.uid_season];
            if (!episodes || episodes.length === 0) {
                console.log('Loading episodes for editing video...', editingVideo.uid_serie, editingVideo.uid_season);
                loadSeasonEpisodes(editingVideo.uid_serie, editingVideo.uid_season);
            }
        }
    }, [editingVideo, seriesData]);

    const loadCategories = async () => {
        try {
            const cats = await serieCategoryService.getAllCategories();
            setCategories(cats);
        } catch (error) {
            console.error('Erreur lors du chargement des catégories:', error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            // Charger toutes les séries directement depuis Firestore avec leurs IDs Firestore
            const seriesSnapshot = await getDocs(collection(db, 'series'));
            const allSeries = seriesSnapshot.docs.map(doc => ({
                id: doc.id, // ID Firestore
                ...doc.data()
            }));
            setSeries(allSeries);

            // Charger seulement les séries et saisons, pas les épisodes (chargement lazy)
            const data: Record<string, { seasons: any[]; episodes: Record<string, any[]> }> = {};
            
            for (const serie of allSeries) {
                try {
                    // Charger les saisons de cette série directement depuis Firestore
                    // On doit récupérer les IDs Firestore pour pouvoir les mettre à jour
                    const seasonsQuery = query(
                        collection(db, 'seasonsSeries'),
                        where('uid_serie', '==', serie.uid_serie)
                    );
                    const seasonsSnapshot = await getDocs(seasonsQuery);
                    const seasons = seasonsSnapshot.docs.map(doc => ({
                        id: doc.id, // ID Firestore
                        ...doc.data()
                    }));
                    
                    data[serie.uid_serie] = { 
                        seasons, 
                        episodes: {} 
                    };
                    // Les épisodes seront chargés quand l'utilisateur expand la saison
                } catch (seasonError) {
                    console.error(`Erreur lors du chargement des saisons pour la série ${serie.uid_serie}:`, seasonError);
                    data[serie.uid_serie] = { seasons: [], episodes: {} };
                }
            }

            setSeriesData(data);
        } catch (error: any) {
            console.error('Erreur générale lors du chargement:', error);
            if (error.message.includes('quota-exceeded')) {
                toast.error('Quota Firebase dépassé. Veuillez attendre quelques minutes avant de réessayer.');
            } else {
                toast.error(error.message || 'Erreur lors du chargement des données');
            }
        } finally {
            setLoading(false);
        }
    };

    // Charger les épisodes d'une saison de manière lazy
    const loadSeasonEpisodes = async (serieUid: string, seasonUid: string) => {
        // Vérifier si les épisodes sont déjà chargés
        const currentEpisodes = seriesData[serieUid]?.episodes[seasonUid];
        if (currentEpisodes && currentEpisodes.length > 0) {
            console.log(`Episodes already loaded for season ${seasonUid}:`, currentEpisodes.length);
            return; // Déjà chargés
        }

        try {
            console.log(`Loading episodes for season ${seasonUid} in series ${serieUid}...`);
            // Charger les épisodes directement depuis Firestore
            // On doit récupérer les IDs Firestore pour pouvoir les mettre à jour
            const q = query(
                collection(db, 'episodesSeries'),
                where('uid_season', '==', seasonUid),
                where('hidden', '==', false),
                orderBy('episode_numero', 'asc')
            );
            const snapshot = await getDocs(q);
            const episodes = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id, // ID Firestore
                    ...data,
                    uid_serie: serieUid // Ajouter uid_serie pour la navigation uniquement (pas dans Firestore)
                };
            });
            
            console.log(`Loaded ${episodes.length} episodes for season ${seasonUid} in series ${serieUid}`);
            
            // Mettre à jour les données
            setSeriesData(prev => ({
                ...prev,
                [serieUid]: {
                    ...prev[serieUid],
                    episodes: {
                        ...prev[serieUid]?.episodes,
                        [seasonUid]: episodes
                    }
                }
            }));
        } catch (error: any) {
            console.error(`Erreur lors du chargement des épisodes pour la saison ${seasonUid}:`, error);
            if (error.message.includes('quota-exceeded')) {
                toast.error('Quota Firebase dépassé. Veuillez attendre quelques minutes avant de réessayer.');
            }
            // Mettre un tableau vide pour éviter de recharger indéfiniment
            setSeriesData(prev => ({
                ...prev,
                [serieUid]: {
                    ...prev[serieUid],
                    episodes: {
                        ...prev[serieUid]?.episodes,
                        [seasonUid]: []
                    }
                }
            }));
        }
    };

    const toggleSeries = (serieUid: string) => {
        const newExpanded = new Set(expandedSeries);
        if (newExpanded.has(serieUid)) {
            newExpanded.delete(serieUid);
        } else {
            newExpanded.add(serieUid);
        }
        setExpandedSeries(newExpanded);
    };

    const toggleSeason = async (serieUid: string, seasonUid: string) => {
        // Toujours garder la saison ouverte si on est en train d'éditer un épisode de cette saison
        if (editingVideo && editingVideo.uid_season === seasonUid) {
            return; // Ne pas permettre de fermer la saison si on édite un épisode
        }
        
        const newExpanded = new Set(expandedSeasons);
        const isExpanding = !newExpanded.has(seasonUid);
        
        if (isExpanding) {
            newExpanded.add(seasonUid);
            // Charger les épisodes quand on expand la saison
            await loadSeasonEpisodes(serieUid, seasonUid);
        } else {
            newExpanded.delete(seasonUid);
        }
        
        setExpandedSeasons(newExpanded);
    };

    const handleEdit = async (video: any) => {
        // Trouver le uid_serie depuis les séries chargées pour la navigation
        const serie = series.find(s => s.title_serie === video.title_serie || s.uid_serie === video.uid_serie);
        const serieUid = serie?.uid_serie;
        
        if (!serieUid) {
            console.error('Could not find serie for video:', video);
            toast.error('Impossible de trouver la série associée');
            return;
        }
        
        // Charger les épisodes immédiatement si pas déjà chargés
        const episodes = seriesData[serieUid]?.episodes[video.uid_season];
        if (!episodes || episodes.length === 0) {
            console.log('Loading episodes immediately for editing...', serieUid, video.uid_season);
            await loadSeasonEpisodes(serieUid, video.uid_season);
        }
        
        // Stocker uid_serie dans editingVideo pour la navigation, mais ne pas l'inclure dans editForm
        setEditingVideo({
            ...video,
            uid_serie: serieUid // Pour la navigation uniquement
        });
        setEditForm({
            title: video.title || '',
            original_title: video.original_title || '',
            overview: video.overview || '',
            overviewFr: video.overviewFr || '',
            TranscriptText: video.TranscriptText || '',
            backdrop_path: video.backdrop_path || '',
            embedUrl: video.embedUrl || '',
            episode_number: video.episode_number || 0,
            episode_numero: video.episode_numero || 0,
            picture_path: video.picture_path || '',
            runtime: video.runtime || 0,
            runtime_h_m: video.runtime_h_m || '',
            video_path_hd: video.video_path_hd || '',
            video_path_sd: video.video_path_sd || '',
            title_serie: video.title_serie || '',
            hidden: video.hidden || false,
            uid_season: video.uid_season || ''
            // Ne pas inclure uid_serie dans editForm car ce n'est pas un champ de l'épisode
        });
        
        // S'assurer que la série et la saison sont ouvertes
        if (serieUid) {
            setExpandedSeries(prev => {
                const newSet = new Set(prev);
                newSet.add(serieUid);
                return newSet;
            });
        }
        if (video.uid_season) {
            setExpandedSeasons(prev => {
                const newSet = new Set(prev);
                newSet.add(video.uid_season);
                return newSet;
            });
        }
    };

    const handleSave = async () => {
        if (!editingVideo) return;

        try {
            // Mettre à jour directement dans Firestore
            // editingVideo.id est l'ID Firestore
            await episodeSerieService.updateEpisodeById(editingVideo.id, editForm);
            toast.success('Vidéo mise à jour avec succès');
            
            // Mettre à jour l'état local au lieu de recharger toutes les données
            const seasonUid = editingVideo.uid_season;
            const serieUid = editingVideo.uid_serie;
            if (seasonUid && serieUid && seriesData[serieUid]?.episodes[seasonUid]) {
                const updatedEpisodes = seriesData[serieUid].episodes[seasonUid].map((ep: any) => 
                    ep.id === editingVideo.id ? { ...ep, ...editForm } : ep
                );
                setSeriesData(prev => ({
                    ...prev,
                    [serieUid]: {
                        ...prev[serieUid],
                        episodes: {
                            ...prev[serieUid].episodes,
                            [seasonUid]: updatedEpisodes
                        }
                    }
                }));
            }
            
            // Ne pas fermer le modal - l'utilisateur peut continuer à modifier
            // Le modal restera ouvert pour permettre la navigation entre épisodes
        } catch (error: any) {
            console.error('Erreur lors de la mise à jour de l\'épisode:', error);
            toast.error(error.message || 'Erreur lors de la mise à jour');
        }
    };

    // Navigation entre épisodes
    const getCurrentEpisodeIndex = (): number => {
        if (!editingVideo) return -1;
        const seasonUid = editingVideo.uid_season;
        const serieUid = editingVideo.uid_serie;
        if (!serieUid || !seasonUid) {
            console.warn('Missing serieUid or seasonUid:', { serieUid, seasonUid, editingVideo });
            return -1;
        }
        const episodes = seriesData[serieUid]?.episodes[seasonUid] || [];
        const index = episodes.findIndex((ep: any) => ep.id === editingVideo.id);
        console.log('Current episode index:', index, 'out of', episodes.length, 'episodes');
        return index;
    };

    const getCurrentSeasonEpisodes = (): any[] => {
        if (!editingVideo) return [];
        const seasonUid = editingVideo.uid_season;
        const serieUid = editingVideo.uid_serie;
        if (!serieUid || !seasonUid) {
            console.warn('Missing serieUid or seasonUid:', { serieUid, seasonUid, editingVideo });
            return [];
        }
        const episodes = seriesData[serieUid]?.episodes[seasonUid] || [];
        console.log('Current season episodes:', episodes.length, 'episodes');
        return episodes;
    };

    const handlePreviousEpisode = async () => {
        const episodes = getCurrentSeasonEpisodes();
        const currentIndex = getCurrentEpisodeIndex();
        console.log('handlePreviousEpisode:', { currentIndex, episodesCount: episodes.length });
        if (currentIndex > 0 && episodes.length > 0) {
            const prevEpisode = episodes[currentIndex - 1];
            console.log('Loading previous episode:', prevEpisode);
            await handleEdit(prevEpisode);
        } else {
            console.warn('Cannot go to previous episode:', { currentIndex, episodesCount: episodes.length });
            toast.warn('Impossible d\'aller à l\'épisode précédent');
        }
    };

    const handleNextEpisode = async () => {
        const episodes = getCurrentSeasonEpisodes();
        const currentIndex = getCurrentEpisodeIndex();
        console.log('handleNextEpisode:', { currentIndex, episodesCount: episodes.length });
        if (currentIndex >= 0 && currentIndex < episodes.length - 1 && episodes.length > 0) {
            const nextEpisode = episodes[currentIndex + 1];
            console.log('Loading next episode:', nextEpisode);
            await handleEdit(nextEpisode);
        } else {
            console.warn('Cannot go to next episode:', { currentIndex, episodesCount: episodes.length });
            toast.warn('Impossible d\'aller à l\'épisode suivant');
        }
    };

    const handleEditSerie = (serie: any) => {
        setEditingSerie(serie);
        setEditSerieForm({
            title_serie: serie.title_serie || '',
            overview_serie: serie.overview_serie || '',
            categoryId: serie.categoryId || ''
        });
    };

    const handleSaveSerie = async () => {
        if (!editingSerie) return;

        try {
            await serieService.updateSerieById(editingSerie.id, editSerieForm);
            toast.success('Série mise à jour avec succès');
            setEditingSerie(null);
            loadData();
        } catch (error: any) {
            console.error('Erreur lors de la mise à jour de la série:', error);
            toast.error(error.message || 'Erreur lors de la mise à jour');
        }
    };

    const handleEditSeason = (season: any) => {
        setEditingSeason(season);
        setEditSeasonForm({
            title_season: season.title_season || '',
            title_serie: season.title_serie || '',
            overview: season.overview || '',
            poster_path: season.poster_path || '',
            backdrop_path: season.backdrop_path || '',
            season_number: season.season_number || 1,
            year_season: season.year_season || new Date().getFullYear(),
            premium_text: season.premium_text || '',
            nb_episodes: season.nb_episodes || 0
        });
    };

    const handleSaveSeason = async () => {
        if (!editingSeason) return;

        try {
            // Mettre à jour directement dans Firestore
            // editingSeason.id est l'ID Firestore
            await seasonSerieService.updateSeasonById(editingSeason.id, editSeasonForm);
            toast.success('Saison mise à jour avec succès');
            setEditingSeason(null);
            loadData();
        } catch (error: any) {
            console.error('Erreur lors de la mise à jour de la saison:', error);
            toast.error(error.message || 'Erreur lors de la mise à jour');
        }
    };

    // Filtrer les séries selon la recherche
    const filteredSeries = series.filter(serie => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return serie.title_serie?.toLowerCase().includes(query);
    });

    // Filtrer les épisodes selon la recherche
    const filterEpisodes = (episodes: any[]) => {
        if (!searchQuery) return episodes;
        const query = searchQuery.toLowerCase();
        return episodes.filter(ep => 
            ep.title?.toLowerCase().includes(query) ||
            ep.original_title?.toLowerCase().includes(query) ||
            ep.overview?.toLowerCase().includes(query)
        );
    };

    return (
        <div>
            <div className="mb-6">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher une série, saison ou épisode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
                </div>
            ) : filteredSeries.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    Aucune série trouvée
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredSeries.map(serie => {
                        const serieData = seriesData[serie.uid_serie];
                        const isSerieExpanded = expandedSeries.has(serie.uid_serie);
                        const seasons = serieData?.seasons || [];

                        return (
                            <div
                                key={serie.uid_serie}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                            >
                                {/* En-tête Série */}
                                <div className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <button
                                        onClick={() => toggleSeries(serie.uid_serie)}
                                        className="flex-1 flex items-center gap-3"
                                    >
                                        {isSerieExpanded ? (
                                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                                        )}
                                        <div className="text-left">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {serie.title_serie || 'Série sans titre'}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {seasons.length} saison{seasons.length > 1 ? 's' : ''}
                                                </p>
                                                {serie.categoryId && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">
                                                        {categories.find(c => c.id === serie.categoryId)?.name || 'Catégorie'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditSerie(serie);
                                        }}
                                        className="ml-4 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
                                    >
                                        Modifier
                                    </button>
                                </div>

                                {/* Saisons (si la série est expandée) */}
                                {isSerieExpanded && seasons.length > 0 && (
                                    <div className="border-t border-gray-200 dark:border-gray-700">
                                        {seasons.map(season => {
                                            const isSeasonExpanded = expandedSeasons.has(season.uid_season);
                                            const episodes = filterEpisodes(serieData?.episodes[season.uid_season] || []);

                                            return (
                                                <div key={season.uid_season} className="bg-gray-50 dark:bg-gray-900/50">
                                                    {/* En-tête Saison */}
                                                    <div className="flex items-center justify-between p-4 pl-12 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                        <button
                                                            onClick={() => toggleSeason(serie.uid_serie, season.uid_season)}
                                                            className="flex-1 flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {isSeasonExpanded ? (
                                                                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                                                                ) : (
                                                                    <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                                                                )}
                                                                <div className="text-left">
                                                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                                                        {season.title_season || 'Saison sans titre'}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                        {episodes.length} épisode{episodes.length > 1 ? 's' : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditSeason(season);
                                                            }}
                                                            className="ml-4 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
                                                        >
                                                            Modifier
                                                        </button>
                                                    </div>

                                                    {/* Épisodes (si la saison est expandée) */}
                                                    {isSeasonExpanded && episodes.length > 0 && (
                                                        <div className="border-t border-gray-200 dark:border-gray-700">
                                                            {episodes.map(episode => (
                                                                <div
                                                                    key={episode.id}
                                                                    className="p-4 pl-20 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                                >
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex-1">
                                                                            <h5 className="font-medium text-gray-900 dark:text-white">
                                                                                {episode.title || 'Épisode sans titre'}
                                                                            </h5>
                                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                                Épisode {episode.episode_numero} • {episode.runtime_h_m || 'Durée inconnue'}
                                                                            </p>
                                                                            {episode.embedUrl && (
                                                                                <a
                                                                                    href={episode.embedUrl}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-xs text-amber-600 dark:text-amber-400 mt-2 inline-block hover:underline"
                                                                                >
                                                                                    Voir sur Vimeo
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleEdit(episode)}
                                                                            className="ml-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
                                                                        >
                                                                            Modifier
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal d'édition vidéo */}
            {editingVideo && (() => {
                const episodes = getCurrentSeasonEpisodes();
                const currentIndex = getCurrentEpisodeIndex();
                const hasPrevious = currentIndex > 0;
                const hasNext = currentIndex >= 0 && currentIndex < episodes.length - 1;
                
                console.log('Modal state:', { 
                    episodesCount: episodes.length, 
                    currentIndex, 
                    hasPrevious, 
                    hasNext,
                    editingVideoId: editingVideo.id,
                    serieUid: editingVideo.uid_serie,
                    seasonUid: editingVideo.uid_season
                });
                
                return (
                <div 
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <div 
                        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        style={{
                            position: 'relative',
                            zIndex: 10000,
                            margin: 'auto'
                        }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Modifier l'épisode</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Épisode {currentIndex + 1} sur {episodes.length} • {editingVideo.title_serie}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePreviousEpisode}
                                    disabled={!hasPrevious}
                                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                    title="Épisode précédent"
                                >
                                    ← Précédent
                                </button>
                                <button
                                    onClick={handleNextEpisode}
                                    disabled={!hasNext}
                                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                    title="Épisode suivant"
                                >
                                    Suivant →
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Titre
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value, title_lowercase: e.target.value.toLowerCase() })}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Titre original
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.original_title}
                                        onChange={(e) => setEditForm({ ...editForm, original_title: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description (EN)
                                </label>
                                <textarea
                                    value={editForm.overview}
                                    onChange={(e) => setEditForm({ ...editForm, overview: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description (FR)
                                </label>
                                <textarea
                                    value={editForm.overviewFr}
                                    onChange={(e) => setEditForm({ ...editForm, overviewFr: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Transcript Text
                                </label>
                                <textarea
                                    value={editForm.TranscriptText}
                                    onChange={(e) => setEditForm({ ...editForm, TranscriptText: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Numéro épisode
                                    </label>
                                    <input
                                        type="number"
                                        value={editForm.episode_numero}
                                        onChange={(e) => setEditForm({ ...editForm, episode_numero: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Episode Number
                                    </label>
                                    <input
                                        type="number"
                                        value={editForm.episode_number}
                                        onChange={(e) => setEditForm({ ...editForm, episode_number: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Runtime (secondes)
                                    </label>
                                    <input
                                        type="number"
                                        value={editForm.runtime}
                                        onChange={(e) => setEditForm({ ...editForm, runtime: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Runtime (format affiché)
                                </label>
                                <input
                                    type="text"
                                    value={editForm.runtime_h_m}
                                    onChange={(e) => setEditForm({ ...editForm, runtime_h_m: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="🕒0h11min"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Titre série
                                </label>
                                <input
                                    type="text"
                                    value={editForm.title_serie}
                                    onChange={(e) => setEditForm({ ...editForm, title_serie: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    URL Embed Vimeo
                                </label>
                                <input
                                    type="text"
                                    value={editForm.embedUrl}
                                    onChange={(e) => setEditForm({ ...editForm, embedUrl: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="https://player.vimeo.com/video/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    URL Vidéo HD
                                </label>
                                <input
                                    type="text"
                                    value={editForm.video_path_hd}
                                    onChange={(e) => setEditForm({ ...editForm, video_path_hd: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    URL Vidéo SD
                                </label>
                                <input
                                    type="text"
                                    value={editForm.video_path_sd}
                                    onChange={(e) => setEditForm({ ...editForm, video_path_sd: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    URL Image (Picture Path)
                                </label>
                                <input
                                    type="text"
                                    value={editForm.picture_path}
                                    onChange={(e) => setEditForm({ ...editForm, picture_path: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    URL Backdrop
                                </label>
                                <input
                                    type="text"
                                    value={editForm.backdrop_path}
                                    onChange={(e) => setEditForm({ ...editForm, backdrop_path: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={editForm.hidden}
                                    onChange={(e) => setEditForm({ ...editForm, hidden: e.target.checked })}
                                    className="mr-2"
                                />
                                <label className="text-sm text-gray-700 dark:text-gray-300">Masquer l'épisode</label>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                                >
                                    Enregistrer
                                </button>
                                {hasNext && (
                                    <button
                                        onClick={async () => {
                                            await handleSave();
                                            // Attendre un peu pour que la sauvegarde soit terminée
                                            setTimeout(() => {
                                                handleNextEpisode();
                                            }, 100);
                                        }}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                    >
                                        Enregistrer et Suivant →
                                    </button>
                                )}
                                <button
                                    onClick={() => setEditingVideo(null)}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* Modal d'édition saison */}
            {editingSeason && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Modifier la saison</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Titre de la saison
                                </label>
                                <input
                                    type="text"
                                    value={editSeasonForm.title_season}
                                    onChange={(e) => setEditSeasonForm({ ...editSeasonForm, title_season: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Titre de la série
                                </label>
                                <input
                                    type="text"
                                    value={editSeasonForm.title_serie}
                                    onChange={(e) => setEditSeasonForm({ ...editSeasonForm, title_serie: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={editSeasonForm.overview}
                                    onChange={(e) => setEditSeasonForm({ ...editSeasonForm, overview: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Numéro de saison
                                    </label>
                                    <input
                                        type="number"
                                        value={editSeasonForm.season_number}
                                        onChange={(e) => setEditSeasonForm({ ...editSeasonForm, season_number: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Année
                                    </label>
                                    <input
                                        type="number"
                                        value={editSeasonForm.year_season}
                                        onChange={(e) => setEditSeasonForm({ ...editSeasonForm, year_season: parseInt(e.target.value) || new Date().getFullYear() })}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    URL Poster
                                </label>
                                <input
                                    type="text"
                                    value={editSeasonForm.poster_path}
                                    onChange={(e) => setEditSeasonForm({ ...editSeasonForm, poster_path: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    URL Backdrop
                                </label>
                                <input
                                    type="text"
                                    value={editSeasonForm.backdrop_path}
                                    onChange={(e) => setEditSeasonForm({ ...editSeasonForm, backdrop_path: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Texte Premium
                                </label>
                                <input
                                    type="text"
                                    value={editSeasonForm.premium_text}
                                    onChange={(e) => setEditSeasonForm({ ...editSeasonForm, premium_text: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="🄿🅁🄾🄼🄾 🄵🅁🄴🄴"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nombre d'épisodes
                                </label>
                                <input
                                    type="number"
                                    value={editSeasonForm.nb_episodes}
                                    onChange={(e) => setEditSeasonForm({ ...editSeasonForm, nb_episodes: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveSeason}
                                    className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                                >
                                    Enregistrer
                                </button>
                                <button
                                    onClick={() => setEditingSeason(null)}
                                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal d'édition série */}
            {editingSerie && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Modifier la série</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Titre de la série
                                </label>
                                <input
                                    type="text"
                                    value={editSerieForm.title_serie}
                                    onChange={(e) => setEditSerieForm({ ...editSerieForm, title_serie: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={editSerieForm.overview_serie}
                                    onChange={(e) => setEditSerieForm({ ...editSerieForm, overview_serie: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Catégorie
                                </label>
                                <select
                                    value={editSerieForm.categoryId || ''}
                                    onChange={(e) => setEditSerieForm({ ...editSerieForm, categoryId: e.target.value || undefined })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Aucune catégorie</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveSerie}
                                    className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                                >
                                    Enregistrer
                                </button>
                                <button
                                    onClick={() => setEditingSerie(null)}
                                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Onglet 2: Vimeo
const VimeoTab: React.FC = () => {
    const [folders, setFolders] = useState<any[]>([]);
    const [videos, setVideos] = useState<any[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [importingVideo, setImportingVideo] = useState<any | null>(null);
    const [seasons, setSeasons] = useState<any[]>([]);
    const [importForm, setImportForm] = useState({
        seasonId: '',
        createNewSeason: false,
        newSeasonData: {
            uid_serie: '',
            title_season: '',
            title_serie: '',
            season_number: 1
        }
    });

    useEffect(() => {
        loadFolders();
        loadSeasons();
    }, []);

    useEffect(() => {
        if (selectedFolder !== '') {
            loadVideos();
        }
    }, [selectedFolder]);

    const loadFolders = async () => {
        try {
            const res = await adminApiService.getVimeoFolders();
            setFolders(res.folders);
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors du chargement des dossiers');
        }
    };

    const loadVideos = async () => {
        setLoading(true);
        try {
            const res = await adminApiService.getVimeoVideos({
                folderId: selectedFolder || undefined,
                per_page: 50
            });
            setVideos(res.videos);
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors du chargement des vidéos');
        } finally {
            setLoading(false);
        }
    };

    const loadSeasons = async () => {
        try {
            const res = await adminApiService.getSeasons();
            setSeasons(res.seasons);
        } catch (error: any) {
            console.error('Error loading seasons:', error);
        }
    };

    const handleImport = (video: any) => {
        setImportingVideo(video);
        setImportForm({
            seasonId: '',
            createNewSeason: false,
            newSeasonData: {
                uid_serie: '',
                title_season: '',
                title_serie: '',
                season_number: 1
            }
        });
    };

    const handleConfirmImport = async () => {
        if (!importingVideo) return;

        if (!importForm.createNewSeason && !importForm.seasonId) {
            toast.error('Veuillez sélectionner une saison ou créer une nouvelle saison');
            return;
        }

        try {
            await adminApiService.importVimeoToApp({
                vimeoId: importingVideo.id,
                vimeoUri: importingVideo.uri,
                vimeoLink: importingVideo.link,
                embedUrl: importingVideo.embedUrl,
                title: importingVideo.name,
                description: importingVideo.description,
                thumbnail: importingVideo.thumbnail,
                duration: importingVideo.duration,
                seasonId: importForm.createNewSeason ? undefined : importForm.seasonId,
                createNewSeason: importForm.createNewSeason,
                newSeasonData: importForm.createNewSeason ? importForm.newSeasonData : undefined
            });
            toast.success('Vidéo importée avec succès');
            setImportingVideo(null);
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de l\'import');
        }
    };

    return (
        <div>
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dossier Vimeo
                </label>
                <select
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                    <option value="">Tous les dossiers</option>
                    {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>
                            {folder.name}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
                </div>
            ) : videos.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    Aucune vidéo trouvée
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map(video => (
                        <div
                            key={video.id}
                            className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                        >
                            {video.thumbnail && (
                                <img
                                    src={video.thumbnail}
                                    alt={video.name}
                                    className="w-full h-48 object-cover"
                                />
                            )}
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                    {video.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {Math.floor(video.duration / 60)} min
                                </p>
                                <button
                                    onClick={() => handleImport(video)}
                                    className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                                >
                                    Importer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal d'import */}
            {importingVideo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Importer la vidéo</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Importer dans une saison existante
                                </label>
                                <input
                                    type="radio"
                                    checked={!importForm.createNewSeason}
                                    onChange={() => setImportForm({ ...importForm, createNewSeason: false })}
                                    className="mr-2"
                                />
                                <select
                                    value={importForm.seasonId}
                                    onChange={(e) => setImportForm({ ...importForm, seasonId: e.target.value })}
                                    disabled={importForm.createNewSeason}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white mt-2"
                                >
                                    <option value="">Sélectionner une saison</option>
                                    {seasons.map(season => (
                                        <option key={season.id} value={season.id}>
                                            {season.title_season} ({season.title_serie})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Créer une nouvelle saison
                                </label>
                                <input
                                    type="radio"
                                    checked={importForm.createNewSeason}
                                    onChange={() => setImportForm({ ...importForm, createNewSeason: true })}
                                    className="mr-2"
                                />
                                {importForm.createNewSeason && (
                                    <div className="mt-2 space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Titre de la saison"
                                            value={importForm.newSeasonData.title_season}
                                            onChange={(e) => setImportForm({
                                                ...importForm,
                                                newSeasonData: { ...importForm.newSeasonData, title_season: e.target.value }
                                            })}
                                            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Titre de la série"
                                            value={importForm.newSeasonData.title_serie}
                                            onChange={(e) => setImportForm({
                                                ...importForm,
                                                newSeasonData: { ...importForm.newSeasonData, title_serie: e.target.value }
                                            })}
                                            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <input
                                            type="text"
                                            placeholder="UID Série"
                                            value={importForm.newSeasonData.uid_serie}
                                            onChange={(e) => setImportForm({
                                                ...importForm,
                                                newSeasonData: { ...importForm.newSeasonData, uid_serie: e.target.value }
                                            })}
                                            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Numéro de saison"
                                            value={importForm.newSeasonData.season_number}
                                            onChange={(e) => setImportForm({
                                                ...importForm,
                                                newSeasonData: { ...importForm.newSeasonData, season_number: parseInt(e.target.value) || 1 }
                                            })}
                                            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleConfirmImport}
                                    className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                                >
                                    Importer
                                </button>
                                <button
                                    onClick={() => setImportingVideo(null)}
                                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Onglet 3: Upload Vimeo
const UploadTab: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [folderId, setFolderId] = useState('');
    const [privacy, setPrivacy] = useState('unlisted');
    const [folders, setFolders] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState<any | null>(null);

    useEffect(() => {
        loadFolders();
    }, []);

    const loadFolders = async () => {
        try {
            const res = await adminApiService.getVimeoFolders();
            setFolders(res.folders);
        } catch (error: any) {
            console.error('Error loading folders:', error);
            toast.error(error.message || 'Erreur lors du chargement des dossiers Vimeo');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Veuillez sélectionner un fichier');
            return;
        }

        setUploading(true);
        setProgress(0);
        setUploadResult(null);

        try {
            const result = await adminApiService.uploadToVimeo(
                file,
                { title, description, folderId: folderId || undefined, privacy },
                (prog) => setProgress(prog)
            );
            setUploadResult(result);
            toast.success('Vidéo uploadée avec succès sur Vimeo');
            // Réinitialiser le formulaire
            setFile(null);
            setTitle('');
            setDescription('');
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de l\'upload');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fichier vidéo
                    </label>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Titre Vimeo
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Titre de la vidéo"
                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="Description de la vidéo"
                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Dossier Vimeo (optionnel)
                    </label>
                    <select
                        value={folderId}
                        onChange={(e) => setFolderId(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Aucun dossier</option>
                        {folders.map(folder => (
                            <option key={folder.id} value={folder.id}>
                                {folder.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confidentialité
                    </label>
                    <select
                        value={privacy}
                        onChange={(e) => setPrivacy(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="public">Public</option>
                        <option value="unlisted">Non listé</option>
                        <option value="private">Privé</option>
                    </select>
                </div>

                {uploading && (
                    <div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                                className="bg-amber-500 h-2.5 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Upload en cours... {Math.round(progress)}%
                        </p>
                    </div>
                )}

                {uploadResult && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                            ✅ Upload réussi !
                        </p>
                        <a
                            href={uploadResult.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
                        >
                            Voir sur Vimeo
                        </a>
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {uploading ? 'Upload en cours...' : 'Uploader vers Vimeo'}
                </button>
            </div>
        </div>
    );
};

export default AdminBackupVideosScreen;

