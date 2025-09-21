import React, { useState } from 'react';
import { CloseIcon, DocumentTextIcon, CopyIcon } from './icons';
import { useAppContext } from '../AppContext';
import ActionButton from './ActionButton';

const LogsModal: React.FC = () => {
    const { 
        setShowLogs,
        activityLog,
        handleCopyLog,
        t 
    } = useAppContext();

    const [isCopied, setIsCopied] = useState(false);

    const onClose = () => setShowLogs(false);

    const onCopy = async () => {
        const success = await handleCopyLog();
        if (success) {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const hasLogs = activityLog && activityLog.length > 1; // Ignore the initial "Session started" message

    return (
        <div 
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logs-modal-title"
        >
            <div 
                className="bg-white border border-stone-200 rounded-lg shadow-2xl p-6 w-full max-w-2xl relative text-left flex flex-col max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-stone-500 hover:text-stone-800 transition-colors"
                    aria-label="Close logs dialog"
                >
                    <CloseIcon />
                </button>
                
                <div className="flex-shrink-0 flex items-center mb-4">
                    <div className="mx-auto sm:mx-0 mb-4 sm:mb-0 sm:mr-4 bg-slate-100 h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0">
                        <DocumentTextIcon />
                    </div>
                    <div>
                        <h2 id="logs-modal-title" className="text-xl font-bold text-stone-800">{t('logTitle')}</h2>
                        <p className="text-sm text-stone-600">{t('logDescription')}</p>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-3 text-xs text-stone-700 bg-stone-50 border border-stone-200 rounded-lg p-4 font-mono">
                    {!hasLogs ? (
                        <p className="text-stone-500 italic p-2">{t('logEmpty')}</p>
                    ) : (
                         [...activityLog].reverse().map((entry, index) => (
                            <div key={index}>
                                {entry.type === 'ai_interaction' && entry.data ? (
                                    <div className="p-2 bg-stone-100 rounded">
                                        <p className="font-semibold text-slate-700 mb-1">{entry.message}</p>
                                        <p className="mt-1 p-2 bg-stone-200 rounded whitespace-pre-wrap"><strong>{t('prompt')}</strong> {entry.data.prompt}</p>
                                        <p className="mt-1 p-2 bg-stone-200 rounded whitespace-pre-wrap"><strong>{t('response')}</strong> {entry.data.response}</p>
                                    </div>
                                ) : (
                                    <div className={`flex gap-2 ${entry.type === 'system_event' ? 'text-stone-500 italic' : ''}`}>
                                        <span className="text-stone-400 flex-shrink-0">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                        <p>{entry.message}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="flex-shrink-0 mt-6 flex flex-col sm:flex-row-reverse gap-3">
                    <ActionButton
                        onClick={onCopy}
                        disabled={!hasLogs || isCopied}
                        className="bg-slate-500 text-white hover:bg-slate-600 w-full"
                    >
                        <CopyIcon />
                        <span>{isCopied ? t('logsCopied') : t('copyLogs')}</span>
                    </ActionButton>
                    <ActionButton
                        onClick={onClose}
                        className="bg-stone-200 text-stone-700 hover:bg-stone-300 w-full"
                    >
                        <span>{t('close')}</span>
                    </ActionButton>
                </div>
            </div>
        </div>
    );
};

export default LogsModal;