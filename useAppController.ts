import { useState, useCallback, useEffect } from 'react';
import { trackEvent } from './components/analytics';
import { useLocalizationHandler } from './hooks/useLocalizationHandler';
import { useArtHandler } from './hooks/useArtHandler';
import { usePoemHandler } from './hooks/usePoemHandler';
import { usePersistenceHandler } from './hooks/usePersistenceHandler';
import { useUIHandler } from './hooks/useUIHandler';
import type { LikedPoem, Artwork } from './types';

declare const html2canvas: any;

const getShareablePoemText = (
    artworkInfo: Artwork | null,
    isArtlessMode: boolean,
    editablePoem: string,
    t: (key: any, replacements?: any) => string
): string => {
    if (isArtlessMode || !artworkInfo) {
        return t('artlessShareIntro', { poemText: editablePoem });
    }

    const { title, artist, medium, source } = artworkInfo;

    let creditHashtag = '';
    if (source === t('sourceAIC')) {
        creditHashtag = '#AIC';
    } else if (source === t('sourceVA')) {
        creditHashtag = '#VA';
    }

    const isTitleValid = title && title.toLowerCase() !== 'untitled' && title.toLowerCase() !== 'none';
    if (isTitleValid) {
        return t('shareIntroTitle', { title, poemText: editablePoem, creditHashtag });
    }

    const isArtistValid = artist && artist.toLowerCase() !== 'unknown artist' && artist.toLowerCase() !== 'none';
    if (isArtistValid) {
        return t('shareIntroArtist', { artist, poemText: editablePoem, creditHashtag });
    }

    return t('shareIntroMedium', { medium, poemText: editablePoem, creditHashtag });
};


export const useAppController = () => {
    // === HOOKS INITIALIZATION ===
    const { language, supportedLanguages, t, handleSetLanguage } = useLocalizationHandler();
    
    const {
        artworkInfo, artworkImageUrl, capturedImage, isFetchingArt, error: artError, artSources,
        selectedArtSource, requestRef, setError: setArtError, fetchArt, fetchArtById, handleSetArtSource, resetArtState
    } = useArtHandler(t);
    
    // Core UI flow state managed here as it connects multiple domains
    const [userWantsToGenerate, setUserWantsToGenerate] = useState<boolean>(false);
    const [isKeywordsReady, setIsKeywordsReady] = useState<boolean>(false);
    const [isArtlessMode, setIsArtlessMode] = useState<boolean>(false);
    const [isShareApiAvailable, setIsShareApiAvailable] = useState<boolean>(false);
    
    const {
        poem, editablePoem, keywords, poemLines, isGeneratingPoem, isGeneratingKeywords, isPoemGenerationCoolingDown,
        requestCount, MAX_REQUESTS, keywordGenerationLog, poemGenerationLog, generationError, setPoem, setEditablePoem,
        setKeywords, setPoemLines, setKeywordGenerationLog, setPoemGenerationLog, setGenerationError,
        generateKeywords, generatePoem, finalizePoemManually, resetPoemState, resetInspirationState
    } = usePoemHandler(t);
    
    const {
        bookmarks, likedPoems, isCurrentArtworkBookmarked, isPoemLiked,
        handleToggleBookmark, handleToggleLike
    } = usePersistenceHandler(artworkInfo, editablePoem, isArtlessMode, poemLines);
    
    const {
        showArtworkInfo, isArtworkZoomed, showLogs, isChangeArtworkDisabled, showLikedFeedback,
        isLikeBouncing, loadingMessage, showSupportModal, showFeedbackModal, isFlipping,
        setShowArtworkInfo, setIsArtworkZoomed, setShowLogs,
        setIsChangeArtworkDisabled, setShowLikedFeedback, setIsLikeBouncing, setShowSupportModal, setShowFeedbackModal, setIsFlipping,
    } = useUIHandler(t, userWantsToGenerate, isKeywordsReady, isArtlessMode);

    // Composite error state to combine errors from different hooks
    const error = artError || generationError;
    const setError = (message: string | null) => {
        setArtError(message);
        setGenerationError(message);
    };

    // State for managing the loading of a liked poem or bookmarked art
    const [likedPoemToLoad, setLikedPoemToLoad] = useState<LikedPoem | null>(null);
    const [loadedPoemDate, setLoadedPoemDate] = useState<string | null>(null);
    const [loadedPoemUserInputs, setLoadedPoemUserInputs] = useState<string[] | null>(null);
    const [loadedBookmarkDate, setLoadedBookmarkDate] = useState<string | null>(null);

    // State for the flip-to-view functionality
    const [lastFinalPoem, setLastFinalPoem] = useState<string | null>(null);

    // State for LikedPoemOptionsModal
    const [showLikedPoemOptionsModal, setShowLikedPoemOptionsModal] = useState(false);
    const [selectedLikedPoem, setSelectedLikedPoem] = useState<LikedPoem | null>(null);
    const [likedPoemToRecreate, setLikedPoemToRecreate] = useState<LikedPoem | null>(null);


    // === EFFECTS to wire hooks together ===
    
    useEffect(() => {
        if(poem) setEditablePoem(poem);
    }, [poem, setEditablePoem]);

    useEffect(() => {
        if (likedPoemToLoad && artworkInfo && !isFetchingArt) {
            setPoem(likedPoemToLoad.poem);
            setLoadedPoemDate(likedPoemToLoad.dateAdded);
            setLoadedPoemUserInputs(likedPoemToLoad.userInputs);
            setUserWantsToGenerate(true);
            setLikedPoemToLoad(null);
        }
    }, [artworkInfo, likedPoemToLoad, isFetchingArt, setPoem]);
    
    useEffect(() => {
        // This effect runs when art is loaded, to set up the editor for recreation
        if (likedPoemToRecreate && artworkInfo && !isFetchingArt) {
            resetPoemState();
            setLoadedPoemDate(null);
            setPoemLines(likedPoemToRecreate.userInputs);
            setUserWantsToGenerate(true);
            setIsKeywordsReady(true);
            setKeywords([]);
            trackEvent('poem_recreated_started_from_modal', { isArtlessMode: false, userInputs: likedPoemToRecreate.userInputs });
            setLikedPoemToRecreate(null); // Clear after use
        }
    }, [artworkInfo, isFetchingArt, likedPoemToRecreate, resetPoemState, setKeywords, setPoemLines]);

    useEffect(() => {
        if (navigator.share) {
            setIsShareApiAvailable(true);
        }
    }, []);

    // This effect runs when art is loaded, to automatically show the editor.
    useEffect(() => {
        if ((artworkInfo || isArtlessMode) && !isFetchingArt) {
            setUserWantsToGenerate(true);
            setIsKeywordsReady(true);
        }
    }, [artworkInfo, isArtlessMode, isFetchingArt]);


    // === ORCHESTRATION & PUBLIC HANDLERS ===
    
    const resetForNewArtwork = useCallback(() => {
        setError(null);
        resetArtState();
        resetPoemState();
        setIsKeywordsReady(false);
        setUserWantsToGenerate(false);
        setIsArtlessMode(false);
        setLoadedPoemDate(null);
        setLoadedPoemUserInputs(null);
        setLoadedBookmarkDate(null);
        setLastFinalPoem(null);
    }, [resetArtState, resetPoemState]);

    const handleFetchArt = async () => {
        resetForNewArtwork();
        await fetchArt();
    };
    
    const handleFetchArtById = async (id: string, sourceName: string, dateAdded?: string) => {
        resetForNewArtwork();

        if (dateAdded) {
            setLoadedBookmarkDate(dateAdded);
        }
        
        // Find the source object from the name and update the UI selection for consistency
        const artSource = artSources.find(s => s.name === sourceName);
        if (artSource && artSource.id !== selectedArtSource.id) {
            handleSetArtSource(artSource);
        }

        await fetchArtById(id, sourceName);
    };
    
    const handleLoadLikedPoem = (likedPoem: LikedPoem) => {
        if (likedPoem.source === 'artless') {
            resetForNewArtwork();
            setIsArtlessMode(true);
            setUserWantsToGenerate(true);
            setIsKeywordsReady(true);
            setKeywords([]);
            setPoem(likedPoem.poem);
            setLoadedPoemDate(likedPoem.dateAdded);
            setLoadedPoemUserInputs(likedPoem.userInputs);
        } else {
            setLikedPoemToLoad(likedPoem);
            handleFetchArtById(likedPoem.artworkId, likedPoem.source);
        }
    };

    const handleFlipBackToEditor = useCallback(() => {
        setIsFlipping(true);

        setLastFinalPoem(editablePoem);

        // If flipping from a loaded poem, restore its themes. Otherwise, the current themes in state are correct.
        if (loadedPoemUserInputs) {
            setPoemLines(loadedPoemUserInputs);
            trackEvent('poem_recreated_started_from_view', { isArtlessMode, userInputs: loadedPoemUserInputs });
        } else {
            trackEvent('poem_flipped_to_editor', { currentPoem: editablePoem, userPoemLines: poemLines });
        }

        // Reset state to show the editor view
        setPoem(null);
        setEditablePoem(null);
        setLoadedPoemDate(null);
        setLoadedPoemUserInputs(null);
        
        // Ensure the editor view logic is correctly primed
        setUserWantsToGenerate(true);
        setIsKeywordsReady(true);

        setTimeout(() => setIsFlipping(false), 600);
    }, [loadedPoemUserInputs, isArtlessMode, editablePoem, poemLines, setIsFlipping, setPoemLines, setPoem, setEditablePoem, setLastFinalPoem]);
    
    const handleFlipToViewLastPoem = useCallback(() => {
        if (!lastFinalPoem) return;
        setIsFlipping(true);
        
        setPoem(lastFinalPoem);
        
        trackEvent('poem_flipped_to_view', { lastPoem: lastFinalPoem });

        setTimeout(() => setIsFlipping(false), 600);
    }, [lastFinalPoem, setIsFlipping, setPoem]);

    const handleInspireMe = async () => {
        if (!capturedImage) return;
        setUserWantsToGenerate(true);
        const currentRequestId = requestRef.current; 
        const generated = await generateKeywords(capturedImage, currentRequestId, requestRef);
        if (generated !== null) { // Check if not cancelled or errored
            setIsKeywordsReady(true);
        }
    };

    const handleRequestInspirationFromEditor = async () => {
        if (!capturedImage) return;
        trackEvent('request_inspiration_from_editor', { artwork: artworkInfo });
        const currentRequestId = ++requestRef.current;
        await generateKeywords(capturedImage, currentRequestId, requestRef);
    };

    const handleChangeArtwork = () => {
        trackEvent('artwork_changed', { currentArtwork: artworkInfo });
        setIsChangeArtworkDisabled(true);
        
        // This custom flow preserves user themes by only resetting inspiration
        resetInspirationState();
        fetchArt();
        
        setTimeout(() => setIsChangeArtworkDisabled(false), 2000);
    };
    
    const handleLike = useCallback(() => {
        const wasNewlyLiked = handleToggleLike();
        if (wasNewlyLiked) {
            setShowLikedFeedback(true);
            setIsLikeBouncing(true);
            setTimeout(() => setShowLikedFeedback(false), 1000);
        }
    }, [handleToggleLike, setShowLikedFeedback, setIsLikeBouncing]);

    const handleFinalizePoemManually = useCallback(() => finalizePoemManually(artworkInfo, isArtlessMode), [finalizePoemManually, artworkInfo, isArtlessMode]);

    const handleGeneratePoem = useCallback((isRestricted: boolean) => generatePoem(isRestricted, capturedImage, isArtlessMode, artworkInfo), [generatePoem, capturedImage, isArtlessMode, artworkInfo]);
    
    const handleStartArtlessMode = () => {
        resetForNewArtwork();
        setIsArtlessMode(true);
        setUserWantsToGenerate(true);
        setIsKeywordsReady(true);
        setKeywords([]);
        trackEvent('start_artless_mode', {});
    };

    const handleRecreatePoem = (likedPoem: LikedPoem) => {
        if (likedPoem.source === 'artless') {
            resetForNewArtwork();
            setIsArtlessMode(true);
            setUserWantsToGenerate(true);
            setIsKeywordsReady(true);
            setKeywords([]);
            setPoemLines(likedPoem.userInputs);
            trackEvent('poem_recreated_started_from_modal', { isArtlessMode: true, userInputs: likedPoem.userInputs });
        } else {
            setLikedPoemToRecreate(likedPoem);
            handleFetchArtById(likedPoem.artworkId, likedPoem.source);
        }
    };

    const handleCopyLog = useCallback(async (): Promise<boolean> => {
        const logData = {
            generatedOn: new Date().toISOString(),
            artwork: artworkInfo,
            isArtlessMode: isArtlessMode,
            keywordGeneration: keywordGenerationLog,
            poemGeneration: poemGenerationLog,
            userPrompts: poemLines,
            finalPoem: editablePoem,
        };
        const logContent = JSON.stringify(logData, null, 2);
        try {
            await navigator.clipboard.writeText(logContent);
            trackEvent('logs_copied', { logLength: logContent.length });
            return true;
        } catch (err) {
            console.error('Failed to copy logs:', err);
            return false;
        }
    }, [artworkInfo, isArtlessMode, keywordGenerationLog, poemGenerationLog, poemLines, editablePoem]);

    const generatePoemgramCanvas = (): Promise<HTMLCanvasElement> => {
        return new Promise((resolve, reject) => {
            if (!editablePoem) {
                const msg = "Cannot export without a poem.";
                setError(msg);
                reject(new Error(msg));
                return;
            }
    
            const exportRoot = document.createElement('div');
            exportRoot.style.position = 'absolute';
            exportRoot.style.left = '-9999px';
            exportRoot.style.width = '843px';
            exportRoot.style.background = '#fcfcfc';
            exportRoot.style.padding = '40px';
            exportRoot.style.boxSizing = 'content-box';
            exportRoot.style.display = 'flex';
            exportRoot.style.flexDirection = 'column';
            exportRoot.style.alignItems = 'center';
    
            if (!isArtlessMode && artworkImageUrl) {
                const imgElement = document.createElement('img');
                imgElement.src = artworkImageUrl;
                imgElement.crossOrigin = 'anonymous';
                imgElement.width = 843;
                exportRoot.appendChild(imgElement);
            } else if (!isArtlessMode && !artworkImageUrl) {
                const msg = "Cannot export without an image.";
                setError(msg);
                reject(new Error(msg));
                return;
            }
    
            const poemElement = document.createElement('div');
            poemElement.innerText = editablePoem;
            poemElement.style.fontFamily = 'serif';
            poemElement.style.color = '#292524';
            poemElement.style.fontSize = '2rem';
            poemElement.style.textAlign = 'center';
            poemElement.style.marginTop = '40px';
            poemElement.style.whiteSpace = 'pre-wrap';
            poemElement.style.lineHeight = '1.5';
            exportRoot.appendChild(poemElement);
    
            document.body.appendChild(exportRoot);
    
            html2canvas(exportRoot, { useCORS: true, allowTaint: true, backgroundColor: '#fcfcfc', logging: true })
                .then((canvas: any) => {
                    document.body.removeChild(exportRoot);
                    resolve(canvas);
                })
                .catch((err: any) => {
                    console.error("html2canvas failed:", err);
                    const errorMessage = "Failed to export the image. There might be a network or browser issue.";
                    setError(errorMessage);
                    trackEvent('error', { context: 'generatePoemgramCanvas', message: errorMessage });
                    if (document.body.contains(exportRoot)) {
                        document.body.removeChild(exportRoot);
                    }
                    reject(err);
                });
        });
    };
    
    const handleExport = async () => {
        if (isArtlessMode) {
            trackEvent('poemgram_exported_artless', { finalPoem: editablePoem });
        } else if (artworkImageUrl) {
            trackEvent('poemgram_exported', { artwork: artworkInfo, finalPoem: editablePoem });
        }
    
        try {
            const canvas = await generatePoemgramCanvas();
            const link = document.createElement('a');
            link.download = `poem-for-art-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("Export process failed:", err);
            // Error is already set and tracked in the canvas generation helper.
        }
    };
    
    const handleShareWIPPoem = async () => {
        if (!isShareApiAvailable) return;
    
        const poemText = poemLines.filter(line => line.trim() !== '').join('\n');
        if (!poemText) return; 
    
        const shareData = {
            title: t('shareTitle'),
            text: t('shareWIPPoemText', { poemText }),
        };
    
        try {
            await navigator.share(shareData);
            trackEvent('wip_poem_shared', { poemText, userPoemLines: poemLines });
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                console.error('Sharing failed:', err);
            }
        }
    };

    const handleShareFinalPoem = async () => {
        if (!isShareApiAvailable || !editablePoem) return;
    
        const shareText = getShareablePoemText(artworkInfo, isArtlessMode, editablePoem, t);
    
        const shareData = {
            title: t('shareTitle'),
            text: shareText,
        };
    
        try {
            await navigator.share(shareData);
            trackEvent('final_poem_shared', { poemText: editablePoem, artwork: artworkInfo, isArtlessMode });
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                console.error('Sharing failed:', err);
            }
        }
    };

    const handleCopyFinalPoem = useCallback(async (): Promise<boolean> => {
        if (!editablePoem) return false;
    
        const poemTextToCopy = getShareablePoemText(artworkInfo, isArtlessMode, editablePoem, t);
    
        try {
            await navigator.clipboard.writeText(poemTextToCopy);
            trackEvent('final_poem_copied', { poemText: editablePoem, artwork: artworkInfo, isArtlessMode });
            return true;
        } catch (err) {
            console.error('Failed to copy poem to clipboard:', err);
            return false;
        }
    }, [editablePoem, artworkInfo, isArtlessMode, t]);

    const handleClearAllThemes = useCallback(() => {
        setPoemLines(['', '', '']);
        trackEvent('themes_cleared', {});
    }, [setPoemLines]);


    return {
        // State
        capturedImage, artworkImageUrl, poem, editablePoem, error, artworkInfo, showArtworkInfo, isArtworkZoomed,
        keywords, poemLines, userWantsToGenerate, isKeywordsReady, isArtlessMode, isFetchingArt, isGeneratingPoem,
        isGeneratingKeywords, loadingMessage, isChangeArtworkDisabled, isPoemGenerationCoolingDown, requestCount,
        MAX_REQUESTS, keywordGenerationLog, poemGenerationLog, showLogs, isLiked: isPoemLiked, showLikedFeedback, isLikeBouncing,
        bookmarks, likedPoems, isCurrentArtworkBookmarked, language, supportedLanguages, artSources, selectedArtSource, loadedPoemDate,
        loadedBookmarkDate, showSupportModal, showFeedbackModal, isShareApiAvailable, isFlipping, lastFinalPoem,
        showLikedPoemOptionsModal, 
        selectedLikedPoem,
        // Setters
        setEditablePoem, setShowArtworkInfo, setIsArtworkZoomed, setPoemLines, setShowLogs, setIsLikeBouncing, setShowSupportModal, setShowFeedbackModal,
        setShowLikedPoemOptionsModal,
        setSelectedLikedPoem,
        // Handlers
        handleFetchArt, handleFetchArtById, handleLoadLikedPoem, handleInspireMe, 
        handleChangeArtwork, handleToggleBookmark, handleExport, handleStartArtlessMode, handleLike, 
        handleCopyLog, generatePoem: handleGeneratePoem, handleFinalizePoemManually,
        handleRequestInspirationFromEditor, handleSetLanguage, handleSetArtSource,
        handleShareWIPPoem, handleFlipBackToEditor, handleShareFinalPoem, handleCopyFinalPoem,
        handleRecreatePoem, handleClearAllThemes, handleFlipToViewLastPoem,
        t
    };
}