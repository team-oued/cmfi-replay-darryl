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
import BottomNav from './components/BottomNav';
import { ActiveTab, Screen, MediaContent, Episode, MediaType } from './types';

const AppContent: React.FC = () => {
    const { isAuthenticated } = useAppContext();
    const [hasStarted, setHasStarted] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Home);
    const [currentScreen, setCurrentScreen] = useState<Screen>(ActiveTab.Home);
    const [selectedMedia, setSelectedMedia] = useState<MediaContent | null>(null);
    const [playingItem, setPlayingItem] = useState<{ media: MediaContent; episode?: Episode } | null>(null);


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
            setPlayingItem(null);
        } else {
            handleBack();
        }
    };
    
    const handleNavigateEpisode = (direction: 'next' | 'prev') => {
      if (!playingItem || !playingItem.episode || !playingItem.media.seasons) return;
  
      const { media, episode: currentEpisode } = playingItem;
      let currentSeason;
      let currentSeasonIndex = -1;
      let currentEpisodeIndex = -1;
  
      for (let i = 0; i < media.seasons.length; i++) {
          const season = media.seasons[i];
          const episodeIndex = season.episodes.findIndex(e => e.episodeNumber === currentEpisode.episodeNumber);
          if (episodeIndex !== -1) {
              currentSeason = season;
              currentSeasonIndex = i;
              currentEpisodeIndex = episodeIndex;
              break;
          }
      }
  
      if (!currentSeason) return;
  
      const nextEpisodeIndex = direction === 'next' ? currentEpisodeIndex + 1 : currentEpisodeIndex - 1;
  
      if (nextEpisodeIndex >= 0 && nextEpisodeIndex < currentSeason.episodes.length) {
          const newEpisode = currentSeason.episodes[nextEpisodeIndex];
          setPlayingItem({ media, episode: newEpisode });
      } 
      // Optional: Add logic for next/prev season if needed
    };

    const handleBack = () => {
        setCurrentScreen(activeTab);
        setSelectedMedia(null);
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
                return <HomeScreen onSelectMedia={handleSelectMedia} onPlay={handlePlay} />;
            case ActiveTab.Search:
                return <SearchScreen onSelectMedia={handleSelectMedia} onPlay={handlePlay} />;
            case ActiveTab.Profile:
                return <ProfileScreen navigate={navigate} />;
            case 'Bookmarks':
                return <BookmarkScreen onBack={handleBack} onSelectMedia={handleSelectMedia} onPlay={handlePlay} />;
            case 'Preferences':
                return <PreferencesScreen onBack={handleBack} />;
            case 'EditProfile':
                return <EditProfileScreen onBack={handleBack} />;
            case 'MediaDetail':
                return selectedMedia ? <MediaDetailScreen item={selectedMedia} onBack={handleBack} onPlay={handlePlay} /> : <HomeScreen onSelectMedia={handleSelectMedia} onPlay={handlePlay}/>;
            case 'VideoPlayer':
                return playingItem ? <VideoPlayerScreen item={playingItem.media} episode={playingItem.episode} onBack={handleBackFromPlayer} onNavigateEpisode={handleNavigateEpisode} /> : <HomeScreen onSelectMedia={handleSelectMedia} onPlay={handlePlay} />;
            default:
                return <HomeScreen onSelectMedia={handleSelectMedia} onPlay={handlePlay}/>;
        }
    };
    
    const handleTabChange = (tab: ActiveTab) => {
        setActiveTab(tab);
        setCurrentScreen(tab);
    }

    const showBottomNav = ![ 'MediaDetail', 'VideoPlayer' ].includes(currentScreen);

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