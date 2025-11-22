import React from 'react';
import { MediaType } from '../types';
import { useAppContext } from '../context/AppContext';

interface CategoryTilesProps {
    navigateToCategory: (type: MediaType) => void;
}

const CategoryTiles: React.FC<CategoryTilesProps> = ({ navigateToCategory }) => {
    const { t } = useAppContext();

    const categories = [
        {
            titleKey: 'categorySeries',
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/c-m-f-i-replay-f-63xui3.appspot.com/o/category_tiles%2Fseries.jpg?alt=media&token=b5bf69db-1022-473d-9f00-a0641e8b65bf',
            type: MediaType.Series,
        },
        {
            titleKey: 'categoryMovies',
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/c-m-f-i-replay-f-63xui3.appspot.com/o/category_tiles%2Ffilms.jpg?alt=media&token=9aea9207-ec9b-4215-a735-1c4c56224a31',
            type: MediaType.Movie,
        },
        {
            titleKey: 'categoryPodcasts',
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/c-m-f-i-replay-f-63xui3.appspot.com/o/category_tiles%2Fpodcast.webp?alt=media&token=30b5ebe3-1b43-4e81-8c15-a29909b5f73c',
            type: MediaType.Podcast,
        },
    ];

    return (
        <div className="px-4 py-6">
            <div className="grid grid-cols-3 gap-3">
                {categories.map((category) => (
                    <div
                        key={category.type}
                        onClick={() => navigateToCategory(category.type)}
                        className="relative h-24 rounded-xl overflow-hidden cursor-pointer group"
                    >
                        {/* Image de fond */}
                        <img
                            src={category.imageUrl}
                            alt={t(category.titleKey as any)}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />

                        {/* Overlay sombre */}
                        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors duration-300" />

                        {/* Contenu */}
                        <div className="relative h-full flex items-center justify-center p-3">
                            <h3 className="text-white text-base md:text-lg font-extrabold text-center leading-tight uppercase drop-shadow-2xl">
                                {t(category.titleKey as any)}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryTiles;
