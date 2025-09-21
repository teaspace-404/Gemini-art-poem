import React from 'react';
import { CloseIcon, EyeIcon, SparklesButtonIcon } from './icons';
import { useAppContext } from '../AppContext';
import { trackEvent } from './analytics';
import ActionButton from './ActionButton';

const LikedPoemOptionsModal: React.FC = () => {
    const { 
        setShowLikedPoemOptionsModal, 
        selectedLikedPoem,
        handleLoadLikedPoem,
        handleRecreatePoem,
        t 
    } = useAppContext();

    if (!selectedLikedPoem) return null;

    const onClose = () => setShowLikedPoemOptionsModal(false);

    const handleView = () => {
        if (!selectedLikedPoem) return;
        trackEvent('liked_poem_viewed', { poemId: selectedLikedPoem.id });
        handleLoadLikedPoem(selectedLikedPoem);
        onClose();
    };

    const handleRecreate = () => {
        if (!selectedLikedPoem) return;
        // Tracking is done in the controller for this one
        handleRecreatePoem(selectedLikedPoem);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="liked-poem-options-title"
        >
            <div 
                className="bg-white border border-stone-200 rounded-lg shadow-2xl p-6 w-full max-w-md relative text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-stone-500 hover:text-stone-800 transition-colors"
                    aria-label="Close dialog"
                >
                    <CloseIcon />
                </button>
                
                <h2 id="liked-poem-options-title" className="text-xl font-bold mb-3 text-stone-800">{t('likedPoemOptionsTitle')}</h2>
                
                <p className="text-stone-600 mb-8">{t('likedPoemOptionsMessage')}</p>

                <div className="flex flex-col sm:flex-row-reverse gap-3">
                     <ActionButton
                        onClick={handleRecreate}
                        className="bg-slate-500 text-white hover:bg-slate-600 w-full"
                    >
                        <SparklesButtonIcon className="h-5 w-5" />
                        <span>{t('recreatePoem')}</span>
                    </ActionButton>
                    <ActionButton
                        onClick={handleView}
                        className="bg-white text-slate-600 border border-slate-400 hover:bg-slate-50 w-full"
                    >
                        <EyeIcon />
                        <span>{t('viewFinalPoem')}</span>
                    </ActionButton>
                </div>
                <div className="mt-4">
                    <button onClick={onClose} className="text-sm text-stone-500 hover:text-slate-600 transition-colors">
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LikedPoemOptionsModal;