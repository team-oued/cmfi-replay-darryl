/**
 * Script pour initialiser l'allowlist admin dans Firestore
 * 
 * Usage: node scripts/initAdminAllowlist.js <email> [role]
 * 
 * Exemple: node scripts/initAdminAllowlist.js admin@example.com admin
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const email = process.argv[2];
const role = process.argv[3] || 'admin';

if (!email) {
    console.error('❌ Usage: node scripts/initAdminAllowlist.js <email> [role]');
    process.exit(1);
}

async function initAllowlist() {
    try {
        // Initialize Firebase Admin
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        };

        initializeApp({
            credential: cert(serviceAccount)
        });

        const db = getFirestore();

        // Vérifier si l'email existe déjà
        const existing = await db.collection('admin_allowlist')
            .where('email', '==', email.toLowerCase())
            .get();

        if (!existing.empty) {
            console.log(`⚠️  L'email ${email} existe déjà dans l'allowlist`);
            const doc = existing.docs[0];
            await doc.ref.update({
                isActive: true,
                role,
                updatedAt: new Date()
            });
            console.log(`✅ Allowlist mise à jour pour ${email}`);
        } else {
            await db.collection('admin_allowlist').add({
                email: email.toLowerCase(),
                isActive: true,
                role,
                createdAt: new Date(),
                createdBy: null
            });
            console.log(`✅ Email ${email} ajouté à l'allowlist avec le rôle "${role}"`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

initAllowlist();


