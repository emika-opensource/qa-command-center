# QA Command Center

> AI-powered QA testing dashboard with real BrowserBase execution and Claude analysis

![QA Command Center](https://img.shields.io/badge/AI-Powered-8b5cf6?style=for-the-badge)
![BrowserBase](https://img.shields.io/badge/BrowserBase-Enabled-f97316?style=for-the-badge)
![Real Testing](https://img.shields.io/badge/Real-Browser_Tests-22c55e?style=for-the-badge)

## Features

### 🚀 Real Browser Testing
- Runs actual browser sessions via BrowserBase cloud
- Uses Playwright for reliable automation
- Real screenshots captured during testing

### 🤖 AI-Powered Analysis
- Claude analyzes pages for bugs and issues
- Automatic severity classification
- Generates test cases and recommendations

### 📊 Live Progress Tracking
- Watch each test step as it executes
- Real-time status updates
- Duration tracking for each step

## How It Works

1. **Connects to BrowserBase** — Starts a real cloud browser session
2. **Navigates to URL** — Loads your page in the browser
3. **Captures Screenshots** — Takes visual evidence
4. **Analyzes Structure** — Extracts interactive elements, forms, images
5. **AI Review** — Claude analyzes for bugs, accessibility issues, UX problems
6. **Generates Report** — Compiles findings with recommendations

## Setup

### Prerequisites

**BrowserBase Account** (for cloud browser testing)
1. Go to [browserbase.com/sign-up](https://www.browserbase.com/sign-up)
2. Create account (60 min/month free)
3. Copy your **API Key** and **Project ID**

**Anthropic API Key** (for AI analysis)
1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Create account or sign in
3. Generate an API key

### Running Locally

```bash
# Install dependencies
npm install

# Start server
npm start
```

Open http://localhost:3000

### Environment

The app stores credentials in localStorage. For server deployment, you can also set:
- `BROWSERBASE_API_KEY`
- `BROWSERBASE_PROJECT_ID`  
- `ANTHROPIC_API_KEY`

## Architecture

```
┌─────────────────┐
│   Frontend      │  Vue 3 + Tailwind
│   (index.html)  │  Dark theme UI
└────────┬────────┘
         │ REST API
┌────────▼────────┐
│   Backend       │  Express.js
│   (server.js)   │  Test orchestration
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌───▼───┐
│Browser│ │Claude │
│Base   │ │ API   │
│(Cloud)│ │(AI)   │
└───────┘ └───────┘
```

## API Endpoints

### POST /api/test
Start a new test
```json
{
  "url": "https://example.com",
  "prompt": "Test the login flow",
  "config": {
    "browserbaseApiKey": "...",
    "browserbaseProjectId": "...",
    "anthropicApiKey": "..."
  }
}
```

### GET /api/test/:testId
Get test status and results

### GET /api/health
Health check

## What Claude Analyzes

- **Broken Images** — Images that failed to load
- **Missing Alt Text** — Accessibility issues
- **Form Validation** — Required fields, input types
- **Navigation** — Broken links, unclear CTAs
- **UX Issues** — Confusing layouts, missing feedback
- **Performance Indicators** — Large images, slow elements

## License

MIT
