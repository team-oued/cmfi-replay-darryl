import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MediaContent, MediaType } from '../types';
import CategoryScreen from './CategoryScreen';

interface SeriesScreenProps {
    onSelectMedia: (media: MediaContent) => void;
    onPlay: (media: MediaContent) => void;
}

const SeriesScreen: React.FC<SeriesScreenProps> = ({ onSelectMedia, onPlay }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate('/home');
    };

    return (
        <CategoryScreen
            mediaType={MediaType.Series}
            onBack={handleBack}
            onSelectMedia={onSelectMedia}
            onPlay={onPlay}
        />
    );
};

export default SeriesScreen;
