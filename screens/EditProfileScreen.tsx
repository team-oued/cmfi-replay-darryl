import React, { useState } from 'react';
import Header from '../components/Header';
import InputField from '../components/InputField';
import { useAppContext } from '../context/AppContext';

interface EditProfileScreenProps {
    onBack: () => void;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onBack }) => {
    const { t } = useAppContext();
    const [fullName, setFullName] = useState('Christian User');
    const [email, setEmail] = useState('user@cmfireplay.com');
    const [bio, setBio] = useState('Lover of Christ, dedicated to spreading the gospel through media.');

    const handleSave = () => {
        // In a real app, you would save the data here.
        console.log({ fullName, email, bio });
        onBack(); // Go back after saving
    };

    return (
        <div>
            <Header title={t('editProfileScreenTitle')} onBack={onBack} />
            <div className="p-4 space-y-8 animate-fadeIn">
                <div className="flex flex-col items-center space-y-4">
                    <img 
                        src="https://picsum.photos/seed/mainuser/200/200" 
                        alt="Your avatar" 
                        className="w-32 h-32 rounded-full border-4 border-amber-500" 
                    />
                    <button className="text-amber-500 font-semibold hover:text-amber-400">
                        {t('changePhoto')}
                    </button>
                </div>

                <div className="space-y-6">
                    <InputField 
                        label={t('fullName')} 
                        id="fullName" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                    />
                     <InputField 
                        label={t('email')} 
                        id="email" 
                        type="email"
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="relative">
                        <label 
                            htmlFor="bio" 
                            className="absolute -top-2.5 left-3 px-1 bg-[#FBF9F3] dark:bg-black text-sm font-bold text-gray-800 dark:text-gray-200"
                        >
                            {t('bio')}
                        </label>
                        <textarea
                            id="bio"
                            rows={4}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full bg-transparent px-4 py-3.5 border border-gray-400/50 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-gray-700 dark:text-gray-300 placeholder-gray-500/80"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        onClick={handleSave}
                        className="w-full bg-amber-500 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-amber-400 transition-colors duration-200 shadow-lg"
                    >
                        {t('saveChanges')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProfileScreen;
