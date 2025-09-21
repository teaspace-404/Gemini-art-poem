import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { MenuIcon, ChevronDownIcon, EnvelopeIcon } from './components/icons';
import ArtworkInfoModal from './components/ArtworkInfoModal';
import BookmarkMenu from './components/BookmarkMenu';
import ArtworkDisplay from './components/ArtworkDisplay';
import PoemGenerationPanel from './components/PoemGenerationPanel';
import SupportModal from './components/SupportModal';
import FeedbackModal from './components/FeedbackModal';
import LogsModal from './components/LogsModal';

const App: React.FC = () => {
    const {
        artworkImageUrl,
        showArtworkInfo,
        isArtworkZoomed,
        showLogs,
        showSupportModal,
        showFeedbackModal,
        setIsArtworkZoomed,
        setShowLogs,
        setShowSupportModal,
        setShowFeedbackModal,
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
                 <div className="flex justify-center items-center gap-4">
                    <button
                        onClick={() => setShowLogs(true)}
                        className="text-sm text-stone-500 hover:text-slate-600 transition-colors"
                    >
                        {t('showLogs')}
                    </button>
                    <span className="text-stone-300">|</span>
                    <button
                        onClick={() => setShowSupportModal(true)}
                        className="text-sm text-stone-500 hover:text-slate-600 transition-colors"
                        title={t('buyMeACoffeeTooltip')}
                    >
                        🌱 {t('supportMe')}
                    </button>
                    <span className="text-stone-300">|</span>
                    <button
                        onClick={() => setShowFeedbackModal(true)}
                        className="text-sm text-stone-500 hover:text-slate-600 transition-colors flex items-center gap-1.5"
                        title={t('feedback')}
                    >
                        <EnvelopeIcon className="h-4 w-4" />
                        <span>{t('feedback')}</span>
                    </button>
                </div>
            </div>

            {/* Modal for AI Logs */}
            {showLogs && <LogsModal />}

            {/* Modal for supporting the creator */}
            {showSupportModal && <SupportModal />}

            {/* Modal for feedback */}
            {showFeedbackModal && <FeedbackModal />}
            
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