import React, { useState, useEffect } from 'react';
import { infoBarService } from '../lib/firestore';
import { useAppContext } from '../context/AppContext';

interface InfoBarMessage {
    id: string;
    message: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const InfoBar: React.FC = () => {
    const { theme } = useAppContext();
    const [message, setMessage] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActiveMessage = async () => {
            try {
                const activeMessage = await infoBarService.getActiveMessage();
                if (activeMessage && activeMessage.message) {
                    setMessage(activeMessage.message);
                }
            } catch (error) {
                console.error('Error fetching info bar message:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActiveMessage();
    }, []);

    // Ne pas afficher si pas de message ou en chargement
    if (loading || !message) {
        return null;
    }

    return (
        <div className={`relative w-full overflow-hidden ${
            theme === 'dark' 
                ? 'bg-gradient-to-r from-amber-900/20 via-amber-800/30 to-amber-900/20 border-y border-amber-700/30' 
                : 'bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 border-y border-amber-200'
        }`}>
            <div className="flex items-center py-2 md:py-3">
                {/* Icône d'information */}
                <div className={`flex-shrink-0 px-4 md:px-6 ${
                    theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                }`}>
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                {/* Message déroulant */}
                <div className="flex-1 overflow-hidden">
                    <div 
                        className="whitespace-nowrap animate-scroll"
                        style={{
                            animation: 'scroll 30s linear infinite',
                        }}
                    >
                        <span className={`text-sm md:text-base font-medium ${
                            theme === 'dark' ? 'text-amber-200' : 'text-amber-900'
                        }`}>
                            {message}
                        </span>
                        {/* Dupliquer le message pour un défilement continu */}
                        <span className={`ml-8 text-sm md:text-base font-medium ${
                            theme === 'dark' ? 'text-amber-200' : 'text-amber-900'
                        }`}>
                            {message}
                        </span>
                    </div>
                </div>
            </div>

            {/* Styles CSS pour l'animation */}
            <style>{`
                @keyframes scroll {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
            `}</style>
        </div>
    );
};

export default InfoBar;

