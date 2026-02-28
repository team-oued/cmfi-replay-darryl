/**
 * Service pour gérer les métadonnées OpenGraph dynamiques
 * Utilisé pour améliorer le partage sur les réseaux sociaux avec miniatures
 */

export interface OpenGraphMetadata {
  title: string;
  description: string;
  image?: string;
  url: string;
  type?: 'website' | 'video.episode' | 'video.movie';
  video?: {
    duration?: string;
    release_date?: string;
    director?: string;
    actor?: string[];
  };
}

class OpenGraphService {
  /**
   * Met à jour les métadonnées OpenGraph dans le head du document
   */
  updateMetadata(metadata: OpenGraphMetadata): void {
    // Mettre à jour le titre de la page
    document.title = metadata.title;

    // Mettre à jour ou créer les métadonnées OpenGraph
    this.updateMetaTag('og:title', metadata.title);
    this.updateMetaTag('og:description', metadata.description);
    this.updateMetaTag('og:url', metadata.url);
    this.updateMetaTag('og:type', metadata.type || 'website');
    
    // Ajouter l'image si disponible
    if (metadata.image) {
      this.updateMetaTag('og:image', metadata.image);
      this.updateMetaTag('og:image:alt', `${metadata.title} - ${metadata.description}`);
      
      // Dimensions de l'image (recommandées pour Facebook)
      this.updateMetaTag('og:image:width', '1200');
      this.updateMetaTag('og:image:height', '630');
    }

    // Métadonnées Twitter Card
    this.updateMetaTag('twitter:card', 'summary_large_image');
    this.updateMetaTag('twitter:title', metadata.title);
    this.updateMetaTag('twitter:description', metadata.description);
    if (metadata.image) {
      this.updateMetaTag('twitter:image', metadata.image);
    }

    // Métadonnées spécifiques aux vidéos
    if (metadata.type?.startsWith('video.') && metadata.video) {
      if (metadata.video.duration) {
        this.updateMetaTag('og:video:duration', metadata.video.duration);
      }
      if (metadata.video.release_date) {
        this.updateMetaTag('og:video:release_date', metadata.video.release_date);
      }
      if (metadata.video.director) {
        this.updateMetaTag('og:video:director', metadata.video.director);
      }
      if (metadata.video.actor && metadata.video.actor.length > 0) {
        metadata.video.actor.forEach((actor, index) => {
          this.updateMetaTag(`og:video:actor:${index + 1}`, actor);
        });
      }
    }

    // Métadonnées générales
    this.updateMetaTag('description', metadata.description);
    this.updateMetaTag('keywords', 'CMFI Replay, vidéo, streaming, série, film, podcast');
  }

  /**
   * Met à jour ou crée une meta tag
   */
  private updateMetaTag(property: string, content: string): void {
    let metaTag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement ||
                  document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement;

    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute(property.includes(':') ? 'property' : 'name', property);
      document.head.appendChild(metaTag);
    }

    metaTag.setAttribute('content', content);
  }

  /**
   * Réinitialise les métadonnées OpenGraph aux valeurs par défaut
   */
  resetMetadata(): void {
    document.title = 'CMFI Replay';
    
    const defaultMeta = {
      'og:title': 'CMFI Replay',
      'og:description': 'Découvrez les meilleures vidéos, séries, films et podcasts sur CMFI Replay',
      'og:url': window.location.origin,
      'og:type': 'website',
      'og:image': '/cmfireplay.svg',
      'twitter:card': 'summary_large_image',
      'twitter:title': 'CMFI Replay',
      'twitter:description': 'Découvrez les meilleures vidéos, séries, films et podcasts sur CMFI Replay',
      'twitter:image': '/cmfireplay.svg',
      'description': 'Découvrez les meilleures vidéos, séries, films et podcasts sur CMFI Replay',
      'keywords': 'CMFI Replay, vidéo, streaming, série, film, podcast'
    };

    Object.entries(defaultMeta).forEach(([property, content]) => {
      this.updateMetaTag(property, content);
    });
  }

  /**
   * Crée les métadonnées pour un épisode de série
   */
  createEpisodeMetadata(episode: {
    title: string;
    overview?: string;
    picture_path?: string;
    backdrop_path?: string;
    runtime?: number;
    episode_numero?: number;
    original_title?: string;
  }): OpenGraphMetadata {
    const thumbnailUrl = episode.picture_path || episode.backdrop_path;
    const description = episode.overview || episode.original_title || `Épisode ${episode.episode_numero}`;
    
    return {
      title: episode.title,
      description: description,
      image: thumbnailUrl,
      url: window.location.href,
      type: 'video.episode',
      video: {
        duration: episode.runtime ? episode.runtime.toString() : undefined,
      }
    };
  }

  /**
   * Crée les métadonnées pour un film
   */
  createMovieMetadata(movie: {
    title: string;
    overview?: string;
    poster_path?: string;
    backdrop_path?: string;
    runtime?: number;
  }): OpenGraphMetadata {
    const thumbnailUrl = movie.backdrop_path || movie.poster_path;
    const description = movie.overview || movie.title;
    
    return {
      title: movie.title,
      description: description,
      image: thumbnailUrl,
      url: window.location.href,
      type: 'video.movie',
      video: {
        duration: movie.runtime ? movie.runtime.toString() : undefined,
      }
    };
  }
}

export const openGraphService = new OpenGraphService();
export default openGraphService;
