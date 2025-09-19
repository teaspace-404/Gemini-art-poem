import React, { useState, useMemo } from 'react';
import { PencilIcon, SparklesButtonIcon, QuestionMarkCircleIcon } from './Icons';
import { useAppContext } from '../AppContext';

const PoemEditor: React.FC = () => {
    const {
        keywords,
        poemLines,
        setPoemLines: onPoemLinesChange, // Rename to keep handler logic the same
        generatePoem,
        handleFinalizePoemManually: onFinalizePoemManually,
        isGeneratingPoem,
        isPoemGenerationCoolingDown: isCoolingDown,
        requestCount,
        MAX_REQUESTS: maxRequests,
        handleRequestInspirationFromEditor: onGenerateKeywords,
        isGeneratingKeywords,
        isArtlessMode
    } = useAppContext();

    // State to track which input line is currently active for adding keywords.
    const [activeLineIndex, setActiveLineIndex] = useState<number>(0);
    const [isRestrictionMode, setIsRestrictionMode] = useState<boolean>(false);
    
    // --- Client-Side Validation ---

    // Memoize the validation result to avoid re-calculating on every render.
    const validationResult = useMemo(() => {
        const forbiddenKeywords = ['ignore', 'disregard', 'system prompt', 'instructions', 'dan', 'forget', 'override'];
        for (const line of poemLines) {
            const lowerCaseLine = line.toLowerCase();
            for (const keyword of forbiddenKeywords) {
                if (lowerCaseLine.includes(keyword)) {
                    return { isValid: false, message: `Please avoid using instructional words like "${keyword}".` };
                }
            }
        }
        return { isValid: true, message: null };
    }, [poemLines]);

    const isManualFinalizeDisabled = useMemo(() => {
        return poemLines.every(line => line.trim() === '');
    }, [poemLines]);


    // --- Interaction Handlers ---

    // Handles clicking/tapping a keyword. Appends it to the active line.
    const handleKeywordClick = (keyword: string) => {
        const newLines = [...poemLines];
        const currentLine = newLines[activeLineIndex] || '';
        const newLine = currentLine ? `${currentLine} ${keyword}` : keyword;

        // Only update if the new line doesn't exceed the character limit
        if (newLine.length <= 100) {
            newLines[activeLineIndex] = newLine;
            onPoemLinesChange(newLines);
        }
    };
    
    // Update state when the user types directly into an input field
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, lineIndex: number) => {
        const newLines = [...poemLines];
        newLines[lineIndex] = e.target.value;
        onPoemLinesChange(newLines);
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fadeIn">
            
            {/* Section 1: Poem Line Inputs */}
            <div>
                <h3 className="font-bold text-lg mb-2 text-stone-700">Craft Your Poem's Theme</h3>
                <div className="flex flex-col gap-3">
                    {poemLines.map((line, index) => (
                        <input
                            key={index}
                            type="text"
                            value={line}
                            onChange={(e) => handleInputChange(e, index)}
                            onFocus={() => setActiveLineIndex(index)} // Set this line as active on focus
                            placeholder={activeLineIndex === index ? 'Craft your ideas here...' : `Tap here to make Line ${index + 1} active...`}
                            className={`w-full bg-white border-2 border-dashed border-stone-300 rounded-md p-3 transition-all text-stone-800 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 ${activeLineIndex === index ? 'border-slate-500' : ''}`}
                            maxLength={100}
                        />
                    ))}
                </div>
                 <div className="text-right text-xs text-stone-500 h-4 pr-1 mt-1">
                    {/* Show character count only for the active line */}
                    {`${poemLines[activeLineIndex]?.length || 0} / 100`}
                </div>
            </div>

             {/* Section 2: On-demand Keyword Generation */}
            {keywords.length === 0 && !isArtlessMode && (
                <div className="text-center border-t border-b border-stone-200 py-4 my-2">
                     <p className="text-sm text-stone-600 mb-3">Feeling stuck? Let AI suggest some ideas.</p>
                     <button
                        onClick={onGenerateKeywords}
                        disabled={isGeneratingKeywords}
                        className="font-semibold py-2 px-4 rounded-full transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-sm transform hover:scale-105 active:scale-100 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60 bg-white text-slate-600 border border-slate-400 hover:not(:disabled):bg-slate-50"
                     >
                        {isGeneratingKeywords ? (
                            <>
                                <div className="w-4 h-4 border-2 border-stone-200 border-t-slate-500 rounded-full animate-spin"></div>
                                <span>Generating...</span>
                            </>
                        ) : (
                             <>
                                <SparklesButtonIcon className="h-5 w-5" />
                                <span>Get AI Inspiration</span>
                            </>
                        )}
                     </button>
                </div>
            )}

            {/* Section 3: Restriction Mode Toggle */}
            {keywords.length > 0 && !isArtlessMode && (
                <div className="flex items-center gap-3 my-2 p-3 bg-stone-50 border border-stone-200 rounded-md">
                    <label htmlFor="restriction-toggle" className="text-sm font-semibold text-stone-600 cursor-pointer">
                        Restriction Mode
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
                            When enabled, Gemini is instructed to build the poem strictly around your themes, rather than using them as loose inspiration.
                        </div>
                    </div>
                </div>
            )}

            {/* Section 4: Keyword Cloud (only shown if keywords exist) */}
            {keywords.length > 0 && (
                <div>
                    <h3 className="font-bold text-lg mb-3 text-stone-700">Tap a word to add it to your active line</h3>
                    <div className="flex flex-wrap gap-2">
                        {keywords.map((keyword, index) => (
                            <button
                                key={index}
                                onClick={() => handleKeywordClick(keyword)}
                                className="bg-stone-200 text-stone-700 py-1 px-3 rounded-full text-sm cursor-pointer hover:bg-slate-500 hover:text-white active:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
                                title="Tap to add to the active line above"
                            >
                                {keyword}
                            </button>
                        ))}
                    </div>
                </div>
            )}


            {/* Section 5: Action Buttons */}
            <div className="flex flex-col items-center mt-6 gap-4">
                <button
                    onClick={() => generatePoem(isRestrictionMode)}
                    disabled={isGeneratingPoem || requestCount >= maxRequests || !validationResult.isValid || isCoolingDown}
                    className="font-bold py-3 px-6 rounded-full transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 active:scale-100 disabled:cursor-not-allowed disabled:scale-100 bg-slate-500 text-white hover:not(:disabled):bg-slate-600 disabled:bg-stone-300"
                >
                    <PencilIcon />
                    <span>{isCoolingDown ? 'Please wait...' : 'Create with Gemini'}</span>
                </button>
                <button
                    onClick={onFinalizePoemManually}
                    disabled={isManualFinalizeDisabled}
                    className="font-semibold py-2 px-6 rounded-full transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-sm transform hover:scale-105 active:scale-100 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60 bg-white text-slate-600 border border-slate-400 hover:not(:disabled):bg-slate-50"
                >
                    Use My Own Words
                </button>
                <p className="text-xs text-red-600 mt-0 h-4">
                    {requestCount >= maxRequests 
                        ? "You have reached the session limit." 
                        : validationResult.message}
                </p>
            </div>
        </div>
    );
};

export default PoemEditor;