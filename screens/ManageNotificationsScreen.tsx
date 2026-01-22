import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../lib/firestore';
import { useAppContext } from '../context/AppContext';
import { ArrowLeftIcon } from '../components/icons';
import { toast } from 'react-toastify';

const ManageNotificationsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { userProfile } = useAppContext();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
    const [link, setLink] = useState('');
    const [sending, setSending] = useState(false);

    // Vérifier si l'utilisateur est admin
    const isAdmin = userProfile?.isAdmin ?? (userProfile as any)?.['isAdmin '];

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#FBF9F3] dark:bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400">Accès refusé. Administrateur requis.</p>
                    <button
                        onClick={() => navigate('/home')}
                        className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg"
                    >
                        Retour
                    </button>
                </div>
            </div>
        );
    }

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            toast.error('Veuillez remplir le titre et le message');
            return;
        }

        setSending(true);
        try {
            const result = await notificationService.createNotificationForAllUsers(
                title.trim(),
                message.trim(),
                type,
                link.trim() || undefined
            );
            
            toast.success(
                `Notification envoyée à ${result.success} utilisateur${result.success > 1 ? 's' : ''}${result.errors > 0 ? ` (${result.errors} erreurs)` : ''}`,
                { autoClose: 5000 }
            );
            
            // Réinitialiser le formulaire
            setTitle('');
            setMessage('');
            setLink('');
            setType('info');
        } catch (error) {
            console.error('Error sending notification:', error);
            toast.error('Erreur lors de l\'envoi de la notification');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FBF9F3] dark:bg-black">
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-4 px-4 py-4">
                    <button
                        onClick={() => navigate('/profile')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeftIcon className="w-6 h-6 text-gray-900 dark:text-white" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Envoyer une notification à tous
                    </h1>
                </div>
            </div>

            <div className="px-4 md:px-6 lg:px-8 py-6 max-w-3xl mx-auto">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Titre *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Nouvelle vidéo disponible"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Message *
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ex: Un nouvel épisode de votre série préférée est disponible !"
                            rows={5}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Type
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as 'info' | 'success' | 'warning' | 'error')}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="info">Information (Bleu)</option>
                            <option value="success">Succès (Vert)</option>
                            <option value="warning">Avertissement (Jaune)</option>
                            <option value="error">Erreur (Rouge)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Lien (optionnel)
                        </label>
                        <input
                            type="text"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="Ex: /serie/abc123 ou /movie/xyz789"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Lien vers une page de l'application (ex: /serie/abc123)
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSend}
                            disabled={sending || !title.trim() || !message.trim()}
                            className="flex-1 px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? 'Envoi en cours...' : 'Envoyer à tous les utilisateurs'}
                        </button>
                        <button
                            onClick={() => navigate('/profile')}
                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Annuler
                        </button>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>💡 Astuce :</strong> Cette notification sera envoyée à <strong>tous les utilisateurs</strong> de l'application. 
                            Ils la verront dans leur page de notifications et recevront un badge sur l'icône cloche.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageNotificationsScreen;

