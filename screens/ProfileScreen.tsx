import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import UserAvatar from '../components/UserAvatar';
import HistorySection from '../components/HistorySection';
import ViewModeSelector from '../components/ViewModeSelector';
import { statsVuesService, ContinueWatchingItem, movieService, episodeSerieService } from '../lib/firestore';
import { MediaContent, MediaType, User, Screen } from '../types';
import {
    BookmarkIcon,
    ChevronRightIcon,
    CreditCardIcon,
    KeyIcon,
    TicketIcon,
    LogoutIcon,
    SettingsIcon,
    TrashIcon
} from '../components/icons';
import { useAppContext } from '../context/AppContext';
import { UserProfile } from '../lib/firestore';
import { appSettingsService } from '../lib/appSettingsService';
import PremiumBadge from '../components/PremiumBadge';
import { authService } from '../lib/authService';

const SettingsItem: React.FC<{
    Icon: React.FC<{ className?: string }>;
    label: string;
    isDestructive?: boolean;
    onClick?: () => void;
}> = ({ Icon, label, isDestructive = false, onClick }) => {
    const textColor = isDestructive ? 'text-red-500' : 'text-gray-900 dark:text-white';
    const iconColor = isDestructive ? 'text-red-500' : 'text-gray-400';

    return (
        <button onClick={onClick} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
            <div className="flex items-center space-x-4">
                <Icon className={`w-6 h-6 ${iconColor}`} />
                <span className={textColor}>{label}</span>
            </div>
            {!isDestructive && <ChevronRightIcon className="w-5 h-5 text-gray-400" />}
        </button>
    );
};

interface ProfileScreenProps {
    navigate: (screen: 'Bookmarks' | 'Preferences' | 'EditProfile') => void;
    onSelectMedia: (item: MediaContent) => void;
    onPlay: (item: MediaContent) => void;
}

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
    <div className="flex items-center">
        <button
            type="button"
            className={`${enabled ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'} 
                      relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer 
                      rounded-full border-2 border-transparent transition-colors 
                      duration-200 ease-in-out focus:outline-none`}
            onClick={() => onChange(!enabled)}
        >
            <span
                className={`${enabled ? 'translate-x-5' : 'translate-x-0'} 
                          pointer-events-none inline-block h-5 w-5 transform rounded-full 
                          bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    </div>
);

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigate, onSelectMedia, onPlay }) => {
    const { t, setIsAuthenticated, userProfile, user } = useAppContext();
    const [premiumForAll, setPremiumForAll] = useState(false);

    // Charger l'état de premiumForAll au montage du composant
    useEffect(() => {
        const loadPremiumForAll = async () => {
            if (userProfile?.isAdmin) {
                const isEnabled = await appSettingsService.isPremiumForAll();
                setPremiumForAll(isEnabled);
            }
        };
        loadPremiumForAll();
    }, [userProfile?.isAdmin]);

    const navigateRouter = useNavigate();
    const [historyItems, setHistoryItems] = useState<ContinueWatchingItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // Récupérer l'historique depuis Firebase
    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) {
                setLoadingHistory(false);
                return;
            }

            try {
                const items = await statsVuesService.getContinueWatching(user.uid, 10);
                setHistoryItems(items);
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchHistory();
    }, [user]);

    const handleHistoryItemClick = async (item: ContinueWatchingItem) => {
        if (item.type === 'movie') {
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
            const episodeUid = item.uid_episode || item.uid;
            const episode = await episodeSerieService.getEpisodeByUid(episodeUid);
            if (episode) {
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
                // On passe uniquement le mediaContent, pas l'épisode
                onPlay(mediaContent);
            }
        }
    };

    const handleViewAllHistory = () => {
        navigateRouter('/history');
    };

    const settingsItems = [
        { icon: BookmarkIcon, label: t('myFavorites'), action: () => navigate('Bookmarks') },
        { icon: SettingsIcon, label: t('preferences'), action: () => navigate('Preferences') },
        { icon: KeyIcon, label: t('changePassword'), action: () => navigateRouter('/change-password') },
        { icon: CreditCardIcon, label: t('manageSubscription'), action: () => navigateRouter('/manage-subscription') },
        {
            icon: TicketIcon,
            label: t('redeemVoucher'),
            action: () => navigateRouter('/redeem-voucher')
        },
    ];

    // Items admin
    const adminItems = userProfile?.isAdmin ? [
        {
            icon: SettingsIcon,
            label: 'Gérer les messages d\'information',
            action: () => navigateRouter('/manage-info-bar')
        },
        {
            icon: SettingsIcon,
            label: 'Gérer les publicités',
            action: () => navigateRouter('/manage-ads')
        },
    ] : [];

    const handleLogout = async () => {
        try {
            await authService.signOut();
            setIsAuthenticated(false);
            navigateRouter('/login');
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    };

    return (
        <div className="pt-4">
            <div className="flex flex-col items-center p-6 space-y-3 border-b border-gray-200 dark:border-gray-800">
                <img
                    src={userProfile?.photo_url || 'https://picsum.photos/seed/defaultuser/200/200'}
                    alt="Your avatar"
                    className="w-24 h-24 rounded-full border-4 border-amber-500 object-cover"
                />
                <h2 className="text-2xl font-bold">{userProfile?.display_name || 'User'}</h2>
                <PremiumBadge size="md" showDetails={true} />
                <button
                    onClick={() => navigate('EditProfile')}
                    className="bg-transparent border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold py-2 px-6 rounded-full transition-colors duration-200"
                >
                    {t('editProfile')}
                </button>
            </div>

            <HistorySection
                items={loadingHistory ? [] : historyItems}
                onItemClick={handleHistoryItemClick}
                title={t('continueWatching')}
                isLoading={loadingHistory}
            />

            <section className="px-4 py-4">
                <h3 className="text-xl font-bold mb-3">{t('accountSettings')}</h3>
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden divide-y divide-gray-200 dark:divide-gray-800">
                    {settingsItems.map((item) => (
                        <SettingsItem key={item.label} Icon={item.icon} label={item.label} onClick={item.action} />
                    ))}
                </div>
                {userProfile?.isAdmin && (
                    <div className="mt-4">
                        <h3 className="text-lg font-bold mb-3 text-amber-600 dark:text-amber-400">Administration</h3>
                        <div className="border border-amber-200 dark:border-amber-800 rounded-lg overflow-visible divide-y divide-amber-200 dark:divide-amber-800">
                            {/* Toggle pour l'accès premium pour tous */}
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center">
                                    <SettingsIcon className="w-6 h-6 text-gray-400 mr-4" />
                                    <span className="text-gray-900 dark:text-white">Accès premium pour tous</span>
                                </div>
                                <ToggleSwitch 
                                    enabled={premiumForAll} 
                                    onChange={async (enabled) => {
                                        const success = await appSettingsService.setPremiumForAll(enabled);
                                        if (success) {
                                            setPremiumForAll(enabled);
                                        }
                                    }} 
                                />
                            </div>
                            
                            {adminItems.map((item) => (
                                <SettingsItem key={item.label} Icon={item.icon} label={item.label} onClick={item.action} />
                            ))}
                            {/* Sélecteur de mode d'affichage pour les admins */}
                            <div className="relative overflow-visible">
                                <ViewModeSelector />
                            </div>
                        </div>
                    </div>
                )}
                <div className="mt-4 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden divide-y divide-gray-200 dark:divide-gray-800">
                    <SettingsItem 
                        Icon={LogoutIcon} 
                        label={t('logout')} 
                        isDestructive 
                        onClick={handleLogout} 
                    />
                </div>
            </section>

        </div>
    );
};

export default ProfileScreen;