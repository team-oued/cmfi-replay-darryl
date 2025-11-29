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
    Timestamp,
    DocumentReference
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

export interface Like {
    isliked: boolean;
    liked_at: string;
    likedby: string;
    title: string;
    uid: string;
    username: string;
}

export interface BookDoc {
    add_at: string;
    description: string;
    email: string;
    image: string;
    isseries: boolean;
    title: string;
    uid: string;
}

export interface BookSeries {
    add_at: string;
    description: string;
    email: string;
    image: string;
    isbooked: boolean;
    isseries: boolean;
    moviepath: string;
    runtime: string;
    title: string;
    uid?: string; // Optionnel, peut être absent si refEpisode est présent
    refEpisode?: DocumentReference; // Référence Firestore à un document de la collection episodesSeries
}

// Interface pour la collection stats_vues
export interface StatsVues {
    id?: string;
    dateDernierUpdate: string;
    idEpisodeSerie?: DocumentReference; // Référence à un épisode de série (absent si c'est un film)
    uid: string; // uid de l'épisode ou du film
    nombreLectures: number;
    tempsRegarde: number; // en secondes
    user: DocumentReference; // Référence à l'utilisateur
}

// Constantes pour les collections
const USERS_COLLECTION = 'users';
const MOVIES_COLLECTION = 'movies';
const SERIES_COLLECTION = 'series';
const SEASONS_SERIES_COLLECTION = 'seasonsSeries';
const EPISODES_SERIES_COLLECTION = 'episodesSeries';
const BOOKMARKS_COLLECTION = 'bookmarks';
const BOOK_DOC_COLLECTION = 'bookDoc';
const BOOK_SERIES_COLLECTION = 'bookSeries';
const LIKES_COLLECTION = 'like';
const COMMENTS_COLLECTION = 'comment';
const STATS_VUES_COLLECTION = 'stats_vues';

// Fonction utilitaire pour générer un avatar par défaut
export const generateDefaultAvatar = (name?: string): string => {
    const displayName = name || 'User';
    const initial = displayName.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${initial}&background=random&color=fff&size=128`;
};

// Interface pour les commentaires
export interface Comment {
    comment: string;
    created_at: string;
    created_by: string;
    uid: string; // uid de l'épisode ou du film
    user_photo_url?: string;
}

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

// Services pour les commentaires
export const commentService = {
    async getComments(itemUid: string): Promise<Comment[]> {
        try {
            const q = query(
                collection(db, COMMENTS_COLLECTION),
                where('uid', '==', itemUid)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data() as Comment);
        } catch (error) {
            console.error('Error getting comments:', error);
            return [];
        }
    },

    async addComment(itemUid: string, text: string, user: UserProfile): Promise<Comment | null> {
        try {
            const newComment: Comment = {
                comment: text,
                created_at: new Date().toLocaleString('fr-FR', { timeZoneName: 'short' }),
                created_by: user.display_name || user.email.split('@')[0],
                uid: itemUid,
                user_photo_url: user.photo_url,
            };
            await setDoc(doc(collection(db, COMMENTS_COLLECTION)), newComment);
            return newComment;
        } catch (error) {
            console.error('Error adding comment:', error);
            return null;
        }
    },
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

    async getMovieByUid(uid: string): Promise<Movie | null> {
        try {
            const q = query(
                collection(db, MOVIES_COLLECTION),
                where('uid', '==', uid),
                limit(1)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].data() as Movie;
            }
            return null;
        } catch (error) {
            console.error('Error getting movie by UID:', error);
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

    async getSerieByUid(uid_serie: string): Promise<Serie | null> {
        try {
            const q = query(
                collection(db, SERIES_COLLECTION),
                where('uid_serie', '==', uid_serie),
                limit(1)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].data() as Serie;
            }
            return null;
        } catch (error) {
            console.error('Error getting serie by UID:', error);
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

    async getSeasonByUid(uid_season: string): Promise<SeasonSerie | null> {
        try {
            const q = query(
                collection(db, SEASONS_SERIES_COLLECTION),
                where('uid_season', '==', uid_season),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].data() as SeasonSerie;
            }
            return null;
        } catch (error) {
            console.error('Error getting season by UID:', error);
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

    async getEpisodeByUid(uid_episode: string): Promise<EpisodeSerie | null> {
        try {
            const q = query(
                collection(db, EPISODES_SERIES_COLLECTION),
                where('uid_episode', '==', uid_episode),
                limit(1)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].data() as EpisodeSerie;
            }
            return null;
        } catch (error) {
            console.error('Error getting episode by UID:', error);
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

// Services pour les likes
export const likeService = {
    async toggleLike(itemUid: string, itemTitle: string, user: UserProfile): Promise<boolean> {
        try {
            // Chercher si un like existe déjà pour cet utilisateur et cet item
            const q = query(
                collection(db, LIKES_COLLECTION),
                where('uid', '==', itemUid),
                where('likedby', '==', user.email)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Le like existe, on le toggle ou on le supprime
                // Ici, on va supposer qu'on supprime le document si on "unlike" pour simplifier le comptage,
                // OU on met isliked à false. Le user a montré "isliked: true".
                // On va supprimer le document pour faire simple et propre, ou mettre à jour.
                // Si on suit le schéma strict "isliked: true", on peut imaginer qu'il peut être false.
                // Mais pour l'instant, si on re-clique, on veut probablement enlever le like.
                // On va supprimer le document.
                const likeDoc = querySnapshot.docs[0];
                await deleteDoc(doc(db, LIKES_COLLECTION, likeDoc.id));
                return false; // Unliked
            } else {
                // Créer un nouveau like
                const newLike: Like = {
                    isliked: true,
                    liked_at: new Date().toLocaleString('fr-FR', { timeZoneName: 'short' }), // Format approximatif
                    likedby: user.email,
                    title: itemTitle,
                    uid: itemUid,
                    username: user.display_name || user.email.split('@')[0]
                };

                // On utilise un ID généré auto ou composite
                await setDoc(doc(collection(db, LIKES_COLLECTION)), newLike);
                return true; // Liked
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            throw error;
        }
    },

    async getLikeCount(itemUid: string): Promise<number> {
        try {
            const q = query(
                collection(db, LIKES_COLLECTION),
                where('uid', '==', itemUid),
                where('isliked', '==', true)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.size;
        } catch (error) {
            console.error('Error getting like count:', error);
            return 0;
        }
    },

    async hasUserLiked(itemUid: string, userEmail: string): Promise<boolean> {
        try {
            const q = query(
                collection(db, LIKES_COLLECTION),
                where('uid', '==', itemUid),
                where('likedby', '==', userEmail),
                where('isliked', '==', true)
            );
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error('Error checking if user liked:', error);
            return false;
        }
    },

    async getMostLikedItems(limitCount: number = 10): Promise<Array<{ uid: string; likeCount: number; title: string }>> {
        try {
            const q = query(
                collection(db, LIKES_COLLECTION),
                where('uid', '!=', ''),
            );
            const querySnapshot = await getDocs(q);

            // Compter les likes par uid
            const likesMap = new Map<string, { count: number; title: string }>();

            querySnapshot.docs.forEach(doc => {
                const like = doc.data() as Like;
                const current = likesMap.get(like.uid);
                if (current) {
                    current.count++;
                } else {
                    likesMap.set(like.uid, { count: 1, title: like.title });
                }
            });

            // Convertir en tableau et trier par nombre de likes décroissant
            const sortedItems = Array.from(likesMap.entries())
                .map(([uid, data]) => ({
                    uid,
                    likeCount: data.count,
                    title: data.title
                }))
                .sort((a, b) => b.likeCount - a.likeCount)
                .slice(0, limitCount);

            return sortedItems;
        } catch (error) {
            console.error('Error getting most liked items:', error);
            return [];
        }
    }
};

// Services pour les bookmarks (collection bookDoc)
export const bookDocService = {
    async addBookmark(movieOrSerieUid: string, userEmail: string, title: string, description: string, image: string, isseries: boolean = false): Promise<BookDoc | null> {
        try {
            // Vérifier si le bookmark existe déjà
            const existing = await this.getBookmark(movieOrSerieUid, userEmail);
            if (existing) {
                console.log('Bookmark already exists');
                return existing;
            }

            const newBookmark: BookDoc = {
                add_at: new Date().toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'short'
                }),
                description,
                email: userEmail,
                image,
                isseries,
                title,
                uid: movieOrSerieUid
            };

            await setDoc(doc(collection(db, BOOK_DOC_COLLECTION)), newBookmark);
            return newBookmark;
        } catch (error) {
            console.error('Error adding bookmark:', error);
            return null;
        }
    },

    async removeBookmark(movieOrSerieUid: string, userEmail: string): Promise<boolean> {
        try {
            const q = query(
                collection(db, BOOK_DOC_COLLECTION),
                where('uid', '==', movieOrSerieUid),
                where('email', '==', userEmail)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const bookmarkDoc = querySnapshot.docs[0];
                await deleteDoc(doc(db, BOOK_DOC_COLLECTION, bookmarkDoc.id));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error removing bookmark:', error);
            return false;
        }
    },

    async getBookmark(movieOrSerieUid: string, userEmail: string): Promise<BookDoc | null> {
        try {
            const q = query(
                collection(db, BOOK_DOC_COLLECTION),
                where('uid', '==', movieOrSerieUid),
                where('email', '==', userEmail)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].data() as BookDoc;
            }
            return null;
        } catch (error) {
            console.error('Error getting bookmark:', error);
            return null;
        }
    },

    async getUserBookmarks(userEmail: string): Promise<BookDoc[]> {
        try {
            const q = query(
                collection(db, BOOK_DOC_COLLECTION),
                where('email', '==', userEmail)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data() as BookDoc);
        } catch (error) {
            console.error('Error getting user bookmarks:', error);
            return [];
        }
    },

    async toggleBookmark(movieOrSerieUid: string, userEmail: string, title: string, description: string, image: string, isseries: boolean = false): Promise<boolean> {
        try {
            const existing = await this.getBookmark(movieOrSerieUid, userEmail);

            if (existing) {
                await this.removeBookmark(movieOrSerieUid, userEmail);
                return false; // Removed
            } else {
                await this.addBookmark(movieOrSerieUid, userEmail, title, description, image, isseries);
                return true; // Added
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
            throw error;
        }
    }
};

// Services pour les bookmarks de séries (collection bookSeries)
export const bookSeriesService = {
    async addBookmark(
        episodeUidOrRef: string | DocumentReference,
        userEmail: string,
        title: string,
        description: string,
        image: string,
        moviepath: string,
        runtime: string,
        useRefEpisode: boolean = false
    ): Promise<BookSeries | null> {
        try {
            // Vérifier si le bookmark existe déjà
            const existing = await this.getBookmark(episodeUidOrRef, userEmail);
            if (existing) {
                console.log('Bookmark already exists');
                return existing;
            }

            const newBookmark: BookSeries = {
                add_at: new Date().toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'short'
                }),
                description,
                email: userEmail,
                image,
                isbooked: true,
                isseries: true,
                moviepath,
                runtime,
                title,
                ...(useRefEpisode
                    ? {
                        refEpisode: typeof episodeUidOrRef === 'string'
                            ? doc(db, EPISODES_SERIES_COLLECTION, episodeUidOrRef)
                            : episodeUidOrRef
                    }
                    : { uid: typeof episodeUidOrRef === 'string' ? episodeUidOrRef : episodeUidOrRef.id }
                )
            };

            await setDoc(doc(collection(db, BOOK_SERIES_COLLECTION)), newBookmark);
            return newBookmark;
        } catch (error) {
            console.error('Error adding series bookmark:', error);
            return null;
        }
    },

    async removeBookmark(episodeUidOrRef: string | DocumentReference, userEmail: string): Promise<boolean> {
        try {
            // Essayer d'abord avec uid
            const uidToSearch = typeof episodeUidOrRef === 'string' ? episodeUidOrRef : episodeUidOrRef.id;
            let q = query(
                collection(db, BOOK_SERIES_COLLECTION),
                where('uid', '==', uidToSearch),
                where('email', '==', userEmail)
            );
            let querySnapshot = await getDocs(q);

            // Si pas trouvé, essayer avec refEpisode
            if (querySnapshot.empty) {
                const refToSearch = typeof episodeUidOrRef === 'string'
                    ? doc(db, EPISODES_SERIES_COLLECTION, episodeUidOrRef)
                    : episodeUidOrRef;
                q = query(
                    collection(db, BOOK_SERIES_COLLECTION),
                    where('refEpisode', '==', refToSearch),
                    where('email', '==', userEmail)
                );
                querySnapshot = await getDocs(q);
            }

            if (!querySnapshot.empty) {
                const bookmarkDoc = querySnapshot.docs[0];
                await deleteDoc(doc(db, BOOK_SERIES_COLLECTION, bookmarkDoc.id));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error removing series bookmark:', error);
            return false;
        }
    },

    async getBookmark(episodeUidOrRef: string | DocumentReference, userEmail: string): Promise<BookSeries | null> {
        try {
            // Essayer d'abord avec uid
            const uidToSearch = typeof episodeUidOrRef === 'string' ? episodeUidOrRef : episodeUidOrRef.id;
            let q = query(
                collection(db, BOOK_SERIES_COLLECTION),
                where('uid', '==', uidToSearch),
                where('email', '==', userEmail)
            );
            let querySnapshot = await getDocs(q);

            // Si pas trouvé, essayer avec refEpisode
            if (querySnapshot.empty) {
                const refToSearch = typeof episodeUidOrRef === 'string'
                    ? doc(db, EPISODES_SERIES_COLLECTION, episodeUidOrRef)
                    : episodeUidOrRef;
                q = query(
                    collection(db, BOOK_SERIES_COLLECTION),
                    where('refEpisode', '==', refToSearch),
                    where('email', '==', userEmail)
                );
                querySnapshot = await getDocs(q);
            }

            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].data() as BookSeries;
            }
            return null;
        } catch (error) {
            console.error('Error getting series bookmark:', error);
            return null;
        }
    },

    async getUserBookmarks(userEmail: string): Promise<BookSeries[]> {
        try {
            const q = query(
                collection(db, BOOK_SERIES_COLLECTION),
                where('email', '==', userEmail)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data() as BookSeries);
        } catch (error) {
            console.error('Error getting user series bookmarks:', error);
            return [];
        }
    },

    async toggleBookmark(
        episodeUid: string,
        userEmail: string,
        title: string,
        description: string,
        image: string,
        moviepath: string,
        runtime: string
    ): Promise<boolean> {
        try {
            const existing = await this.getBookmark(episodeUid, userEmail);

            if (existing) {
                await this.removeBookmark(episodeUid, userEmail);
                return false; // Removed
            } else {
                await this.addBookmark(episodeUid, userEmail, title, description, image, moviepath, runtime);
                return true; // Added
            }
        } catch (error) {
            console.error('Error toggling series bookmark:', error);
            throw error;
        }
    }
};

// Interface pour les données enrichies de "Continuer la lecture"
export interface ContinueWatchingItem {
    id: string;
    uid: string; // uid de l'épisode ou du film (peut être undefined pour les épisodes)
    title: string;
    imageUrl: string;
    progress: number; // Pourcentage de progression (0-100)
    tempsRegarde: number; // en secondes
    runtime: number; // durée totale en secondes
    type: 'movie' | 'episode';
    // Pour les épisodes
    episodeNumber?: number;
    seasonNumber?: number;
    serieTitle?: string;
    episodeTitle?: string;
    uid_episode?: string; // uid_episode pour récupérer l'épisode directement
    episodeId?: string; // ID du document Firestore (fallback si uid_episode manquant)
    dateDernierUpdate: string;
}

// Service pour stats_vues
export const statsVuesService = {
    async getContinueWatching(userUid: string, limitCount: number = 10): Promise<ContinueWatchingItem[]> {
        try {
            const userRef = doc(db, USERS_COLLECTION, userUid);
            const q = query(
                collection(db, STATS_VUES_COLLECTION),
                where('user', '==', userRef),
                orderBy('dateDernierUpdate', 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            const continueWatchingItems: ContinueWatchingItem[] = [];

            for (const docSnapshot of querySnapshot.docs) {
                const data = docSnapshot.data() as StatsVues;

                // Vérifier si c'est un épisode ou un film
                const isEpisode = !!data.idEpisodeSerie;

                if (isEpisode && data.idEpisodeSerie) {
                    // C'est un épisode de série
                    const episodeDoc = await getDoc(data.idEpisodeSerie);
                    if (episodeDoc.exists()) {
                        const episode = episodeDoc.data() as EpisodeSerie;
                        const runtime = episode.runtime || 0;
                        const progress = runtime > 0 ? Math.min((data.tempsRegarde / runtime) * 100, 100) : 0;

                        // Ne pas afficher si déjà terminé (>95%)
                        if (progress < 95) {
                            continueWatchingItems.push({
                                id: docSnapshot.id,
                                uid: data.uid || episode.uid_episode || episodeDoc.id, // Fallback sur l'ID du document
                                title: episode.title_serie,
                                imageUrl: episode.backdrop_path || episode.picture_path,
                                progress,
                                tempsRegarde: data.tempsRegarde,
                                runtime,
                                type: 'episode',
                                episodeNumber: episode.episode_numero,
                                episodeTitle: episode.title,
                                serieTitle: episode.title_serie,
                                uid_episode: episode.uid_episode || episodeDoc.id, // Fallback sur l'ID du document
                                episodeId: episodeDoc.id, // Stocker l'ID du document
                                dateDernierUpdate: data.dateDernierUpdate
                            });
                        }
                    }
                } else {
                    // C'est un film
                    const movie = await movieService.getMovieByUid(data.uid);
                    if (movie) {
                        // Convertir runtime_h_m (ex: "2h 30min") en secondes
                        const runtimeMatch = movie.runtime?.match(/(\d+)h?\s*(\d+)?/);
                        let runtime = 0;
                        if (runtimeMatch) {
                            const hours = parseInt(runtimeMatch[1] || '0');
                            const minutes = parseInt(runtimeMatch[2] || '0');
                            runtime = (hours * 3600) + (minutes * 60);
                        }

                        const progress = runtime > 0 ? Math.min((data.tempsRegarde / runtime) * 100, 100) : 0;

                        // Ne pas afficher si déjà terminé (>95%)
                        if (progress < 95) {
                            continueWatchingItems.push({
                                id: docSnapshot.id,
                                uid: data.uid,
                                title: movie.title,
                                imageUrl: movie.backdrop_path || movie.poster_path,
                                progress,
                                tempsRegarde: data.tempsRegarde,
                                runtime,
                                type: 'movie',
                                dateDernierUpdate: data.dateDernierUpdate
                            });
                        }
                    }
                }
            }

            return continueWatchingItems;
        } catch (error) {
            console.error('Error getting continue watching items:', error);
            return [];
        }
    },

    async getAllHistory(userUid: string): Promise<ContinueWatchingItem[]> {
        try {
            const userRef = doc(db, USERS_COLLECTION, userUid);
            const q = query(
                collection(db, STATS_VUES_COLLECTION),
                where('user', '==', userRef),
                orderBy('dateDernierUpdate', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const historyItems: ContinueWatchingItem[] = [];

            for (const docSnapshot of querySnapshot.docs) {
                const data = docSnapshot.data() as StatsVues;

                // Vérifier si c'est un épisode ou un film
                const isEpisode = !!data.idEpisodeSerie;

                if (isEpisode && data.idEpisodeSerie) {
                    // C'est un épisode de série
                    const episodeDoc = await getDoc(data.idEpisodeSerie);
                    if (episodeDoc.exists()) {
                        const episode = episodeDoc.data() as EpisodeSerie;
                        const runtime = episode.runtime || 0;
                        const progress = runtime > 0 ? Math.min((data.tempsRegarde / runtime) * 100, 100) : 0;

                        historyItems.push({
                            id: docSnapshot.id,
                            uid: data.uid || episode.uid_episode || episodeDoc.id,
                            title: episode.title_serie,
                            imageUrl: episode.backdrop_path || episode.picture_path,
                            progress,
                            tempsRegarde: data.tempsRegarde,
                            runtime,
                            type: 'episode',
                            episodeNumber: episode.episode_numero,
                            episodeTitle: episode.title,
                            serieTitle: episode.title_serie,
                            uid_episode: episode.uid_episode || episodeDoc.id,
                            episodeId: episodeDoc.id,
                            dateDernierUpdate: data.dateDernierUpdate
                        });
                    }
                } else {
                    // C'est un film
                    const movie = await movieService.getMovieByUid(data.uid);
                    if (movie) {
                        // Convertir runtime_h_m (ex: "2h 30min") en secondes
                        const runtimeMatch = movie.runtime?.match(/(\d+)h?\s*(\d+)?/);
                        let runtime = 0;
                        if (runtimeMatch) {
                            const hours = parseInt(runtimeMatch[1] || '0');
                            const minutes = parseInt(runtimeMatch[2] || '0');
                            runtime = (hours * 3600) + (minutes * 60);
                        }

                        const progress = runtime > 0 ? Math.min((data.tempsRegarde / runtime) * 100, 100) : 0;

                        historyItems.push({
                            id: docSnapshot.id,
                            uid: data.uid,
                            title: movie.title,
                            imageUrl: movie.backdrop_path || movie.poster_path,
                            progress,
                            tempsRegarde: data.tempsRegarde,
                            runtime,
                            type: 'movie',
                            dateDernierUpdate: data.dateDernierUpdate
                        });
                    }
                }
            }

            return historyItems;
        } catch (error) {
            console.error('Error getting all history items:', error);
            return [];
        }
    }
};

// Interface pour les résultats de recherche unifiés
export interface SearchResult {
    id: string;
    uid: string;
    title: string;
    description: string;
    imageUrl: string;
    type: 'movie' | 'serie' | 'podcast' | 'season' | 'episode';
    // Champs additionnels selon le type
    serieTitle?: string; // Pour les saisons et épisodes
    seasonNumber?: number; // Pour les saisons et épisodes
    episodeNumber?: number; // Pour les épisodes
    uid_serie?: string; // Pour les séries/saisons/épisodes
    uid_season?: string; // Pour les saisons et épisodes
    uid_episode?: string; // Pour les épisodes
}

// Service de recherche global
export const searchService = {
    /**
     * Recherche dans toutes les collections
     * @param searchTerm - Terme de recherche
     * @returns Tableau de résultats de recherche unifiés
     */
    async searchAll(searchTerm: string): Promise<SearchResult[]> {
        if (!searchTerm || searchTerm.trim().length === 0) {
            return [];
        }

        const term = searchTerm.toLowerCase().trim();
        const results: SearchResult[] = [];

        try {
            // Recherche parallèle dans toutes les collections
            const [movies, series, seasons, episodes] = await Promise.all([
                this.searchMovies(term),
                this.searchSeries(term),
                this.searchSeasons(term),
                this.searchEpisodes(term)
            ]);

            results.push(...movies, ...series, ...seasons, ...episodes);

            // Trier les résultats par pertinence (titre exact en premier)
            return results.sort((a, b) => {
                const aExactMatch = a.title.toLowerCase() === term;
                const bExactMatch = b.title.toLowerCase() === term;

                if (aExactMatch && !bExactMatch) return -1;
                if (!aExactMatch && bExactMatch) return 1;

                const aStartsWith = a.title.toLowerCase().startsWith(term);
                const bStartsWith = b.title.toLowerCase().startsWith(term);

                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;

                return a.title.localeCompare(b.title);
            });
        } catch (error) {
            console.error('Error in global search:', error);
            return [];
        }
    },

    /**
     * Recherche dans les films (title, description)
     */
    async searchMovies(searchTerm: string): Promise<SearchResult[]> {
        try {
            const moviesSnapshot = await getDocs(collection(db, MOVIES_COLLECTION));
            const results: SearchResult[] = [];

            moviesSnapshot.docs.forEach(doc => {
                const movie = doc.data() as Movie;

                // Ignorer les films cachés
                if (movie.hidden) return;

                const titleMatch = movie.title?.toLowerCase().includes(searchTerm);
                const descriptionMatch = movie.overview?.toLowerCase().includes(searchTerm);

                if (titleMatch || descriptionMatch) {
                    results.push({
                        id: doc.id,
                        uid: movie.uid,
                        title: movie.title,
                        description: movie.overview || '',
                        imageUrl: movie.backdrop_path || movie.poster_path || movie.picture_path,
                        type: 'movie'
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('Error searching movies:', error);
            return [];
        }
    },

    /**
     * Recherche dans les séries/podcasts (title_serie, overview_serie)
     */
    async searchSeries(searchTerm: string): Promise<SearchResult[]> {
        try {
            const seriesSnapshot = await getDocs(collection(db, SERIES_COLLECTION));
            const results: SearchResult[] = [];

            seriesSnapshot.docs.forEach(doc => {
                const serie = doc.data() as Serie;

                // Ignorer les séries cachées
                if (serie.is_hidden) return;

                const titleMatch = serie.title_serie?.toLowerCase().includes(searchTerm);
                const overviewMatch = serie.overview_serie?.toLowerCase().includes(searchTerm);

                if (titleMatch || overviewMatch) {
                    results.push({
                        id: doc.id,
                        uid: serie.uid_serie,
                        uid_serie: serie.uid_serie,
                        title: serie.title_serie,
                        description: serie.overview_serie || '',
                        imageUrl: serie.image_path || serie.back_path,
                        type: serie.serie_type === 'podcast' ? 'podcast' : 'serie'
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('Error searching series:', error);
            return [];
        }
    },

    /**
     * Recherche dans les saisons (title_season, overview)
     */
    async searchSeasons(searchTerm: string): Promise<SearchResult[]> {
        try {
            const seasonsSnapshot = await getDocs(collection(db, SEASONS_SERIES_COLLECTION));
            const results: SearchResult[] = [];

            seasonsSnapshot.docs.forEach(doc => {
                const season = doc.data() as SeasonSerie;

                const titleMatch = season.title_season?.toLowerCase().includes(searchTerm);
                const overviewMatch = season.overview?.toLowerCase().includes(searchTerm);

                if (titleMatch || overviewMatch) {
                    results.push({
                        id: doc.id,
                        uid: season.uid_season,
                        uid_serie: season.uid_serie,
                        uid_season: season.uid_season,
                        title: season.title_season,
                        description: season.overview || '',
                        imageUrl: season.poster_path || season.backdrop_path,
                        type: 'season',
                        serieTitle: season.title_serie,
                        seasonNumber: season.season_number
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('Error searching seasons:', error);
            return [];
        }
    },

    /**
     * Recherche dans les épisodes (title, overview, overviewFr, search_keywords)
     */
    async searchEpisodes(searchTerm: string): Promise<SearchResult[]> {
        try {
            const episodesSnapshot = await getDocs(collection(db, EPISODES_SERIES_COLLECTION));
            const results: SearchResult[] = [];

            episodesSnapshot.docs.forEach(doc => {
                const episode = doc.data() as EpisodeSerie;

                // Ignorer les épisodes cachés
                if (episode.hidden) return;

                const titleMatch = episode.title?.toLowerCase().includes(searchTerm);
                const overviewMatch = episode.overview?.toLowerCase().includes(searchTerm);
                const overviewFrMatch = episode.overviewFr?.toLowerCase().includes(searchTerm);
                const keywordsMatch = episode.search_keywords?.some(
                    keyword => keyword.toLowerCase().includes(searchTerm)
                );

                if (titleMatch || overviewMatch || overviewFrMatch || keywordsMatch) {
                    results.push({
                        id: doc.id,
                        uid: episode.uid_episode,
                        uid_episode: episode.uid_episode,
                        uid_season: episode.uid_season,
                        title: episode.title,
                        description: episode.overviewFr || episode.overview || '',
                        imageUrl: episode.backdrop_path || episode.picture_path,
                        type: 'episode',
                        serieTitle: episode.title_serie,
                        episodeNumber: episode.episode_numero
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('Error searching episodes:', error);
            return [];
        }
    },

    /**
     * Recherche par type spécifique
     */
    async searchByType(searchTerm: string, type: 'movie' | 'serie' | 'podcast' | 'season' | 'episode'): Promise<SearchResult[]> {
        const term = searchTerm.toLowerCase().trim();

        switch (type) {
            case 'movie':
                return this.searchMovies(term);
            case 'serie':
                const series = await this.searchSeries(term);
                return series.filter(s => s.type === 'serie');
            case 'podcast':
                const podcasts = await this.searchSeries(term);
                return podcasts.filter(p => p.type === 'podcast');
            case 'season':
                return this.searchSeasons(term);
            case 'episode':
                return this.searchEpisodes(term);
            default:
                return [];
        }
    }
};


