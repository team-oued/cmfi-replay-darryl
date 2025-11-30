import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

// Définition des clés de traduction valides pour les titres de page
type PageTitleKey = 'watch' | 'categoryMovies' | 'categorySeries' | 'categoryPodcasts' | 
                    'favorites' | 'profile' | 'preferences' | 'history' | 'movie' | 'serie' | 'podcast';

export const usePageTitle = () => {
  const location = useLocation();
  const { t } = useAppContext();

  // Fonction utilitaire pour obtenir une traduction en toute sécurité
  const safeT = (key: PageTitleKey): string => {
    try {
      return t(key) || '';
    } catch (e) {
      console.warn(`Translation key not found: ${key}`);
      return '';
    }
  };

  const getPageTitle = (pathname: string): string => {
    // Page d'accueil
    if (pathname === '/home') return 'CMFI Replay';
    
    // Pages de lecture
    if (pathname.startsWith('/watch/')) {
      return `${safeT('watch')} - CMFI Replay`;
    }
    
    // Pages de catégories
    if (pathname === '/movies') return `${safeT('categoryMovies')} - CMFI Replay`;
    if (pathname === '/series') return `${safeT('categorySeries')} - CMFI Replay`;
    if (pathname === '/podcasts') return `${safeT('categoryPodcasts')} - CMFI Replay`;
    
    // Autres pages
    if (pathname === '/bookmarks') return `${safeT('favorites')} - CMFI Replay`;
    if (pathname === '/profile') return `${safeT('profile')} - CMFI Replay`;
    if (pathname === '/preferences') return `${safeT('preferences')} - CMFI Replay`;
    if (pathname === '/history') return `${safeT('history')} - CMFI Replay`;
    
    // Pages de détails
    if (pathname.startsWith('/movie/')) return `${safeT('movie')} - CMFI Replay`;
    if (pathname.startsWith('/serie/')) return `${safeT('serie')} - CMFI Replay`;
    if (pathname.startsWith('/podcast/')) return `${safeT('podcast')} - CMFI Replay`;
    
    // Par défaut
    return 'CMFI Replay';
  };

  // Mettre à jour le titre de la page
  document.title = getPageTitle(location.pathname);

  // Retourner le titre pour une utilisation éventuelle dans les composants
  return getPageTitle(location.pathname);
};

export default usePageTitle;
