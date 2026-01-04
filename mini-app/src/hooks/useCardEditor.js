import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useWeb3 } from '../context/Web3Context';

// Get API base URL consistently
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL ||
         import.meta.env.VITE_SERVER_URL ||
         'http://localhost:3001';
};

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
      crit: { type: 'number', label: 'Crit', min: 1, max: 20 }
    }
  },
  abilities: {
    label: 'Abilities',
    icon: '✨',
    fields: {
      moveName: { type: 'string', label: 'Move Name', placeholder: 'Shadow Strike' }
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
    mana: 3,
    crit: 10
  },
  manaCost: [
    { type: 'hp', value: 5, color: 'radial-gradient(circle, #ff6b6b, #c0392b)', textColor: '#fff' },
    { type: 'mana', value: 3, color: 'radial-gradient(circle, #74b9ff, #0984e3)', textColor: '#fff' },
    { type: 'crit', value: 10, color: 'radial-gradient(circle, #a29bfe, #6c5ce7)', textColor: '#fff' }
  ],
  moveName: '',
  flavorText: '',
  artist: 'Waves TCG',
  rarity: '1/1',
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
      if (fieldPath === 'stats.hp' || fieldPath === 'stats.mana' || fieldPath === 'stats.crit') {
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
            type: 'crit',
            value: newCard.stats?.crit || 10,
            color: 'radial-gradient(circle, #a29bfe, #6c5ce7)',
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
    const hp = cardData.stats?.hp || cardData.manaCost?.[0]?.value || DEFAULT_CARD.stats.hp;
    const mana = cardData.stats?.mana || cardData.manaCost?.[1]?.value || DEFAULT_CARD.stats.mana;
    const crit = cardData.stats?.crit || cardData.manaCost?.[2]?.value || DEFAULT_CARD.stats.crit;

    const editorCard = {
      ...DEFAULT_CARD,
      name: cardData.name || DEFAULT_CARD.name,
      subtitle: cardData.subtitle || DEFAULT_CARD.subtitle,
      type: cardData.type || DEFAULT_CARD.type,
      level: parseInt(cardData.level) || DEFAULT_CARD.level,
      stats: {
        hp,
        attack: cardData.stats?.attack || DEFAULT_CARD.stats.attack,
        defense: cardData.stats?.defense || DEFAULT_CARD.stats.defense,
        mana,
        crit
      },
      moveName: cardData.moveName || extractMoveName(cardData.flavorText) || '',
      flavorText: cardData.flavorText || '',
      artist: cardData.artist || DEFAULT_CARD.artist,
      rarity: cardData.rarity || DEFAULT_CARD.rarity,
      imageData: cardData.imageData,
      colors: cardData.colors,
      theme: cardData.theme,
      manaCost: [
        { type: 'hp', value: hp, color: 'radial-gradient(circle, #ff6b6b, #c0392b)', textColor: '#fff' },
        { type: 'mana', value: mana, color: 'radial-gradient(circle, #74b9ff, #0984e3)', textColor: '#fff' },
        { type: 'crit', value: crit, color: 'radial-gradient(circle, #a29bfe, #6c5ce7)', textColor: '#fff' }
      ]
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
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/drafts`, {
        method: draftId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draftId,
          ownerAddress: address,
          name: card.name,
          cardData: card
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Extract error message from server response
        const errorMsg = data.error || data.message || 'Failed to save draft';
        throw new Error(errorMsg);
      }

      setDraftId(data.id);
      setIsDirty(false);
      setLastSaved(new Date());

      return data;
    } catch (err) {
      // Re-throw with more context if it's a network error
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check if the server is running.');
      }
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [address, card, draftId]);

  /**
   * Load draft from server
   */
  const loadDraft = useCallback(async (id) => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/drafts/${id}`);

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || data.message || 'Failed to load draft';
        throw new Error(errorMsg);
      }

      // Server returns snake_case (card_data), not camelCase
      const cardData = data.card_data || data.cardData;

      if (!cardData) {
        throw new Error('Draft has no card data');
      }

      setDraftId(data.id);
      loadCard(cardData);
      setLastSaved(new Date(data.updated_at));

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check if the server is running.');
      }
      throw err;
    }
  }, [loadCard]);

  /**
   * Get drafts for current user
   */
  const getDrafts = useCallback(async () => {
    if (!address) {
      return [];
    }

    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/drafts?owner=${address}`);

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || data.message || 'Failed to fetch drafts';
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check if the server is running.');
      }
      throw err;
    }
  }, [address]);

  /**
   * Delete a draft
   */
  const deleteDraft = useCallback(async (id) => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/drafts/${id}?owner=${address}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || data.message || 'Failed to delete draft';
        throw new Error(errorMsg);
      }

      if (id === draftId) {
        resetCard();
      }

      return true;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check if the server is running.');
      }
      throw err;
    }
  }, [address, draftId, resetCard]);

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
function extractMoveName(flavorText) {
  if (!flavorText) return '';
  const lines = flavorText.split('\n');
  if (lines.length > 0 && lines[0].length < 50) {
    return lines[0];
  }
  return '';
}

export default useCardEditor;
