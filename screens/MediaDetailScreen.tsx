// screens/MediaDetailScreen.tsx

import React, { useState, useEffect } from 'react';
import { MediaContent, MediaType, Episode } from '../types';
import HeaderMenu from '../components/HeaderMenu';
import { PlayIcon, PlusIcon, ArrowLeftIcon, ChevronDownIcon, VolumeHighIcon, LikeIcon, CommentIcon } from '../components/icons';
import { useAppContext } from '../context/AppContext';
import { allContent } from '../data/mockData';
import MediaCard from '../components/MediaCard';

interface MediaDetailScreenProps {
    item: MediaContent;
    onBack: () => void;
    onPlay: (item: MediaContent, episode?: Episode) => void;
    playingItem?: { media: MediaContent; episode?: Episode } | null;
    onSelectMedia: (item: MediaContent) => void;
}

const EpisodeListItem: React.FC<{ episode: Episode, onClick: () => void, isPlaying: boolean }> = ({ episode, onClick, isPlaying }) => {
    const playingClasses = isPlaying ? 'bg-amber-100 dark:bg-amber-900/40' : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50';

    return (
        <div onClick={onClick} className={`flex items-center space-x-4 p-2 rounded-lg ${playingClasses} cursor-pointer transition-all duration-200 relative`}>
            {isPlaying && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-lg"></div>}
            <div className="relative w-32 h-20 bg-gray-300 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                <img src={episode.thumbnailUrl} alt={episode.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    {isPlaying ? (
                        <VolumeHighIcon className="w-8 h-8 text-white/90" />
                    ) : (
                        <PlayIcon className="w-8 h-8 text-white/80" />
                    )}
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <h4 className={`font-semibold truncate ${isPlaying ? 'text-amber-800 dark:text-amber-300' : 'text-gray-900 dark:text-white'}`}>{episode.episodeNumber}. {episode.title}</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{episode.duration}</p>
            </div>
        </div>
    );
};

const formatStat = (num: number | undefined): string => {
    if (num === undefined) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
};


const MediaDetailScreen: React.FC<MediaDetailScreenProps> = ({ item, onBack, onPlay, playingItem, onSelectMedia }) => {
    const { t } = useAppContext();
    const { title, imageUrl, author, description, theme, languages, seasons, type } = item;
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    
    const descriptionThreshold = 150;
    const isLongDescription = description.length > descriptionThreshold;


    // Find the season of the currently playing episode to initialize state
    let playingEpisodeSeasonNumber: number | undefined;
    if (playingItem?.media.id === item.id && playingItem.episode && item.seasons) {
        for (const season of item.seasons) {
            if (season.episodes.some(e => e.episodeNumber === playingItem.episode?.episodeNumber && e.title === playingItem.episode.title)) {
                playingEpisodeSeasonNumber = season.seasonNumber;
                break;
            }
        }
    }
    
    const [expandedSeasons, setExpandedSeasons] = useState<number[]>([]);

    useEffect(() => {
        const initialExpandedSeason = playingEpisodeSeasonNumber ?? (item.seasons ? item.seasons[0].seasonNumber : undefined);
        if (initialExpandedSeason && !expandedSeasons.includes(initialExpandedSeason)) {
            setExpandedSeasons([initialExpandedSeason]);
        }
    }, [playingEpisodeSeasonNumber, item.seasons]);


    const toggleSeason = (seasonNumber: number) => {
        setExpandedSeasons(current => 
            current.includes(seasonNumber) 
                ? current.filter(s => s !== seasonNumber)
                : [...current, seasonNumber]
        );
    };

    const handlePlay = () => {
        const episodeToPlay = type === MediaType.Series ? seasons?.[0]?.episodes[0] : undefined;
        onPlay(item, episodeToPlay);
    };

    const relatedContent = allContent.filter(
        content =>
            (content.theme === item.theme || content.author === item.author) &&
            content.id !== item.id
    ).slice(0, 5);

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

                {(item.likes || item.comments) && (
                    <div className="flex items-center space-x-6 text-gray-600 dark:text-gray-400">
                        {item.likes !== undefined && (
                            <div className="flex items-center space-x-1.5">
                                <LikeIcon className="w-5 h-5 text-red-500/80" />
                                <span className="font-semibold">{formatStat(item.likes)}</span>
                            </div>
                        )}
                        {item.comments !== undefined && (
                            <div className="flex items-center space-x-1.5">
                                <CommentIcon className="w-5 h-5 text-sky-500/80" />
                                <span className="font-semibold">{formatStat(item.comments.length)}</span>
                            </div>
                        )}
                    </div>
                )}

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
                    <p className={`text-gray-600 dark:text-gray-300 leading-relaxed transition-all duration-300 ${isLongDescription && !isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                        {description}
                    </p>
                    {isLongDescription && (
                        <button 
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="text-amber-500 font-semibold mt-1 hover:text-amber-600 dark:hover:text-amber-400"
                        >
                            {isDescriptionExpanded ? t('showLess') : t('readMore')}
                        </button>
                    )}
                </div>
                
                {type === MediaType.Series && seasons && seasons.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold mb-3">{t('episodes')}</h2>
                        <div className="space-y-2">
                            {seasons.map(season => {
                                const isExpanded = expandedSeasons.includes(season.seasonNumber);
                                return (
                                    <div key={season.seasonNumber} className="bg-gray-100/50 dark:bg-gray-800/40 rounded-lg overflow-hidden transition-all duration-300">
                                        <button 
                                            onClick={() => toggleSeason(season.seasonNumber)}
                                            className="w-full flex items-center justify-between p-4 text-left font-semibold hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                                        >
                                            <span className="text-lg">{t('season')} {season.seasonNumber}</span>
                                            <ChevronDownIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isExpanded && (
                                            <div className="px-2 pb-2 space-y-1 animate-fadeIn">
                                                {season.episodes.map(episode => {
                                                    const isPlaying = season.seasonNumber === playingEpisodeSeasonNumber && episode.episodeNumber === playingItem?.episode?.episodeNumber;
                                                    return <EpisodeListItem key={episode.episodeNumber} episode={episode} onClick={() => onPlay(item, episode)} isPlaying={isPlaying} />;
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
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

                {relatedContent.length > 0 && (
                    <div className="pt-4">
                        <h2 className="text-xl font-bold mb-3">{t('relatedContent')}</h2>
                        <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                            {relatedContent.map((relatedItem) => (
                                <MediaCard
                                    key={relatedItem.id}
                                    item={relatedItem}
                                    variant="poster"
                                    onSelect={onSelectMedia}
                                    onPlay={(selectedItem) => onPlay(selectedItem)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaDetailScreen;