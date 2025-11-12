import React from 'react';
import { ArrowLeftIcon } from './icons';
import HeaderMenu from './HeaderMenu';

interface HeaderProps {
  title: string;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onBack }) => {
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
        <div className="flex items-center">
            <HeaderMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;