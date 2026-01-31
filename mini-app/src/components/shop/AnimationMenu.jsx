/**
 * AnimationMenu.jsx
 * 
 * Emote wheel for selecting character animations.
 * Press 'E' to toggle, click animation to play.
 */

import { useState, useEffect, useCallback } from 'react';
import './AnimationMenu.css';

// Map animation names to friendly labels and emojis
const ANIMATION_META = {
  'Walking': { label: 'Walk', emoji: '🚶' },
  'Running': { label: 'Run', emoji: '🏃' },
  'Idle': { label: 'Idle', emoji: '🧍' },
  'Wave': { label: 'Wave', emoji: '👋' },
  'Dance': { label: 'Dance', emoji: '💃' },
  'Jump': { label: 'Jump', emoji: '🦘' },
  'Cheer': { label: 'Cheer', emoji: '🎉' },
  'Clap': { label: 'Clap', emoji: '👏' },
  'Bow': { label: 'Bow', emoji: '🙇' },
  'Sit': { label: 'Sit', emoji: '🪑' },
  'Sleep': { label: 'Sleep', emoji: '😴' },
  'Surf': { label: 'Surf', emoji: '🏄' },
  'Swim': { label: 'Swim', emoji: '🏊' },
  'Flex': { label: 'Flex', emoji: '💪' },
  'Laugh': { label: 'Laugh', emoji: '😂' },
  'Cry': { label: 'Cry', emoji: '😢' },
  'Think': { label: 'Think', emoji: '🤔' },
  'Point': { label: 'Point', emoji: '👉' },
  'Salute': { label: 'Salute', emoji: '🫡' },
  'Dab': { label: 'Dab', emoji: '🕺' },
  // Fallback for unknown animations
  'default': { label: null, emoji: '🎭' }
};

function AnimationMenu({ 
  animations = [], 
  onSelectAnimation, 
  isOpen, 
  onToggle,
  currentAnimation 
}) {
  const [hoveredAnim, setHoveredAnim] = useState(null);

  // Keyboard shortcut to toggle menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'e' || e.key === 'E') {
        // Don't toggle if typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        onToggle();
      }
      // Number keys 1-9 for quick emotes
      if (isOpen && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (animations[index]) {
          onSelectAnimation(animations[index]);
          onToggle();
        }
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        onToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onToggle, animations, onSelectAnimation]);

  // Filter out movement animations for the emote menu
  const emoteAnimations = animations.filter(
    anim => !['Walking', 'Running'].includes(anim)
  );

  const getAnimMeta = (animName) => {
    return ANIMATION_META[animName] || { 
      label: animName, 
      emoji: ANIMATION_META.default.emoji 
    };
  };

  if (!isOpen) {
    return (
      <button 
        className="emote-toggle-btn"
        onClick={onToggle}
        title="Emotes (E)"
      >
        🎭
      </button>
    );
  }

  return (
    <div className="animation-menu-overlay" onClick={onToggle}>
      <div className="animation-menu" onClick={e => e.stopPropagation()}>
        <div className="animation-menu-header">
          <h3>🎭 Emotes</h3>
          <span className="menu-hint">Press E to close</span>
        </div>
        
        <div className="animation-grid">
          {emoteAnimations.map((anim, index) => {
            const meta = getAnimMeta(anim);
            const isActive = currentAnimation === anim;
            const isHovered = hoveredAnim === anim;
            
            return (
              <button
                key={anim}
                className={`animation-btn ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
                onClick={() => {
                  onSelectAnimation(anim);
                  onToggle();
                }}
                onMouseEnter={() => setHoveredAnim(anim)}
                onMouseLeave={() => setHoveredAnim(null)}
                title={meta.label || anim}
              >
                <span className="anim-emoji">{meta.emoji}</span>
                <span className="anim-label">{meta.label || anim}</span>
                {index < 9 && (
                  <span className="anim-hotkey">{index + 1}</span>
                )}
              </button>
            );
          })}
        </div>

        {emoteAnimations.length === 0 && (
          <div className="no-emotes">
            <p>No emote animations available</p>
            <p className="hint">The model only has Walking/Running</p>
          </div>
        )}

        <div className="animation-menu-footer">
          <span>Available: {emoteAnimations.length} emotes</span>
        </div>
      </div>
    </div>
  );
}

export default AnimationMenu;
