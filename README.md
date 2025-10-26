# elle - Outfit Gallery from Videos

A minimalistic web app that analyzes YouTube videos to identify and catalog outfits worn by specific characters or people. Built with Next.js and powered by Reka's Vision and Research APIs.

## Features

- **Video Analysis**: Upload a YouTube video link and specify a character name
- **Outfit Detection**: Automatically identifies distinct outfits using Reka's Vision API
- **Detailed Breakdown**: Lists each outfit piece with detailed descriptions
- **Shopping Links**: Finds matching items for sale online using Reka's Research API
- **Gallery View**: Beautiful grid layout to browse all identified outfits
- **Interactive Details**: Click any outfit to see pieces and shopping links

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: Reka Vision API (video analysis), Reka Research API (shopping links)
- **Video Processing**: ytdl-core for YouTube video downloads

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd elle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the example environment file and add your Reka API key:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your Reka API key:
   ```
   REKA_API_KEY=your_reka_api_key_here
   ```

   You can obtain a Reka API key from [https://platform.reka.ai/](https://platform.reka.ai/)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Enter a YouTube URL**: Paste the link to any YouTube video
2. **Specify character name**: Enter the name of the person or character whose outfits you want to analyze
3. **Click "Find Outfits"**: The app will download the video, upload it to Reka, and analyze the outfits
4. **Browse the gallery**: View all identified outfits in a grid layout
5. **Click any outfit**: See detailed information about each piece and shop for similar items

## How It Works

1. **Video Download**: The app downloads the YouTube video using ytdl-core
2. **Reka Upload**: The video is uploaded to Reka's `/videos/upload` endpoint
3. **Vision Analysis**: Reka's Vision API analyzes the video to identify distinct outfits and their components
4. **Research Integration**: Reka's Research API finds matching items for sale online
5. **Gallery Display**: Results are displayed in an elegant gallery with interactive modals

## Architecture

- **No Database Required**: Session data is stored in-memory (sessions expire after 1 hour)
- **No Authentication**: Simple, straightforward usage without user accounts
- **Stateless Frontend**: All state is managed through URL parameters and API calls
- **Modular API**: Separate services for Reka integration, storage, and type definitions

## File Structure

```
elle/
├── app/
│   ├── page.tsx              # Landing page with form
│   ├── gallery/
│   │   └── page.tsx          # Gallery view with outfit grid and modal
│   └── api/
│       ├── analyze/
│       │   └── route.ts      # API endpoint for video analysis
│       └── outfits/
│           └── route.ts      # API endpoint for fetching outfits
├── lib/
│   ├── types.ts              # TypeScript type definitions
│   ├── store.ts              # In-memory session storage
│   └── reka-service.ts       # Reka API integration
└── .env.example              # Environment variables template
```

## Limitations

- **In-Memory Storage**: Sessions are stored in memory and will be lost on server restart
- **Processing Time**: Video analysis can take several minutes depending on video length
- **YouTube Access**: Some videos may be restricted or unavailable for download
- **Session Expiry**: Sessions automatically expire after 1 hour

## Production Considerations

For production deployment, consider:

- Replace in-memory storage with a proper database (PostgreSQL, MongoDB, etc.)
- Implement background job processing for video analysis
- Add rate limiting and API key management
- Implement caching for analyzed videos
- Add user authentication and session management
- Deploy to a scalable platform (Vercel, AWS, etc.)

## License

MIT

## Credits

Built with [Reka AI](https://www.reka.ai/) - Vision and Research APIs
