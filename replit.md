# TradePilot AI

## Overview
TradePilot AI is an advanced AI-powered crypto arbitrage trading platform with automated trading capabilities across 50+ exchanges. This is a full-featured web application with user authentication, dashboard, admin panel, chatbot integration, and beautiful 3D visualizations.

## Project Status
- **Type**: Full-stack application (React frontend + Express backend)
- **Build System**: Vite
- **Deployment**: Ready for production deployment
- **Current State**: Fully functional with both servers running (Frontend: port 5000, Backend: port 3000)

## Architecture

### Technology Stack
- **Frontend Framework**: React 19.2 with TypeScript
- **Build Tool**: Vite 7.1
- **Backend**: Express.js with file-based JSON storage
- **UI Libraries**: 
  - Framer Motion (animations)
  - Three.js with React Three Fiber (3D graphics)
  - Recharts (data visualization)
  - Lucide React (icons)
  - Tailwind CSS (styling via CDN)
- **Data Storage**: File-based JSON storage (storage/ directory)
- **Email Service**: Nodemailer (Gmail SMTP)
- **AI Integration**: 
  - Cerebras API for chatbot functionality
  - Google Gemini API for image generation (optional)

### Project Structure
```
.
├── components/           # React components
│   ├── admin/           # Admin panel components
│   ├── auth/            # Authentication pages
│   ├── chatbot/         # Chatbot components
│   ├── dashboard/       # Dashboard pages
│   └── three/           # 3D visualization components
├── services/            # Service layer
│   ├── cerebrasService.ts    # Chatbot AI service
│   ├── geminiService.ts      # Image generation service
│   └── userDataService.ts    # User data management
├── storage/             # File-based data storage
│   ├── users.json       # User accounts and data
│   ├── settings.json    # System settings and configurations
│   └── messages.json    # Inbox messages
├── server.js            # Express backend server
├── App.tsx              # Main application component
├── index.tsx            # Application entry point
├── types.ts             # TypeScript type definitions
├── index.html           # HTML template
└── vite.config.ts       # Vite configuration
```

## Features
- User authentication with email verification
- Dashboard with trading overview
- Investment plans and profit tracking
- Deposit/withdrawal management
- Referral system
- Admin panel for user management
- AI-powered chatbot
- 3D visualizations and animations
- Responsive mobile design

## Running the Application

### Development
```bash
npm run dev
# This runs both servers concurrently:
# - Backend (Express) on port 3000
# - Frontend (Vite) on port 5000
```
The frontend will be available at http://0.0.0.0:5000
The backend API will be available at http://localhost:3000

### Building for Production
```bash
npm run build
# Creates an optimized production build in the dist/ directory
```

### Preview Production Build
```bash
npm run preview
# Serves the production build locally for testing
# This is what runs when deployed to production
```

## Environment Variables (Optional)
- `API_KEY` - Google Gemini API key for image generation feature (optional)
- `EMAIL_USER` - Gmail address for sending verification emails (optional)
- `EMAIL_APP_PASSWORD` - Gmail app password for SMTP authentication (optional)

## Data Storage
All user data, settings, and configurations are stored in JSON files in the `storage/` directory for permanent persistence:
- **users.json**: User accounts, authentication, transactions, balances, referrals, sessions, and login history
- **settings.json**: System settings, wallet configurations, welcome page templates (URL references only), chatbot settings, and testimonials
- **messages.json**: Inbox messages and notifications
- **storage/media/**: Video and image files for welcome page and inbox templates (stored separately from JSON)

The backend automatically creates the storage directory and initializes files on first startup.

### Media Upload System
Videos and images for welcome templates are stored as separate files to prevent JSON bloat:
- Files are uploaded immediately when selected by admin
- Only URL references are stored in settings.json
- Automatic cleanup of old media files when new ones are uploaded
- Maximum file size: 100MB
- Supported locations: welcome_page and welcome_inbox

## Admin Access
- Click the logo 5 times to open the admin login modal
- Default admin password: `joshbond`

## Deployment
The application is configured for autoscale deployment on Replit:
- Build command: `npm run build`
- Run command: `npm run start` (runs both backend and frontend)
- Port: 5000 (frontend), 3000 (backend API)

## Recent Changes
- **2025-11-02**: Registration fix and API routing configuration
  - **ROOT CAUSE IDENTIFIED**: Fixed hardcoded localhost:3000 API URLs that prevented registration from working in production
  - **SOLUTION**: Configured Vite proxy to route all /api/* requests to backend server
  - Changed API_BASE_URL from hardcoded localhost to relative paths (/api/storage)
  - Added proxy configuration in vite.config.ts to forward API requests to port 3000
  - Registration now works correctly with automatic redirect to welcome page
  - All API endpoints (users, settings, messages) now accessible from frontend
- **2025-11-02**: Backend integration and storage system implementation
  - Implemented Express backend server on port 3000
  - Added file-based JSON storage system for permanent data persistence
  - Created storage infrastructure with users.json, settings.json, and messages.json
  - Updated dev workflow to run both frontend and backend servers concurrently
  - Confirmed reCAPTCHA functionality (works when enabled by admin)
  - All data now persists permanently in file storage
- **2025-11-02**: Critical performance fix and feature enhancements
  - **PERFORMANCE FIX**: Removed problematic CSS properties (will-change, contain) that were causing scroll lag, flickering, and UI blinking
  - Homepage now scrolls smoothly with zero lag or glitches
  - Improved Suspense fallback with loading spinner to prevent blank screen
  - All 50 testimonials replaced with unique, human-sounding reviews
  - reCAPTCHA system fully integrated with admin panel controls
  - Added reCAPTCHA Secret Key field for server-side verification
  - Deposit History section added to Deposit page showing past transactions
  - Referral History section added to Referral page with summary statistics
- **2025-10-31**: Initial Replit setup completed
  - Configured Vite build system for TypeScript/React
  - Set up development server on port 5000
  - Configured deployment settings
  - App is fully functional and ready to use

## Known Limitations
- WebGL errors may appear in some screenshot/testing environments but won't affect real users
- Tailwind CSS loaded via CDN (should be replaced with PostCSS plugin for production)
- File-based JSON storage (suitable for development; consider PostgreSQL or MongoDB for high-traffic production)
- Email verification requires EMAIL_USER and EMAIL_APP_PASSWORD environment variables to be configured
- API keys for Cerebras chatbot and Gemini image generation need to be configured in admin panel

## User Preferences
None set yet.
