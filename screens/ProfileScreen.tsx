import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import UserAvatar from '../components/UserAvatar';
import MediaCard from '../components/MediaCard';
import { history } from '../data/mockData';
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
import { User, Screen, MediaContent } from '../types';
import { useAppContext } from '../context/AppContext';
import { userService, UserProfile, generateDefaultAvatar } from '../lib/firestore';

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

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigate, onSelectMedia, onPlay }) => {
    const { t, setIsAuthenticated, userProfile } = useAppContext();
    const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
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
                setOnlineUsers(formattedUsers);
            } catch (error) {
                console.error('Error fetching active users:', error);
            } finally {
                setLoadingUsers(false);
            }
        };

        fetchActiveUsers();
    }, []);

    const settingsItems = [
        { icon: BookmarkIcon, label: t('myFavorites'), action: () => navigate('Bookmarks') },
        { icon: SettingsIcon, label: t('preferences'), action: () => navigate('Preferences') },
        { icon: KeyIcon, label: t('changePassword') },
        { icon: CreditCardIcon, label: t('manageSubscription') },
        { icon: TicketIcon, label: t('redeemVoucher') },
    ];

    return (
        <div>
            <Header title={t('profileScreenTitle')} />

            <div className="flex flex-col items-center p-6 space-y-3 border-b border-gray-200 dark:border-gray-800">
                <img
                    src={userProfile?.photo_url || 'https://picsum.photos/seed/defaultuser/200/200'}
                    alt="Your avatar"
                    className="w-24 h-24 rounded-full border-4 border-amber-500 object-cover"
                />
                <h2 className="text-2xl font-bold">{userProfile?.display_name || 'User'}</h2>
                <button
                    onClick={() => navigate('EditProfile')}
                    className="bg-transparent border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold py-2 px-6 rounded-full transition-colors duration-200"
                >
                    {t('editProfile')}
                </button>
            </div>

            <section className="py-4">
                <h3 className="text-xl font-bold px-4 mb-3">{t('activeNow')}</h3>
                <div className="flex space-x-4 overflow-x-auto px-4 scrollbar-hide pb-2">
                    {onlineUsers.map((user: User) => (
                        <UserAvatar key={user.id} user={user} />
                    ))}
                </div>
            </section>

            <section className="py-4">
                <h3 className="text-xl font-bold px-4 mb-3">{t('history')}</h3>
                <div className="flex space-x-4 overflow-x-auto px-4 scrollbar-hide pb-2">
                    {history.map((item: MediaContent) => (
                        <MediaCard
                            key={item.id}
                            item={item}
                            variant="poster"
                            onSelect={onSelectMedia}
                            onPlay={onPlay}
                        />
                    ))}
                </div>
            </section>

            <section className="px-4 py-4">
                <h3 className="text-xl font-bold mb-3">{t('accountSettings')}</h3>
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden divide-y divide-gray-200 dark:divide-gray-800">
                    {settingsItems.map((item) => (
                        <SettingsItem key={item.label} Icon={item.icon} label={item.label} onClick={item.action} />
                    ))}
                </div>
                <div className="mt-4 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden divide-y divide-gray-200 dark:divide-gray-800">
                    <SettingsItem Icon={LogoutIcon} label={t('logout')} isDestructive onClick={() => setIsAuthenticated(false)} />
                    <SettingsItem Icon={TrashIcon} label={t('deleteAccount')} isDestructive />
                </div>
            </section>
        </div>
    );
};

export default ProfileScreen;