import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthScreen from './screens/AuthScreen';
import GetStartedScreen from './screens/GetStartedScreen';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import ProfileScreen from './screens/ProfileScreen';
import BookmarkScreen from './screens/BookmarkScreen';
import PreferencesScreen from './screens/PreferencesScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import MediaDetailScreen from './screens/MediaDetailScreen';
import MoviePlayerScreen from './screens/MoviePlayerScreen';
import EpisodePlayerScreen from './screens/EpisodePlayerScreen';
import CategoryScreen from './screens/CategoryScreen';
import BottomNav from './components/BottomNav';
import { ActiveTab, Screen, MediaContent, Episode, MediaType } from './types';
import { serieService, seasonSerieService, episodeSerieService, EpisodeSerie } from './lib/firestore';

const AppContent: React.FC = () => {
    const { isAuthenticated } = useAppContext();
    const [hasStarted, setHasStarted] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Home);
    const [currentScreen, setCurrentScreen] = useState<Screen>(ActiveTab.Home);
    const [selectedMedia, setSelectedMedia] = useState<MediaContent | null>(null);
    const [playingItem, setPlayingItem] = useState<{ media: MediaContent; episode?: EpisodeSerie } | null>(null);
    const [activeCategory, setActiveCategory] = useState<MediaType | null>(null);
    const [episodesCache, setEpisodesCache] = useState<{ serieId: string; episodes: EpisodeSerie[] } | null>(null);

    const navigate = (screen: 'Bookmarks' | 'Preferences' | 'EditProfile') => {
        setCurrentScreen(screen);
    };

    const handleSelectMedia = (media: MediaContent) => {
        setSelectedMedia(media);
        setCurrentScreen('MediaDetail');
    };

    const handlePlay = async (media: MediaContent, episode?: EpisodeSerie) => {
        let episodeToPlay = episode;
        if ((media.type === MediaType.Series || media.type === MediaType.Podcast) && !episodeToPlay) {
            // Try mock data first if present
            const mockFirst = media.seasons?.[0]?.episodes?.[0];
            if (mockFirst) {
                // Fallback: we will try to resolve a matching EpisodeSerie from Firestore by serie id
                try {
                    const serie = await serieService.getSerieByUid(media.id);
                    if (serie) {
                        const seasons = await seasonSerieService.getSeasonsBySerie(serie.uid_serie);
                        if (seasons.length > 0) {
                            const episodesBySeason = await Promise.all(
                                seasons.map(async (s) => await episodeSerieService.getEpisodesBySeason(s.uid_season))
                            );
                            const allEpisodesFs = episodesBySeason.flat();
                            if (allEpisodesFs.length > 0) {
                                setEpisodesCache({ serieId: serie.uid_serie, episodes: allEpisodesFs });
                                episodeToPlay = allEpisodesFs[0];
                            }
                        }
                    }
                } catch (e) {
                    // Silent failover to not block playback routing
                }
            } else {
                // MediaContent has no seasons; resolve directly from Firestore
                try {
                    const serie = await serieService.getSerieByUid(media.id);
                    if (serie) {
                        const seasons = await seasonSerieService.getSeasonsBySerie(serie.uid_serie);
                        if (seasons.length > 0) {
                            const episodesBySeason = await Promise.all(
                                seasons.map(async (s) => await episodeSerieService.getEpisodesBySeason(s.uid_season))
                            );
                            const allEpisodesFs = episodesBySeason.flat();
                            if (allEpisodesFs.length > 0) {
                                setEpisodesCache({ serieId: serie.uid_serie, episodes: allEpisodesFs });
                                episodeToPlay = allEpisodesFs[0];
                            }
                        }
                    }
                } catch (e) {
                    // Ignore; no episode found
                }
            }
        }
        setPlayingItem({ media, episode: episodeToPlay });
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

    const handleNavigateEpisode = async (direction: 'next' | 'prev') => {
        if (!playingItem || !playingItem.episode) return;

        const { media, episode: currentEpisode } = playingItem;

        try {
            let allEpisodesFs: EpisodeSerie[] | null = null;

            // Use cache if available and for the same serie
            const serie = await serieService.getSerieByUid(media.id);
            if (!serie) return;
            if (episodesCache && episodesCache.serieId === serie.uid_serie) {
                allEpisodesFs = episodesCache.episodes;
            } else {
                const seasons = await seasonSerieService.getSeasonsBySerie(serie.uid_serie);
                if (seasons.length === 0) return;
                const episodesBySeason = await Promise.all(
                    seasons.map(async (s) => await episodeSerieService.getEpisodesBySeason(s.uid_season))
                );
                allEpisodesFs = episodesBySeason.flat();
                setEpisodesCache({ serieId: serie.uid_serie, episodes: allEpisodesFs });
            }

            if (!allEpisodesFs || allEpisodesFs.length === 0) return;

            let currentIndex = allEpisodesFs.findIndex(e => e.uid_episode === currentEpisode.uid_episode);
            if (currentIndex === -1) {
                currentIndex = allEpisodesFs.findIndex(e => e.episode_numero === (currentEpisode as any).episode_numero && e.title === currentEpisode.title);
            }
            if (currentIndex === -1) return;

            const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
            if (newIndex < 0 || newIndex >= allEpisodesFs.length) return;

            const newEpisode = allEpisodesFs[newIndex];
            setPlayingItem({ media, episode: newEpisode });
        } catch (e) {
            // ignore
        }
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

    const handleReturnHome = () => {
        setActiveTab(ActiveTab.Home);
        setCurrentScreen(ActiveTab.Home);
        setSelectedMedia(null);
        setActiveCategory(null);
        setPlayingItem(null);
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
                return <HomeScreen onSelectMedia={handleSelectMedia} onPlay={handlePlay} navigateToCategory={navigateToCategory} />;
            case ActiveTab.Search:
                return <SearchScreen onSelectMedia={handleSelectMedia} onPlay={handlePlay} />;
            case ActiveTab.Profile:
                return <ProfileScreen navigate={navigate} onSelectMedia={handleSelectMedia} onPlay={handlePlay} />;
            case 'Bookmarks':
                return <BookmarkScreen onBack={handleBack} onSelectMedia={handleSelectMedia} onPlay={handlePlay} />;
            case 'Preferences':
                return <PreferencesScreen onBack={handleBack} />;
            case 'EditProfile':
                return <EditProfileScreen onBack={handleBack} />;
            case 'MediaDetail':
                return selectedMedia ? <MediaDetailScreen item={selectedMedia} onBack={handleBack} onPlay={handlePlay} playingItem={playingItem} onSelectMedia={handleSelectMedia} /> : <HomeScreen onSelectMedia={handleSelectMedia} onPlay={handlePlay} navigateToCategory={navigateToCategory} />;
            case 'VideoPlayer':
                if (!playingItem) return <HomeScreen onSelectMedia={handleSelectMedia} onPlay={handleSelectMedia} navigateToCategory={navigateToCategory} />;
                if (playingItem.episode) {
                    return <EpisodePlayerScreen item={playingItem.media} episode={playingItem.episode} onBack={handleBackFromPlayer} onNavigateEpisode={handleNavigateEpisode} onReturnHome={handleReturnHome} />;
                }
                return <MoviePlayerScreen item={playingItem.media} onBack={handleBackFromPlayer} />;
            case 'CategoryScreen':
                return activeCategory ? <CategoryScreen mediaType={activeCategory} onBack={handleBack} onSelectMedia={handleSelectMedia} onPlay={handlePlay} /> : <HomeScreen onSelectMedia={handleSelectMedia} onPlay={handleSelectMedia} navigateToCategory={navigateToCategory} />;
            default:
                return <HomeScreen onSelectMedia={handleSelectMedia} onPlay={handleSelectMedia} navigateToCategory={navigateToCategory} />;
        }
    };

    const handleTabChange = (tab: ActiveTab) => {
        setActiveTab(tab);
        setCurrentScreen(tab);
    }

    const showBottomNav = !['MediaDetail', 'VideoPlayer', 'CategoryScreen'].includes(currentScreen);

    return (
        <div className="min-h-screen bg-[#FBF9F3] dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
            <ToastContainer
                position="bottom-center"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
                aria-label="Notification"
                toastStyle={{
                    backgroundColor: '#F59E0B',
                    color: '#1F2937',
                }}
            />
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