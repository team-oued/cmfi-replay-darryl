import React from 'react';
import Header from '../components/Header';
import MediaCard from '../components/MediaCard';
import { continueWatching, allContent, mostWatched, mostLiked } from '../data/mockData';
import { MediaContent, MediaType } from '../types';
import { useAppContext } from '../context/AppContext';

interface CategoryScreenProps {
    mediaType: MediaType;
    onBack: () => void;
    onSelectMedia: (item: MediaContent) => void;
    onPlay: (item: MediaContent) => void;
}

const MediaRow: React.FC<{ title: string; items: MediaContent[]; onSelectMedia: (item: MediaContent) => void; onPlay: (item: MediaContent) => void; variant?: 'poster' | 'thumbnail' | 'list' }> = ({ title, items, onSelectMedia, onPlay, variant }) => {
    if (items.length === 0) return null;
    return (
        <section className="py-4">
            <h3 className="text-xl font-bold px-4 mb-3">{title}</h3>
            <div className="flex space-x-4 overflow-x-auto px-4 scrollbar-hide pb-2">
            {items.map((item) => (
                <MediaCard key={item.id} item={item} variant={variant} onSelect={onSelectMedia} onPlay={onPlay} />
            ))}
            </div>
        </section>
    );
};


const CategoryScreen: React.FC<CategoryScreenProps> = ({ mediaType, onBack, onSelectMedia, onPlay }) => {
    const { t } = useAppContext();
    
    const screenTitleMap: Record<MediaType, string> = {
        [MediaType.Series]: t('seriesScreenTitle'),
        [MediaType.Documentary]: t('documentariesScreenTitle'),
        [MediaType.Podcast]: t('podcastsScreenTitle'),
    };
    
    const sectionTitleMap = {
        all: {
            [MediaType.Series]: t('allSeries'),
            [MediaType.Documentary]: t('allDocumentaries'),
            [MediaType.Podcast]: t('allPodcasts'),
        },
        mostWatched: {
            [MediaType.Series]: t('mostWatchedSeries'),
            [MediaType.Documentary]: t('mostWatchedDocumentaries'),
            [MediaType.Podcast]: t('mostWatchedPodcasts'),
        },
        mostLiked: {
            [MediaType.Series]: t('mostLikedSeries'),
            [MediaType.Documentary]: t('mostLikedDocumentaries'),
            [MediaType.Podcast]: t('mostLikedPodcasts'),
        }
    };
    
    const continueWatchingForCategory = continueWatching.filter(item => item.type === mediaType);
    const allForCategory = allContent.filter(item => item.type === mediaType);
    const mostWatchedForCategory = mostWatched.filter(item => item.type === mediaType);
    const mostLikedForCategory = mostLiked.filter(item => item.type === mediaType);

    return (
        <div className="animate-fadeIn">
            <Header title={screenTitleMap[mediaType]} onBack={onBack} />
            <div className="space-y-4">
                <MediaRow title={t('continueWatching')} items={continueWatchingForCategory} onSelectMedia={onSelectMedia} onPlay={onPlay} />
                <MediaRow title={sectionTitleMap.all[mediaType]} items={allForCategory} variant="poster" onSelectMedia={onSelectMedia} onPlay={onPlay} />
                <MediaRow title={sectionTitleMap.mostWatched[mediaType]} items={mostWatchedForCategory} onSelectMedia={onSelectMedia} onPlay={onPlay} />
                <MediaRow title={sectionTitleMap.mostLiked[mediaType]} items={mostLikedForCategory} variant="poster" onSelectMedia={onSelectMedia} onPlay={onPlay} />
            </div>
        </div>
    );
};

export default CategoryScreen;
