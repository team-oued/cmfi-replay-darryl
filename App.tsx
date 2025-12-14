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
import RedeemVoucherScreen from './screens/RedeemVoucherScreen';
import ManageSubscriptionScreen from './screens/ManageSubscriptionScreen';
import ManageInfoBarScreen from './screens/ManageInfoBarScreen';
import ManageAdsScreen from './screens/ManageAdsScreen';
import PaymentSuccessScreen from './screens/PaymentSuccessScreen';

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
import Header from './components/Header';
import { ActiveTab, MediaContent, MediaType } from './types';
import { serieService, seasonSerieService, episodeSerieService, EpisodeSerie } from './lib/firestore';
import { usePageTitle } from './lib/pageTitle';
import { initializeMovieViews } from './lib/firestore';

const getTitleFromPath = (path: string, t: (key: string) => string): string => {
    if (path === '/home') return t('home');
    if (path === '/movies') return t('categoryMovies');
    if (path === '/series') return t('categorySeries');
    if (path === '/podcasts') return t('categoryPodcasts');
    if (path.startsWith('/movie/')) return t('movie');
    if (path.startsWith('/serie/')) return t('serie');
    if (path.startsWith('/podcast/')) return t('podcast');
    if (path === '/search') return t('search');
    if (path === '/profile') return t('profile');
    if (path === '/preferences') return t('preferences');
    if (path === '/editprofile') return t('editProfile');
    if (path === '/change-password') return t('changePassword');
    if (path === '/history') return t('history');
    if (path === '/bookmarks' || path === '/favorites') return t('favorites');
    return '';
};

const AppContent: React.FC = () => {
    const {
        isAuthenticated,
        t,
        loading,
        user,
        activeTab: contextActiveTab,
        setActiveTab: setContextActiveTab,
        isSidebarCollapsed: contextIsSidebarCollapsed,
        toggleSidebarCollapse: contextToggleSidebarCollapse
    } = useAppContext();
    const location = useLocation();
    const navigate = useNavigate();

    // Mettre à jour le titre de la page en fonction de la route actuelle
    usePageTitle();

    // Utiliser localStorage pour persister hasStarted
    const [hasStarted, setHasStarted] = useState(() => {
        const stored = localStorage.getItem('hasStarted');
        return stored === 'true';
    });

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [playingItem, setPlayingItem] = useState<{ media: MediaContent; episode?: EpisodeSerie } | null>(null);
    const [episodesCache, setEpisodesCache] = useState<{ serieId: string; episodes: EpisodeSerie[] } | null>(null);


    const toggleSidebarCollapse = () => {
        contextToggleSidebarCollapse();
    };

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
        setContextActiveTab(ActiveTab.Home);
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

    // Afficher un indicateur de chargement pendant la vérification de l'authentification
    // mais garder la sidebar fonctionnelle
    if (loading) {
        return (
            <div className="min-h-screen bg-[#FBF9F3] dark:bg-black">
                {/* Sidebar toujours accessible */}
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    activeTab={contextActiveTab}
                    setActiveTab={setContextActiveTab}
                    isCollapsed={contextIsSidebarCollapsed}
                    toggleCollapse={contextToggleSidebarCollapse}
                />

                {/* Header avec bouton de menu fonctionnel */}
                <Header
                    title=""
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    isWatchRoute={false}
                />

                {/* Contenu de chargement */}
                <div className={`${contextIsSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'} pt-16`}>
                    <div className="flex items-center justify-center h-screen">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
                    </div>
                </div>
            </div>
        );
    }

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

    // Toujours permettre l'ouverture/fermeture de la sidebar, même pendant le chargement
    const handleToggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

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
                activeTab={contextActiveTab}
                setActiveTab={setContextActiveTab}
                isCollapsed={contextIsSidebarCollapsed}
                toggleCollapse={contextToggleSidebarCollapse}
            />

            {/* Ne pas afficher le header sur les pages de lecture vidéo */}
            {!isWatchRoute && (
                <Header
                    title={location.pathname === '/home' ? t('home') :
                        getTitleFromPath(location.pathname, t)}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={handleToggleSidebar}
                    isWatchRoute={location.pathname.startsWith('/watch/')}
                />
            )}

            <div className={`page-transition fadeIn min-h-screen ${showBottomNav ? 'pb-20' : ''} ${!isWatchRoute ? 'pt-16 md:pt-16' : 'pt-0'} transition-all duration-300 ease-in-out ${contextIsSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
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
                                <div className="flex-1 flex flex-col">
                                    <ProfileScreen
                                        navigate={handleNavigateToScreen}
                                        onSelectMedia={handleSelectMedia}
                                        onPlay={handlePlay}
                                    />
                                </div>
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

                            <Route path="/redeem-voucher" element={
                                <RedeemVoucherScreen />
                            } />

                            <Route path="/manage-subscription" element={
                                <ManageSubscriptionScreen />
                            } />

                            <Route path="/manage-info-bar" element={
                                <ManageInfoBarScreen />
                            } />

                            <Route path="/manage-ads" element={
                                <ManageAdsScreen />
                            } />

                            <Route path="/payment-success" element={
                                <PaymentSuccessScreen />
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
                <div className="fixed bottom-0 left-0 right-0 z-20 lg:hidden">
                    <BottomNav />
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

// Dans App.tsx, ajoutez cette ligne temporairement
if (typeof window !== 'undefined') {
    (window as any).initializeMovieViews = initializeMovieViews;
}

export default App;