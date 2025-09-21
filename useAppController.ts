import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { trackEvent } from './components/analytics';
import { translations } from './translations';
import { artService } from '../services/artService';
import type { Artwork, Bookmark, LikedPoem, LogEntry, ArtSource } from '../types';


// Add a declaration for html2canvas since it's loaded from a script tag
declare const html2canvas: any;

export const useAppController = () => {
    // Core state for the application's data
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [artworkImageUrl, setArtworkImageUrl] = useState<string | null>(null);
    const [poem, setPoem] = useState<string | null>(null);
    const [editablePoem, setEditablePoem] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [artworkInfo, setArtworkInfo] = useState<Artwork | null>(null);
    
    // UI State to manage visibility of modals and other components
    const [showArtworkInfo, setShowArtworkInfo] = useState<boolean>(false);
    const [isArtworkZoomed, setIsArtworkZoomed] = useState<boolean>(false);
    
    // State for the interactive poem generation flow
    const [keywords, setKeywords] =useState<string[]>([]);
    const [poemLines, setPoemLines] = useState<string[]>(['', '', '']);
    const [userWantsToGenerate, setUserWantsToGenerate] = useState<boolean>(false);
    const [isKeywordsReady, setIsKeywordsReady] = useState<boolean>(false);
    const [poemToLoad, setPoemToLoad] = useState<string | null>(null);
    const [isArtlessMode, setIsArtlessMode] = useState<boolean>(false);


    // Loading states to provide feedback to the user during async operations
    const [isFetchingArt, setIsFetchingArt] = useState<boolean>(false);
    const [isGeneratingPoem, setIsGeneratingPoem] = useState<boolean>(false);
    const [isGeneratingKeywords, setIsGeneratingKeywords] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [isChangeArtworkDisabled, setIsChangeArtworkDisabled] = useState<boolean>(false);
    const [isPoemGenerationCoolingDown, setIsPoemGenerationCoolingDown] = useState<boolean>(false);
    
    // State for request limiting
    const [requestCount, setRequestCount] = useState<number>(0);
    const MAX_REQUESTS = 50;

    // A ref to track the current artwork request, preventing race conditions.
    const requestRef = useRef(0);

    // State for AI transparency, logging prompts and responses
    const [keywordGenerationLog, setKeywordGenerationLog] = useState<LogEntry | null>(null);
    const [poemGenerationLog, setPoemGenerationLog] = useState<LogEntry | null>(null);
    const [showLogs, setShowLogs] = useState<boolean>(false);

    // State for user interaction on the final poem (e.g., liking)
    const [isLiked, setIsLiked] = useState<boolean>(false);
    const [showLikedFeedback, setShowLikedFeedback] = useState<boolean>(false);
    const [isLikeBouncing, setIsLikeBouncing] = useState<boolean>(false);

    // State for bookmarking and liking, with persistence to localStorage
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [likedPoems, setLikedPoems] = useState<LikedPoem[]>([]);
    
    // State for internationalization (i18n)
    const [language, setLanguage] = useState<'en' | 'cn'>('en');

    const supportedLanguages = [
        { code: 'en' as const, name: 'EN' },
        { code: 'cn' as const, name: '中文' },
    ];

    // Translation function (t)
    const t = useCallback((key: keyof typeof translations.en, replacements?: Record<string, string | number>) => {
        let text = translations[language]?.[key] || translations.en[key];
        if (replacements) {
            Object.entries(replacements).forEach(([placeholder, value]) => {
                text = text.replace(`{${placeholder}}`, String(value));
            });
        }
        return text;
    }, [language]);

    // State for art sources - must be initialized after `t`
     const [artSources] = useState<ArtSource[]>([
        { id: 'aic', name: t('sourceAIC'), initials: 'AIC', enabled: true },
        { id: 'va', name: t('sourceVA'), initials: 'VA', enabled: false },
        { id: 'bm', name: t('sourceBM'), initials: 'BM', enabled: false },
    ]);
    const [selectedArtSource, setSelectedArtSource] = useState<ArtSource>(artSources[0]);


    // Load saved data from localStorage on initial app load.
    useEffect(() => {
        try {
            const savedBookmarks = localStorage.getItem('ai-art-poet-bookmarks');
            if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
            
            const savedLikedPoems = localStorage.getItem('ai-art-poet-liked-poems');
            if (savedLikedPoems) setLikedPoems(JSON.parse(savedLikedPoems));

        } catch (err) {
            console.error("Failed to load data from localStorage:", err);
        }
    }, []);

    // Save bookmarks to localStorage whenever they change.
    useEffect(() => {
        try {
            localStorage.setItem('ai-art-poet-bookmarks', JSON.stringify(bookmarks));
        } catch (err) {
            console.error("Failed to save bookmarks to localStorage:", err);
        }
    }, [bookmarks]);
    
    // Save liked poems to localStorage whenever they change.
    useEffect(() => {
        try {
            localStorage.setItem('ai-art-poet-liked-poems', JSON.stringify(likedPoems));
        } catch (err) {
            console.error("Failed to save liked poems to localStorage:", err);
        }
    }, [likedPoems]);
    
    useEffect(() => {
        setEditablePoem(poem);
    }, [poem]);

    // This effect runs after an artwork is successfully loaded to see if we need to set a liked poem.
    useEffect(() => {
        if (poemToLoad && artworkInfo && !isFetchingArt) {
            setPoem(poemToLoad);
            setEditablePoem(poemToLoad);
            setUserWantsToGenerate(true); // Ensure we are in the poem view
            setPoemToLoad(null); // Clear the trigger
        }
    }, [artworkInfo, poemToLoad, isFetchingArt]);
    
    // This effect checks if the current poem for the current artwork is liked.
     useEffect(() => {
        if (artworkInfo && editablePoem) {
            const isCurrentlyLiked = likedPoems.some(p => p.artworkId === artworkInfo.id && p.poem === editablePoem);
            setIsLiked(isCurrentlyLiked);
        } else {
            setIsLiked(false);
        }
    }, [editablePoem, artworkInfo, likedPoems]);

    // Effect to cycle through loading messages while waiting for keywords.
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        const isLoadingKeywords = userWantsToGenerate && !isKeywordsReady && !isArtlessMode;

        if (isLoadingKeywords) {
            const messages = t('loadingMessages').split('|');
            setLoadingMessage(messages[0]); // Reset to the first message
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
    
    const handleSetLanguage = useCallback((lang: 'en' | 'cn') => {
        if (lang !== language) {
            setLanguage(lang);
            trackEvent('language_changed', { newLang: lang });
        }
    }, [language]);

    const handleSetArtSource = useCallback((source: ArtSource) => {
        if (source.enabled) {
            setSelectedArtSource(source);
            trackEvent('art_source_changed', { sourceId: source.id, sourceName: source.name });
        }
    }, []);

    const generateKeywords = useCallback(async (imageDataUrl: string, requestId: number) => {
        if (!process.env.API_KEY) {
            if (requestId === requestRef.current) setError("Gemini API key is not configured.");
            return;
        }
        setIsGeneratingKeywords(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const base64Data = imageDataUrl.split(',')[1];
            
            const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Data } };
            const textPart = { text: t('keywordPrompt') };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
            });
            
            if (requestId === requestRef.current) {
                const keywordString = response.text.trim();
                setKeywordGenerationLog({ prompt: textPart.text, response: keywordString });
                const keywordsArray = keywordString.replace(/[\*\n]/g, ',').split(',').map(k => k.trim()).filter(Boolean);
                setKeywords(keywordsArray);
                setIsKeywordsReady(true);
            }
        } catch (err) {
            if (requestId === requestRef.current) {
                console.error(err);
                setError("Failed to generate keywords. You can still write a poem without them.");
                setIsKeywordsReady(true);
            }
        } finally {
            if (requestId === requestRef.current) {
                setIsGeneratingKeywords(false);
            }
        }
    }, [t]);

    const generatePoem = useCallback(async (isRestricted: boolean) => {
        if (requestCount >= MAX_REQUESTS) {
            setError("You have reached the maximum number of requests for this session.");
            return;
        }
        if (isPoemGenerationCoolingDown) return;
        if (!capturedImage && !isArtlessMode) {
            setError("No image available to generate a poem from.");
            return;
        }

        setRequestCount(prevCount => prevCount + 1);
        setIsGeneratingPoem(true);
        setIsPoemGenerationCoolingDown(true);
        setError(null);
        setPoem(null);

        setTimeout(() => setIsPoemGenerationCoolingDown(false), 5000);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const sanitizedLines = poemLines.map(line => line.replace(/[<>{}[\]()]/g, ''));

            let promptText: string;
            let contents: any;
            let basePrompt = t('poemPromptBase');
            
            if (isRestricted) {
                basePrompt += ` ${t('poemPromptRestriction')}`;
            } else if (capturedImage) {
                 basePrompt += ` ${t('poemPromptInspiration')}`;
            } else {
                 basePrompt += ` ${t('poemPromptArtlessInspiration')}`;
            }
            
            const anything = t('anythingPlaceholder');
            const themes = t('poemPromptThemes', {
                line1: sanitizedLines[0] || anything,
                line2: sanitizedLines[1] || anything,
                line3: sanitizedLines[2] || anything,
            });

            if (isArtlessMode || !capturedImage) {
                promptText = `${basePrompt}\n${themes}`;
                contents = promptText;
            } else {
                const base64Data = capturedImage.split(',')[1];
                const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Data } };
                promptText = `${basePrompt}\n${themes}`;
                const textPart = { text: promptText };
                contents = { parts: [imagePart, textPart] };
            }

            const safetySettings = [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ];
           
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contents,
                config: {
                    safetySettings: safetySettings,
                    maxOutputTokens: 100,
                    thinkingConfig: { thinkingBudget: 50 },
                },
            });
            
            const poemText = response.text.trim();
            setPoemGenerationLog({ prompt: promptText, response: poemText });
            setPoem(poemText);

            trackEvent('poem_generated', { 
                artwork: artworkInfo,
                isArtlessMode: isArtlessMode,
                userPoemLines: sanitizedLines,
                generatedPoem: poemText,
                geminiPrompt: promptText,
                isRestricted: isRestricted
            });

        } catch (err) {
            console.error(err);
            setError("Failed to generate poem. Please try again. The content may have been blocked by safety filters.");
            trackEvent('error', { context: 'generatePoem', message: (err as Error).message });
        } finally {
            setIsGeneratingPoem(false);
        }
    }, [capturedImage, poemLines, requestCount, artworkInfo, isArtlessMode, isPoemGenerationCoolingDown, t]);

    const handleFinalizePoemManually = useCallback(() => {
        const finalPoem = poemLines.join('\n').trim();
        if (!finalPoem) {
            setError("Cannot create a poem from empty lines.");
            return;
        }
        
        setPoem(finalPoem);
        setEditablePoem(finalPoem);
        
        setPoemGenerationLog({
            prompt: "User created poem manually.",
            response: finalPoem
        });
        
        trackEvent('poem_finalized_manually', {
            artwork: artworkInfo,
            isArtlessMode: isArtlessMode,
            finalPoem: finalPoem,
        });
    }, [poemLines, artworkInfo, isArtlessMode]);

    const resetForNewArtwork = () => {
        setError(null);
        setArtworkInfo(null);
        setCapturedImage(null);
        setArtworkImageUrl(null);
        setPoem(null);
        setKeywords([]);
        setPoemLines(['', '', '']);
        setKeywordGenerationLog(null);
        setPoemGenerationLog(null);
        setIsKeywordsReady(false);
        setUserWantsToGenerate(false);
        setIsLiked(false);
        setIsArtlessMode(false);
    }

    const processArtwork = async (artwork: Artwork, requestId: number) => {
        if(requestId !== requestRef.current) return;

        setArtworkImageUrl(artwork.imageUrl);
        setArtworkInfo(artwork);
        trackEvent('artwork_displayed', { artwork, imageUrl: artwork.imageUrl });

        const imageResponse = await fetch(artwork.imageUrl);
        if (!imageResponse.ok) throw new Error('Failed to fetch the artwork image.');
            
        const imageBlob = await imageResponse.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
            if (requestId === requestRef.current) {
                const base64data = reader.result as string;
                setCapturedImage(base64data);
            }
        };
        reader.readAsDataURL(imageBlob);
    };

    const handleFetchArt = async () => {
        if (selectedArtSource.id !== 'aic') {
            setError(`The ${selectedArtSource.name} source is not yet available.`);
            return;
        }
        setIsFetchingArt(true);
        const currentRequestId = ++requestRef.current;
        resetForNewArtwork();

        try {
            const artwork = await artService.fetchRandomArtwork();
            await processArtwork(artwork, currentRequestId);
        } catch (err) {
            if (currentRequestId === requestRef.current) {
                console.error(err);
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching art.";
                setError(errorMessage);
                trackEvent('error', { context: 'handleFetchArt', message: errorMessage });
            }
        } finally {
            if (currentRequestId === requestRef.current) {
                setIsFetchingArt(false);
            }
        }
    };

    const handleFetchArtById = async (id: string) => {
        setIsFetchingArt(true);
        const currentRequestId = ++requestRef.current;
        resetForNewArtwork();
        
        try {
            const artwork = await artService.fetchArtworkById(id);
            await processArtwork(artwork, currentRequestId);
        } catch (err) {
             if (currentRequestId === requestRef.current) {
                console.error(err);
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching the bookmarked art.";
                setError(errorMessage);
                trackEvent('error', { context: 'handleFetchArtById', message: errorMessage });
            }
        } finally {
            if (currentRequestId === requestRef.current) {
                setIsFetchingArt(false);
            }
        }
    };

    const handleLoadLikedPoem = (likedPoem: LikedPoem) => {
        if (likedPoem.source === 'artless') {
            resetForNewArtwork();
            setIsArtlessMode(true);
            setUserWantsToGenerate(true);
            setIsKeywordsReady(true);
            setKeywords([]);
            setPoem(likedPoem.poem);
            setEditablePoem(likedPoem.poem);
        } else {
            setPoemToLoad(likedPoem.poem);
            handleFetchArtById(likedPoem.artworkId);
        }
    };
    
    const handleInspireMe = () => {
        if (!capturedImage) return;
        setUserWantsToGenerate(true);
        const currentRequestId = requestRef.current; 
        generateKeywords(capturedImage, currentRequestId);
    };

    const handleStartWritingDirectly = () => {
        setUserWantsToGenerate(true);
        setIsKeywordsReady(true);
        setKeywords([]);
        trackEvent('start_writing_directly', { artwork: artworkInfo });
    };

    const handleRequestInspirationFromEditor = useCallback(() => {
        if (!capturedImage) return;
        trackEvent('request_inspiration_from_editor', { artwork: artworkInfo });
        const currentRequestId = ++requestRef.current;
        generateKeywords(capturedImage, currentRequestId);
    }, [capturedImage, artworkInfo, generateKeywords]);

    const handleChangeArtwork = () => {
        trackEvent('artwork_changed', { currentArtwork: artworkInfo });
        setIsChangeArtworkDisabled(true);
        handleFetchArt();
        setTimeout(() => {
            setIsChangeArtworkDisabled(false);
        }, 2000);
    };

    const handleWriteAnother = useCallback(() => {
        if (!capturedImage && !isArtlessMode) return;

        if (isArtlessMode) {
            trackEvent('write_another_poem_artless', {});
            setPoem(null);
            setEditablePoem(null);
            setPoemLines(['', '', '']);
            setPoemGenerationLog(null);
            return;
        }
        
        trackEvent('write_another_poem', { artwork: artworkInfo });
        setPoem(null);
        setEditablePoem(null);
        setPoemLines(['', '', '']);
        setPoemGenerationLog(null);
        setKeywords([]);
        setIsKeywordsReady(false);
        setKeywordGenerationLog(null);
        setIsLiked(false); 
        setUserWantsToGenerate(true);

        if (capturedImage) {
            const currentRequestId = ++requestRef.current;
            generateKeywords(capturedImage, currentRequestId);
        }
    }, [capturedImage, artworkInfo, generateKeywords, isArtlessMode]);
    

     const handleLike = useCallback(() => {
        if (!editablePoem) return;

        if (isLiked) {
            const artworkId = isArtlessMode ? 'artless' : artworkInfo?.id;
            setLikedPoems(prev => prev.filter(p => !(p.artworkId === artworkId && p.poem === editablePoem)));
            trackEvent('poem_unliked', { artwork: artworkInfo, finalPoem: editablePoem, isArtlessMode });
        } else {
            const newLikedPoem: LikedPoem = {
                id: Date.now(),
                artworkId: artworkInfo?.id ?? 'artless',
                artworkTitle: artworkInfo?.title ?? 'Artless Poem',
                artworkImageId: artworkInfo?.imageId ?? '',
                poem: editablePoem,
                source: artworkInfo?.source ?? 'artless',
                thumbnailUrl: artworkInfo?.thumbnailUrl ?? '',
            };
            setLikedPoems(prev => [...prev, newLikedPoem]);
            trackEvent('poem_liked', { artwork: artworkInfo, finalPoem: editablePoem, isArtlessMode });

            setShowLikedFeedback(true);
            setIsLikeBouncing(true);
            setTimeout(() => setShowLikedFeedback(false), 1000);
        }
    }, [isLiked, artworkInfo, editablePoem, isArtlessMode]);


     const handleToggleBookmark = useCallback(() => {
        if (!artworkInfo) return;

        setBookmarks(prevBookmarks => {
            const isBookmarked = prevBookmarks.some(b => b.id === artworkInfo.id);
            if (isBookmarked) {
                trackEvent('artwork_unbookmarked', { artwork: artworkInfo });
                return prevBookmarks.filter(b => b.id !== artworkInfo.id);
            } else {
                trackEvent('artwork_bookmarked', { artwork: artworkInfo });
                const newBookmark: Bookmark = {
                    id: artworkInfo.id,
                    title: artworkInfo.title,
                    imageId: artworkInfo.imageId,
                    source: artworkInfo.source,
                    thumbnailUrl: artworkInfo.thumbnailUrl,
                };
                return [...prevBookmarks, newBookmark];
            }
        });
    }, [artworkInfo]);


    const handleExport = () => {
        if (!editablePoem) {
            setError("Cannot export without a poem.");
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

        if (isArtlessMode) {
            trackEvent('poemgram_exported_artless', { finalPoem: editablePoem });
        } else if (artworkImageUrl) {
            trackEvent('poemgram_exported', { artwork: artworkInfo, finalPoem: editablePoem });
            const imgElement = document.createElement('img');
            imgElement.src = artworkImageUrl;
            imgElement.crossOrigin = 'anonymous';
            imgElement.width = 843;
            exportRoot.appendChild(imgElement);
        } else {
            setError("Cannot export without an image.");
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
    
        html2canvas(exportRoot, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#fcfcfc',
            logging: true,
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `poem-for-art-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            document.body.removeChild(exportRoot);
        }).catch(err => {
            console.error("html2canvas failed:", err);
            const errorMessage = "Failed to export the image. There might be a network or browser issue.";
            setError(errorMessage);
            trackEvent('error', { context: 'handleExport', message: errorMessage });
            if (document.body.contains(exportRoot)) {
                document.body.removeChild(exportRoot);
            }
        });
    };
    
     const handleStartArtlessMode = () => {
        resetForNewArtwork();
        setIsArtlessMode(true);
        setUserWantsToGenerate(true);
        setIsKeywordsReady(true);
        setKeywords([]);
        trackEvent('start_artless_mode', {});
    };

    const handleDownloadLog = () => {
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
        const blob = new Blob([logContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `poem-for-art-log_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const isCurrentArtworkBookmarked = !!artworkInfo && bookmarks.some(b => b.id === artworkInfo.id);

    return {
        capturedImage,
        artworkImageUrl,
        poem,
        editablePoem,
        error,
        artworkInfo,
        showArtworkInfo,
        isArtworkZoomed,
        keywords,
        poemLines,
        userWantsToGenerate,
        isKeywordsReady,
        isArtlessMode,
        isFetchingArt,
        isGeneratingPoem,
        isGeneratingKeywords,
        loadingMessage,
        isChangeArtworkDisabled,
        isPoemGenerationCoolingDown,
        requestCount,
        MAX_REQUESTS,
        keywordGenerationLog,
        poemGenerationLog,
        showLogs,
        isLiked,
        showLikedFeedback,
        isLikeBouncing,
        bookmarks,
        likedPoems,
        isCurrentArtworkBookmarked,
        language,
        supportedLanguages,
        artSources,
        selectedArtSource,
        setEditablePoem,
        setShowArtworkInfo,
        setIsArtworkZoomed,
        setPoemLines,
        setShowLogs,
        setIsLikeBouncing,
        handleFetchArt,
        handleFetchArtById,
        handleLoadLikedPoem,
        handleInspireMe,
        handleStartWritingDirectly,
        handleChangeArtwork,
        handleToggleBookmark,
        handleExport,
        handleStartArtlessMode,
        handleLike,
        handleWriteAnother,
        handleDownloadLog,
        generatePoem,
        handleFinalizePoemManually,
        handleRequestInspirationFromEditor,
        handleSetLanguage,
        handleSetArtSource,
        t
    };
}