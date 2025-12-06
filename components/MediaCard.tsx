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
  const { title, imageUrl, author, progress, type, is_premium, premium_text } = item;
  const handleSelect = () => onSelect && onSelect(item);
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay && onPlay(item);
  };

  // Icône couronne pour le badge premium
  const CrownIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  );

  if (variant === 'poster') {
    return (
      <div onClick={handleSelect} className="flex-shrink-0 w-36 md:w-48 space-y-2.5 cursor-pointer group">
        <div className={`relative aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg md:rounded-xl overflow-hidden ${
          is_premium ? 'ring-2 ring-amber-400/60' : ''
        }`}>
          {is_premium && (
            <>
              {/* Effet de brillance sur la bordure */}
              <div className="absolute inset-0 rounded-lg md:rounded-xl border-2 border-transparent bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 opacity-60 pointer-events-none" style={{ padding: '2px' }}>
                <div className="w-full h-full bg-gray-900 dark:bg-black rounded-lg md:rounded-xl"></div>
              </div>
              {/* Badge Premium */}
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/90 border border-amber-400/50">
                <CrownIcon />
                <span className="text-xs font-semibold text-amber-300">Premium</span>
              </div>
            </>
          )}
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover relative z-0 transition-transform duration-700 group-hover:scale-110" 
          />
          <div
            onClick={handlePlay}
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-10"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/40 transition-transform duration-300">
              <PlayIcon className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" />
            </div>
          </div>
        </div>
        <h3 className="text-gray-900 dark:text-white text-sm font-bold truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-300">{title}</h3>
        {author && <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{author}</p>}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div onClick={handleSelect} className={`flex items-center space-x-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer ${is_premium ? 'ring-2 ring-amber-400/40 bg-gradient-to-r from-amber-950/20 to-transparent' : ''
        }`}>
        <div className={`w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 relative ${is_premium ? 'ring-2 ring-amber-400/60' : ''
          }`}>
          {is_premium && (
            <div className="absolute top-0 right-0 z-10 p-1 bg-black/80 rounded-bl-lg border-l border-b border-amber-400/50">
              <CrownIcon />
            </div>
          )}
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-gray-900 dark:text-white font-semibold">{title}</h3>
            {is_premium && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-400 to-yellow-500 text-black">
                <CrownIcon />
                Premium
              </span>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{author || item.theme}</p>
        </div>
        <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 z-10" onClick={handlePlay}>
          <PlayIcon className="w-7 h-7 text-gray-800 dark:text-white" />
        </button>
      </div>
    );
  }

  // Default variant: 'thumbnail'
  return (
    <div onClick={handleSelect} className="flex-shrink-0 w-64 md:w-80 space-y-2.5 cursor-pointer group">
      <div className={`relative aspect-video bg-gray-300 dark:bg-gray-700 rounded-lg md:rounded-xl overflow-hidden ${
        is_premium ? 'ring-2 ring-amber-400/60' : ''
      }`}>
        {is_premium && (
          <>
            {/* Effet de brillance animé sur la bordure */}
            <div className="absolute inset-0 rounded-lg md:rounded-xl pointer-events-none z-20">
              <div className="absolute inset-0 rounded-lg md:rounded-xl border-2 border-transparent bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 opacity-50 animate-pulse"></div>
            </div>
            {/* Badge Premium Content avec icône couronne */}
            <div className="absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/90 border border-amber-400/60">
              <CrownIcon />
              <span className="text-sm font-semibold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Premium Content
              </span>
            </div>
          </>
        )}
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover relative z-0 transition-transform duration-700 group-hover:scale-110" 
        />
        <div
          onClick={handlePlay}
          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-10"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/40 transition-transform duration-300">
            <PlayIcon className="w-10 h-10 md:w-12 md:h-12 text-white ml-1" />
          </div>
        </div>
        {progress !== undefined && (
          <div className="absolute bottom-0 left-0 w-full h-1.5 md:h-2 bg-black/50 z-20">
            <div className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </div>
      <h3 className="text-gray-900 dark:text-white font-bold truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-300">{title}</h3>
      {author && <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{author}</p>}
    </div>
  );
};

export default MediaCard;