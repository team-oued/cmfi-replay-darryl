import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { SunIcon, MoonIcon, GlobeIcon } from '../components/icons';
import { Language } from '../lib/i18n';

const PrivacyScreen: React.FC = () => {
    const navigate = useNavigate();
    const { theme, setTheme, language, setLanguage } = useAppContext();
    const [showFullText, setShowFullText] = useState(false);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsLangMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
        setIsLangMenuOpen(false);
    };

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="min-h-screen bg-[#FBF9F3] dark:bg-black text-gray-900 dark:text-white">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-semibold">Politique de Confidentialité</h1>
                    </div>
                    
                    {/* Theme and Language Controls */}
                    <div className="flex items-center space-x-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                        </button>

                        {/* Language Selector */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                                className="flex items-center space-x-2 p-2 rounded-full text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Select language"
                            >
                                <GlobeIcon className="w-5 h-5" />
                                <span className="text-sm font-semibold uppercase">{language}</span>
                                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isLangMenuOpen && (
                                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                                    <button 
                                        onClick={() => handleLanguageChange('en')}
                                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                                        disabled={language === 'en'}
                                    >
                                        English
                                    </button>
                                    <button 
                                        onClick={() => handleLanguageChange('fr')}
                                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                                        disabled={language === 'fr'}
                                    >
                                        Français
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Message d'introduction */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-900 dark:text-blue-300">
                        <strong>CMFIReplay</strong> s'engage à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD). 
                        Veuillez lire attentivement cette politique.
                    </p>
                </div>

                {/* Résumé */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        📋 Résumé
                    </h2>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                        <li>Nous collectons uniquement les données nécessaires au fonctionnement de la plateforme</li>
                        <li>Vos données sont sécurisées et ne sont jamais partagées avec des tiers sans votre consentement</li>
                        <li>Vous pouvez à tout moment accéder, modifier ou supprimer vos données</li>
                        <li>Nous utilisons vos données pour améliorer votre expérience de visionnage</li>
                    </ul>
                </div>

                {/* Bouton pour afficher/masquer le texte complet */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <button
                        onClick={() => setShowFullText(!showFullText)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                        <span className="font-semibold text-gray-900 dark:text-white">
                            {showFullText ? 'Masquer' : 'Afficher'} le texte complet de la politique
                        </span>
                        {showFullText ? (
                            <ChevronUpIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        ) : (
                            <ChevronDownIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                    </button>
                </div>

                {/* Texte complet (affiché/masqué) */}
                {showFullText && (
                    <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
                        {/* 1. Responsable du traitement */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                1. Responsable du traitement
                            </h3>
                            <p>
                                Le responsable du traitement des données personnelles est <strong>CMFIReplay</strong>, 
                                une plateforme de streaming vidéo proposant du contenu éducatif et religieux.
                            </p>
                        </section>

                        {/* 2. Données collectées */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                2. Données personnelles collectées
                            </h3>
                            <p className="mb-2">Nous collectons les données suivantes :</p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li><strong>Données d'identification :</strong> nom, adresse email, photo de profil (optionnelle)</li>
                                <li><strong>Données de connexion :</strong> adresse IP, horaires de connexion, durée de session</li>
                                <li><strong>Données de navigation :</strong> pages visitées, vidéos visionnées, historique de visionnage</li>
                                <li><strong>Données de préférences :</strong> thème (clair/sombre), langue, favoris, listes de lecture</li>
                                <li><strong>Données de profil (optionnelles) :</strong> pays actuel, numéro de téléphone</li>
                                <li><strong>Données d'utilisation :</strong> temps de visionnage, progression dans les vidéos, interactions (likes, commentaires)</li>
                            </ul>
                        </section>

                        {/* 3. Finalités du traitement */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                3. Finalités du traitement
                            </h3>
                            <p className="mb-2">Vos données sont utilisées pour :</p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Fournir et améliorer le service de streaming vidéo</li>
                                <li>Personnaliser votre expérience (recommandations, contenu adapté à votre région)</li>
                                <li>Gérer votre compte et vos préférences</li>
                                <li>Vous envoyer des notifications pertinentes (nouvelles vidéos, rappels)</li>
                                <li>Analyser l'utilisation de la plateforme pour améliorer nos services</li>
                                <li>Assurer la sécurité et prévenir les fraudes</li>
                                <li>Respecter nos obligations légales</li>
                            </ul>
                        </section>

                        {/* 4. Base légale */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                4. Base légale du traitement
                            </h3>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li><strong>Consentement :</strong> pour les données optionnelles (pays, téléphone, notifications marketing)</li>
                                <li><strong>Exécution d'un contrat :</strong> pour la fourniture du service de streaming</li>
                                <li><strong>Intérêt légitime :</strong> pour l'amélioration du service et la sécurité</li>
                                <li><strong>Obligation légale :</strong> pour la conservation de certaines données (facturation, etc.)</li>
                            </ul>
                        </section>

                        {/* 5. Conservation des données */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                5. Durée de conservation
                            </h3>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Données de compte : conservées tant que votre compte est actif</li>
                                <li>Historique de visionnage : conservé pour améliorer les recommandations</li>
                                <li>Données de connexion : conservées 12 mois maximum</li>
                                <li>Après suppression du compte : données supprimées sous 30 jours (sauf obligations légales)</li>
                            </ul>
                        </section>

                        {/* 6. Partage des données */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                6. Partage et transfert des données
                            </h3>
                            <p className="mb-2">Vos données ne sont jamais vendues à des tiers. Nous pouvons partager vos données avec :</p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li><strong>Prestataires techniques :</strong> Firebase (Google) pour l'hébergement et l'authentification, Vimeo pour le streaming vidéo</li>
                                <li><strong>Obligations légales :</strong> si requis par la loi ou une autorité judiciaire</li>
                            </ul>
                            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                Les données peuvent être transférées hors de l'UE vers les États-Unis (Firebase, Vimeo) 
                                dans le cadre du Privacy Shield et avec garanties appropriées.
                            </p>
                        </section>

                        {/* 7. Vos droits */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                7. Vos droits RGPD
                            </h3>
                            <p className="mb-2">Conformément au RGPD, vous disposez des droits suivants :</p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
                                <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
                                <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
                                <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format structuré</li>
                                <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
                                <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
                                <li><strong>Droit de retirer votre consentement :</strong> à tout moment</li>
                            </ul>
                            <p className="mt-2">
                                Pour exercer ces droits, contactez-nous via votre profil ou par email à l'adresse indiquée dans les paramètres de l'application.
                            </p>
                        </section>

                        {/* 8. Sécurité */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                8. Sécurité des données
                            </h3>
                            <p>
                                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données 
                                contre tout accès non autorisé, perte, destruction ou altération. Cela inclut le chiffrement, 
                                l'authentification sécurisée, et des contrôles d'accès stricts.
                            </p>
                        </section>

                        {/* 9. Cookies et technologies similaires */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                9. Cookies et technologies similaires
                            </h3>
                            <p>
                                Nous utilisons des cookies et technologies similaires pour le fonctionnement de la plateforme, 
                                l'authentification, et l'amélioration de l'expérience utilisateur. Vous pouvez gérer vos préférences 
                                de cookies dans les paramètres de votre navigateur.
                            </p>
                        </section>

                        {/* 10. Modifications */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                10. Modifications de la politique
                            </h3>
                            <p>
                                Cette politique peut être modifiée. Nous vous informerons de tout changement significatif. 
                                La date de dernière mise à jour est indiquée en bas de cette politique.
                            </p>
                        </section>

                        {/* 11. Contact */}
                        <section>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                11. Contact et réclamations
                            </h3>
                            <p className="mb-2">
                                Pour toute question concernant cette politique ou pour exercer vos droits, contactez-nous via :
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Les paramètres de votre profil dans l'application</li>
                                <li>Votre autorité de protection des données locale si vous estimez que vos droits ne sont pas respectés</li>
                            </ul>
                        </section>

                        {/* Date de mise à jour */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrivacyScreen;
