import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MediaContent, MediaType } from '../types';
import CategoryScreen from './CategoryScreen';

interface MoviesScreenProps {
    onSelectMedia: (media: MediaContent) => void;
    onPlay: (media: MediaContent) => void;
}

const MoviesScreen: React.FC<MoviesScreenProps> = ({ onSelectMedia, onPlay }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate('/home');
    };

    return (
        <CategoryScreen
            mediaType={MediaType.Movie}
            onBack={handleBack}
            onSelectMedia={onSelectMedia}
            onPlay={onPlay}
        />
    );
};

export default MoviesScreen;
