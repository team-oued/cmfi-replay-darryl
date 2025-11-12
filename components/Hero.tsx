import React, { useState, useEffect } from 'react';
import { MediaContent } from '../types';
import { PlayIcon, PlusIcon, PauseIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon } from './icons';
import { useAppContext } from '../context/AppContext';

interface HeroProps {
  items: MediaContent[];
  onSelectMedia: (item: MediaContent) => void;
  onPlay: (item: MediaContent) => void;
}

const Hero: React.FC<HeroProps> = ({ items, onSelectMedia, onPlay }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { t, bookmarkedIds, toggleBookmark } = useAppContext();

  useEffect(() => {
    if (!items || items.length <= 1 || isPaused) return;

    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearTimeout(timer);
  }, [currentIndex, items, isPaused]);

  if (!items || items.length === 0) {
    return <div className="h-[55vh] bg-gray-300 dark:bg-gray-800" />;
  }
  
  const currentItem = items[currentIndex];
  const isBookmarked = bookmarkedIds.includes(currentItem.id);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay(currentItem);
  };

  return (
    <div className="relative w-full h-[55vh] text-white">
      <div className="absolute inset-0 w-full h-full cursor-pointer" onClick={() => onSelectMedia(currentItem)}>
        {items.map((item, index) => (
          <img
            key={item.id}
            src={item.imageUrl}
            alt={item.title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent dark:from-gray-900" />
      
      <div className="relative h-full flex flex-col justify-end p-4 pb-24">
        <div key={currentIndex} className="space-y-3 animate-fadeIn">
          <h1 className="text-3xl md:text-4xl font-extrabold drop-shadow-lg leading-tight">{currentItem.title}</h1>
          <p className="text-sm font-medium text-gray-200">{currentItem.theme}</p>
          <div className="flex items-center space-x-3 pt-2">
            <button className="flex items-center justify-center bg-white text-gray-900 font-bold py-2.5 px-6 rounded-lg hover:bg-gray-200 transition-colors duration-200 shadow-lg" onClick={handlePlay}>
              <PlayIcon className="w-5 h-5 mr-2" />
              <span>{t('play')}</span>
            </button>
            <button 
              onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmark(currentItem.id);
              }}
              className={`flex items-center justify-center font-bold py-2.5 px-6 rounded-lg backdrop-blur-sm transition-colors duration-200 ${
                  isBookmarked 
                      ? 'bg-amber-500 text-gray-900' 
                      : 'bg-white/20 text-white hover:bg-white/30'
              }`}
          >
              {isBookmarked ? <CheckIcon className="w-5 h-5 mr-2" /> : <PlusIcon className="w-5 h-5 mr-2" />}
              <span>{isBookmarked ? t('addedToList') : t('myList')}</span>
          </button>
          </div>
        </div>
      </div>

      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-black/40 backdrop-blur-sm rounded-full px-3 py-2">
            <button onClick={handlePrev} className="p-1 text-white rounded-full hover:bg-white/20" aria-label={t('previousSlide')}>
                <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
                onClick={() => setIsPaused(prev => !prev)}
                className="text-white"
                aria-label={isPaused ? t('playCarousel') : t('pauseCarousel')}
            >
                {isPaused ? <PlayIcon className="w-5 h-5" /> : <PauseIcon className="w-5 h-5" />}
            </button>
            <div className="flex items-center space-x-2">
                {items.map((_, index) => (
                <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-white' : 'border border-white/80'}`}
                    aria-label={`${t('goToSlide')} ${index + 1}`}
                />
                ))}
            </div>
            <button onClick={handleNext} className="p-1 text-white rounded-full hover:bg-white/20" aria-label={t('nextSlide')}>
                <ChevronRightIcon className="w-5 h-5" />
            </button>
        </div>
      )}
    </div>
  );
};

export default Hero;