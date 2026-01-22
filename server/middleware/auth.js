import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';

function getDb() {
    if (getApps().length === 0) {
        throw new Error('Firebase Admin not initialized. Please configure FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in server/.env file.');
    }
    return getFirestore();
}

/**
 * Vérifie si l'utilisateur est dans l'allowlist admin
 */
export async function checkAdminAllowlist(req, res, next) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 MIDDLEWARE: Vérification de l\'authentification');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   - Méthode:', req.method);
    console.log('   - URL:', req.url);
    console.log('   - Headers Authorization:', req.headers.authorization ? req.headers.authorization.substring(0, 30) + '...' : 'MANQUANT');
    
    try {
        // Récupérer le token depuis le header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('❌ Token d\'authentification manquant dans les headers');
            return res.status(401).json({ error: 'Token d\'authentification manquant' });
        }

        const token = authHeader.split('Bearer ')[1];
        console.log('✅ Token présent dans les headers:', token.substring(0, 20) + '...');

        // Vérifier que Firebase Admin est initialisé
        try {
            getAuth(); // Vérifier que Firebase Admin est initialisé
        } catch (error) {
            console.error('Firebase Admin not initialized:', error);
            return res.status(500).json({ 
                error: 'Firebase Admin non initialisé. Vérifiez les credentials dans server/.env',
                details: 'Le serveur backend nécessite les credentials Firebase Admin pour fonctionner.'
            });
        }

        // Vérifier le token Firebase
        console.log('🔍 Vérification du token Firebase...');
        let decodedToken;
        try {
            decodedToken = await getAuth().verifyIdToken(token);
            console.log('✅ Token Firebase valide');
            console.log('   - Email:', decodedToken.email);
            console.log('   - UID:', decodedToken.uid);
        } catch (error) {
            console.error('❌ Erreur de vérification du token:', error.message);
            return res.status(401).json({ 
                error: 'Token invalide ou expiré',
                details: error.message || 'Le token Firebase n\'a pas pu être vérifié. Veuillez vous reconnecter.'
            });
        }

        const userEmail = decodedToken.email;
        if (!userEmail) {
            console.error('❌ Email non trouvé dans le token');
            return res.status(401).json({ error: 'Email non trouvé dans le token' });
        }

        console.log('🔍 Vérification de l\'allowlist admin...');
        // Vérifier l'allowlist
        const db = getDb();
        const allowlistRef = db.collection('admin_allowlist');
        const snapshot = await allowlistRef
            .where('email', '==', userEmail.toLowerCase())
            .where('isActive', '==', true)
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.warn(`⚠️ Accès refusé pour: ${userEmail} (email non dans l'allowlist)`);
            return res.status(403).json({ 
                error: 'Accès refusé. Votre adresse email n\'est pas autorisée.',
                email: userEmail
            });
        }
        
        console.log('✅ Email autorisé dans l\'allowlist');

        // Ajouter les infos utilisateur à la requête
        req.user = {
            uid: decodedToken.uid,
            email: userEmail,
            allowlistDoc: snapshot.docs[0].data()
        };

        console.log('✅ Authentification réussie, passage à la route suivante');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        next();
    } catch (error) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('❌ ERREUR dans checkAdminAllowlist');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('   - Message:', error.message);
        console.error('   - Stack:', error.stack?.substring(0, 300));
        res.status(500).json({ 
            error: 'Erreur lors de la vérification des permissions',
            details: error.message
        });
    }
}

/**
 * Log une action admin
 */
export async function logAdminAction(action, details, userId, userEmail) {
    try {
        const db = getDb();
        await db.collection('admin_audit_logs').add({
            action,
            details,
            userId,
            userEmail,
            timestamp: new Date(),
            ip: null // Peut être ajouté si nécessaire
        });
    } catch (error) {
        console.error('Error logging admin action:', error);
        // Ne pas bloquer l'action si le log échoue
    }
}

