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
          </div>
        </div>
      </div>

      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-black/40 backdrop-blur-sm rounded-full px-8 py-2">
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