import React, { useEffect, useState } from 'react';
import { NavigationEntry, navigationTrackingService } from '../lib/firestore';
import { Timestamp } from 'firebase/firestore';

interface UserNavigationTimelineProps {
    userUid: string;
    height?: number;
}

// Icônes pour les différents types de pages
const getPageIcon = (pageName: string): string => {
    if (pageName.includes('Accueil') || pageName.includes('Home')) return '🏠';
    if (pageName.includes('Film')) return '🎬';
    if (pageName.includes('Série')) return '📺';
    if (pageName.includes('Podcast')) return '🎙️';
    if (pageName.includes('Lecture') || pageName.includes('Watch')) return '▶️';
    if (pageName.includes('Profil')) return '👤';
    if (pageName.includes('Recherche') || pageName.includes('Search')) return '🔍';
    if (pageName.includes('Favoris') || pageName.includes('Bookmark')) return '⭐';
    if (pageName.includes('Historique')) return '📜';
    if (pageName.includes('Gestion') || pageName.includes('Admin')) return '⚙️';
    if (pageName.includes('Notification')) return '🔔';
    if (pageName.includes('Authentification') || pageName.includes('Login')) return '🔐';
    return '📄';
};

const UserNavigationTimeline: React.FC<UserNavigationTimelineProps> = ({ userUid, height = 400 }) => {
    const [navigations, setNavigations] = useState<NavigationEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadNavigations = async () => {
            setLoading(true);
            try {
                const history = await navigationTrackingService.getUserNavigationHistory(userUid);
                // Trier par timestamp décroissant (plus récent en premier)
                // L'historique contient déjà les 2 dernières pages, on les trie juste
                setNavigations(history.sort((a, b) => {
                    const aTime = a.timestamp instanceof Date 
                        ? a.timestamp.getTime() 
                        : a.timestamp instanceof Timestamp 
                            ? a.timestamp.toMillis() 
                            : new Date(a.timestamp).getTime();
                    const bTime = b.timestamp instanceof Date 
                        ? b.timestamp.getTime() 
                        : b.timestamp instanceof Timestamp 
                            ? b.timestamp.toMillis() 
                            : new Date(b.timestamp).getTime();
                    return bTime - aTime; // Décroissant
                }));
            } catch (error) {
                console.error('Error loading navigation history:', error);
            } finally {
                setLoading(false);
            }
        };

        loadNavigations();
    }, [userUid]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    if (navigations.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-lg mb-2">📭</p>
                <p>Aucune navigation enregistrée</p>
            </div>
        );
    }

    // Fonction pour calculer le temps entre deux navigations
    const getTimeDifference = (current: Date | Timestamp, previous?: Date | Timestamp): string => {
        if (!previous) return '';
        
        const getTimestamp = (ts: Date | Timestamp): number => {
            if (ts instanceof Date) return ts.getTime();
            if (ts instanceof Timestamp) return ts.toMillis();
            return new Date(ts).getTime();
        };
        
        const diff = getTimestamp(current) - getTimestamp(previous);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        
        if (minutes < 1) return `${seconds}s`;
        if (minutes < 60) return `${minutes}min`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ${minutes % 60}min`;
    };

    return (
        <div className="w-full">
            {/* En-tête avec statistiques */}
            <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            📊 Parcours de navigation
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {navigations.length} dernière{navigations.length > 1 ? 's' : ''} page{navigations.length > 1 ? 's' : ''} visitée{navigations.length > 1 ? 's' : ''} (en ligne) - Maximum 5
                        </p>
                    </div>
                </div>
            </div>

            {/* Timeline verticale moderne */}
            <div className="relative">
                {/* Ligne verticale centrale */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600"></div>

                {/* Liste des navigations */}
                <div className="space-y-4">
                    {navigations.map((nav, index) => {
                        const timestamp = nav.timestamp instanceof Date 
                            ? nav.timestamp 
                            : nav.timestamp instanceof Timestamp
                                ? nav.timestamp.toDate()
                                : new Date(nav.timestamp);
                        
                        const previousNav = index < navigations.length - 1 ? navigations[index + 1] : undefined;
                        const timeDiff = previousNav ? getTimeDifference(nav.timestamp, previousNav.timestamp) : '';
                        
                        const pageIcon = getPageIcon(nav.page_name);

                        return (
                            <div key={index} className="relative flex items-start gap-4 group">
                                {/* Point sur la ligne */}
                                <div className="relative z-10 flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-lg border-2 bg-amber-500 border-amber-600">
                                        {pageIcon}
                                    </div>
                                    <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75"></div>
                                </div>

                                {/* Contenu de la carte */}
                                <div className="flex-1 min-w-0 rounded-lg p-4 transition-all duration-200 group-hover:shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                                                    {nav.page_name}
                                                </h4>
                                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                    En ligne
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                <div className="flex items-center gap-1.5">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>
                                                        {timestamp.toLocaleString('fr-FR', { 
                                                            day: '2-digit', 
                                                            month: 'short', 
                                                            hour: '2-digit', 
                                                            minute: '2-digit',
                                                            second: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                
                                                {timeDiff && (
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                        </svg>
                                                        <span className="text-gray-500 dark:text-gray-500">
                                                            {timeDiff} après
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 font-mono">
                                                {nav.page_path}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Résumé en bas */}
            {navigations.length > 1 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>
                            Première visite: {
                                navigations[navigations.length - 1].timestamp instanceof Date 
                                    ? navigations[navigations.length - 1].timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                    : navigations[navigations.length - 1].timestamp instanceof Timestamp
                                        ? navigations[navigations.length - 1].timestamp.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                        : new Date(navigations[navigations.length - 1].timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                            }
                        </span>
                        <span>
                            Dernière visite: {
                                navigations[0].timestamp instanceof Date 
                                    ? navigations[0].timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                    : navigations[0].timestamp instanceof Timestamp
                                        ? navigations[0].timestamp.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                        : new Date(navigations[0].timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                            }
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserNavigationTimeline;
