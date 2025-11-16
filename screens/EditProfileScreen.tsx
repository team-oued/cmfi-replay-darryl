import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import InputField from '../components/InputField';
import { useAppContext } from '../context/AppContext';
import { userService, UserProfile } from '../lib/firestore';

interface EditProfileScreenProps {
    onBack: () => void;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onBack }) => {
    const { t, user, userProfile, setUserProfile } = useAppContext();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Initialiser les champs avec les données de l'utilisateur
    useEffect(() => {
        if (userProfile) {
            setFullName(userProfile.display_name || '');
            setEmail(userProfile.email || '');
            setPhotoUrl(userProfile.photo_url || '');
        }
    }, [userProfile]);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Valider le type de fichier
        if (!file.type.startsWith('image/')) {
            setError(t('invalidFileType') || 'Veuillez sélectionner une image');
            return;
        }

        // Valider la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError(t('fileTooLarge') || 'L\'image ne doit pas dépasser 5MB');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Pour l'instant, on utilise une URL de placeholder
            // Dans une vraie app, vous uploaderiez le fichier vers Firebase Storage
            const randomSeed = Math.random().toString(36).substring(7);
            const newPhotoUrl = `https://picsum.photos/seed/${randomSeed}/200/200`;
            setPhotoUrl(newPhotoUrl);
        } catch (error) {
            console.error('Error uploading photo:', error);
            setError(t('errorUploadingPhoto') || 'Erreur lors du téléchargement de la photo');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user || !fullName || !email) {
            setError(t('fillAllFields') || 'Veuillez remplir tous les champs');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const updatedProfile = await userService.updateUserProfile(user.uid, {
                display_name: fullName,
                email: email,
                photo_url: photoUrl || null
            });
            
            // Mettre à jour le profil dans le contexte
            setUserProfile(updatedProfile);
            
            onBack(); // Retourner après la sauvegarde
        } catch (error) {
            console.error('Error updating profile:', error);
            setError(t('errorUpdatingProfile') || 'Erreur lors de la mise à jour du profil');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Header title={t('editProfileScreenTitle')} onBack={onBack} />
            <div className="p-4 space-y-8 animate-fadeIn">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <img 
                            src={photoUrl || 'https://picsum.photos/seed/defaultuser/200/200'} 
                            alt="Your avatar" 
                            className="w-32 h-32 rounded-full border-4 border-amber-500 object-cover"
                        />
                        {loading && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                <div className="text-white text-sm">{t('loading') || 'Chargement...'}</div>
                            </div>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="text-amber-500 font-semibold hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('changePhoto')}
                    </button>
                </div>

                <div className="space-y-6">
                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}
                    
                    <InputField 
                        label={t('fullName')} 
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={loading}
                    />
                    
                    <InputField 
                        label={t('email')} 
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className="pt-4">
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-amber-500 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-amber-400 transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (t('saving') || 'Sauvegarde...') : (t('saveChanges') || 'Sauvegarder les modifications')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProfileScreen;
