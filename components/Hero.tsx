import React, { useState, useEffect } from 'react';
import { MediaContent } from '../types';
import { PlayIcon, PlusIcon, PauseIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon } from './icons';
import { useAppContext } from '../context/AppContext';
import { movieService, Movie } from '../lib/firestore';

interface HeroProps {
  items?: MediaContent[];
  onSelectMedia: (item: MediaContent) => void;
  onPlay: (item: MediaContent) => void;
}

const Hero: React.FC<HeroProps> = ({ items: propItems, onSelectMedia, onPlay }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, bookmarkedIds, toggleBookmark } = useAppContext();

  // Récupérer les 10 films les plus populaires depuis Firestore
  useEffect(() => {
    const fetchPopularMovies = async () => {
      try {
        const popularMovies = await movieService.getPopularMovies(10);
        setMovies(popularMovies);
      } catch (error) {
        console.error('Error fetching popular movies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularMovies();
  }, []);

  // Utiliser les films de Firestore si disponibles, sinon utiliser les props
  const items = movies.length > 0 ? movies.map(movie => ({
    id: movie.uid,
    title: movie.title,
    theme: movie.original_language,
    imageUrl: movie.backdrop_path,
    type: 'movie' as const,
    duration: movie.runtime_h_m,
    year: '',
    rating: 0,
    description: movie.overview,
    video_path_hd: movie.video_path_hd,
    languages: [movie.original_language], // Add missing property
    cast: [], // Add missing property
    director: '', // Add missing property
  })) : propItems || [];

  useEffect(() => {
    if (!items || items.length <= 1 || isPaused) return;

    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearTimeout(timer);
  }, [currentIndex, items, isPaused]);

  if (loading) {
    return (
      <div className="relative w-full h-[55vh] bg-gray-300 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-white text-lg">{t('loading') || 'Chargement...'}</div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return <div className="h-[55vh] bg-gray-300 dark:bg-gray-800" />;
  }

  const currentItem = items[currentIndex];
  const isBookmarked = bookmarkedIds.includes(currentItem.id);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  return (
    <div
      className="relative w-full h-[55vh] text-white cursor-pointer group"
      onClick={() => onSelectMedia(currentItem)}
    >
      <div className="absolute inset-0 w-full h-full">
        {items.map((item, index) => (
          <img
            key={item.id}
            src={item.imageUrl}
            alt={item.title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent dark:from-gray-900 pointer-events-none" />

      <div className="relative h-full flex flex-col justify-end p-4 pb-24 pointer-events-none">
        <div key={currentIndex} className="space-y-3 animate-fadeIn">
          <h1 className="text-3xl md:text-4xl font-extrabold drop-shadow-lg leading-tight">{currentItem.title}</h1>
          <p className="text-sm font-medium text-gray-200">{currentItem.theme}</p>
        </div>
      </div>

      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-2 md:space-x-3 bg-white/10 backdrop-blur-md rounded-full px-4 md:px-8 py-2 md:py-3 border border-white/20 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handlePrev}
            className="p-1 md:p-1.5 text-white rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-110"
            aria-label={t('previousSlide')}
          >
            <ChevronLeftIcon className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPaused(prev => !prev);
            }}
            className="p-1 md:p-1.5 text-white hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110"
            aria-label={isPaused ? t('playCarousel') : t('pauseCarousel')}
          >
            {isPaused ? <PlayIcon className="w-4 h-4 md:w-5 md:h-5" /> : <PauseIcon className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
          <div className="flex items-center space-x-1.5 md:space-x-2 px-1 md:px-2">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300 ${currentIndex === index
                  ? 'bg-white scale-125 shadow-lg'
                  : 'bg-white/40 hover:bg-white/60 hover:scale-110'
                  }`}
                aria-label={`${t('goToSlide')} ${index + 1}`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="p-1 md:p-1.5 text-white rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-110"
            aria-label={t('nextSlide')}
          >
            <ChevronRightIcon className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Hero;