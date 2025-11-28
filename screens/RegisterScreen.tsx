import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { authService } from '../lib/authService';
import { userService } from '../lib/firestore';
import AuthHeader from '../components/AuthHeader';
import InputField from '../components/InputField';
import AuthButton from '../components/AuthButton';
import { GoogleIcon } from '../components/icons';

// Fonction utilitaire pour formater la date au format demandé
const formatCreatedTime = (date: Date): string => {
    const months = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Obtenir le décalage UTC
    const offset = -date.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetSign = offset >= 0 ? '+' : '-';

    return `${day} ${month} ${year} à ${hours}:${minutes}:${seconds} UTC${offsetSign}${offsetHours}`;
};

const SocialLoginButton: React.FC<{ onClick: () => void; disabled?: boolean }> = ({ onClick, disabled }) => {
    const { t } = useAppContext();
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-md font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800/20 hover:bg-gray-50 dark:hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 focus:ring-offset-[#FBF9F3] dark:focus:ring-offset-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <GoogleIcon className="w-6 h-6 mr-3" />
            {disabled ? t('loading') || 'Chargement...' : t('continueWithGoogle')}
        </button>
    );
};

const OrSeparator: React.FC = () => {
    const { t } = useAppContext();
    return (
        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300/80 dark:border-gray-600/80" />
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#FBF9F3] dark:bg-black text-gray-500 dark:text-gray-400">
                    {t('orSeparator')}
                </span>
            </div>
        </div>
    );
};

const RegisterScreen: React.FC = () => {
    const { t, setIsAuthenticated, language } = useAppContext();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    useEffect(() => {
        const checkRedirectResult = async () => {
            try {
                const result = await authService.getGoogleRedirectResult();
                if (result) {
                    console.log('✅ Connexion Google réussie via redirection:', result.user.email);
                    // onAuthStateChanged devrait déjà avoir mis à jour l'état, mais on force la navigation
                    setIsAuthenticated(true);
                    navigate('/home');
                }
                // Si result est null, c'est normal - soit aucune redirection n'a eu lieu,
                // soit l'utilisateur est déjà authentifié via onAuthStateChanged
            } catch (error: any) {
                // Ne pas afficher d'erreur si c'est juste qu'il n'y a pas de résultat
                if (error.code && error.code !== 'auth/operation-not-allowed' && error.code !== 'auth/unauthorized-domain') {
                    console.error('❌ Erreur lors de la redirection Google:', error);
                    setError(error.message || 'Erreur lors de la connexion Google');
                }
            }
        };

        checkRedirectResult();
    }, [setIsAuthenticated, navigate]);

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError('');

        try {
            console.log('🔄 Début de la connexion Google...');
            const result = await authService.signInWithGoogle();

            // Si c'est une redirection, result sera void et onAuthStateChanged gérera l'authentification
            // Si c'est une popup, result contiendra le UserCredential
            if (result) {
                console.log('✅ Connexion Google réussie (popup):', result.user.email);
                // onAuthStateChanged devrait déjà avoir mis à jour l'état, mais on force la navigation
                setIsAuthenticated(true);
                navigate('/home');
            } else {
                console.log('🔄 Redirection Google en cours...');
                // Pour la redirection, on ne fait rien ici
                // getGoogleRedirectResult() dans useEffect gérera le résultat
                // Le loading reste actif car la redirection va se produire
            }
        } catch (error: any) {
            console.error('❌ Erreur lors de la connexion Google:', error);
            console.error('Code d\'erreur:', error.code);
            console.error('Message complet:', error.message);

            let errorMessage = 'Une erreur est survenue lors de la connexion Google';

            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'La fenêtre de connexion a été fermée. Veuillez réessayer.';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = 'La fenêtre popup a été bloquée. L\'application va utiliser la redirection à la place.';
                // Ne pas afficher d'erreur, la redirection devrait se faire automatiquement
                console.log('⚠️ Popup bloquée, redirection en cours...');
                return; // Ne pas arrêter le loading, la redirection va se produire
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMessage = 'Connexion annulée';
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                errorMessage = 'Un compte existe déjà avec cet email mais avec une autre méthode de connexion.';
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage = 'La connexion Google n\'est pas activée. Veuillez contacter le support.';
            } else if (error.code === 'auth/unauthorized-domain') {
                errorMessage = 'Ce domaine n\'est pas autorisé pour la connexion Google.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            setError(errorMessage);
            setGoogleLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !fullName) {
            setError(t('fillAllFields') || 'Veuillez remplir tous les champs');
            return;
        }

        setAuthLoading(true);
        setError('');

        try {
            // Créer l'utilisateur dans Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Créer immédiatement le profil utilisateur dans Firestore avec le format demandé
            const createdTime = formatCreatedTime(new Date());

            await userService.createUserProfile({
                uid: user.uid,
                email: user.email || email,
                display_name: fullName,
                presence: 'offline',
                hasAcceptedPrivacyPolicy: false,
                created_time: createdTime,
                theme: 'dark',
                language: language,
                bookmarkedIds: []
            });

            console.log('Profil utilisateur créé:', {
                uid: user.uid,
                email: user.email,
                created_time: createdTime
            });

            setIsAuthenticated(true);
            navigate('/home');
        } catch (error: any) {
            setError(error.message || t('authError') || 'Une erreur est survenue');
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#FBF9F3] dark:bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fadeIn">
            <AuthHeader />
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="px-4 text-center">
                    <h1 className="text-4xl font-bold text-amber-500 tracking-wider">CMFI Replay</h1>
                    <h2 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">
                        {t('signup')}
                    </h2>
                </div>
                <div className="mt-8 px-4 sm:px-0">
                    <div className="space-y-6">
                        <SocialLoginButton
                            onClick={handleGoogleSignIn}
                            disabled={googleLoading}
                        />
                        <OrSeparator />
                        {error && (
                            <div className="text-red-500 text-sm text-center mb-4">
                                {error}
                            </div>
                        )}
                        <form className="space-y-8" onSubmit={handleAuth}>
                            <InputField label={t('fullName')} id="full-name" name="full-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Howard Thurman" />
                            <InputField label={t('email')} id="email-signup" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required placeholder="e.g. howard.thurman@gmail.com" />
                            <InputField label={t('password')} id="password-signup" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" />
                            <div className="pt-2">
                                <AuthButton type="submit" disabled={authLoading}>
                                    {authLoading ? t('loading') || 'Chargement...' : t('getStarted')}
                                </AuthButton>
                            </div>
                        </form>
                        <div className="mt-6 text-center text-sm">
                            <p className="text-gray-500 dark:text-gray-400">
                                {t('alreadyHaveAccount')}{' '}
                                <button onClick={() => navigate('/login')} className="font-medium text-amber-600 hover:text-amber-500">
                                    {t('login')}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterScreen;
