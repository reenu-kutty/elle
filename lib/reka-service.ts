import { Outfit, OutfitPiece } from './types';

const REKA_API_KEY = process.env.REKA_API_KEY || '';
const REKA_RESEARCH_URL = 'https://api.reka.ai';
const REKA_VISION_URL = 'https://vision-agent.api.reka.ai';

interface RekaVisionAnalysisResponse {
  outfits: Array<{
    timestamp: number;
    pieces: Array<{
      name: string;
      description: string;
    }>;
  }>;
}

/**
 * Uploads a YouTube video URL directly to Reka Vision Agent API
 */
export async function uploadVideoToReka(youtubeUrl: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('video_url', youtubeUrl);
    formData.append('video_name', 'youtube_video1.mp4');
    formData.append('index', 'true');

    const response = await fetch(`${REKA_VISION_URL}/videos/upload`, {
      method: 'POST',
      headers: {
        'X-Api-Key': REKA_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Reka upload error:', errorText);
      throw new Error(`Failed to upload video to Reka: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Reka upload response:', data);

    // The response should contain a video_id
    if (!data.video_id) {
      throw new Error('No video_id returned from Reka upload');
    }

    return data.video_id;
  } catch (error) {
    console.error('Error uploading to Reka:', error);
    throw error;
  }
}


export async function checkUploadStatus(videoId: string): Promise<string> {
  try {
    const response = await fetch(`${REKA_VISION_URL}/videos/get`, {
      method: 'POST',
      headers: {
        'X-Api-Key': REKA_API_KEY,
        'Content-Type': 'application/json',
      },
      body: `{"video_ids":["${videoId}"]}`,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload status check error:', errorText);
      throw new Error(`Failed to check upload status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(data.results)

    return data.results[0].indexing_status;
  } catch (error) {
    console.error('Error checking upload status:', error);
    throw error;
  }
}


/**
 * Analyzes a video using Reka's Vision API to identify outfits
 */
export async function analyzeOutfitsWithRekaVision(
  videoId: string,
  characterName: string
): Promise<Outfit[]> {
  try {
    // const prompt = `Analyze this video and identify all distinct outfits worn by ${characterName}.
    // For each outfit:
    // 1. List each clothing item and accessory piece with detailed descriptions
    // 2. Note the approximate timestamp when this outfit appears
    //
    // Focus on identifying visually distinct outfits (ignore minor variations).
    // Return the analysis in JSON format with this structure:
    // {
    //   "outfits": [
    //     {
    //       "timestamp": 0,
    //       "pieces": [
    //         {
    //           "name": "Item name (e.g., 'White T-shirt')",
    //           "description": "Detailed description including color, style, material if visible"
    //         }
    //       ]
    //     }
    //   ]
    // }`;
    //const prompt = "what was the main idea of this video?"
    const prompt = `Analyze this video and identify THREE outfits worn by ${characterName}.
    For it:
    1. List each clothing item and accessory piece with detailed descriptions
    2. Note the approximate timestamp when this outfit appears

    Return the analysis in JSON format with this structure:
    {
      "outfits": [
        {
          "timestamp": 0, // Return as STRING in MM:SS format
          "pieces": [
            {
              "name": "Item name (e.g., 'light pink crop top with sequinned edges')",
              "description": "Very detailed description including color, style, material if visible"
            }
          ]
        }
      ]
    }`;

    const response = await fetch(`${REKA_VISION_URL}/qa/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': REKA_API_KEY,
      },
      body: JSON.stringify({
        video_id: videoId,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ]
      }),
      signal: AbortSignal.timeout(1000000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Reka vision analysis error:', errorText);
      throw new Error(`Failed to analyze video with Reka Vision: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('data is :' + data.chat_response)
    const content = data.chat_response || '';

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
      pieces: outfit.pieces.map(piece => ({
        name: piece.name,
        description: piece.description,
        shoppingLink: undefined, // Will be populated by research API
      })),
      timestamp: outfit.timestamp,
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
            const searchQuery = `Find shopping links for: ${piece.name} - ${piece.description}
          
Please provide:
- Direct shopping links from reputable retailers
- Product URLs that match this item description
- Links from stores like Amazon, Nordstrom, ASOS, Zara, etc.

Return the best shopping link found.`;

            const response = await fetch(`${REKA_RESEARCH_URL}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': REKA_API_KEY,
                },
                body: JSON.stringify({
                    "messages": [{
                        "role": "user",
                        "content": searchQuery
                    }],
                  "model": "reka-flash-research",
                  "response_format": {
                    type: "json_schema",
                    json_schema: {
                      name: "shopping_links",
                      strict: true,
                      schema: {
                        type: "object",
                        properties: {
                          productName: { type: "string" },
                          links: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                url: { type: "string" },
                                storeName: { type: "string" }
                              },
                              required: ["url", "storeName"],
                              additionalProperties: false
                            }
                          }
                        },
                        required: ["productName", "links"],
                        additionalProperties: false
                      }
                    }
                  }
                }),
                signal: AbortSignal.timeout(1000000),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Reka Research analysis error:', errorText);
                throw new Error(`Failed to find links with Reka Research: ${response.statusText}`);
            }

            const data = await response.json();
            // console.log(data.choices?.[0]?.message?.content)
            const content = data.choices?.[0]?.message?.content;

            // SCHEMA EXAMPLE FOR CONTENT:
            //
            // {
            //   "productName": "Premium Matte Graduation Cap, Gown & Tassel Package",
            //     "links": [{
            //        "url": "https://www.graduationmall.com/products/premium-matte-graduation-cap-gown-tassel-package-12-colors-available?srsltid=AfmBOooTSXLC1fl9DPMcTKe_xoSDWHYoiQI4o6MNEsI4cpsdgcvUIaBb",
            //        "storeName": "Graduationmall"
            //     }]
            //
            // }


            // // Extract URLs from the response content
            // const urlRegex = /https?:\/\/[^\s<>"]+/g;
            // const urls = content.match(urlRegex) || [];
            //
            // // Filter for shopping links
            // const shoppingLink = urls.find((url: any) =>
            //     url.includes('amazon.com') ||
            //     url.includes('shop') ||
            //     url.includes('store') ||
            //     url.includes('ebay.com') ||
            //     url.includes('nordstrom.com') ||
            //     url.includes('asos.com') ||
            //     url.includes('zara.com') ||
            //     url.includes('hm.com') ||
            //     url.includes('product') ||
            //     url.includes('/dp/') || // Amazon product pages
            //     url.includes('/p/') // Generic product pages
            // );

            // Parse the JSON response
            const parsed = JSON.parse(content);

            // Get the first link from the structured response
            const shoppingLink = parsed.links?.[0]?.url || undefined;

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
    return outfitPieces;
  }
}

/**
 * Main function to process a YouTube video and extract outfits with shopping links
 */
export async function processVideoForOutfits(
  youtubeUrl: string,
  characterName: string
): Promise<Outfit[]> {
  console.log('Uploading YouTube URL to Reka Vision Agent...');
  const videoId = await uploadVideoToReka(youtubeUrl);

  // Checking whether the video has been indexed for QA
  let uploadStatus = await checkUploadStatus(videoId);

  while (uploadStatus !== "failed" && uploadStatus !== "indexed") {
    await new Promise(resolve => setTimeout(resolve, 1000))
    uploadStatus = await checkUploadStatus(videoId);
  }
  if (uploadStatus === "failed") {
    throw new Error('Video upload failed');
  }
  // else if (uploadStatus === "indexed") {
  //   good
  //   to
  //   go
  // }

  console.log('Analyzing outfits with Reka Vision...');
  const outfits = await analyzeOutfitsWithRekaVision(videoId, characterName);

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
  console.log(`done!`)
  console.log(outfitsWithLinks);
  return outfitsWithLinks;
}
