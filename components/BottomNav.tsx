import React from 'react';
import { ActiveTab } from '../types';
import { HomeIcon, SearchIcon, UserIcon } from './icons';
import { useAppContext } from '../context/AppContext';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const NavItem: React.FC<{
    label: string;
    Icon: React.FC<{className?: string}>;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, Icon, isActive, onClick }) => {
  const activeClasses = 'text-amber-500';
  const inactiveClasses = 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white';
  
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}>
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-xs">{label}</span>
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useAppContext();
  
  return (
    <nav className="bg-[#FBF9F3]/80 dark:bg-black/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-lg">
      <div className="flex justify-around">
        <NavItem
          label={t('home')}
          Icon={HomeIcon}
          isActive={activeTab === ActiveTab.Home}
          onClick={() => setActiveTab(ActiveTab.Home)}
        />
        <NavItem
          label={t('search')}
          Icon={SearchIcon}
          isActive={activeTab === ActiveTab.Search}
          onClick={() => setActiveTab(ActiveTab.Search)}
        />
        <NavItem
          label={t('profile')}
          Icon={UserIcon}
          isActive={activeTab === ActiveTab.Profile}
          onClick={() => setActiveTab(ActiveTab.Profile)}
        />
      </div>
    </nav>
  );
};

export default BottomNav;