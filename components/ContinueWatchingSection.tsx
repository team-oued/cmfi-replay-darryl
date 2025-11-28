import React from 'react';
import { ContinueWatchingItem } from '../lib/firestore';
import { PlayIcon } from './icons';

interface ContinueWatchingCardProps {
    item: ContinueWatchingItem;
    onClick: () => void;
}

const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ item, onClick }) => {
    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        }
        return `${minutes}min`;
    };

    const remainingTime = item.runtime - item.tempsRegarde;

    return (
        <div
            onClick={onClick}
        >
            <div className="group cursor-pointer transition-all duration-300 hover:scale-105 flex flex-col">
                {/* Image container */}
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-800 shadow-lg mb-2">
                    <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                            <PlayIcon className="w-6 h-6 md:w-7 md:h-7 text-black ml-0.5" />
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                        <div
                            className="h-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                        />
                    </div>
                </div>

                {/* Info container */}
                <div className="px-1 py-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 h-10 flex items-center">
                        {item.title}
                    </h3>
                    {item.type === 'episode' && item.episodeTitle && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1 mt-1">
                            Ép. {item.episodeNumber} - {item.episodeTitle}
                        </p>
                    )}
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                            {formatTime(remainingTime)} restant{item.type === 'episode' ? 'es' : ''}
                        </p>
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ContinueWatchingSectionProps {
    items: ContinueWatchingItem[];
    onItemClick: (item: ContinueWatchingItem) => void;
    title?: string;
}

const ContinueWatchingSection: React.FC<ContinueWatchingSectionProps> = ({
    items,
    onItemClick,
    title = 'Continuer la lecture'
}) => {
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-900 dark:text-white px-4">
                {title}
            </h2>
            <div className="px-4">
                <div className="relative">
                <div className="flex overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
                    <div className="flex space-x-4">
                        {items.map((item) => (
                            <div key={item.id} className="flex-none w-48 sm:w-56 md:w-64 lg:w-72">
                                <ContinueWatchingCard
                                    item={item}
                                    onClick={() => onItemClick(item)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default ContinueWatchingSection;
