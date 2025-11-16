import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import MediaCard from '../components/MediaCard';
import UserAvatar from '../components/UserAvatar';
import { continueWatching, popularSeries, newDocumentaries, featuredPodcasts, featuredContent, mostWatched, mostLiked, history } from '../data/mockData';
import { MediaContent, User, MediaType } from '../types';
import { useAppContext } from '../context/AppContext';
import { userService, UserProfile, generateDefaultAvatar } from '../lib/firestore';

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
    const categories = [
        { titleKey: 'categorySeries', imageUrl: 'https://picsum.photos/seed/series-tile/400/300', type: MediaType.Series },
        { titleKey: 'categoryDocumentaries', imageUrl: 'https://picsum.photos/seed/docs-tile/400/300', type: MediaType.Documentary },
        { titleKey: 'categoryPodcasts', imageUrl: 'https://picsum.photos/seed/pod-tile/400/300', type: MediaType.Podcast },
    ];

    return (
        <section className="px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {categories.map((category) => (
                    <div 
                        key={category.titleKey} 
                        onClick={() => navigateToCategory(category.type)}
                        className="relative aspect-[4/3] rounded-lg overflow-hidden group cursor-pointer shadow-lg"
                    >
                        <img src={category.imageUrl} alt={t(category.titleKey as any)} className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-colors duration-300" />
                        <div className="relative h-full flex items-center justify-center p-2">
                            <h3 className="text-white text-lg sm:text-xl font-extrabold uppercase tracking-wider text-center drop-shadow-md">
                                {t(category.titleKey as any)}
                            </h3>
                        </div>
                    </div>
                ))}
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

    // Récupérer les utilisateurs actifs depuis Firestore
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

  return (
    <div>
      <Header title="CMFI Replay" />
      <Hero items={featuredContent} onSelectMedia={onSelectMedia} onPlay={onPlay}/>
      <NavigationTiles navigateToCategory={navigateToCategory} />
      <div className="space-y-4">
        <MediaRow title={t('continueWatching')} items={continueWatching} onSelectMedia={onSelectMedia} onPlay={onPlay} />
        <MediaRow title={t('history')} items={history} variant="poster" onSelectMedia={onSelectMedia} onPlay={onPlay} />
        <MediaRow title={t('mostWatched')} items={mostWatched} onSelectMedia={onSelectMedia} onPlay={onPlay} />
        <MediaRow title={t('mostLiked')} items={mostLiked} variant="poster" onSelectMedia={onSelectMedia} onPlay={onPlay} />
        <UserRow title={t('activeNow')} users={activeUsers} />
        <MediaRow title={t('popularSeries')} items={popularSeries} variant="poster" onSelectMedia={onSelectMedia} onPlay={onPlay} />
        <MediaRow title={t('newDocumentaries')} items={newDocumentaries} onSelectMedia={onSelectMedia} onPlay={onPlay} />
        <MediaRow title={t('featuredPodcasts')} items={featuredPodcasts} variant="poster" onSelectMedia={onSelectMedia} onPlay={onPlay} />
      </div>
    </div>
  );
};

export default HomeScreen;