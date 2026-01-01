import { useState, useCallback, useRef, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';

/**
 * Card Parts Schema - defines all editable parts of a card
 */
export const CARD_PARTS = {
  identity: {
    label: 'Identity',
    icon: '🏷️',
    fields: {
      name: { type: 'string', label: 'Name', placeholder: 'Card Name' },
      subtitle: { type: 'string', label: 'Subtitle', placeholder: '⟨Generated⟩' },
      type: {
        type: 'select',
        label: 'Type',
        options: ['Creature', 'Spell', 'Terrain', 'Artifact', 'Equipment']
      },
      level: { type: 'number', label: 'Level', min: 1, max: 10 }
    }
  },
  stats: {
    label: 'Combat Stats',
    icon: '⚔️',
    fields: {
      hp: { type: 'number', label: 'HP', min: 1, max: 20 },
      attack: { type: 'number', label: 'Attack', min: 0, max: 15 },
      defense: { type: 'number', label: 'Defense', min: 0, max: 15 },
      mana: { type: 'number', label: 'Mana Cost', min: 0, max: 10 },
      speed: { type: 'number', label: 'Speed', min: 1, max: 10 }
    }
  },
  abilities: {
    label: 'Abilities',
    icon: '✨',
    fields: {
      moveName: { type: 'string', label: 'Move Name', placeholder: 'Shadow Strike' },
      moveDescription: {
        type: 'textarea',
        label: 'Move Description',
        placeholder: 'Deal 3 damage to target creature...',
        rows: 3
      },
      passiveAbility: {
        type: 'textarea',
        label: 'Passive Ability (Optional)',
        placeholder: 'When this creature enters play...',
        rows: 2,
        optional: true
      }
    }
  },
  visuals: {
    label: 'Visuals',
    icon: '🎨',
    fields: {
      imageData: { type: 'image', label: 'Card Image' },
      colorPalette: { type: 'palette', label: 'Color Palette' }
    }
  },
  flavor: {
    label: 'Flavor',
    icon: '📜',
    fields: {
      flavorText: {
        type: 'textarea',
        label: 'Flavor Text',
        placeholder: 'Where shadows gather, light trembles...',
        rows: 4
      },
      artist: { type: 'string', label: 'Artist', placeholder: 'Waves TCG' },
      rarity: {
        type: 'select',
        label: 'Rarity',
        options: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', '1/1']
      },
      setName: { type: 'string', label: 'Set Name (Optional)', placeholder: 'Genesis', optional: true }
    }
  },
  terrain: {
    label: 'Terrain',
    icon: '🌍',
    fields: {
      terrainType: {
        type: 'select',
        label: 'Terrain Type',
        options: ['Fire', 'Water', 'Earth', 'Air', 'Shadow', 'Light', 'Neutral']
      },
      terrainBonus: {
        type: 'textarea',
        label: 'Terrain Bonus (Optional)',
        placeholder: '+1 ATK when on Fire terrain',
        rows: 2,
        optional: true
      }
    }
  }
};

/**
 * Default card state
 */
const DEFAULT_CARD = {
  name: 'Untitled Card',
  subtitle: '⟨Draft⟩',
  type: 'Creature',
  level: 1,
  stats: {
    hp: 5,
    attack: 3,
    defense: 3,
    speed: 5
  },
  manaCost: [
    { type: 'hp', value: 5, color: 'radial-gradient(circle, #ff6b6b, #c0392b)', textColor: '#fff' },
    { type: 'mana', value: 3, color: 'radial-gradient(circle, #74b9ff, #0984e3)', textColor: '#fff' },
    { type: 'terrain', value: '?', color: 'radial-gradient(circle, #a29bfe, #6c5ce7)', textColor: '#fff' }
  ],
  moveName: '',
  moveDescription: '',
  passiveAbility: '',
  flavorText: '',
  artist: 'Waves TCG',
  rarity: '1/1',
  setName: '',
  terrainType: 'Neutral',
  terrainBonus: '',
  imageData: null,
  colors: null,
  theme: null
};

/**
 * Custom hook for card editor state management
 */
export function useCardEditor(initialCard = null) {
  const { address } = useWeb3();

  // Current card state
  const [card, setCard] = useState(initialCard || DEFAULT_CARD);

  // Draft management
  const [draftId, setDraftId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Undo/redo history
  const [history, setHistory] = useState([initialCard || DEFAULT_CARD]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const maxHistory = 50;

  // Selected part for editing
  const [selectedPart, setSelectedPart] = useState('identity');

  // Auto-save timer
  const autoSaveTimer = useRef(null);

  /**
   * Update a single field in the card
   */
  const updateField = useCallback((fieldPath, value) => {
    setCard(prevCard => {
      const newCard = { ...prevCard };

      // Handle nested paths like 'stats.attack'
      const parts = fieldPath.split('.');
      let current = newCard;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current[parts[i]] = { ...current[parts[i]] };
        current = current[parts[i]];
      }

      current[parts[parts.length - 1]] = value;

      // Update mana cost orbs when stats change
      if (fieldPath === 'stats.hp' || fieldPath === 'stats.mana' || fieldPath === 'terrainType') {
        newCard.manaCost = [
          {
            type: 'hp',
            value: newCard.stats?.hp || 5,
            color: 'radial-gradient(circle, #ff6b6b, #c0392b)',
            textColor: '#fff'
          },
          {
            type: 'mana',
            value: newCard.stats?.mana || 3,
            color: 'radial-gradient(circle, #74b9ff, #0984e3)',
            textColor: '#fff'
          },
          {
            type: 'terrain',
            value: getTerrainSymbol(newCard.terrainType),
            color: getTerrainColor(newCard.terrainType),
            textColor: '#fff'
          }
        ];
      }

      return newCard;
    });

    setIsDirty(true);

    // Add to history
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(card);
      if (newHistory.length > maxHistory) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, maxHistory - 1));
  }, [card, historyIndex]);

  /**
   * Update multiple fields at once
   */
  const updateFields = useCallback((updates) => {
    Object.entries(updates).forEach(([path, value]) => {
      updateField(path, value);
    });
  }, [updateField]);

  /**
   * Undo last change
   */
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setCard(history[historyIndex - 1]);
      setIsDirty(true);
    }
  }, [history, historyIndex]);

  /**
   * Redo undone change
   */
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setCard(history[historyIndex + 1]);
      setIsDirty(true);
    }
  }, [history, historyIndex]);

  /**
   * Reset card to default state
   */
  const resetCard = useCallback(() => {
    setCard(DEFAULT_CARD);
    setHistory([DEFAULT_CARD]);
    setHistoryIndex(0);
    setDraftId(null);
    setIsDirty(false);
  }, []);

  /**
   * Load a card from generated cards or existing card
   */
  const loadCard = useCallback((cardData) => {
    // Transform generated card format to editor format
    const editorCard = {
      ...DEFAULT_CARD,
      name: cardData.name || DEFAULT_CARD.name,
      subtitle: cardData.subtitle || DEFAULT_CARD.subtitle,
      type: cardData.type || DEFAULT_CARD.type,
      level: parseInt(cardData.level) || DEFAULT_CARD.level,
      stats: {
        hp: cardData.stats?.hp || cardData.manaCost?.[0]?.value || DEFAULT_CARD.stats.hp,
        attack: cardData.stats?.attack || DEFAULT_CARD.stats.attack,
        defense: cardData.stats?.defense || DEFAULT_CARD.stats.defense,
        mana: cardData.stats?.mana || cardData.manaCost?.[1]?.value || DEFAULT_CARD.stats.mana,
        speed: cardData.stats?.speed || DEFAULT_CARD.stats.speed
      },
      moveName: cardData.moveName || extractMoveName(cardData.flavorText) || '',
      moveDescription: cardData.moveDescription || '',
      passiveAbility: cardData.passiveAbility || '',
      flavorText: cardData.flavorText || '',
      artist: cardData.artist || DEFAULT_CARD.artist,
      rarity: cardData.rarity || DEFAULT_CARD.rarity,
      setName: cardData.setName || '',
      terrainType: cardData.terrainType || extractTerrainFromMana(cardData.manaCost) || 'Neutral',
      terrainBonus: cardData.terrainBonus || '',
      imageData: cardData.imageData,
      colors: cardData.colors,
      theme: cardData.theme,
      manaCost: cardData.manaCost || DEFAULT_CARD.manaCost
    };

    setCard(editorCard);
    setHistory([editorCard]);
    setHistoryIndex(0);
    setIsDirty(false);
  }, []);

  /**
   * Save draft to server
   */
  const saveDraft = useCallback(async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsSaving(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/drafts`, {
        method: draftId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draftId,
          ownerAddress: address,
          name: card.name,
          cardData: card
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      const data = await response.json();
      setDraftId(data.id);
      setIsDirty(false);
      setLastSaved(new Date());

      return data;
    } finally {
      setIsSaving(false);
    }
  }, [address, card, draftId]);

  /**
   * Load draft from server
   */
  const loadDraft = useCallback(async (id) => {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/drafts/${id}`);

    if (!response.ok) {
      throw new Error('Failed to load draft');
    }

    const data = await response.json();
    setDraftId(data.id);
    loadCard(data.cardData);
    setLastSaved(new Date(data.updated_at));

    return data;
  }, [loadCard]);

  /**
   * Get drafts for current user
   */
  const getDrafts = useCallback(async () => {
    if (!address) {
      return [];
    }

    const response = await fetch(
      `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/drafts?owner=${address}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch drafts');
    }

    return response.json();
  }, [address]);

  /**
   * Delete a draft
   */
  const deleteDraft = useCallback(async (id) => {
    const response = await fetch(
      `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/drafts/${id}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      throw new Error('Failed to delete draft');
    }

    if (id === draftId) {
      resetCard();
    }

    return true;
  }, [draftId, resetCard]);

  /**
   * Export card as JSON
   */
  const exportCard = useCallback(() => {
    const dataStr = JSON.stringify(card, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${card.name.replace(/\s+/g, '_')}_card.json`;
    a.click();

    URL.revokeObjectURL(url);
  }, [card]);

  /**
   * Import card from JSON
   */
  const importCard = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      loadCard(data);
      return true;
    } catch (err) {
      console.error('Failed to import card:', err);
      return false;
    }
  }, [loadCard]);

  // Auto-save when dirty
  useEffect(() => {
    if (isDirty && address) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }

      autoSaveTimer.current = setTimeout(() => {
        saveDraft().catch(console.error);
      }, 30000); // Auto-save after 30 seconds of inactivity
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [isDirty, address, saveDraft]);

  return {
    // Card state
    card,
    setCard,

    // Field updates
    updateField,
    updateFields,

    // History
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,

    // Part selection
    selectedPart,
    setSelectedPart,

    // Draft management
    draftId,
    isDirty,
    isSaving,
    lastSaved,
    saveDraft,
    loadDraft,
    getDrafts,
    deleteDraft,

    // Card operations
    resetCard,
    loadCard,
    exportCard,
    importCard,

    // Schema
    CARD_PARTS
  };
}

// Helper functions
function getTerrainSymbol(terrainType) {
  const symbols = {
    Fire: '🔥',
    Water: '💧',
    Earth: '🌍',
    Air: '💨',
    Shadow: '🌑',
    Light: '☀️',
    Neutral: '?'
  };
  return symbols[terrainType] || '?';
}

function getTerrainColor(terrainType) {
  const colors = {
    Fire: 'radial-gradient(circle, #ff7675, #d63031)',
    Water: 'radial-gradient(circle, #74b9ff, #0984e3)',
    Earth: 'radial-gradient(circle, #a29bfe, #6c5ce7)',
    Air: 'radial-gradient(circle, #81ecec, #00cec9)',
    Shadow: 'radial-gradient(circle, #636e72, #2d3436)',
    Light: 'radial-gradient(circle, #ffeaa7, #fdcb6e)',
    Neutral: 'radial-gradient(circle, #dfe6e9, #b2bec3)'
  };
  return colors[terrainType] || colors.Neutral;
}

function extractMoveName(flavorText) {
  if (!flavorText) return '';
  const lines = flavorText.split('\n');
  if (lines.length > 0 && lines[0].length < 50) {
    return lines[0];
  }
  return '';
}

function extractTerrainFromMana(manaCost) {
  if (!manaCost) return 'Neutral';
  const terrainOrb = manaCost.find(m => m.type === 'terrain');
  if (terrainOrb?.value) {
    const symbols = { '🔥': 'Fire', '💧': 'Water', '🌍': 'Earth', '💨': 'Air', '🌑': 'Shadow', '☀️': 'Light' };
    return symbols[terrainOrb.value] || 'Neutral';
  }
  return 'Neutral';
}

export default useCardEditor;
