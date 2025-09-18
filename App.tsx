

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { SearchIcon, ImageIcon, DownloadIcon, RefreshIcon, SparklesIcon, DocumentTextIcon, InfoIcon } from './components/Icons';
import PoemEditor from './components/PoemEditor';
import ArtworkInfoModal from './components/ArtworkInfoModal';

// Add a declaration for html2canvas since it's loaded from a script tag
declare const html2canvas: any;

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
    source: "The Art Institute of Chicago"
}

// A list of engaging messages to show while waiting for keywords.
const loadingMessages = [
    'Analyzing art...',
    'Consulting the muses...',
    'Deciphering brushstrokes...',
    'Finding hidden symbols...',
    'Waking the color spirits...',
    'Translating light into language...',
];

// A reusable button component for consistent styling
const ActionButton: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
    title?: string;
}> = ({ onClick, disabled, className = '', children, title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`font-semibold py-2 px-4 rounded-full transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-md transform hover:scale-105 active:scale-100 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60 ${className}`}
    >
        {children}
    </button>
);

// A reusable loading spinner
const LoadingSpinner = () => (
    <div className="w-8 h-8 border-4 border-stone-200 border-t-slate-500 rounded-full animate-spin"></div>
);

// A smaller version of the sparkles icon for use inside buttons
const SparklesButtonIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6.343 6.343l2.829 2.829m11.314-2.829l-2.829 2.829M12 21v-4M21 12h-4M17.657 17.657l-2.829-2.829M6.343 17.657l2.829-2.829" />
    </svg>
);


const App: React.FC = () => {
    // Core state for the application's data
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [artworkImageUrl, setArtworkImageUrl] = useState<string | null>(null);
    const [poem, setPoem] = useState<string | null>(null);
    const [editablePoem, setEditablePoem] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [artworkInfo, setArtworkInfo] = useState<ArtworkInfo | null>(null);
    
    // UI State to manage visibility of modals and other components
    const [showArtworkInfo, setShowArtworkInfo] = useState<boolean>(false);
    const [isArtworkZoomed, setIsArtworkZoomed] = useState<boolean>(false);

    // State for the interactive poem generation flow
    const [keywords, setKeywords] =useState<string[]>([]);
    const [poemLines, setPoemLines] = useState<string[]>(['', '', '']);
    const [userWantsToGenerate, setUserWantsToGenerate] = useState<boolean>(false);
    const [isKeywordsReady, setIsKeywordsReady] = useState<boolean>(false);

    // Loading states to provide feedback to the user during async operations
    const [isFetchingArt, setIsFetchingArt] = useState<boolean>(false);
    const [isGeneratingPoem, setIsGeneratingPoem] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>(loadingMessages[0]);
    const [isChangeArtworkDisabled, setIsChangeArtworkDisabled] = useState<boolean>(false);
    
    // State for request limiting
    const [requestCount, setRequestCount] = useState<number>(0);
    const MAX_REQUESTS = 50;

    // A ref to track the current artwork request, preventing race conditions.
    const requestRef = useRef(0);

    // State for AI transparency, logging prompts and responses
    const [keywordGenerationLog, setKeywordGenerationLog] = useState<LogEntry | null>(null);
    const [poemGenerationLog, setPoemGenerationLog] = useState<LogEntry | null>(null);
    const [showLogs, setShowLogs] = useState<boolean>(false);
    
    useEffect(() => {
        setEditablePoem(poem);
    }, [poem]);

    // Effect to cycle through loading messages while waiting for keywords.
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        const isLoadingKeywords = userWantsToGenerate && !isKeywordsReady;

        if (isLoadingKeywords) {
            setLoadingMessage(loadingMessages[0]); // Reset to the first message
            let messageIndex = 0;
            interval = setInterval(() => {
                messageIndex = (messageIndex + 1) % loadingMessages.length;
                setLoadingMessage(loadingMessages[messageIndex]);
            }, 1500);
        }

        // Cleanup function to clear the interval when the component unmounts or loading stops.
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [userWantsToGenerate, isKeywordsReady]);

    // This function runs in the background to fetch keywords from Gemini for the current artwork.
    const generateKeywords = useCallback(async (imageDataUrl: string, requestId: number) => {
        if (!process.env.API_KEY) {
            if (requestId === requestRef.current) setError("Gemini API key is not configured.");
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const base64Data = imageDataUrl.split(',')[1];
            
            const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Data } };
            const textPart = { text: "Based on this image of a piece of art, generate a list of 5-7 evocative keywords or very short phrases (1-3 words) that could inspire a poem. Separate them with commas." };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
            });
            
            // CRITICAL: Check if this is still the active request before updating state.
            if (requestId === requestRef.current) {
                const keywordString = response.text.trim();
                setKeywordGenerationLog({ prompt: textPart.text, response: keywordString });
                // Robustly split the keywords, handling commas, asterisks, or newlines as delimiters.
                const keywordsArray = keywordString.replace(/[\*\n]/g, ',').split(',').map(k => k.trim()).filter(Boolean);
                setKeywords(keywordsArray);
                setIsKeywordsReady(true); // Signal that keywords are loaded and ready.
            } else {
                console.log("Stale keyword request ignored.");
            }
        } catch (err) {
            // Only show an error if it pertains to the current artwork request.
            if (requestId === requestRef.current) {
                console.error(err);
                setError("Failed to generate keywords. You can still write a poem without them.");
                setIsKeywordsReady(true); // Allow user to proceed even if keyword generation fails.
            }
        }
    }, []);

    // This function sends the artwork and the user-crafted poem themes to the Gemini API to generate the final poem.
    const generatePoem = useCallback(async () => {
        if (requestCount >= MAX_REQUESTS) {
            setError("You have reached the maximum number of requests for this session.");
            return;
        }

        if (!capturedImage) {
            setError("No image available to generate a poem from.");
            return;
        }

        setRequestCount(prevCount => prevCount + 1);
        setIsGeneratingPoem(true);
        setError(null);
        setPoem(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const base64Data = capturedImage.split(',')[1];
            
            const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Data } };
            const textPart = { text: `Write a short, elegant, three-line poem inspired by this piece of artwork, following these word constraints for each line. Do not include a title.\nLine 1 theme/keywords: ${poemLines[0] || 'anything'}\nLine 2 theme/keywords: ${poemLines[1] || 'anything'}\nLine 3 theme/keywords: ${poemLines[2] || 'anything'}. Make sure the keywords appear in the line.` };

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
    }, [capturedImage, poemLines, requestCount]);


    // Fetches a random artwork and kicks off the background keyword generation.
    const handleFetchArt = async () => {
        setIsFetchingArt(true);
        // Increment the request ID to invalidate any previous, in-flight requests.
        const currentRequestId = ++requestRef.current;

        // Reset all relevant states for a fresh start
        setError(null);
        setArtworkInfo(null);
        setCapturedImage(null);
        setArtworkImageUrl(null);
        setPoem(null);
        setKeywords([]);
        setPoemLines(['', '', '']);
        setKeywordGenerationLog(null);
        setPoemGenerationLog(null);
        setShowLogs(false);
        setIsKeywordsReady(false);
        setUserWantsToGenerate(false);

        try {
            const response = await fetch('https://api.artic.edu/api/v1/artworks?fields=id,title,image_id,artist_display,medium_display,credit_line&limit=100');
            if (!response.ok) throw new Error('Failed to fetch artwork list from the museum.');
            
            const data = await response.json();
            const artworksWithImages = data.data.filter((art: any) => art.image_id);
            if (artworksWithImages.length === 0) throw new Error('No artworks with images were found.');
            
            const randomArt = artworksWithImages[Math.floor(Math.random() * artworksWithImages.length)];
            const imageUrl = `https://www.artic.edu/iiif/2/${randomArt.image_id}/full/843,/0/default.jpg`;
            
            // Check if this request is still the active one before setting state.
            if(currentRequestId !== requestRef.current) return;

            setArtworkImageUrl(imageUrl);
            setArtworkInfo({
                title: randomArt.title,
                artist: randomArt.artist_display,
                medium: randomArt.medium_display,
                credit: randomArt.credit_line,
                source: "The Art Institute of Chicago"
            });

            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) throw new Error('Failed to fetch the artwork image.');
            
            const imageBlob = await imageResponse.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                // Final check to prevent race conditions before setting the image and starting generation.
                if (currentRequestId === requestRef.current) {
                    const base64data = reader.result as string;
                    setCapturedImage(base64data);
                    // Automatically trigger keyword generation in the background.
                    generateKeywords(base64data, currentRequestId);
                }
            };
            reader.readAsDataURL(imageBlob);

        } catch (err) {
            if (currentRequestId === requestRef.current) {
                console.error(err);
                setError(err instanceof Error ? err.message : "An unknown error occurred while fetching art.");
            }
        } finally {
            if (currentRequestId === requestRef.current) {
                setIsFetchingArt(false);
            }
        }
    };
    
    const handleInspireMe = () => {
        setUserWantsToGenerate(true);
    };

    const handleChangeArtwork = () => {
        setIsChangeArtworkDisabled(true);
        handleFetchArt();
        setTimeout(() => {
            setIsChangeArtworkDisabled(false);
        }, 2000);
    };


    // Exports the final artwork and poem as a single PNG image.
    const handleExport = () => {
        if (!artworkImageUrl || !editablePoem) {
            setError("Cannot export without an image and a poem.");
            return;
        }

        const exportRoot = document.createElement('div');
        exportRoot.style.position = 'absolute';
        exportRoot.style.left = '-9999px';
        exportRoot.style.width = '843px';
        exportRoot.style.background = '#fcfcfc';
        exportRoot.style.padding = '40px';
        exportRoot.style.boxSizing = 'content-box';


        const imgElement = document.createElement('img');
        imgElement.src = artworkImageUrl;
        imgElement.crossOrigin = 'anonymous';
        imgElement.width = 843;

        const poemElement = document.createElement('div');
        poemElement.innerText = editablePoem;
        poemElement.style.fontFamily = 'serif';
        poemElement.style.color = '#292524';
        poemElement.style.fontSize = '2rem';
        poemElement.style.textAlign = 'center';
        poemElement.style.marginTop = '40px';
        poemElement.style.whiteSpace = 'pre-wrap';
        poemElement.style.lineHeight = '1.5';
        
        exportRoot.appendChild(imgElement);
        exportRoot.appendChild(poemElement);
        document.body.appendChild(exportRoot);
    
        html2canvas(exportRoot, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#fcfcfc',
            logging: true,
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `ai-art-poet-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            document.body.removeChild(exportRoot);
        }).catch(err => {
            console.error("html2canvas failed:", err);
            setError("Failed to export the image. There might be a network or browser issue.");
            if (document.body.contains(exportRoot)) {
                document.body.removeChild(exportRoot);
            }
        });
    };

    // Compiles all log data into a single JSON object and triggers a download.
    const handleDownloadLog = () => {
        const logData = {
            generatedOn: new Date().toISOString(),
            artwork: artworkInfo,
            keywordGeneration: keywordGenerationLog,
            poemGeneration: poemGenerationLog,
            userPrompts: poemLines,
            finalPoem: editablePoem,
        };
        
        const logContent = JSON.stringify(logData, null, 2);
        const blob = new Blob([logContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai_art_poet_log_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Main render method for the App component
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-center">
            <main className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8 md:gap-12">
                
                {/* Left Column: Artwork Display and Actions */}
                <div className="md:w-1/2 flex flex-col items-center gap-4">
                    <h1 className="text-3xl sm:text-4xl font-sans font-bold text-stone-900">Poem for Art</h1>
                    <p className="text-stone-600 mb-4">Find artistic inspiration, guide the verse.</p>

                    <div className="w-full aspect-square bg-white rounded-lg shadow-lg flex items-center justify-center relative border border-stone-200">
                        {isFetchingArt && <LoadingSpinner />}
                        {error && !isFetchingArt && <p className="text-red-600 p-4">{error}</p>}
                        {!isFetchingArt && !error && capturedImage && (
                            <>
                                <img
                                    src={capturedImage}
                                    alt="Captured artwork"
                                    className="w-full h-full object-contain rounded-lg cursor-pointer transition-transform hover:scale-105"
                                    onClick={() => setIsArtworkZoomed(true)}
                                />
                                {artworkInfo && (
                                     <button
                                        onClick={() => setShowArtworkInfo(true)}
                                        className="absolute top-2 right-2 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-all"
                                        aria-label="Show artwork information"
                                    >
                                        <InfoIcon />
                                    </button>
                                )}
                            </>
                        )}
                        {!isFetchingArt && !capturedImage && !error && (
                             <div className="text-center text-stone-500">
                                <ImageIcon />
                                <p className="mt-2">Magic might happen here.</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full flex items-center justify-center gap-3 mt-2">
                        {!capturedImage && (
                             <ActionButton
                                onClick={handleFetchArt}
                                disabled={isFetchingArt}
                                className="bg-slate-500 text-white hover:bg-slate-600"
                            >
                                <SearchIcon />
                                <span>Find Artwork</span>
                            </ActionButton>
                        )}
                        {capturedImage && (
                            <ActionButton
                                onClick={handleChangeArtwork}
                                disabled={isFetchingArt || isChangeArtworkDisabled}
                                className="bg-stone-200 text-stone-700 hover:bg-stone-300"
                                title="Find a new piece of art"
                            >
                                <RefreshIcon />
                                <span>Change One</span>
                            </ActionButton>
                        )}
                    </div>
                </div>

                {/* Right Column: Poem Generation and Editing */}
                <div className="md:w-1/2 flex flex-col items-center justify-center p-6 bg-white/50 rounded-lg shadow-inner border border-stone-200">
                   {/* Initial state: No artwork loaded yet */}
                    {!capturedImage && !isFetchingArt && !error && (
                         <div className="text-center text-stone-500">
                            <SparklesIcon />
                            <p className="mt-2">Inspiration awaits</p>
                        </div>
                    )}

                    {/* Main generation flow, shown only when an image is present */}
                    {capturedImage && (
                         // The final poem view has the highest priority and is shown once 'editablePoem' has content.
                        !isGeneratingPoem && editablePoem ? (
                            <div className="w-full text-left animate-fadeIn">
                                <h3 className="font-bold text-lg mb-3 text-stone-700">Your Final Poem</h3>
                                <textarea
                                    value={editablePoem}
                                    onChange={(e) => setEditablePoem(e.target.value)}
                                    rows={4}
                                    className="w-full p-3 bg-stone-50 border border-stone-300 rounded-md font-serif text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
                                    aria-label="Final editable poem"
                                />
                                <div className="w-full flex justify-center mt-4">
                                    <ActionButton
                                        onClick={handleExport}
                                        disabled={!editablePoem}
                                        className="bg-slate-500 text-white hover:bg-slate-600"
                                        title="Export as PNG"
                                    >
                                        <DownloadIcon />
                                        <span>Export Poemgram</span>
                                    </ActionButton>
                                </div>
                            </div>
                        // Show "muse is working" spinner if the poem is being generated.
                        ) : isGeneratingPoem ? (
                            <div className="text-center text-stone-600">
                                <LoadingSpinner />
                                <p className="mt-4">The muse is working...</p>
                            </div>
                        // If user hasn't clicked "Inspire Me" yet, show the button.
                        ) : !userWantsToGenerate ? (
                            <div className="text-center animate-fadeIn">
                                <ActionButton
                                    onClick={handleInspireMe}
                                    className="bg-slate-500 text-white hover:bg-slate-600 text-lg"
                                >
                                    <SparklesButtonIcon />
                                    <span>Inspire Me</span>
                                </ActionButton>
                            </div>
                        // If user has clicked "Inspire Me" but keywords aren't ready, show "analyzing" spinner.
                        ) : !isKeywordsReady ? (
                            <div className="text-center text-stone-600">
                                <LoadingSpinner />
                                <p className="mt-4 transition-opacity duration-500">{loadingMessage}</p>
                            </div>
                        // Otherwise, keywords are ready, so show the poem editor.
                        ) : (
                            <PoemEditor 
                                keywords={keywords}
                                poemLines={poemLines}
                                onPoemLinesChange={setPoemLines}
                                onGeneratePoem={generatePoem}
                                isGeneratingPoem={isGeneratingPoem}
                                requestCount={requestCount}
                                maxRequests={MAX_REQUESTS}
                            />
                        )
                    )}
                </div>
            </main>

             {/* Transparency and Logging Section */}
            {(keywordGenerationLog || poemGenerationLog) && (
                <div className="w-full max-w-5xl mx-auto mt-8">
                    <button onClick={() => setShowLogs(!showLogs)} className="text-sm text-stone-500 hover:text-slate-600">
                        {showLogs ? 'Hide AI Logs' : 'Show AI Logs'}
                    </button>
                     {showLogs && (
                        <div className="mt-4 p-4 bg-stone-50 border border-stone-200 rounded-lg text-left text-xs text-stone-700 animate-fadeIn space-y-4">
                           <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold">AI Interaction Log</h4>
                                    <p className="text-stone-500">This log shows the prompts sent to and responses received from the AI.</p>
                                </div>
                                 <button onClick={handleDownloadLog} title="Download Log" className="p-2 rounded-md hover:bg-stone-200 transition-colors">
                                    <DocumentTextIcon />
                                </button>
                           </div>
                           
                            {keywordGenerationLog && (
                                <div>
                                    <p className="font-semibold text-slate-700">Keyword Generation</p>
                                    <p className="mt-1 p-2 bg-stone-200 rounded"><strong>Prompt:</strong> {keywordGenerationLog.prompt}</p>
                                    <p className="mt-1 p-2 bg-stone-200 rounded"><strong>Response:</strong> {keywordGenerationLog.response}</p>
                                </div>
                            )}
                            {poemGenerationLog && (
                                <div>
                                    <p className="font-semibold text-slate-700">Poem Generation</p>
                                    <p className="mt-1 p-2 bg-stone-200 rounded"><strong>Prompt:</strong> {poemGenerationLog.prompt}</p>
                                    <p className="mt-1 p-2 bg-stone-200 rounded"><strong>Response:</strong> {poemGenerationLog.response}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            
             {/* Modal for displaying artwork information */}
            {showArtworkInfo && artworkInfo && (
                <ArtworkInfoModal info={artworkInfo} onClose={() => setShowArtworkInfo(false)} />
            )}

            {/* Modal for the full-screen, zoomable artwork view. */}
            {isArtworkZoomed && artworkImageUrl && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
                    onClick={() => setIsArtworkZoomed(false)}
                >
                    <img
                        src={artworkImageUrl}
                        alt="Artwork, zoomed in"
                        onClick={(e) => e.stopPropagation()} 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                </div>
            )}
        </div>
    );
};

export default App;