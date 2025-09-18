import React, { DragEvent } from 'react';
import { PencilIcon } from './Icons';

interface PoemEditorProps {
    keywords: string[];
    poemLines: string[];
    onPoemLinesChange: (newLines: string[]) => void;
    onGeneratePoem: () => void;
    isGeneratingPoem: boolean;
}

const PoemEditor: React.FC<PoemEditorProps> = ({ 
    keywords, 
    poemLines, 
    onPoemLinesChange, 
    onGeneratePoem,
    isGeneratingPoem
}) => {

    // --- Drag and Drop Handlers ---

    // Set the data to be transferred when a keyword drag starts
    const handleDragStart = (e: DragEvent<HTMLDivElement>, keyword: string) => {
        e.dataTransfer.setData("text/plain", keyword);
    };

    // Prevent default behavior to allow dropping
    const handleDragOver = (e: DragEvent<HTMLInputElement>) => {
        e.preventDefault();
    };

    // Handle the drop event on an input field
    const handleDrop = (e: DragEvent<HTMLInputElement>, lineIndex: number) => {
        e.preventDefault();
        const keyword = e.dataTransfer.getData("text/plain");
        const newLines = [...poemLines];
        // Append the dropped keyword to the existing line content
        newLines[lineIndex] = newLines[lineIndex] ? `${newLines[lineIndex]} ${keyword}` : keyword;
        onPoemLinesChange(newLines);
    };
    
    // --- Input Change Handler ---

    // Update state when the user types directly into an input field
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, lineIndex: number) => {
        const newLines = [...poemLines];
        newLines[lineIndex] = e.target.value;
        onPoemLinesChange(newLines);
    };

    return (
        <div className="w-full flex flex-col gap-6 text-left animate-fadeIn">
            {/* Section 1: Keyword Cloud */}
            <div>
                <h3 className="font-bold text-lg mb-3 text-gray-300">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, index) => (
                        <div
                            key={index}
                            draggable
                            onDragStart={(e) => handleDragStart(e, keyword)}
                            className="bg-gray-700 text-gray-200 py-1 px-3 rounded-full text-sm cursor-grab hover:bg-gray-600 active:cursor-grabbing transition-colors"
                            title="Drag me to a line below"
                        >
                            {keyword}
                        </div>
                    ))}
                </div>
            </div>

            {/* Section 2: Poem Line Inputs */}
            <div>
                <h3 className="font-bold text-lg mb-3 text-gray-300">Craft Your Poem's Theme</h3>
                <div className="flex flex-col gap-3">
                    {poemLines.map((line, index) => (
                        <input
                            key={index}
                            type="text"
                            value={line}
                            onChange={(e) => handleInputChange(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            placeholder={`Line ${index + 1}: Drag keywords or type here...`}
                            className="w-full bg-gray-900 border-2 border-dashed border-gray-600 rounded-md p-3 transition-all text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                    ))}
                </div>
            </div>

            {/* Section 3: Action Button */}
            <div className="flex justify-center mt-2">
                 <button
                    onClick={onGeneratePoem}
                    disabled={isGeneratingPoem}
                    className="font-bold py-3 px-6 rounded-full transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 active:scale-100 disabled:cursor-not-allowed disabled:scale-100 bg-green-600 text-white hover:not(:disabled):bg-green-700 disabled:bg-gray-600"
                >
                    <PencilIcon />
                    <span>Generate Poem</span>
                </button>
            </div>
        </div>
    );
};

export default PoemEditor;