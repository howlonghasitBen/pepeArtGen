/**
 * ShopkeeperChat.jsx
 * 
 * Interactive AI shopkeeper chat modal.
 * Click the shopkeeper to open and chat about cards, surf lore, etc.
 */

import { useState, useRef, useEffect } from 'react';
import './ShopkeeperChat.css';

const SHOPKEEPER_SYSTEM_PROMPT = `You are surfGod69, the AI shopkeeper at the SURF Waves TCG shop. You're a chill surf bro who knows everything about the card collection and surf finance lore.

Your personality:
- Laid back surfer vibes 🏄
- Knowledgeable about the card collection
- Into schizo conspiracy theories about the ocean and finance
- Uses surf slang naturally
- Helpful but with personality

You can:
- Recommend cards from the collection
- Talk about surf lore and the ocean's secrets
- Discuss trading card strategy
- Share conspiracy theories about kelp networks and Dutch oceanic frequency control
- Help users navigate the shop

Keep responses concise (2-3 sentences usually). Be fun and engaging.`;

function ShopkeeperChat({ isOpen, onClose, cards = [] }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Yo! Welcome to the SURF Waves shop 🏄 What can I help you with? Looking for cards, or just wanna chat about the ocean's secrets?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Build context about available cards
      const cardContext = cards.length > 0 
        ? `\n\nAvailable cards in the shop:\n${cards.slice(0, 10).map(c => `- ${c.name} (${c.rarity || 'unknown rarity'})`).join('\n')}`
        : '';

      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/chat/shopkeeper`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            userMessage,
            cardContext,
            systemPrompt: SHOPKEEPER_SYSTEM_PROMPT
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        // Fallback response if API fails
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "Whoa, got a bit waterlogged there 🌊 Try asking again?" 
        }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "The kelp network is down rn... try again in a sec 🏄" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="shopkeeper-chat-overlay" onClick={onClose}>
      <div className="shopkeeper-chat-modal" onClick={e => e.stopPropagation()}>
        <div className="shopkeeper-chat-header">
          <div className="shopkeeper-avatar">🏄</div>
          <div className="shopkeeper-info">
            <h3>surfGod69</h3>
            <span className="shopkeeper-status">Shopkeeper • Online</span>
          </div>
          <button className="chat-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="shopkeeper-chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              {msg.role === 'assistant' && <span className="msg-avatar">🏄</span>}
              <div className="msg-content">{msg.content}</div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message assistant">
              <span className="msg-avatar">🏄</span>
              <div className="msg-content typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="shopkeeper-chat-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about cards, surf lore..."
            disabled={isLoading}
          />
          <button onClick={sendMessage} disabled={isLoading || !input.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShopkeeperChat;
