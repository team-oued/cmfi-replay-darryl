import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, userService } from '../lib/firestore';
import { useAppContext } from '../context/AppContext';
import { ArrowLeftIcon, SearchIcon } from '../components/icons';
import { Timestamp } from 'firebase/firestore';

const ManageUsersScreen: React.FC = () => {
    const navigate = useNavigate();
    const { t, userProfile } = useAppContext();
    const [users, setUsers] = useState<(UserProfile & { lastSeen?: Date | Timestamp })[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // S'abonner aux mises à jour en temps réel des utilisateurs (incluant les inactifs)
        const unsubscribe = userService.subscribeToOnlineUsers((usersList) => {
            // Debug: afficher les valeurs de lastSeen
            console.log('🔍 Users received with lastSeen:', usersList.map(u => ({
                name: u.display_name,
                presence: u.presence,
                lastSeen: u.lastSeen,
                lastSeenType: u.lastSeen ? typeof u.lastSeen : 'undefined',
                lastSeenValue: u.lastSeen instanceof Date ? u.lastSeen.toISOString() : 
                              u.lastSeen ? String(u.lastSeen) : 'undefined'
            })));
            setUsers(usersList);
            setLoading(false);
        }, true); // includeInactive = true pour voir aussi les offline récents

        return () => unsubscribe();
    }, []);

    const formatLastSeen = (lastSeen?: Date | Timestamp, updatedAt?: Date | Timestamp): string => {
        // Utiliser updatedAt comme fallback si lastSeen n'existe pas
        const dateToUse = lastSeen || updatedAt;
        
        // Debug: afficher la valeur brute
        console.log('📅 formatLastSeen called with:', {
            lastSeen,
            updatedAt,
            dateToUse,
            type: dateToUse ? typeof dateToUse : 'undefined',
            isDate: dateToUse instanceof Date,
            isTimestamp: dateToUse instanceof Timestamp,
            value: dateToUse instanceof Date ? dateToUse.toISOString() : 
                   dateToUse instanceof Timestamp ? dateToUse.toDate().toISOString() :
                   dateToUse ? String(dateToUse) : 'undefined'
        });
        
        if (!dateToUse) {
            console.warn('⚠️ lastSeen and updatedAt are both undefined or null');
            return 'Jamais';
        }
        
        let date: Date;
        try {
            if (dateToUse instanceof Timestamp) {
                date = dateToUse.toDate();
            } else if (dateToUse instanceof Date) {
                date = dateToUse;
            } else {
                console.warn('⚠️ dateToUse is not Date or Timestamp:', typeof dateToUse, dateToUse);
                return 'Jamais';
            }

            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            
            // Vérifier si la date est valide
            if (isNaN(date.getTime())) {
                console.warn('⚠️ Invalid date:', date);
                return 'Jamais';
            }
            
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMins < 1) return 'À l\'instant';
            if (diffMins < 60) return `Il y a ${diffMins} min`;
            if (diffHours < 24) return `Il y a ${diffHours}h`;
            if (diffDays < 7) return `Il y a ${diffDays}j`;
            
            // Format complet pour les dates plus anciennes
            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('❌ Error formatting lastSeen:', error, dateToUse);
            return 'Erreur';
        }
    };

    const getStatusLabel = (presence: string): string => {
        switch (presence) {
            case 'online': return 'En ligne';
            case 'away': return 'Inactif';
            case 'idle': return 'Inactif';
            case 'offline': return 'Hors ligne';
            default: return 'Inconnu';
        }
    };

    const getStatusColor = (presence: string): string => {
        switch (presence) {
            case 'online': return 'bg-green-500';
            case 'away': return 'bg-yellow-500';
            case 'idle': return 'bg-yellow-500';
            case 'offline': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };

    // Filtrer les utilisateurs par terme de recherche
    const filteredUsers = users.filter(user => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase().trim();
        const displayName = (user.display_name || '').toLowerCase();
        return displayName.includes(query);
    });

    // Fonction helper pour obtenir le timestamp de lastSeen en millisecondes
    const getLastSeenTimestamp = (user: UserProfile & { lastSeen?: Date | Timestamp; updatedAt?: Date | Timestamp }): number => {
        const dateToUse = user.lastSeen || user.updatedAt;
        if (!dateToUse) return 0;
        
        if (dateToUse instanceof Date) {
            return dateToUse.getTime();
        } else if (dateToUse instanceof Timestamp) {
            return dateToUse.toMillis();
        }
        return 0;
    };

    // Séparer les utilisateurs filtrés par statut et trier par lastSeen (plus récent en premier)
    const onlineUsers = filteredUsers
        .filter(u => u.presence === 'online')
        .sort((a, b) => {
            const aTime = getLastSeenTimestamp(a);
            const bTime = getLastSeenTimestamp(b);
            // Plus récent en premier (ordre décroissant)
            return bTime - aTime;
        });
    
    const awayUsers = filteredUsers
        .filter(u => u.presence === 'away' || u.presence === 'idle')
        .sort((a, b) => {
            const aTime = getLastSeenTimestamp(a);
            const bTime = getLastSeenTimestamp(b);
            // Plus récent en premier (ordre décroissant)
            return bTime - aTime;
        });
    
    const offlineUsers = filteredUsers
        .filter(u => u.presence === 'offline')
        .sort((a, b) => {
            const aTime = getLastSeenTimestamp(a);
            const bTime = getLastSeenTimestamp(b);
            // Plus récent en premier (ordre décroissant) - ceux qui étaient récemment inactifs apparaissent en premier
            return bTime - aTime;
        });

    return (
        <div className="min-h-screen bg-[#FBF9F3] dark:bg-black">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-4 px-4 py-4">
                    <button
                        onClick={() => navigate('/profile')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeftIcon className="w-6 h-6 text-gray-900 dark:text-white" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Gestion des utilisateurs
                    </h1>
                </div>
            </div>

            <div className="px-4 md:px-6 lg:px-8 py-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Barre de recherche */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Rechercher un utilisateur par nom..."
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <span className="text-xl">×</span>
                                    </button>
                                )}
                            </div>
                            {searchQuery && (
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
                                </p>
                            )}
                        </div>

                        {/* Statistiques */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="text-sm text-gray-500 dark:text-gray-400">En ligne</div>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{onlineUsers.length}</div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="text-sm text-gray-500 dark:text-gray-400">Inactifs</div>
                                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{awayUsers.length}</div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="text-sm text-gray-500 dark:text-gray-400">Hors ligne</div>
                                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{offlineUsers.length}</div>
                            </div>
                        </div>

                        {/* Liste des utilisateurs en ligne */}
                        {onlineUsers.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                                    En ligne ({onlineUsers.length})
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {onlineUsers.map((user) => (
                                        <UserCard key={user.uid} user={user} formatLastSeen={formatLastSeen} getStatusLabel={getStatusLabel} getStatusColor={getStatusColor} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Liste des utilisateurs inactifs */}
                        {awayUsers.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                                    Inactifs ({awayUsers.length})
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {awayUsers.map((user) => (
                                        <UserCard key={user.uid} user={user} formatLastSeen={formatLastSeen} getStatusLabel={getStatusLabel} getStatusColor={getStatusColor} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Liste des utilisateurs hors ligne */}
                        {offlineUsers.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                                    Hors ligne ({offlineUsers.length})
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {offlineUsers.map((user) => (
                                        <UserCard key={user.uid} user={user} formatLastSeen={formatLastSeen} getStatusLabel={getStatusLabel} getStatusColor={getStatusColor} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {filteredUsers.length === 0 && searchQuery && (
                            <div className="text-center py-10">
                                <p className="text-gray-500 dark:text-gray-400">
                                    Aucun utilisateur trouvé pour "{searchQuery}"
                                </p>
                            </div>
                        )}
                        {users.length === 0 && !searchQuery && (
                            <div className="text-center py-10">
                                <p className="text-gray-500 dark:text-gray-400">Aucun utilisateur trouvé</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

interface UserCardProps {
    user: UserProfile & { lastSeen?: Date | Timestamp; updatedAt?: Date | Timestamp };
    formatLastSeen: (lastSeen?: Date | Timestamp, updatedAt?: Date | Timestamp) => string;
    getStatusLabel: (presence: string) => string;
    getStatusColor: (presence: string) => string;
}

const UserCard: React.FC<UserCardProps> = ({ user, formatLastSeen, getStatusLabel, getStatusColor }) => {
    return (
        <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 overflow-hidden flex items-center justify-center">
                    {user.photo_url ? (
                        <img 
                            src={user.photo_url}
                            alt={user.display_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '';
                                target.style.display = 'none';
                            }}
                        />
                    ) : null}
                    {(!user.photo_url || user.photo_url === '') && (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-lg font-medium">
                            {user.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                    )}
                </div>
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(user.presence)}`}></span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-gray-900 dark:text-white font-medium truncate">{user.display_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getStatusLabel(user.presence)}
                </p>
                {/* Afficher la dernière activité pour tous les utilisateurs */}
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    <p>Dernière activité: {formatLastSeen(user.lastSeen, user.updatedAt)}</p>
                    {/* Debug: afficher la valeur brute pour tous les utilisateurs */}
                    <p className="text-[10px] opacity-50 mt-0.5 break-all">
                        Debug lastSeen: {user.lastSeen ? 
                            (user.lastSeen instanceof Date ? user.lastSeen.toISOString() : 
                             user.lastSeen instanceof Timestamp ? user.lastSeen.toDate().toISOString() :
                             String(user.lastSeen)) : 
                            'undefined'} | updatedAt: {user.updatedAt ? 
                            (user.updatedAt instanceof Date ? user.updatedAt.toISOString() : 
                             user.updatedAt instanceof Timestamp ? user.updatedAt.toDate().toISOString() :
                             String(user.updatedAt)) : 
                            'undefined'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ManageUsersScreen;

