import { useState, useEffect } from 'react';

export const useUIHandler = (t: (key: any, replacements?: any) => string, userWantsToGenerate: boolean, isKeywordsReady: boolean, isArtlessMode: boolean) => {
    const [showArtworkInfo, setShowArtworkInfo] = useState<boolean>(false);
    const [isArtworkZoomed, setIsArtworkZoomed] = useState<boolean>(false);
    const [showLogs, setShowLogs] = useState<boolean>(false);
    const [isChangeArtworkDisabled, setIsChangeArtworkDisabled] = useState<boolean>(false);
    const [showLikedFeedback, setShowLikedFeedback] = useState<boolean>(false);
    const [isLikeBouncing, setIsLikeBouncing] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [showSupportModal, setShowSupportModal] = useState<boolean>(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
    const [isFlipping, setIsFlipping] = useState<boolean>(false);
    
    // Effect to cycle through loading messages while waiting for keywords.
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        const isLoadingKeywords = userWantsToGenerate && !isKeywordsReady && !isArtlessMode;

        if (isLoadingKeywords) {
            const messages = t('loadingMessages').split('|');
            setLoadingMessage(messages[0]);
            let messageIndex = 0;
            interval = setInterval(() => {
                messageIndex = (messageIndex + 1) % messages.length;
                setLoadingMessage(messages[messageIndex]);
            }, 1500);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [userWantsToGenerate, isKeywordsReady, isArtlessMode, t]);

    return {
        showArtworkInfo,
        isArtworkZoomed,
        showLogs,
        isChangeArtworkDisabled,
        showLikedFeedback,
        isLikeBouncing,
        loadingMessage,
        showSupportModal,
        showFeedbackModal,
        isFlipping,
        setShowArtworkInfo,
        setIsArtworkZoomed,
        setShowLogs,
        setIsChangeArtworkDisabled,
        setShowLikedFeedback,
        setIsLikeBouncing,
        setShowSupportModal,
        setShowFeedbackModal,
        setIsFlipping,
    };
};