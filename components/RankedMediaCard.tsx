import React from 'react';
import { MediaContent } from '../types';
import { PlayIcon, EyeIcon } from './icons';

interface RankedMediaCardProps {
    item: MediaContent;
    rank: number;
    viewCount?: number;
    onSelect?: (item: MediaContent) => void;
    onPlay?: (item: MediaContent) => void;
}

const RankedMediaCard: React.FC<RankedMediaCardProps> = ({
    item,
    rank,
    viewCount,
    onSelect,
    onPlay
}) => {
    const { title, imageUrl, author } = item;
    const handleSelect = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect && onSelect(item);
    };

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        onPlay && onPlay(item);
    };
    
    const handleCardClick = (e: React.MouseEvent) => {
        e.preventDefault();
        // Si on a un gestionnaire onPlay, on l'appelle, sinon on utilise onSelect
        if (onPlay) {
            onPlay(item);
        } else if (onSelect) {
            onSelect(item);
        }
    };

    return (
        <div
            onClick={handleCardClick}
            className="flex-shrink-0 w-64 md:w-80 cursor-pointer group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(e as any);
                }
            }}
        >
            <div className="relative aspect-video bg-gray-300 dark:bg-gray-700 rounded-xl overflow-hidden shadow-lg">
                {/* Badge de vues */}
                {viewCount !== undefined && (
                    <div className="absolute top-2 right-2 z-10 flex items-center bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full">
                        <EyeIcon className="w-3 h-3 mr-1" />
                        <span className="font-bold">{viewCount.toLocaleString()}</span>
                    </div>
                )}
                
                {/* Image */}
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Overlay au hover avec bouton play */}
                <div
                    onClick={handlePlay}
                    className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                    <PlayIcon className="w-16 h-16 text-white opacity-90" />
                </div>

                {/* Gradient en bas pour le texte */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                {/* Numéro de classement et informations */}
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end space-x-3">
                    {/* Numéro de classement */}
                    <div className="flex-shrink-0">
                        <span className="text-white text-6xl md:text-7xl font-black leading-none opacity-90 drop-shadow-lg" style={{
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                        }}>
                            {rank}
                        </span>
                    </div>

                    {/* Titre et genre */}
                    <div className="flex-1 min-w-0 pb-2">
                        <h3 className="text-white text-lg md:text-xl font-bold truncate drop-shadow-md">
                            {title}
                        </h3>
                        {author && (
                            <p className="text-gray-200 text-sm md:text-base truncate drop-shadow-md">
                                {author}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RankedMediaCard;
