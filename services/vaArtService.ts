import type { Artwork } from '../types';

const API_SEARCH_URL = 'https://api.vam.ac.uk/v2/objects/search';
const SOURCE_NAME = 'Victoria and Albert Museum';

// Helper to parse the raw API response into our standard Artwork format
const parseArtworkResponse = (data: any): Artwork => {
    const imageId = data._primaryImageId;
    const iiifBaseUrl = data._images?._iiif_image_base_url;

    if (!imageId || !iiifBaseUrl) {
        throw new Error(`Artwork with ID ${data.systemNumber} has no image data.`);
    }

    return {
        id: String(data.systemNumber),
        title: data._primaryTitle || 'Untitled',
        artist: data._primaryMaker?.name || 'Unknown Artist',
        medium: data.objectType || 'N/A',
        credit: data.accessionNumber || 'N/A', // Mapped to credit for use in the modal
        source: SOURCE_NAME,
        imageId: imageId,
        imageUrl: `${iiifBaseUrl}full/768,/0/default.jpg`, // Use documented 768px size for main image
        thumbnailUrl: `${iiifBaseUrl}full/!200,200/0/default.jpg`, // Construct a 200px thumbnail
        date: data._primaryDate || undefined, // Add date field
        place: data._primaryPlace || undefined, // Add place field
    };
};

export const vaArtService = {
    fetchRandomArtwork: async (): Promise<Artwork> => {
        // The V&A API supports a `random=true` parameter for efficient random fetching.
        // By removing the object type filter and adding `images_exist=true`, we get a wider, more reliable
        // range of art while ensuring that the selected piece has an image that can be re-fetched by ID later.
        const response = await fetch(`${API_SEARCH_URL}?page_size=100&random=true&images_exist=true`);
        if (!response.ok) {
            throw new Error('Failed to fetch artwork list from the V&A museum.');
        }

        const data = await response.json();
        // We still filter client-side as a fallback, ensuring both image ID and URL base are present.
        const artworksWithImages = data.records.filter((art: any) => art._primaryImageId && art._images?._iiif_image_base_url);
        
        if (artworksWithImages.length === 0) {
            throw new Error('No artworks with images were found from V&A.');
        }

        // Select a random artwork from the filtered list for variety.
        const randomArt = artworksWithImages[Math.floor(Math.random() * artworksWithImages.length)];
        return parseArtworkResponse(randomArt);
    },

    fetchArtworkById: async (id: string): Promise<Artwork> => {
        // Fetching by ID is done via the search endpoint using the `id_system_number` parameter
        const response = await fetch(`${API_SEARCH_URL}?id_system_number=${id}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch artwork with ID ${id} from V&A.`);
        }
        
        const data = await response.json();
        if (data.records.length === 0) {
            throw new Error(`Artwork with ID ${id} not found at V&A.`);
        }
        return parseArtworkResponse(data.records[0]);
    }
};