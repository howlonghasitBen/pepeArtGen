/**
 * AnimationMenu.jsx
 * 
 * Emote wheel for selecting character animations.
 * Press 'E' to toggle, click animation to play.
 */

import { useState, useEffect } from 'react';
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
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        onToggle();
      }
      if (isOpen && e.key >= '1' && e.key <= '9') {
        const emotes = animations.filter(a => !['Walking', 'Running'].includes(a));
        const index = parseInt(e.key) - 1;
        if (emotes[index]) {
          onSelectAnimation(emotes[index]);
          onToggle();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onToggle, animations, onSelectAnimation]);

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
      <button className="emote-toggle-btn" onClick={onToggle} title="Emotes (E)">
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
            
            return (
              <button
                key={anim}
                className={`animation-btn ${isActive ? 'active' : ''}`}
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
                {index < 9 && <span className="anim-hotkey">{index + 1}</span>}
              </button>
            );
          })}
        </div>

        {emoteAnimations.length === 0 && (
          <div className="no-emotes">
            <p>No emote animations available</p>
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
