import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import MediaCard from '../components/MediaCard';
import LikedMediaCard from '../components/LikedMediaCard';
import UserAvatar from '../components/UserAvatar';
import { continueWatching, popularSeries, featuredContent, mostWatched, mostLiked, history } from '../data/mockData';

import { MediaContent, User, MediaType } from '../types';
import { useAppContext } from '../context/AppContext';
import { userService, UserProfile, generateDefaultAvatar, likeService, movieService, episodeSerieService, Movie, EpisodeSerie } from '../lib/firestore';

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

const LikedMediaRow: React.FC<{
  title: string;
  items: Array<{ content: MediaContent; likeCount: number }>;
  onSelectMedia: (item: MediaContent) => void;
  onPlay: (item: MediaContent) => void;
  variant?: 'poster' | 'thumbnail'
}> = ({ title, items, onSelectMedia, onPlay, variant }) => (
  <section className="py-4">
    <h3 className="text-xl font-bold px-4 mb-3">{title}</h3>
    <div className="flex space-x-4 overflow-x-auto px-4 scrollbar-hide pb-2">
      {items.map((item) => (
        <LikedMediaCard
          key={item.content.id}
          item={item.content}
          likeCount={item.likeCount}
          variant={variant}
          onSelect={onSelectMedia}
          onPlay={onPlay}
        />
      ))}
    </div>
  </section>
);

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

const NavigationTiles: React.FC<{ navigateToCategory: (type: MediaType) => void }> = ({ navigateToCategory }) => {
  const { t } = useAppContext();
  const [currentIndex, setCurrentIndex] = useState(0);

  const categories = [
    {
      titleKey: 'categorySeries',
      imageUrl: 'https://picsum.photos/seed/series-tile/800/600',
      type: MediaType.Series,
      className: 'w-full h-full',
      icon: '🎬',
      description: t('categorySeriesDescription') || 'Découvrez nos séries inspirantes et édifiantes'
    },
    {
      titleKey: 'categoryMovies',
      imageUrl: 'https://picsum.photos/seed/movies-tile/800/400',
      type: MediaType.Movie,
      className: 'w-full h-full',
      icon: '🎥',
      description: t('categoryMoviesDescription') || 'Des films qui édifient et inspirent votre foi'
    },
    {
      titleKey: 'categoryPodcasts',
      imageUrl: 'https://picsum.photos/seed/podcasts-tile/800/400',
      type: MediaType.Podcast,
      className: 'w-full h-full',
      icon: '🎧',
      description: t('categoryPodcastsDescription') || 'Écoutez nos enseignements où que vous soyez'
    },
  ];

  const nextCategory = () => {
    setCurrentIndex((prevIndex) => (prevIndex === categories.length - 1 ? 0 : prevIndex + 1));
  };

  const prevCategory = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? categories.length - 1 : prevIndex - 1));
  };

  const currentCategory = categories[currentIndex];

  return (
    <section className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t('browseCategories')}</h2>
        <div className="flex space-x-2">
          <button
            onClick={prevCategory}
            className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/70 text-white transition-colors"
            aria-label="Catégorie précédente"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextCategory}
            className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/70 text-white transition-colors"
            aria-label="Catégorie suivante"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden h-[400px] w-full">
        <div
          className="relative h-full w-full cursor-pointer transition-opacity duration-500"
          onClick={() => navigateToCategory(currentCategory.type)}
        >
          <img
            src={currentCategory.imageUrl}
            alt={t(currentCategory.titleKey as any)}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="relative h-full flex flex-col justify-end p-4">
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-3">{currentCategory.icon}</span>
              <h3 className="text-white text-3xl md:text-4xl font-bold">
                {t(currentCategory.titleKey as any)}
              </h3>
            </div>
            <p className="text-gray-200 text-lg mb-6 max-w-2xl">
              {currentCategory.description}
            </p>
            <div className="flex items-center">
              <span className="px-4 py-2 bg-amber-500 text-white rounded-full text-sm font-medium">
                {t('clickToExplore')}
              </span>
              <div className="flex ml-6 space-x-2">
                {categories.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${index === currentIndex ? 'bg-white' : 'bg-white/30'}`}
                    aria-label={`Aller à la catégorie ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

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
      {!loadingMostLiked && mostLikedItems.length > 0 && (
        <LikedMediaRow
          title={t('mostLiked') || 'Most Liked'}
          items={mostLikedItems}
          onSelectMedia={onSelectMedia}
          onPlay={onPlay}
          variant="thumbnail"
        />
      )}
      <NavigationTiles navigateToCategory={navigateToCategory} />
      <div className="space-y-4">
        <UserRow title={t('activeNow')} users={activeUsers} />
      </div>
    </div>
  );
};

export default HomeScreen;