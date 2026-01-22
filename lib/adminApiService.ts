import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3002';

/**
 * Récupère le token Firebase pour l'authentification
 */
// Cache du token pour éviter de trop solliciter Firebase
let tokenCache: { token: string; expiresAt: number } | null = null;
const TOKEN_CACHE_DURATION = 50 * 60 * 1000; // 50 minutes (les tokens Firebase expirent après 1h)

async function getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('Utilisateur non authentifié. Veuillez vous connecter.');
    }
    
    // Utiliser le token en cache s'il est encore valide
    if (tokenCache && tokenCache.expiresAt > Date.now()) {
        return tokenCache.token;
    }
    
    try {
        // Ne pas forcer le refresh sauf si nécessaire (évite de dépasser le quota)
        const token = await user.getIdToken(false);
        
        // Mettre en cache le token
        tokenCache = {
            token,
            expiresAt: Date.now() + TOKEN_CACHE_DURATION
        };
        
        return token;
    } catch (error: any) {
        console.error('Error getting auth token:', error);
        
        // Si erreur de quota, essayer avec le token en cache même s'il est expiré
        if (error.code === 'auth/quota-exceeded' && tokenCache) {
            console.warn('Quota dépassé, utilisation du token en cache');
            return tokenCache.token;
        }
        
        throw new Error('Erreur lors de la récupération du token d\'authentification. Veuillez vous reconnecter.');
    }
}

/**
 * Fait une requête authentifiée vers l'API admin
 */
async function apiRequest(endpoint: string, options: RequestInit = {}) {
    const token = await getAuthToken();
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        // Vérifier si la réponse est du HTML (erreur de connexion)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
            const text = await response.text();
            console.error('Backend returned HTML instead of JSON:', text.substring(0, 200));
            throw new Error(`Le serveur backend n'est pas accessible. Vérifiez qu'il est démarré sur ${API_BASE_URL}`);
        }

        if (response.status === 401) {
            const errorData = await response.json().catch(() => ({ error: 'Token invalide ou expiré' }));
            throw new Error(`Erreur 401: ${errorData.error || 'Token d\'authentification invalide. Veuillez vous reconnecter.'}`);
        }

        if (response.status === 403) {
            throw new Error('Accès refusé. Vous n\'êtes pas autorisé à accéder à cette ressource.');
        }

        if (!response.ok) {
            try {
                const error = await response.json();
                console.error('❌ Erreur API backend:', {
                    status: response.status,
                    error: error.error,
                    details: error.details,
                    fullError: error
                });
                // Include details if available
                const errorMessage = error.details 
                    ? `${error.error || `Erreur ${response.status}`}: ${error.details}`
                    : error.error || `Erreur ${response.status}`;
                throw new Error(errorMessage);
            } catch (parseError) {
                // Si ce n'est pas du JSON, c'est probablement une erreur de connexion
                const errorText = await response.text().catch(() => 'Impossible de lire la réponse');
                console.error('❌ Erreur non-JSON du backend:', {
                    status: response.status,
                    text: errorText.substring(0, 200)
                });
                throw new Error(`Erreur ${response.status}: Impossible de se connecter au serveur backend. Vérifiez que le serveur est démarré sur ${API_BASE_URL}`);
            }
        }

        return response.json();
    } catch (error: any) {
        // Gérer les erreurs de réseau
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error(`Impossible de se connecter au serveur backend. Vérifiez qu'il est démarré sur ${API_BASE_URL}`);
        }
        throw error;
    }
}

/**
 * Upload un fichier vers l'API
 */
async function uploadFile(endpoint: string, file: File, data: Record<string, any>, onProgress?: (progress: number) => void): Promise<any> {
    let token: string;
    try {
        token = await getAuthToken();
    } catch (error: any) {
        throw new Error(error.message || 'Erreur d\'authentification');
    }
    
    const formData = new FormData();
    formData.append('video', file);
    Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
            formData.append(key, String(data[key]));
        }
    });

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                const progress = (e.loaded / e.total) * 100;
                onProgress(progress);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 403) {
                reject(new Error('Accès refusé. Vous n\'êtes pas autorisé à accéder à cette ressource.'));
                return;
            }

            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (e) {
                    resolve(xhr.responseText);
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.error || `Erreur ${xhr.status}`));
                } catch (e) {
                    reject(new Error(`Erreur ${xhr.status}`));
                }
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Erreur réseau'));
        });

        xhr.open('POST', `${API_BASE_URL}${endpoint}`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
    });
}

export const adminApiService = {
    /**
     * Vérifie si l'utilisateur est admin
     */
    async checkAdmin(): Promise<{ isAdmin: boolean; email: string }> {
        try {
            return await apiRequest('/admin/me');
        } catch (error: any) {
            // Si le backend n'est pas disponible, on retourne quand même une réponse
            // pour permettre l'accès basé sur Firestore uniquement
            if (error.message.includes('backend n\'est pas accessible') || 
                error.message.includes('se connecter au serveur')) {
                throw error; // Re-throw pour que l'appelant puisse gérer
            }
            throw error;
        }
    },

    /**
     * Liste toutes les vidéos de l'app
     */
    async getAppVideos(params?: { seasonId?: string; status?: string; search?: string }): Promise<{ videos: any[]; count: number }> {
        const queryParams = new URLSearchParams();
        if (params?.seasonId) queryParams.append('seasonId', params.seasonId);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.search) queryParams.append('search', params.search);
        
        const query = queryParams.toString();
        return apiRequest(`/admin/app/videos${query ? `?${query}` : ''}`);
    },

    /**
     * Met à jour un épisode
     */
    async updateVideo(id: string, updates: any): Promise<{ success: boolean; video: any }> {
        return apiRequest(`/admin/app/videos/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
    },

    /**
     * Liste les séries
     */
    async getSeries(): Promise<{ series: any[]; count: number }> {
        return apiRequest('/admin/series');
    },

    /**
     * Liste les saisons
     */
    async getSeasons(serieId?: string): Promise<{ seasons: any[]; count: number }> {
        const query = serieId ? `?serieId=${serieId}` : '';
        return apiRequest(`/admin/seasons${query}`);
    },

    /**
     * Crée une nouvelle saison
     */
    async createSeason(data: any): Promise<{ success: boolean; season: any }> {
        return apiRequest('/admin/seasons', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * Met à jour une saison
     */
    async updateSeason(id: string, updates: any): Promise<{ success: boolean; season: any }> {
        return apiRequest(`/admin/seasons/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
    },

    /**
     * Liste les dossiers Vimeo
     */
    async getVimeoFolders(): Promise<{ folders: any[]; count: number }> {
        return apiRequest('/admin/vimeo/folders');
    },

    /**
     * Liste les vidéos Vimeo
     */
    async getVimeoVideos(params?: { folderId?: string; per_page?: number; page?: number }): Promise<{
        videos: any[];
        count: number;
        pagination: any;
    }> {
        const queryParams = new URLSearchParams();
        if (params?.folderId) queryParams.append('folderId', params.folderId);
        if (params?.per_page) queryParams.append('per_page', String(params.per_page));
        if (params?.page) queryParams.append('page', String(params.page));
        
        const query = queryParams.toString();
        return apiRequest(`/admin/vimeo/videos${query ? `?${query}` : ''}`);
    },

    /**
     * Upload une vidéo vers Vimeo
     */
    async uploadToVimeo(
        file: File,
        data: { title?: string; description?: string; folderId?: string; privacy?: string },
        onProgress?: (progress: number) => void
    ): Promise<any> {
        return uploadFile('/admin/vimeo/upload', file, data, onProgress);
    },

    /**
     * Importe une vidéo Vimeo dans l'app
     */
    async importVimeoToApp(data: {
        vimeoId: string;
        vimeoUri: string;
        vimeoLink: string;
        embedUrl: string;
        title: string;
        description?: string;
        thumbnail?: string;
        duration: number;
        seasonId?: string;
        createNewSeason?: boolean;
        newSeasonData?: any;
    }): Promise<{ success: boolean; episode: any }> {
        return apiRequest('/admin/import/vimeo-to-app', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * Récupère les logs d'audit
     */
    async getAuditLogs(params?: { limit?: number; action?: string }): Promise<{ logs: any[]; count: number }> {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.append('limit', String(params.limit));
        if (params?.action) queryParams.append('action', params.action);
        
        const query = queryParams.toString();
        return apiRequest(`/admin/audit/logs${query ? `?${query}` : ''}`);
    }
};

