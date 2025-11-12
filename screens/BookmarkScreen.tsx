import React from 'react';
import Header from '../components/Header';
import MediaCard from '../components/MediaCard';
import { bookmarkedContent } from '../data/mockData';
import { MediaContent } from '../types';
import { useAppContext } from '../context/AppContext';

interface BookmarkScreenProps {
    onBack: () => void;
    onSelectMedia: (item: MediaContent) => void;
    onPlay: (item: MediaContent) => void;
}

const BookmarkScreen: React.FC<BookmarkScreenProps> = ({ onBack, onSelectMedia, onPlay }) => {
    const { t } = useAppContext();
    
    return (
        <div>
            <Header title={t('bookmarkScreenTitle')} onBack={onBack} />
            <div className="px-4 py-4">
                {bookmarkedContent.length > 0 ? (
                    <div className="space-y-3">
                        {bookmarkedContent.map((item: MediaContent) => (
                            <MediaCard key={item.id} item={item} variant="list" onSelect={onSelectMedia} onPlay={onPlay} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 px-4 bg-gray-100 dark:bg-gray-800 rounded-lg mt-4">
                        <p className="text-gray-600 dark:text-gray-400">{t('noBookmarks')}</p>
                        <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">{t('noBookmarksHint')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookmarkScreen;