import React from 'react';
import { MediaContent, MediaType } from '../types';
import { PlayIcon } from './icons';

interface MediaCardProps {
  item: MediaContent;
  variant?: 'poster' | 'thumbnail' | 'list';
  onSelect?: (item: MediaContent) => void;
  onPlay?: (item: MediaContent) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, variant = 'thumbnail', onSelect, onPlay }) => {
  const { title, imageUrl, author, progress, type } = item;
  const handleSelect = () => onSelect && onSelect(item);
  const handlePlay = (e: React.MouseEvent) => {
      e.stopPropagation();
      onPlay && onPlay(item);
  };

  if (variant === 'poster') {
    return (
      <div onClick={handleSelect} className="flex-shrink-0 w-36 md:w-48 space-y-2 cursor-pointer group">
        <div className="relative aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-lg transform group-hover:scale-105 transition-transform duration-300">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
           <div 
            onClick={handlePlay}
            className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <PlayIcon className="w-12 h-12 text-white opacity-80" />
          </div>
        </div>
        <h3 className="text-gray-900 dark:text-white text-sm font-semibold truncate">{title}</h3>
        {author && <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{author}</p>}
      </div>
    );
  }

  if (variant === 'list') {
    return (
        <div onClick={handleSelect} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer">
            <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 dark:text-white font-semibold">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{author || item.theme}</p>
            </div>
            <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 z-10" onClick={handlePlay}>
                <PlayIcon className="w-7 h-7 text-gray-800 dark:text-white"/>
            </button>
        </div>
    );
  }

  // Default variant: 'thumbnail'
  return (
    <div onClick={handleSelect} className="flex-shrink-0 w-64 md:w-80 space-y-2 cursor-pointer">
      <div className="relative aspect-video bg-gray-300 dark:bg-gray-700 rounded-lg overflow-hidden shadow-lg group">
        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        <div 
          onClick={handlePlay}
          className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <PlayIcon className="w-12 h-12 text-white opacity-80" />
        </div>
        {progress !== undefined && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-500/50 dark:bg-gray-600">
            <div className="h-1 bg-amber-500" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </div>
      <h3 className="text-gray-900 dark:text-white font-semibold truncate">{title}</h3>
      {author && <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{author}</p>}
    </div>
  );
};

export default MediaCard;