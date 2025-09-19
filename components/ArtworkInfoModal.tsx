import React from 'react';
import { CloseIcon } from './Icons';
import { useAppContext } from '../AppContext';

const ArtworkInfoModal: React.FC = () => {
    const { artworkInfo: info, setShowArtworkInfo, t } = useAppContext();

    const onClose = () => setShowArtworkInfo(false);

    // Return null if there's no info to display, which can happen briefly on close.
    if (!info) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="artwork-info-title"
        >
            <div 
                className="bg-white border border-stone-200 rounded-lg shadow-2xl p-6 w-full max-w-lg relative text-left"
                onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-stone-500 hover:text-stone-800 transition-colors"
                    aria-label="Close artwork information"
                >
                    <CloseIcon />
                </button>
                
                <h2 id="artwork-info-title" className="text-2xl font-bold font-serif mb-4 pr-8 text-stone-900">{info.title}</h2>
                
                <div className="space-y-4 text-stone-700">
                    <div>
                        <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wider">{t('artist')}</h3>
                        <p>{info.artist || t('unknownArtist')}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wider">{t('medium')}</h3>
                        <p>{info.medium || t('notAvailable')}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wider">{t('creditLine')}</h3>
                        <p className="text-sm text-stone-500">{info.credit || t('notAvailable')}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wider">{t('source')}</h3>
                        <p className="text-sm text-stone-500">{t('sourceProvidedBy', { sourceName: info.source })}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArtworkInfoModal;