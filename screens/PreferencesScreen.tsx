import React, { useState } from 'react';
import Header from '../components/Header';
import { BellIcon, ForwardIcon, WifiIcon, GlobeIcon, SunIcon } from '../components/icons';
import { useAppContext } from '../context/AppContext';

interface PreferencesScreenProps {
    onBack: () => void;
}

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-amber-500 ${enabled ? 'bg-amber-500' : 'bg-gray-600'}`}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
};

const SegmentedControl: React.FC<{
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: any) => void;
}> = ({ options, value, onChange }) => {
    return (
        <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={`w-full py-1.5 text-sm font-semibold rounded-md transition-colors duration-300 ${value === option.value ? 'bg-amber-500 text-white shadow' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

const PreferenceRow: React.FC<{ 
    Icon: React.FC<{ className?: string }>; 
    label: string;
    description?: string;
    control?: React.ReactNode;
}> = ({ Icon, label, description, control }) => {
    return (
        <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
                <Icon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                <div className="flex-1">
                    <p className="text-gray-900 dark:text-white">{label}</p>
                    {description && <p className="text-xs text-gray-500 dark:text-gray-500">{description}</p>}
                </div>
            </div>
            {control && <div className="flex-shrink-0">{control}</div>}
        </div>
    );
};

const PreferenceSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-300 mb-2 mt-4">{title}</h3>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 divide-y divide-gray-200 dark:divide-gray-700/50">
            {children}
        </div>
    </section>
);


const PreferencesScreen: React.FC<PreferencesScreenProps> = ({ onBack }) => {
    const { theme, setTheme, language, setLanguage, t } = useAppContext();
    const [autoplay, setAutoplay] = useState(false);
    const [wifiOnly, setWifiOnly] = useState(true);
    const [alerts, setAlerts] = useState(true);

    return (
        <div>
            <Header title={t('preferencesScreenTitle')} onBack={onBack} />
            <div className="px-4 py-2">

                <PreferenceSection title={t('appearance')}>
                    <PreferenceRow 
                        Icon={SunIcon} 
                        label={t('theme')}
                        control={<SegmentedControl options={[{label: t('light'), value: 'light'}, {label: t('dark'), value: 'dark'}]} value={theme} onChange={setTheme} />}
                    />
                     <PreferenceRow 
                        Icon={GlobeIcon} 
                        label={t('language')}
                        control={<SegmentedControl options={[{label: t('english'), value: 'en'}, {label: t('french'), value: 'fr'}]} value={language} onChange={setLanguage} />}
                    />
                </PreferenceSection>
                
                <PreferenceSection title={t('notifications')}>
                    <PreferenceRow 
                        Icon={BellIcon} 
                        label={t('newContentAlerts')}
                        description={t('newContentDescription')}
                        control={<ToggleSwitch enabled={alerts} onChange={setAlerts} />}
                    />
                </PreferenceSection>
                
                <PreferenceSection title={t('playback')}>
                    <PreferenceRow 
                        Icon={ForwardIcon} 
                        label={t('autoplayNext')}
                        description={t('autoplayNextDescription')}
                        control={<ToggleSwitch enabled={autoplay} onChange={setAutoplay} />}
                    />
                </PreferenceSection>

                <PreferenceSection title={t('dataUsage')}>
                     <PreferenceRow 
                        Icon={WifiIcon} 
                        label={t('downloadWifiOnly')}
                        description={t('downloadWifiOnlyDescription')}
                        control={<ToggleSwitch enabled={wifiOnly} onChange={setWifiOnly} />}
                    />
                </PreferenceSection>
            </div>
        </div>
    );
};

export default PreferencesScreen;