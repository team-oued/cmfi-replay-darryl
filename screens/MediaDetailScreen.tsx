// screens/MediaDetailScreen.tsx

import React, { useState } from 'react';
import { MediaContent, MediaType, Episode } from '../types';
import HeaderMenu from '../components/HeaderMenu';
import { PlayIcon, PlusIcon, ArrowLeftIcon } from '../components/icons';
import { useAppContext } from '../context/AppContext';

interface MediaDetailScreenProps {
    item: MediaContent;
    onBack: () => void;
    onPlay: (item: MediaContent, episode?: Episode) => void;
}

const EpisodeListItem: React.FC<{ episode: Episode, onClick: () => void }> = ({ episode, onClick }) => {
    return (
        <div onClick={onClick} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer">
            <div className="relative w-32 h-20 bg-gray-300 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                <img src={episode.thumbnailUrl} alt={episode.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <PlayIcon className="w-8 h-8 text-white/80" />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-gray-900 dark:text-white font-semibold truncate">{episode.episodeNumber}. {episode.title}</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{episode.duration}</p>
            </div>
        </div>
    );
};


const MediaDetailScreen: React.FC<MediaDetailScreenProps> = ({ item, onBack, onPlay }) => {
    const { t } = useAppContext();
    const [selectedSeason, setSelectedSeason] = useState(item.seasons ? item.seasons[0].seasonNumber : 1);

    const { title, imageUrl, author, description, theme, languages, seasons, type } = item;
    
    const currentSeason = seasons?.find(s => s.seasonNumber === selectedSeason);

    const handlePlay = () => {
        const episodeToPlay = type === MediaType.Series ? currentSeason?.episodes[0] : undefined;
        onPlay(item, episodeToPlay);
    };

    return (
        <div className="animate-fadeIn pb-8">
            <div className="relative h-[60vh]">
                <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#FBF9F3] via-[#FBF9F3]/70 to-transparent dark:from-black dark:via-black/70" />
                <header className="absolute top-0 left-0 right-0 z-10">
                    <div className="flex items-center justify-between h-16 px-4">
                        <button 
                        onClick={onBack} 
                        className="p-2 rounded-full text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors"
                        aria-label="Go back"
                        >
                        <ArrowLeftIcon className="w-6 h-6" />
                        </button>
                        <div className="p-1 rounded-full bg-black/40 backdrop-blur-sm">
                            <HeaderMenu variant="light" />
                        </div>
                    </div>
                </header>
            </div>

            <div className="p-4 -mt-32 relative z-10 space-y-6">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white drop-shadow-lg">{title}</h1>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{theme}</span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full" />
                    {author && <span>{author}</span>}
                     {item.duration && (
                        <>
                         <span className="w-1 h-1 bg-gray-400 rounded-full" />
                         <span>{item.duration}</span>
                        </>
                     )}
                </div>

                <div className="flex items-center space-x-3 pt-2">
                    <button onClick={handlePlay} className="flex items-center justify-center bg-amber-500 text-gray-900 font-bold py-3 px-8 rounded-lg hover:bg-amber-400 transition-colors duration-200 shadow-lg">
                        <PlayIcon className="w-6 h-6 mr-2" />
                        <span>{t('play')}</span>
                    </button>
                    <button className="flex items-center justify-center bg-gray-200/80 dark:bg-gray-800/80 text-gray-900 dark:text-white font-bold py-3 px-6 rounded-lg backdrop-blur-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200">
                        <PlusIcon className="w-6 h-6 mr-2" />
                        <span>{t('myList')}</span>
                    </button>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">{t('description')}</h2>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
                </div>
                
                {type === MediaType.Series && seasons && seasons.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold mb-3">{t('seasons')}</h2>
                        <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
                            {seasons.map(season => (
                                <button
                                    key={season.seasonNumber}
                                    onClick={() => setSelectedSeason(season.seasonNumber)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors duration-200 ${
                                        selectedSeason === season.seasonNumber 
                                        ? 'bg-amber-500 text-white shadow' 
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {t('season')} {season.seasonNumber}
                                </button>
                            ))}
                        </div>
                        {currentSeason && (
                            <div className="mt-4 space-y-2">
                                <h3 className="text-lg font-semibold">{currentSeason.episodes.length} {t('episodes')}</h3>
                                {currentSeason.episodes.map(episode => (
                                    <EpisodeListItem key={episode.episodeNumber} episode={episode} onClick={() => onPlay(item, episode)} />
                                ))}
                            </div>
                        )}
                    </div>
                )}


                <div>
                    <h2 className="text-xl font-bold mb-2">{t('languages')}</h2>
                    <div className="flex flex-wrap gap-2">
                        {languages.map(lang => (
                            <span key={lang} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium py-1 px-3 rounded-full">
                                {lang}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaDetailScreen;