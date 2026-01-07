import React, { useState, useEffect, useRef } from 'react';
import './CardCarousel.css';

function CardCarousel({ title, onCardClick }) {
  const [screenshots, setScreenshots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    fetchScreenshots();
  }, []);

  const fetchScreenshots = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/screenshots/gallery?limit=20`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch gallery');
      }

      const data = await response.json();
      setScreenshots(data.screenshots || []);
    } catch (err) {
      console.error('Failed to fetch screenshots:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateScrollButtons = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(updateScrollButtons, 300);
    }
  };

  const handleCardClick = (screenshot) => {
    if (onCardClick) {
      onCardClick(screenshot);
    }
  };

  if (isLoading) {
    return (
      <div className="card-carousel">
        <h3 className="carousel-title">{title || 'Gallery'}</h3>
        <div className="carousel-loading">
          <div className="loading-spinner" />
          <span>Loading gallery...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-carousel">
        <h3 className="carousel-title">{title || 'Gallery'}</h3>
        <div className="carousel-error">
          <span>Failed to load gallery</span>
          <button onClick={fetchScreenshots}>Retry</button>
        </div>
      </div>
    );
  }

  if (screenshots.length === 0) {
    return (
      <div className="card-carousel">
        <h3 className="carousel-title">{title || 'Gallery'}</h3>
        <div className="carousel-empty">
          <span>No cards minted yet. Be the first!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card-carousel">
      <div className="carousel-header">
        <h3 className="carousel-title">{title || 'Gallery'}</h3>
        <div className="carousel-nav">
          <button
            className="carousel-nav-btn"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
          >
            &lt;
          </button>
          <button
            className="carousel-nav-btn"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
          >
            &gt;
          </button>
        </div>
      </div>

      <div
        className="carousel-track"
        ref={carouselRef}
        onScroll={updateScrollButtons}
      >
        {screenshots.map((screenshot) => (
          <div
            key={screenshot.screenshot_id}
            className="carousel-card"
            onClick={() => handleCardClick(screenshot)}
          >
            <div className="carousel-card-image">
              <img
                src={screenshot.thumbnail_url || screenshot.screenshot_url}
                alt={screenshot.card_name || 'Card'}
                loading="lazy"
              />
            </div>
            <div className="carousel-card-info">
              <div className="carousel-card-name">
                {screenshot.card_name || 'Unnamed Card'}
              </div>
              {screenshot.token_id && (
                <div className="carousel-card-token">#{screenshot.token_id}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CardCarousel;
