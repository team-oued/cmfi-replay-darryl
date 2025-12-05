import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import MediaCard from '../components/MediaCard';
import RankedMediaCard from '../components/RankedMediaCard';
import UserAvatar from '../components/UserAvatar';
import CategoryTiles from '../components/CategoryTiles';
import { MediaCardSkeleton, UserAvatarSkeleton, HeroSkeleton, ContinueWatchingSkeleton, CategoryTilesSkeleton, MostLikedSkeleton } from '../components/Skeleton';
import { featuredContent } from '../data/mockData';

import { MediaContent, User, MediaType } from '../types';
import { useAppContext } from '../context/AppContext';
import { userService, generateDefaultAvatar, likeService, movieService, episodeSerieService, statsVuesService, ContinueWatchingItem, viewService } from '../lib/firestore';
import ContinueWatchingSection from '../components/ContinueWatchingSection';

const MediaRow: React.FC<{ title: string; items: MediaContent[]; onSelectMedia: (item: MediaContent) => void; onPlay: (item: MediaContent) => void; variant?: 'poster' | 'thumbnail' | 'list' }> = ({ title, items, onSelectMedia, onPlay, variant }) => (
    <section className="py-4">
        <h3 className="text-xl font-bold px-4 mb-3">{title}</h3>
        <div className="flex space-x-4 overflow-x-auto px-4 scrollbar-hide pb-2">
            {items.map((item) => (
                <MediaCard key={item.id} item={item} variant={variant} onSelect={onSelectMedia} onPlay={onPlay} />
            ))}
        </div>
    </section>
);

const RankedMediaRow: React.FC<{
    title: string;
    items: Array<{ content: MediaContent; likeCount: number; viewCount?: number }>;
    onSelectMedia: (item: MediaContent) => void;
    onPlay: (item: MediaContent) => void;
}> = ({ title, items, onSelectMedia, onPlay }) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = React.useState(false);
    const [canScrollRight, setCanScrollRight] = React.useState(true);

    // Vérifier si on peut scroller
    const checkScrollability = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    React.useEffect(() => {
        checkScrollability();
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScrollability);
            window.addEventListener('resize', checkScrollability);
            return () => {
                container.removeEventListener('scroll', checkScrollability);
                window.removeEventListener('resize', checkScrollability);
            };
        }
    }, [items]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 400; // Distance de défilement
            const newScrollLeft = direction === 'left'
                ? scrollContainerRef.current.scrollLeft - scrollAmount
                : scrollContainerRef.current.scrollLeft + scrollAmount;

            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section className="py-4">
            <div className="flex items-center justify-between px-4 mb-3">
                <h3 className="text-xl font-bold">{title}</h3>
                <div className="flex space-x-2">
                    <button
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        className={`p-2 rounded-full transition-all duration-300 ${canScrollLeft
                            ? 'bg-gray-800/50 hover:bg-gray-700/70 text-white'
                            : 'bg-gray-800/20 text-gray-500 cursor-not-allowed'
                            }`}
                        aria-label="Défiler vers la gauche"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        className={`p-2 rounded-full transition-all duration-300 ${canScrollRight
                            ? 'bg-gray-800/50 hover:bg-gray-700/70 text-white'
                            : 'bg-gray-800/20 text-gray-500 cursor-not-allowed'
                            }`}
                        aria-label="Défiler vers la droite"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
            <div
                ref={scrollContainerRef}
                className="flex space-x-4 overflow-x-auto px-4 scrollbar-hide pb-2"
            >
                {items.map((item, index) => (
                    <RankedMediaCard
                        key={item.content.id}
                        item={item.content}
                        rank={index + 1}
                        viewCount={item.viewCount}
                        onSelect={onSelectMedia}
                        onPlay={onPlay}
                    />
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
    const { t, user } = useAppContext();
    const [activeUsers, setActiveUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [mostLikedItems, setMostLikedItems] = useState<Array<{ content: MediaContent; likeCount: number; viewCount?: number }>>([]);
    const [loadingMostLiked, setLoadingMostLiked] = useState(true);
    const [mostWatchedItems, setMostWatchedItems] = useState<Array<{ content: MediaContent; likeCount: number; viewCount: number }>>([]);
    const [loadingMostWatched, setLoadingMostWatched] = useState(true);
    const [continueWatchingItems, setContinueWatchingItems] = useState<ContinueWatchingItem[]>([]);
    const [loadingContinueWatching, setLoadingContinueWatching] = useState(true);
    const [loadingHero, setLoadingHero] = useState(true);
    const [loadingCategories, setLoadingCategories] = useState(true);

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
        const fetchActiveUsers = async () => {
            try {
                const activeUserProfiles = await userService.getActiveUsers(50);
                const formattedUsers: User[] = activeUserProfiles.map(profile => ({
                    id: profile.uid,
                    name: profile.display_name || 'Unknown User',
                    avatarUrl: profile.photo_url || generateDefaultAvatar(profile.display_name),
                    isOnline: profile.presence === 'online' || profile.presence === 'idle'
                }));
                setActiveUsers(formattedUsers);
            } catch (error) {
                console.error('Error fetching active users:', error);
            } finally {
                setLoadingUsers(false);
            }
        };

        fetchActiveUsers();
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
                                author: movie.original_title,
                                theme: '',
                                imageUrl: movie.backdrop_path || movie.picture_path || movie.poster_path,
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
                                    author: movie.original_title,
                                    theme: '',
                                    imageUrl: movie.backdrop_path || movie.picture_path || movie.poster_path,
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

    const handleContinueWatchingClick = async (item: ContinueWatchingItem) => {
        if (item.type === 'movie') {
            // C'est un film
            const movie = await movieService.getMovieByUid(item.uid);
            if (movie) {
                const mediaContent: MediaContent = {
                    id: movie.uid,
                    type: MediaType.Movie,
                    title: movie.title,
                    author: movie.original_title,
                    theme: '',
                    imageUrl: movie.backdrop_path || movie.picture_path || movie.poster_path,
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
            {/* Hero Section avec Skeleton */}
            {loadingHero ? (
                <HeroSkeleton />
            ) : (
                <Hero items={featuredContent} onSelectMedia={onSelectMedia} onPlay={onPlay} />
            )}

            {/* Catégories avec Skeleton */}
            {loadingCategories ? (
                <CategoryTilesSkeleton />
            ) : (
                <CategoryTiles navigateToCategory={navigateToCategory} />
            )}

            {/* Section Continuer la lecture avec Skeleton */}
            {loadingContinueWatching ? (
                <ContinueWatchingSkeleton />
            ) : continueWatchingItems.length > 0 ? (
                <ContinueWatchingSection
                    items={continueWatchingItems}
                    onItemClick={handleContinueWatchingClick}
                    title={t('continueWatching') || 'Continuer la lecture'}
                />
            ) : null}

            {loadingMostLiked ? (
                <MostLikedSkeleton />
            ) : mostLikedItems.length > 0 && (
                <RankedMediaRow
                    title={t('mostLiked') || 'Most Liked'}
                    items={mostLikedItems}
                    onSelectMedia={onSelectMedia}
                    onPlay={onPlay}
                />
            )}

            {loadingMostWatched ? (
                <MostLikedSkeleton />
            ) : mostWatchedItems.length > 0 && (
                <RankedMediaRow
                    title={t('mostWatched') || 'Most Watched'}
                    items={mostWatchedItems}
                    onSelectMedia={onSelectMedia}
                    onPlay={onPlay}
                />
            )}

            {/* Section Active Now - Visible uniquement pour les administrateurs */}
{/*             {user?.isAdmin && (
                <div className="space-y-4">
                    {loadingUsers ? (
                        <section className="py-4">
                            <h3 className="text-xl font-bold px-4 mb-3">{t('activeNow')}</h3>
                            <div className="flex space-x-4 overflow-x-auto px-4 scrollbar-hide pb-2">
                                {[...Array(8)].map((_, i) => (
                                    <UserAvatarSkeleton key={i} />
                                ))}
                            </div>
                        </section>
                    ) : (
                        <UserRow title={`${t('activeNow')} (Admin)`} users={activeUsers} />
                    )}
                </div>
            )} */}
        </div>
    );
};

export default HomeScreen;