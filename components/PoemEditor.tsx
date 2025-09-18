import React, { useState } from 'react';
import { PencilIcon } from './Icons';

interface PoemEditorProps {
    keywords: string[];
    poemLines: string[];
    onPoemLinesChange: (newLines: string[]) => void;
    onGeneratePoem: () => void;
    isGeneratingPoem: boolean;
    requestCount: number;
    maxRequests: number;
}

const PoemEditor: React.FC<PoemEditorProps> = ({ 
    keywords, 
    poemLines, 
    onPoemLinesChange, 
    onGeneratePoem,
    isGeneratingPoem,
    requestCount,
    maxRequests
}) => {
    // State to track which input line is currently active for adding keywords.
    const [activeLineIndex, setActiveLineIndex] = useState<number>(0);

    // --- Interaction Handlers ---

    // Handles clicking/tapping a keyword. Appends it to the active line.
    const handleKeywordClick = (keyword: string) => {
        const newLines = [...poemLines];
        const currentLine = newLines[activeLineIndex] || '';
        // Append the keyword with a space if the line isn't empty.
        newLines[activeLineIndex] = currentLine ? `${currentLine} ${keyword}` : keyword;
        onPoemLinesChange(newLines);
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
                <h3 className="font-bold text-lg mb-3 text-stone-700">Craft Your Poem's Theme</h3>
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
                        />
                    ))}
                </div>
            </div>

            {/* Section 2: Keyword Cloud */}
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

            {/* Section 3: Action Button */}
            <div className="flex flex-col items-center mt-2">
                 <button
                    onClick={onGeneratePoem}
                    disabled={isGeneratingPoem || requestCount >= maxRequests}
                    className="font-bold py-3 px-6 rounded-full transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 active:scale-100 disabled:cursor-not-allowed disabled:scale-100 bg-slate-500 text-white hover:not(:disabled):bg-slate-600 disabled:bg-stone-300"
                >
                    <PencilIcon />
                    <span>Generate Poem</span>
                </button>
                <p className="text-xs text-red-600 mt-2 h-4">
                    {requestCount >= maxRequests && "You have reached the session limit."}
                </p>
            </div>
        </div>
    );
};

export default PoemEditor;