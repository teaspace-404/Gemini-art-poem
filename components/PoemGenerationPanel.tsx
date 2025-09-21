import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { DownloadIcon, HeartIcon, PencilIcon, FlipIcon, ShareIcon, SparklesIcon, CopyIcon } from './icons';
import PoemEditor from './PoemEditor';
import ActionButton from './ActionButton';
import LoadingSpinner from './LoadingSpinner';

const PoemGenerationPanel: React.FC = () => {
    const {
        capturedImage,
        editablePoem,
        error,
        showLikedFeedback,
        isLiked,
        isLikeBouncing,
        userWantsToGenerate,
        isKeywordsReady,
        isArtlessMode,
        isFetchingArt,
        isGeneratingPoem,
        isShareApiAvailable,
        loadingMessage,
        loadedPoemDate,
        isFlipping,
        setEditablePoem,
        setIsLikeBouncing,
        handleExport,
        handleStartArtlessMode,
        handleLike,
        handleFlipBackToEditor,
        handleShareFinalPoem,
        handleCopyFinalPoem,
        t,
    } = useAppContext();

    const [isPoemCopied, setIsPoemCopied] = useState(false);

    const formatDate = (isoString: string | undefined) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const onCopyPoem = async () => {
        const success = await handleCopyFinalPoem();
        if (success) {
            setIsPoemCopied(true);
            setTimeout(() => setIsPoemCopied(false), 2000);
        }
    };

    return (
        <div className={`md:flex-[0_0_38%] flex flex-col items-center justify-center p-6 bg-white/50 rounded-lg shadow-inner border border-stone-200 min-h-[50vh] md:min-h-0 ${isFlipping ? 'animate-flipHorizontal' : ''}`}>
           {/* Initial state: No artwork loaded yet */}
            {!capturedImage && !isFetchingArt && !error && !isArtlessMode && (
                 <div className="text-center text-stone-500 flex flex-col items-center justify-center h-full">
                    <SparklesIcon />
                    <p className="mt-2 mb-6">{t('inspirationAwaits')}</p>
                    <ActionButton
                        onClick={handleStartArtlessMode}
                        className="bg-white text-slate-600 border border-slate-400 hover:bg-slate-50 w-52"
                    >
                        <PencilIcon />
                        <span>{t('artlessDescription')}</span>
                    </ActionButton>
                </div>
            )}

            {/* Main generation flow, shown only when an image is present or in artless mode */}
            { (capturedImage || isArtlessMode) && (
                 // The final poem view has the highest priority and is shown once 'editablePoem' has content.
                !isGeneratingPoem && editablePoem ? (
                    <div className="w-full text-left animate-fadeIn">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-lg text-stone-700">{t('finalPoemTitle')}</h3>
                            <button
                                onClick={handleFlipBackToEditor}
                                className="text-stone-500 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-stone-200"
                                title={t('editThemes')}
                            >
                                <FlipIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <textarea
                            value={editablePoem}
                            onChange={(e) => setEditablePoem(e.target.value)}
                            rows={4}
                            className="w-full p-3 bg-stone-50 border border-stone-300 rounded-md font-serif text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
                            aria-label={t('finalPoemAriaLabel')}
                        />
                         {loadedPoemDate && (
                            <p className="text-right text-xs text-stone-500 mt-2 italic">
                                {t('likedOnDate', { date: formatDate(loadedPoemDate) })}
                            </p>
                        )}
                        <div className="w-full flex flex-col items-center gap-4 mt-4 relative">
                             {showLikedFeedback && (
                                <span className="absolute -top-10 bg-black/70 text-white text-sm px-3 py-1 rounded-full animate-fadeIn">
                                    {t('likedFeedback')}
                                </span>
                            )}
                            <ActionButton
                                onClick={handleExport}
                                disabled={!editablePoem}
                                className="bg-slate-500 text-white hover:bg-slate-600"
                                title={t('exportPoemgramTitle')}
                            >
                                <DownloadIcon />
                                <span>{t('exportPoemgram')}</span>
                            </ActionButton>
                            <div className="flex items-center justify-center gap-4 mt-2">
                                <button
                                    onClick={handleLike}
                                    onAnimationEnd={() => setIsLikeBouncing(false)}
                                    className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-100 shadow-md ${isLiked ? 'text-red-500 bg-red-100' : 'text-stone-600 bg-stone-200'} ${isLikeBouncing ? 'animate-bounceLike' : ''}`}
                                    title={isLiked ? t('unlikeTitle') : t('likeTitle')}
                                    aria-pressed={isLiked}
                                >
                                    <HeartIcon filled={isLiked} />
                                </button>
                                
                                {/* SHARE / COPY BUTTON LOGIC */}
                                {isShareApiAvailable ? (
                                    <button
                                        onClick={handleShareFinalPoem}
                                        className="p-3 bg-stone-200 text-stone-700 hover:bg-stone-300 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-100 shadow-md"
                                        title={t('shareTitle')}
                                    >
                                        <ShareIcon />
                                    </button>
                                ) : (
                                    <button
                                        onClick={onCopyPoem}
                                        disabled={isPoemCopied}
                                        className="p-3 bg-stone-200 text-stone-700 hover:bg-stone-300 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-100 shadow-md w-[48px] h-[48px] flex items-center justify-center"
                                        title={t('copyPoemTitle')}
                                    >
                                        {isPoemCopied ? (
                                            <span className="text-xs font-bold animate-fadeIn">{t('poemCopied')}</span>
                                        ) : (
                                            <CopyIcon />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                // Show "muse is working" spinner if the poem is being generated.
                ) : isGeneratingPoem ? (
                    <div className="text-center text-stone-600">
                        <LoadingSpinner />
                        <p className="mt-4">{t('museWorking')}</p>
                    </div>
                // If keywords aren't ready (e.g. Inspire me was clicked), show analyzing spinner.
                ) : !isKeywordsReady ? (
                    <div className="text-center text-stone-600">
                        <LoadingSpinner />
                        <p className="mt-4 transition-opacity duration-500">{loadingMessage}</p>
                    </div>
                // Otherwise, keywords are ready, so show the poem editor.
                ) : (
                   <PoemEditor />
                )
            )}
        </div>
    );
};

export default PoemGenerationPanel;