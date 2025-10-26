export interface OutfitPiece {
  name: string;
  description: string;
  shoppingLink?: string;
}

export interface Outfit {
  id: string;
  imageUrl: string;
  description: string;
  pieces: OutfitPiece[];
}

export interface SessionData {
  sessionId: string;
  characterName: string;
  youtubeUrl: string;
  outfits: Outfit[];
  createdAt: Date;
}
