import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rectangular',
    width,
    height
}) => {
    const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700";

    const variantClasses = {
        text: "rounded",
        circular: "rounded-full",
        rectangular: "rounded-none",
        rounded: "rounded-md",
    };

    const style = {
        width: width,
        height: height,
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

export const MediaCardSkeleton: React.FC<{ variant?: 'poster' | 'thumbnail' }> = ({ variant = 'poster' }) => {
    if (variant === 'poster') {
        return (
            <div className="flex-shrink-0 w-[140px] space-y-2">
                <Skeleton variant="rounded" height={210} className="w-full" />
                <Skeleton variant="text" height={16} width="80%" />
                <Skeleton variant="text" height={12} width="60%" />
            </div>
        );
    }

    return (
        <div className="flex-shrink-0 w-[240px] space-y-2">
            <Skeleton variant="rounded" height={135} className="w-full" />
            <Skeleton variant="text" height={16} width="90%" />
            <Skeleton variant="text" height={12} width="70%" />
        </div>
    );
};

export const UserAvatarSkeleton: React.FC = () => {
    return (
        <div className="flex-shrink-0 flex flex-col items-center space-y-2 w-[72px]">
            <Skeleton variant="circular" width={64} height={64} />
            <Skeleton variant="text" height={12} width={50} />
        </div>
    );
};

export const HeroSkeleton: React.FC = () => {
    return (
        <div className="relative w-full h-[50vh] min-h-[400px] bg-gray-900 flex items-end pb-12">
            <div className="w-full px-4 space-y-4">
                <Skeleton variant="text" height={32} width="60%" className="bg-gray-800" />
                <Skeleton variant="text" height={16} width="80%" className="bg-gray-800" />
                <div className="flex space-x-4 pt-4">
                    <Skeleton variant="rounded" height={40} width={120} className="bg-gray-800" />
                    <Skeleton variant="rounded" height={40} width={120} className="bg-gray-800" />
                </div>
            </div>
        </div>
    );
};

export const ContinueWatchingSkeleton: React.FC = () => {
    return (
        <div className="mb-8">
            <Skeleton variant="text" height={32} width="200px" className="mx-4 mb-4" />
            <div className="px-4">
                <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex-none w-48 sm:w-56 md:w-64 lg:w-72">
                            <div className="flex flex-col">
                                <Skeleton variant="rounded" className="aspect-video w-full mb-2" />
                                <Skeleton variant="text" height={16} width="90%" className="mb-1" />
                                <Skeleton variant="text" height={12} width="60%" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const CategoryTilesSkeleton: React.FC = () => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} variant="rounded" className="aspect-video w-full" />
            ))}
        </div>
    );
};

export const MostLikedSkeleton: React.FC = () => {
    return (
        <div className="mb-8">
            <Skeleton variant="text" height={32} width="200px" className="mx-4 mb-4" />
            <div className="px-4">
                <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex-none w-48 sm:w-56 md:w-64 lg:w-72">
                            <div className="relative">
                                <Skeleton variant="rounded" className="aspect-video w-full" />
                                <div className="absolute top-2 right-2 bg-black/70 rounded-full w-8 h-8 flex items-center justify-center">
                                    <Skeleton variant="circular" width={20} height={20} className="bg-white/50" />
                                </div>
                            </div>
                            <div className="mt-2">
                                <Skeleton variant="text" height={16} width="90%" className="mb-1" />
                                <Skeleton variant="text" height={12} width="60%" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
