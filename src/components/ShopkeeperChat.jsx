import React, { useState, useRef, useEffect } from 'react';
import './ShopkeeperChat.css';

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';
const MODEL = 'surfgod-shopkeeper';

export default function ShopkeeperChat({ isOpen, onClose, playerName = 'Player' }) {
  const [messages, setMessages] = useState([
    { role: 'shopkeeper', text: "Yo! Welcome to the shop, bro. What can I get you today? 🏄" }
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
    setMessages(prev => [...prev, { role: 'player', text: userMessage }]);
    setIsLoading(true);

    try {
      // Build conversation context
      const conversationContext = messages
        .slice(-6) // Last 6 messages for context
        .map(m => m.role === 'player' ? `Player: ${m.text}` : `Shopkeeper: ${m.text}`)
        .join('\n');

      const prompt = `${conversationContext}\nPlayer: ${userMessage}\nShopkeeper:`;

      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          prompt: prompt,
          stream: false
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const shopkeeperResponse = data.response?.trim() || "Hmm, got distracted by the waves for a sec. What's up?";

      setMessages(prev => [...prev, { role: 'shopkeeper', text: shopkeeperResponse }]);
    } catch (error) {
      console.error('Shopkeeper error:', error);
      setMessages(prev => [...prev, { 
        role: 'shopkeeper', 
        text: "Whoa, my brain lagged out for a sec. Try again? 🌊" 
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
    <div className="shopkeeper-overlay">
      <div className="shopkeeper-chat">
        <div className="shopkeeper-header">
          <div className="shopkeeper-avatar">🏄</div>
          <div className="shopkeeper-info">
            <h3>SurfGod69</h3>
            <span className="shopkeeper-title">Card Shop Owner</span>
          </div>
          <button className="shopkeeper-close" onClick={onClose}>✕</button>
        </div>

        <div className="shopkeeper-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              {msg.role === 'shopkeeper' && <span className="message-avatar">🏄</span>}
              <div className="message-bubble">
                {msg.text}
              </div>
              {msg.role === 'player' && <span className="message-avatar">🎮</span>}
            </div>
          ))}
          {isLoading && (
            <div className="message shopkeeper">
              <span className="message-avatar">🏄</span>
              <div className="message-bubble typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="shopkeeper-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Chat with the shopkeeper..."
            disabled={isLoading}
          />
          <button onClick={sendMessage} disabled={isLoading || !input.trim()}>
            Send 🌊
          </button>
        </div>
      </div>
    </div>
  );
}
