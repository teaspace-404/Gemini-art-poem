import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { DocumentTextIcon, MenuIcon, ChevronDownIcon } from './components/Icons';
import ArtworkInfoModal from './components/ArtworkInfoModal';
import BookmarkMenu from './components/BookmarkMenu';
import ArtworkDisplay from './components/ArtworkDisplay';
import PoemGenerationPanel from './components/PoemGenerationPanel';

const App: React.FC = () => {
    const {
        artworkImageUrl,
        showArtworkInfo,
        isArtworkZoomed,
        keywordGenerationLog,
        poemGenerationLog,
        showLogs,
        setIsArtworkZoomed,
        setShowLogs,
        handleDownloadLog,
        handleSetLanguage,
        supportedLanguages,
        t,
        language
    } = useAppContext();

    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    const langDropdownRef = useRef<HTMLDivElement>(null);

    // Effect to close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
                setIsLangDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 text-center">
            <header className="w-full max-w-5xl mx-auto flex justify-between items-center mb-4">
                 <div className="relative group">
                    <button
                        className="flex items-center gap-2 text-stone-600 hover:text-slate-700 transition-colors py-2 px-3 rounded-md hover:bg-stone-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
                        title={t('collections')}
                        aria-label={t('collections')}
                        id="collections-button"
                    >
                        <MenuIcon />
                        <span className="font-semibold hidden sm:inline">{t('collections')}</span>
                    </button>
                    <BookmarkMenu />
                </div>
                <div className="relative" ref={langDropdownRef}>
                    <button
                        onClick={() => setIsLangDropdownOpen(prev => !prev)}
                        className="font-semibold text-stone-600 hover:text-slate-700 transition-colors py-2 px-4 rounded-md hover:bg-stone-200 focus:outline-none focus:ring-2 focus:ring-slate-500 flex items-center gap-2"
                        title="Switch Language"
                        aria-haspopup="true"
                        aria-expanded={isLangDropdownOpen}
                    >
                        <span>{supportedLanguages.find(l => l.code === language)?.name}</span>
                        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isLangDropdownOpen && (
                        <div
                            className="absolute top-full right-0 mt-2 w-32 bg-white border border-stone-200 rounded-md shadow-lg z-50 animate-fadeIn"
                            role="menu"
                            aria-orientation="vertical"
                        >
                            <div className="p-1">
                                {supportedLanguages.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            handleSetLanguage(lang.code);
                                            setIsLangDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${language === lang.code ? 'bg-slate-100 text-slate-800 font-semibold' : 'text-stone-700 hover:bg-stone-100'}`}
                                        role="menuitem"
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8 md:gap-12 justify-center">
                <ArtworkDisplay />
                <PoemGenerationPanel />
            </main>

             {/* Transparency and Logging Section */}
            <div className="w-full max-w-5xl mx-auto mt-8">
                <button onClick={() => setShowLogs(!showLogs)} className="text-sm text-stone-500 hover:text-slate-600">
                    {showLogs ? t('hideLogs') : t('showLogs')}
                </button>
                    {showLogs && (
                    <div className="mt-4 p-4 bg-stone-50 border border-stone-200 rounded-lg text-left text-xs text-stone-700 animate-fadeIn space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold">{t('logTitle')}</h4>
                                <p className="text-stone-500">{t('logDescription')}</p>
                            </div>
                                <button onClick={handleDownloadLog} title={t('downloadLogTitle')} className="p-2 rounded-md hover:bg-stone-200 transition-colors">
                                <DocumentTextIcon />
                            </button>
                        </div>
                        
                        {!keywordGenerationLog && !poemGenerationLog && (
                            <p className="text-stone-500 italic p-2">{t('logEmpty')}</p>
                        )}
                        {keywordGenerationLog && (
                            <div>
                                <p className="font-semibold text-slate-700">{t('keywordGeneration')}</p>
                                <p className="mt-1 p-2 bg-stone-200 rounded"><strong>{t('prompt')}</strong> {keywordGenerationLog.prompt}</p>
                                <p className="mt-1 p-2 bg-stone-200 rounded"><strong>{t('response')}</strong> {keywordGenerationLog.response}</p>
                            </div>
                        )}
                        {poemGenerationLog && (
                            <div>
                                <p className="font-semibold text-slate-700">{t('poemGeneration')}</p>
                                <p className="mt-1 p-2 bg-stone-200 rounded"><strong>{t('prompt')}</strong> {poemGenerationLog.prompt}</p>
                                <p className="mt-1 p-2 bg-stone-200 rounded"><strong>{t('response')}</strong> {poemGenerationLog.response}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
             {/* Modal for displaying artwork information */}
            {showArtworkInfo && <ArtworkInfoModal />}

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
