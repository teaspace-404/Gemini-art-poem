import { useState, useCallback } from 'react';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { trackEvent } from '../components/analytics';
import type { LogEntry, Artwork } from '../types';

const MAX_REQUESTS = 50;

export const usePoemHandler = (t: (key: any, replacements?: any) => string) => {
    const [poem, setPoem] = useState<string | null>(null);
    const [editablePoem, setEditablePoem] = useState<string | null>(null);
    const [keywords, setKeywords] = useState<string[]>([]);
    const [poemLines, setPoemLines] = useState<string[]>(['', '', '']);
    const [isGeneratingPoem, setIsGeneratingPoem] = useState<boolean>(false);
    const [isGeneratingKeywords, setIsGeneratingKeywords] = useState<boolean>(false);
    const [isPoemGenerationCoolingDown, setIsPoemGenerationCoolingDown] = useState<boolean>(false);
    const [requestCount, setRequestCount] = useState<number>(0);
    const [keywordGenerationLog, setKeywordGenerationLog] = useState<LogEntry | null>(null);
    const [poemGenerationLog, setPoemGenerationLog] = useState<LogEntry | null>(null);
    const [generationError, setGenerationError] = useState<string | null>(null);

    const generateKeywords = useCallback(async (imageDataUrl: string, requestId: number, requestRef: React.MutableRefObject<number>) => {
        if (!process.env.API_KEY) {
            if (requestId === requestRef.current) setGenerationError("Gemini API key is not configured.");
            return null;
        }
        setIsGeneratingKeywords(true);
        setGenerationError(null);
        let generatedKeywords: string[] | null = null;

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
                generatedKeywords = keywordsArray;
            }
        } catch (err) {
            if (requestId === requestRef.current) {
                console.error(err);
                setGenerationError("Failed to generate keywords. You can still write a poem without them.");
            }
        } finally {
            if (requestId === requestRef.current) {
                setIsGeneratingKeywords(false);
            }
        }
        return generatedKeywords;
    }, [t]);

    const generatePoem = useCallback(async (isRestricted: boolean, capturedImage: string | null, isArtlessMode: boolean, artworkInfo: Artwork | null) => {
        if (requestCount >= MAX_REQUESTS) {
            setGenerationError("You have reached the maximum number of requests for this session.");
            return;
        }
        if (isPoemGenerationCoolingDown) return;
        if (!capturedImage && !isArtlessMode) {
            setGenerationError("No image available to generate a poem from.");
            return;
        }

        setRequestCount(prevCount => prevCount + 1);
        setIsGeneratingPoem(true);
        setIsPoemGenerationCoolingDown(true);
        setGenerationError(null);
        setPoem(null);

        setTimeout(() => setIsPoemGenerationCoolingDown(false), 5000);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const sanitizedLines = poemLines.map(line => line.replace(/[<>{}[\]()]/g, ''));
            let promptText: string;
            let contents: any;
            let basePrompt = t('poemPromptBase', { lineCount: poemLines.length });
            
            if (isRestricted) { basePrompt += ` ${t('poemPromptRestriction')}`; }
            else if (capturedImage) { basePrompt += ` ${t('poemPromptInspiration')}`; }
            else { basePrompt += ` ${t('poemPromptArtlessInspiration')}`; }
            
            const anything = t('anythingPlaceholder');
            const themes = sanitizedLines
                .map((line, index) => `Line ${index + 1} theme: ${line || anything}`)
                .join('\n');

            if (isArtlessMode || !capturedImage) {
                promptText = `${basePrompt}\n${themes}`;
                contents = {parts: [{text: promptText}]};
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
                config: { safetySettings, maxOutputTokens: 100, thinkingConfig: { thinkingBudget: 50 } },
            });
            
            const poemText = response.text.trim();
            setPoemGenerationLog({ prompt: promptText, response: poemText });
            setPoem(poemText);
            setEditablePoem(poemText);

            trackEvent('poem_generated', { artwork: artworkInfo, isArtlessMode, userPoemLines: sanitizedLines, generatedPoem: poemText, geminiPrompt: promptText, isRestricted });

        } catch (err) {
            console.error(err);
            setGenerationError("Failed to generate poem. Please try again. The content may have been blocked by safety filters.");
            trackEvent('error', { context: 'generatePoem', message: (err as Error).message });
        } finally {
            setIsGeneratingPoem(false);
        }
    }, [poemLines, requestCount, isPoemGenerationCoolingDown, t]);
    
    const finalizePoemManually = useCallback((artworkInfo: Artwork | null, isArtlessMode: boolean) => {
        const finalPoem = poemLines.join('\n').trim();
        if (!finalPoem) {
            setGenerationError("Cannot create a poem from empty lines.");
            return;
        }
        
        setPoem(finalPoem);
        setEditablePoem(finalPoem);
        
        setPoemGenerationLog({
            prompt: "User created poem manually.",
            response: finalPoem
        });
        
        trackEvent('poem_finalized_manually', { artwork: artworkInfo, isArtlessMode, finalPoem: finalPoem });
    }, [poemLines]);

    const resetPoemState = () => {
        setPoem(null);
        setEditablePoem(null);
        setKeywords([]);
        setPoemLines(['', '', '']);
        setKeywordGenerationLog(null);
        setPoemGenerationLog(null);
        setGenerationError(null);
    };

    const resetInspirationState = () => {
        setKeywords([]);
        setKeywordGenerationLog(null);
    };

    return {
        poem,
        editablePoem,
        keywords,
        poemLines,
        isGeneratingPoem,
        isGeneratingKeywords,
        isPoemGenerationCoolingDown,
        requestCount,
        MAX_REQUESTS,
        keywordGenerationLog,
        poemGenerationLog,
        generationError,
        setPoem,
        setEditablePoem,
        setKeywords,
        setPoemLines,
        setKeywordGenerationLog,
        setPoemGenerationLog,
        setGenerationError,
        generateKeywords,
        generatePoem,
        finalizePoemManually,
        resetPoemState,
        resetInspirationState
    };
};