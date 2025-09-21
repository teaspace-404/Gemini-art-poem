// types.ts

// Interface for logging AI interactions
export interface LogEntry {
    prompt: string;
    response: string;
}

// Standardized interface for artwork data from any source
export interface Artwork {
    id: string; // Using string for broader compatibility
    title: string;
    artist: string;
    medium: string;
    credit: string;
    source: string;
    imageId: string; // Source-specific image ID
    imageUrl: string; // Full URL for the main image
    thumbnailUrl: string; // Full URL for the thumbnail
}

// Interface for a bookmarked artwork
export interface Bookmark {
    id: string; // Align with Artwork.id
    title: string;
    imageId: string;
    source: string; // Need to know which service to call to reload
    thumbnailUrl: string;
}

// Interface for a liked poem, linking a poem to its artwork
export interface LikedPoem {
    id: number; // Unique ID for the liked instance, e.g., timestamp
    artworkId: string; // Align with Artwork.id
    artworkTitle: string;
    artworkImageId: string; // Corresponds to Artwork.imageId
    poem: string;
    source: string; // e.g., 'The Art Institute of Chicago' or 'artless'
    thumbnailUrl: string;
}

// Interface for different art sources/museums
export interface ArtSource {
    id: string;
    name: string;
    initials: string;
    enabled: boolean; // To disable upcoming sources
}