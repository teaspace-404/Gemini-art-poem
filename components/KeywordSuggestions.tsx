import React from 'react';
import { RefreshIcon, ShareIcon } from './icons';

interface KeywordSuggestionsProps {
    keywords: string[];
    onGenerateKeywords: () => void;
    isGeneratingKeywords: boolean;
    onKeywordClick: (keyword: string) => void;
    isShareApiAvailable: boolean;
    onShare: () => void;
    isShareDisabled: boolean;
    t: (key: any) => string;
}

const KeywordSuggestions: React.FC<KeywordSuggestionsProps> = ({
    keywords,
    onGenerateKeywords,
    isGeneratingKeywords,
    onKeywordClick,
    isShareApiAvailable,
    onShare,
    isShareDisabled,
    t,
}) => {
    return (
        <div className="border-t border-stone-200 pt-4 mt-4">
            <h3 className="font-bold text-lg mb-3 text-stone-700">{t('tapKeyword')}</h3>
            <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                    <button
                        key={index}
                        onClick={() => onKeywordClick(keyword)}
                        className="bg-stone-200 text-stone-700 py-1 px-3 rounded-full text-sm cursor-pointer hover:bg-slate-500 hover:text-white active:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
                        title="Tap to add to the active line above"
                    >
                        {keyword}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-3 mt-4">
                 <button
                    onClick={onGenerateKeywords}
                    disabled={isGeneratingKeywords}
                    className="font-semibold py-1.5 px-3 rounded-full transition-all duration-300 inline-flex items-center justify-center gap-2 text-xs transform hover:scale-105 active:scale-100 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60 bg-white text-slate-600 border border-slate-300 hover:not(:disabled):bg-slate-50"
                >
                    <RefreshIcon />
                    <span>{t('regenerateInspiration')}</span>
                </button>
                {isShareApiAvailable && (
                    <button
                        onClick={onShare}
                        disabled={isShareDisabled}
                        className="font-semibold py-1.5 px-3 rounded-full transition-all duration-300 inline-flex items-center justify-center gap-2 text-xs transform hover:scale-105 active:scale-100 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60 bg-sky-500 text-white hover:not(:disabled):bg-sky-600"
                    >
                        <ShareIcon />
                        <span>{t('share')}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default KeywordSuggestions;
