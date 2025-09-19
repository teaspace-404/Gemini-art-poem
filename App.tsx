import React from 'react';
import { useAppContext } from './AppContext';
import { SearchIcon, ImageIcon, DownloadIcon, RefreshIcon, SparklesIcon, DocumentTextIcon, InfoIcon, HeartIcon, BookmarkIcon, MenuIcon, PencilIcon, SparklesButtonIcon } from './components/Icons';
import PoemEditor from './components/PoemEditor';
import ArtworkInfoModal from './components/ArtworkInfoModal';
import BookmarkMenu from './components/BookmarkMenu';


// A reusable button component for consistent styling
const ActionButton: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
    title?: string;
}> = ({ onClick, disabled, className = '', children, title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`font-semibold py-2 px-4 rounded-full transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-md transform hover:scale-105 active:scale-100 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60 ${className}`}
    >
        {children}
    </button>
);

// A reusable loading spinner
const LoadingSpinner = () => (
    <div className="w-8 h-8 border-4 border-stone-200 border-t-slate-500 rounded-full animate-spin"></div>
);

const App: React.FC = () => {
    const {
        capturedImage,
        artworkImageUrl,
        editablePoem,
        error,
        artworkInfo,
        showArtworkInfo,
        isArtworkZoomed,
        userWantsToGenerate,
        isKeywordsReady,
        isArtlessMode,
        isFetchingArt,
        isGeneratingPoem,
        loadingMessage,
        isChangeArtworkDisabled,
        keywordGenerationLog,
        poemGenerationLog,
        showLogs,
        isLiked,
        showLikedFeedback,
        isLikeBouncing,
        isCurrentArtworkBookmarked,
        setEditablePoem,
        setShowArtworkInfo,
        setIsArtworkZoomed,
        setShowLogs,
        setIsLikeBouncing,
        handleFetchArt,
        handleInspireMe,
        handleStartWritingDirectly,
        handleChangeArtwork,
        handleToggleBookmark,
        handleExport,
        handleStartArtlessMode,
        handleLike,
        handleWriteAnother,
        handleDownloadLog,
    } = useAppContext();


    // Main render method for the App component
    return (
        <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 text-center">
            <header className="w-full max-w-5xl mx-auto flex justify-between items-center mb-4">
                 <div className="relative group">
                    <button
                        className="flex items-center gap-2 text-stone-600 hover:text-slate-700 transition-colors py-2 px-3 rounded-md hover:bg-stone-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
                        title="Open Collections"
                    >
                        <MenuIcon />
                        <span className="font-semibold hidden sm:inline">Collections</span>
                    </button>
                    {/* The BookmarkMenu no longer needs props */}
                    <BookmarkMenu />
                </div>
            </header>

            <main className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8 md:gap-12 justify-center">
                
                {/* Left Column: Artwork Display and Actions */}
                <div className="md:flex-[0_0_50%] flex flex-col items-center gap-4">
                    <h1 className="text-3xl sm:text-4xl font-sans font-bold text-stone-900">Poem for Art</h1>
                    <p className="text-stone-600 mb-4">Find artistic inspiration, guide the verse.</p>

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
                                            aria-label="Show artwork information"
                                        >
                                            <InfoIcon />
                                        </button>
                                        <button
                                            onClick={handleToggleBookmark}
                                            className="p-2 text-white bg-black/40 rounded-full hover:bg-black/60 transition-all"
                                            aria-label={isCurrentArtworkBookmarked ? "Remove bookmark" : "Bookmark artwork"}
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
                                <p className="mt-2 font-semibold">Artless Mode</p>
                                <p className="mt-1 text-sm">Craft a poem from scratch.</p>
                            </div>
                        )}
                        
                        {!isFetchingArt && !capturedImage && !error && !isArtlessMode && (
                             <div className="text-center text-stone-500">
                                <ImageIcon />
                                <p className="mt-2">Magic might happen here.</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full flex flex-col items-center justify-center gap-3 mt-2">
                         {!capturedImage && !isArtlessMode && (
                             <ActionButton
                                onClick={handleFetchArt}
                                disabled={isFetchingArt}
                                className="bg-slate-500 text-white hover:bg-slate-600 w-52"
                            >
                                <SearchIcon />
                                <span>Fetch me Art</span>
                            </ActionButton>
                        )}
                        {capturedImage && (
                            <ActionButton
                                onClick={handleChangeArtwork}
                                disabled={isFetchingArt || isChangeArtworkDisabled}
                                className="bg-stone-200 text-stone-700 hover:bg-stone-300"
                                title="Find a new piece of art"
                            >
                                <RefreshIcon />
                                <span>Change One</span>
                            </ActionButton>
                        )}
                    </div>
                </div>

                {/* Right Column: Poem Generation and Editing */}
                <div className="md:flex-[0_0_38%] flex flex-col items-center justify-center p-6 bg-white/50 rounded-lg shadow-inner border border-stone-200 min-h-[50vh] md:min-h-0">
                   {/* Initial state: No artwork loaded yet */}
                    {!capturedImage && !isFetchingArt && !error && !isArtlessMode && (
                         <div className="text-center text-stone-500 flex flex-col items-center justify-center h-full">
                            <SparklesIcon />
                            <p className="mt-2 mb-6">Inspiration awaits</p>
                            <ActionButton
                                onClick={handleStartArtlessMode}
                                className="bg-white text-slate-600 border border-slate-400 hover:bg-slate-50 w-52"
                            >
                                <PencilIcon />
                                <span>Write From Scratch</span>
                            </ActionButton>
                        </div>
                    )}

                    {/* Main generation flow, shown only when an image is present or in artless mode */}
                    { (capturedImage || isArtlessMode) && (
                         // The final poem view has the highest priority and is shown once 'editablePoem' has content.
                        !isGeneratingPoem && editablePoem ? (
                            <div className="w-full text-left animate-fadeIn">
                                <h3 className="font-bold text-lg mb-3 text-stone-700">Your Final Poem</h3>
                                <textarea
                                    value={editablePoem}
                                    onChange={(e) => setEditablePoem(e.target.value)}
                                    rows={4}
                                    className="w-full p-3 bg-stone-50 border border-stone-300 rounded-md font-serif text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
                                    aria-label="Final editable poem"
                                />
                                <div className="w-full flex flex-col items-center gap-4 mt-6 relative">
                                     {showLikedFeedback && (
                                        <span className="absolute -top-10 bg-black/70 text-white text-sm px-3 py-1 rounded-full animate-fadeIn">
                                            Liked this!
                                        </span>
                                    )}
                                    <ActionButton
                                        onClick={handleExport}
                                        disabled={!editablePoem}
                                        className="bg-slate-500 text-white hover:bg-slate-600 w-52"
                                        title="Export as PNG"
                                    >
                                        <DownloadIcon />
                                        <span>Export Poemgram</span>
                                    </ActionButton>
                                    <div className="flex items-center justify-center gap-4 mt-2">
                                        <button
                                            onClick={handleLike}
                                            onAnimationEnd={() => setIsLikeBouncing(false)}
                                            className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-100 shadow-md ${isLiked ? 'text-red-500 bg-red-100' : 'text-stone-600 bg-stone-200'} ${isLikeBouncing ? 'animate-bounceLike' : ''}`}
                                            title={isLiked ? "Unlike" : "Like"}
                                            aria-pressed={isLiked}
                                        >
                                            <HeartIcon filled={isLiked} />
                                        </button>
                                        <button
                                            onClick={handleWriteAnother}
                                            className="p-3 bg-stone-200 text-stone-700 hover:bg-stone-300 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-100 shadow-md"
                                            title="Generate a new poem"
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
                                <p className="mt-4">The muse is working...</p>
                            </div>
                        // If user hasn't clicked "Inspire Me" or "Write from Scratch" yet, show the choice.
                        ) : !userWantsToGenerate ? (
                            <div className="text-center animate-fadeIn flex flex-col items-center gap-4">
                                <ActionButton
                                    onClick={handleInspireMe}
                                    className="bg-slate-500 text-white hover:bg-slate-600 text-lg w-60"
                                >
                                    <SparklesButtonIcon />
                                    <span>Inspire Me</span>
                                </ActionButton>
                                 <ActionButton
                                    onClick={handleStartWritingDirectly}
                                    className="bg-white text-slate-600 border border-slate-400 hover:bg-slate-50 w-60"
                                >
                                    <PencilIcon />
                                    <span>Write From Scratch</span>
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
            </main>

             {/* Transparency and Logging Section */}
            <div className="w-full max-w-5xl mx-auto mt-8">
                <button onClick={() => setShowLogs(!showLogs)} className="text-sm text-stone-500 hover:text-slate-600">
                    {showLogs ? 'Hide AI Logs' : 'Show AI Logs'}
                </button>
                    {showLogs && (
                    <div className="mt-4 p-4 bg-stone-50 border border-stone-200 rounded-lg text-left text-xs text-stone-700 animate-fadeIn space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold">AI Interaction Log</h4>
                                <p className="text-stone-500">This log shows the prompts sent to and responses received from the AI.</p>
                            </div>
                                <button onClick={handleDownloadLog} title="Download Log" className="p-2 rounded-md hover:bg-stone-200 transition-colors">
                                <DocumentTextIcon />
                            </button>
                        </div>
                        
                        {!keywordGenerationLog && !poemGenerationLog && (
                            <p className="text-stone-500 italic p-2">AI interactions will be logged here once an artwork is fetched or a poem is written.</p>
                        )}
                        {keywordGenerationLog && (
                            <div>
                                <p className="font-semibold text-slate-700">Keyword Generation</p>
                                <p className="mt-1 p-2 bg-stone-200 rounded"><strong>Prompt:</strong> {keywordGenerationLog.prompt}</p>
                                <p className="mt-1 p-2 bg-stone-200 rounded"><strong>Response:</strong> {keywordGenerationLog.response}</p>
                            </div>
                        )}
                        {poemGenerationLog && (
                            <div>
                                <p className="font-semibold text-slate-700">Poem Generation</p>
                                <p className="mt-1 p-2 bg-stone-200 rounded"><strong>Prompt:</strong> {poemGenerationLog.prompt}</p>
                                <p className="mt-1 p-2 bg-stone-200 rounded"><strong>Response:</strong> {poemGenerationLog.response}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
             {/* Modal for displaying artwork information */}
            {showArtworkInfo && artworkInfo && (
                <ArtworkInfoModal info={artworkInfo} onClose={() => setShowArtworkInfo(false)} />
            )}

            {/* Modal for the full-screen, zoomable artwork view. */}
            {isArtworkZoomed && artworkImageUrl && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
                    onClick={() => setIsArtworkZoomed(false)}
                >
                    <img
                        src={artworkImageUrl}
                        alt="Artwork, zoomed in"
                        onClick={(e) => e.stopPropagation()} 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                </div>
            )}
        </div>
    );
};

export default App;
