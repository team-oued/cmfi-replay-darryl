import React, { useState } from 'react';
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { userService, UserProfile } from '../lib/firestore';

interface RGPDConsentModalProps {
    userProfile: UserProfile;
    onAccept: (updatedProfile: UserProfile) => void;
}

const RGPDConsentModal: React.FC<RGPDConsentModalProps> = ({ userProfile, onAccept }) => {
    const [hasRead, setHasRead] = useState(false);
    const [showFullText, setShowFullText] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAccept = async () => {
        if (!hasRead) {
            setError('Veuillez lire et accepter la politique de confidentialité pour continuer');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const updatedProfile = await userService.updateUserProfile(userProfile.uid, {
                hasAcceptedPrivacyPolicy: true,
                rgpdAcceptedAt: new Date()
            });
            onAccept(updatedProfile);
        } catch (error) {
            console.error('Error updating RGPD consent:', error);
            setError('Erreur lors de l\'enregistrement de votre consentement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-80 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-2 border-blue-500/20 flex flex-col">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 rounded-t-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white mb-1">
                                Politique de Confidentialité et Protection des Données
                            </h2>
                            <p className="text-blue-100 text-sm">
                                Conformité RGPD - Votre consentement est requis
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content avec scroll */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Message d'introduction */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-900 dark:text-blue-300">
                            <strong>CMFIReplay</strong> s'engage à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD). 
                            Veuillez lire attentivement cette politique avant d'accepter.
                        </p>
                    </div>

                    {/* Résumé */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            📋 Résumé
                        </h3>
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
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                    1. Responsable du traitement
                                </h4>
                                <p>
                                    Le responsable du traitement des données personnelles est <strong>CMFIReplay</strong>, 
                                    une plateforme de streaming vidéo proposant du contenu éducatif et religieux.
                                </p>
                            </section>

                            {/* 2. Données collectées */}
                            <section>
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                    2. Données personnelles collectées
                                </h4>
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
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                    3. Finalités du traitement
                                </h4>
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
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                    4. Base légale du traitement
                                </h4>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    <li><strong>Consentement :</strong> pour les données optionnelles (pays, téléphone, notifications marketing)</li>
                                    <li><strong>Exécution d'un contrat :</strong> pour la fourniture du service de streaming</li>
                                    <li><strong>Intérêt légitime :</strong> pour l'amélioration du service et la sécurité</li>
                                    <li><strong>Obligation légale :</strong> pour la conservation de certaines données (facturation, etc.)</li>
                                </ul>
                            </section>

                            {/* 5. Conservation des données */}
                            <section>
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                    5. Durée de conservation
                                </h4>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    <li>Données de compte : conservées tant que votre compte est actif</li>
                                    <li>Historique de visionnage : conservé pour améliorer les recommandations</li>
                                    <li>Données de connexion : conservées 12 mois maximum</li>
                                    <li>Après suppression du compte : données supprimées sous 30 jours (sauf obligations légales)</li>
                                </ul>
                            </section>

                            {/* 6. Partage des données */}
                            <section>
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                    6. Partage et transfert des données
                                </h4>
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
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                    7. Vos droits RGPD
                                </h4>
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
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                    8. Sécurité des données
                                </h4>
                                <p>
                                    Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données 
                                    contre tout accès non autorisé, perte, destruction ou altération. Cela inclut le chiffrement, 
                                    l'authentification sécurisée, et des contrôles d'accès stricts.
                                </p>
                            </section>

                            {/* 9. Cookies et technologies similaires */}
                            <section>
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                    9. Cookies et technologies similaires
                                </h4>
                                <p>
                                    Nous utilisons des cookies et technologies similaires pour le fonctionnement de la plateforme, 
                                    l'authentification, et l'amélioration de l'expérience utilisateur. Vous pouvez gérer vos préférences 
                                    de cookies dans les paramètres de votre navigateur.
                                </p>
                            </section>

                            {/* 10. Modifications */}
                            <section>
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                    10. Modifications de la politique
                                </h4>
                                <p>
                                    Cette politique peut être modifiée. Nous vous informerons de tout changement significatif. 
                                    La date de dernière mise à jour est indiquée en bas de cette politique.
                                </p>
                            </section>

                            {/* 11. Contact */}
                            <section>
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                    11. Contact et réclamations
                                </h4>
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

                    {/* Checkbox de consentement */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={hasRead}
                                onChange={(e) => setHasRead(e.target.checked)}
                                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                                <strong>J'ai lu et j'accepte</strong> la politique de confidentialité et de protection des données personnelles. 
                                Je comprends que mes données seront traitées conformément à cette politique et que je peux retirer mon consentement à tout moment.
                            </span>
                        </label>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Votre consentement est requis pour utiliser l'application
                        </div>
                        <button
                            onClick={handleAccept}
                            disabled={loading || !hasRead}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    J'accepte et continue
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RGPDConsentModal;

