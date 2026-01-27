import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { userService, UserProfile } from '../lib/firestore';

interface ProfileCompletionModalProps {
    userProfile: UserProfile;
    onComplete: (updatedProfile: UserProfile) => void;
}

// Liste des pays avec leurs codes et indicateurs téléphoniques
const COUNTRIES = [
    { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
    { code: 'BE', name: 'Belgique', flag: '🇧🇪', dialCode: '+32' },
    { code: 'CH', name: 'Suisse', flag: '🇨🇭', dialCode: '+41' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
    { code: 'US', name: 'États-Unis', flag: '🇺🇸', dialCode: '+1' },
    { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧', dialCode: '+44' },
    { code: 'DE', name: 'Allemagne', flag: '🇩🇪', dialCode: '+49' },
    { code: 'ES', name: 'Espagne', flag: '🇪🇸', dialCode: '+34' },
    { code: 'IT', name: 'Italie', flag: '🇮🇹', dialCode: '+39' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351' },
    { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱', dialCode: '+31' },
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳', dialCode: '+221' },
    { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', dialCode: '+225' },
    { code: 'CM', name: 'Cameroun', flag: '🇨🇲', dialCode: '+237' },
    { code: 'CD', name: 'RD Congo', flag: '🇨🇩', dialCode: '+243' },
    { code: 'MG', name: 'Madagascar', flag: '🇲🇬', dialCode: '+261' },
    { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', dialCode: '+226' },
    { code: 'ML', name: 'Mali', flag: '🇲🇱', dialCode: '+223' },
    { code: 'NE', name: 'Niger', flag: '🇳🇪', dialCode: '+227' },
    { code: 'TD', name: 'Tchad', flag: '🇹🇩', dialCode: '+235' },
    { code: 'BJ', name: 'Bénin', flag: '🇧🇯', dialCode: '+229' },
    { code: 'TG', name: 'Togo', flag: '🇹🇬', dialCode: '+228' },
    { code: 'GN', name: 'Guinée', flag: '🇬🇳', dialCode: '+224' },
    { code: 'GA', name: 'Gabon', flag: '🇬🇦', dialCode: '+241' },
    { code: 'CG', name: 'Congo', flag: '🇨🇬', dialCode: '+242' },
    { code: 'CF', name: 'RCA', flag: '🇨🇫', dialCode: '+236' },
    { code: 'DZ', name: 'Algérie', flag: '🇩🇿', dialCode: '+213' },
    { code: 'MA', name: 'Maroc', flag: '🇲🇦', dialCode: '+212' },
    { code: 'TN', name: 'Tunisie', flag: '🇹🇳', dialCode: '+216' },
    { code: 'EG', name: 'Égypte', flag: '🇪🇬', dialCode: '+20' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
    { code: 'ZA', name: 'Afrique du Sud', flag: '🇿🇦', dialCode: '+27' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233' },
    { code: 'ET', name: 'Éthiopie', flag: '🇪🇹', dialCode: '+251' },
    { code: 'AO', name: 'Angola', flag: '🇦🇴', dialCode: '+244' },
    { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', dialCode: '+258' },
    { code: 'UG', name: 'Ouganda', flag: '🇺🇬', dialCode: '+256' },
    { code: 'TZ', name: 'Tanzanie', flag: '🇹🇿', dialCode: '+255' },
    { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', dialCode: '+263' },
    { code: 'ZM', name: 'Zambie', flag: '🇿🇲', dialCode: '+260' },
    { code: 'MW', name: 'Malawi', flag: '🇲🇼', dialCode: '+265' },
    { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dialCode: '+250' },
    { code: 'BI', name: 'Burundi', flag: '🇧🇮', dialCode: '+257' },
    { code: 'SO', name: 'Somalie', flag: '🇸🇴', dialCode: '+252' },
    { code: 'ER', name: 'Érythrée', flag: '🇪🇷', dialCode: '+291' },
    { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', dialCode: '+253' },
    { code: 'SD', name: 'Soudan', flag: '🇸🇩', dialCode: '+249' },
    { code: 'SS', name: 'Soudan du Sud', flag: '🇸🇸', dialCode: '+211' },
    { code: 'LY', name: 'Libye', flag: '🇱🇾', dialCode: '+218' },
    { code: 'MR', name: 'Mauritanie', flag: '🇲🇷', dialCode: '+222' },
    { code: 'GM', name: 'Gambie', flag: '🇬🇲', dialCode: '+220' },
    { code: 'GW', name: 'Guinée-Bissau', flag: '🇬🇼', dialCode: '+245' },
    { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', dialCode: '+232' },
    { code: 'LR', name: 'Liberia', flag: '🇱🇷', dialCode: '+231' },
    { code: 'CV', name: 'Cap-Vert', flag: '🇨🇻', dialCode: '+238' },
    { code: 'ST', name: 'São Tomé-et-Príncipe', flag: '🇸🇹', dialCode: '+239' },
    { code: 'GQ', name: 'Guinée équatoriale', flag: '🇬🇶', dialCode: '+240' },
    { code: 'KM', name: 'Comores', flag: '🇰🇲', dialCode: '+269' },
    { code: 'MU', name: 'Maurice', flag: '🇲🇺', dialCode: '+230' },
    { code: 'SC', name: 'Seychelles', flag: '🇸🇨', dialCode: '+248' },
    { code: 'RE', name: 'La Réunion', flag: '🇷🇪', dialCode: '+262' },
    { code: 'YT', name: 'Mayotte', flag: '🇾🇹', dialCode: '+262' },
    { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵', dialCode: '+590' },
    { code: 'MQ', name: 'Martinique', flag: '🇲🇶', dialCode: '+596' },
    { code: 'GF', name: 'Guyane française', flag: '🇬🇫', dialCode: '+594' },
    { code: 'PF', name: 'Polynésie française', flag: '🇵🇫', dialCode: '+689' },
    { code: 'NC', name: 'Nouvelle-Calédonie', flag: '🇳🇨', dialCode: '+687' },
    { code: 'PM', name: 'Saint-Pierre-et-Miquelon', flag: '🇵🇲', dialCode: '+508' },
    { code: 'BL', name: 'Saint-Barthélemy', flag: '🇧🇱', dialCode: '+590' },
    { code: 'MF', name: 'Saint-Martin', flag: '🇲🇫', dialCode: '+590' },
    { code: 'WF', name: 'Wallis-et-Futuna', flag: '🇼🇫', dialCode: '+681' },
].sort((a, b) => a.name.localeCompare(b.name));

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({ userProfile, onComplete }) => {
    console.log('🎯 ProfileCompletionModal rendu avec:', { userProfile });
    
    const [selectedCountry, setSelectedCountry] = useState<string>(userProfile.country || '');
    const [phoneNumber, setPhoneNumber] = useState<string>(userProfile.phoneNumber || '');
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const selectedCountryData = COUNTRIES.find(c => c.code === selectedCountry);

    const handleSave = async () => {
        if (!selectedCountry) {
            setError('Veuillez sélectionner votre pays');
            return;
        }

        if (!phoneNumber.trim()) {
            setError('Veuillez entrer votre numéro de téléphone');
            return;
        }

        // Validation basique du numéro de téléphone
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(phoneNumber)) {
            setError('Format de numéro de téléphone invalide');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const countryData = COUNTRIES.find(c => c.code === selectedCountry);
            const fullPhoneNumber = countryData 
                ? `${countryData.dialCode} ${phoneNumber.replace(/^\+?\d+/, '').trim() || phoneNumber.trim()}`
                : phoneNumber;

            const updatedProfile = await userService.updateUserProfile(userProfile.uid, {
                country: selectedCountry,
                phoneNumber: fullPhoneNumber
            });

            onComplete(updatedProfile);
        } catch (error) {
            console.error('Error updating profile:', error);
            setError('Erreur lors de la mise à jour du profil');
        } finally {
            setLoading(false);
        }
    };

    console.log('🎨 ProfileCompletionModal render - selectedCountry:', selectedCountry, 'phoneNumber:', phoneNumber);
    
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Compléter votre profil
                    </h2>
                    <button
                        onClick={() => {/* Ne pas permettre de fermer sans remplir */}}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        disabled
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Veuillez compléter votre profil en renseignant votre pays actuel et votre numéro de téléphone.
                    </p>

                    {/* Pays */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Pays actuel <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            >
                                {selectedCountryData ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{selectedCountryData.flag}</span>
                                        <span className="text-gray-900 dark:text-white">{selectedCountryData.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-500 dark:text-gray-400">Sélectionner un pays</span>
                                )}
                            </button>

                            {isCountryDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsCountryDropdownOpen(false)}
                                    />
                                    <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {COUNTRIES.map((country) => (
                                            <button
                                                key={country.code}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCountry(country.code);
                                                    setIsCountryDropdownOpen(false);
                                                }}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                            >
                                                <span className="text-xl">{country.flag}</span>
                                                <span className="text-gray-900 dark:text-white">{country.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Numéro de téléphone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Numéro de téléphone <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            {selectedCountryData && (
                                <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center">
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                                        {selectedCountryData.dialCode}
                                    </span>
                                </div>
                            )}
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder={selectedCountryData ? "6 12 34 56 78" : "Numéro de téléphone"}
                                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                        </div>
                        {selectedCountryData && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Format: {selectedCountryData.dialCode} X XX XX XX XX
                            </p>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading || !selectedCountry || !phoneNumber.trim()}
                        className="px-6 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileCompletionModal;

