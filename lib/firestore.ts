import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';

// Interfaces pour les collections
export interface UserProfile {
  uid: string;
  email: string;
  display_name: string;
  photo_url?: string;
  presence: 'online' | 'offline' | 'idle' | 'away';
  hasAcceptedPrivacyPolicy: boolean;
  created_time: string;
  theme: 'light' | 'dark';
  language: string;
  bookmarkedIds: string[];
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Interface pour la collection series
export interface Serie {
  id: string;
  uid_serie: string;
  title_serie: string;
  overview_serie: string;
  image_path: string;
  back_path: string;
  lang: string;
  premium_text: string;
  runtime_h_m: string;
  homedisplayed: boolean;
  is_hidden: boolean;
  serie_type?: 'serie' | 'podcast';
}

// Interface pour la collection seasonsSeries
export interface SeasonSerie {
  id: string;
  uid_season: string;
  uid_serie: string;
  title_season: string;
  title_serie: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  season_number: number;
  nb_episodes: number;
  year_season: number;
  premium_text: string;
}

// Interface pour la collection episodesSeries
export interface EpisodeSerie {
  id: string;
  TranscriptText: string;
  backdrop_path: string;
  embedUrl: string;
  episode_numero: number;
  hidden: boolean;
  original_title: string;
  overview: string;
  overviewFr: string;
  picture_path: string;
  runtime: number;
  runtime_h_m: string;
  search_keywords: string[];
  title: string;
  title_lowercase: string;
  title_serie: string;
  uid_episode: string;
  uid_season: string;
  video_path_hd: string;
  video_path_sd: string;
}

export interface Movie {
  uid: string;
  title: string;
  original_title: string;
  original_language: string;
  overview: string;
  backdrop_path: string;
  picture_path: string;
  poster_path: string;
  embedUrl: string;
  video_path_hd: string;
  video_path_sd: string;
  hidden: boolean;
  homedisplayed: boolean;
  is_premium: boolean;
  premium_text: string;
  runtime: string;
  runtime_h_m: string;
  popular: boolean;
  trending: boolean;
}

export interface UserBookmark {
  id: string;
  userId: string;
  movieId: string;
  createdAt: Date | Timestamp;
}

// Constantes pour les collections
const USERS_COLLECTION = 'users';
const MOVIES_COLLECTION = 'movies';
const SERIES_COLLECTION = 'series';
const SEASONS_SERIES_COLLECTION = 'seasonsSeries';
const EPISODES_SERIES_COLLECTION = 'episodesSeries';
const BOOKMARKS_COLLECTION = 'bookmarks';

// Fonction utilitaire pour générer un avatar par défaut
export const generateDefaultAvatar = (name?: string): string => {
  const displayName = name || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  return `https://ui-avatars.com/api/?name=${initial}&background=random&color=fff&size=128`;
};

// Services pour les utilisateurs
export const userService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  async createUserProfile(userData: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const userProfile: UserProfile = {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await setDoc(doc(db, USERS_COLLECTION, userData.uid), userProfile);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      });
      
      // Récupérer le document mis à jour pour le retourner
      const updatedDoc = await getDoc(userRef);
      return updatedDoc.data() as UserProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  async toggleBookmark(uid: string, movieId: string): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const userData = userDoc.data() as UserProfile;
      const bookmarkedIds = userData.bookmarkedIds || [];
      
      if (bookmarkedIds.includes(movieId)) {
        await updateDoc(userRef, {
          bookmarkedIds: arrayRemove(movieId),
          updatedAt: new Date()
        });
      } else {
        await updateDoc(userRef, {
          bookmarkedIds: arrayUnion(movieId),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      throw error;
    }
  },

  async getUserBookmarks(uid: string): Promise<string[]> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        return userData.bookmarkedIds || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting user bookmarks:', error);
      return [];
    }
  },

  async getActiveUsers(limitCount: number = 50): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, USERS_COLLECTION),
        where('presence', 'in', ['online', 'idle']),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
    }
  },

  async getAllUsers(limitCount: number = 100): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, USERS_COLLECTION),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }
};

// Services pour les films
export const movieService = {
  async getAllMovies(): Promise<Movie[]> {
    try {
      const moviesSnapshot = await getDocs(collection(db, MOVIES_COLLECTION));
      return moviesSnapshot.docs.map(doc => doc.data() as Movie);
    } catch (error) {
      console.error('Error getting all movies:', error);
      return [];
    }
  },

  async getMovieById(uid: string): Promise<Movie | null> {
    try {
      const movieDoc = await getDoc(doc(db, MOVIES_COLLECTION, uid));
      if (movieDoc.exists()) {
        return movieDoc.data() as Movie;
      }
      return null;
    } catch (error) {
      console.error('Error getting movie by ID:', error);
      return null;
    }
  },

  async getPopularMovies(limitCount: number = 10): Promise<Movie[]> {
    try {
      const q = query(
        collection(db, MOVIES_COLLECTION),
        where('popular', '==', true),
        where('hidden', '==', false),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Movie);
    } catch (error) {
      console.error('Error getting popular movies:', error);
      return [];
    }
  },

  async getTrendingMovies(limitCount: number = 10): Promise<Movie[]> {
    try {
      const q = query(
        collection(db, MOVIES_COLLECTION),
        where('trending', '==', true),
        where('hidden', '==', false),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Movie);
    } catch (error) {
      console.error('Error getting trending movies:', error);
      return [];
    }
  },

  async getHomeDisplayMovies(): Promise<Movie[]> {
    try {
      const q = query(
        collection(db, MOVIES_COLLECTION),
        where('homedisplayed', '==', true),
        where('hidden', '==', false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Movie);
    } catch (error) {
      console.error('Error getting home display movies:', error);
      return [];
    }
  },

  async searchMovies(searchTerm: string): Promise<Movie[]> {
    try {
      const moviesSnapshot = await getDocs(collection(db, MOVIES_COLLECTION));
      const allMovies = moviesSnapshot.docs.map(doc => doc.data() as Movie);
      
      return allMovies.filter(movie => 
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.original_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.overview.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching movies:', error);
      return [];
    }
  },

  async getBookmarkedMovies(movieIds: string[]): Promise<Movie[]> {
    try {
      if (movieIds.length === 0) return [];
      
      const movies: Movie[] = [];
      for (const id of movieIds) {
        const movie = await this.getMovieById(id);
        if (movie && !movie.hidden) {
          movies.push(movie);
        }
      }
      return movies;
    } catch (error) {
      console.error('Error getting bookmarked movies:', error);
      return [];
    }
  }
};

// Services pour les séries
export const serieService = {
  async getAllSeries(): Promise<Serie[]> {
    try {
      const seriesSnapshot = await getDocs(collection(db, SERIES_COLLECTION));
      return seriesSnapshot.docs.map(doc => doc.data() as Serie);
    } catch (error) {
      console.error('Error getting all series:', error);
      return [];
    }
  },

  async getSerieById(id: string): Promise<Serie | null> {
    try {
      const serieDoc = await getDoc(doc(db, SERIES_COLLECTION, id));
      if (serieDoc.exists()) {
        return serieDoc.data() as Serie;
      }
      return null;
    } catch (error) {
      console.error('Error getting serie by ID:', error);
      return null;
    }
  },

  async getHomeDisplaySeries(): Promise<Serie[]> {
    try {
      const q = query(
        collection(db, SERIES_COLLECTION),
        where('homedisplayed', '==', true),
        where('is_hidden', '==', false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Serie);
    } catch (error) {
      console.error('Error getting home display series:', error);
      return [];
    }
  },

  async getSeriesByLanguage(lang: string): Promise<Serie[]> {
    try {
      const q = query(
        collection(db, SERIES_COLLECTION),
        where('lang', 'array-contains', lang),
        where('is_hidden', '==', false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Serie);
    } catch (error) {
      console.error('Error getting series by language:', error);
      return [];
    }
  },

  async getPremiumSeries(): Promise<Serie[]> {
    try {
      const q = query(
        collection(db, SERIES_COLLECTION),
        where('premium_text', '!=', ''),
        where('is_hidden', '==', false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Serie);
    } catch (error) {
      console.error('Error getting premium series:', error);
      return [];
    }
  },

  // Méthodes spécifiques pour les podcasts
  async getAllPodcasts(): Promise<Serie[]> {
    try {
      const q = query(
        collection(db, SERIES_COLLECTION),
        where('serie_type', '==', 'podcast'),
        where('is_hidden', '==', false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Serie);
    } catch (error) {
      console.error('Error getting all podcasts:', error);
      return [];
    }
  },

  // Méthodes spécifiques pour les séries (sans serie_type)
  async getAllSeriesOnly(): Promise<Serie[]> {
    try {
      const q = query(
        collection(db, SERIES_COLLECTION),
        where('is_hidden', '==', false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => doc.data() as Serie)
        .filter(serie => !serie.serie_type || serie.serie_type === 'serie');
    } catch (error) {
      console.error('Error getting all series:', error);
      return [];
    }
  },

  async getHomeDisplaySeriesOnly(): Promise<Serie[]> {
    try {
      const q = query(
        collection(db, SERIES_COLLECTION),
        where('homedisplayed', '==', true),
        where('is_hidden', '==', false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => doc.data() as Serie)
        .filter(serie => !serie.serie_type || serie.serie_type === 'serie');
    } catch (error) {
      console.error('Error getting home display series:', error);
      return [];
    }
  },

  async getHomeDisplayPodcasts(): Promise<Serie[]> {
    try {
      const q = query(
        collection(db, SERIES_COLLECTION),
        where('serie_type', '==', 'podcast'),
        where('homedisplayed', '==', true),
        where('is_hidden', '==', false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Serie);
    } catch (error) {
      console.error('Error getting home display podcasts:', error);
      return [];
    }
  },

  async getPodcastsByLanguage(lang: string): Promise<Serie[]> {
    try {
      const q = query(
        collection(db, SERIES_COLLECTION),
        where('serie_type', '==', 'podcast'),
        where('lang', 'array-contains', lang),
        where('is_hidden', '==', false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Serie);
    } catch (error) {
      console.error('Error getting podcasts by language:', error);
      return [];
    }
  },

  async getPodcastById(id: string): Promise<Serie | null> {
    try {
      const podcastDoc = await getDoc(doc(db, SERIES_COLLECTION, id));
      if (podcastDoc.exists()) {
        const podcast = podcastDoc.data() as Serie;
        return podcast.serie_type === 'podcast' ? podcast : null;
      }
      return null;
    } catch (error) {
      console.error('Error getting podcast by ID:', error);
      return null;
    }
  }
};

// Services pour les saisons de séries
export const seasonSerieService = {
  async getAllSeasons(): Promise<SeasonSerie[]> {
    try {
      const seasonsSnapshot = await getDocs(collection(db, SEASONS_SERIES_COLLECTION));
      return seasonsSnapshot.docs.map(doc => doc.data() as SeasonSerie);
    } catch (error) {
      console.error('Error getting all seasons:', error);
      return [];
    }
  },

  async getSeasonById(id: string): Promise<SeasonSerie | null> {
    try {
      const seasonDoc = await getDoc(doc(db, SEASONS_SERIES_COLLECTION, id));
      if (seasonDoc.exists()) {
        return seasonDoc.data() as SeasonSerie;
      }
      return null;
    } catch (error) {
      console.error('Error getting season by ID:', error);
      return null;
    }
  },

  async getSeasonsBySerie(uid_serie: string): Promise<SeasonSerie[]> {
    try {
      const q = query(
        collection(db, SEASONS_SERIES_COLLECTION),
        where('uid_serie', '==', uid_serie),
        orderBy('season_number', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as SeasonSerie);
    } catch (error) {
      console.error('Error getting seasons by serie:', error);
      return [];
    }
  },

  async getSeasonBySerieAndNumber(uid_serie: string, season_number: number): Promise<SeasonSerie | null> {
    try {
      const q = query(
        collection(db, SEASONS_SERIES_COLLECTION),
        where('uid_serie', '==', uid_serie),
        where('season_number', '==', season_number)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as SeasonSerie;
      }
      return null;
    } catch (error) {
      console.error('Error getting season by serie and number:', error);
      return null;
    }
  },
};

// Services pour les épisodes de séries
export const episodeSerieService = {
  async getAllEpisodes(): Promise<EpisodeSerie[]> {
    try {
      const episodesSnapshot = await getDocs(collection(db, EPISODES_SERIES_COLLECTION));
      return episodesSnapshot.docs.map(doc => doc.data() as EpisodeSerie);
    } catch (error) {
      console.error('Error getting all episodes:', error);
      return [];
    }
  },

  async getEpisodeById(id: string): Promise<EpisodeSerie | null> {
    try {
      const episodeDoc = await getDoc(doc(db, EPISODES_SERIES_COLLECTION, id));
      if (episodeDoc.exists()) {
        return episodeDoc.data() as EpisodeSerie;
      }
      return null;
    } catch (error) {
      console.error('Error getting episode by ID:', error);
      return null;
    }
  },

  async getEpisodesBySeason(uid_season: string): Promise<EpisodeSerie[]> {
    try {
      const q = query(
        collection(db, EPISODES_SERIES_COLLECTION),
        where('uid_season', '==', uid_season),
        where('hidden', '==', false),
        orderBy('episode_numero', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as EpisodeSerie);
    } catch (error) {
      console.error('Error getting episodes by season:', error);
      return [];
    }
  },

  async getEpisodeBySeasonAndNumber(uid_season: string, episode_numero: number): Promise<EpisodeSerie | null> {
    try {
      const q = query(
        collection(db, EPISODES_SERIES_COLLECTION),
        where('uid_season', '==', uid_season),
        where('episode_numero', '==', episode_numero),
        where('hidden', '==', false)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as EpisodeSerie;
      }
      return null;
    } catch (error) {
      console.error('Error getting episode by season and number:', error);
      return null;
    }
  },

  async getEpisodesBySerie(uid_serie: string): Promise<EpisodeSerie[]> {
    try {
      const q = query(
        collection(db, EPISODES_SERIES_COLLECTION),
        where('uid_serie', '==', uid_serie),
        where('hidden', '==', false),
        orderBy('episode_numero', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as EpisodeSerie);
    } catch (error) {
      console.error('Error getting episodes by serie:', error);
      return [];
    }
  },

  async searchEpisodes(searchTerm: string): Promise<EpisodeSerie[]> {
    try {
      const episodesSnapshot = await getDocs(collection(db, EPISODES_SERIES_COLLECTION));
      const allEpisodes = episodesSnapshot.docs.map(doc => doc.data() as EpisodeSerie);
      
      return allEpisodes.filter(episode => 
        episode.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        episode.original_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        episode.overview.toLowerCase().includes(searchTerm.toLowerCase()) ||
        episode.overviewFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        episode.search_keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching episodes:', error);
      return [];
    }
  },
};
