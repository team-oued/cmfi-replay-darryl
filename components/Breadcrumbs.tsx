import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

interface BreadcrumbItem {
    label: string;
    path: string;
}

const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const { t } = useAppContext();

    const getBreadcrumbs = (): BreadcrumbItem[] => {
        const pathnames = location.pathname.split('/').filter(x => x);
        const breadcrumbs: BreadcrumbItem[] = [{ label: t('home') || 'Accueil', path: '/home' }];

        // Si on est sur la page d'accueil, ne pas afficher les breadcrumbs
        if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'home')) {
            return [];
        }

        pathnames.forEach((value, index) => {
            const path = `/${pathnames.slice(0, index + 1).join('/')}`;

            // Mapper les routes aux labels
            let label = value;
            switch (value) {
                case 'home':
                    return; // Déjà ajouté
                case 'search':
                    label = t('search') || 'Recherche';
                    break;
                case 'profile':
                    label = t('profile') || 'Profil';
                    break;
                case 'movies':
                    label = 'Films';
                    break;
                case 'series':
                    label = 'Séries';
                    break;
                case 'podcasts':
                    label = 'Podcasts';
                    break;
                case 'favorites':
                    label = 'Favoris';
                    break;
                case 'preferences':
                    label = t('preferences') || 'Préférences';
                    break;
                case 'editprofile':
                    label = 'Modifier le profil';
                    break;
                case 'watch':
                    label = 'Lecture';
                    break;
                case 'movie':
                case 'serie':
                case 'podcast':
                    // Pour les détails, on affiche le type
                    label = value === 'movie' ? 'Film' :
                        value === 'serie' ? 'Série' :
                            'Podcast';
                    break;
                default:
                    // Pour les UIDs, on affiche "Détails"
                    if (index > 0) {
                        label = 'Détails';
                    }
            }

            breadcrumbs.push({ label, path });
        });

        return breadcrumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    // Ne pas afficher si on est sur la page d'accueil ou les pages d'auth
    if (breadcrumbs.length === 0 ||
        location.pathname === '/login' ||
        location.pathname === '/register' ||
        location.pathname === '/forgot-password' ||
        location.pathname === '/get-started') {
        return null;
    }

    return (
        <nav className="px-4 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
                {breadcrumbs.map((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    return (
                        <li key={crumb.path} className="flex items-center">
                            {index > 0 && (
                                <svg
                                    className="w-4 h-4 mx-2 text-gray-400 dark:text-gray-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                            {isLast ? (
                                <span className="font-medium text-amber-600 dark:text-amber-500">
                                    {crumb.label}
                                </span>
                            ) : (
                                <Link
                                    to={crumb.path}
                                    className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors duration-200"
                                >
                                    {crumb.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
