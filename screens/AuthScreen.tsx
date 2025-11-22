import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { authService } from '../lib/authService';
import AuthHeader from '../components/AuthHeader';
import InputField from '../components/InputField';
import AuthButton from '../components/AuthButton';
import { GoogleIcon } from '../components/icons';

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

const AuthScreen: React.FC = () => {
    const { t, setIsAuthenticated, loading } = useAppContext();
    const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgotPassword'>('login');
    const [resetRequested, setResetRequested] = useState(false);
    const [error, setError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    // Vérifier le résultat de la redirection Google au chargement
    useEffect(() => {
        const checkRedirectResult = async () => {
            try {
                const result = await authService.getGoogleRedirectResult();
                if (result) {
                    console.log('Connexion Google réussie:', result.user);
                    setIsAuthenticated(true);
                }
            } catch (error: any) {
                console.error('Erreur lors de la redirection Google:', error);
                setError(error.message || 'Erreur lors de la connexion Google');
            }
        };

        checkRedirectResult();
    }, [setIsAuthenticated]);

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError('');

        try {
            const result = await authService.signInWithGoogle();

            // Si c'est une redirection, result sera void
            if (result) {
                console.log('Connexion Google réussie:', result.user);
                setIsAuthenticated(true);
            }
            // Sinon, la redirection est en cours et l'utilisateur sera redirigé
        } catch (error: any) {
            console.error('Erreur lors de la connexion Google:', error);

            // Messages d'erreur personnalisés
            let errorMessage = 'Une erreur est survenue lors de la connexion Google';

            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'La fenêtre de connexion a été fermée';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = 'La fenêtre popup a été bloquée. Veuillez autoriser les popups pour ce site.';
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMessage = 'Connexion annulée';
            } else if (error.message) {
                errorMessage = error.message;
            }

            setError(errorMessage);
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || (authMode === 'signup' && !fullName)) {
            setError(t('fillAllFields') || 'Veuillez remplir tous les champs');
            return;
        }

        setAuthLoading(true);
        setError('');

        try {
            if (authMode === 'signup') {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            setIsAuthenticated(true);
        } catch (error: any) {
            setError(error.message || t('authError') || 'Une erreur est survenue');
        } finally {
            setAuthLoading(false);
        }
    };

    const commonLayout = (title: string, subtitle: string | null, formContent: React.ReactNode, showSocial: boolean) => (
        <div className="relative min-h-screen bg-[#FBF9F3] dark:bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fadeIn">
            <AuthHeader />
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="px-4 text-center">
                    <h1 className="text-4xl font-bold text-amber-500 tracking-wider">CMFI Replay</h1>
                    <h2 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">
                        {title}
                    </h2>
                    {subtitle && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
                </div>
                <div className="mt-8 px-4 sm:px-0">
                    <div className="space-y-6">
                        {showSocial && (
                            <>
                                <SocialLoginButton
                                    onClick={handleGoogleSignIn}
                                    disabled={googleLoading}
                                />
                                <OrSeparator />
                            </>
                        )}
                        {error && (
                            <div className="text-red-500 text-sm text-center mb-4">
                                {error}
                            </div>
                        )}
                        {formContent}
                    </div>
                </div>
            </div>
        </div>
    );

    if (authMode === 'forgotPassword') {
        return commonLayout(
            resetRequested ? t('resetLinkSent') : t('forgotPasswordScreenTitle'),
            resetRequested ? t('resetLinkSentInstruction') : t('forgotPasswordInstruction'),
            resetRequested ? (
                <div className="space-y-6">
                    <AuthButton onClick={() => { setAuthMode('login'); setResetRequested(false); }}>
                        {t('backToLogin')}
                    </AuthButton>
                </div>
            ) : (
                <>
                    <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); setResetRequested(true); }}>
                        <InputField label={t('email')} id="email" name="email" type="email" autoComplete="email" required placeholder="e.g. howard.thurman@gmail.com" />
                        <AuthButton type="submit">
                            {t('sendResetLink')}
                        </AuthButton>
                    </form>
                    <div className="mt-6 text-center text-sm">
                        <button type="button" onClick={() => setAuthMode('login')} className="font-medium text-amber-600 hover:text-amber-500">
                            {t('backToLogin')}
                        </button>
                    </div>
                </>
            ),
            false
        );
    }

    if (authMode === 'signup') {
        return commonLayout(
            t('signup'),
            null,
            <>
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
                        <button onClick={() => setAuthMode('login')} className="font-medium text-amber-600 hover:text-amber-500">
                            {t('login')}
                        </button>
                    </p>
                </div>
            </>,
            true
        );
    }

    // Login mode
    return commonLayout(
        t('login'),
        null,
        <>
            <form className="space-y-8" onSubmit={handleAuth}>
                <InputField label={t('email')} id="email-login" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required placeholder="e.g. howard.thurman@gmail.com" />
                <InputField label={t('password')} id="password-login" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" />

                <div className="text-sm text-right -mt-4">
                    <button type="button" onClick={() => setAuthMode('forgotPassword')} className="font-medium text-amber-600 hover:text-amber-500">{t('forgotPassword')}</button>
                </div>

                <div className="pt-2">
                    <AuthButton type="submit" disabled={authLoading}>
                        {authLoading ? t('loading') || 'Chargement...' : t('login')}
                    </AuthButton>
                </div>
            </form>
            <div className="mt-6 text-center text-sm">
                <p className="text-gray-500 dark:text-gray-400">
                    {t('dontHaveAccount')}{' '}
                    <button onClick={() => setAuthMode('signup')} className="font-medium text-amber-600 hover:text-amber-500">
                        {t('signup')}
                    </button>
                </p>
            </div>
        </>,
        true
    );
}

export default AuthScreen;