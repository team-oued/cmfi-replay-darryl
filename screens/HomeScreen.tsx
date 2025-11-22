import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import MediaCard from '../components/MediaCard';
import RankedMediaCard from '../components/RankedMediaCard';
import UserAvatar from '../components/UserAvatar';
import CategoryTiles from '../components/CategoryTiles';
import { MediaCardSkeleton, UserAvatarSkeleton } from '../components/Skeleton';
import { featuredContent } from '../data/mockData';

import { MediaContent, User, MediaType } from '../types';
import { useAppContext } from '../context/AppContext';
import { userService, generateDefaultAvatar, likeService, movieService, episodeSerieService } from '../lib/firestore';

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
    items: Array<{ content: MediaContent; likeCount: number }>;
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
    onPlay: (item: MediaContent) => void;
    navigateToCategory: (type: MediaType) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectMedia, onPlay, navigateToCategory }) => {
    const { t } = useAppContext();
    const [activeUsers, setActiveUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [mostLikedItems, setMostLikedItems] = useState<Array<{ content: MediaContent; likeCount: number }>>([]);
    const [loadingMostLiked, setLoadingMostLiked] = useState(true);

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
                const validItems = itemsWithDetails.filter(item => item !== null) as Array<{ content: MediaContent; likeCount: number }>;
                setMostLikedItems(validItems);
            } catch (error) {
                console.error('Error fetching most liked items:', error);
            } finally {
                setLoadingMostLiked(false);
            }
        };

        fetchMostLikedItems();
    }, []);

    return (
        <div>
            <Header title="CMFI Replay" />
            <Hero items={featuredContent} onSelectMedia={onSelectMedia} onPlay={onPlay} />
            <CategoryTiles navigateToCategory={navigateToCategory} />

            {loadingMostLiked ? (
                <section className="py-4">
                    <div className="flex items-center justify-between px-4 mb-3">
                        <h3 className="text-xl font-bold">{t('mostLiked') || 'Most Liked'}</h3>
                    </div>
                    <div className="flex space-x-4 overflow-x-auto px-4 scrollbar-hide pb-2">
                        {[...Array(5)].map((_, i) => (
                            <MediaCardSkeleton key={i} variant="poster" />
                        ))}
                    </div>
                </section>
            ) : mostLikedItems.length > 0 && (
                <RankedMediaRow
                    title={t('mostLiked') || 'Most Liked'}
                    items={mostLikedItems}
                    onSelectMedia={onSelectMedia}
                    onPlay={onPlay}
                />
            )}

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
                    <UserRow title={t('activeNow')} users={activeUsers} />
                )}
            </div>
        </div>
    );
};

export default HomeScreen;