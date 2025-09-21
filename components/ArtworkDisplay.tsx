import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { SearchIcon, ImageIcon, RefreshIcon, SparklesIcon, InfoIcon, BookmarkIcon, UploadIcon, BanIcon, AdvancedSearchIcon } from './icons';
import ActionButton from './ActionButton';
import LoadingSpinner from './LoadingSpinner';

const ArtworkDisplay: React.FC = () => {
    const {
        capturedImage,
        error,
        artworkInfo,
        isArtlessMode,
        isFetchingArt,
        isChangeArtworkDisabled,
        isCurrentArtworkBookmarked,
        artSources,
        selectedArtSource,
        loadedBookmarkDate,
        setShowArtworkInfo,
        setIsArtworkZoomed,
        handleFetchArt,
        handleChangeArtwork,
        handleToggleBookmark,
        handleSetArtSource,
        t,
    } = useAppContext();

    const [isSourceSelectorOpen, setIsSourceSelectorOpen] = useState(false);

    const formatDate = (isoString: string | undefined) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="md:flex-[0_0_50%] flex flex-col items-center gap-4">
            <h1 className="text-3xl sm:text-4xl font-sans font-bold text-stone-900">{t('appTitle')}</h1>
            <p className="text-stone-600 mb-4">{t('appSubtitle')}</p>

            <div className="w-full aspect-square bg-white rounded-lg shadow-lg flex items-center justify-center relative border border-stone-200">
                {isFetchingArt && <LoadingSpinner />}
                {error && !isFetchingArt && <p className="text-red-600 p-4">{error}</p>}
                
                {!isFetchingArt && !error && capturedImage && (
                    <>
                        <img
                            src={capturedImage}
                            alt="Captured artwork"
                            className="w-full h-full object-contain rounded-lg cursor-pointer transition-transform hover:scale-105"
                            onClick={() => setIsArtworkZoomed(true)}
                        />
                        {artworkInfo && (
                            <div className="absolute top-3 right-3 flex flex-col gap-2">
                                <button
                                    onClick={() => setShowArtworkInfo(true)}
                                    className="p-2 text-white bg-black/40 rounded-full hover:bg-black/60 transition-all"
                                    aria-label={t('artworkInfoAria')}
                                >
                                    <InfoIcon />
                                </button>
                                <button
                                    onClick={handleToggleBookmark}
                                    className="p-2 text-white bg-black/40 rounded-full hover:bg-black/60 transition-all"
                                    aria-label={isCurrentArtworkBookmarked ? t('removeBookmarkAria') : t('bookmarkAria')}
                                    aria-pressed={isCurrentArtworkBookmarked}
                                >
                                    <BookmarkIcon filled={isCurrentArtworkBookmarked} />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {isArtlessMode && (
                    <div className="text-center text-stone-500 p-4">
                        <SparklesIcon />
                        <p className="mt-2 font-semibold">{t('artlessMode')}</p>
                        <p className="mt-1 text-sm">{t('artlessDescription')}</p>
                    </div>
                )}
                
                {!isFetchingArt && !capturedImage && !error && !isArtlessMode && (
                     <div className="text-center text-stone-500">
                        <ImageIcon />
                        <p className="mt-2">{t('magicPlaceholder')}</p>
                    </div>
                )}
            </div>

            {loadedBookmarkDate && (
                <p className="text-xs text-stone-500 italic animate-fadeIn">
                    {t('bookmarkedOnDate', { date: formatDate(loadedBookmarkDate) })}
                </p>
            )}

            {/* Action Buttons */}
            <div className="w-full grid grid-cols-3 items-center gap-2">
                
                {/* Left Aligned: Source Selector */}
                <div className="justify-self-start">
                    <button
                        onClick={() => setIsSourceSelectorOpen(true)}
                        title={t('selectSource')}
                        className="h-12 w-12 flex-shrink-0 flex items-center justify-center font-bold text-sm bg-black text-white rounded-full transition-all duration-300 shadow-md transform hover:scale-105 active:scale-100 hover:bg-stone-700"
                    >
                        {selectedArtSource.initials}
                    </button>
                </div>

                {/* Center Aligned: Main Action Button */}
                <div className="justify-self-center">
                    {!capturedImage ? (
                        <ActionButton
                            onClick={handleFetchArt}
                            disabled={isFetchingArt}
                            className="bg-slate-500 text-white hover:bg-slate-600 w-52"
                        >
                            <SearchIcon />
                            <span>{t('fetchArt')}</span>
                        </ActionButton>
                    ) : (
                        <ActionButton
                            onClick={handleChangeArtwork}
                            disabled={isFetchingArt || isChangeArtworkDisabled}
                            className="bg-stone-200 text-stone-700 hover:bg-stone-300"
                            title={t('changeArtTitle')}
                        >
                            <RefreshIcon />
                            <span>{t('changeArt')}</span>
                        </ActionButton>
                    )}
                </div>

                {/* Right Aligned: Placeholder Buttons */}
                <div className="justify-self-end flex items-center gap-2">
                    <div className="relative group">
                        <button
                            disabled
                            className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-stone-200 text-stone-400 rounded-full transition-all duration-300 shadow-md cursor-not-allowed"
                        >
                            <UploadIcon />
                            <div className="absolute inset-0 flex items-center justify-center bg-stone-200/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <BanIcon className="h-8 w-8 text-stone-500" />
                            </div>
                        </button>
                        <div role="tooltip" className="absolute bottom-full right-0 mb-2 w-40 text-center px-2 py-1 bg-stone-800 text-white text-xs rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-10">
                            {t('upcomingFeature')}
                        </div>
                    </div>
                    <div className="relative group">
                        <button
                            disabled
                            className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-stone-200 text-stone-400 rounded-full transition-all duration-300 shadow-md cursor-not-allowed"
                        >
                            <AdvancedSearchIcon />
                            <div className="absolute inset-0 flex items-center justify-center bg-stone-200/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <BanIcon className="h-8 w-8 text-stone-500" />
                            </div>
                        </button>
                        <div role="tooltip" className="absolute bottom-full right-0 mb-2 w-48 text-center px-2 py-1 bg-stone-800 text-white text-xs rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-10">
                            {t('advancedSearchTooltip')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Source Selector Modal */}
            {isSourceSelectorOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
                    onClick={() => setIsSourceSelectorOpen(false)}
                >
                    <div 
                        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold text-center mb-6">{t('selectSource')}</h3>
                        <div className="flex flex-col gap-3">
                            {artSources.map(source => (
                                <button
                                    key={source.id}
                                    onClick={() => {
                                        handleSetArtSource(source);
                                        setIsSourceSelectorOpen(false);
                                    }}
                                    disabled={!source.enabled}
                                    className={`w-full text-left p-4 rounded-lg transition-all flex items-center gap-4 focus:outline-none focus:ring-2 focus:ring-slate-500
                                        ${!source.enabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-stone-100 active:scale-[0.98]'}
                                        ${selectedArtSource.id === source.id ? 'bg-slate-100 border border-slate-400' : 'bg-stone-50 border border-stone-200'}
                                    `}
                                >
                                    <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center font-bold text-sm bg-stone-200 text-stone-700 rounded-full">
                                        {source.initials}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-stone-800">{source.name}</p>
                                        {!source.enabled && <p className="text-xs text-stone-500">{t('upcomingFeature')}</p>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArtworkDisplay;