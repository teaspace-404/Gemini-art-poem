import React from 'react';
import { useAppContext } from '../AppContext';
import { DownloadIcon, RefreshIcon, SparklesIcon, HeartIcon, PencilIcon, SparklesButtonIcon } from './Icons';
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
        loadingMessage,
        setEditablePoem,
        setIsLikeBouncing,
        handleInspireMe,
        handleStartWritingDirectly,
        handleExport,
        handleStartArtlessMode,
        handleLike,
        handleWriteAnother,
        t,
    } = useAppContext();

    return (
        <div className="md:flex-[0_0_38%] flex flex-col items-center justify-center p-6 bg-white/50 rounded-lg shadow-inner border border-stone-200 min-h-[50vh] md:min-h-0">
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
                        <span>{t('writeFromScratch')}</span>
                    </ActionButton>
                </div>
            )}

            {/* Main generation flow, shown only when an image is present or in artless mode */}
            { (capturedImage || isArtlessMode) && (
                 // The final poem view has the highest priority and is shown once 'editablePoem' has content.
                !isGeneratingPoem && editablePoem ? (
                    <div className="w-full text-left animate-fadeIn">
                        <h3 className="font-bold text-lg mb-3 text-stone-700">{t('finalPoemTitle')}</h3>
                        <textarea
                            value={editablePoem}
                            onChange={(e) => setEditablePoem(e.target.value)}
                            rows={4}
                            className="w-full p-3 bg-stone-50 border border-stone-300 rounded-md font-serif text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
                            aria-label={t('finalPoemAriaLabel')}
                        />
                        <div className="w-full flex flex-col items-center gap-4 mt-6 relative">
                             {showLikedFeedback && (
                                <span className="absolute -top-10 bg-black/70 text-white text-sm px-3 py-1 rounded-full animate-fadeIn">
                                    {t('likedFeedback')}
                                </span>
                            )}
                            <ActionButton
                                onClick={handleExport}
                                disabled={!editablePoem}
                                className="bg-slate-500 text-white hover:bg-slate-600 w-52"
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
                                <button
                                    onClick={handleWriteAnother}
                                    className="p-3 bg-stone-200 text-stone-700 hover:bg-stone-300 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-100 shadow-md"
                                    title={t('newPoemTitle')}
                                >
                                    <RefreshIcon />
                                </button>
                            </div>
                        </div>
                    </div>
                // Show "muse is working" spinner if the poem is being generated.
                ) : isGeneratingPoem ? (
                    <div className="text-center text-stone-600">
                        <LoadingSpinner />
                        <p className="mt-4">{t('museWorking')}</p>
                    </div>
                // If user hasn't clicked "Inspire Me" or "Write from Scratch" yet, show the choice.
                ) : !userWantsToGenerate ? (
                    <div className="text-center animate-fadeIn flex flex-col items-center gap-4">
                        <ActionButton
                            onClick={handleInspireMe}
                            className="bg-slate-500 text-white hover:bg-slate-600 text-lg w-60"
                        >
                            <SparklesButtonIcon />
                            <span>{t('inspireMe')}</span>
                        </ActionButton>
                         <ActionButton
                            onClick={handleStartWritingDirectly}
                            className="bg-white text-slate-600 border border-slate-400 hover:bg-slate-50 w-60"
                        >
                            <PencilIcon />
                            <span>{t('writeFromScratch')}</span>
                        </ActionButton>
                    </div>
                // If user has clicked "Inspire Me" but keywords aren't ready, show "analyzing" spinner.
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