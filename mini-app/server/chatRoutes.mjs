import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();

// Initialize Claude
const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

/**
 * POST /api/chat/shopkeeper
 * Chat with the AI shopkeeper (surfGod69) - powered by Claude
 */
router.post('/shopkeeper', async (req, res) => {
  try {
    const { messages, userMessage, cardContext, systemPrompt } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    // If no AI configured, return a fallback response
    if (!anthropic) {
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

    // Build conversation history for Claude
    const conversationHistory = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // Add the new user message with context
    const fullUserMessage = cardContext 
      ? `${userMessage}\n\n[Context - cards in shop: ${cardContext}]`
      : userMessage;

    conversationHistory.push({
      role: 'user',
      content: fullUserMessage
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      system: systemPrompt,
      messages: conversationHistory
    });

    const responseText = response.content[0]?.text || "The waves took my words... try again? 🌊";

    res.json({ response: responseText });
  } catch (error) {
    console.error('[Chat] Shopkeeper error:', error);
    
    // Friendly fallback on error
    res.json({ 
      response: "Whoa, got a bit waterlogged there 🌊 The reef might be interfering with my signal. Try again?" 
    });
  }
});

export default router;
