import React from 'react';
import { ArrowLeftIcon, SunIcon, MoonIcon } from './icons';
import HeaderMenu from './HeaderMenu';
import { useAppContext } from '../context/AppContext';

interface HeaderProps {
  title: string;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onBack }) => {
  const { theme, setTheme } = useAppContext();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="bg-[#FBF9F3] dark:bg-black">
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>
          <HeaderMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;