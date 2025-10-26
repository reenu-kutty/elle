import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { processVideoForOutfits } from '@/lib/reka-service';
import { sessionStore } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { youtubeUrl, characterName } = body;

    if (!youtubeUrl || !characterName) {
      return NextResponse.json(
        { error: 'YouTube URL and character name are required' },
        { status: 400 }
      );
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Check for Reka API key
    if (!process.env.REKA_API_KEY) {
      return NextResponse.json(
        { error: 'Reka API key not configured' },
        { status: 500 }
      );
    }

    // Generate session ID
    const sessionId = randomUUID();

    // Process video asynchronously (in real-world, this should be a background job)
    // For now, we'll do it synchronously but with a timeout
    const outfits = await processVideoForOutfits(youtubeUrl, characterName);

    // Store session data
    sessionStore.set(sessionId, {
      sessionId,
      characterName,
      youtubeUrl,
      outfits,
      createdAt: new Date(),
    });

    return NextResponse.json({
      sessionId,
      message: 'Video analyzed successfully',
    });
  } catch (error) {
    console.error('Error in analyze API:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to analyze video',
      },
      { status: 500 }
    );
  }
}
