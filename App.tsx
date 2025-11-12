import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import AuthScreen from './screens/AuthScreen';
import GetStartedScreen from './screens/GetStartedScreen';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import ProfileScreen from './screens/ProfileScreen';
import BookmarkScreen from './screens/BookmarkScreen';
import PreferencesScreen from './screens/PreferencesScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import MediaDetailScreen from './screens/MediaDetailScreen';
import VideoPlayerScreen from './screens/VideoPlayerScreen';
import CategoryScreen from './screens/CategoryScreen';
import BottomNav from './components/BottomNav';
import { ActiveTab, Screen, MediaContent, Episode, MediaType } from './types';

const AppContent: React.FC = () => {
    const { isAuthenticated } = useAppContext();
    const [hasStarted, setHasStarted] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Home);
    const [currentScreen, setCurrentScreen] = useState<Screen>(ActiveTab.Home);
    const [selectedMedia, setSelectedMedia] = useState<MediaContent | null>(null);
    const [playingItem, setPlayingItem] = useState<{ media: MediaContent; episode?: Episode } | null>(null);
    const [activeCategory, setActiveCategory] = useState<MediaType | null>(null);


    const navigate = (screen: 'Bookmarks' | 'Preferences' | 'EditProfile') => {
        setCurrentScreen(screen);
    };

    const handleSelectMedia = (media: MediaContent) => {
        setSelectedMedia(media);
        setCurrentScreen('MediaDetail');
    };
    
    const handlePlay = (media: MediaContent, episode?: Episode) => {
        if (media.type === MediaType.Series && !episode && media.seasons?.[0]?.episodes?.[0]) {
            episode = media.seasons[0].episodes[0];
        }
        setPlayingItem({ media, episode });
        setCurrentScreen('VideoPlayer');
    };

    const handleBackFromPlayer = () => {
        if (playingItem) {
            handleSelectMedia(playingItem.media);
            // Do not set playingItem to null, so the detail screen can highlight the last played item.
        } else {
            handleBack();
        }
    };
    
    const handleNavigateEpisode = (direction: 'next' | 'prev') => {
      if (!playingItem || !playingItem.episode || !playingItem.media.seasons) return;
  
      const { media, episode: currentEpisode } = playingItem;
      // Flatten all episodes into a single list to simplify navigation
      const allEpisodes = media.seasons.flatMap(season => season.episodes);
      
      if (allEpisodes.length === 0) return;

      const currentIndex = allEpisodes.findIndex(e => e.episodeNumber === currentEpisode.episodeNumber && e.title === currentEpisode.title);
      
      if (currentIndex === -1) return; // Episode not found, should not happen

      const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      
      // Check if the new index is within the bounds of the episode list
      if (newIndex >= 0 && newIndex < allEpisodes.length) {
          const newEpisode = allEpisodes[newIndex];
          setPlayingItem({ media, episode: newEpisode });
      }
      // If out of bounds, do nothing. The button on the player screen will be disabled.
    };

    const handleBack = () => {
        setCurrentScreen(activeTab);
        setSelectedMedia(null);
        setActiveCategory(null);
    };
    
    const navigateToCategory = (mediaType: MediaType) => {
        setActiveCategory(mediaType);
        setCurrentScreen('CategoryScreen');
    };


    if (!hasStarted) {
        return <GetStartedScreen onGetStarted={() => setHasStarted(true)} />;
    }
    
    if (!isAuthenticated) {
        return <AuthScreen />;
    }
    
    const renderScreen = () => {
        switch (currentScreen) {
            case ActiveTab.Home:
                return <HomeScreen onSelectMedia={handleSelectMedia} onPlay={handleSelectMedia} navigateToCategory={navigateToCategory} />;
            case ActiveTab.Search:
                return <SearchScreen onSelectMedia={handleSelectMedia} onPlay={handleSelectMedia} />;
            case ActiveTab.Profile:
                return <ProfileScreen navigate={navigate} onSelectMedia={handleSelectMedia} onPlay={handlePlay} />;
            case 'Bookmarks':
                return <BookmarkScreen onBack={handleBack} onSelectMedia={handleSelectMedia} onPlay={handleSelectMedia} />;
            case 'Preferences':
                return <PreferencesScreen onBack={handleBack} />;
            case 'EditProfile':
                return <EditProfileScreen onBack={handleBack} />;
            case 'MediaDetail':
                return selectedMedia ? <MediaDetailScreen item={selectedMedia} onBack={handleBack} onPlay={handlePlay} playingItem={playingItem} onSelectMedia={handleSelectMedia} /> : <HomeScreen onSelectMedia={handleSelectMedia} onPlay={handleSelectMedia} navigateToCategory={navigateToCategory} />;
            case 'VideoPlayer':
                return playingItem ? <VideoPlayerScreen item={playingItem.media} episode={playingItem.episode} onBack={handleBackFromPlayer} onNavigateEpisode={handleNavigateEpisode} /> : <HomeScreen onSelectMedia={handleSelectMedia} onPlay={handleSelectMedia} navigateToCategory={navigateToCategory} />;
            case 'CategoryScreen':
                return activeCategory ? <CategoryScreen mediaType={activeCategory} onBack={handleBack} onSelectMedia={handleSelectMedia} onPlay={handleSelectMedia} /> : <HomeScreen onSelectMedia={handleSelectMedia} onPlay={handleSelectMedia} navigateToCategory={navigateToCategory} />;
            default:
                return <HomeScreen onSelectMedia={handleSelectMedia} onPlay={handleSelectMedia} navigateToCategory={navigateToCategory} />;
        }
    };
    
    const handleTabChange = (tab: ActiveTab) => {
        setActiveTab(tab);
        setCurrentScreen(tab);
    }

    const showBottomNav = ![ 'MediaDetail', 'VideoPlayer', 'CategoryScreen' ].includes(currentScreen);

    return (
        <div className="bg-[#FBF9F3] dark:bg-black min-h-screen text-gray-900 dark:text-white">
            <main className={showBottomNav ? "pb-20" : ""}>
                {renderScreen()}
            </main>
            {showBottomNav && (
                <div className="fixed bottom-0 left-0 right-0 z-20">
                    <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
                </div>
            )}
        </div>
    );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;