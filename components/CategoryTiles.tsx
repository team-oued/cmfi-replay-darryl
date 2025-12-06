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
        <div className="px-4 md:px-6 lg:px-8 py-8 md:py-12">
            <div className="grid grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                {categories.map((category, index) => (
                    <div
                        key={category.type}
                        onClick={() => navigateToCategory(category.type)}
                        className="relative h-32 md:h-40 lg:h-48 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* Image de fond avec parallax effect */}
                        <img
                            src={category.imageUrl}
                            alt={t(category.titleKey as any)}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
                        />

                        {/* Overlay gradient amélioré */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40 group-hover:from-black/80 group-hover:via-black/50 group-hover:to-black/30 transition-all duration-500" />
                        
                        {/* Effet de brillance au hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/10 group-hover:via-white/5 group-hover:to-white/0 transition-all duration-500" />

                        {/* Contenu avec meilleure typographie */}
                        <div className="relative h-full flex items-center justify-center p-4 md:p-6">
                            <div className="text-center transform group-hover:scale-110 transition-transform duration-500">
                                <h3 className="text-white text-lg md:text-xl lg:text-2xl font-black text-center leading-tight uppercase tracking-wider drop-shadow-2xl">
                                    {t(category.titleKey as any)}
                                </h3>
                                {/* Ligne décorative */}
                                <div className="mt-2 md:mt-3 h-0.5 md:h-1 w-0 group-hover:w-16 md:group-hover:w-20 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto transition-all duration-500" />
                            </div>
                        </div>
                        
                        {/* Border glow au hover */}
                        <div className="absolute inset-0 rounded-xl md:rounded-2xl border-2 border-transparent group-hover:border-amber-400/50 transition-all duration-500 pointer-events-none" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryTiles;
