import { useState } from "react";
import "./MintSuccessModal.css";

function MintSuccessModal({ mintData, onClose }) {
  const { cards, tokenIds, transactionHash } = mintData;
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [downloading, setDownloading] = useState({});

  const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
  const NETWORK = import.meta.env.VITE_NETWORK || "base";

  const currentCard = cards[currentCardIndex];
  const currentTokenId = tokenIds[currentCardIndex];

  /**
   * Download card art directly from the image URL (IPFS)
   */
  const downloadCardArt = async (card, index) => {
    try {
      setDownloading((prev) => ({ ...prev, [index]: true }));

      const imageUrl = card.image || card.imageData;

      if (!imageUrl) {
        throw new Error("No image URL found for this card");
      }

      // Fetch the image as a blob
      const imageResponse = await fetch(imageUrl);
      const blob = await imageResponse.blob();
      const url = window.URL.createObjectURL(blob);

      // Create temporary link to trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${card.name.replace(/\s+/g, "_")}_NFT.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log("✅ Card art downloaded:", card.name);
    } catch (err) {
      console.error("Download failed:", err);
      alert(`Failed to download card art: ${err.message}`);
    } finally {
      setDownloading((prev) => ({ ...prev, [index]: false }));
    }
  };

  /**
   * Get OpenSea URL for a token
   */
  const getOpenSeaUrl = (tokenId) => {
    const network = NETWORK === "baseSepolia" ? "base-sepolia" : "base";
    return `https://opensea.io/assets/${network}/${NFT_CONTRACT_ADDRESS}/${tokenId}`;
  };

  const handlePrevCard = () => {
    setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : cards.length - 1));
  };

  const handleNextCard = () => {
    setCurrentCardIndex((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content success-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="success-header">
          <div className="success-icon">🎉</div>
          <h2>Minted on Base!</h2>
          {currentTokenId !== undefined && (
            <p className="token-id-badge">Token #{currentTokenId}</p>
          )}
        </div>

        {/* Full Card Display */}
        <div className="full-card-container">
          {cards.length > 1 && (
            <button className="card-nav-btn prev" onClick={handlePrevCard}>
              ‹
            </button>
          )}

          <div className="minted-card-display-wrapper">
            {currentCard.image || currentCard.imageData ? (
              <img
                src={currentCard.image || currentCard.imageData}
                alt={currentCard.name || `Card #${currentTokenId}`}
                className="minted-card-image"
                style={{
                  maxWidth: "100%",
                  maxHeight: "60vh",
                  borderRadius: "12px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div className="card-placeholder">
                <p>Loading card image...</p>
              </div>
            )}
          </div>

          {cards.length > 1 && (
            <button className="card-nav-btn next" onClick={handleNextCard}>
              ›
            </button>
          )}
        </div>

        {/* Card Counter for multiple cards */}
        {cards.length > 1 && (
          <div className="card-counter">
            {currentCardIndex + 1} / {cards.length}
          </div>
        )}

        {/* OpenSea Link - Prominent */}
        {currentTokenId !== undefined && (
          <a
            href={getOpenSeaUrl(currentTokenId)}
            target="_blank"
            rel="noopener noreferrer"
            className="opensea-link-prominent"
          >
            <img src={openseaLogo} alt="OpenSea" />
            View on OpenSea
          </a>
        )}

        {/* Secondary Actions */}
        <div className="secondary-actions">
          <a
            href={`https://basescan.org/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="action-link"
          >
            View on BaseScan ↗
          </a>
          <button
            className="action-link"
            onClick={() => downloadCardArt(currentCard, currentCardIndex)}
            disabled={downloading[currentCardIndex]}
          >
            {downloading[currentCardIndex]
              ? "Downloading..."
              : "📥 Download Art"}
          </button>
        </div>

        <button className="close-success-btn" onClick={onClose}>
          ✨ Done
        </button>
      </div>
    </div>
  );
}

export default MintSuccessModal;
