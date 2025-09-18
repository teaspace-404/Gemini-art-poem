import React from 'react';
import { CloseIcon } from './Icons';

interface ArtworkInfo {
    title: string;
    artist: string;
    medium: string;
    credit: string;
    source: string;
}

interface ArtworkInfoModalProps {
    info: ArtworkInfo;
    onClose: () => void;
}

const ArtworkInfoModal: React.FC<ArtworkInfoModalProps> = ({ info, onClose }) => {
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
                        <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wider">Artist</h3>
                        <p>{info.artist || 'Unknown Artist'}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wider">Medium</h3>
                        <p>{info.medium || 'N/A'}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wider">Credit Line</h3>
                        <p className="text-sm text-stone-500">{info.credit || 'N/A'}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wider">Source</h3>
                        <p className="text-sm text-stone-500">Artwork data provided by the {info.source}.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArtworkInfoModal;