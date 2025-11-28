import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { theme } = useAppContext();

    useEffect(() => {
        // Ajoute ou supprime la classe 'dark' sur l'élément racine
        const root = window.document.documentElement;
        
        if (theme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
        
        // Sauvegarder le thème dans localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    return <>{children}</>;
};
