import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MuseumIcon, DownloadIcon, RefreshIcon, SparklesIcon, DocumentTextIcon, InfoIcon } from './components/Icons';
import PoemEditor from './components/PoemEditor';
import ArtworkInfoModal from './components/ArtworkInfoModal';

// Interface for logging AI interactions
interface LogEntry {
    prompt: string;
    response: string;
}

// Interface for artwork metadata
interface ArtworkInfo {
    title: string;
    artist: string;
    medium: string;
    credit: string;
}

const App: React.FC = () => {
    // Core state
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [poem, setPoem] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [artworkInfo, setArtworkInfo] = useState<ArtworkInfo | null>(null);
    const [showArtworkInfo, setShowArtworkInfo] = useState<boolean>(false);


    // State for the new interactive flow
    const [keywords, setKeywords] =useState<string[]>([]);
    const [poemLines, setPoemLines] = useState<string[]>(['', '', '']);

    // Loading states
    const [isFetchingArt, setIsFetchingArt] = useState<boolean>(false);
    const [isGeneratingKeywords, setIsGeneratingKeywords] = useState<boolean>(false);
    const [isGeneratingPoem, setIsGeneratingPoem] = useState<boolean>(false);

    // State for AI transparency
    const [keywordGenerationLog, setKeywordGenerationLog] = useState<LogEntry | null>(null);
    const [poemGenerationLog, setPoemGenerationLog] = useState<LogEntry | null>(null);
    const [showLogs, setShowLogs] = useState<boolean>(false);


    // Step 1: Generate keywords from the captured image
    const generateKeywords = useCallback(async (imageDataUrl: string) => {
        setIsGeneratingKeywords(true);
        setError(null);
        setKeywords([]);

        if (!process.env.API_KEY) {
            setError("Gemini API key is not configured.");
            setIsGeneratingKeywords(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const base64Data = imageDataUrl.split(',')[1];
            
            const imagePart = {
                inlineData: { mimeType: 'image/jpeg', data: base64Data },
            };
            const textPart = {
                text: "Based on this image of a piece of art, generate a list of 5-7 evocative keywords or very short phrases (1-3 words) that could inspire a poem. Separate them with commas."
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
            });
            
            const keywordString = response.text.trim();
            setKeywordGenerationLog({ prompt: textPart.text, response: keywordString });
            setKeywords(keywordString.split(',').map(k => k.trim()).filter(Boolean));

        } catch (err) {
            console.error(err);
            setError("Failed to generate keywords. Please try again.");
        } finally {
            setIsGeneratingKeywords(false);
        }
    }, []);

    // Step 2: Generate the final poem using the image and user-provided line themes
    const generatePoem = useCallback(async () => {
        if (!capturedImage) {
            setError("No image available to generate a poem from.");
            return;
        }
        setIsGeneratingPoem(true);
        setError(null);
        setPoem(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const base64Data = capturedImage.split(',')[1];
            
            const imagePart = {
                inlineData: { mimeType: 'image/jpeg', data: base64Data },
            };
            const textPart = {
                text: `Write a short, elegant, three-line poem inspired by this artwork, following these constraints for each line. Do not include a title.\nLine 1 theme/keywords: ${poemLines[0] || 'anything'}\nLine 2 theme/keywords: ${poemLines[1] || 'anything'}\nLine 3 theme/keywords: ${poemLines[2] || 'anything'}`
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
            });
            
            const poemText = response.text.trim();
            setPoemGenerationLog({ prompt: textPart.text, response: poemText });
            setPoem(poemText);

        } catch (err) {
            console.error(err);
            setError("Failed to generate poem. Please try again.");
        } finally {
            setIsGeneratingPoem(false);
        }
    }, [capturedImage, poemLines]);


    // Action Handlers
    const handleFetchArt = async () => {
        setIsFetchingArt(true);
        setError(null);
        setArtworkInfo(null);

        try {
            const response = await fetch('https://api.artic.edu/api/v1/artworks?fields=id,title,image_id,artist_display,medium_display,credit_line&limit=100');
            if (!response.ok) throw new Error('Failed to fetch artwork list from the museum.');
            
            const data = await response.json();
            const artworksWithImages = data.data.filter((art: any) => art.image_id);
            if (artworksWithImages.length === 0) throw new Error('No artworks with images were found.');
            
            const randomArt = artworksWithImages[Math.floor(Math.random() * artworksWithImages.length)];
            const imageUrl = `https://www.artic.edu/iiif/2/${randomArt.image_id}/full/843,/0/default.jpg`;

            // Store artwork metadata
            setArtworkInfo({
                title: randomArt.title,
                artist: randomArt.artist_display,
                medium: randomArt.medium_display,
                credit: randomArt.credit_line
            });

            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) throw new Error('Failed to fetch the artwork image.');
            
            const imageBlob = await imageResponse.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                setCapturedImage(base64data);
                generateKeywords(base64data);
            };
            reader.readAsDataURL(imageBlob);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred while fetching art.");
        } finally {
            setIsFetchingArt(false);
        }
    };


    const handleReset = () => {
        setCapturedImage(null);
        setPoem(null);
        setError(null);
        setKeywords([]);
        setPoemLines(['', '', '']);
        setIsGeneratingKeywords(false);
        setIsGeneratingPoem(false);
        setIsFetchingArt(false);
        setKeywordGenerationLog(null);
        setPoemGenerationLog(null);
        setShowLogs(false);
        setArtworkInfo(null);
        setShowArtworkInfo(false);
    };

    const handleExport = () => {
        if (!capturedImage || !poem) return;

        const exportCanvas = document.createElement('canvas');
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            const padding = 60;
            const textLineHeight = 40;
            const poemLines = poem.split('\n');
            const dateText = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            
            const textBlockHeight = (poemLines.length + 2) * textLineHeight;

            exportCanvas.width = img.width;
            exportCanvas.height = img.height + textBlockHeight + padding;

            ctx.fillStyle = '#111827'; // bg-gray-900
            ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
            
            ctx.drawImage(img, 0, 0);

            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';

            ctx.font = '32px serif';
            let currentY = img.height + padding;
            poemLines.forEach(line => {
                ctx.fillText(line, exportCanvas.width / 2, currentY);
                currentY += textLineHeight;
            });
            
            ctx.font = '24px sans-serif';
            ctx.fillStyle = '#9CA3AF'; // text-gray-400
            currentY += textLineHeight / 2;
            ctx.fillText(dateText, exportCanvas.width / 2, currentY);

            const link = document.createElement('a');
            link.download = `ai-art-poet-${Date.now()}.png`;
            link.href = exportCanvas.toDataURL('image/png');
            link.click();
        };
        img.src = capturedImage;
    };

    const handleDownloadLog = () => {
        const logData = {
            generatedOn: new Date().toISOString(),
            artwork: artworkInfo,
            keywordGeneration: keywordGenerationLog,
            poemGeneration: poemGenerationLog,
        };
        
        const logContent = JSON.stringify(logData, null, 2);
        const blob = new Blob([logContent], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-art-poet-log-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Renders the main content based on the current state of the app
    const renderContent = () => {
        if (poem) {
            return (
                <div className="w-full">
                    <p className="whitespace-pre-wrap font-serif text-xl md:text-2xl leading-relaxed">{poem}</p>
                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                        <ActionButton onClick={handleExport} icon={<DownloadIcon />} text="Export Poemgram" />
                        <ActionButton onClick={handleDownloadLog} icon={<DocumentTextIcon />} text="Download Log" variant="secondary" />
                    </div>
                </div>
            );
        }
        if (isGeneratingPoem) {
            return <LoadingSpinner text="Crafting your poem..." />;
        }
        if (keywords.length > 0) {
            return (
                <PoemEditor 
                    keywords={keywords}
                    poemLines={poemLines}
                    onPoemLinesChange={setPoemLines}
                    onGeneratePoem={generatePoem}
                    isGeneratingPoem={isGeneratingPoem}
                />
            );
        }
        if (isGeneratingKeywords) {
            return <LoadingSpinner text="Analyzing image for keywords..." />;
        }
        if (error) {
            return <p className="text-red-400">{error}</p>;
        }
        if (capturedImage) {
             return (
                 <div className="text-gray-400 flex flex-col items-center">
                   <SparklesIcon />
                   <p className="mt-2">Keywords will appear here...</p>
                 </div>
            );
        }
        return (
             <div className="text-gray-400 flex flex-col items-center">
               <SparklesIcon />
               <p className="mt-2">Your poem will appear here...</p>
             </div>
        );
    }


    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <main className="w-full max-w-xl mx-auto flex flex-col items-center">
                <header className="text-center mb-6">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">AI Art Poet</h1>
                    <p className="text-gray-400 mt-2">Find artistic inspiration, guide the verse.</p>
                </header>
                
                <div className="w-full aspect-square bg-black rounded-lg overflow-hidden shadow-xl border-4 border-gray-700 relative flex items-center justify-center">
                    {isFetchingArt && <LoadingSpinner text="Finding artwork..." />}
                    {!isFetchingArt && capturedImage && (
                        <>
                            <img 
                                src={capturedImage} 
                                alt="Artwork" 
                                className="w-full h-full object-contain"
                            />
                            {artworkInfo && (
                                <button
                                    onClick={() => setShowArtworkInfo(true)}
                                    className="absolute top-3 right-3 text-white bg-black/50 rounded-full p-2 hover:bg-black/75 transition-colors"
                                    aria-label="Show artwork information"
                                >
                                    <InfoIcon />
                                </button>
                            )}
                        </>
                    )}
                     {!isFetchingArt && !capturedImage && (
                        <div className="text-gray-600 flex flex-col items-center">
                            <MuseumIcon />
                            <p className="mt-2 text-sm">Artwork will appear here</p>
                        </div>
                    )}
                </div>


                <div className="w-full mt-6 flex justify-center gap-4">
                    {!capturedImage ? (
                        <ActionButton onClick={handleFetchArt} disabled={isFetchingArt || isGeneratingKeywords} icon={<MuseumIcon />} text="Find Artwork" />
                    ) : (
                        <ActionButton onClick={handleReset} icon={<RefreshIcon />} text="Change One" />
                    )}
                </div>

                <div className="w-full mt-6 min-h-[150px] bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700 flex items-center justify-center text-center">
                   {renderContent()}
                </div>

                 {(keywordGenerationLog || poemGenerationLog) && (
                    <div className="w-full mt-4 flex justify-center">
                        <button
                            onClick={() => setShowLogs(!showLogs)}
                            className="text-gray-400 flex items-center gap-2 text-sm transition-colors hover:text-white bg-transparent border-none cursor-pointer"
                            aria-expanded={showLogs}
                        >
                            <InfoIcon />
                            {showLogs ? 'Hide' : 'Show'} AI Interaction Log
                        </button>
                    </div>
                )}
                
                {showLogs && (
                     <div className="w-full mt-4 bg-gray-900/80 p-4 rounded-lg border border-gray-700 text-left text-sm animate-fadeIn">
                        <h3 className="text-lg font-bold mb-3 text-gray-300">AI Interaction Log</h3>
                        {keywordGenerationLog && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-indigo-400">1. Keyword Generation</h4>
                                <p className="font-mono text-xs text-gray-400 mt-1 uppercase">Prompt Sent:</p>
                                <pre className="whitespace-pre-wrap bg-black p-2 rounded text-gray-300 text-xs font-mono break-all">{keywordGenerationLog.prompt}</pre>
                                <p className="font-mono text-xs text-gray-400 mt-2 uppercase">Response Received:</p>
                                <pre className="whitespace-pre-wrap bg-black p-2 rounded text-gray-300 text-xs font-mono break-all">{keywordGenerationLog.response}</pre>
                            </div>
                        )}
                        {poemGenerationLog && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-indigo-400">2. Poem Generation</h4>
                                <p className="font-mono text-xs text-gray-400 mt-1 uppercase">Prompt Sent:</p>
                                <pre className="whitespace-pre-wrap bg-black p-2 rounded text-gray-300 text-xs font-mono break-all">{poemGenerationLog.prompt}</pre>
                                <p className="font-mono text-xs text-gray-400 mt-2 uppercase">Response Received:</p>
                                <pre className="whitespace-pre-wrap bg-black p-2 rounded text-gray-300 text-xs font-mono break-all">{poemGenerationLog.response}</pre>
                            </div>
                        )}
                    </div>
                )}


                 <footer className="mt-8 text-center text-gray-500 text-sm">
                    <p>Powered by Gemini API</p>
                </footer>
            </main>
            {showArtworkInfo && artworkInfo && (
                <ArtworkInfoModal 
                    info={artworkInfo} 
                    onClose={() => setShowArtworkInfo(false)} 
                />
            )}
        </div>
    );
};


interface ActionButtonProps {
    onClick: () => void;
    disabled?: boolean;
    icon: React.ReactNode;
    text: string;
    variant?: 'primary' | 'secondary';
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, disabled = false, icon, text, variant = 'primary' }) => {
    const baseClasses = "font-bold py-3 px-6 rounded-full transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 active:scale-100 disabled:cursor-not-allowed disabled:scale-100";
    
    const variantClasses = {
        primary: 'bg-indigo-600 text-white hover:not(:disabled):bg-indigo-700 disabled:bg-gray-600',
        secondary: 'bg-gray-700 text-gray-200 hover:not(:disabled):bg-gray-600 disabled:bg-gray-800',
    };
    
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]}`}
        >
            {icon}
            <span>{text}</span>
        </button>
    );
};

const LoadingSpinner: React.FC<{text?: string}> = ({ text = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-400 border-b-transparent"></div>
      <p className="text-gray-300">{text}</p>
    </div>
);


export default App;