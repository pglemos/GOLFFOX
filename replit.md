# GolfFox Web Application

## Overview
GolfFox is a corporate transport management web application built with Next.js 16. It provides fleet management, route optimization, and real-time monitoring with AI intelligence.

## Project Structure
- `apps/web/` - Main Next.js web application
- `apps/mobile/` - Mobile application (backup)
- Root `package.json` - Workspace scripts that delegate to apps/web

## Key Technologies
- **Framework**: Next.js 16 with React 19
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Maps**: Google Maps API
- **UI Components**: Radix UI, Framer Motion
- **Authentication**: NextAuth.js

## Development
The dev server runs on port 5000 with webpack bundler:
```bash
cd apps/web && npm run dev
```

## Environment Variables
The application requires:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key

## Build
```bash
cd apps/web && npm run build
```

## Deployment
Uses standalone output mode for production deployment.
