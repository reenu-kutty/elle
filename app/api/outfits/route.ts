import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/store';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const sessionData = sessionStore.get(sessionId);

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      outfits: sessionData.outfits,
      characterName: sessionData.characterName,
    });
  } catch (error) {
    console.error('Error in outfits API:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch outfits',
      },
      { status: 500 }
    );
  }
}
