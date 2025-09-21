import { useState, useEffect, useCallback } from 'react';
import { trackEvent } from '../components/analytics';
import type { Bookmark, LikedPoem, Artwork } from '../types';

export const usePersistenceHandler = (
    artworkInfo: Artwork | null, 
    editablePoem: string | null, 
    isArtlessMode: boolean,
    poemLines: string[]
) => {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [likedPoems, setLikedPoems] = useState<LikedPoem[]>([]);

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

    useEffect(() => {
        try {
            localStorage.setItem('ai-art-poet-bookmarks', JSON.stringify(bookmarks));
        } catch (err) {
            console.error("Failed to save bookmarks to localStorage:", err);
        }
    }, [bookmarks]);
    
    useEffect(() => {
        try {
            localStorage.setItem('ai-art-poet-liked-poems', JSON.stringify(likedPoems));
        } catch (err) {
            console.error("Failed to save liked poems to localStorage:", err);
        }
    }, [likedPoems]);

    const isCurrentArtworkBookmarked = !!artworkInfo && bookmarks.some(b => b.id === artworkInfo.id);

    const isPoemLiked = editablePoem ? likedPoems.some(p => p.poem === editablePoem && p.artworkId === (isArtlessMode ? 'artless' : artworkInfo?.id)) : false;

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
                    dateAdded: new Date().toISOString(),
                };
                return [...prevBookmarks, newBookmark];
            }
        });
    }, [artworkInfo]);

    const handleToggleLike = useCallback(() => {
        if (!editablePoem) return false;

        if (isPoemLiked) {
            const artworkId = isArtlessMode ? 'artless' : artworkInfo?.id;
            const poemToUnlike = likedPoems.find(p => p.artworkId === artworkId && p.poem === editablePoem);
            setLikedPoems(prev => prev.filter(p => !(p.artworkId === artworkId && p.poem === editablePoem)));
            trackEvent('poem_unliked', { artwork: artworkInfo, finalPoem: editablePoem, isArtlessMode, userInputs: poemToUnlike?.userInputs });
            return false; // Not newly liked
        } else {
            const newLikedPoem: LikedPoem = {
                id: Date.now(),
                artworkId: artworkInfo?.id ?? 'artless',
                artworkTitle: artworkInfo?.title ?? 'Artless Poem',
                artworkImageId: artworkInfo?.imageId ?? '',
                poem: editablePoem,
                source: artworkInfo?.source ?? 'artless',
                thumbnailUrl: artworkInfo?.thumbnailUrl ?? '',
                dateAdded: new Date().toISOString(),
                userInputs: poemLines,
            };
            setLikedPoems(prev => [...prev, newLikedPoem]);
            trackEvent('poem_liked', { artwork: artworkInfo, finalPoem: editablePoem, isArtlessMode, userInputs: poemLines });
            return true; // Newly liked
        }
    }, [isPoemLiked, artworkInfo, editablePoem, isArtlessMode, likedPoems, poemLines]);


    return {
        bookmarks,
        likedPoems,
        isCurrentArtworkBookmarked,
        isPoemLiked,
        handleToggleBookmark,
        handleToggleLike,
    };
};