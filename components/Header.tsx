import React from 'react';
import { ArrowLeftIcon, SunIcon, MoonIcon } from './icons';
import HeaderMenu from './HeaderMenu';
import { useAppContext } from '../context/AppContext';
import HamburgerMenu from './HamburgerMenu';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isWatchRoute?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  onBack,
  isSidebarOpen,
  onToggleSidebar,
  isWatchRoute = false
}) => {
  const { theme, setTheme, t, isSidebarCollapsed } = useAppContext();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      {/* Header pour les écrans mobiles */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-[#FBF9F3] dark:bg-black p-4 border-b border-gray-200 dark:border-gray-800 md:hidden">
        <div className="w-full flex items-center justify-between">
          {/* Menu burger à gauche */}
          <HamburgerMenu
            isOpen={isSidebarOpen}
            onClick={onToggleSidebar}
            className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          />

          {/* Titre au centre */}
          <h1 className="text-xl font-bold text-center">CMFI Replay</h1>

          {/* Contrôles à droite */}
          <div className="flex items-center space-x-2">
            <NotificationBell />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <div className="relative">
              <HeaderMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Header pour les écrans plus larges */}
      <header className={`bg-[#FBF9F3] dark:bg-black hidden md:block fixed top-0 right-0 left-0 z-10 transition-all duration-500 ease-in-out ${isWatchRoute ? 'lg:left-0 bg-black/60 backdrop-blur-md' :
          isSidebarCollapsed ? 'lg:left-16' : 'lg:left-64'
        } ${isWatchRoute ? 'bg-opacity-60' : ''}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800">
          {/* Bouton de retour et menu */}
          <div className="flex items-center space-x-4">
            {onBack ? (
              <button
                onClick={onBack}
                className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label="Go back"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 lg:hidden"
                aria-label="Toggle menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{isWatchRoute ? t('watch') : title}</h1>
          </div>

          {/* Contrôles alignés à droite */}
          <div className="flex items-center space-x-4">
            {!isWatchRoute && <NotificationBell />}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            {!isWatchRoute && <HeaderMenu />}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;