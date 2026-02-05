/**
 * QA Command Center Backend
 * 
 * Runs real browser tests via BrowserBase and analyzes with Claude AI
 */

const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright-core');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Store for active test sessions
const activeSessions = new Map();

/**
 * Run a test on a URL using BrowserBase + Claude
 */
app.post('/api/test', async (req, res) => {
  const { url, prompt, options = {} } = req.body;
  const { browserbaseApiKey, browserbaseProjectId, anthropicApiKey } = req.body.config || {};
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  if (!browserbaseApiKey || !browserbaseProjectId) {
    return res.status(400).json({ error: 'BrowserBase credentials required' });
  }
  
  if (!anthropicApiKey) {
    return res.status(400).json({ error: 'Anthropic API key required' });
  }

  const testId = Date.now().toString();
  const testState = {
    id: testId,
    url,
    prompt,
    status: 'running',
    steps: [],
    screenshots: [],
    bugs: [],
    startTime: Date.now()
  };
  
  activeSessions.set(testId, testState);
  
  // Return immediately with test ID, run test in background
  res.json({ testId, status: 'started' });
  
  // Run test asynchronously
  runTest(testId, url, prompt, options, {
    browserbaseApiKey,
    browserbaseProjectId,
    anthropicApiKey
  }).catch(err => {
    console.error('Test failed:', err);
    const state = activeSessions.get(testId);
    if (state) {
      state.status = 'error';
      state.error = err.message;
    }
  });
});

/**
 * Get test status and results
 */
app.get('/api/test/:testId', (req, res) => {
  const { testId } = req.params;
  const state = activeSessions.get(testId);
  
  if (!state) {
    return res.status(404).json({ error: 'Test not found' });
  }
  
  res.json(state);
});

/**
 * Main test execution function
 */
async function runTest(testId, url, prompt, options, config) {
  const state = activeSessions.get(testId);
  const addStep = (title, description) => {
    const step = { title, description, status: 'running', startTime: Date.now() };
    state.steps.push(step);
    return step;
  };
  
  const completeStep = (step, status = 'done') => {
    step.status = status;
    step.duration = `${((Date.now() - step.startTime) / 1000).toFixed(1)}s`;
  };

  let browser = null;
  
  try {
    // Step 1: Connect to BrowserBase
    let step = addStep('Connecting to BrowserBase', 'Starting cloud browser session...');
    
    const wsEndpoint = `wss://connect.browserbase.com?apiKey=${config.browserbaseApiKey}&projectId=${config.browserbaseProjectId}`;
    
    browser = await chromium.connectOverCDP(wsEndpoint, {
      timeout: 60000
    });
    
    completeStep(step);
    
    // Step 2: Navigate to URL
    step = addStep('Loading page', url);
    
    const context = browser.contexts()[0] || await browser.newContext();
    const page = await context.newPage();
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    completeStep(step);
    
    // Step 3: Take initial screenshot
    step = addStep('Capturing initial state', 'Taking screenshot of loaded page...');
    
    const screenshot1 = await page.screenshot({ 
      fullPage: false,
      type: 'jpeg',
      quality: 80
    });
    const screenshot1Base64 = `data:image/jpeg;base64,${screenshot1.toString('base64')}`;
    state.screenshots.push({ name: 'initial', data: screenshot1Base64 });
    
    completeStep(step);
    
    // Step 4: Analyze page structure
    step = addStep('Analyzing page structure', 'Extracting interactive elements...');
    
    const pageContent = await page.evaluate(() => {
      // Get all interactive elements
      const interactiveElements = [];
      
      // Buttons
      document.querySelectorAll('button, [role="button"], input[type="submit"]').forEach(el => {
        interactiveElements.push({
          type: 'button',
          text: el.textContent?.trim() || el.value || '',
          visible: el.offsetParent !== null
        });
      });
      
      // Links
      document.querySelectorAll('a[href]').forEach(el => {
        interactiveElements.push({
          type: 'link',
          text: el.textContent?.trim() || '',
          href: el.href,
          visible: el.offsetParent !== null
        });
      });
      
      // Forms
      document.querySelectorAll('form').forEach(form => {
        const inputs = Array.from(form.querySelectorAll('input, textarea, select')).map(input => ({
          type: input.type || input.tagName.toLowerCase(),
          name: input.name || input.id || '',
          required: input.required
        }));
        interactiveElements.push({
          type: 'form',
          action: form.action,
          inputs
        });
      });
      
      // Images
      const images = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt,
        loaded: img.complete && img.naturalHeight !== 0
      }));
      
      // Get page title and meta
      const title = document.title;
      const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
      
      // Check for console errors (if any were captured)
      const bodyText = document.body.innerText.substring(0, 5000);
      
      return {
        title,
        metaDescription,
        interactiveElements: interactiveElements.slice(0, 50), // Limit for API
        images: images.slice(0, 20),
        bodyText,
        url: window.location.href
      };
    });
    
    completeStep(step);
    
    // Step 5: Run test scenarios based on prompt
    step = addStep('Running test scenarios', prompt || 'Exploring main features...');
    
    // Perform some basic interactions
    const interactions = [];
    
    // Try clicking main navigation links
    const navLinks = await page.$$('nav a, header a, [role="navigation"] a');
    if (navLinks.length > 0 && navLinks.length <= 5) {
      for (const link of navLinks.slice(0, 3)) {
        try {
          const text = await link.textContent();
          if (text && text.trim()) {
            interactions.push({ type: 'found_nav', text: text.trim() });
          }
        } catch (e) {}
      }
    }
    
    // Check for forms
    const forms = await page.$$('form');
    for (const form of forms) {
      try {
        const inputs = await form.$$('input:not([type="hidden"]), textarea, select');
        interactions.push({ 
          type: 'found_form', 
          inputCount: inputs.length 
        });
      } catch (e) {}
    }
    
    completeStep(step);
    
    // Step 6: Take screenshot after interaction
    step = addStep('Capturing test evidence', 'Taking additional screenshots...');
    
    // Scroll down to capture more content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);
    
    const screenshot2 = await page.screenshot({ 
      fullPage: false,
      type: 'jpeg',
      quality: 80
    });
    const screenshot2Base64 = `data:image/jpeg;base64,${screenshot2.toString('base64')}`;
    state.screenshots.push({ name: 'scrolled', data: screenshot2Base64 });
    
    completeStep(step);
    
    // Step 7: AI Analysis
    step = addStep('AI analyzing results', 'Claude is reviewing the page for issues...');
    
    const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
    
    const analysisPrompt = `You are a QA Engineer analyzing a web page for bugs and issues.

URL: ${url}
User's test request: ${prompt || 'General quality check'}

Page Information:
- Title: ${pageContent.title}
- Description: ${pageContent.metaDescription}
- Interactive elements found: ${pageContent.interactiveElements.length}
- Images found: ${pageContent.images.length}
- Forms found: ${pageContent.interactiveElements.filter(e => e.type === 'form').length}

Page structure:
${JSON.stringify(pageContent.interactiveElements.slice(0, 20), null, 2)}

Images status:
${JSON.stringify(pageContent.images.slice(0, 10), null, 2)}

Analyze this page and identify:
1. Any potential bugs or issues (broken images, missing alt text, accessibility issues, UX problems)
2. Areas that need testing attention
3. Recommendations for improvement

Format your response as JSON:
{
  "bugs": [
    {
      "severity": "critical|high|medium|low",
      "title": "Brief title",
      "description": "Detailed description",
      "recommendation": "How to fix"
    }
  ],
  "testCases": [
    {
      "name": "Test case name",
      "steps": ["Step 1", "Step 2"],
      "expectedResult": "What should happen"
    }
  ],
  "summary": "Overall assessment",
  "passedChecks": ["List of things that look good"]
}`;

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        { role: 'user', content: analysisPrompt }
      ]
    });
    
    let analysis;
    try {
      const responseText = aiResponse.content[0].text;
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || 
                        responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        analysis = { bugs: [], summary: responseText, testCases: [], passedChecks: [] };
      }
    } catch (e) {
      analysis = { 
        bugs: [], 
        summary: aiResponse.content[0].text, 
        testCases: [],
        passedChecks: [] 
      };
    }
    
    completeStep(step);
    
    // Step 8: Generate report
    step = addStep('Generating report', 'Compiling test results...');
    
    state.bugs = analysis.bugs || [];
    state.testCases = analysis.testCases || [];
    state.summary = analysis.summary;
    state.passedChecks = analysis.passedChecks || [];
    state.pageInfo = {
      title: pageContent.title,
      elementsFound: pageContent.interactiveElements.length,
      imagesFound: pageContent.images.length
    };
    
    completeStep(step);
    
    // Complete test
    state.status = 'completed';
    state.passed = (state.bugs.filter(b => b.severity === 'critical' || b.severity === 'high').length === 0);
    state.duration = `${((Date.now() - state.startTime) / 1000).toFixed(1)}s`;
    
  } catch (error) {
    console.error('Test error:', error);
    state.status = 'error';
    state.error = error.message;
    
    // Mark current step as failed
    const currentStep = state.steps.find(s => s.status === 'running');
    if (currentStep) {
      currentStep.status = 'failed';
      currentStep.error = error.message;
    }
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`QA Command Center running on port ${PORT}`);
});
