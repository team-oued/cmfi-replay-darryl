import React, { useState, useEffect } from 'react';
import { MediaContent, MediaType } from '../types';
import { PlayIcon, PauseIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon, PlusIcon } from './icons';
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
  const { t, bookmarkedIds, toggleBookmark, theme } = useAppContext();

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
    type: MediaType.Movie,
    duration: movie.runtime_h_m,
    description: movie.overview,
    video_path_hd: movie.video_path_hd,
    languages: [movie.original_language],
  })) : propItems || [];

  useEffect(() => {
    if (!items || items.length <= 1 || isPaused) return;

    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentIndex, items, isPaused]);

  // Classes dynamiques basées sur le thème
  const bgClass = theme === 'dark' ? 'bg-black' : 'bg-gray-100';
  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const gradientClass = theme === 'dark'
    ? 'bg-gradient-to-b from-black/60 via-black/40 to-black'
    : 'bg-gradient-to-b from-gray-100/60 via-gray-100/40 to-gray-100';

  if (loading) {
    return (
      <div className={`relative w-full h-[60vh] md:h-[70vh] ${bgClass} flex items-center justify-center`}>
        <div className={`${textClass} text-lg`}>{t('loading') || 'Chargement...'}</div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return <div className={`h-[60vh] md:h-[70vh] ${bgClass}`} />;
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

  const handleSlideClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index !== currentIndex) {
      setCurrentIndex(index);
    } else {
      onSelectMedia(items[index]);
    }
  };

  // Fonction pour obtenir l'index réel avec effet de boucle infinie
  const getLoopedIndex = (index: number) => {
    const len = items.length;
    return ((index % len) + len) % len;
  };

  // Calculer la position et le style de chaque slide pour l'effet coverflow avec boucle
  const getSlideStyle = (index: number) => {
    const diff = index - currentIndex;
    const absDistance = Math.abs(diff);

    // Pour l'effet de boucle, on vérifie aussi la distance "de l'autre côté"
    const loopDiff = diff > 0 ? diff - items.length : diff + items.length;
    const loopAbsDistance = Math.abs(loopDiff);

    // Choisir la distance la plus courte (effet de boucle)
    const actualDiff = loopAbsDistance < absDistance ? loopDiff : diff;
    const actualAbsDistance = Math.abs(actualDiff);

    // Ne montrer que 2 slides de chaque côté (responsive: 1 sur mobile)
    const maxVisible = window.innerWidth < 768 ? 1 : 2;
    if (actualAbsDistance > maxVisible) {
      return {
        opacity: 0,
        transform: 'translateX(0) scale(0.5) rotateY(0deg)',
        zIndex: 0,
        pointerEvents: 'none' as const,
        display: 'none' as const,
      };
    }

    // Espacement adaptatif selon la taille d'écran
    const spacing = window.innerWidth < 768 ? 50 : 35;
    let translateX = actualDiff * spacing; // Espacement horizontal en %
    let scale = 1 - actualAbsDistance * 0.25; // Réduction de taille
    let rotateY = actualDiff * -25; // Rotation 3D
    let opacity = 1 - actualAbsDistance * 0.3;
    let zIndex = 10 - actualAbsDistance;

    return {
      opacity,
      transform: `translateX(${translateX}%) scale(${scale}) rotateY(${rotateY}deg)`,
      zIndex,
      pointerEvents: 'auto' as const,
      display: 'block' as const,
    };
  };

  // Créer un tableau étendu pour l'effet de boucle infinie
  const getVisibleSlides = () => {
    const visibleSlides = [];
    const maxVisible = window.innerWidth < 768 ? 1 : 2;

    for (let i = -maxVisible; i <= maxVisible; i++) {
      const actualIndex = getLoopedIndex(currentIndex + i);
      visibleSlides.push({
        item: items[actualIndex],
        displayIndex: currentIndex + i,
        actualIndex: actualIndex,
      });
    }

    return visibleSlides;
  };

  return (
    <div className={`relative w-full h-[60vh] md:h-[70vh] ${bgClass} ${textClass} overflow-hidden`}>
      {/* Background blur du slide actuel */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={currentItem.imageUrl}
          alt=""
          className="w-full h-full object-cover blur-2xl opacity-30 scale-110"
        />
        <div className={`absolute inset-0 ${gradientClass}`} />
      </div>

      {/* Coverflow Container */}
      <div className="relative h-full flex items-center justify-center" style={{ perspective: window.innerWidth < 768 ? '1200px' : '2000px' }}>
        <div className="relative w-full h-[55%] md:h-[60%] flex items-center justify-center">
          {getVisibleSlides().map(({ item, displayIndex, actualIndex }) => {
            const style = getSlideStyle(displayIndex);
            const isCurrent = displayIndex === currentIndex;

            if (style.display === 'none') return null;

            return (
              <div
                key={items.length >= 5 ? item.id : `${item.id}-${displayIndex}`}
                className="absolute transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer"
                style={{
                  ...style,
                  width: window.innerWidth < 768 ? '75%' : '45%',
                  maxWidth: window.innerWidth < 768 ? '400px' : '600px',
                }}
                onClick={(e) => handleSlideClick(actualIndex, e)}
              >
                <div className={`relative rounded-xl md:rounded-2xl overflow-hidden shadow-2xl ${isCurrent ? 'ring-2 md:ring-4 ring-white/30' : ''}`}>
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover aspect-video"
                  />

                  {/* Overlay gradient - Plus fort pour assurer la lisibilité */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-700 ${isCurrent ? 'opacity-100' : 'opacity-0'}`} />

                  {/* Info du slide actuel - Toujours en blanc pour la lisibilité */}
                  {isCurrent && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 space-y-2 md:space-y-3 animate-fadeIn">
                      <h2 className="text-lg md:text-2xl lg:text-3xl font-bold drop-shadow-lg line-clamp-2 text-white">{item.title}</h2>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 md:gap-3 pt-1 md:pt-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlay(item);
                          }}
                          className="flex items-center gap-1.5 md:gap-2 bg-white text-black px-4 md:px-6 py-2 md:py-2.5 rounded-full text-sm md:text-base font-semibold hover:bg-white/90 transition-all duration-300 hover:scale-105 shadow-lg"
                        >
                          <PlayIcon className="w-4 h-4 md:w-5 md:h-5" />
                          <span>{t('play') || 'Lire'}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(item.id, item.title, item.imageUrl, item.type, item.description || '');
                          }}
                          className="flex items-center justify-center w-9 h-9 md:w-11 md:h-11 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-all duration-300 hover:scale-110 shadow-lg border border-white/30"
                        >
                          {isBookmarked ? (
                            <CheckIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                          ) : (
                            <PlusIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      {items.length > 1 && (
        <>
          {/* Navigation arrows */}
          <button
            onClick={handlePrev}
            className={`absolute left-2 md:left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 lg:p-4 ${theme === 'dark'
              ? 'bg-white/10 hover:bg-white/20 border-white/20'
              : 'bg-gray-900/20 hover:bg-gray-900/30 border-gray-900/30'
              } backdrop-blur-md rounded-full transition-all duration-300 hover:scale-110 border shadow-xl`}
            aria-label={t('previousSlide')}
          >
            <ChevronLeftIcon className={`w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
          </button>

          <button
            onClick={handleNext}
            className={`absolute right-2 md:right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 lg:p-4 ${theme === 'dark'
              ? 'bg-white/10 hover:bg-white/20 border-white/20'
              : 'bg-gray-900/20 hover:bg-gray-900/30 border-gray-900/30'
              } backdrop-blur-md rounded-full transition-all duration-300 hover:scale-110 border shadow-xl`}
            aria-label={t('nextSlide')}
          >
            <ChevronRightIcon className={`w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
          </button>

          {/* Bottom controls - Repositionné plus bas pour ne pas cacher les slides */}
          <div className={`absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 md:space-x-3 ${theme === 'dark'
            ? 'bg-white/10 border-white/20'
            : 'bg-gray-900/20 border-gray-900/30'
            } backdrop-blur-md rounded-full px-4 md:px-6 py-2 md:py-3 border shadow-xl z-20`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(prev => !prev);
              }}
              className={`p-1 md:p-1.5 ${theme === 'dark'
                ? 'hover:bg-white/20 text-white'
                : 'hover:bg-gray-900/20 text-gray-900'
                } rounded-full transition-all duration-300 hover:scale-110`}
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
                  className={`w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300 ${currentIndex === index
                    ? `${theme === 'dark' ? 'bg-white' : 'bg-gray-900'} scale-125 shadow-lg`
                    : `${theme === 'dark' ? 'bg-white/40' : 'bg-gray-900/40'} hover:${theme === 'dark' ? 'bg-white/60' : 'bg-gray-900/60'} hover:scale-110`
                    }`}
                  aria-label={`${t('goToSlide')} ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Hero;