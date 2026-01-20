import React, { useState, useEffect, useCallback } from 'react';
import './MintedCardsCarousel.css';

/**
 * Carousel component for displaying minted cards
 * Supports keyboard navigation and responsive design
 */
const MintedCardsCarousel = ({ cards, onCardClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Navigation handlers
  const goToCard = useCallback((index) => {
    if (index < 0 || index >= cards.length) return;
    setCurrentIndex(index);
  }, [cards.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < cards.length - 1 ? prev + 1 : prev));
  }, [cards.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Reset index if cards change
  useEffect(() => {
    if (currentIndex >= cards.length && cards.length > 0) {
      setCurrentIndex(cards.length - 1);
    }
  }, [cards.length, currentIndex]);

  // Get unique identifier for a card
  const getCardKey = (card, index) => {
    return card.id || card.tokenId || `card-${index}`;
  };

  if (!cards || cards.length === 0) {
    return null;
  }

  const currentCard = cards[currentIndex];
  const cardKey = getCardKey(currentCard, currentIndex);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < cards.length - 1;

  return (
    <div className="minted-cards-carousel">
      <div className="carousel-container">
        {/* Previous button */}
        <button
          className={`carousel-nav carousel-nav-left ${!canGoPrevious ? 'disabled' : ''}`}
          onClick={goToPrevious}
          disabled={!canGoPrevious}
          aria-label="Previous card"
        >
          ‹
        </button>

        {/* Card display */}
        <div className="carousel-content">
          <div
            key={cardKey}
            className="carousel-card-wrapper"
            onClick={() => onCardClick?.(currentCard)}
          >
            {currentCard.image || currentCard.imageData ? (
              <img
                src={currentCard.image || currentCard.imageData}
                alt={currentCard.name || `Card #${currentCard.tokenId}`}
                className="card-image"
                draggable={false}
              />
            ) : (
              <div className="card-placeholder">
                <span>Loading card...</span>
              </div>
            )}
          </div>

          {/* Card info */}
          {currentCard.name && (
            <div className="carousel-card-info">
              <h4 className="card-name">{currentCard.name}</h4>
              {currentCard.tokenId && (
                <span className="card-token-id">#{currentCard.tokenId}</span>
              )}
            </div>
          )}
        </div>

        {/* Next button */}
        <button
          className={`carousel-nav carousel-nav-right ${!canGoNext ? 'disabled' : ''}`}
          onClick={goToNext}
          disabled={!canGoNext}
          aria-label="Next card"
        >
          ›
        </button>
      </div>

      {/* Dot indicators (max 20 shown) */}
      {cards.length > 1 && cards.length <= 20 && (
        <div className="carousel-dots">
          {cards.map((card, index) => (
            <button
              key={getCardKey(card, index)}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToCard(index)}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="carousel-counter">
        {currentIndex + 1} / {cards.length}
      </div>
    </div>
  );
};

export default MintedCardsCarousel;
