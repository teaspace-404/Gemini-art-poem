import React from 'react';
import { CloseIcon, EnvelopeIcon } from './icons';
import { useAppContext } from '../AppContext';
import ActionButton from './ActionButton';

const FeedbackModal: React.FC = () => {
    const { setShowFeedbackModal, t } = useAppContext();

    const onClose = () => setShowFeedbackModal(false);

    const handleProceed = () => {
        const email = 'teant.poem.art@gmail.com'; // Your feedback email address
        const subject = t('mailtoSubject');
        const body = t('mailtoBody');
        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        window.location.href = mailtoLink;
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
        >
            <div 
                className="bg-white border border-stone-200 rounded-lg shadow-2xl p-6 w-full max-w-md relative text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-stone-500 hover:text-stone-800 transition-colors"
                    aria-label="Close feedback dialog"
                >
                    <CloseIcon />
                </button>
                
                <div className="mx-auto mb-4 bg-slate-100 h-12 w-12 rounded-full flex items-center justify-center">
                    <EnvelopeIcon />
                </div>

                <h2 id="feedback-modal-title" className="text-xl font-bold mb-3 text-stone-800">{t('feedbackModalTitle')}</h2>
                
                <p className="text-stone-600 mb-8">{t('feedbackModalMessage')}</p>

                <div className="flex flex-col sm:flex-row-reverse gap-3">
                     <ActionButton
                        onClick={handleProceed}
                        className="bg-slate-500 text-white hover:bg-slate-600 w-full"
                    >
                        <span>{t('feedbackModalProceed')}</span>
                    </ActionButton>
                     <ActionButton
                        onClick={onClose}
                        className="bg-stone-200 text-stone-700 hover:bg-stone-300 w-full"
                    >
                        <span>{t('supportModalCancel')}</span>
                    </ActionButton>
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;