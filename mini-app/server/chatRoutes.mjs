import express from 'express';
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

// Initialize Gemini
const genAI = process.env.GOOGLE_AI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })
  : null;

/**
 * POST /api/chat/shopkeeper
 * Chat with the AI shopkeeper (surfGod69)
 */
router.post('/shopkeeper', async (req, res) => {
  try {
    const { messages, userMessage, cardContext, systemPrompt } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    // If no AI configured, return a fallback response
    if (!genAI) {
      const fallbackResponses = [
        "Yo! The kelp network is vibing weird today... can't fully connect 🌊",
        "Waves are choppy rn, try again later dude 🏄",
        "The ocean's keeping its secrets today... but I'm always here to chat about cards!",
        "Surf's up but my brain's buffering... ask me anything about the collection tho!"
      ];
      return res.json({ 
        response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
      });
    }

    // Build the conversation
    const conversationHistory = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Add the new user message with context
    const fullUserMessage = cardContext 
      ? `${userMessage}\n\n[Context for shopkeeper: ${cardContext}]`
      : userMessage;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt
    });

    const chat = model.startChat({
      history: conversationHistory,
    });

    const result = await chat.sendMessage(fullUserMessage);
    const response = result.response.text();

    res.json({ response });
  } catch (error) {
    console.error('[Chat] Shopkeeper error:', error);
    
    // Friendly fallback on error
    res.json({ 
      response: "Whoa, got a bit waterlogged there 🌊 The reef might be interfering with my signal. Try again?" 
    });
  }
});

export default router;
