import React, { useState } from 'react';
import './MintedCardsCarousel.css';

const MintedCardsCarousel = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToCard = (index) => {
    if (index < 0 || index >= cards.length) return;
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      goToCard(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < cards.length - 1) {
      goToCard(currentIndex + 1);
    }
  };

  // Extract unique identifier from IPFS URL or use tokenId/id
  const getCardKey = (card) => {
    const imageUrl = card.image || card.imageData;
    if (imageUrl && imageUrl.includes('/ipfs/')) {
      // Extract IPFS filename/CID from URL
      const match = imageUrl.match(/\/ipfs\/([^/?]+)/);
      if (match) return match[1];
    }
    // Fallback to tokenId or id
    return card.tokenId || card.id || `card-${currentIndex}`;
  };

  if (!cards || cards.length === 0) {
    return null;
  }

  const currentCard = cards[currentIndex];
  const cardKey = getCardKey(currentCard);

  return (
    <div className="minted-cards-carousel">
      <div className="carousel-container">
        {currentIndex > 0 && (
          <button className="carousel-nav carousel-nav-left" onClick={goToPrevious}>
            ‹
          </button>
        )}

        <div className="carousel-content">
          <div
            key={cardKey}
            className="carousel-card-wrapper"
          >
            {currentCard.image || currentCard.imageData ? (
              <img
                src={currentCard.image || currentCard.imageData}
                alt={currentCard.name || `Card #${currentCard.tokenId}`}
                className="card-image"
              />
            ) : (
              <div className="card-placeholder">
                <p>Loading card...</p>
              </div>
            )}
          </div>
        </div>

        {currentIndex < cards.length - 1 && (
          <button className="carousel-nav carousel-nav-right" onClick={goToNext}>
            ›
          </button>
        )}
      </div>

      {cards.length > 1 && (
        <div className="carousel-dots">
          {cards.map((card, index) => (
            <button
              key={getCardKey(card)}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToCard(index)}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      )}

      <div className="carousel-counter">
        {currentIndex + 1} / {cards.length}
      </div>
    </div>
  );
};

export default MintedCardsCarousel;
