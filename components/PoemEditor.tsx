// FIX: Import useState and useMemo from React.
import React, { useState, useMemo } from 'react';
import { PencilIcon, SparklesButtonIcon, QuestionMarkCircleIcon } from './icons';
import { useAppContext } from '../AppContext';
import KeywordSuggestions from './KeywordSuggestions';
import ThemeEditor from './ThemeEditor'; // Import the new component

const PoemEditor: React.FC = () => {
    const {
        keywords,
        poemLines,
        setPoemLines,
        generatePoem,
        handleFinalizePoemManually: onFinalizePoemManually,
        isGeneratingPoem,
        isPoemGenerationCoolingDown: isCoolingDown,
        requestCount,
        MAX_REQUESTS: maxRequests,
        handleRequestInspirationFromEditor: onGenerateKeywords,
        isGeneratingKeywords,
        isArtlessMode,
        isShareApiAvailable,
        handleShareWIPPoem,
        handleClearAllThemes,
        lastFinalPoem,
        handleFlipToViewLastPoem,
        t
    } = useAppContext();

    const [activeLineIndex, setActiveLineIndex] = useState<number>(0);
    const [isRestrictionMode, setIsRestrictionMode] = useState<boolean>(false);
    
    const validationResult = useMemo(() => {
        const forbiddenKeywords = ['ignore', 'disregard', 'system prompt', 'instructions', 'dan', 'forget', 'override'];
        for (const line of poemLines) {
            const lowerCaseLine = line.toLowerCase();
            for (const keyword of forbiddenKeywords) {
                if (lowerCaseLine.includes(keyword)) {
                    return { isValid: false, message: t('validationError', { keyword }) };
                }
            }
        }
        return { isValid: true, message: null };
    }, [poemLines, t]);

    const isManualFinalizeDisabled = useMemo(() => {
        return poemLines.every(line => line.trim() === '');
    }, [poemLines]);

    const isShareDisabled = useMemo(() => {
        return poemLines.every(line => line.trim() === '');
    }, [poemLines]);

    const handleKeywordClick = (keyword: string) => {
        const newLines = [...poemLines];
        const currentLine = newLines[activeLineIndex] || '';
        const newLine = currentLine ? `${currentLine} ${keyword}` : keyword;

        if (newLine.length <= 100) {
            newLines[activeLineIndex] = newLine;
            setPoemLines(newLines);
        }
    };
    
    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fadeIn">
            
            {/* Section 1: Poem Line Inputs (Now a separate component) */}
            <ThemeEditor
                poemLines={poemLines}
                onPoemLinesChange={setPoemLines}
                activeLineIndex={activeLineIndex}
                onSetActiveLineIndex={setActiveLineIndex}
                lastFinalPoem={lastFinalPoem}
                onFlipToViewLastPoem={handleFlipToViewLastPoem}
                onClearAllThemes={handleClearAllThemes}
                t={t}
            />

            {/* Section 2: On-demand Keyword Generation */}
            {keywords.length === 0 && !isArtlessMode && (
                <div className="text-center border-t border-b border-stone-200 py-4 my-2">
                     <p className="text-sm text-stone-600 mb-3">{t('stuckPrompt')}</p>
                     <button
                        onClick={onGenerateKeywords}
                        disabled={isGeneratingKeywords}
                        className="font-semibold py-2 px-4 rounded-full transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-sm transform hover:scale-105 active:scale-100 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60 bg-white text-slate-600 border border-slate-400 hover:not(:disabled):bg-slate-50"
                     >
                        {isGeneratingKeywords ? (
                            <>
                                <div className="w-4 h-4 border-2 border-stone-200 border-t-slate-500 rounded-full animate-spin"></div>
                                <span>{t('generating')}</span>
                            </>
                        ) : (
                             <>
                                <SparklesButtonIcon className="h-5 w-5" />
                                <span>{t('getAIInspiration')}</span>
                            </>
                        )}
                     </button>
                </div>
            )}

            {/* Section 3: Restriction Mode Toggle */}
            {keywords.length > 0 && !isArtlessMode && (
                <div className="flex items-center gap-3 my-2 p-3 bg-stone-50 border border-stone-200 rounded-md">
                    <label htmlFor="restriction-toggle" className="text-sm font-semibold text-stone-600 cursor-pointer">
                        {t('restrictionMode')}
                    </label>
                    <button
                        id="restriction-toggle"
                        role="switch"
                        aria-checked={isRestrictionMode}
                        onClick={() => setIsRestrictionMode(!isRestrictionMode)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 ${isRestrictionMode ? 'bg-slate-600' : 'bg-stone-300'}`}
                    >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${isRestrictionMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <div className="relative group flex items-center ml-auto">
                        <QuestionMarkCircleIcon className="h-5 w-5 text-stone-400 cursor-help"/>
                        <div
                            role="tooltip"
                            className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-stone-800 text-white text-left text-xs rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-10"
                        >
                            {t('restrictionTooltip')}
                        </div>
                    </div>
                </div>
            )}

            {/* Section 4: Keyword Cloud (delegated to new component) */}
            {keywords.length > 0 && (
                <KeywordSuggestions
                    keywords={keywords}
                    onGenerateKeywords={onGenerateKeywords}
                    isGeneratingKeywords={isGeneratingKeywords}
                    onKeywordClick={handleKeywordClick}
                    isShareApiAvailable={isShareApiAvailable}
                    onShare={handleShareWIPPoem}
                    isShareDisabled={isShareDisabled}
                    t={t}
                />
            )}

            {/* Section 5: Action Buttons */}
            <div className="flex flex-col items-center mt-6 gap-4">
                <button
                    onClick={() => generatePoem(isRestrictionMode)}
                    disabled={isGeneratingPoem || requestCount >= maxRequests || !validationResult.isValid || isCoolingDown}
                    className="font-bold py-3 px-6 rounded-full transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 active:scale-100 disabled:cursor-not-allowed disabled:scale-100 bg-slate-500 text-white hover:not(:disabled):bg-slate-600 disabled:bg-stone-300"
                >
                    <PencilIcon />
                    <span>{isCoolingDown ? t('pleaseWait') : t('createWithGemini')}</span>
                </button>
                <button
                    onClick={onFinalizePoemManually}
                    disabled={isManualFinalizeDisabled}
                    className="font-semibold py-2 px-6 rounded-full transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-sm transform hover:scale-105 active:scale-100 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60 bg-white text-slate-600 border border-slate-400 hover:not(:disabled):bg-slate-50"
                >
                    {t('useMyWords')}
                </button>
                <p className="text-xs text-red-600 mt-0 h-4">
                    {requestCount >= maxRequests 
                        ? t('sessionLimit')
                        : validationResult.message}
                </p>
            </div>
        </div>
    );
};

export default PoemEditor;