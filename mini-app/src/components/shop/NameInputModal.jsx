import { useState, useCallback } from "react";
import "./NameInputModal.css";

function NameInputModal({ onSubmit, onClose }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter a name");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    if (trimmedName.length > 16) {
      setError("Name must be 16 characters or less");
      return;
    }

    // Basic profanity filter (very basic)
    const bannedWords = ["admin", "mod", "system"];
    if (bannedWords.some((word) => trimmedName.toLowerCase().includes(word))) {
      setError("That name is not allowed");
      return;
    }

    onSubmit(trimmedName);
  }, [name, onSubmit]);

  const handleChange = useCallback((e) => {
    setName(e.target.value);
    setError("");
  }, []);

  const generateRandomName = useCallback(() => {
    const adjectives = [
      "Happy", "Chill", "Surf", "Wave", "Cool", "Rad", "Epic", "Gnarly",
      "Mellow", "Stoked", "Cosmic", "Neon", "Pixel", "Cyber", "Retro"
    ];
    const nouns = [
      "Pepe", "Frog", "Surfer", "Dude", "Rider", "Shark", "Dolphin",
      "Turtle", "Crab", "Whale", "Jellyfish", "Starfish", "Octopus"
    ];
    const numbers = Math.floor(Math.random() * 99) + 1;

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    setName(`${adj}${noun}${numbers}`);
    setError("");
  }, []);

  return (
    <div className="name-modal-overlay">
      <div className="name-modal">
        <div className="name-modal-header">
          <div className="pepe-icon">
            <svg viewBox="0 0 100 100" fill="none">
              {/* Simple Pepe face icon */}
              <circle cx="50" cy="50" r="45" fill="#7cb342" />
              <circle cx="35" cy="40" r="12" fill="#9ccc65" />
              <circle cx="65" cy="40" r="12" fill="#9ccc65" />
              <circle cx="35" cy="40" r="6" fill="white" />
              <circle cx="65" cy="40" r="6" fill="white" />
              <circle cx="35" cy="40" r="3" fill="black" />
              <circle cx="65" cy="40" r="3" fill="black" />
              <path d="M30 65 Q50 80 70 65" stroke="#e53935" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <h2>Welcome to the Surf Shack!</h2>
          <p>Enter your name to join other collectors</p>
        </div>

        <form onSubmit={handleSubmit} className="name-form">
          <div className="input-group">
            <input
              type="text"
              value={name}
              onChange={handleChange}
              placeholder="Your display name..."
              maxLength={16}
              autoFocus
              className={error ? "has-error" : ""}
            />
            <button
              type="button"
              className="random-btn"
              onClick={generateRandomName}
              title="Generate random name"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="char-count">{name.length}/16</div>

          <button type="submit" className="submit-btn">
            <span>Enter the Shack</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>

        <div className="name-modal-footer">
          <p>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Other players can see your name
          </p>
        </div>
      </div>
    </div>
  );
}

export default NameInputModal;
