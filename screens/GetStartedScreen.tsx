import React from 'react';
import { useAppContext } from '../context/AppContext';
import AuthHeader from '../components/AuthHeader';

interface GetStartedScreenProps {
    onGetStarted: () => void;
}

const GetStartedScreen: React.FC<GetStartedScreenProps> = ({ onGetStarted }) => {
    const { t } = useAppContext();

    return (
        <div className="relative w-full h-screen text-white animate-fadeIn">
            <AuthHeader />
            
            {/* Background Image */}
            <img
                src="https://firebasestorage.googleapis.com/v0/b/c-m-f-i-replay-f-63xui3.appspot.com/o/zacharias-tanee-fomum.jpg?alt=media&token=f85b8398-39ea-4d72-897a-ada8fb709196"
                alt="Community"
                className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
            
            <div className="relative h-full flex flex-col justify-end items-center text-center p-8 pb-16">
                <div className="space-y-4 max-w-lg">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg">
                        CMFI Replay
                    </h1>
                    <p className="text-lg text-gray-200">
                        {t('slogan')}
                    </p>
                </div>
                
                <div className="mt-12 w-full max-w-sm">
                    <button 
                        onClick={onGetStarted}
                        className="w-full bg-amber-500 text-gray-900 font-bold py-4 px-8 rounded-full text-lg hover:bg-amber-400 transition-colors duration-300 shadow-xl transform hover:scale-105"
                    >
                        {t('getStarted')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GetStartedScreen;