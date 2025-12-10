// screens/MediaDetailScreen.tsx

import React, { useState, useEffect } from 'react';
import { MediaContent, MediaType, Episode } from '../types';
import HeaderMenu from '../components/HeaderMenu';
import { PlayIcon, PlusIcon, ArrowLeftIcon, ChevronDownIcon, VolumeHighIcon, LikeIcon, CommentIcon, CheckIcon } from '../components/icons';
import { useAppContext } from '../context/AppContext';
import { serieService, Serie, seasonSerieService, SeasonSerie, episodeSerieService, EpisodeSerie } from '../lib/firestore';
import { Movie, movieService, likeService, commentService, Comment as FirestoreComment } from '../lib/firestore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface MediaDetailScreenProps {
    item: MediaContent;
    onBack: () => void;
    onPlay: (item: MediaContent, episode?: Episode | EpisodeSerie) => void;
    playingItem?: { media: MediaContent; episode?: Episode | EpisodeSerie } | null;
    onSelectMedia: (item: MediaContent) => void;
}

const EpisodeListItem: React.FC<{ episode: Episode | EpisodeSerie, onClick: () => void, isPlaying: boolean }> = ({ episode, onClick, isPlaying }) => {
    const playingClasses = isPlaying ? 'bg-amber-100 dark:bg-amber-900/40' : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50';

    // Vérifier si c'est un EpisodeSerie ou un Episode
    const isEpisodeSerie = 'uid_episode' in episode;
    const episodeNumber = isEpisodeSerie ? episode.episode_numero : episode.episodeNumber;
    const episodeTitle = isEpisodeSerie ? episode.title : episode.title;
    const episodeDuration = isEpisodeSerie ? episode.runtime_h_m : episode.duration;
    const thumbnailUrl = isEpisodeSerie ? episode.picture_path : episode.thumbnailUrl;

    return (
        <div onClick={onClick} className={`flex items-center space-x-4 p-2 rounded-lg ${playingClasses} cursor-pointer transition-all duration-200 relative`}>
            {isPlaying && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-lg"></div>}
            <div className="relative w-32 h-20 bg-gray-300 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                <img src={thumbnailUrl} alt={episodeTitle} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    {isPlaying ? (
                        <VolumeHighIcon className="w-8 h-8 text-white/90" />
                    ) : (
                        <PlayIcon className="w-8 h-8 text-white/80" />
                    )}
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <h4 className={`font-semibold truncate ${isPlaying ? 'text-amber-800 dark:text-amber-300' : 'text-gray-900 dark:text-white'}`}>{episodeNumber}. {episodeTitle}</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{episodeDuration}</p>
            </div>
        </div>
    );
};

const formatStat = (num: number | undefined): string => {
    if (num === undefined) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
};


const MediaDetailScreen: React.FC<MediaDetailScreenProps> = ({ item, onBack, onPlay, playingItem, onSelectMedia }) => {
    const { t, bookmarkedIds, toggleBookmark, userProfile } = useAppContext();
    const { title, imageUrl, author, description, theme, languages, seasons, type } = item;
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [firestoreSeasons, setFirestoreSeasons] = useState<SeasonSerie[]>([]);
    const [seasonEpisodes, setSeasonEpisodes] = useState<{ [key: string]: EpisodeSerie[] }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [movieData, setMovieData] = useState<Movie | null>(null);
    const [likeCount, setLikeCount] = useState(item.likes || 0);
    const [hasLiked, setHasLiked] = useState(false);
    const [comments, setComments] = useState<FirestoreComment[]>([]);
    const [isLoadingLikes, setIsLoadingLikes] = useState(false);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const descriptionThreshold = 150;
    const isLongDescription = description && description.length > descriptionThreshold;
    const isBookmarked = bookmarkedIds.includes(item.id);

    // Charger les données depuis Firestore si c'est une série
    useEffect(() => {
        loadMovieData();
        loadLikesAndComments();
    }, [item.id]);

    const loadLikesAndComments = async () => {
        if (!userProfile) return;

        try {
            setIsLoadingLikes(true);
            setIsLoadingComments(true);

            // Récupérer les likes
            const itemUid = movieData?.uid || item.id;
            const [count, userLiked] = await Promise.all([
                likeService.getLikeCount(itemUid),
                likeService.hasUserLiked(itemUid, userProfile.email || '')
            ]);

            setLikeCount(count);
            setHasLiked(userLiked);

            // Récupérer les commentaires
            const fetchedComments = await commentService.getComments(itemUid);
            // Map Firestore comments to the expected format if needed
            const mappedComments = fetchedComments.map(comment => ({
                ...comment,
                // Add any necessary transformations here
            }));
            setComments(mappedComments);
        } finally {
            setIsLoadingLikes(false);
            setIsLoadingComments(false);
        }
    };

    const loadMovieData = async () => {
        if (type === MediaType.Movie && item.id) {
            try {
                setIsLoading(true);
                const movie = await movieService.getMovieById(item.id);
                setMovieData(movie);
            } catch (error) {
                console.error('Error loading movie data:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        if ((type === MediaType.Series || type === MediaType.Podcast) && item.id) {
            loadSeasonsAndEpisodes();
        }
    }, [item.id, type]);

    const loadSeasonsAndEpisodes = async () => {
        setIsLoading(true);
        try {
            // Récupérer la série depuis Firestore
            const serie = await serieService.getSerieByUid(item.id);
            if (serie) {
                // Récupérer les saisons de la série
                const seasons = await seasonSerieService.getSeasonsBySerie(serie.uid_serie);
                setFirestoreSeasons(seasons);

                // Récupérer les épisodes pour chaque saison
                const episodesData: { [key: string]: EpisodeSerie[] } = {};
                for (const season of seasons) {
                    const episodes = await episodeSerieService.getEpisodesBySeason(season.uid_season);
                    episodesData[season.uid_season] = episodes;
                }
                setSeasonEpisodes(episodesData);
            }
        } catch (error) {
            console.error('Error loading seasons and episodes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Find the season of the currently playing episode to initialize state
    let playingEpisodeSeasonNumber: number | undefined;
    if (playingItem?.media.id === item.id && playingItem.episode) {
        // Vérifier si c'est un EpisodeSerie ou un Episode
        const isEpisodeSerie = 'uid_episode' in playingItem.episode;
        if (isEpisodeSerie) {
            // Chercher la saison par uid_episode
            for (const season of firestoreSeasons) {
                const episodes = seasonEpisodes[season.uid_season] || [];
                if (episodes.some(e => e.uid_episode === playingItem.episode?.uid_episode)) {
                    playingEpisodeSeasonNumber = season.season_number;
                    break;
                }
            }
        } else if (seasons) {
            // Logique existante pour les épisodes mockés
            for (const season of seasons) {
                if (season.episodes.some(e => e.episodeNumber === playingItem.episode?.episodeNumber && e.title === playingItem.episode?.title)) {
                    playingEpisodeSeasonNumber = season.seasonNumber;
                    break;
                }
            }
        }
    }

    const [expandedSeasons, setExpandedSeasons] = useState<number[]>([]);

    useEffect(() => {
        const initialExpandedSeason = playingEpisodeSeasonNumber ?? (firestoreSeasons.length > 0 ? firestoreSeasons[0].season_number : (seasons ? seasons[0].seasonNumber : undefined));
        if (initialExpandedSeason && !expandedSeasons.includes(initialExpandedSeason)) {
            setExpandedSeasons([initialExpandedSeason]);
        }
    }, [playingEpisodeSeasonNumber, firestoreSeasons, seasons]);

    const toggleSeason = (seasonNumber: number) => {
        setExpandedSeasons(current =>
            current.includes(seasonNumber)
                ? current.filter(s => s !== seasonNumber)
                : [...current, seasonNumber]
        );
    };

    const handlePlay = () => {
        let episodeToPlay: Episode | EpisodeSerie | undefined;

        if (type === MediaType.Series || type === MediaType.Podcast) {
            // Prioriser les données Firestore
            if (firestoreSeasons.length > 0) {
                const firstSeason = firestoreSeasons[0];
                const episodes = seasonEpisodes[firstSeason.uid_season] || [];
                episodeToPlay = episodes[0]; // Premier épisode de la première saison
            } else if (seasons && seasons.length > 0) {
                episodeToPlay = seasons[0].episodes[0]; // Fallback vers les données mockées
            }
        }

        onPlay(item, episodeToPlay);
    };

    const handleLike = async () => {
        if (!userProfile) {
            toast.error('Vous devez être connecté pour aimer', {
                position: 'bottom-center',
                autoClose: 2000,
            });
            return;
        }

        try {
            setIsLoading(true);
            const itemUid = movieData?.uid || item.id;
            const itemTitle = movieData?.title || item.title;
            const isLiked = await likeService.toggleLike(itemUid, itemTitle, userProfile);

            setHasLiked(isLiked);
            setLikeCount(prev => isLiked ? prev + 1 : Math.max(0, prev - 1));

            const message = isLiked ? 'Contenu aimé avec succès!' : 'Like retiré';
            toast.success(message, { position: 'bottom-center', autoClose: 2000 });
        } catch (error) {
            console.error('Error toggling like:', error);
            toast.error('Erreur lors du like', {
                position: 'bottom-center',
                autoClose: 2000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn pb-8 md:pb-12 bg-[#FBF9F3] dark:bg-black min-h-screen">
            <div className="relative h-[50vh] md:h-[60vh] lg:h-[65vh]">
                <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
                {/* Gradient overlay amélioré pour meilleure lisibilité */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#FBF9F3] via-[#FBF9F3]/80 to-transparent dark:from-black dark:via-black/80" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FBF9F3]/40 dark:to-black/40" />
                <header className="absolute top-0 left-0 right-0 z-10">
                    <div className="flex items-center justify-between h-16 px-4">
                        <button
                            onClick={onBack}
                            className="p-2 rounded-full text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors"
                            aria-label="Go back"
                        >
                            <ArrowLeftIcon className="w-6 h-6" />
                        </button>
                        <div className="p-1 rounded-full bg-black/40 backdrop-blur-sm">
                            <HeaderMenu variant="light" />
                        </div>
                    </div>
                </header>
            </div>

            <div className="p-4 md:p-6 lg:p-8 -mt-24 md:-mt-32 lg:-mt-40 relative z-10 space-y-4 md:space-y-6 max-w-7xl mx-auto">
                {/* Titre avec meilleure gestion du texte */}
                <div className="space-y-3 md:space-y-4">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white drop-shadow-lg leading-tight break-words">
                        {title}
                    </h1>

                    {/* Métadonnées mieux organisées */}
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm md:text-base">
                        {item.duration && (
                            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-medium">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {item.duration}
                            </span>
                        )}
                        {languages && languages.length > 0 && (
                            <span className="px-2.5 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-xs md:text-sm">
                                {languages[0].toUpperCase()}
                            </span>
                        )}
                        {type && (
                            <span className="px-2.5 py-1 rounded-md bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold text-xs md:text-sm">
                                {type === MediaType.Movie ? t('movie') : type === MediaType.Series ? t('series') : t('podcast')}
                            </span>
                        )}
                    </div>
                </div>


                {/* Stats et actions - Mieux organisés */}
                {type === MediaType.Movie && (
                    <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm md:text-base">
                        {isLoadingLikes ? (
                            <span className="text-gray-500 dark:text-gray-400">Chargement...</span>
                        ) : (
                            <>
                                <span className="flex items-center gap-2">
                                    <LikeIcon className={`w-5 h-5 ${hasLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`} />
                                    <span className={hasLiked ? 'text-red-500 font-semibold' : 'text-gray-700 dark:text-gray-300'}>
                                        {likeCount} {t('likes')}
                                    </span>
                                </span>
                                <span className="flex items-center gap-2">
                                    <CommentIcon className="w-5 h-5 text-sky-500" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {comments.length} {t(comments.length !== 1 ? 'comments' : 'comment')}
                                    </span>
                                </span>
                            </>
                        )}
                    </div>
                )}

                {/* Boutons d'action améliorés */}
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                    <button 
                        onClick={handlePlay} 
                        className="flex items-center justify-center gap-2 bg-amber-500 text-gray-900 font-bold py-3 md:py-3.5 px-6 md:px-8 rounded-lg md:rounded-xl hover:bg-amber-400 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        <PlayIcon className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-sm md:text-base">{t('play')}</span>
                    </button>
                    {type === MediaType.Movie && (
                        <button
                            onClick={handleLike}
                            className={`flex items-center justify-center gap-2 font-bold py-3 md:py-3.5 px-5 md:px-6 rounded-lg md:rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                                hasLiked
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-gray-200/90 dark:bg-gray-800/90 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
                            }`}
                            disabled={isLoading}
                        >
                            <LikeIcon className={`w-5 h-5 md:w-6 md:h-6 ${hasLiked ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                            <span className="text-sm md:text-base">{hasLiked ? t('liked') : t('like')}</span>
                        </button>
                    )}
                    <button
                        onClick={() => toggleBookmark(item.id)}
                        className={`flex items-center justify-center gap-2 font-bold py-3 md:py-3.5 px-5 md:px-6 rounded-lg md:rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                            isBookmarked
                                ? 'bg-amber-500 text-gray-900 hover:bg-amber-400'
                                : 'bg-gray-200/90 dark:bg-gray-800/90 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
                        }`}
                    >
                        {isBookmarked ? (
                            <CheckIcon className="w-5 h-5 md:w-6 md:h-6" />
                        ) : (
                            <PlusIcon className="w-5 h-5 md:w-6 md:h-6" />
                        )}
                        <span className="text-sm md:text-base">{isBookmarked ? t('addedToList') : t('myList')}</span>
                    </button>
                </div>

                {/* Description avec meilleure lisibilité */}
                <div className="space-y-2 md:space-y-3">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{t('description')}</h2>
                    {description ? (
                        <>
                            <p className={`text-gray-700 dark:text-gray-300 leading-relaxed text-sm md:text-base transition-all duration-300 ${
                                isLongDescription && !isDescriptionExpanded ? 'line-clamp-4' : ''
                            }`}>
                                {description}
                            </p>
                            {isLongDescription && (
                                <button
                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    className="text-amber-600 dark:text-amber-400 font-semibold text-sm md:text-base hover:text-amber-700 dark:hover:text-amber-300 transition-colors duration-200"
                                >
                                    {isDescriptionExpanded ? t('showLess') : t('readMore')}
                                </button>
                            )}
                        </>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base italic">
                            {t('noDescription') || 'Aucune description disponible'}
                        </p>
                    )}
                </div>

                {(type === MediaType.Series || type === MediaType.Podcast) && (
                    <div className="space-y-4 md:space-y-6">
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{t('episodes')}</h2>
                        {isLoading ? (
                            <div className="text-center py-8 md:py-12">
                                <div className="text-gray-500 dark:text-gray-400 text-sm md:text-base">{t('loading') || 'Chargement...'}</div>
                            </div>
                        ) : (
                            <div className="space-y-2 md:space-y-3">
                                {/* Afficher les saisons depuis Firestore si disponibles, sinon fallback vers les données mockées */}
                                {firestoreSeasons.length > 0 ? (
                                    firestoreSeasons.map(season => {
                                        const isExpanded = expandedSeasons.includes(season.season_number);
                                        const episodes = seasonEpisodes[season.uid_season] || [];
                                        return (
                                            <div key={season.uid_season} className="bg-gray-100/50 dark:bg-gray-800/40 rounded-lg overflow-hidden transition-all duration-300">
                                                <button
                                                    onClick={() => toggleSeason(season.season_number)}
                                                    className="w-full flex items-center justify-between p-4 text-left font-semibold hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                                                >
                                                    <span className="text-lg">
                                                        {t('season')} {season.season_number}
                                                        {season.title_season && (
                                                            <span className="ml-2 text-base font-normal text-gray-600 dark:text-gray-400">
                                                                - {season.title_season}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <ChevronDownIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                                {isExpanded && (
                                                    <div className="px-2 pb-2 space-y-1 animate-fadeIn">
                                                        {episodes.map(episode => {
                                                            const isPlaying = season.season_number === playingEpisodeSeasonNumber && episode.uid_episode === playingItem?.episode?.uid_episode;
                                                            return <EpisodeListItem key={episode.uid_episode} episode={episode} onClick={() => onPlay(item, episode)} isPlaying={isPlaying} />;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    /* Fallback vers les données mockées seulement si aucune donnée Firestore */
                                    seasons && seasons.length > 0 && seasons.map(season => {
                                        const isExpanded = expandedSeasons.includes(season.seasonNumber);
                                        return (
                                            <div key={season.seasonNumber} className="bg-gray-100/50 dark:bg-gray-800/40 rounded-lg overflow-hidden transition-all duration-300">
                                                <button
                                                    onClick={() => toggleSeason(season.seasonNumber)}
                                                    className="w-full flex items-center justify-between p-4 text-left font-semibold hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                                                >
                                                    <span className="text-lg">{t('season')} {season.seasonNumber}</span>
                                                    <ChevronDownIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                                {isExpanded && (
                                                    <div className="px-2 pb-2 space-y-1 animate-fadeIn">
                                                        {season.episodes.map(episode => {
                                                            const isPlaying = season.seasonNumber === playingEpisodeSeasonNumber && episode.episodeNumber === playingItem?.episode?.episodeNumber;
                                                            return <EpisodeListItem key={episode.episodeNumber} episode={episode} onClick={() => onPlay(item, episode)} isPlaying={isPlaying} />;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                )}


                <div>
                    <h2 className="text-xl font-bold mb-2">{t('languages')}</h2>
                    <div className="flex flex-wrap gap-2">
                        {languages && languages.map(lang => (
                            <span key={lang} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium py-1 px-3 rounded-full">
                                {lang}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaDetailScreen;