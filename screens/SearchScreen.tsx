import React, { useState } from 'react';
import Header from '../components/Header';
import MediaCard from '../components/MediaCard';
import { SearchIcon } from '../components/icons';
import { allContent, themes } from '../data/mockData';
import { MediaContent } from '../types';
import { useAppContext } from '../context/AppContext';

interface SearchScreenProps {
  onSelectMedia: (item: MediaContent) => void;
  onPlay: (item: MediaContent) => void;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ onSelectMedia, onPlay }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<MediaContent[]>([]);
  const { t } = useAppContext();

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term) {
      setResults([]);
      return;
    }
    const filtered = allContent.filter(
      (item) =>
        item.title.toLowerCase().includes(term.toLowerCase()) ||
        item.author?.toLowerCase().includes(term.toLowerCase()) ||
        item.theme.toLowerCase().includes(term.toLowerCase())
    );
    setResults(filtered);
  };

  const handleThemeClick = (theme: string) => {
    handleSearch(theme);
  };

  return (
    <div>
      <Header title={t('searchScreenTitle')} />

      <div className="px-4 py-2">
        <div className="relative">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-gray-200 dark:bg-black/80 border border-gray-300 dark:border-gray-700 rounded-full py-3 pl-12 pr-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <h3 className="text-lg font-semibold mb-3">{t('browseByTheme')}</h3>
        <div className="flex flex-wrap gap-2">
          {themes.map(theme => (
            <button
              key={theme}
              onClick={() => handleThemeClick(theme)}
              className="bg-gray-200 dark:bg-black/80 hover:bg-gray-300 dark:hover:bg-black/60 text-gray-700 dark:text-gray-200 text-sm font-medium py-1.5 px-3 rounded-full transition-colors duration-200 border border-gray-300 dark:border-gray-700"
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {searchTerm && (
          <h3 className="text-lg font-semibold mb-3">
            {/* Fix: Pass variables to the translation function as an object */}
            {results.length > 0 ? t('resultsFor', { term: searchTerm }) : t('noResultsFor', { term: searchTerm })}
          </h3>
        )}
        <div className="space-y-3">
          {results.map(item => (
            <MediaCard key={item.id} item={item} variant="list" onSelect={onSelectMedia} onPlay={onPlay} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchScreen;