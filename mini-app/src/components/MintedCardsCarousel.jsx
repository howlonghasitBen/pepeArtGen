import React, { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import './MintedCardsCarousel.css';

const MintedCardsCarousel = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  const goToCard = (index) => {
    if (index < 0 || index >= cards.length) return;
    setCurrentIndex(index);
    api.start({ x: 0, immediate: false });
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

  const bind = useDrag(
    ({ movement: [mx], direction: [xDir], cancel, down }) => {
      if (down && Math.abs(mx) > 50) {
        if (xDir > 0 && currentIndex > 0) {
          cancel();
          goToPrevious();
        } else if (xDir < 0 && currentIndex < cards.length - 1) {
          cancel();
          goToNext();
        }
      }
      if (down) {
        api.start({ x: mx, immediate: true });
      } else {
        api.start({ x: 0, immediate: false });
      }
    },
    {
      axis: 'x',
      bounds: { left: -100, right: 100 },
      rubberband: true,
    }
  );

  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <div className="minted-cards-carousel">
      <div className="carousel-header">
        <h3>All Minted Cards ({cards.length})</h3>
      </div>

      <div className="carousel-container">
        {currentIndex > 0 && (
          <button className="carousel-nav carousel-nav-left" onClick={goToPrevious}>
            ‹
          </button>
        )}

        <div className="carousel-content">
          <animated.div
            {...bind()}
            style={{
              x,
              touchAction: 'pan-y',
            }}
            className="carousel-card-wrapper"
          >
            <div className="carousel-card">
              {cards[currentIndex].image || cards[currentIndex].imageData ? (
                <img
                  src={cards[currentIndex].image || cards[currentIndex].imageData}
                  alt={cards[currentIndex].name || `Card #${cards[currentIndex].tokenId}`}
                  className="card-image"
                />
              ) : (
                <div className="card-placeholder">
                  <p>Loading card...</p>
                </div>
              )}
              <div className="card-info">
                <p className="card-name">{cards[currentIndex].name || `Card #${cards[currentIndex].tokenId}`}</p>
                {cards[currentIndex].tokenId && (
                  <p className="card-token-id">Token #{cards[currentIndex].tokenId}</p>
                )}
              </div>
            </div>
          </animated.div>
        </div>

        {currentIndex < cards.length - 1 && (
          <button className="carousel-nav carousel-nav-right" onClick={goToNext}>
            ›
          </button>
        )}
      </div>

      {cards.length > 1 && (
        <div className="carousel-dots">
          {cards.map((_, index) => (
            <button
              key={index}
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
