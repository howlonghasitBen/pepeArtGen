import { useState } from "react";
import { useAccount } from "wagmi";

import SwipeableCard from "./SwipeableCard";
import MintingModal from "./MintingModal";
import MintSuccessModal from "./MintSuccessModal";
import "./CurationScreen.css";

function CurationScreen({ cards, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [discarded, setDiscarded] = useState([]);
  const [toMint, setToMint] = useState([]);
  const [showMintModal, setShowMintModal] = useState(false);
  const [showMintingModal, setShowMintingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mintData, setMintData] = useState(null);
  const { isConnected } = useAccount();

  const currentCard = cards[currentIndex];
  const isLastCard = currentIndex >= cards.length - 1;

  const handleSwipeLeft = () => {
    setDiscarded([...discarded, currentCard.id]);
    nextCard();
  };

  const handleSwipeRight = () => {
    setToMint([...toMint, currentCard]);
    nextCard();
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Show minting summary
      setShowMintModal(true);
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevCard = cards[prevIndex];

      // Remove from discarded or toMint
      setDiscarded(discarded.filter((id) => id !== prevCard.id));
      setToMint(toMint.filter((card) => card.id !== prevCard.id));

      setCurrentIndex(prevIndex);
    }
  };

  const handleMintAll = () => {
    setShowMintingModal(true);
  };

  const handleMintSuccess = (data) => {
    console.log("Minted successfully!", data);
    setMintData(data);
    setShowMintingModal(false);
    setShowSuccessModal(true);
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setMintData(null);
  };

  if (cards.length === 0) {
    return (
      <div className="curation-screen">
        <p className="empty-state">No cards to curate</p>
        <button className="back-btn" onClick={onBack}>
          ← Back to Generator
        </button>
      </div>
    );
  }

  if (showMintModal) {
    return (
      <div className="curation-screen">
        <div className="mint-modal">
          <h2>🎉 Curation Complete!</h2>

          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-number">{toMint.length}</div>
              <div className="stat-label">To Mint</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">{discarded.length}</div>
              <div className="stat-label">Discarded</div>
            </div>
          </div>

          {toMint.length > 0 && (
            <>
              <div className="mint-preview">
                <h3>Cards to Mint:</h3>
                <div className="card-list">
                  {toMint.map((card) => (
                    <div key={card.id} className="card-preview-item">
                      <img src={card.imageData} alt={card.name} />
                      <span>{card.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mint-info">
                <div className="cost-breakdown">
                  <div className="cost-row">
                    <span>Cards to mint:</span>
                    <span>{toMint.length}</span>
                  </div>
                  <div className="cost-row">
                    <span>Minting cost:</span>
                    <span>FREE</span>
                  </div>
                  <div className="cost-row total">
                    <span>Gas fees (estimated):</span>
                    <span>~$0.01</span>
                  </div>
                </div>
                <p className="payment-note">
                  ✅ You already paid $2.50 USDC for generation
                </p>
              </div>

              {!isConnected ? (
                <div className="connect-wallet-section">
                  <p>Connect your wallet to mint on BASE</p>
                  <appkit-button />
                </div>
              ) : (
                <button className="mint-btn" onClick={handleMintAll}>
                  🪙 Mint {toMint.length} Card{toMint.length > 1 ? "s" : ""}{" "}
                  (FREE)
                </button>
              )}
            </>
          )}

          <button className="secondary-btn" onClick={onBack}>
            ← Generate More Cards
          </button>
        </div>

        {showMintingModal && (
          <MintingModal
            cards={toMint}
            onClose={() => setShowMintingModal(false)}
            onSuccess={handleMintSuccess}
          />
        )}

        {showSuccessModal && mintData && (
          <MintSuccessModal mintData={mintData} onClose={handleCloseSuccess} />
        )}
      </div>
    );
  }

  return (
    <div className="curation-screen">
      <div className="curation-header">
        <button className="back-btn-small" onClick={onBack}>
          ← Back
        </button>
        <div className="progress">
          {currentIndex + 1} / {cards.length}
        </div>
        <div className="stats-mini">
          <span className="stat-mint">✓ {toMint.length}</span>
          <span className="stat-discard">✗ {discarded.length}</span>
        </div>
      </div>

      <div className="swipe-instructions">
        <div className="instruction left">
          <span className="icon">⬅️</span>
          <span>Swipe left to discard</span>
        </div>
        <div className="instruction right">
          <span>Swipe right to mint</span>
          <span className="icon">➡️</span>
        </div>
      </div>

      <div className="card-stack">
        {currentCard && (
          <SwipeableCard
            card={currentCard}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
          />
        )}
      </div>

      <div className="action-buttons">
        <button
          className="action-btn discard"
          onClick={handleSwipeLeft}
          disabled={isLastCard && currentIndex >= cards.length}
        >
          <span className="btn-icon">✗</span>
          <span>Discard</span>
        </button>

        <button
          className="action-btn undo"
          onClick={handleUndo}
          disabled={currentIndex === 0}
        >
          <span className="btn-icon">↶</span>
          <span>Undo</span>
        </button>

        <button
          className="action-btn mint"
          onClick={handleSwipeRight}
          disabled={isLastCard && currentIndex >= cards.length}
        >
          <span className="btn-icon">✓</span>
          <span>Mint</span>
        </button>
      </div>
    </div>
  );
}

export default CurationScreen;
