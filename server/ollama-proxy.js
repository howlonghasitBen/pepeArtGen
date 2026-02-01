/**
 * Simple Express proxy for Ollama API
 * Allows browser to communicate with local Ollama instance
 * 
 * Usage:
 *   node server/ollama-proxy.js
 *   
 * Environment variables:
 *   OLLAMA_HOST - Ollama server URL (default: http://localhost:11434)
 *   PORT - Proxy server port (default: 3001)
 *   ALLOWED_ORIGINS - Comma-separated allowed origins (default: http://localhost:5173)
 */

const express = require('express');
const cors = require('cors');

const app = express();

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(o => o.trim());

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ollama: OLLAMA_HOST });
});

// Proxy generate endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { model, prompt, stream = false } = req.body;
    
    if (!model || !prompt) {
      return res.status(400).json({ error: 'Missing model or prompt' });
    }
    
    // Only allow shopkeeper model for security
    const allowedModels = ['surfgod-shopkeeper', 'surfgod-shopkeeper-v2', 'surfgod'];
    if (!allowedModels.includes(model)) {
      return res.status(403).json({ error: 'Model not allowed' });
    }
    
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get response from Ollama',
      details: error.message 
    });
  }
});

// Chat endpoint for shopkeeper (handles conversation history)
app.post('/api/chat/shopkeeper', async (req, res) => {
  try {
    const { messages = [], userMessage, cardContext = '', systemPrompt } = req.body;
    
    if (!userMessage) {
      return res.status(400).json({ error: 'Missing userMessage' });
    }
    
    // Build full prompt with conversation history
    const conversationHistory = messages
      .slice(-6) // Keep last 6 messages for context
      .map(m => `${m.role === 'user' ? 'Player' : 'SurfGod69'}: ${m.content}`)
      .join('\n');
    
    const fullPrompt = `${conversationHistory ? conversationHistory + '\n' : ''}Player: ${userMessage}${cardContext}\n\nSurfGod69:`;
    
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: 'surfgod-shopkeeper-v2',
        prompt: fullPrompt,
        stream: false 
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }
    
    const data = await response.json();
    res.json({ response: data.response });
    
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get response',
      details: error.message 
    });
  }
});

// List available models
app.get('/api/tags', async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`);
    const data = await response.json();
    
    // Filter to only show allowed models
    const allowedModels = ['surfgod-shopkeeper', 'surfgod'];
    data.models = data.models?.filter(m => 
      allowedModels.some(allowed => m.name.startsWith(allowed))
    );
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list models' });
  }
});

app.listen(PORT, () => {
  console.log(`🏄 Ollama proxy running on http://localhost:${PORT}`);
  console.log(`📡 Proxying to: ${OLLAMA_HOST}`);
  console.log(`🔒 Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
