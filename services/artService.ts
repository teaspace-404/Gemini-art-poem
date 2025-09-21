import type { Artwork } from '../types';

const API_BASE_URL = 'https://api.artic.edu/api/v1/artworks';
const IMAGE_BASE_URL = 'https://www.artic.edu/iiif/2';
const SOURCE_NAME = 'The Art Institute of Chicago';

// Helper to parse the raw API response into our standard Artwork format
const parseArtworkResponse = (data: any): Artwork => {
    const imageId = data.image_id;
    if (!imageId) {
        throw new Error(`Artwork with ID ${data.id} has no image_id.`);
    }
    return {
        id: String(data.id),
        title: data.title || 'Untitled',
        artist: data.artist_display || 'Unknown Artist',
        medium: data.medium_display || 'N/A',
        credit: data.credit_line || 'N/A',
        source: SOURCE_NAME,
        imageId: imageId,
        imageUrl: `${IMAGE_BASE_URL}/${imageId}/full/843,/0/default.jpg`,
        thumbnailUrl: `${IMAGE_BASE_URL}/${imageId}/full/200,/0/default.jpg`,
    };
};

export const artService = {
    fetchRandomArtwork: async (): Promise<Artwork> => {
        const response = await fetch(`${API_BASE_URL}?fields=id,title,image_id,artist_display,medium_display,credit_line&limit=100`);
        if (!response.ok) {
            throw new Error('Failed to fetch artwork list from the museum.');
        }

        const data = await response.json();
        const artworksWithImages = data.data.filter((art: any) => art.image_id);
        if (artworksWithImages.length === 0) {
            throw new Error('No artworks with images were found.');
        }

        const randomArt = artworksWithImages[Math.floor(Math.random() * artworksWithImages.length)];
        return parseArtworkResponse(randomArt);
    },

    fetchArtworkById: async (id: string): Promise<Artwork> => {
        const response = await fetch(`${API_BASE_URL}/${id}?fields=id,title,image_id,artist_display,medium_display,credit_line`);
        if (!response.ok) {
            throw new Error(`Failed to fetch artwork with ID ${id}.`);
        }

        const { data } = await response.json();
        return parseArtworkResponse(data);
    }
};
