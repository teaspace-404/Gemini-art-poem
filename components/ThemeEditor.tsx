import React, { useState, useRef, useEffect } from 'react';
import { FlipIcon, PlusCircleIcon, MinusCircleIcon } from './icons';

interface ThemeEditorProps {
    poemLines: string[];
    onPoemLinesChange: (lines: string[]) => void;
    activeLineIndex: number;
    onSetActiveLineIndex: (index: number) => void;
    lastFinalPoem: string | null;
    onFlipToViewLastPoem: () => void;
    onClearAllThemes: () => void;
    t: (key: any, replacements?: any) => string;
}

const MAX_LINES = 15;

const ThemeEditor: React.FC<ThemeEditorProps> = ({
    poemLines,
    onPoemLinesChange,
    activeLineIndex,
    onSetActiveLineIndex,
    lastFinalPoem,
    onFlipToViewLastPoem,
    onClearAllThemes,
    t
}) => {
    const [isConfirmingClear, setIsConfirmingClear] = useState<boolean>(false);
    const confirmClearRef = useRef<HTMLDivElement>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!isConfirmingClear) return;

        const handleClickOutside = (event: MouseEvent) => {
            const isClickOnInput = inputRefs.current.some(ref => ref && ref.contains(event.target as Node));

            if ((confirmClearRef.current && !confirmClearRef.current.contains(event.target as Node)) || isClickOnInput) {
                setIsConfirmingClear(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isConfirmingClear]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, lineIndex: number) => {
        const newLines = [...poemLines];
        newLines[lineIndex] = e.target.value;
        onPoemLinesChange(newLines);
        if (isConfirmingClear) setIsConfirmingClear(false);
    };

    const handleConfirmClear = () => {
        onClearAllThemes();
        setIsConfirmingClear(false);
    };

    const handleAddLine = () => {
        if (poemLines.length < MAX_LINES) {
            onPoemLinesChange([...poemLines, '']);
        }
    };

    const handleRemoveLine = (indexToRemove: number) => {
        if (poemLines.length > 3) {
            const newLines = poemLines.filter((_, index) => index !== indexToRemove);
            onPoemLinesChange(newLines);
            if (activeLineIndex >= newLines.length) {
                onSetActiveLineIndex(newLines.length - 1);
            }
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-stone-700">{t('craftTheme')}</h3>
                {lastFinalPoem && (
                     <button
                        onClick={onFlipToViewLastPoem}
                        className="text-stone-500 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-stone-200"
                        title={t('viewLastPoem')}
                    >
                        <FlipIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
            <div className="flex flex-col gap-3">
                {poemLines.map((line, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span className="italic text-stone-500 font-mono select-none w-6 text-right pr-1">{index + 1}.</span>
                        <input
                            ref={el => { inputRefs.current[index] = el; }}
                            type="text"
                            value={line}
                            onChange={(e) => handleInputChange(e, index)}
                            onFocus={() => onSetActiveLineIndex(index)}
                            placeholder={activeLineIndex === index ? t('craftPlaceholder') : t('activateLinePlaceholder', { lineNumber: index + 1 })}
                            className={`flex-grow w-full bg-white border-2 border-dashed rounded-md p-3 transition-all text-stone-800 focus:outline-none ${
                                activeLineIndex === index
                                    ? 'border-amber-500 ring-1 ring-amber-500 placeholder:font-bold placeholder:text-amber-600'
                                    : 'border-stone-300 placeholder:text-stone-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                            }`}
                            maxLength={100}
                        />
                         <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center">
                            {index > 2 && poemLines.length > 3 && (
                                <button
                                    onClick={() => handleRemoveLine(index)}
                                    className="text-stone-400 hover:text-red-500 transition-colors"
                                    title={`Remove line ${index + 1}`}
                                    aria-label={`Remove line ${index + 1}`}
                                >
                                    <MinusCircleIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center mt-3">
                <button
                    onClick={handleAddLine}
                    disabled={poemLines.length >= MAX_LINES}
                    className="text-stone-400 hover:text-slate-600 disabled:text-stone-300 disabled:cursor-not-allowed transition-colors"
                    title={poemLines.length >= MAX_LINES ? "Maximum lines reached" : "Add a new line"}
                    aria-label={poemLines.length >= MAX_LINES ? "Maximum lines reached" : "Add a new line"}
                >
                    <PlusCircleIcon className="h-6 w-6" />
                </button>
            </div>

            <div className="flex justify-between items-center h-4 mt-1">
                <div className="pl-1">
                    {!isConfirmingClear ? (
                        <button
                            onClick={() => setIsConfirmingClear(true)}
                            className="text-xs font-semibold text-stone-500 hover:text-red-600 transition-colors"
                        >
                            {t('clearAllThemes')}
                        </button>
                    ) : (
                        <div ref={confirmClearRef} className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                            <span>{t('clearAllThemes')}?</span>
                            <button
                                onClick={handleConfirmClear}
                                className="font-bold text-stone-500 hover:text-stone-700 transition-colors"
                                aria-label="Confirm clear all themes"
                            >
                                ✔
                            </button>
                            <span className="text-stone-400">/</span>
                            <button
                                onClick={() => setIsConfirmingClear(false)}
                                className="font-bold text-stone-500 hover:text-stone-700 transition-colors"
                                aria-label="Cancel clear all themes"
                            >
                                ✘
                            </button>
                        </div>
                    )}
                </div>
                <div className="text-right text-xs text-stone-500 pr-1">
                    {`${poemLines[activeLineIndex]?.length || 0} / 100`}
                </div>
            </div>
        </div>
    );
};

export default ThemeEditor;