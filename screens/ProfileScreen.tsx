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
    TrashIcon,
    XMarkIcon
} from '../components/icons';
import { User, Screen, MediaContent } from '../types';
import { useAppContext } from '../context/AppContext';
import { userService, UserProfile, generateDefaultAvatar } from '../lib/firestore';
import { auth } from '../lib/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { toast } from 'react-toastify';

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

const ChangePasswordModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { t } = useAppContext();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error(t('passwordsDoNotMatch') || 'Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error(t('passwordTooShort') || 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        const user = auth.currentUser;

        if (user && user.email) {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            try {
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPassword);
                toast.success(t('passwordUpdated') || 'Password updated successfully');
                onClose();
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } catch (error: any) {
                console.error('Error updating password:', error);
                if (error.code === 'auth/wrong-password') {
                    toast.error(t('wrongPassword') || 'Incorrect current password');
                } else {
                    toast.error(t('errorUpdatingPassword') || 'Error updating password');
                }
            } finally {
                setLoading(false);
            }
        } else {
            toast.error(t('userNotAuthenticated') || 'User not authenticated');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('changePassword')}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('currentPassword') || 'Current Password'}
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('newPassword') || 'New Password'}
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('confirmNewPassword') || 'Confirm New Password'}
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            required
                        />
                    </div>
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (t('updating') || 'Updating...') : (t('updatePassword') || 'Update Password')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
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
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

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
        { icon: KeyIcon, label: t('changePassword'), action: () => setIsChangePasswordOpen(true) },
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
                </div>
            </section>

            <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />
        </div>
    );
};

export default ProfileScreen;