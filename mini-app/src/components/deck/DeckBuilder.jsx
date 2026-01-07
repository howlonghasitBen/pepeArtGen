import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import './DeckBuilder.css';

const MAX_DECK_SIZE = 30;

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

  const filteredCards = availableCards.filter(card =>
    card.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deckCardIds = selectedDeck?.card_ids || [];
  const deckCards = deckCardIds.map(id => getCardById(id)).filter(Boolean);

  // Calculate deck stats
  const avgAttack = deckCards.length > 0
    ? (deckCards.reduce((sum, c) => sum + (c.stats?.attack || 0), 0) / deckCards.length).toFixed(1)
    : 0;
  const avgDefense = deckCards.length > 0
    ? (deckCards.reduce((sum, c) => sum + (c.stats?.defense || 0), 0) / deckCards.length).toFixed(1)
    : 0;

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
        <div className="deck-contents-panel">
          {selectedDeck ? (
            <>
              <div className="deck-contents-header">
                <h3>{selectedDeck.name}</h3>
                <span className="deck-size">
                  {deckCardIds.length}/{MAX_DECK_SIZE} cards
                </span>
              </div>

              <div className="deck-stats">
                <div className="stat-item">
                  <span className="stat-label">Avg ATK</span>
                  <span className="stat-value">{avgAttack}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg DEF</span>
                  <span className="stat-value">{avgDefense}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Cards</span>
                  <span className="stat-value">{deckCards.length}</span>
                </div>
              </div>

              <div className="deck-cards">
                {deckCards.length === 0 ? (
                  <div className="deck-empty">
                    <p>No cards in this deck</p>
                    <p className="deck-empty-hint">Add cards from your collection &gt;</p>
                  </div>
                ) : (
                  deckCards.map((card, index) => (
                    <div key={`${card.id}-${index}`} className="deck-card">
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
        <div className="card-library-panel">
          <h3>Card Library</h3>
          <div className="library-search">
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="library-loading">Loading cards...</div>
          ) : filteredCards.length === 0 ? (
            <div className="library-empty">
              {searchQuery ? 'No cards match your search' : 'No cards in your collection'}
            </div>
          ) : (
            <div className="library-cards">
              {filteredCards.map(card => (
                <div
                  key={card.id}
                  className="library-card"
                  onClick={() => addCardToDeck(card)}
                >
                  <div className="library-card-image">
                    {card.imageData && (
                      <img src={card.imageData} alt={card.name} />
                    )}
                  </div>
                  <div className="library-card-name">{card.name}</div>
                  <button className="add-card-btn">+</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
