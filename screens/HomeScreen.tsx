import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import HeroPrimeVideo from '../components/HeroPrimeVideo';
import HeroNetflix from '../components/HeroNetflix';
import MediaCard from '../components/MediaCard';
import RankedMediaCard from '../components/RankedMediaCard';
import UserAvatar from '../components/UserAvatar';
import CategoryTiles from '../components/CategoryTiles';
import { MediaCardSkeleton, UserAvatarSkeleton, HeroSkeleton, ContinueWatchingSkeleton, CategoryTilesSkeleton, MostLikedSkeleton } from '../components/Skeleton';
import { featuredContent } from '../data/mockData';
import { PlayIcon } from '../components/icons';

import { MediaContent, User, MediaType } from '../types';
import { useAppContext, HomeViewMode } from '../context/AppContext';
import { userService, generateDefaultAvatar, likeService, movieService, episodeSerieService, statsVuesService, ContinueWatchingItem, viewService, Movie, Serie, serieService, serieCategoryService, SerieCategory, UserProfile } from '../lib/firestore';
import ContinueWatchingSection from '../components/ContinueWatchingSection';
import InfoBar from '../components/InfoBar';
import ProfileCompletionModal from '../components/ProfileCompletionModal';

const MediaRow: React.FC<{ title: string; items: MediaContent[]; onSelectMedia: (item: MediaContent) => void; onPlay: (item: MediaContent) => void; variant?: 'poster' | 'thumbnail' | 'list' }> = ({ title, items, onSelectMedia, onPlay, variant }) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const [showLeftGradient, setShowLeftGradient] = React.useState(false);
    const [showRightGradient, setShowRightGradient] = React.useState(true);

    React.useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const checkScroll = () => {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            setShowLeftGradient(scrollLeft > 10);
            setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 10);
        };

        checkScroll();
        container.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
        return () => {
            container.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [items]);

    if (items.length === 0) return null;

    return (
        <section className="py-8 md:py-12 relative group">
            {/* Titre avec meilleure hiérarchie */}
            <div className="px-4 md:px-6 lg:px-8 mb-6">
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                    {title}
                </h3>
            </div>

            {/* Container avec gradients de fade dynamiques */}
            <div className="relative">
                {/* Gradient gauche */}
                {showLeftGradient && (
                    <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 lg:w-40 bg-gradient-to-r from-[#FBF9F3] dark:from-black via-[#FBF9F3]/80 dark:via-black/80 to-transparent z-20 pointer-events-none transition-opacity duration-500" />
                )}

                {/* Gradient droite */}
                {showRightGradient && (
                    <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 lg:w-40 bg-gradient-to-l from-[#FBF9F3] dark:from-black via-[#FBF9F3]/80 dark:via-black/80 to-transparent z-20 pointer-events-none transition-opacity duration-500" />
                )}

                {/* Carrousel avec scroll smooth et snap */}
                <div
                    ref={scrollContainerRef}
                    className="flex space-x-4 md:space-x-6 overflow-x-auto px-4 md:px-6 lg:px-8 scrollbar-hide pb-6 scroll-smooth snap-x snap-mandatory"
                    style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
                >
                    {items.map((item, index) => (
                        <div key={item.id} className="snap-start flex-shrink-0">
                            <MediaCard item={item} variant={variant} onSelect={onSelectMedia} onPlay={onPlay} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const RankedMediaRow: React.FC<{
    title: string;
    items: Array<{ content: MediaContent; likeCount: number; viewCount?: number }>;
    onSelectMedia: (item: MediaContent) => void;
    onPlay: (item: MediaContent) => void;
}> = ({ title, items, onSelectMedia, onPlay }) => {
    if (items.length === 0) return null;

    return (
        <section className="py-8 md:py-12">
            {/* Titre */}
            <div className="px-4 md:px-6 lg:px-8 mb-6">
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                    {title}
                </h3>
            </div>

            {/* Container simple sans effets de défilement */}
            <div className="flex space-x-4 md:space-x-6 overflow-x-auto px-4 md:px-6 lg:px-8 scrollbar-hide pb-6">
                {items.map((item, index) => (
                    <div key={item.content.id} className="flex-shrink-0">
                        <RankedMediaCard
                            item={item.content}
                            rank={index + 1}
                            viewCount={item.viewCount}
                            onSelect={onSelectMedia}
                            onPlay={onPlay}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
};

const UserRow: React.FC<{ title: string; users: User[] }> = ({ title, users }) => (
    <section className="py-4">
        <h3 className="text-xl font-bold px-4 mb-3">{title}</h3>
        <div className="flex space-x-4 overflow-x-auto px-4 scrollbar-hide pb-2">
            {users.map((user: User) => (
                <UserAvatar key={user.id} user={user} />
            ))}
        </div>
    </section>
);

interface HomeScreenProps {
    onSelectMedia: (item: MediaContent) => void;
    onPlay: (item: MediaContent, episode?: any) => void;
    navigateToCategory: (type: MediaType) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectMedia, onPlay, navigateToCategory }) => {
    const { t, user, userProfile, setUserProfile } = useAppContext();
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [mostLikedItems, setMostLikedItems] = useState<Array<{ content: MediaContent; likeCount: number; viewCount?: number }>>([]);

    // Vérifier si le profil doit être complété
    useEffect(() => {
        console.log('🔍 Vérification profil:', {
            userProfile: !!userProfile,
            user: !!user,
            country: userProfile?.country,
            phoneNumber: userProfile?.phoneNumber,
            shouldShow: userProfile && user && (!userProfile.country || !userProfile.phoneNumber)
        });
        
        if (userProfile && user) {
            // Vérifier si le pays est manquant (seul champ obligatoire)
            const countryMissing = !userProfile.country || userProfile.country.trim() === '';
            const needsCompletion = countryMissing; // Seul le pays est obligatoire
            
            console.log('📋 Profil à compléter?', {
                countryMissing,
                needsCompletion,
                country: userProfile.country,
                phoneNumber: userProfile.phoneNumber
            });
            
            if (needsCompletion) {
                console.log('✅ Affichage du modal');
                setShowProfileModal(true);
            } else {
                console.log('❌ Profil complet, pas de modal');
                setShowProfileModal(false);
            }
        } else {
            console.log('⏳ En attente du chargement du profil ou de l\'utilisateur');
        }
    }, [userProfile, user]);
    const [loadingMostLiked, setLoadingMostLiked] = useState(true);
    const [mostWatchedItems, setMostWatchedItems] = useState<Array<{ content: MediaContent; likeCount: number; viewCount: number }>>([]);
    const [loadingMostWatched, setLoadingMostWatched] = useState(true);
    const [continueWatchingItems, setContinueWatchingItems] = useState<ContinueWatchingItem[]>([]);
    const [loadingContinueWatching, setLoadingContinueWatching] = useState(true);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loadingMovies, setLoadingMovies] = useState(true);
    const [series, setSeries] = useState<Serie[]>([]);
    const [loadingSeries, setLoadingSeries] = useState(true);
    const [podcasts, setPodcasts] = useState<Serie[]>([]);
    const [loadingPodcasts, setLoadingPodcasts] = useState(true);
    const [loadingHero, setLoadingHero] = useState(true);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [serieCategories, setSerieCategories] = useState<SerieCategory[]>([]);
    const [seriesByCategory, setSeriesByCategory] = useState<Record<string, Serie[]>>({});
    const [loadingSeriesByCategory, setLoadingSeriesByCategory] = useState(true);

    // Simuler le chargement du Hero
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoadingHero(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    // Simuler le chargement des catégories
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoadingCategories(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const fetchMostLikedItems = async () => {
            try {
                const likedItems = await likeService.getMostLikedItems(10);

                // Récupérer les détails de chaque item (film ou épisode)
                const itemsWithDetails = await Promise.all(
                    likedItems.map(async (item) => {
                        // Essayer de récupérer comme film
                        let movie = await movieService.getMovieByUid(item.uid);
                        if (movie && !movie.hidden) {
                            const mediaContent: MediaContent = {
                                id: movie.uid,
                                type: MediaType.Movie,
                                title: movie.title,
                                author: undefined,
                                theme: '',
                                imageUrl: movie.picture_path || movie.backdrop_path || movie.poster_path,
                                duration: movie.runtime_h_m,
                                description: movie.overview,
                                languages: [movie.original_language],
                                video_path_hd: movie.video_path_hd
                            };
                            return { content: mediaContent, likeCount: item.likeCount };
                        }

                        // Sinon essayer comme épisode
                        let episode = await episodeSerieService.getEpisodeByUid(item.uid);
                        if (episode && !episode.hidden) {
                            const mediaContent: MediaContent = {
                                id: episode.uid_episode,
                                type: MediaType.Series,
                                title: episode.title,
                                author: episode.title_serie,
                                theme: '',
                                imageUrl: episode.backdrop_path || episode.picture_path,
                                duration: episode.runtime_h_m,
                                description: episode.overviewFr || episode.overview,
                                languages: [],
                                video_path_hd: episode.video_path_hd
                            };
                            return { content: mediaContent, likeCount: item.likeCount };
                        }

                        return null;
                    })
                );

                // Filtrer les items null
                const validItems = itemsWithDetails.filter((item): item is { content: MediaContent; likeCount: number; viewCount?: number } => item !== null);
                setMostLikedItems(validItems);
            } catch (error) {
                console.error('Error fetching most liked items:', error);
            } finally {
                setLoadingMostLiked(false);
            }
        };

        fetchMostLikedItems();
    }, []);

    useEffect(() => {
        const fetchMostWatchedItems = async () => {
            try {
                const watchedItems = await viewService.getMostWatchedItems(10);

                // Récupérer les détails de chaque item (film ou épisode)
                const itemsWithDetails = await Promise.all(
                    watchedItems.map(async (item) => {
                        if (item.type === 'movie') {
                            // Récupérer le film
                            let movie = await movieService.getMovieByUid(item.uid);
                            if (movie && !movie.hidden) {
                                const mediaContent: MediaContent = {
                                    id: movie.uid,
                                    type: MediaType.Movie,
                                    title: movie.title,
                                    author: undefined,
                                    theme: '',
                                    imageUrl: movie.picture_path || movie.backdrop_path || movie.poster_path,
                                    duration: movie.runtime_h_m,
                                    description: movie.overview,
                                    languages: [movie.original_language],
                                    video_path_hd: movie.video_path_hd
                                };
                                return { content: mediaContent, likeCount: item.viewCount, viewCount: item.viewCount };
                            }
                        } else {
                            // Récupérer l'épisode
                            let episode = await episodeSerieService.getEpisodeByUid(item.uid);
                            if (episode && !episode.hidden) {
                                const mediaContent: MediaContent = {
                                    id: episode.uid_episode,
                                    type: MediaType.Series,
                                    title: episode.title,
                                    author: episode.title_serie,
                                    theme: '',
                                    imageUrl: episode.backdrop_path || episode.picture_path,
                                    duration: episode.runtime_h_m,
                                    description: episode.overviewFr || episode.overview,
                                    languages: [],
                                    video_path_hd: episode.video_path_hd
                                };
                                return { content: mediaContent, likeCount: item.viewCount, viewCount: item.viewCount };
                            }
                        }

                        return null;
                    })
                );

                // Filtrer les items null
                const validItems = itemsWithDetails
                    .filter((item): item is { content: MediaContent; likeCount: number; viewCount: number } => item !== null);
                setMostWatchedItems(validItems);
            } catch (error) {
                console.error('Error fetching most watched items:', error);
            } finally {
                setLoadingMostWatched(false);
            }
        };

        fetchMostWatchedItems();
    }, []);

    // Récupérer les éléments "Continuer la lecture"
    useEffect(() => {
        const fetchContinueWatching = async () => {
            if (!user) {
                setLoadingContinueWatching(false);
                return;
            }

            try {
                const items = await statsVuesService.getContinueWatching(user.uid, 10);
                setContinueWatchingItems(items);
            } catch (error) {
                console.error('Error fetching continue watching items:', error);
            } finally {
                setLoadingContinueWatching(false);
            }
        };

        fetchContinueWatching();
    }, [user]);

    // Récupérer les films
    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const moviesData = await movieService.getTenHomeMovies();
                setMovies(moviesData);
            } catch (error) {
                console.error('Error fetching movies:', error);
            } finally {
                setLoadingMovies(false);
            }
        };

        fetchMovies();
    }, []);

    // Récupérer les séries
    useEffect(() => {
        const fetchSeries = async () => {
            try {
                const seriesData = await serieService.getTenHomeSeries();
                setSeries(seriesData);
            } catch (error) {
                console.error('Error fetching series:', error);
            } finally {
                setLoadingSeries(false);
            }
        };

        fetchSeries();
    }, []);

    // Charger les catégories et les séries par catégorie
    useEffect(() => {
        const fetchCategoriesAndSeries = async () => {
            setLoadingSeriesByCategory(true);
            try {
                // Charger toutes les catégories
                const categories = await serieCategoryService.getAllCategories();
                console.log('📁 Catégories chargées:', categories);
                setSerieCategories(categories);

                // Charger les séries pour chaque catégorie
                const seriesByCat: Record<string, Serie[]> = {};
                for (const category of categories) {
                    const categorySeries = await serieCategoryService.getSeriesByCategory(category.id);
                    console.log(`📺 Séries pour la catégorie "${category.name}" (ID: ${category.id}):`, categorySeries.length, categorySeries);
                    if (categorySeries.length > 0) {
                        seriesByCat[category.id] = categorySeries;
                    } else {
                        console.log(`⚠️ Aucune série trouvée pour la catégorie "${category.name}". Assurez-vous que les séries ont un champ "categoryId" avec la valeur "${category.id}"`);
                    }
                }
                console.log('📊 Séries par catégorie:', seriesByCat);
                console.log('📊 Nombre total de catégories avec séries:', Object.keys(seriesByCat).length);
                setSeriesByCategory(seriesByCat);
            } catch (error) {
                console.error('Error fetching categories and series:', error);
            } finally {
                setLoadingSeriesByCategory(false);
            }
        };
        fetchCategoriesAndSeries();
    }, []);

    // Récupérer les podcasts
    useEffect(() => {
        const fetchPodcasts = async () => {
            try {
                const podcastsData = await serieService.getTenHomePodcasts();
                setPodcasts(podcastsData);
            } catch (error) {
                console.error('Error fetching podcasts:', error);
            } finally {
                setLoadingPodcasts(false);
            }
        };

        fetchPodcasts();
    }, []);

    const handleContinueWatchingClick = async (item: ContinueWatchingItem) => {
        if (item.type === 'movie') {
            // C'est un film
            const movie = await movieService.getMovieByUid(item.uid);
            if (movie) {
                const mediaContent: MediaContent = {
                    id: movie.uid,
                    type: MediaType.Movie,
                    title: movie.title,
                    author: undefined,
                    theme: '',
                    imageUrl: movie.picture_path || movie.backdrop_path || movie.poster_path,
                    duration: movie.runtime_h_m,
                    description: movie.overview,
                    languages: [movie.original_language],
                    video_path_hd: movie.video_path_hd
                };
                onPlay(mediaContent);
            }
        } else {
            // C'est un épisode - utiliser uid_episode en priorité, sinon uid
            const episodeUid = item.uid_episode || item.uid;
            let episode = null;

            // Essayer de récupérer par UID
            if (episodeUid) {
                episode = await episodeSerieService.getEpisodeByUid(episodeUid);
            }

            // Si pas trouvé et qu'on a un ID de document (fallback legacy)
            if (!episode && item.episodeId) {
                episode = await episodeSerieService.getEpisodeById(item.episodeId);
            }

            if (episode) {
                // S'assurer que l'épisode a un uid_episode pour la navigation
                if (!episode.uid_episode && item.episodeId) {
                    episode.uid_episode = item.episodeId;
                }

                const mediaContent: MediaContent = {
                    id: episode.uid_episode,
                    type: MediaType.Series,
                    title: episode.title_serie,
                    author: episode.title_serie,
                    theme: '',
                    imageUrl: episode.backdrop_path || episode.picture_path,
                    duration: episode.runtime_h_m,
                    description: episode.overviewFr || episode.overview,
                    languages: [],
                    video_path_hd: episode.video_path_hd
                };

                // Passer l'épisode directement à onPlay
                onPlay(mediaContent, episode);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#FBF9F3] dark:bg-black">

            {/* Hero Section Prime Video */}
            <div className="animate-fadeIn">
                {loadingHero ? (
                    <HeroSkeleton />
                ) : (
                    <HeroPrimeVideo items={featuredContent} onSelectMedia={onSelectMedia} onPlay={onPlay} />
                )}
            </div>

            {/* Barre d'information déroulante */}
            <InfoBar />

            {/* Sections horizontales style Prime Video */}
            <div className="bg-[#FBF9F3] dark:bg-black">
                {/* Section Continue Watching */}
                {loadingContinueWatching && (
                    <div className="py-8 md:py-12">
                        <div className="px-4 md:px-6 lg:px-8 mb-6">
                            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                        </div>
                        <div className="flex space-x-4 overflow-x-auto px-4 md:px-6 lg:px-8 scrollbar-hide pb-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex-shrink-0 w-56 md:w-64 lg:w-72">
                                    <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mb-3"></div>
                                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {continueWatchingItems.length > 0 && (
                    <div className="py-8 md:py-12">
                        <div className="px-4 md:px-6 lg:px-8 mb-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                    {t('continueWatching') || 'Continuer la lecture'}
                                </h3>
                            </div>
                        </div>
                        <div className="flex space-x-3 md:space-x-4 overflow-x-auto px-4 md:px-6 lg:px-8 scrollbar-hide pb-4">
                            {continueWatchingItems.slice(0, 10).map((item) => (
                                <div key={item.id} className="flex-shrink-0 w-36 md:w-48 group cursor-pointer" onClick={() => handleContinueWatchingClick(item)}>
                                    <div className="relative aspect-[2/3] rounded-lg border-2 border-gray-300 dark:border-gray-600 overflow-hidden mb-3 transition-colors duration-300 group-hover:border-blue-500 dark:group-hover:border-blue-400">
                                        {/* Fond qui prolonge l'image avec effet de flou */}
                                        <div className="absolute inset-0 w-full h-full">
                                            <img
                                                src={item.imageUrl}
                                                alt={item.title}
                                                className="w-full h-full object-cover blur-xl scale-110 opacity-30 dark:opacity-20"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-gray-900/20 to-gray-900/30 dark:from-black/60 dark:via-black/30 dark:to-black/40"></div>
                                        </div>
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="w-full h-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-105"
                                        />
                                        {/* Progress bar */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-300"
                                                style={{ width: `${item.progress}%` }}
                                            />
                                        </div>
                                        {/* Overlay au hover */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-2xl">
                                                <PlayIcon className="w-7 h-7 text-gray-900 ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <h4 className="text-gray-900 dark:text-white text-sm md:text-base font-semibold break-words group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {item.title}
                                    </h4>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section Films */}
                {movies.length > 0 && (
                    <div className="py-6 md:py-8 lg:py-10 mt-4 md:mt-6">
                        <div className="px-4 md:px-6 lg:px-8 mb-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                    {t('films') || 'Films'}
                                </h3>
                                <button
                                    onClick={() => navigateToCategory(MediaType.Movie)}
                                    className="text-sm md:text-base text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
                                >
                                    {t('viewAll') || 'Voir plus'} →
                                </button>
                            </div>
                        </div>
                        <div className="flex space-x-3 md:space-x-4 overflow-x-auto px-4 md:px-6 lg:px-8 scrollbar-hide pb-4">
                            {movies.map((movie) => {
                                const mediaContent: MediaContent = {
                                    id: movie.uid,
                                    type: MediaType.Movie,
                                    title: movie.title,
                                    author: undefined,
                                    theme: '',
                                    imageUrl: movie.picture_path || movie.backdrop_path || movie.poster_path,
                                    duration: movie.runtime_h_m,
                                    description: movie.overview,
                                    languages: [movie.original_language],
                                    video_path_hd: movie.video_path_hd
                                };
                                return (
                                    <div key={movie.uid} className="flex-shrink-0">
                                        <MediaCard
                                            item={mediaContent}
                                            variant="poster"
                                            onSelect={onSelectMedia}
                                            onPlay={onPlay}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Section Séries */}
                {series.length > 0 && (
                    <div className="py-6 md:py-8 lg:py-10 mt-4 md:mt-6">
                        <div className="px-4 md:px-6 lg:px-8 mb-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                    {t('seriesTitle') || 'Séries'}
                                </h3>
                                <button
                                    onClick={() => navigateToCategory(MediaType.Series)}
                                    className="text-sm md:text-base text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
                                >
                                    {t('viewAll') || 'Voir plus'} →
                                </button>
                            </div>
                        </div>
                        <div className="flex space-x-3 md:space-x-4 overflow-x-auto px-4 md:px-6 lg:px-8 scrollbar-hide pb-4">
                            {series.map((serie) => {
                                const mediaContent: MediaContent = {
                                    id: serie.uid_serie,
                                    type: MediaType.Series,
                                    title: serie.title_serie,
                                    author: '',
                                    theme: '',
                                    imageUrl: serie.image_path || serie.back_path,
                                    duration: serie.runtime_h_m,
                                    description: serie.overview_serie,
                                    languages: [],
                                    video_path_hd: ''
                                };
                                return (
                                    <div key={serie.uid_serie} className="flex-shrink-0">
                                        <MediaCard
                                            item={mediaContent}
                                            variant="poster"
                                            onSelect={onSelectMedia}
                                            onPlay={onPlay}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Sections par catégorie */}
                {!loadingSeriesByCategory && (
                    <>
                        {serieCategories.length === 0 ? (
                            <div className="px-4 md:px-6 lg:px-8 py-4 text-sm text-gray-500 dark:text-gray-400">
                                💡 Aucune catégorie créée. Créez des catégories dans la page Admin pour organiser vos séries.
                            </div>
                        ) : (
                            serieCategories.map((category) => {
                                const categorySeries = seriesByCategory[category.id] || [];
                                
                                // Afficher la catégorie même si elle est vide
                                if (categorySeries.length === 0) {
                                    return (
                                        <div key={category.id} className="py-6 md:py-8 lg:py-10 mt-4 md:mt-6">
                                            <div className="px-4 md:px-6 lg:px-8 mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-1 h-8 rounded-full"
                                                        style={{ backgroundColor: category.color || '#3B82F6' }}
                                                    />
                                                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                                        {category.name}
                                                    </h3>
                                                </div>
                                            </div>
                                            <div className="px-4 md:px-6 lg:px-8">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                    Aucune série dans cette catégorie. Assignez des séries à cette catégorie dans la page Admin.
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={category.id} className="py-6 md:py-8 lg:py-10 mt-4 md:mt-6">
                                        <div className="px-4 md:px-6 lg:px-8 mb-6">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-1 h-8 rounded-full"
                                                    style={{ backgroundColor: category.color || '#3B82F6' }}
                                                />
                                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                                    {category.name}
                                                </h3>
                                            </div>
                                            {category.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-4">
                                                    {category.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex space-x-3 md:space-x-4 overflow-x-auto px-4 md:px-6 lg:px-8 scrollbar-hide pb-4">
                                            {categorySeries.map((serie) => {
                                                const mediaContent: MediaContent = {
                                                    id: serie.uid_serie,
                                                    type: MediaType.Series,
                                                    title: serie.title_serie,
                                                    author: '',
                                                    theme: '',
                                                    imageUrl: serie.image_path || serie.back_path,
                                                    duration: serie.runtime_h_m,
                                                    description: serie.overview_serie,
                                                    languages: [],
                                                    video_path_hd: ''
                                                };
                                                return (
                                                    <div key={serie.uid_serie} className="flex-shrink-0">
                                                        <MediaCard
                                                            item={mediaContent}
                                                            variant="poster"
                                                            onSelect={onSelectMedia}
                                                            onPlay={onPlay}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </>
                )}

                {/* Section Podcasts */}
                {podcasts.length > 0 && (
                    <div className="py-6 md:py-8 lg:py-10 mt-4 md:mt-6">
                        <div className="px-4 md:px-6 lg:px-8 mb-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                    {t('podcastsTitle') || 'Podcasts'}
                                </h3>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('🔍 Clic sur bouton Podcasts (Prime), navigation vers /podcasts');
                                        navigateToCategory(MediaType.Podcast);
                                    }}
                                    className="text-sm md:text-base text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
                                >
                                    {t('viewAll') || 'Voir plus'} →
                                </button>
                            </div>
                        </div>
                        <div className="flex space-x-3 md:space-x-4 overflow-x-auto px-4 md:px-6 lg:px-8 scrollbar-hide pb-4">
                            {podcasts.map((podcast) => {
                                const mediaContent: MediaContent = {
                                    id: podcast.uid_serie,
                                    type: MediaType.Podcast,
                                    title: podcast.title_serie,
                                    author: '',
                                    theme: '',
                                    imageUrl: podcast.image_path || podcast.back_path,
                                    duration: podcast.runtime_h_m,
                                    description: podcast.overview_serie,
                                    languages: [],
                                    video_path_hd: ''
                                };
                                return (
                                    <div key={podcast.uid_serie} className="flex-shrink-0">
                                        <MediaCard
                                            item={mediaContent}
                                            variant="poster"
                                            onSelect={onSelectMedia}
                                            onPlay={onPlay}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Section Most Watched */}
                {loadingMostWatched && (
                    <div className="py-6 md:py-8 lg:py-10 mt-4 md:mt-6">
                        <div className="px-4 md:px-6 lg:px-8 mb-6">
                            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                        </div>
                        <div className="flex space-x-3 md:space-x-4 overflow-x-auto px-4 md:px-6 lg:px-8 scrollbar-hide pb-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex-shrink-0 w-40 md:w-48 lg:w-52">
                                    <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-3"></div>
                                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {mostWatchedItems.length > 0 && (
                    <div className="py-6 md:py-8 lg:py-10 mt-4 md:mt-6">
                        <div className="px-4 md:px-6 lg:px-8 mb-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                    {t('mostWatched') || 'Les plus regardés'}
                                </h3>
                            </div>
                        </div>
                        <div className="flex space-x-3 md:space-x-4 overflow-x-auto px-4 md:px-6 lg:px-8 scrollbar-hide pb-4">
                            {mostWatchedItems.slice(0, 10).map((item, index) => (
                                <div key={item.content.id} className="flex-shrink-0">
                                    <MediaCard
                                        item={item.content}
                                        variant="poster"
                                        onSelect={onSelectMedia}
                                        onPlay={onPlay}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section Most Liked */}
                {loadingMostLiked && (
                    <div className="py-6 md:py-8 lg:py-10 mt-4 md:mt-6">
                        <div className="px-4 md:px-6 lg:px-8 mb-6">
                            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                        </div>
                        <div className="flex space-x-3 md:space-x-4 overflow-x-auto px-4 md:px-6 lg:px-8 scrollbar-hide pb-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex-shrink-0 w-40 md:w-48 lg:w-52">
                                    <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-3"></div>
                                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {mostLikedItems.length > 0 && (
                    <div className="py-6 md:py-8 lg:py-10 mt-4 md:mt-6">
                        <div className="px-4 md:px-6 lg:px-8 mb-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                    {t('mostLiked') || 'Les plus aimés'}
                                </h3>
                            </div>
                        </div>
                        <div className="flex space-x-3 md:space-x-4 overflow-x-auto px-4 md:px-6 lg:px-8 scrollbar-hide pb-4">
                            {mostLikedItems.slice(0, 10).map((item, index) => (
                                <div key={item.content.id} className="flex-shrink-0">
                                    <MediaCard
                                        item={item.content}
                                        variant="poster"
                                        onSelect={onSelectMedia}
                                        onPlay={onPlay}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de complétion du profil */}
            {showProfileModal && userProfile && (
                <ProfileCompletionModal
                    userProfile={userProfile}
                    onComplete={(updatedProfile) => {
                        console.log('✅ Profil complété:', updatedProfile);
                        setUserProfile(updatedProfile);
                        setShowProfileModal(false);
                    }}
                />
            )}
        </div>
    );

};

export default HomeScreen;