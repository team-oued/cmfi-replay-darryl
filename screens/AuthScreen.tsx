import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import AuthHeader from '../components/AuthHeader';
import InputField from '../components/InputField';
import AuthButton from '../components/AuthButton';
import { GoogleIcon } from '../components/icons';

const SocialLoginButton: React.FC<{onClick: () => void}> = ({ onClick }) => {
    const { t } = useAppContext();
    return (
        <button
            onClick={onClick}
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-md font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800/20 hover:bg-gray-50 dark:hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 focus:ring-offset-[#FBF9F3] dark:focus:ring-offset-black transition-all duration-300"
        >
            <GoogleIcon className="w-6 h-6 mr-3" />
            {t('continueWithGoogle')}
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
    const { t, setIsAuthenticated } = useAppContext();
    const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgotPassword'>('login');
    const [resetRequested, setResetRequested] = useState(false);

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
                                <SocialLoginButton onClick={() => setIsAuthenticated(true)} />
                                <OrSeparator />
                            </>
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
                        <InputField label={t('email')} id="email" name="email" type="email" autoComplete="email" required placeholder="e.g. howard.thurman@gmail.com"/>
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
                <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); setIsAuthenticated(true); }}>
                    <InputField label={t('fullName')} id="full-name" name="full-name" type="text" required placeholder="Howard Thurman" />
                    <InputField label={t('email')} id="email-signup" name="email" type="email" autoComplete="email" required placeholder="e.g. howard.thurman@gmail.com" />
                    <InputField label={t('password')} id="password-signup" name="password" type="password" autoComplete="new-password" required placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" />
                    <div className="pt-2">
                        <AuthButton type="submit">
                            {t('getStarted')}
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
            <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); setIsAuthenticated(true); }}>
                <InputField label={t('email')} id="email-login" name="email" type="email" autoComplete="email" required placeholder="e.g. howard.thurman@gmail.com" />
                <InputField label={t('password')} id="password-login" name="password" type="password" autoComplete="current-password" required placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" />
                
                <div className="text-sm text-right -mt-4">
                    <button type="button" onClick={() => setAuthMode('forgotPassword')} className="font-medium text-amber-600 hover:text-amber-500">{t('forgotPassword')}</button>
                </div>

                <div className="pt-2">
                    <AuthButton type="submit">
                        {t('login')}
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