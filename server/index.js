import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import adminAuthRoutes from './routes/admin.js';
import vimeoRoutes from './routes/vimeo.js';
import { checkAdminAllowlist } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase Admin
try {
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    };

    // Vérifier que les credentials sont présents
    if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
        console.warn('⚠️  Firebase Admin credentials not fully configured in .env file');
        console.warn('⚠️  The server will start but admin endpoints WILL NOT WORK');
        console.warn('⚠️  Please configure FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in server/.env');
        console.warn('⚠️  Without Firebase Admin, authentication and allowlist checks will fail');
    } else {
        try {
            initializeApp({
                credential: cert(serviceAccount)
            });
            console.log('✅ Firebase Admin initialized');
        } catch (initError) {
            console.error('❌ Error initializing Firebase Admin:', initError.message);
            console.warn('⚠️  The server will start but admin endpoints WILL NOT WORK');
        }
    }
} catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    console.warn('⚠️  The server will start but admin endpoints may not work');
    console.warn('⚠️  Please check your Firebase Admin credentials in server/.env');
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin routes (protected by allowlist)
app.use('/admin', checkAdminAllowlist, adminAuthRoutes);
app.use('/admin', checkAdminAllowlist, vimeoRoutes);

// 403 Forbidden for unauthorized access
app.use('/admin', (req, res) => {
    res.status(403).json({ error: 'Accès refusé. Vous n\'êtes pas autorisé à accéder à cette ressource.' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Admin API server running on port ${PORT}`);
    console.log(`📡 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});

