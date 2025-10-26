import ytdl from '@distube/ytdl-core';
import { Outfit, OutfitPiece } from './types';

const REKA_API_KEY = process.env.REKA_API_KEY || '';
const REKA_BASE_URL = 'https://api.reka.ai/v1';

interface RekaVisionAnalysisResponse {
  outfits: Array<{
    description: string;
    timestamp: number;
    pieces: Array<{
      name: string;
      description: string;
    }>;
  }>;
}

/**
 * Downloads a YouTube video and returns it as a buffer
 */
export async function downloadYouTubeVideo(youtubeUrl: string): Promise<Buffer> {
  try {
    const info = await ytdl.getInfo(youtubeUrl);

    // Get video format with audio (prefer mp4 with medium quality)
    const format = ytdl.chooseFormat(info.formats, {
      quality: 'highestvideo',
      filter: 'videoandaudio'
    });

    const videoStream = ytdl(youtubeUrl, { format });

    // Convert stream to buffer
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      videoStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      videoStream.on('end', () => resolve(Buffer.concat(chunks)));
      videoStream.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading YouTube video:', error);
    throw new Error('Failed to download video from YouTube');
  }
}

/**
 * Converts a video buffer to a base64 data URL for Reka API
 */
export function convertVideoToDataUrl(videoBuffer: Buffer): string {
  const base64Video = videoBuffer.toString('base64');
  return `data:video/mp4;base64,${base64Video}`;
}

/**
 * Analyzes a video using Reka's Vision API to identify outfits
 */
export async function analyzeOutfitsWithRekaVision(
  videoDataUrl: string,
  characterName: string
): Promise<Outfit[]> {
  try {
    const prompt = `Analyze this video and identify all distinct outfits worn by ${characterName}.
    For each outfit:
    1. Provide a detailed description of the complete outfit
    2. List each clothing item and accessory piece with detailed descriptions
    3. Note the approximate timestamp when this outfit appears

    Focus on identifying visually distinct outfits (ignore minor variations).
    Return the analysis in JSON format with this structure:
    {
      "outfits": [
        {
          "description": "Overall outfit description",
          "timestamp": 0,
          "pieces": [
            {
              "name": "Item name (e.g., 'White T-shirt')",
              "description": "Detailed description including color, style, material if visible"
            }
          ]
        }
      ]
    }`;

    const response = await fetch(`${REKA_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${REKA_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'reka-core',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'video_url',
                video_url: videoDataUrl,
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Reka vision analysis error:', errorText);
      throw new Error(`Failed to analyze video with Reka Vision: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse outfit data from Reka response');
    }

    const parsedData: RekaVisionAnalysisResponse = JSON.parse(jsonMatch[0]);

    // Convert to Outfit format
    const outfits: Outfit[] = parsedData.outfits.map((outfit, index) => ({
      id: `outfit-${index}`,
      imageUrl: '', // Will be populated later with frame extraction
      description: outfit.description,
      pieces: outfit.pieces.map(piece => ({
        name: piece.name,
        description: piece.description,
        shoppingLink: undefined, // Will be populated by research API
      })),
    }));

    return outfits;
  } catch (error) {
    console.error('Error analyzing outfits with Reka Vision:', error);
    throw new Error('Failed to analyze outfits');
  }
}

/**
 * Uses Reka's Research API to find shopping links for outfit pieces
 */
export async function findShoppingLinksWithRekaResearch(
  outfitPieces: OutfitPiece[]
): Promise<OutfitPiece[]> {
  try {
    const updatedPieces = await Promise.all(
      outfitPieces.map(async (piece) => {
        try {
          const searchQuery = `Shop for ${piece.name}: ${piece.description}`;

          const response = await fetch(`${REKA_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${REKA_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'reka-core',
              messages: [
                {
                  role: 'user',
                  content: searchQuery,
                },
              ],
              research_mode: 'extended',
              temperature: 0.3,
            }),
          });

          if (!response.ok) {
            console.error(`Failed to find shopping link for ${piece.name}`);
            return piece;
          }

          const data = await response.json();

          // Extract shopping links from the research results
          const content = data.choices?.[0]?.message?.content || '';
          const sources = data.choices?.[0]?.message?.sources || [];

          // Try to find a shopping link from sources
          const shoppingLink = sources.find((source: any) =>
            source.url && (
              source.url.includes('shop') ||
              source.url.includes('store') ||
              source.url.includes('amazon') ||
              source.url.includes('ebay') ||
              source.url.includes('.com')
            )
          )?.url;

          return {
            ...piece,
            shoppingLink: shoppingLink || undefined,
          };
        } catch (error) {
          console.error(`Error finding shopping link for ${piece.name}:`, error);
          return piece;
        }
      })
    );

    return updatedPieces;
  } catch (error) {
    console.error('Error finding shopping links:', error);
    return outfitPieces; // Return original pieces if research fails
  }
}

/**
 * Main function to process a YouTube video and extract outfits with shopping links
 */
export async function processVideoForOutfits(
  youtubeUrl: string,
  characterName: string
): Promise<Outfit[]> {
  console.log('Downloading video from YouTube...');
  const videoBuffer = await downloadYouTubeVideo(youtubeUrl);

  console.log('Converting video to data URL for Reka...');
  const videoDataUrl = convertVideoToDataUrl(videoBuffer);

  console.log('Analyzing outfits with Reka Vision...');
  const outfits = await analyzeOutfitsWithRekaVision(videoDataUrl, characterName);

  console.log('Finding shopping links with Reka Research...');
  const outfitsWithLinks = await Promise.all(
    outfits.map(async (outfit) => {
      const piecesWithLinks = await findShoppingLinksWithRekaResearch(outfit.pieces);
      return {
        ...outfit,
        pieces: piecesWithLinks,
      };
    })
  );

  return outfitsWithLinks;
}
