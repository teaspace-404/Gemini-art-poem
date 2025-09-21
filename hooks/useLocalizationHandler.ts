import { useState, useCallback } from 'react';
import { trackEvent } from '../components/analytics';
import { translations } from '../translations';

export const useLocalizationHandler = () => {
    const [language, setLanguage] = useState<'en' | 'cn'>('en');

    const supportedLanguages = [
        { code: 'en' as const, name: 'EN' },
        { code: 'cn' as const, name: '中文' },
    ];

    const t = useCallback((key: keyof typeof translations.en, replacements?: Record<string, string | number>) => {
        let text = translations[language]?.[key] || translations.en[key];
        if (replacements) {
            Object.entries(replacements).forEach(([placeholder, value]) => {
                text = text.replace(`{${placeholder}}`, String(value));
            });
        }
        return text;
    }, [language]);

    const handleSetLanguage = useCallback((lang: 'en' | 'cn') => {
        if (lang !== language) {
            setLanguage(lang);
            trackEvent('language_changed', { newLang: lang });
        }
    }, [language]);

    return {
        language,
        supportedLanguages,
        t,
        handleSetLanguage,
    };
};
