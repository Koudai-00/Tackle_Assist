# Tackle Assist

A fishing gear management mobile/web application built with Expo (React Native). Helps anglers manage their tackle inventory, plan trips, track maintenance, and get AI-powered gear recommendations.

## Architecture

- **Framework**: Expo (React Native) with Expo Router for file-based routing
- **Language**: TypeScript
- **Package Manager**: npm
- **Database**: Neon (Serverless Postgres) via Drizzle ORM
- **Backend/API**: Hono on Cloudflare Pages Functions (`functions/api/`)
- **AI Integration**: Google Gemini (`@google/genai`)
- **State Management**: Zustand
- **Ads**: Google AdMob (mobile only; stubbed out for web)

## Project Layout

- `app/` - Screens and routing (Expo Router)
  - `app/(tabs)/` - Bottom tab navigation
  - `app/_layout.tsx` - Root layout
- `components/` - Reusable UI components
- `functions/api/` - Hono API backend (Cloudflare Pages Functions)
- `db/` - Drizzle ORM schema and migrations
- `lib/` - Shared library code
- `hooks/` - Custom React hooks
- `utils/` - Utility functions
- `stubs/` - Web platform stubs for native-only modules
- `metro.config.js` - Metro bundler config (web stubs, watchFolders)

## Running Locally

The app runs as a web application on port 5000:

```
npm run dev
```

This starts `expo start --web --port 5000`.

## Workflow

- **Start application**: `npm run dev` on port 5000 (webview)

## Environment Variables

- `DATABASE_URL` - Neon PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key (for AI assistant)
- `YAHOO_CLIENT_ID` - Yahoo Shopping API for barcode scanning (Japan)

## Deployment

Configured as a static site:
- Build: `npm run build` (expo export to `dist/`)
- Public dir: `dist`

## Web Compatibility Notes

- `react-native-google-mobile-ads` is stubbed for web via `stubs/react-native-google-mobile-ads.js` and `metro.config.js`
- Platform-specific files (`*.web.ts`) are used for AdMob initialization and interstitial ads
- Metro watchFolders is restricted to project root to avoid watching `.local/skills`
