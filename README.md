# QA Command Center

> AI-powered QA testing dashboard with BrowserBase integration

![QA Command Center](https://img.shields.io/badge/AI-Powered-8b5cf6?style=for-the-badge)
![BrowserBase](https://img.shields.io/badge/BrowserBase-Enabled-f97316?style=for-the-badge)

## Features

### 🚀 Instant Testing
- Paste any URL and describe what to test
- AI runs tests in real browsers via BrowserBase
- Watch test progress with detailed steps
- Get screenshots at each stage

### 🐛 Automatic Bug Detection
- AI analyzes pages for issues
- Severity classification (Critical/High/Medium/Low)
- Detailed reproduction steps
- Evidence with screenshots

### 📊 Results Dashboard
- Track all test runs
- View pass/fail rates
- Historical trends
- Export reports

## Setup

When you first open QA Command Center, you'll be guided through setup:

### 1. BrowserBase API Key
BrowserBase runs browser tests in the cloud.

1. Go to [browserbase.com/sign-up](https://www.browserbase.com/sign-up)
2. Create a free account (60 min/month free)
3. Copy your **API Key** and **Project ID** from the dashboard

### 2. Anthropic API Key
Claude AI analyzes tests and generates intelligent reports.

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Create an account or sign in
3. Go to **API Keys** and create a new key

## How It Works

1. **Enter URL** — Paste the URL of what you want to test
2. **Describe Test** — Tell the AI what to focus on (or leave blank for exploration)
3. **Watch Progress** — See each step as the browser navigates and tests
4. **Get Results** — Receive bug reports, screenshots, and recommendations

## Tech Stack

- **Frontend**: Vue 3 + Tailwind CSS
- **Browser Automation**: BrowserBase (cloud browsers)
- **AI Analysis**: Claude (Anthropic)

## For Your AI Employee

This dashboard works with your QA Engineer AI Employee:

- Run tests on demand through chat
- Results sync to this dashboard
- AI can file bugs directly to your tracker
- Generate automated Playwright tests

## Design

- 🌙 Dark theme throughout
- 📱 Responsive layout
- 🎨 Calm, minimal aesthetic
- ⚡ Fast and lightweight

## License

MIT
