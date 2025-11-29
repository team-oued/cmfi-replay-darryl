import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './transitions.css';

// Auth Screens
import GetStartedScreen from './screens/GetStartedScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

// Main Screens
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import ProfileScreen from './screens/ProfileScreen';
import BookmarksScreen from './screens/BookmarksScreen';
import PreferencesScreen from './screens/PreferencesScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import HistoryScreen from './screens/HistoryScreen';

// Category Screens
import MoviesScreen from './screens/MoviesScreen';
import SeriesScreen from './screens/SeriesScreen';
import PodcastsScreen from './screens/PodcastsScreen';

// Detail & Player Screens
import MediaDetailWrapper from './screens/MediaDetailWrapper';
import WatchScreen from './screens/WatchScreen';

// Components
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import HamburgerMenu from './components/HamburgerMenu';
import { ActiveTab, MediaContent, MediaType } from './types';
import { serieService, seasonSerieService, episodeSerieService, EpisodeSerie } from './lib/firestore';

const AppContent: React.FC = () => {
    const { isAuthenticated } = useAppContext();
    const location = useLocation();
    const navigate = useNavigate();

    // Utiliser localStorage pour persister hasStarted
    const [hasStarted, setHasStarted] = useState(() => {
        const stored = localStorage.getItem('hasStarted');
        return stored === 'true';
    });

    const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Home);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [playingItem, setPlayingItem] = useState<{ media: MediaContent; episode?: EpisodeSerie } | null>(null);
    const [episodesCache, setEpisodesCache] = useState<{ serieId: string; episodes: EpisodeSerie[] } | null>(null);

    // Sauvegarder hasStarted dans localStorage
    useEffect(() => {
        localStorage.setItem('hasStarted', hasStarted.toString());
    }, [hasStarted]);

    const handlePlay = async (media: MediaContent, episode?: EpisodeSerie) => {
        let episodeToPlay = episode;
        if ((media.type === MediaType.Series || media.type === MediaType.Podcast) && !episodeToPlay) {
            const mockFirst = media.seasons?.[0]?.episodes?.[0];
            if (mockFirst) {
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
                    // Silent failover
                }
            } else {
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
                    // Ignore
                }
            }
        }
        setPlayingItem({ media, episode: episodeToPlay });

        // Navigate to watch screen with appropriate UID
        // Fallback to ID if uid_episode is missing (legacy records)
        const watchUid = episodeToPlay ? (episodeToPlay.uid_episode || episodeToPlay.id) : media.id;
        navigate(`/watch/${watchUid}`);
    };

    const handleReturnHome = () => {
        setActiveTab(ActiveTab.Home);
        setPlayingItem(null);
        navigate('/home');
    };

    const handleSelectMedia = (media: MediaContent) => {
        // Convertir le type de média en route appropriée
        const route = media.type === MediaType.Series ? 'serie' :
            media.type === MediaType.Movie ? 'movie' :
                'podcast';
        navigate(`/${route}/${media.id}`);
    };

    const handleNavigateToCategory = (type: MediaType) => {
        // Series est déjà au pluriel, Movie et Podcast ont besoin d'un "s"
        const route = type === MediaType.Series ? 'series' :
            type === MediaType.Movie ? 'movies' :
                'podcasts';
        navigate(`/${route}`);
    };

    const handleNavigateToScreen = (screen: string) => {
        // Gérer le cas spécial pour les favoris
        if (screen.toLowerCase() === 'bookmarks') {
            navigate('/bookmarks');
        } else {
            navigate(`/${screen.toLowerCase()}`);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (!hasStarted) {
        return <GetStartedScreen onGetStarted={() => setHasStarted(true)} />;
    }

    // Route publique pour /watch/:uid (accessible sans authentification)
    const isWatchRoute = location.pathname.startsWith('/watch/');

    if (!isAuthenticated && !isWatchRoute) {
        return (
            <Routes>
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/register" element={<RegisterScreen />} />
                <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    // Déterminer si on doit afficher la bottom nav
    const showBottomNav = isAuthenticated && !location.pathname.startsWith('/watch/') && !['/login', '/register', '/forgot-password'].includes(location.pathname);

    return (
        <div className="min-h-screen bg-[#FBF9F3] dark:bg-black text-gray-900 dark:text-white">
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

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                activeTab={activeTab}
                setActiveTab={(tab) => setActiveTab(tab as ActiveTab)}
            />

            {!isWatchRoute && (
                <div className="fixed top-0 left-0 right-0 z-20 bg-[#FBF9F3] dark:bg-black p-4 border-b border-gray-200 dark:border-gray-800 md:hidden">
                    <div className="relative w-full flex items-center justify-center">
                        <h1 className="text-xl font-bold text-center">CMFI Replay</h1>
                        <div className="absolute right-0">
                            <HamburgerMenu
                                isOpen={isSidebarOpen}
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className={`page-transition fadeIn ${showBottomNav ? 'pb-20' : ''} ${!isWatchRoute ? 'pt-16' : ''} md:pt-0`}>
                <Routes>
                    {/* Watch Route - Accessible sans authentification */}
                    <Route path="/watch/:uid" element={
                        <WatchScreen onReturnHome={handleReturnHome} />
                    } />

                    {/* Routes protégées - Nécessitent une authentification */}
                    {isAuthenticated && (
                        <>
                            {/* Main Routes */}
                            <Route path="/home" element={
                                <HomeScreen
                                    onSelectMedia={handleSelectMedia}
                                    onPlay={handlePlay}
                                    navigateToCategory={handleNavigateToCategory}
                                />
                            } />

                            <Route path="/search" element={
                                <SearchScreen
                                    onNavigate={(screen: string, data?: any) => {
                                        if (screen === 'movieDetail' && data?.uid) {
                                            navigate(`/movie/${data.uid}`);
                                        } else if (screen === 'serieDetail' && data?.uid_serie) {
                                            navigate(`/serie/${data.uid_serie}`);
                                        } else if (screen === 'seasonDetail' && data?.uid_serie) {
                                            navigate(`/serie/${data.uid_serie}`);
                                        } else if (screen === 'episodePlayer' && data?.uid_episode) {
                                            navigate(`/watch/${data.uid_episode}`);
                                        }
                                    }}
                                />
                            } />

                            <Route path="/profile" element={
                                <ProfileScreen
                                    navigate={handleNavigateToScreen}
                                    onSelectMedia={handleSelectMedia}
                                    onPlay={handlePlay}
                                />
                            } />

                            <Route path="/bookmarks" element={
                                <BookmarksScreen
                                    onBack={() => navigate('/profile')}
                                    onSelectMedia={handleSelectMedia}
                                    onPlay={handlePlay}
                                />
                            } />

                            {/* Category Routes */}
                            <Route path="/movies" element={
                                <MoviesScreen
                                    onSelectMedia={handleSelectMedia}
                                    onPlay={handlePlay}
                                />
                            } />

                            <Route path="/series" element={
                                <SeriesScreen
                                    onSelectMedia={handleSelectMedia}
                                    onPlay={handlePlay}
                                />
                            } />

                            <Route path="/podcasts" element={
                                <PodcastsScreen
                                    onSelectMedia={handleSelectMedia}
                                    onPlay={handlePlay}
                                />
                            } />

                            {/* Detail Routes */}
                            <Route path="/movie/:uid" element={
                                <MediaDetailWrapper
                                    onPlay={handlePlay}
                                    playingItem={playingItem}
                                />
                            } />

                            <Route path="/serie/:uid" element={
                                <MediaDetailWrapper
                                    onPlay={handlePlay}
                                    playingItem={playingItem}
                                />
                            } />

                            <Route path="/podcast/:uid" element={
                                <MediaDetailWrapper
                                    onPlay={handlePlay}
                                    playingItem={playingItem}
                                />
                            } />

                            {/* Profile Sub-Routes */}
                            <Route path="/favorites" element={
                                <BookmarksScreen
                                    onSelectMedia={handleSelectMedia}
                                    onPlay={handlePlay}
                                    onBack={handleBack}
                                />
                            } />

                            <Route path="/preferences" element={
                                <PreferencesScreen onBack={handleBack} />
                            } />

                            <Route path="/editprofile" element={
                                <EditProfileScreen onBack={handleBack} />
                            } />

                            <Route path="/change-password" element={
                                <ChangePasswordScreen />
                            } />

                            <Route path="/history" element={
                                <HistoryScreen
                                    onSelectMedia={handleSelectMedia}
                                    onPlay={handlePlay}
                                    onBack={handleBack}
                                />
                            } />
                        </>
                    )}

                    {/* Redirects */}
                    <Route path="/get-started" element={<Navigate to="/home" replace />} />
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} />
                </Routes>
            </div>

            {showBottomNav && (
                <div className="fixed bottom-0 left-0 right-0 z-20">
                    <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
            )}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <AppProvider>
                <ThemeProvider>
                    <AppContent />
                </ThemeProvider>
            </AppProvider>
        </BrowserRouter>
    );
};

export default App;