import React from 'react';
import { useAppContext } from '../AppContext';
import { BookmarkIcon, HeartIcon } from './Icons';
import type { LikedPoem } from '../useAppController';

const BookmarkMenu: React.FC = () => {
    const {
        bookmarks,
        likedPoems,
        handleFetchArtById: onLoadBookmark,
        handleLoadLikedPoem: onLoadLikedPoem,
    } = useAppContext();

    // Construct the thumbnail URL for a given image ID.
    const getThumbnailUrl = (imageId: string) => `https://www.artic.edu/iiif/2/${imageId}/full/200,/0/default.jpg`;

    return (
        <div 
            className="absolute top-full left-0 mt-2 w-80 max-h-[70vh] bg-stone-100 border border-stone-200 rounded-lg shadow-xl z-50 
                       opacity-0 pointer-events-none transform -translate-y-2 
                       group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0
                       group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0
                       transition-all duration-300 ease-in-out
                       overflow-y-auto"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="collections-button"
        >
            <div className="p-2">
                {/* Section 1: Bookmarked Art */}
                <div className="px-2 pt-2">
                    <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                        <BookmarkIcon />
                        Bookmarked Art
                    </h3>
                </div>
                <div className="p-2">
                    {bookmarks.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {bookmarks.map(bookmark => (
                                <button 
                                    key={bookmark.id}
                                    onClick={() => onLoadBookmark(bookmark.id)}
                                    className="group relative aspect-square bg-stone-200 rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                    title={`Load artwork: ${bookmark.title}`}
                                    role="menuitem"
                                >
                                    <img 
                                        src={getThumbnailUrl(bookmark.image_id)} 
                                        alt={bookmark.title}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    <p className="absolute bottom-0 left-0 right-0 p-1 text-[10px] font-semibold text-white truncate text-center">
                                        {bookmark.title}
                                    </p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-stone-500 text-center p-4">No bookmarked art yet.</p>
                    )}
                </div>

                {/* Divider */}
                <hr className="my-2 border-stone-200"/>

                {/* Section 2: Liked Poems */}
                <div className="px-2">
                    <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                        <HeartIcon />
                        Liked Poems
                    </h3>
                </div>
                <div className="p-2 space-y-2">
                    {likedPoems.length > 0 ? (
                       likedPoems.map(likedPoem => {
                            const poemPreview = likedPoem.poem.split('\n')[0].split(' ').slice(0, 2).join(' ');
                            return (
                                <button
                                    key={likedPoem.id}
                                    onClick={() => onLoadLikedPoem(likedPoem as LikedPoem)}
                                    className="w-full flex items-center gap-3 text-left p-2 rounded-md hover:bg-stone-200 transition-colors focus:outline-none focus:bg-stone-200"
                                    role="menuitem"
                                >
                                    <img
                                        src={getThumbnailUrl(likedPoem.artworkImageId)}
                                        alt={likedPoem.artworkTitle}
                                        className="w-12 h-12 object-cover rounded flex-shrink-0 bg-stone-200"
                                        loading="lazy"
                                    />
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-semibold text-stone-700 truncate">{likedPoem.artworkTitle}</p>
                                        <p className="text-xs text-stone-500 font-serif italic truncate">"{poemPreview}..."</p>
                                    </div>
                                </button>
                            );
                       })
                    ) : (
                        <p className="text-xs text-stone-500 text-center p-4">No liked poems yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookmarkMenu;
