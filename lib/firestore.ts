import { db } from './firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    arrayUnion, 
    arrayRemove, 
    query, 
    where, 
    limit, 
    getDocs, 
    orderBy, 
    onSnapshot,
    Timestamp,
    writeBatch,
    DocumentReference,
    addDoc
} from 'firebase/firestore';

// Interfaces pour les collections
export interface UserProfile {
    uid: string;
    email: string;
    display_name: string;
    photo_url?: string;
    presence: 'online' | 'offline' | 'idle' | 'away';
    hasAcceptedPrivacyPolicy: boolean;
    rgpdAcceptedAt?: Date | Timestamp; // Date d'acceptation de la politique RGPD
    created_time: string;
    theme: 'light' | 'dark';
    language: string;
    bookmarkedIds: string[];
    createdAt?: Date | Timestamp;
    updatedAt?: Date | Timestamp;
    isAdmin?: boolean;
    lastSeen?: Date | Timestamp; // Timestamp de la dernière activité
    country?: string; // Code pays (ex: "FR", "US")
    phoneNumber?: string; // Numéro de téléphone avec indicateur (ex: "+33 6 12 34 56 78")
}

// Interface pour les catégories de séries
export interface SerieCategory {
    id: string;
    name: string;
    description?: string;
    color?: string; // Couleur pour l'affichage (optionnel)
    order?: number; // Ordre d'affichage
    createdAt: string;
    updatedAt: string;
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
    categoryId?: string; // ID de la catégorie
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
    views?: number;
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
    views?: number;
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
    dateDernierUpdate: Date | Timestamp;
    idEpisodeSerie?: DocumentReference; // Référence à un épisode de série (absent si c'est un film)
    uid: string; // uid de l'épisode ou du film
    nombreLectures: number;
    tempsRegarde: number; // en secondes
    user: DocumentReference; // Référence à l'utilisateur
}

// Interface pour la collection user_view
export interface UserView {
    view_date: string; // Format: "12 juin 2025 à 08:19:16 UTC+2"
    uid: string; // uid du film (uid) ou de l'épisode (uid_episode)
    video_type: 'movie' | 'episode';
    user_uid: string; // uid de l'utilisateur
}

// Interface pour une navigation individuelle
export interface NavigationEntry {
    page_path: string; // Chemin de la page (ex: /home, /movies, /watch/abc123)
    page_name: string; // Nom lisible de la page (ex: "Accueil", "Films", "Lecture")
    timestamp: Date | Timestamp;
    video_title?: string; // Titre de la vidéo si c'est une page de lecture (ex: "Episode 1 - Titre de l'épisode")
    video_uid?: string; // UID de la vidéo si c'est une page de lecture
}

// Interface pour la collection user_navigation (1 document par utilisateur)
export interface UserNavigation {
    id?: string;
    user_uid: string;
    lastTwoPages: NavigationEntry[]; // Maximum 2 pages (les 2 dernières quand en ligne)
    updatedAt: Date | Timestamp;
}

// Interface pour les notifications
export interface Notification {
    id: string;
    userId: string; // uid de l'utilisateur destinataire
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    createdAt: Date | Timestamp;
    link?: string; // Lien optionnel vers une page
}

// Constantes pour les collections
const USERS_COLLECTION = 'users';
const MOVIES_COLLECTION = 'movies';
const SERIES_COLLECTION = 'series';
const SEASONS_SERIES_COLLECTION = 'seasonsSeries';
const EPISODES_SERIES_COLLECTION = 'episodesSeries';
const SERIE_CATEGORIES_COLLECTION = 'serieCategories';
const BOOKMARKS_COLLECTION = 'bookmarks';
const BOOK_DOC_COLLECTION = 'bookDoc';
const BOOK_SERIES_COLLECTION = 'bookSeries';
const LIKES_COLLECTION = 'like';
const COMMENTS_COLLECTION = 'comment';
const STATS_VUES_COLLECTION = 'stats_vues';
const USER_VIEW_COLLECTION = 'user_view';
const APP_SETTINGS_COLLECTION = 'appSettings';
const ADS_COLLECTION = 'ads';
const NOTIFICATIONS_COLLECTION = 'notifications';
const USER_NAVIGATION_COLLECTION = 'user_navigation';

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
                const data = userDoc.data();
                console.log('🔍 [getUserProfile] Raw data from Firestore:', {
                    uid: data.uid,
                    isAdmin: data.isAdmin,
                    isAdminType: typeof data.isAdmin,
                    allFields: Object.keys(data)
                });
                return data as UserProfile;
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
            // Convertir lastSeen en Timestamp si c'est une Date
            const firestoreUpdates: any = { ...updates };
            if (updates.lastSeen instanceof Date) {
                firestoreUpdates.lastSeen = Timestamp.fromDate(updates.lastSeen);
            }
            
            await updateDoc(userRef, {
                ...firestoreUpdates,
                updatedAt: Timestamp.now() // Utiliser Timestamp.now() pour la cohérence
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

    /**
     * Définit le statut admin d'un utilisateur
     */
    async setAdminStatus(uid: string, isAdmin: boolean): Promise<void> {
        try {
            await this.updateUserProfile(uid, { isAdmin });
            console.log(`Admin status ${isAdmin ? 'granted' : 'revoked'} for user: ${uid}`);
        } catch (error) {
            console.error('Error setting admin status:', error);
            throw error;
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
    },

    /**
     * S'abonne aux mises à jour en temps réel des utilisateurs en ligne
     * Filtre les utilisateurs avec lastSeen récent (< 3 minutes) pour éviter les "fantômes"
     * @param callback Fonction de rappel appelée à chaque mise à jour
     * @param includeInactive Si true, inclut aussi les utilisateurs offline avec lastSeen récent
     * @returns Fonction pour se désabonner
     */
    subscribeToOnlineUsers(callback: (users: (UserProfile & { lastSeen?: Date | Timestamp | number; updatedAt?: Date | Timestamp })[]) => void, includeInactive: boolean = false): () => void {
        // Note: On ne peut pas utiliser orderBy avec where('in') sans index composite
        // On fait donc le tri côté client
        const presenceFilter = includeInactive 
            ? where('presence', 'in', ['online', 'away', 'idle', 'offline'])
            : where('presence', 'in', ['online', 'away', 'idle']);
        
        const q = query(
            collection(db, USERS_COLLECTION),
            presenceFilter
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const now = Date.now();
            const oneMinuteAgo = now - (1 * 60 * 1000); // 1 minute en millisecondes
            const threeMinutesAgo = now - (3 * 60 * 1000); // 3 minutes en millisecondes (gardé pour compatibilité)
            
            const users = querySnapshot.docs
                .map(doc => {
                    const data = doc.data();
                    // Préserver le Timestamp original si c'est un Timestamp Firestore
                    const originalLastSeen = data.lastSeen;
                    let lastSeenTimestamp = 0;
                    let lastSeenOriginal: Date | Timestamp | undefined = undefined;
                    
                    // Essayer de récupérer lastSeen
                    if (originalLastSeen) {
                        if (originalLastSeen instanceof Timestamp) {
                            lastSeenTimestamp = originalLastSeen.toMillis();
                            lastSeenOriginal = originalLastSeen;
                        } else if (originalLastSeen instanceof Date) {
                            lastSeenTimestamp = originalLastSeen.getTime();
                            lastSeenOriginal = originalLastSeen;
                        } else if (typeof originalLastSeen === 'object' && 'toMillis' in originalLastSeen) {
                            // Cas où c'est un Timestamp Firestore mais pas reconnu comme Timestamp
                            lastSeenTimestamp = (originalLastSeen as any).toMillis();
                            lastSeenOriginal = originalLastSeen as Timestamp;
                        } else if (typeof originalLastSeen === 'number') {
                            // Cas où c'est déjà un timestamp en millisecondes
                            lastSeenTimestamp = originalLastSeen;
                            lastSeenOriginal = new Date(originalLastSeen);
                        } else {
                            // Essayer de convertir en Date
                            try {
                                const date = new Date(originalLastSeen as any);
                                if (!isNaN(date.getTime())) {
                                    lastSeenTimestamp = date.getTime();
                                    lastSeenOriginal = date;
                                }
                            } catch (e) {
                                // Ignorer les erreurs de conversion
                            }
                        }
                    }
                    
                    // Si pas de lastSeen, utiliser updatedAt comme fallback pour tous les statuts
                    if (lastSeenTimestamp === 0) {
                        const updatedAt = data.updatedAt;
                        if (updatedAt) {
                            if (updatedAt instanceof Timestamp) {
                                lastSeenTimestamp = updatedAt.toMillis();
                                lastSeenOriginal = updatedAt;
                            } else if (updatedAt instanceof Date) {
                                lastSeenTimestamp = updatedAt.getTime();
                                lastSeenOriginal = updatedAt;
                            } else if (typeof updatedAt === 'object' && 'toMillis' in updatedAt) {
                                lastSeenTimestamp = (updatedAt as any).toMillis();
                                lastSeenOriginal = updatedAt as Timestamp;
                            }
                        }
                    }
                    
                    // Préserver updatedAt pour l'affichage
                    let updatedAtOriginal: Date | Timestamp | undefined = undefined;
                    if (data.updatedAt) {
                        if (data.updatedAt instanceof Timestamp) {
                            updatedAtOriginal = data.updatedAt;
                        } else if (data.updatedAt instanceof Date) {
                            updatedAtOriginal = data.updatedAt;
                        } else if (typeof data.updatedAt === 'object' && 'toMillis' in data.updatedAt) {
                            updatedAtOriginal = data.updatedAt as Timestamp;
                        }
                    }
                    
                    return {
                        ...data,
                        uid: doc.id,
                        lastSeen: lastSeenTimestamp,
                        lastSeenOriginal: lastSeenOriginal,
                        updatedAt: updatedAtOriginal
                    } as UserProfile & { lastSeen: number; lastSeenOriginal?: Date | Timestamp; updatedAt?: Date | Timestamp };
                })
                .filter(user => {
                    // Si includeInactive est true, on inclut tous les utilisateurs (même offline)
                    // Sinon, on filtre seulement les actifs (< 1 minute)
                    const oneMinuteAgoFilter = Date.now() - (1 * 60 * 1000);
                    if (includeInactive) {
                        return true; // Inclure tous les utilisateurs si on veut voir les inactifs
                    }
                    // Pour les utilisateurs actifs uniquement, vérifier le statut ET lastSeen
                    // Si presence est 'online', inclure même si lastSeen n'est pas encore défini (connexion récente)
                    if (user.presence === 'online') {
                        // Si online, inclure même sans lastSeen (connexion très récente)
                        // ou si lastSeen est récent (< 1 minute)
                        if (!user.lastSeen || user.lastSeen === 0) {
                            return true; // Utilisateur vient de se connecter, inclure
                        }
                        return user.lastSeen > oneMinuteAgoFilter;
                    }
                    // Pour les autres statuts (away, idle), filtrer par lastSeen récent
                    if (!user.lastSeen || user.lastSeen === 0) {
                        return false; // Pas de lastSeen = considérer comme offline, ne pas inclure dans les actifs
                    }
                    return user.lastSeen > oneMinuteAgoFilter;
                })
                .map(user => {
                    // Mettre à jour automatiquement le statut basé sur lastSeen (ou updatedAt comme fallback)
                    const now = Date.now();
                    const tenMinutesAgo = now - (10 * 60 * 1000); // 10 minutes
                    const oneMinuteAgo = now - (1 * 60 * 1000); // 1 minute pour détecter les déconnexions plus rapidement
                    
                    // Utiliser lastSeen ou updatedAt comme fallback pour déterminer l'activité
                    // user.lastSeen peut être un Date, Timestamp, ou number (millisecondes)
                    let activityTimestamp = 0;
                    
                    // Convertir lastSeen en millisecondes
                    if (user.lastSeen) {
                        if (user.lastSeen instanceof Date) {
                            activityTimestamp = user.lastSeen.getTime();
                        } else if (user.lastSeen instanceof Timestamp) {
                            activityTimestamp = user.lastSeen.toMillis();
                        } else if (typeof user.lastSeen === 'number') {
                            activityTimestamp = user.lastSeen;
                        } else if (typeof user.lastSeen === 'object' && 'toMillis' in user.lastSeen) {
                            activityTimestamp = (user.lastSeen as any).toMillis();
                        }
                    }
                    
                    // Si pas de lastSeen, utiliser updatedAt comme fallback
                    if (activityTimestamp === 0 && user.updatedAt) {
                        if (user.updatedAt instanceof Date) {
                            activityTimestamp = user.updatedAt.getTime();
                        } else if (user.updatedAt instanceof Timestamp) {
                            activityTimestamp = user.updatedAt.toMillis();
                        } else if (typeof user.updatedAt === 'object' && 'toMillis' in user.updatedAt) {
                            activityTimestamp = (user.updatedAt as any).toMillis();
                        }
                    }
                    
                    // Debug: afficher les valeurs pour comprendre le problème
                    if (user.display_name === 'Jeunesse' || user.display_name?.toLowerCase().includes('jeunesse') || 
                        user.display_name === 'Walter' || user.display_name?.toLowerCase().includes('walter')) {
                        const diffMinutes = activityTimestamp > 0 ? Math.floor((now - activityTimestamp) / 60000) : 'N/A';
                        console.log('🔍 Debug User:', {
                            display_name: user.display_name,
                            currentPresence: user.presence,
                            lastSeen: user.lastSeen,
                            lastSeenType: typeof user.lastSeen,
                            updatedAt: user.updatedAt,
                            activityTimestamp,
                            now,
                            oneMinuteAgo,
                            tenMinutesAgo,
                            diffMinutes,
                            'activityTimestamp >= oneMinuteAgo': activityTimestamp >= oneMinuteAgo,
                            'activityTimestamp >= tenMinutesAgo': activityTimestamp >= tenMinutesAgo,
                            'activityTimestamp < oneMinuteAgo': activityTimestamp < oneMinuteAgo,
                            'activityTimestamp < tenMinutesAgo': activityTimestamp < tenMinutesAgo
                        });
                    }
                    
                    let newPresence = user.presence;
                    
                    // Si l'utilisateur est déjà marqué comme 'online', le garder online même sans lastSeen (connexion très récente)
                    if (user.presence === 'online' && activityTimestamp === 0) {
                        // Utilisateur vient de se connecter, garder online
                        newPresence = 'online';
                    } else if (user.presence === 'away' && activityTimestamp === 0) {
                        // Utilisateur vient de changer d'onglet (away), garder away même si lastSeen n'est pas encore propagé
                        // Le heartbeat mettra à jour lastSeen dans les prochaines secondes
                        newPresence = 'away';
                    } else if (activityTimestamp === 0) {
                        // Pas de lastSeen ni updatedAt = offline (jamais connecté ou profil ancien)
                        // Si l'utilisateur était online, le passer à offline immédiatement
                        if (user.presence === 'online') {
                            newPresence = 'offline';
                        } else if (user.presence !== 'away' && user.presence !== 'idle') {
                            newPresence = 'offline';
                        } else {
                            // Garder away/idle même sans lastSeen (mise à jour en cours)
                            newPresence = user.presence;
                        }
                    } else if (activityTimestamp >= oneMinuteAgo) {
                        // Actif dans la dernière minute = online
                        // activityTimestamp >= oneMinuteAgo signifie que l'activité est plus récente qu'il y a 1 minute
                        // SAUF si l'utilisateur est explicitement offline (déconnexion récente)
                        if (user.presence === 'offline' && activityTimestamp >= oneMinuteAgo) {
                            // Si offline ET activité récente (< 1 min), c'est une déconnexion explicite, garder offline
                            newPresence = 'offline';
                        } else {
                            newPresence = 'online';
                        }
                    } else if (activityTimestamp >= tenMinutesAgo) {
                        // Actif entre 1 et 10 minutes = away/idle (inactif)
                        // activityTimestamp >= tenMinutesAgo ET < oneMinuteAgo signifie que l'activité est entre 1 et 10 minutes
                        // TOUJOURS passer à away si l'activité est entre 1 et 10 minutes, peu importe le statut actuel
                        newPresence = 'away';
                    } else {
                        // Inactif depuis plus de 10 minutes = offline
                        // activityTimestamp < tenMinutesAgo signifie que l'activité est plus ancienne qu'il y a 10 minutes
                        newPresence = 'offline';
                    }
                    
                    // Mettre à jour le statut si nécessaire (de manière asynchrone pour ne pas bloquer)
                    // Ne pas mettre à jour si le statut reste le même (éviter les boucles)
                    // IMPORTANT: Ne pas mettre à jour updatedAt lors de la mise à jour automatique du statut
                    // car cela fausserait le calcul de lastSeen (updatedAt serait utilisé comme fallback)
                    if (newPresence !== user.presence && user.uid) {
                        // Mettre à jour dans Firestore de manière asynchrone
                        // Utiliser updateDoc directement pour éviter de mettre à jour updatedAt
                        const userRef = doc(db, USERS_COLLECTION, user.uid);
                        updateDoc(userRef, { presence: newPresence }).catch(console.error);
                    }
                    
                    return {
                        ...user,
                        presence: newPresence
                    };
                })
                .map(user => {
                    // Garder lastSeenOriginal pour l'affichage et préserver updatedAt
                    const { lastSeen, lastSeenOriginal, ...profile } = user;
                    return {
                        ...profile,
                        lastSeen: lastSeenOriginal,
                        // Préserver updatedAt si disponible
                        updatedAt: profile.updatedAt instanceof Timestamp ? profile.updatedAt :
                                   profile.updatedAt instanceof Date ? profile.updatedAt :
                                   profile.updatedAt ? new Date(profile.updatedAt as any) : undefined
                    } as UserProfile & { lastSeen?: Date | Timestamp; updatedAt?: Date | Timestamp };
                })
                .sort((a, b) => {
                    // Tri côté client par nom d'affichage
                    return (a.display_name || '').localeCompare(b.display_name || '');
                });
            
            callback(users);
        }, (error) => {
            console.error('Error subscribing to online users:', error);
        });

        return unsubscribe;
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
            const commentData: Omit<Comment, 'uid'> = {
                comment: text,
                created_at: new Date().toLocaleString('fr-FR', { timeZoneName: 'short' }),
                created_by: user.display_name || user.email.split('@')[0],
            };

            // Ajouter user_photo_url uniquement s'il a une valeur
            if (user.photo_url) {
                commentData.user_photo_url = user.photo_url;
            }

            const docRef = doc(collection(db, COMMENTS_COLLECTION));
            await setDoc(docRef, {
                ...commentData,
                uid: itemUid,
            });

            return {
                ...commentData,
                uid: itemUid,
            } as Comment;
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

    async getTenHomeMovies(): Promise<Movie[]> {
        try {
            // Récupérer tous les films non cachés
            const q = query(
                collection(db, MOVIES_COLLECTION),
                where('hidden', '==', false)
            );
            const querySnapshot = await getDocs(q);
            const allMovies = querySnapshot.docs.map(doc => doc.data() as Movie);

            // Mélanger aléatoirement les films (Fisher-Yates shuffle)
            const shuffled = [...allMovies];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            // Retourner 10 films aléatoires
            return shuffled.slice(0, 10);
        } catch (error) {
            console.error('Error getting ten home movies:', error);
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
    },

    async getTenHomeSeries(): Promise<Serie[]> {
        try {
            // Récupérer toutes les séries non cachées (exclure les podcasts)
            const q = query(
                collection(db, SERIES_COLLECTION),
                where('is_hidden', '==', false)
            );
            const querySnapshot = await getDocs(q);
            const allSeries = querySnapshot.docs
                .map(doc => doc.data() as Serie)
                .filter(serie => !serie.serie_type || serie.serie_type === 'serie');

            // Mélanger aléatoirement les séries (Fisher-Yates shuffle)
            const shuffled = [...allSeries];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            // Retourner 10 séries aléatoires
            return shuffled.slice(0, 10);
        } catch (error) {
            console.error('Error getting ten home series:', error);
            return [];
        }
    },

    async getTenHomePodcasts(): Promise<Serie[]> {
        try {
            // Récupérer tous les podcasts non cachés
            const q = query(
                collection(db, SERIES_COLLECTION),
                where('serie_type', '==', 'podcast'),
                where('is_hidden', '==', false)
            );
            const querySnapshot = await getDocs(q);
            const allPodcasts = querySnapshot.docs.map(doc => doc.data() as Serie);

            // Mélanger aléatoirement les podcasts (Fisher-Yates shuffle)
            const shuffled = [...allPodcasts];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            // Retourner 10 podcasts aléatoires
            return shuffled.slice(0, 10);
        } catch (error) {
            console.error('Error getting ten home podcasts:', error);
            return [];
        }
    },

    /**
     * Met à jour une série par son ID Firestore
     */
    async updateSerieById(id: string, updates: Partial<Serie>): Promise<void> {
        try {
            const serieRef = doc(db, SERIES_COLLECTION, id);
            await updateDoc(serieRef, updates as any);
        } catch (error) {
            console.error('Error updating serie:', error);
            throw error;
        }
    },

    /**
     * Met à jour une série par son UID
     */
    async updateSerieByUid(uid_serie: string, updates: Partial<Serie>): Promise<void> {
        try {
            const q = query(
                collection(db, SERIES_COLLECTION),
                where('uid_serie', '==', uid_serie),
                limit(1)
            );
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                throw new Error(`Série avec UID ${uid_serie} non trouvée`);
            }

            const serieRef = doc(db, SERIES_COLLECTION, snapshot.docs[0].id);
            await updateDoc(serieRef, updates as any);
        } catch (error) {
            console.error('Error updating serie by UID:', error);
            throw error;
        }
    },
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

    /**
     * Met à jour une saison par son ID Firestore
     */
    async updateSeasonById(id: string, updates: Partial<SeasonSerie>): Promise<void> {
        try {
            const seasonRef = doc(db, SEASONS_SERIES_COLLECTION, id);
            await updateDoc(seasonRef, {
                ...updates,
                updatedAt: new Date().toISOString()
            } as any);
        } catch (error) {
            console.error('Error updating season:', error);
            throw error;
        }
    },

    /**
     * Met à jour une saison par son UID
     */
    async updateSeasonByUid(uid_season: string, updates: Partial<SeasonSerie>): Promise<void> {
        try {
            const q = query(
                collection(db, SEASONS_SERIES_COLLECTION),
                where('uid_season', '==', uid_season),
                limit(1)
            );
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                throw new Error(`Saison avec UID ${uid_season} non trouvée`);
            }

            const seasonRef = doc(db, SEASONS_SERIES_COLLECTION, snapshot.docs[0].id);
            await updateDoc(seasonRef, {
                ...updates,
                updatedAt: new Date().toISOString()
            } as any);
        } catch (error) {
            console.error('Error updating season by UID:', error);
            throw error;
        }
    },
};

// Fonction utilitaire pour calculer et mettre à jour les vues des épisodes
/**
 * Récupère la dernière position de lecture d'un épisode pour un utilisateur donné
 * @param userId ID de l'utilisateur
 * @param episodeUid UID de l'épisode
 * @returns La dernière position de lecture en secondes, ou 0 si non trouvée
 */
export const getLastWatchedPosition = async (userId: string, episodeUid: string): Promise<number> => {
    try {
        // Trouver la référence de l'épisode à partir de son UID
        const episodeQuery = query(
            collection(db, EPISODES_SERIES_COLLECTION),
            where('uid_episode', '==', episodeUid),
            limit(1)
        );
        const episodeSnapshot = await getDocs(episodeQuery);
        
        if (episodeSnapshot.empty) return 0;
        
        const episodeRef = doc(db, EPISODES_SERIES_COLLECTION, episodeSnapshot.docs[0].id);
        
        // Rechercher la position de lecture avec la référence de l'épisode
        const q = query(
            collection(db, STATS_VUES_COLLECTION),
            where('idEpisodeSerie', '==', episodeRef),
            where('user', '==', doc(db, USERS_COLLECTION, userId)),
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const stats = querySnapshot.docs[0].data() as StatsVues;
            return stats.tempsRegarde || 0;
        }
        
        return 0;
    } catch (error) {
        console.error('Erreur lors de la récupération de la position de lecture:', error);
        return 0;
    }
};

/**
 * Récupère la dernière position de lecture d'un film pour un utilisateur donné
 * @param userId ID de l'utilisateur
 * @param movieId ID du film
 * @returns La dernière position de lecture en secondes, ou 0 si non trouvée
 */
export const getLastWatchedPositionForMovie = async (userId: string, movieId: string): Promise<number> => {
    try {
        const q = query(
            collection(db, STATS_VUES_COLLECTION),
            where('uid', '==', movieId),
            where('user', '==', doc(db, USERS_COLLECTION, userId)),
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const stats = querySnapshot.docs[0].data() as StatsVues;
            return stats.tempsRegarde || 0;
        }
        
        return 0;
    } catch (error) {
        console.error('Erreur lors de la récupération de la position de lecture du film:', error);
        return 0;
    }
};

export const updateEpisodeViews = async (): Promise<void> => {
    try {
        console.log('Début du calcul des vues des épisodes...');

        // 1. Récupérer tous les documents de la collection statsVues
        const statsVuesSnapshot = await getDocs(collection(db, 'statsVues'));

        // 2. Grouper les vues par idEpisodeSerie
        const viewsByEpisode: { [key: string]: number } = {};

        statsVuesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.idEpisodeSerie) {
                const episodeRef = data.idEpisodeSerie;
                const episodeId = typeof episodeRef === 'string' ? episodeRef : episodeRef.id;
                const counter = data.counter || 0;

                if (!viewsByEpisode[episodeId]) {
                    viewsByEpisode[episodeId] = 0;
                }
                viewsByEpisode[episodeId] += counter;
            }
        });

        console.log(`Nombre d'épisodes trouvés dans statsVues: ${Object.keys(viewsByEpisode).length}`);

        // 3. Mettre à jour chaque épisode avec le nombre total de vues
        const BATCH_LIMIT = 500;
        let batch = writeBatch(db);
        let batchCount = 0;
        let totalProcessed = 0;

        for (const [episodeId, totalViews] of Object.entries(viewsByEpisode)) {
            try {
                const episodeRef = doc(db, EPISODES_SERIES_COLLECTION, episodeId);

                // Vérifier si le document existe avant de l'ajouter au batch
                const episodeDoc = await getDoc(episodeRef);

                if (episodeDoc.exists()) {
                    batch.update(episodeRef, { views: totalViews });
                    batchCount++;
                    totalProcessed++;

                    // Exécuter le batch par lots de BATCH_LIMIT (limite Firestore)
                    if (batchCount >= BATCH_LIMIT) {
                        await batch.commit();
                        console.log(`Lot de ${batchCount} mises à jour effectué (${totalProcessed}/${Object.keys(viewsByEpisode).length} au total)`);
                        batch = writeBatch(db); // Créer un nouveau batch
                        batchCount = 0;
                    }
                } else {
                    console.warn(`L'épisode ${episodeId} n'existe pas dans la collection ${EPISODES_SERIES_COLLECTION}`);
                    totalProcessed++; // On l'inclut dans le total traité
                }
            } catch (error) {
                console.error(`Erreur lors de la mise à jour de l'épisode ${episodeId}:`, error);
                // Continuer avec les autres mises à jour même en cas d'erreur
                totalProcessed++;
            }
        }

        // Exécuter le dernier lot s'il reste des opérations
        if (batchCount > 0) {
            await batch.commit();
            console.log(`Dernier lot de ${batchCount} mises à jour effectué (${totalProcessed}/${Object.keys(viewsByEpisode).length} au total)`);
        }

        console.log('Mise à jour des vues terminée avec succès !');
        return Promise.resolve();
    } catch (error) {
        console.error('Erreur lors de la mise à jour des vues des épisodes:', error);
        return Promise.reject(error);
    }
};

// Initialise les vues des films (mise à jour par lots de 100)
export const initializeMovieViews = async (): Promise<{ success: boolean; updated: number }> => {
    try {
        console.log('Début de l\'initialisation des vues des films...');

        // Récupérer les films par lots de 100 pour limiter les lectures
        const moviesQuery = query(
            collection(db, 'movies'),
            limit(100)  // Limite pour éviter de trop charger
        );

        const snapshot = await getDocs(moviesQuery);

        if (snapshot.empty) {
            console.log('Aucun film trouvé');
            return { success: true, updated: 0 };
        }

        // Filtrer les films qui n'ont pas de champ views
        const moviesToUpdate = snapshot.docs.filter(doc =>
            doc.data().views === undefined
        );

        if (moviesToUpdate.length === 0) {
            console.log('Tous les films ont déjà un champ views');
            return { success: true, updated: 0 };
        }

        console.log(`Mise à jour de ${moviesToUpdate.length} films...`);

        // Mettre à jour les films en un seul lot
        const batch = writeBatch(db);
        moviesToUpdate.forEach(doc => {
            batch.update(doc.ref, { views: 0 });
        });

        await batch.commit();
        console.log(`${moviesToUpdate.length} films mis à jour avec succès`);

        return { success: true, updated: moviesToUpdate.length };
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des vues des films:', error);
        return { success: false, updated: 0 };
    }
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

    /**
     * Met à jour un épisode par son ID Firestore
     */
    async updateEpisodeById(id: string, updates: Partial<EpisodeSerie>): Promise<void> {
        try {
            const episodeRef = doc(db, EPISODES_SERIES_COLLECTION, id);
            await updateDoc(episodeRef, {
                ...updates,
                updatedAt: new Date().toISOString()
            } as any);
        } catch (error) {
            console.error('Error updating episode:', error);
            throw error;
        }
    },

    /**
     * Met à jour un épisode par son UID
     */
    async updateEpisodeByUid(uid_episode: string, updates: Partial<EpisodeSerie>): Promise<void> {
        try {
            const q = query(
                collection(db, EPISODES_SERIES_COLLECTION),
                where('uid_episode', '==', uid_episode),
                limit(1)
            );
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                throw new Error(`Épisode avec UID ${uid_episode} non trouvé`);
            }

            const episodeRef = doc(db, EPISODES_SERIES_COLLECTION, snapshot.docs[0].id);
            await updateDoc(episodeRef, {
                ...updates,
                updatedAt: new Date().toISOString()
            } as any);
        } catch (error) {
            console.error('Error updating episode by UID:', error);
            throw error;
        }
    },
};

// Services pour les catégories de séries
export const serieCategoryService = {
    /**
     * Récupère toutes les catégories
     */
    async getAllCategories(): Promise<SerieCategory[]> {
        try {
            const q = query(
                collection(db, SERIE_CATEGORIES_COLLECTION),
                orderBy('order', 'asc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as SerieCategory));
        } catch (error) {
            console.error('Error getting all categories:', error);
            return [];
        }
    },

    /**
     * Récupère une catégorie par son ID
     */
    async getCategoryById(id: string): Promise<SerieCategory | null> {
        try {
            const categoryDoc = await getDoc(doc(db, SERIE_CATEGORIES_COLLECTION, id));
            if (categoryDoc.exists()) {
                return {
                    id: categoryDoc.id,
                    ...categoryDoc.data()
                } as SerieCategory;
            }
            return null;
        } catch (error) {
            console.error('Error getting category by ID:', error);
            return null;
        }
    },

    /**
     * Crée une nouvelle catégorie
     */
    async createCategory(category: Omit<SerieCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        try {
            const now = new Date().toISOString();
            const categoryData = {
                ...category,
                createdAt: now,
                updatedAt: now,
                order: category.order || 0
            };
            const docRef = await addDoc(collection(db, SERIE_CATEGORIES_COLLECTION), categoryData);
            return docRef.id;
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    },

    /**
     * Met à jour une catégorie
     */
    async updateCategory(id: string, updates: Partial<Omit<SerieCategory, 'id' | 'createdAt'>>): Promise<void> {
        try {
            const categoryRef = doc(db, SERIE_CATEGORIES_COLLECTION, id);
            await updateDoc(categoryRef, {
                ...updates,
                updatedAt: new Date().toISOString()
            } as any);
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    },

    /**
     * Supprime une catégorie
     */
    async deleteCategory(id: string): Promise<void> {
        try {
            const categoryRef = doc(db, SERIE_CATEGORIES_COLLECTION, id);
            await deleteDoc(categoryRef);
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    },

    /**
     * Récupère les séries d'une catégorie
     */
    async getSeriesByCategory(categoryId: string): Promise<Serie[]> {
        try {
            const q = query(
                collection(db, SERIES_COLLECTION),
                where('categoryId', '==', categoryId),
                where('is_hidden', '==', false)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as Serie);
        } catch (error) {
            console.error('Error getting series by category:', error);
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
    dateDernierUpdate: Date | Timestamp;
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
                            // Utiliser le titre de l'épisode, ou combiner série + épisode si disponible
                            const displayTitle = episode.title || `${episode.title_serie} - Épisode ${episode.episode_numero}`;
                            
                            continueWatchingItems.push({
                                id: docSnapshot.id,
                                uid: data.uid || episode.uid_episode || episodeDoc.id, // Fallback sur l'ID du document
                                title: displayTitle,
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

    async updateViewingProgress(
        userUid: string,
        videoUid: string,
        currentTime: number, // en secondes
        isEpisode: boolean = false
    ): Promise<void> {
        try {
            const userRef = doc(db, USERS_COLLECTION, userUid);
            const now = new Date().toISOString();

            // Si c'est un épisode, on récupère d'abord la référence de l'épisode
            let episodeRef: DocumentReference | null = null;
            if (isEpisode) {
                const episodeQuery = query(
                    collection(db, EPISODES_SERIES_COLLECTION),
                    where('uid_episode', '==', videoUid),
                    limit(1)
                );
                const episodeSnapshot = await getDocs(episodeQuery);
                if (!episodeSnapshot.empty) {
                    episodeRef = doc(db, EPISODES_SERIES_COLLECTION, episodeSnapshot.docs[0].id);

                    // Vérifier s'il existe déjà une entrée avec le même idEpisodeSerie et le même utilisateur
                    const existingByEpisodeRef = query(
                        collection(db, STATS_VUES_COLLECTION),
                        where('user', '==', userRef),
                        where('idEpisodeSerie', '==', episodeRef)
                    );

                    const existingByEpisodeSnapshot = await getDocs(existingByEpisodeRef);

                    if (!existingByEpisodeSnapshot.empty) {
                        // Mise à jour de l'entrée existante avec le même idEpisodeSerie
                        const docRef = existingByEpisodeSnapshot.docs[0].ref;
                        await updateDoc(docRef, {
                            tempsRegarde: currentTime,
                            dateDernierUpdate: Timestamp.now(),
                            uid: videoUid, // Mettre à jour l'UID avec la nouvelle valeur
                            isEpisode: true
                        });
                        return;
                    }
                }
            }

            // Vérifier s'il existe déjà une entrée pour cet utilisateur et cette vidéo (par UID)
            const q = query(
                collection(db, STATS_VUES_COLLECTION),
                where('user', '==', userRef),
                where('uid', '==', videoUid)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Mise à jour de l'entrée existante
                const docRef = querySnapshot.docs[0].ref;
                const updateData: any = {
                    tempsRegarde: currentTime,
                    dateDernierUpdate: Timestamp.now(),
                    isEpisode: isEpisode
                };

                // Si on a une référence d'épisode, on l'ajoute
                if (episodeRef) {
                    updateData.idEpisodeSerie = episodeRef;
                }

                await updateDoc(docRef, updateData);
            } else {
                // Création d'une nouvelle entrée
                const newViewData: Omit<StatsVues, 'id'> = {
                    uid: videoUid,
                    user: userRef,
                    tempsRegarde: currentTime,
                    dateDernierUpdate: Timestamp.now(),
                    nombreLectures: 1, // Première lecture
                    isEpisode: isEpisode,
                    ...(episodeRef && { idEpisodeSerie: episodeRef })
                };

                await addDoc(collection(db, STATS_VUES_COLLECTION), newViewData);
            }
        } catch (error) {
            console.error('Error updating viewing progress:', error);
            throw error;
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

                        // Utiliser le titre de l'épisode comme titre principal
                        const displayTitle = episode.title || `${episode.title_serie} - Épisode ${episode.episode_numero}`;

                        historyItems.push({
                            id: docSnapshot.id,
                            uid: data.uid || episode.uid_episode || episodeDoc.id,
                            title: displayTitle,
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


// Service pour gérer les vues des vidéos
export const viewService = {
    /**
     * Enregistre une vue pour un film ou un épisode
     * @param uid - uid du film ou uid_episode de l'épisode
     * @param videoType - 'movie' ou 'episode'
     * @param userUid - uid de l'utilisateur
     */
    async recordView(uid: string, videoType: 'movie' | 'episode', userUid: string): Promise<void> {
        try {
            // Créer le document de vue
            const viewData: UserView = {
                view_date: new Date().toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'short'
                }),
                uid: uid,
                video_type: videoType,
                user_uid: userUid
            };

            // Ajouter le document à la collection user_view
            await setDoc(doc(collection(db, USER_VIEW_COLLECTION)), viewData);

            // Incrémenter le compteur de vues dans la collection correspondante
            if (videoType === 'movie') {
                await this.incrementMovieViews(uid);
            } else if (videoType === 'episode') {
                await this.incrementEpisodeViews(uid);
            }

            console.log(`Vue enregistrée pour ${videoType} ${uid}`);
        } catch (error) {
            console.error('Error recording view:', error);
            throw error;
        }
    },

    /**
     * Incrémente le compteur de vues d'un film
     */
    async incrementMovieViews(movieUid: string): Promise<void> {
        try {
            // Trouver le document du film par son uid
            const q = query(
                collection(db, MOVIES_COLLECTION),
                where('uid', '==', movieUid),
                limit(1)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const movieDoc = querySnapshot.docs[0];
                const currentViews = movieDoc.data().views || 0;

                await updateDoc(movieDoc.ref, {
                    views: currentViews + 1
                });
            }
        } catch (error) {
            console.error('Error incrementing movie views:', error);
        }
    },

    /**
     * Incrémente le compteur de vues d'un épisode
     */
    async incrementEpisodeViews(episodeUid: string): Promise<void> {
        try {
            // Trouver le document de l'épisode par son uid_episode
            const q = query(
                collection(db, EPISODES_SERIES_COLLECTION),
                where('uid_episode', '==', episodeUid),
                limit(1)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const episodeDoc = querySnapshot.docs[0];
                const currentViews = episodeDoc.data().views || 0;

                await updateDoc(episodeDoc.ref, {
                    views: currentViews + 1
                });
            }
        } catch (error) {
            console.error('Error incrementing episode views:', error);
        }
    },

    /**
     * Récupère le nombre de vues pour un film ou un épisode
     */
    async getViewCount(uid: string, videoType: 'movie' | 'episode'): Promise<number> {
        try {
            const q = query(
                collection(db, USER_VIEW_COLLECTION),
                where('uid', '==', uid),
                where('video_type', '==', videoType)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.size;
        } catch (error) {
            console.error('Error getting view count:', error);
            return 0;
        }
    },

    /**
     * Vérifie si un utilisateur a déjà vu une vidéo
     */
    async hasUserViewed(uid: string, videoType: 'movie' | 'episode', userUid: string): Promise<boolean> {
        try {
            const q = query(
                collection(db, USER_VIEW_COLLECTION),
                where('uid', '==', uid),
                where('video_type', '==', videoType),
                where('user_uid', '==', userUid),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error('Error checking if user viewed:', error);
            return false;
        }
    },

    /**
     * Récupère les films et épisodes les plus vus
     * @param limitCount Nombre maximum d'éléments à retourner
     * @returns Un tableau d'objets contenant l'uid, le type (movie ou episode), le nombre de vues et le titre
     */
    async getMostWatchedItems(limitCount: number = 10): Promise<Array<{ uid: string; type: 'movie' | 'episode'; viewCount: number; title: string }>> {
        try {
            const watchedItems: Array<{ uid: string; type: 'movie' | 'episode'; viewCount: number; title: string }> = [];

            // Récupérer tous les films avec leurs vues
            const moviesQuery = query(
                collection(db, MOVIES_COLLECTION),
                where('hidden', '==', false),
                where('views', '>', 0)
            );
            const moviesSnapshot = await getDocs(moviesQuery);

            moviesSnapshot.docs.forEach(doc => {
                const movie = doc.data() as Movie;
                if (movie.views) {
                    watchedItems.push({
                        uid: movie.uid,
                        type: 'movie',
                        viewCount: movie.views,
                        title: movie.title
                    });
                }
            });

            // Récupérer tous les épisodes avec leurs vues
            const episodesQuery = query(
                collection(db, EPISODES_SERIES_COLLECTION),
                where('hidden', '==', false),
                where('views', '>', 0)
            );
            const episodesSnapshot = await getDocs(episodesQuery);

            episodesSnapshot.docs.forEach(doc => {
                const episode = doc.data() as EpisodeSerie;
                if (episode.views) {
                    watchedItems.push({
                        uid: episode.uid_episode,
                        type: 'episode',
                        viewCount: episode.views,
                        title: episode.title
                    });
                }
            });

            // Trier par nombre de vues décroissant et limiter le résultat
            const sortedItems = watchedItems
                .sort((a, b) => b.viewCount - a.viewCount)
                .slice(0, limitCount);

            return sortedItems;
        } catch (error) {
            console.error('Error getting most watched items:', error);
            return [];
        }
    }
};

// Service pour les métriques utilisateurs
export const userMetricsService = {
    /**
     * Top 10 utilisateurs qui se connectent le plus
     * Basé sur le nombre de fois où presence passe à 'online' (estimé via lastSeen)
     */
    async getTop10MostConnectedUsers(): Promise<Array<{ user: UserProfile; connectionCount: number }>> {
        try {
            const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
            const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);
            
            // Calculer le nombre de connexions estimé basé sur lastSeen et createdAt
            const usersWithConnections = users.map(user => {
                let connectionCount = 0;
                
                // Si l'utilisateur a un lastSeen récent, c'est qu'il s'est connecté récemment
                if (user.lastSeen) {
                    const lastSeenDate = user.lastSeen instanceof Date 
                        ? user.lastSeen 
                        : user.lastSeen instanceof Timestamp 
                            ? user.lastSeen.toDate() 
                            : new Date(user.lastSeen);
                    
                    const createdAtDate = user.createdAt instanceof Date 
                        ? user.createdAt 
                        : user.createdAt instanceof Timestamp 
                            ? user.createdAt.toDate() 
                            : new Date(user.created_time || Date.now());
                    
                    // Estimer le nombre de connexions basé sur la fréquence de lastSeen
                    const daysSinceCreation = Math.max(1, (Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24));
                    const daysSinceLastSeen = (Date.now() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24);
                    
                    // Si l'utilisateur est actif (online/away), estimer les connexions
                    if (user.presence === 'online' || user.presence === 'away') {
                        // Estimer 1 connexion par jour d'activité
                        connectionCount = Math.max(1, Math.floor(daysSinceCreation / Math.max(1, daysSinceLastSeen)));
                    }
                }
                
                return { user, connectionCount };
            });
            
            return usersWithConnections
                .sort((a, b) => b.connectionCount - a.connectionCount)
                .slice(0, 10);
        } catch (error) {
            console.error('Error getting top 10 most connected users:', error);
            return [];
        }
    },

    /**
     * Temps moyen de session (durée moyenne en ligne)
     */
    async getAverageSessionDuration(): Promise<number> {
        try {
            const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
            const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);
            
            let totalSessionTime = 0;
            let activeUsersCount = 0;
            
            users.forEach(user => {
                if (user.lastSeen && (user.presence === 'online' || user.presence === 'away')) {
                    const lastSeenDate = user.lastSeen instanceof Date 
                        ? user.lastSeen 
                        : user.lastSeen instanceof Timestamp 
                            ? user.lastSeen.toDate() 
                            : new Date(user.lastSeen);
                    
                    // Estimer la durée de session basée sur lastSeen
                    const sessionDuration = Date.now() - lastSeenDate.getTime();
                    
                    // Si la session est récente (< 1 heure), l'inclure
                    if (sessionDuration < 3600000) { // 1 heure en ms
                        totalSessionTime += sessionDuration;
                        activeUsersCount++;
                    }
                }
            });
            
            return activeUsersCount > 0 ? totalSessionTime / activeUsersCount : 0;
        } catch (error) {
            console.error('Error getting average session duration:', error);
            return 0;
        }
    },

    /**
     * Top 10 utilisateurs les plus actifs (basé sur le nombre de vues)
     */
    async getTop10MostActiveUsers(): Promise<Array<{ user: UserProfile; viewCount: number }>> {
        try {
            const viewsSnapshot = await getDocs(collection(db, USER_VIEW_COLLECTION));
            const views = viewsSnapshot.docs.map(doc => doc.data() as UserView);
            
            // Compter les vues par utilisateur
            const viewCountByUser: Record<string, number> = {};
            views.forEach(view => {
                viewCountByUser[view.user_uid] = (viewCountByUser[view.user_uid] || 0) + 1;
            });
            
            // Récupérer les profils utilisateurs
            const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
            const usersMap = new Map<string, UserProfile>();
            usersSnapshot.docs.forEach(doc => {
                const user = doc.data() as UserProfile;
                usersMap.set(user.uid, user);
            });
            
            // Créer la liste des utilisateurs avec leur nombre de vues
            const usersWithViews = Object.entries(viewCountByUser)
                .map(([uid, viewCount]) => ({
                    user: usersMap.get(uid)!,
                    viewCount
                }))
                .filter(item => item.user) // Filtrer les utilisateurs qui n'existent plus
                .sort((a, b) => b.viewCount - a.viewCount)
                .slice(0, 10);
            
            return usersWithViews;
        } catch (error) {
            console.error('Error getting top 10 most active users:', error);
            return [];
        }
    },

    /**
     * Heures de pointe (heures où les utilisateurs se connectent le plus)
     */
    async getPeakHours(): Promise<Array<{ hour: number; connectionCount: number }>> {
        try {
            const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
            const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);
            
            // Compter les connexions par heure (basé sur lastSeen)
            const hourCounts: Record<number, number> = {};
            
            users.forEach(user => {
                if (user.lastSeen) {
                    const lastSeenDate = user.lastSeen instanceof Date 
                        ? user.lastSeen 
                        : user.lastSeen instanceof Timestamp 
                            ? user.lastSeen.toDate() 
                            : new Date(user.lastSeen);
                    
                    const hour = lastSeenDate.getHours();
                    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                }
            });
            
            // Convertir en tableau et trier
            return Object.entries(hourCounts)
                .map(([hour, count]) => ({ hour: parseInt(hour), connectionCount: count }))
                .sort((a, b) => b.connectionCount - a.connectionCount)
                .slice(0, 5); // Top 5 heures
        } catch (error) {
            console.error('Error getting peak hours:', error);
            return [];
        }
    },

    /**
     * Top 10 utilisateurs avec le plus de temps total en ligne
     */
    async getTop10TotalOnlineTime(): Promise<Array<{ user: UserProfile; totalOnlineTime: number }>> {
        try {
            const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
            const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);
            
            const usersWithTime = users.map(user => {
                let totalOnlineTime = 0;
                
                if (user.lastSeen && user.createdAt) {
                    const lastSeenDate = user.lastSeen instanceof Date 
                        ? user.lastSeen 
                        : user.lastSeen instanceof Timestamp 
                            ? user.lastSeen.toDate() 
                            : new Date(user.lastSeen);
                    
                    const createdAtDate = user.createdAt instanceof Date 
                        ? user.createdAt 
                        : user.createdAt instanceof Timestamp 
                            ? user.createdAt.toDate() 
                            : new Date(user.created_time || Date.now());
                    
                    // Estimer le temps total en ligne basé sur la différence entre createdAt et lastSeen
                    // Si l'utilisateur est actif, ajouter le temps depuis lastSeen
                    if (user.presence === 'online' || user.presence === 'away') {
                        totalOnlineTime = Date.now() - createdAtDate.getTime();
                    } else {
                        totalOnlineTime = lastSeenDate.getTime() - createdAtDate.getTime();
                    }
                }
                
                return { user, totalOnlineTime };
            });
            
            return usersWithTime
                .sort((a, b) => b.totalOnlineTime - a.totalOnlineTime)
                .slice(0, 10);
        } catch (error) {
            console.error('Error getting top 10 total online time:', error);
            return [];
        }
    }
};

// Service pour les statistiques géographiques des utilisateurs
export const userGeographyService = {
    /**
     * Récupère la répartition des utilisateurs par pays
     * @returns Un tableau avec les statistiques par pays
     */
    async getUsersByCountry(): Promise<Array<{ countryCode: string; countryName: string; userCount: number; percentage: number }>> {
        try {
            const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
            const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);
            
            // Compter les utilisateurs par pays
            const countryCounts: Record<string, number> = {};
            let totalUsersWithCountry = 0;
            
            users.forEach(user => {
                if (user.country && user.country.trim()) {
                    countryCounts[user.country] = (countryCounts[user.country] || 0) + 1;
                    totalUsersWithCountry++;
                }
            });
            
            // Convertir en tableau et calculer les pourcentages
            const countryStats = Object.entries(countryCounts)
                .map(([countryCode, userCount]) => {
                    const countryName = getCountryName(countryCode);
                    return {
                        countryCode,
                        countryName,
                        userCount,
                        percentage: totalUsersWithCountry > 0 ? (userCount / totalUsersWithCountry) * 100 : 0
                    };
                })
                .sort((a, b) => b.userCount - a.userCount); // Trier par nombre d'utilisateurs décroissant
            
            return countryStats;
        } catch (error) {
            console.error('Error getting users by country:', error);
            return [];
        }
    },

    /**
     * Récupère le nombre total d'utilisateurs avec un pays renseigné
     */
    async getTotalUsersWithCountry(): Promise<number> {
        try {
            const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
            const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);
            return users.filter(user => user.country && user.country.trim()).length;
        } catch (error) {
            console.error('Error getting total users with country:', error);
            return 0;
        }
    },

    /**
     * Récupère le nombre total d'utilisateurs avec un numéro de téléphone renseigné
     */
    async getTotalUsersWithPhoneNumber(): Promise<number> {
        try {
            const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
            const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);
            return users.filter(user => user.phoneNumber && user.phoneNumber.trim()).length;
        } catch (error) {
            console.error('Error getting total users with phone number:', error);
            return 0;
        }
    },

    /**
     * Récupère le nombre total d'utilisateurs ayant complété le formulaire (pays ET numéro de téléphone)
     */
    async getTotalUsersWithCompleteProfile(): Promise<number> {
        try {
            const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
            const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);
            return users.filter(user => 
                user.country && user.country.trim() && 
                user.phoneNumber && user.phoneNumber.trim()
            ).length;
        } catch (error) {
            console.error('Error getting total users with complete profile:', error);
            return 0;
        }
    },

    /**
     * Récupère le nombre total d'utilisateurs
     */
    async getTotalUsers(): Promise<number> {
        try {
            const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
            return usersSnapshot.docs.length;
        } catch (error) {
            console.error('Error getting total users:', error);
            return 0;
        }
    },

    /**
     * Récupère le nombre d'utilisateurs ayant accepté la politique RGPD
     */
    async getTotalUsersWithRGPDConsent(): Promise<number> {
        try {
            const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
            const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);
            return users.filter(user => user.hasAcceptedPrivacyPolicy === true).length;
        } catch (error) {
            console.error('Error getting total users with RGPD consent:', error);
            return 0;
        }
    },

    /**
     * Récupère tous les utilisateurs d'un pays spécifique
     * @param countryCode Code pays (ex: "FR", "US")
     * @returns Liste des utilisateurs du pays
     */
    async getUsersByCountryCode(countryCode: string): Promise<UserProfile[]> {
        try {
            const q = query(
                collection(db, USERS_COLLECTION),
                where('country', '==', countryCode)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            } as UserProfile));
        } catch (error) {
            console.error('Error getting users by country code:', error);
            return [];
        }
    }
};

// Fonction utilitaire pour obtenir le nom du pays à partir du code
function getCountryName(countryCode: string): string {
    const countryNames: Record<string, string> = {
        'FR': 'France',
        'US': 'États-Unis',
        'CA': 'Canada',
        'GB': 'Royaume-Uni',
        'DE': 'Allemagne',
        'ES': 'Espagne',
        'IT': 'Italie',
        'BE': 'Belgique',
        'CH': 'Suisse',
        'CM': 'Cameroun',
        'SN': 'Sénégal',
        'CI': 'Côte d\'Ivoire',
        'ML': 'Mali',
        'BF': 'Burkina Faso',
        'NE': 'Niger',
        'TD': 'Tchad',
        'CF': 'République centrafricaine',
        'GA': 'Gabon',
        'CG': 'Congo',
        'CD': 'République démocratique du Congo',
        'GN': 'Guinée',
        'BJ': 'Bénin',
        'TG': 'Togo',
        'GH': 'Ghana',
        'NG': 'Nigeria',
        'AO': 'Angola',
        'ZA': 'Afrique du Sud',
        'KE': 'Kenya',
        'TZ': 'Tanzanie',
        'UG': 'Ouganda',
        'RW': 'Rwanda',
        'ET': 'Éthiopie',
        'MG': 'Madagascar',
        'MU': 'Maurice',
        'RE': 'La Réunion',
        'MQ': 'Martinique',
        'GP': 'Guadeloupe',
        'GF': 'Guyane française',
        'PF': 'Polynésie française',
        'NC': 'Nouvelle-Calédonie',
        'YT': 'Mayotte',
        'PM': 'Saint-Pierre-et-Miquelon',
        'BL': 'Saint-Barthélemy',
        'MF': 'Saint-Martin',
        'WF': 'Wallis-et-Futuna'
    };
    
    return countryNames[countryCode] || countryCode;
}

// Export du service d'abonnement
export { subscriptionService } from './subscriptionService';

// Interface pour les messages d'information
export interface InfoBarMessage {
    id: string;
    message: string;
    isActive: boolean;
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
    createdBy?: string;
}

// Collection pour les messages d'information
const INFO_BAR_COLLECTION = 'infoBarMessages';

// Service pour gérer les messages d'information
export const infoBarService = {
    /**
     * Récupère le message actif
     */
    /**
     * Récupère le message actif (pour compatibilité)
     * @deprecated Utilisez getAllActiveMessages() pour récupérer tous les messages actifs
     */
    async getActiveMessage(): Promise<InfoBarMessage | null> {
        try {
            const activeMessages = await this.getAllActiveMessages();
            return activeMessages.length > 0 ? activeMessages[0] : null;
        } catch (error) {
            console.error('Error getting active info bar message:', error);
            return null;
        }
    },

    /**
     * Récupère tous les messages actifs
     */
    async getAllActiveMessages(): Promise<InfoBarMessage[]> {
        try {
            const q = query(
                collection(db, INFO_BAR_COLLECTION),
                where('isActive', '==', true)
            );
            const querySnapshot = await getDocs(q);

            const messages = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    message: data.message || '',
                    isActive: data.isActive || false,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    createdBy: data.createdBy
                };
            });

            // Trier par updatedAt décroissant
            messages.sort((a, b) => {
                const dateA = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
                const dateB = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
                return dateB - dateA;
            });

            return messages;
        } catch (error) {
            console.error('Error getting all active info bar messages:', error);
            return [];
        }
    },

    /**
     * Crée un nouveau message d'information
     */
    /**
     * Crée un nouveau message d'information
     * Le nouveau message est créé comme inactif par défaut
     */
    async createMessage(message: string, userId: string): Promise<string> {
        try {
            const newMessageRef = doc(collection(db, INFO_BAR_COLLECTION));
            await setDoc(newMessageRef, {
                message: message.trim(),
                isActive: false, // Créé comme inactif par défaut
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                createdBy: userId
            });

            return newMessageRef.id;
        } catch (error) {
            console.error('Error creating info bar message:', error);
            throw error;
        }
    },

    /**
     * Met à jour un message existant
     */
    async updateMessage(messageId: string, message: string, userId: string): Promise<void> {
        try {
            const messageRef = doc(db, INFO_BAR_COLLECTION, messageId);
            await updateDoc(messageRef, {
                message,
                updatedAt: Timestamp.now(),
                createdBy: userId
            });
        } catch (error) {
            console.error('Error updating info bar message:', error);
            throw error;
        }
    },

    /**
     * Active ou désactive un message
     * Permet maintenant plusieurs messages actifs en même temps
     */
    async setMessageActive(messageId: string, isActive: boolean): Promise<void> {
        try {
            const messageRef = doc(db, INFO_BAR_COLLECTION, messageId);
            await updateDoc(messageRef, {
                isActive: isActive,
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            console.error('Error setting message active:', error);
            throw error;
        }
    },

    /**
     * Récupère tous les messages (pour l'admin)
     */
    async getAllMessages(): Promise<InfoBarMessage[]> {
        try {
            const q = query(
                collection(db, INFO_BAR_COLLECTION),
                orderBy('updatedAt', 'desc')
            );
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    message: data.message || '',
                    isActive: data.isActive || false,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    createdBy: data.createdBy
                };
            });
        } catch (error) {
            console.error('Error getting all info bar messages:', error);
            return [];
        }
    },

    /**
     * Supprime un message
     */
    async deleteMessage(messageId: string): Promise<void> {
        try {
            const messageRef = doc(db, INFO_BAR_COLLECTION, messageId);
            await deleteDoc(messageRef);
        } catch (error) {
            console.error('Error deleting info bar message:', error);
            throw error;
        }
    }
};

// Interface pour les paramètres globaux de l'application
export interface AppSettings {
    homeViewMode: 'default' | 'prime' | 'netflix';
    updatedAt: Date | Timestamp;
    updatedBy?: string;
    premiumForAll?: boolean;
}

// Service pour gérer les paramètres globaux de l'application
export const appSettingsService = {
    /**
     * Récupère les paramètres globaux de l'application
     */
    async getAppSettings(): Promise<AppSettings | null> {
        try {
            const settingsRef = doc(db, APP_SETTINGS_COLLECTION, 'global');
            const settingsDoc = await getDoc(settingsRef);

            if (settingsDoc.exists()) {
                const data = settingsDoc.data();
                return {
                    homeViewMode: data.homeViewMode || 'default',
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    updatedBy: data.updatedBy
                };
            }

            // Si aucun paramètre n'existe, créer les paramètres par défaut
            const defaultSettings: AppSettings = {
                homeViewMode: 'default',
                premiumForAll: false,
                updatedAt: new Date()
            };
            await setDoc(settingsRef, {
                ...defaultSettings,
                updatedAt: Timestamp.now()
            });
            return defaultSettings;
        } catch (error) {
            console.error('Error getting app settings:', error);
            return null;
        }
    },

    /**
     * Met à jour le mode d'affichage global (admin uniquement)
     */
    async setHomeViewMode(mode: 'default' | 'prime' | 'netflix', userId: string): Promise<void> {
        try {
            const settingsRef = doc(db, APP_SETTINGS_COLLECTION, 'global');
            await setDoc(settingsRef, {
                homeViewMode: mode,
                updatedAt: Timestamp.now(),
                updatedBy: userId
            }, { merge: true });
        } catch (error) {
            console.error('Error setting home view mode:', error);
            throw error;
        }
    }
};

export const updateAppSettings = async (updates: Partial<AppSettings>): Promise<void> => {
    try {
        const settingsRef = doc(db, 'appSettings', 'global');
        await setDoc(settingsRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
    } catch (error) {
        console.error('Error updating app settings:', error);
        throw error;
    }
};

// Interface pour les publicités
export interface Ad {
    id: string;
    videoUrl: string;
    title?: string;
    skipAfterSeconds?: number; // Nombre de secondes avant de pouvoir skip (par défaut 5)
    isActive: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy?: string;
}

// Interface pour les paramètres de publicité
export interface AdSettings {
    enabled: boolean;
    skipAfterSeconds: number; // Durée minimale avant de pouvoir skip (par défaut 5 secondes)
    updatedAt: Timestamp;
    updatedBy?: string;
}

// Service pour gérer les publicités
export const adService = {
    /**
     * Récupère tous les publicités actives
     */
    async getActiveAds(): Promise<Ad[]> {
        try {
            // Filtrer seulement par isActive pour éviter le besoin d'un index composite
            const q = query(
                collection(db, ADS_COLLECTION),
                where('isActive', '==', true)
            );
            const querySnapshot = await getDocs(q);
            const ads = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt || Timestamp.now(),
                updatedAt: doc.data().updatedAt || Timestamp.now()
            })) as Ad[];

            // Trier côté client par createdAt (plus récent en premier)
            ads.sort((a, b) => {
                const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
                const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
                return bTime - aTime; // Tri décroissant (plus récent en premier)
            });

            return ads;
        } catch (error) {
            console.error('Error getting active ads:', error);
            return [];
        }
    },

    /**
     * Récupère une publicité aléatoire parmi les actives
     */
    async getRandomAd(): Promise<Ad | null> {
        try {
            const ads = await this.getActiveAds();
            if (ads.length === 0) return null;
            const randomIndex = Math.floor(Math.random() * ads.length);
            return ads[randomIndex];
        } catch (error) {
            console.error('Error getting random ad:', error);
            return null;
        }
    },

    /**
     * Récupère toutes les publicités (admin)
     */
    async getAllAds(): Promise<Ad[]> {
        try {
            const q = query(
                collection(db, ADS_COLLECTION),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt || Timestamp.now(),
                updatedAt: doc.data().updatedAt || Timestamp.now()
            })) as Ad[];
        } catch (error) {
            console.error('Error getting all ads:', error);
            return [];
        }
    },

    /**
     * Crée une nouvelle publicité
     */
    async createAd(adData: Omit<Ad, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        try {
            const adRef = await addDoc(collection(db, ADS_COLLECTION), {
                ...adData,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            return adRef.id;
        } catch (error) {
            console.error('Error creating ad:', error);
            throw error;
        }
    },

    /**
     * Met à jour une publicité
     */
    async updateAd(adId: string, updates: Partial<Ad>): Promise<void> {
        try {
            const adRef = doc(db, ADS_COLLECTION, adId);
            await updateDoc(adRef, {
                ...updates,
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            console.error('Error updating ad:', error);
            throw error;
        }
    },

    /**
     * Supprime une publicité
     */
    async deleteAd(adId: string): Promise<void> {
        try {
            const adRef = doc(db, ADS_COLLECTION, adId);
            await deleteDoc(adRef);
        } catch (error) {
            console.error('Error deleting ad:', error);
            throw error;
        }
    },

    /**
     * Récupère les paramètres de publicité
     */
    async getAdSettings(): Promise<AdSettings | null> {
        try {
            const settingsRef = doc(db, APP_SETTINGS_COLLECTION, 'ads');
            const settingsDoc = await getDoc(settingsRef);

            if (settingsDoc.exists()) {
                const data = settingsDoc.data();
                console.log('Raw ad settings from Firestore:', data);
                // S'assurer que enabled est bien un booléen (pas undefined)
                const enabled = typeof data.enabled === 'boolean' ? data.enabled : false;
                return {
                    enabled: enabled,
                    skipAfterSeconds: data.skipAfterSeconds || 5,
                    updatedAt: data.updatedAt || Timestamp.now(),
                    updatedBy: data.updatedBy
                };
            }

            // Paramètres par défaut
            const defaultSettings: AdSettings = {
                enabled: false,
                skipAfterSeconds: 5,
                updatedAt: Timestamp.now()
            };
            await setDoc(settingsRef, defaultSettings);
            return defaultSettings;
        } catch (error) {
            console.error('Error getting ad settings:', error);
            return null;
        }
    },

    /**
     * Met à jour les paramètres de publicité (admin uniquement)
     */
    async updateAdSettings(settings: Partial<AdSettings>, userId: string): Promise<void> {
        try {
            const settingsRef = doc(db, APP_SETTINGS_COLLECTION, 'ads');
            const dataToSave: any = {
                updatedAt: Timestamp.now(),
                updatedBy: userId
            };

            // S'assurer que enabled est bien un booléen
            if (typeof settings.enabled === 'boolean') {
                dataToSave.enabled = settings.enabled;
            }

            if (typeof settings.skipAfterSeconds === 'number') {
                dataToSave.skipAfterSeconds = settings.skipAfterSeconds;
            }

            console.log('Saving ad settings to Firestore:', dataToSave);
            await setDoc(settingsRef, dataToSave, { merge: true });

            // Vérifier que ça a bien été sauvegardé
            const verifyDoc = await getDoc(settingsRef);
            if (verifyDoc.exists()) {
                console.log('Verified saved ad settings:', verifyDoc.data());
            }
        } catch (error) {
            console.error('Error updating ad settings:', error);
            throw error;
        }
    }
};

// Service pour les notifications
export const notificationService = {
    /**
     * Créer une notification pour un utilisateur
     */
    async createNotification(
        userId: string,
        title: string,
        message: string,
        type: 'info' | 'success' | 'warning' | 'error' = 'info',
        link?: string
    ): Promise<string> {
        try {
            const notificationRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
            const notificationData = {
                userId,
                title,
                message,
                type,
                read: false,
                createdAt: Timestamp.now(),
                link: link || null
            };
            await setDoc(notificationRef, notificationData);
            return notificationRef.id;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },

    /**
     * Récupérer les notifications d'un utilisateur (non lues en premier)
     */
    async getUserNotifications(userId: string, limitCount: number = 50): Promise<Notification[]> {
        try {
            const q = query(
                collection(db, NOTIFICATIONS_COLLECTION),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt
            })) as Notification[];
        } catch (error) {
            console.error('Error getting user notifications:', error);
            return [];
        }
    },

    /**
     * Marquer une notification comme lue
     */
    async markAsRead(notificationId: string): Promise<void> {
        try {
            const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
            await updateDoc(notificationRef, { read: true });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    /**
     * Marquer toutes les notifications comme lues
     */
    async markAllAsRead(userId: string): Promise<void> {
        try {
            const q = query(
                collection(db, NOTIFICATIONS_COLLECTION),
                where('userId', '==', userId),
                where('read', '==', false)
            );
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);
            querySnapshot.docs.forEach(doc => {
                batch.update(doc.ref, { read: true });
            });
            await batch.commit();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    },

    /**
     * Supprimer une notification
     */
    async deleteNotification(notificationId: string): Promise<void> {
        try {
            const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
            await deleteDoc(notificationRef);
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    },

    /**
     * Compter les notifications non lues
     */
    async getUnreadCount(userId: string): Promise<number> {
        try {
            const q = query(
                collection(db, NOTIFICATIONS_COLLECTION),
                where('userId', '==', userId),
                where('read', '==', false)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.size;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    },

    /**
     * S'abonner aux notifications d'un utilisateur en temps réel
     */
    subscribeToUserNotifications(
        userId: string,
        callback: (notifications: Notification[]) => void
    ): () => void {
        // Note: Si l'index composite n'est pas créé, cette requête échouera
        // Créez l'index via le lien fourni dans l'erreur ou dans Firebase Console
        // Collection: notifications, Fields: userId (Ascending), createdAt (Descending)
        const q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const notifications = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt
            })) as Notification[];
            callback(notifications);
        }, (error) => {
            console.error('Error subscribing to notifications:', error);
            // Si l'index n'existe pas, afficher un message plus clair
            if (error.code === 'failed-precondition') {
                console.error('❌ Index composite manquant ! Créez l\'index via le lien dans l\'erreur ou Firebase Console.');
                console.error('Collection: notifications, Fields: userId (Ascending), createdAt (Descending)');
            }
        });

        return unsubscribe;
    },

    /**
     * Récupérer les utilisateurs par catégorie
     */
    async getUsersByCategory(category: 'all' | 'premium' | 'non-premium' | 'admin' | 'non-admin'): Promise<string[]> {
        try {
            const allUsersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
            const allUsers = allUsersSnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            })) as UserProfile[];

            if (category === 'all') {
                return allUsers.map(u => u.uid);
            }

            if (category === 'admin' || category === 'non-admin') {
                const isAdminValue = category === 'admin';
                return allUsers
                    .filter(u => {
                        const userIsAdmin = u.isAdmin ?? (u as any)?.['isAdmin '];
                        return isAdminValue ? userIsAdmin : !userIsAdmin;
                    })
                    .map(u => u.uid);
            }

            // Pour premium/non-premium, vérifier les abonnements
            if (category === 'premium' || category === 'non-premium') {
                const { subscriptionService } = await import('./subscriptionService');
                const userIds: string[] = [];
                
                for (const user of allUsers) {
                    const isPremium = await subscriptionService.isUserPremium(user.uid);
                    if (category === 'premium' && isPremium) {
                        userIds.push(user.uid);
                    } else if (category === 'non-premium' && !isPremium) {
                        userIds.push(user.uid);
                    }
                }
                
                return userIds;
            }

            return [];
        } catch (error) {
            console.error('Error getting users by category:', error);
            return [];
        }
    },

    /**
     * Créer une notification pour TOUS les utilisateurs
     * Utile pour les annonces globales, nouvelles vidéos, etc.
     */
    async createNotificationForAllUsers(
        title: string,
        message: string,
        type: 'info' | 'success' | 'warning' | 'error' = 'info',
        link?: string
    ): Promise<{ success: number; errors: number }> {
        try {
            // Récupérer tous les utilisateurs
            const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
            const userIds = usersSnapshot.docs.map(doc => doc.id);
            
            console.log(`📢 Création de notification pour ${userIds.length} utilisateurs...`);
            
            // Créer les notifications par batch (Firestore limite à 500 opérations par batch)
            const batchSize = 500;
            let successCount = 0;
            let errorCount = 0;
            
            for (let i = 0; i < userIds.length; i += batchSize) {
                const batch = writeBatch(db);
                const batchUserIds = userIds.slice(i, i + batchSize);
                
                batchUserIds.forEach(userId => {
                    const notificationRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
                    batch.set(notificationRef, {
                        userId,
                        title,
                        message,
                        type,
                        read: false,
                        createdAt: Timestamp.now(),
                        link: link || null
                    });
                });
                
                try {
                    await batch.commit();
                    successCount += batchUserIds.length;
                    console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} créé: ${batchUserIds.length} notifications`);
                } catch (error) {
                    console.error(`❌ Erreur batch ${Math.floor(i / batchSize) + 1}:`, error);
                    errorCount += batchUserIds.length;
                }
            }
            
            console.log(`📢 Notification envoyée: ${successCount} succès, ${errorCount} erreurs`);
            return { success: successCount, errors: errorCount };
        } catch (error) {
            console.error('Error creating notification for all users:', error);
            throw error;
        }
    },

    /**
     * Créer une notification pour une catégorie spécifique d'utilisateurs
     */
    async createNotificationForCategory(
        category: 'all' | 'premium' | 'non-premium' | 'admin' | 'non-admin',
        title: string,
        message: string,
        type: 'info' | 'success' | 'warning' | 'error' = 'info',
        link?: string
    ): Promise<{ success: number; errors: number; category: string }> {
        try {
            // Récupérer les utilisateurs de la catégorie
            const userIds = await this.getUsersByCategory(category);
            
            console.log(`📢 Création de notification pour ${userIds.length} utilisateurs (catégorie: ${category})...`);
            
            if (userIds.length === 0) {
                console.warn(`⚠️ Aucun utilisateur trouvé pour la catégorie: ${category}`);
                return { success: 0, errors: 0, category };
            }
            
            // Créer les notifications par batch
            const batchSize = 500;
            let successCount = 0;
            let errorCount = 0;
            
            for (let i = 0; i < userIds.length; i += batchSize) {
                const batch = writeBatch(db);
                const batchUserIds = userIds.slice(i, i + batchSize);
                
                batchUserIds.forEach(userId => {
                    const notificationRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
                    batch.set(notificationRef, {
                        userId,
                        title,
                        message,
                        type,
                        read: false,
                        createdAt: Timestamp.now(),
                        link: link || null
                    });
                });
                
                try {
                    await batch.commit();
                    successCount += batchUserIds.length;
                    console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} créé: ${batchUserIds.length} notifications`);
                } catch (error) {
                    console.error(`❌ Erreur batch ${Math.floor(i / batchSize) + 1}:`, error);
                    errorCount += batchUserIds.length;
                }
            }
            
            console.log(`📢 Notification envoyée à la catégorie "${category}": ${successCount} succès, ${errorCount} erreurs`);
            return { success: successCount, errors: errorCount, category };
        } catch (error) {
            console.error('Error creating notification for category:', error);
            throw error;
        }
    },

    /**
     * Récupérer toutes les notifications avec statistiques (pour admin)
     * Regroupe les notifications par titre/message pour voir les notifications globales
     */
    async getAllNotificationsGrouped(): Promise<Array<{
        title: string;
        message: string;
        type: string;
        link?: string;
        totalCount: number;
        readCount: number;
        unreadCount: number;
        createdAt: Date | Timestamp;
        notificationIds: string[]; // IDs de toutes les notifications avec ce contenu
    }>> {
        try {
            // Récupérer toutes les notifications
            const notificationsSnapshot = await getDocs(collection(db, NOTIFICATIONS_COLLECTION));
            const allNotifications = notificationsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as (Notification & { id: string })[];

            // Grouper par titre + message + type (notifications identiques envoyées à plusieurs users)
            const grouped = new Map<string, {
                title: string;
                message: string;
                type: string;
                link?: string;
                notificationIds: string[];
                readCount: number;
                createdAt: Date | Timestamp;
            }>();

            allNotifications.forEach(notif => {
                const key = `${notif.title}|${notif.message}|${notif.type}|${notif.link || ''}`;
                if (!grouped.has(key)) {
                    grouped.set(key, {
                        title: notif.title,
                        message: notif.message,
                        type: notif.type,
                        link: notif.link,
                        notificationIds: [],
                        readCount: 0,
                        createdAt: notif.createdAt
                    });
                }
                const group = grouped.get(key)!;
                group.notificationIds.push(notif.id);
                if (notif.read) {
                    group.readCount++;
                }
            });

            // Convertir en array et calculer les stats
            return Array.from(grouped.values()).map(group => ({
                ...group,
                totalCount: group.notificationIds.length,
                unreadCount: group.notificationIds.length - group.readCount
            })).sort((a, b) => {
                // Trier par date (plus récent en premier)
                const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 
                             a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
                const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 
                             b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
                return bTime - aTime;
            });
        } catch (error) {
            console.error('Error getting all notifications grouped:', error);
            return [];
        }
    },

    /**
     * Supprimer une notification pour tous les utilisateurs qui ne l'ont pas encore lue
     * Utile pour annuler une notification avant qu'elle soit vue
     */
    async deleteUnreadNotifications(
        title: string,
        message: string,
        type: string,
        link?: string
    ): Promise<{ deleted: number; errors: number }> {
        try {
            // Trouver toutes les notifications correspondantes qui ne sont pas lues
            let q = query(
                collection(db, NOTIFICATIONS_COLLECTION),
                where('title', '==', title),
                where('message', '==', message),
                where('type', '==', type),
                where('read', '==', false)
            );

            // Si link est défini, filtrer aussi par link
            if (link) {
                q = query(
                    collection(db, NOTIFICATIONS_COLLECTION),
                    where('title', '==', title),
                    where('message', '==', message),
                    where('type', '==', type),
                    where('link', '==', link),
                    where('read', '==', false)
                );
            }

            const querySnapshot = await getDocs(q);
            const notificationsToDelete = querySnapshot.docs;

            console.log(`🗑️ Suppression de ${notificationsToDelete.length} notifications non lues...`);

            // Supprimer par batch
            const batchSize = 500;
            let deletedCount = 0;
            let errorCount = 0;

            for (let i = 0; i < notificationsToDelete.length; i += batchSize) {
                const batch = writeBatch(db);
                const batchDocs = notificationsToDelete.slice(i, i + batchSize);

                batchDocs.forEach(doc => {
                    batch.delete(doc.ref);
                });

                try {
                    await batch.commit();
                    deletedCount += batchDocs.length;
                    console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} supprimé: ${batchDocs.length} notifications`);
                } catch (error) {
                    console.error(`❌ Erreur batch ${Math.floor(i / batchSize) + 1}:`, error);
                    errorCount += batchDocs.length;
                }
            }

            console.log(`🗑️ Suppression terminée: ${deletedCount} supprimées, ${errorCount} erreurs`);
            return { deleted: deletedCount, errors: errorCount };
        } catch (error) {
            console.error('Error deleting unread notifications:', error);
            throw error;
        }
    },

    /**
     * Supprimer complètement une notification pour TOUS les utilisateurs (lues et non lues)
     */
    async deleteAllNotifications(
        title: string,
        message: string,
        type: string,
        link?: string
    ): Promise<{ deleted: number; errors: number }> {
        try {
            // Trouver toutes les notifications correspondantes (lues et non lues)
            let q = query(
                collection(db, NOTIFICATIONS_COLLECTION),
                where('title', '==', title),
                where('message', '==', message),
                where('type', '==', type)
            );

            // Si link est défini, filtrer aussi par link
            if (link) {
                q = query(
                    collection(db, NOTIFICATIONS_COLLECTION),
                    where('title', '==', title),
                    where('message', '==', message),
                    where('type', '==', type),
                    where('link', '==', link)
                );
            }

            const querySnapshot = await getDocs(q);
            const notificationsToDelete = querySnapshot.docs;

            console.log(`🗑️ Suppression de ${notificationsToDelete.length} notifications (toutes)...`);

            // Supprimer par batch
            const batchSize = 500;
            let deletedCount = 0;
            let errorCount = 0;

            for (let i = 0; i < notificationsToDelete.length; i += batchSize) {
                const batch = writeBatch(db);
                const batchDocs = notificationsToDelete.slice(i, i + batchSize);

                batchDocs.forEach(doc => {
                    batch.delete(doc.ref);
                });

                try {
                    await batch.commit();
                    deletedCount += batchDocs.length;
                    console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} supprimé: ${batchDocs.length} notifications`);
                } catch (error) {
                    console.error(`❌ Erreur batch ${Math.floor(i / batchSize) + 1}:`, error);
                    errorCount += batchDocs.length;
                }
            }

            console.log(`🗑️ Suppression terminée: ${deletedCount} supprimées, ${errorCount} erreurs`);
            return { deleted: deletedCount, errors: errorCount };
        } catch (error) {
            console.error('Error deleting all notifications:', error);
            throw error;
        }
    }
};

// Service pour le tracking de navigation des utilisateurs
export const navigationTrackingService = {
    // Limites de stockage
    MAX_PAGES_TO_KEEP: 5, // Garder seulement les 5 dernières pages
    MIN_TIME_BETWEEN_SAME_PAGE: 3000, // 3 secondes minimum entre deux navigations vers la même page

    /**
     * Enregistre une navigation (changement de page) - Écrase le document utilisateur
     * Garde seulement les 5 dernières pages visitées quand l'utilisateur était en ligne
     */
    async recordNavigation(
        userUid: string,
        pagePath: string,
        pageName: string,
        isOnline: boolean = true,
        videoTitle?: string,
        videoUid?: string
    ): Promise<void> {
        try {
            // Ne pas enregistrer si l'utilisateur est hors ligne
            if (!isOnline) {
                return;
            }

            const userNavRef = doc(db, USER_NAVIGATION_COLLECTION, userUid);
            const userNavDoc = await getDoc(userNavRef);

            const now = Timestamp.now();
            const newEntry: NavigationEntry = {
                page_path: pagePath,
                page_name: pageName,
                timestamp: now,
                ...(videoTitle && { video_title: videoTitle }),
                ...(videoUid && { video_uid: videoUid })
            };

            if (!userNavDoc.exists()) {
                // Créer un nouveau document avec la première navigation
                const newData: Omit<UserNavigation, 'id'> = {
                    user_uid: userUid,
                    lastTwoPages: [newEntry],
                    updatedAt: now
                };
                await setDoc(userNavRef, newData);
            } else {
                // Mettre à jour le document existant
                const existingData = userNavDoc.data() as UserNavigation;
                let lastTwoPages = existingData.lastTwoPages || [];

                // Vérifier si c'est la même page que la dernière (éviter les doublons rapides)
                if (lastTwoPages.length > 0) {
                    const lastPage = lastTwoPages[lastTwoPages.length - 1];
                    const lastPageTime = lastPage.timestamp instanceof Date 
                        ? lastPage.timestamp.getTime() 
                        : lastPage.timestamp instanceof Timestamp 
                            ? lastPage.timestamp.toMillis() 
                            : new Date(lastPage.timestamp).getTime();
                    
                    const nowTime = now.toMillis();
                    const timeSinceLastNav = nowTime - lastPageTime;
                    
                    // Si c'est la même page et moins de 3 secondes, ne pas enregistrer
                    if (lastPage.page_path === pagePath && timeSinceLastNav < this.MIN_TIME_BETWEEN_SAME_PAGE) {
                        return; // Ignorer cette navigation
                    }
                }

                // Ajouter la nouvelle navigation
                lastTwoPages.push(newEntry);

                // Garder seulement les 2 dernières
                if (lastTwoPages.length > this.MAX_PAGES_TO_KEEP) {
                    lastTwoPages = lastTwoPages.slice(-this.MAX_PAGES_TO_KEEP);
                }

                // Mettre à jour le document (écraser)
                await updateDoc(userNavRef, {
                    lastTwoPages: lastTwoPages.map(entry => ({
                        ...entry,
                        timestamp: entry.timestamp instanceof Date 
                            ? Timestamp.fromDate(entry.timestamp) 
                            : entry.timestamp instanceof Timestamp 
                                ? entry.timestamp 
                                : Timestamp.fromDate(new Date(entry.timestamp))
                    })),
                    updatedAt: now
                });
            }
        } catch (error) {
            console.error('Error recording navigation:', error);
            // Ne pas bloquer l'application en cas d'erreur
        }
    },

    /**
     * Récupère les 5 dernières pages visitées d'un utilisateur (quand il était en ligne)
     */
    async getUserNavigationHistory(userUid: string): Promise<NavigationEntry[]> {
        try {
            const userNavRef = doc(db, USER_NAVIGATION_COLLECTION, userUid);
            const userNavDoc = await getDoc(userNavRef);

            if (!userNavDoc.exists()) {
                return [];
            }

            const data = userNavDoc.data() as UserNavigation;
            const lastTwoPages = data.lastTwoPages || [];

            // Convertir les timestamps en Date pour la compatibilité
            return lastTwoPages.map(entry => ({
                ...entry,
                timestamp: entry.timestamp instanceof Timestamp 
                    ? entry.timestamp.toDate() 
                    : entry.timestamp instanceof Date 
                        ? entry.timestamp 
                        : new Date(entry.timestamp)
            }));
        } catch (error) {
            console.error('Error getting user navigation history:', error);
            return [];
        }
    }
};