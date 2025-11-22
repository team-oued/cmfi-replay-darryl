import React, { useState, useRef, useEffect } from 'react';
import { EllipsisVerticalIcon, LogoutIcon, GlobeIcon } from './icons';
import { useAppContext } from '../context/AppContext';
import { Language } from '../lib/i18n';
import { auth } from '../lib/firebase';
import { toast } from 'react-toastify';

interface HeaderMenuProps {
    variant?: 'light' | 'dark'; // 'light' for light icons on dark bg, 'dark' for dark icons on light bg
}

const HeaderMenu: React.FC<HeaderMenuProps> = ({ variant = 'dark' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { t, setIsAuthenticated, language, setLanguage } = useAppContext();

    const iconColor = variant === 'light' ? 'text-white' : 'text-gray-600 dark:text-gray-400';
    const hoverBg = variant === 'light' ? 'hover:bg-white/20' : 'hover:bg-gray-200 dark:hover:bg-gray-700';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            setIsAuthenticated(false);
            // Rediriger vers l'écran d'accueil après la déconnexion
            window.location.href = '/';
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            toast.error('Une erreur est survenue lors de la déconnexion');
        }
    }

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={menuRef}>
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`p-2 rounded-full transition-colors ${iconColor} ${hoverBg}`}
                >
                    <EllipsisVerticalIcon className="w-6 h-6" />
                </button>
            </div>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#FBF9F3] dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20">
                    <div className="flex items-center px-4 pt-2 pb-1 text-sm text-gray-700 dark:text-gray-200">
                        <GlobeIcon className="w-5 h-5 mr-3 text-gray-400" />
                        <span>{t('language')}</span>
                    </div>
                    <button
                        onClick={() => handleLanguageChange('en')}
                        className={`w-full text-left flex items-center pl-12 pr-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${language === 'en' ? 'text-amber-500' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                        {t('english')}
                    </button>
                    <button
                        onClick={() => handleLanguageChange('fr')}
                        className={`w-full text-left flex items-center pl-12 pr-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${language === 'fr' ? 'text-amber-500' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                        {t('french')}
                    </button>

                    <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
                    <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <LogoutIcon className="w-5 h-5 mr-3" />
                        {t('logout')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default HeaderMenu;