import React, { useState, useRef, useEffect } from 'react';
import { FlipIcon } from './icons';

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

    return (
        <div>
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
                    <input
                        key={index}
                        // FIX: Ensure the ref callback has a void return type to match the expected signature.
                        ref={el => { inputRefs.current[index] = el; }}
                        type="text"
                        value={line}
                        onChange={(e) => handleInputChange(e, index)}
                        onFocus={() => onSetActiveLineIndex(index)}
                        placeholder={activeLineIndex === index ? t('craftPlaceholder') : t('activateLinePlaceholder', { lineNumber: index + 1 })}
                        className={`w-full bg-white border-2 border-dashed border-stone-300 rounded-md p-3 transition-all text-stone-800 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 ${activeLineIndex === index ? 'border-slate-500' : ''}`}
                        maxLength={100}
                    />
                ))}
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
                        <div ref={confirmClearRef} className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 animate-fadeIn">
                            <span>{t('clearAllThemes')}?</span>
                            <button
                                onClick={handleConfirmClear}
                                className="font-bold text-violet-600 hover:text-violet-700 transition-colors"
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