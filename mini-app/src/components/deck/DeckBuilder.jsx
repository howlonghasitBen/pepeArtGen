import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import './DeckBuilder.css';

const MAX_DECK_SIZE = 30;

// Rarity order for sorting
const RARITY_ORDER = {
  'common': 1,
  'uncommon': 2,
  'rare': 3,
  'epic': 4,
  'legendary': 5,
  '1/1': 6
};

function DeckBuilder({ onBack }) {
  const { address, isConnected } = useWeb3();

  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [availableCards, setAvailableCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDeckModal, setShowNewDeckModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');

  // Filter states
  const [filterRarity, setFilterRarity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Card preview state
  const [previewCard, setPreviewCard] = useState(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });

  // Drag and drop state
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragSource, setDragSource] = useState(null);
  const deckDropZoneRef = useRef(null);
  const libraryDropZoneRef = useRef(null);

  // Fetch user's decks
  const fetchDecks = useCallback(async () => {
    if (!address) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/decks?owner=${address}`
      );

      if (response.ok) {
        const data = await response.json();
        setDecks(data);
      }
    } catch (err) {
      console.error('Failed to fetch decks:', err);
    }
  }, [address]);

  // Fetch user's minted cards
  const fetchCards = useCallback(async () => {
    if (!address) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/cards/wallet/${address}`
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableCards(data.cards || []);
      }
    } catch (err) {
      console.error('Failed to fetch cards:', err);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchDecks();
      fetchCards();
    } else {
      setIsLoading(false);
    }
  }, [address, fetchDecks, fetchCards]);

  const createDeck = async () => {
    if (!newDeckName.trim()) return;

    try {
      setIsSaving(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/decks`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerAddress: address,
            name: newDeckName.trim()
          })
        }
      );

      if (!response.ok) throw new Error('Failed to create deck');

      const data = await response.json();
      setDecks([data, ...decks]);
      setSelectedDeck(data);
      setShowNewDeckModal(false);
      setNewDeckName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addCardToDeck = async (card) => {
    if (!selectedDeck) return;
    if ((selectedDeck.card_ids?.length || 0) >= MAX_DECK_SIZE) {
      setError(`Deck is full (${MAX_DECK_SIZE} cards max)`);
      return;
    }

    const updatedDeck = {
      ...selectedDeck,
      card_ids: [...(selectedDeck.card_ids || []), card.id]
    };

    setSelectedDeck(updatedDeck);
    await saveDeck(updatedDeck);
  };

  const removeCardFromDeck = async (cardId, index) => {
    if (!selectedDeck) return;

    const updatedCardIds = [...(selectedDeck.card_ids || [])];
    updatedCardIds.splice(index, 1);

    const updatedDeck = {
      ...selectedDeck,
      card_ids: updatedCardIds
    };

    setSelectedDeck(updatedDeck);
    await saveDeck(updatedDeck);
  };

  const saveDeck = async (deck) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/decks/${deck.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: deck.name,
            cardIds: deck.card_ids,
            ownerAddress: address
          })
        }
      );

      if (!response.ok) throw new Error('Failed to save deck');
    } catch (err) {
      console.error('Failed to save deck:', err);
    }
  };

  const deleteDeck = async (deckId) => {
    if (!confirm('Delete this deck?')) return;

    try {
      await fetch(
        `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/decks/${deckId}?owner=${address}`,
        { method: 'DELETE' }
      );

      setDecks(decks.filter(d => d.id !== deckId));
      if (selectedDeck?.id === deckId) {
        setSelectedDeck(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getCardById = (cardId) => {
    return availableCards.find(c => c.id === cardId);
  };

  // Get unique filter options from cards
  const filterOptions = useMemo(() => {
    const rarities = new Set();
    const types = new Set();

    availableCards.forEach(card => {
      if (card.rarity) rarities.add(card.rarity);
      if (card.type) types.add(card.type);
    });

    return {
      rarities: ['all', ...Array.from(rarities).sort((a, b) => 
        (RARITY_ORDER[a.toLowerCase()] || 99) - (RARITY_ORDER[b.toLowerCase()] || 99)
      )],
      types: ['all', ...Array.from(types).sort()]
    };
  }, [availableCards]);

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let cards = availableCards.filter(card => {
      // Search filter
      if (searchQuery && !card.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Rarity filter
      if (filterRarity !== 'all' && card.rarity !== filterRarity) {
        return false;
      }
      // Type filter
      if (filterType !== 'all' && card.type !== filterType) {
        return false;
      }
      return true;
    });

    // Sort
    cards.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'rarity':
          return (RARITY_ORDER[b.rarity?.toLowerCase()] || 0) - (RARITY_ORDER[a.rarity?.toLowerCase()] || 0);
        case 'attack':
          return (b.stats?.attack || 0) - (a.stats?.attack || 0);
        case 'defense':
          return (b.stats?.defense || 0) - (a.stats?.defense || 0);
        default:
          return 0;
      }
    });

    return cards;
  }, [availableCards, searchQuery, filterRarity, filterType, sortBy]);

  const deckCardIds = selectedDeck?.card_ids || [];
  const deckCards = deckCardIds.map(id => getCardById(id)).filter(Boolean);

  // Calculate deck stats
  const deckStats = useMemo(() => {
    if (deckCards.length === 0) {
      return {
        avgAttack: 0,
        avgDefense: 0,
        total: 0,
        rarityDistribution: {},
        typeDistribution: {},
        manaCurve: {}
      };
    }

    const avgAttack = (deckCards.reduce((sum, c) => sum + (c.stats?.attack || 0), 0) / deckCards.length).toFixed(1);
    const avgDefense = (deckCards.reduce((sum, c) => sum + (c.stats?.defense || 0), 0) / deckCards.length).toFixed(1);

    // Calculate distributions
    const rarityDistribution = {};
    const typeDistribution = {};
    const manaCurve = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, '6+': 0 };

    deckCards.forEach(card => {
      // Rarity distribution
      const rarity = card.rarity || 'unknown';
      rarityDistribution[rarity] = (rarityDistribution[rarity] || 0) + 1;

      // Type distribution
      const type = card.type || 'unknown';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;

      // Mana curve (using attack as proxy for mana cost if no mana field)
      const manaCost = card.stats?.mana || card.stats?.attack || 1;
      if (manaCost >= 6) {
        manaCurve['6+']++;
      } else {
        manaCurve[manaCost] = (manaCurve[manaCost] || 0) + 1;
      }
    });

    return {
      avgAttack,
      avgDefense,
      total: deckCards.length,
      rarityDistribution,
      typeDistribution,
      manaCurve
    };
  }, [deckCards]);

  // Card preview handlers
  const handleCardHover = useCallback((card, event) => {
    if (!card) {
      setPreviewCard(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left - 320; // Position to the left of the card
    const y = Math.min(rect.top, window.innerHeight - 450); // Keep in viewport

    setPreviewCard(card);
    setPreviewPosition({ x: Math.max(10, x), y: Math.max(10, y) });
  }, []);

  const handleCardLeave = useCallback(() => {
    setPreviewCard(null);
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback((e, card, source) => {
    setDraggedCard(card);
    setDragSource(source);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
    
    // Create a drag image
    const dragImage = e.currentTarget.cloneNode(true);
    dragImage.style.opacity = '0.7';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 50, 50);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedCard(null);
    setDragSource(null);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDropOnDeck = useCallback((e, targetIndex = null) => {
    e.preventDefault();
    if (!draggedCard || !selectedDeck) return;

    if (dragSource === 'library') {
      // Adding from library
      addCardToDeck(draggedCard);
    } else if (dragSource === 'deck' && targetIndex !== null) {
      // Reordering within deck
      const currentIndex = deckCardIds.indexOf(draggedCard.id);
      if (currentIndex !== -1 && currentIndex !== targetIndex) {
        const newCardIds = [...deckCardIds];
        newCardIds.splice(currentIndex, 1);
        newCardIds.splice(targetIndex, 0, draggedCard.id);
        
        const updatedDeck = { ...selectedDeck, card_ids: newCardIds };
        setSelectedDeck(updatedDeck);
        saveDeck(updatedDeck);
      }
    }

    setDraggedCard(null);
    setDragSource(null);
  }, [draggedCard, dragSource, selectedDeck, deckCardIds, addCardToDeck, saveDeck]);

  const handleDropOnLibrary = useCallback((e) => {
    e.preventDefault();
    if (!draggedCard || dragSource !== 'deck') return;

    const index = deckCardIds.indexOf(draggedCard.id);
    if (index !== -1) {
      removeCardFromDeck(draggedCard.id, index);
    }

    setDraggedCard(null);
    setDragSource(null);
  }, [draggedCard, dragSource, deckCardIds, removeCardFromDeck]);

  // Get rarity color
  const getRarityColor = (rarity) => {
    const colors = {
      'common': '#9e9e9e',
      'uncommon': '#4caf50',
      'rare': '#2196f3',
      'epic': '#9c27b0',
      'legendary': '#ff9800',
      '1/1': '#f44336'
    };
    return colors[rarity?.toLowerCase()] || '#9e9e9e';
  };

  if (!isConnected) {
    return (
      <div className="deck-builder">
        <div className="deck-builder-header">
          <button className="back-btn" onClick={onBack}>&lt; Back</button>
          <h2>Deck Builder</h2>
        </div>
        <div className="deck-connect-prompt">
          <p>Connect your wallet to build decks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="deck-builder">
      {/* Header */}
      <div className="deck-builder-header">
        <button className="back-btn" onClick={onBack}>&lt; Back</button>
        <h2>Deck Builder</h2>
        <button className="new-deck-btn" onClick={() => setShowNewDeckModal(true)}>
          + New Deck
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="deck-error">
          {error}
          <button onClick={() => setError(null)}>x</button>
        </div>
      )}

      <div className="deck-builder-layout">
        {/* Deck List */}
        <div className="deck-list-panel">
          <h3>My Decks</h3>
          {decks.length === 0 ? (
            <div className="no-decks">
              <p>No decks yet</p>
              <button onClick={() => setShowNewDeckModal(true)}>Create your first deck</button>
            </div>
          ) : (
            <div className="deck-list">
              {decks.map(deck => (
                <div
                  key={deck.id}
                  className={`deck-item ${selectedDeck?.id === deck.id ? 'active' : ''}`}
                  onClick={() => setSelectedDeck(deck)}
                >
                  <div className="deck-item-info">
                    <span className="deck-name">{deck.name}</span>
                    <span className="deck-count">
                      {deck.card_ids?.length || 0}/{MAX_DECK_SIZE}
                    </span>
                  </div>
                  <button
                    className="deck-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDeck(deck.id);
                    }}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deck Contents */}
        <div 
          className={`deck-contents-panel ${dragSource === 'library' ? 'drop-target' : ''}`}
          ref={deckDropZoneRef}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropOnDeck(e)}
        >
          {selectedDeck ? (
            <>
              <div className="deck-contents-header">
                <h3>{selectedDeck.name}</h3>
                <span className="deck-size">
                  {deckCardIds.length}/{MAX_DECK_SIZE} cards
                </span>
              </div>

              {/* Enhanced Stats */}
              <div className="deck-stats">
                <div className="stats-row">
                  <div className="stat-item">
                    <span className="stat-label">Avg ATK</span>
                    <span className="stat-value">{deckStats.avgAttack}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Avg DEF</span>
                    <span className="stat-value">{deckStats.avgDefense}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Cards</span>
                    <span className="stat-value">{deckStats.total}</span>
                  </div>
                </div>

                {/* Mana Curve */}
                {deckStats.total > 0 && (
                  <div className="mana-curve">
                    <span className="curve-label">Mana Curve:</span>
                    <div className="curve-bars">
                      {Object.entries(deckStats.manaCurve).map(([cost, count]) => (
                        <div key={cost} className="curve-bar-container">
                          <div 
                            className="curve-bar" 
                            style={{ 
                              height: `${Math.min((count / deckStats.total) * 100, 100)}%`,
                              minHeight: count > 0 ? '4px' : '0'
                            }}
                          />
                          <span className="curve-cost">{cost}</span>
                          <span className="curve-count">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Type Distribution */}
                {deckStats.total > 0 && Object.keys(deckStats.typeDistribution).length > 0 && (
                  <div className="type-distribution">
                    {Object.entries(deckStats.typeDistribution).map(([type, count]) => (
                      <span key={type} className="type-badge">
                        {type}: {count}
                      </span>
                    ))}
                  </div>
                )}

                {/* Rarity Distribution */}
                {deckStats.total > 0 && Object.keys(deckStats.rarityDistribution).length > 0 && (
                  <div className="rarity-distribution">
                    {Object.entries(deckStats.rarityDistribution).map(([rarity, count]) => (
                      <span 
                        key={rarity} 
                        className="rarity-badge"
                        style={{ borderColor: getRarityColor(rarity) }}
                      >
                        {rarity}: {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="deck-cards">
                {deckCards.length === 0 ? (
                  <div className="deck-empty">
                    <p>No cards in this deck</p>
                    <p className="deck-empty-hint">Drag cards from library or click + to add</p>
                  </div>
                ) : (
                  deckCards.map((card, index) => (
                    <div 
                      key={`${card.id}-${index}`} 
                      className={`deck-card ${draggedCard?.id === card.id && dragSource === 'deck' ? 'dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card, 'deck')}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropOnDeck(e, index)}
                      onMouseEnter={(e) => handleCardHover(card, e)}
                      onMouseLeave={handleCardLeave}
                    >
                      <div 
                        className="deck-card-rarity-indicator"
                        style={{ backgroundColor: getRarityColor(card.rarity) }}
                      />
                      <div className="deck-card-image">
                        {card.imageData && (
                          <img src={card.imageData} alt={card.name} />
                        )}
                      </div>
                      <div className="deck-card-info">
                        <span className="deck-card-name">{card.name}</span>
                        <span className="deck-card-stats">
                          ATK {card.stats?.attack || 0} / DEF {card.stats?.defense || 0}
                        </span>
                      </div>
                      <button
                        className="remove-card-btn"
                        onClick={() => removeCardFromDeck(card.id, index)}
                      >
                        -
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="deck-select-prompt">
              <p>Select a deck to edit</p>
            </div>
          )}
        </div>

        {/* Card Library */}
        <div 
          className={`card-library-panel ${dragSource === 'deck' ? 'drop-target' : ''}`}
          ref={libraryDropZoneRef}
          onDragOver={handleDragOver}
          onDrop={handleDropOnLibrary}
        >
          <h3>Card Library</h3>
          
          {/* Search and Filters */}
          <div className="library-filters">
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="library-search"
            />
            
            <div className="filter-row">
              <select 
                value={filterRarity} 
                onChange={(e) => setFilterRarity(e.target.value)}
                className="filter-select"
              >
                {filterOptions.rarities.map(r => (
                  <option key={r} value={r}>
                    {r === 'all' ? 'All Rarities' : r}
                  </option>
                ))}
              </select>
              
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                {filterOptions.types.map(t => (
                  <option key={t} value={t}>
                    {t === 'all' ? 'All Types' : t}
                  </option>
                ))}
              </select>
            </div>

            <div className="sort-row">
              <label>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name">Name</option>
                <option value="rarity">Rarity</option>
                <option value="attack">Attack</option>
                <option value="defense">Defense</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="library-loading">Loading cards...</div>
          ) : filteredCards.length === 0 ? (
            <div className="library-empty">
              {searchQuery || filterRarity !== 'all' || filterType !== 'all' 
                ? 'No cards match your filters' 
                : 'No cards in your collection'}
            </div>
          ) : (
            <div className="library-cards">
              {filteredCards.map(card => (
                <div
                  key={card.id}
                  className={`library-card ${draggedCard?.id === card.id && dragSource === 'library' ? 'dragging' : ''}`}
                  onClick={() => addCardToDeck(card)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card, 'library')}
                  onDragEnd={handleDragEnd}
                  onMouseEnter={(e) => handleCardHover(card, e)}
                  onMouseLeave={handleCardLeave}
                >
                  <div 
                    className="library-card-rarity"
                    style={{ backgroundColor: getRarityColor(card.rarity) }}
                  />
                  <div className="library-card-image">
                    {card.imageData && (
                      <img src={card.imageData} alt={card.name} />
                    )}
                  </div>
                  <div className="library-card-details">
                    <div className="library-card-name">{card.name}</div>
                    <div className="library-card-meta">
                      <span className="library-card-type">{card.type || 'Creature'}</span>
                      <span className="library-card-stats-mini">
                        {card.stats?.attack || 0}/{card.stats?.defense || 0}
                      </span>
                    </div>
                  </div>
                  <button className="add-card-btn">+</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Preview Popup */}
      {previewCard && (
        <div 
          className="card-preview-popup"
          style={{ left: previewPosition.x, top: previewPosition.y }}
        >
          <div className="preview-image">
            {previewCard.imageData && (
              <img src={previewCard.imageData} alt={previewCard.name} />
            )}
          </div>
          <div className="preview-details">
            <h4 className="preview-name">{previewCard.name}</h4>
            <div 
              className="preview-rarity"
              style={{ color: getRarityColor(previewCard.rarity) }}
            >
              {previewCard.rarity || 'Common'}
            </div>
            <div className="preview-type">{previewCard.type || 'Creature'}</div>
            <div className="preview-stats">
              <span>ATK: {previewCard.stats?.attack || 0}</span>
              <span>DEF: {previewCard.stats?.defense || 0}</span>
            </div>
            {previewCard.flavorText && (
              <p className="preview-flavor">{previewCard.flavorText}</p>
            )}
          </div>
        </div>
      )}

      {/* New Deck Modal */}
      {showNewDeckModal && (
        <div className="modal-overlay" onClick={() => setShowNewDeckModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Create New Deck</h3>
            <input
              type="text"
              placeholder="Deck name"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createDeck()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowNewDeckModal(false)}>
                Cancel
              </button>
              <button
                className="create-btn"
                onClick={createDeck}
                disabled={!newDeckName.trim() || isSaving}
              >
                {isSaving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeckBuilder;
