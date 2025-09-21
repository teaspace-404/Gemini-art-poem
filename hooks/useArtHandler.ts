import { useState, useRef, useCallback } from 'react';
import { trackEvent } from '../components/analytics';
import { artService } from '../services/artService';
import { vaArtService } from '../services/vaArtService';
import type { Artwork, ArtSource } from '../types';

export const useArtHandler = (t: (key: any, replacements?: any) => string) => {
    const [artworkInfo, setArtworkInfo] = useState<Artwork | null>(null);
    const [artworkImageUrl, setArtworkImageUrl] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isFetchingArt, setIsFetchingArt] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    const [artSources] = useState<ArtSource[]>([
        { id: 'aic', name: t('sourceAIC'), initials: 'AIC', enabled: true },
        { id: 'va', name: t('sourceVA'), initials: 'VA', enabled: true },
        { id: 'bm', name: t('sourceBM'), initials: 'BM', enabled: false },
    ]);
    const [selectedArtSource, setSelectedArtSource] = useState<ArtSource>(artSources[0]);
    
    const requestRef = useRef(0);

    const processArtwork = async (artwork: Artwork, requestId: number) => {
        if (requestId !== requestRef.current) return;

        setArtworkImageUrl(artwork.imageUrl);
        setArtworkInfo(artwork);
        trackEvent('artwork_displayed', { artwork, imageUrl: artwork.imageUrl });

        try {
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
        } catch (err) {
            if (requestId === requestRef.current) {
                console.error("Error processing artwork image:", err);
                // A new translation key could be added for more specific error messages
                setError("There was a problem loading the artwork image."); 
            }
        }
    };

    const fetchArt = async () => {
        setIsFetchingArt(true);
        setError(null);
        const currentRequestId = ++requestRef.current;
        
        try {
            let artwork: Artwork;
            // Dispatch to the correct service based on the selected source
            if (selectedArtSource.id === 'va') {
                artwork = await vaArtService.fetchRandomArtwork();
            } else { // Default to AIC
                artwork = await artService.fetchRandomArtwork();
            }
            await processArtwork(artwork, currentRequestId);
        } catch (err) {
            if (currentRequestId === requestRef.current) {
                console.error(err);
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching art.";
                setError(errorMessage);
                trackEvent('error', { context: 'fetchArt', message: errorMessage, source: selectedArtSource.id });
            }
        } finally {
            if (currentRequestId === requestRef.current) {
                setIsFetchingArt(false);
            }
        }
    };

    const fetchArtById = async (id: string, sourceName: string) => {
        setIsFetchingArt(true);
        setError(null);
        const currentRequestId = ++requestRef.current;
        
        try {
            let artwork: Artwork;
            // Dispatch to the correct service based on the source name from the bookmark/liked poem
            if (sourceName === t('sourceVA')) {
                artwork = await vaArtService.fetchArtworkById(id);
            } else { // Default to AIC
                artwork = await artService.fetchArtworkById(id);
            }
            await processArtwork(artwork, currentRequestId);
        } catch (err) {
            if (currentRequestId === requestRef.current) {
                console.error(err);
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching the bookmarked art.";
                setError(errorMessage);
                trackEvent('error', { context: 'fetchArtById', message: errorMessage, source: sourceName });
            }
        } finally {
            if (currentRequestId === requestRef.current) {
                setIsFetchingArt(false);
            }
        }
    };
    
    const handleSetArtSource = useCallback((source: ArtSource) => {
        if (source.enabled) {
            setSelectedArtSource(source);
            trackEvent('art_source_changed', { sourceId: source.id, sourceName: source.name });
        }
    }, []);

    const resetArtState = () => {
        setError(null);
        setArtworkInfo(null);
        setCapturedImage(null);
        setArtworkImageUrl(null);
    };

    return {
        artworkInfo,
        artworkImageUrl,
        capturedImage,
        isFetchingArt,
        error,
        artSources,
        selectedArtSource,
        requestRef,
        setError,
        fetchArt,
        fetchArtById,
        handleSetArtSource,
        resetArtState,
    };
};
