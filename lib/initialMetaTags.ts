// lib/initialMetaTags.ts
import { updateMetaTags, MetaTagsData } from './metaTags';

/**
 * Analyse l'URL et met à jour les meta tags initiaux
 * Exécuté dès le chargement de la page pour les crawlers
 */
export const initializeMetaTagsFromURL = () => {
    const url = new URL(window.location.href);
    const path = url.pathname;
    const searchParams = url.searchParams;

    // Patterns pour détecter les types de contenu
    const episodePattern = /\/episode\/([^\/]+)/;
    const moviePattern = /\/movie\/([^\/]+)/;
    const seriesPattern = /\/series\/([^\/]+)/;
    const mediaPattern = /\/media\/([^\/]+)/;

    let metaTags: MetaTagsData = {
        title: 'CMFI Replay',
        description: 'Découvrez les meilleurs contenus chrétiens sur CMFI Replay',
        url: window.location.href,
        type: 'website'
    };

    // Détecter le type de contenu depuis l'URL
    if (episodePattern.test(path)) {
        const episodeId = path.match(episodePattern)?.[1];
        metaTags = {
            title: `Épisode - CMFI Replay`,
            description: `Regardez cet épisode sur CMFI Replay`,
            url: window.location.href,
            type: 'video.episode'
        };
    } else if (moviePattern.test(path)) {
        const movieId = path.match(moviePattern)?.[1];
        metaTags = {
            title: `Film - CMFI Replay`,
            description: `Découvrez ce film sur CMFI Replay`,
            url: window.location.href,
            type: 'video.movie'
        };
    } else if (seriesPattern.test(path)) {
        const seriesId = path.match(seriesPattern)?.[1];
        metaTags = {
            title: `Série - CMFI Replay`,
            description: `Découvrez cette série sur CMFI Replay`,
            url: window.location.href,
            type: 'video.tv_show'
        };
    } else if (mediaPattern.test(path)) {
        const mediaId = path.match(mediaPattern)?.[1];
        metaTags = {
            title: `Média - CMFI Replay`,
            description: `Découvrez ce contenu sur CMFI Replay`,
            url: window.location.href,
            type: 'website'
        };
    }

    // Mettre à jour les meta tags immédiatement
    updateMetaTags(metaTags);
};

/**
 * Fonction pour mettre à jour les meta tags avec les données réelles du contenu
 * Appelée quand les données sont chargées depuis Firestore/API
 */
export const updateMetaTagsWithContent = (data: {
    title: string;
    description?: string;
    image?: string;
    type: 'movie' | 'episode' | 'series' | 'podcast';
}) => {
    const typeMap = {
        movie: 'video.movie' as const,
        episode: 'video.episode' as const,
        series: 'video.tv_show' as const,
        podcast: 'video.tv_show' as const
    };
    
    const ogType = typeMap[data.type];

    updateMetaTags({
        title: data.title,
        description: data.description || `Découvrez "${data.title}" sur CMFI Replay`,
        image: data.image,
        url: window.location.href,
        type: ogType
    });
};
