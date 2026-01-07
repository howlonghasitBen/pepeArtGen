import { useState, useEffect } from "react";
import "./MintSuccessModal.css";

function MintSuccessModal({ mintData, onClose }) {
  const { cards, tokenIds, transactionHash } = mintData;
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [downloading, setDownloading] = useState({});
  const [cardImages, setCardImages] = useState({});
  const [loadingImages, setLoadingImages] = useState(true);

  const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
  const NETWORK = import.meta.env.VITE_NETWORK || "base";
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  const currentCard = cards[currentCardIndex];
  const currentTokenId = tokenIds[currentCardIndex];

  // Fetch the styled_card (full rendered card screenshot) from API
  useEffect(() => {
    const fetchCardImages = async () => {
      setLoadingImages(true);
      const images = {};

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const cardId = card.databaseId || card.id;

        try {
          console.log(`📤 Fetching styled_card for: ${cardId}`);
          const response = await fetch(`${API_BASE_URL}/api/cards/${cardId}`);

          if (!response.ok) {
            console.warn(
              `⚠️ API returned ${response.status} for card ${cardId}`
            );
            continue;
          }

          const cardData = await response.json();

          // Get styled_card - this is the full rendered card (cardImageCID)
          // Same image that OpenSea displays as thumbnail
          const styledCardLink = cardData.ipfsLinks?.find(
            (l) => l.type === "styled_card"
          );

          if (styledCardLink?.gateway_url) {
            console.log(
              `✅ Found styled_card for card ${i}:`,
              styledCardLink.gateway_url
            );
            images[i] = styledCardLink.gateway_url;
          } else {
            console.warn(`⚠️ No styled_card found for card ${cardId}`);
            console.warn(
              `   Available types:`,
              cardData.ipfsLinks?.map((l) => l.type)
            );
          }
        } catch (err) {
          console.error(`❌ Failed to fetch card ${cardId}:`, err);
        }
      }

      setCardImages(images);
      setLoadingImages(false);
    };

    if (cards.length > 0) {
      fetchCardImages();
    } else {
      setLoadingImages(false);
    }
  }, [cards, API_BASE_URL]);

  // Get the image URL - prefer fetched styled_card, fallback to card.imageData
  const getCardImage = (index) => {
    return cardImages[index] || cards[index]?.imageData;
  };

  const currentImageUrl = getCardImage(currentCardIndex);

  /**
   * Check if running on mobile device
   */
  const isMobile = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  };

  /**
   * Download card art via server proxy (bypasses CORS)
   * On mobile/wallet apps: uses Web Share API or opens in new tab
   * On desktop: triggers automatic download
   */
  const downloadCardArt = async (card, index) => {
    try {
      setDownloading((prev) => ({ ...prev, [index]: true }));

      const cardId = card.databaseId || card.id;

      if (!cardId) {
        alert("Card ID not available for download.");
        return;
      }

      // Use server proxy to download (bypasses CORS)
      const downloadUrl = `${API_BASE_URL}/api/cards/${cardId}/download`;
      const filename = `${card.name.replace(/\s+/g, "_")}_NFT.png`;

      // Fetch the image first
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Download failed: ${response.status}`);
      }

      const blob = await response.blob();

      // On mobile, try Web Share API first (works in wallet apps)
      if (isMobile() && navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], filename, { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: card.name,
              text: `${card.name} NFT Card`,
            });
            console.log("✅ Card shared via Web Share API:", card.name);
            return;
          }
        } catch (shareErr) {
          // User cancelled or share failed, fall through to other methods
          if (shareErr.name !== "AbortError") {
            console.warn("Share failed, trying fallback:", shareErr);
          }
        }
      }

      // Create blob URL for download/display
      const url = window.URL.createObjectURL(blob);

      // On mobile, if share didn't work, open blob URL in new tab
      if (isMobile()) {
        // Open blob URL directly - this shows the image for saving
        window.open(url, "_blank");
        // Don't revoke immediately so the new tab can load it
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        console.log("✅ Opened card image in new tab (mobile):", card.name);
        return;
      }

      // Desktop: trigger download via anchor click
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
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
          x
        </button>

        <div className="success-header">
          <div className="success-icon">[OK]</div>
          <h2>Minted on Base!</h2>
          {currentTokenId !== undefined && (
            <p className="token-id-badge">Token #{currentTokenId}</p>
          )}
        </div>

        {/* Full Card Display - shows styled_card (full rendered card screenshot) */}
        <div className="full-card-container">
          {cards.length > 1 && (
            <button className="card-nav-btn prev" onClick={handlePrevCard}>
              &lt;
            </button>
          )}

          <div className="success-card-wrapper">
            {loadingImages ? (
              <div className="card-placeholder">
                <div className="loading-spinner"></div>
                <p>Loading card...</p>
              </div>
            ) : currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt={currentCard.name || `Card #${currentTokenId}`}
                className="success-card-image"
              />
            ) : (
              <div className="card-placeholder">
                <p>Image not available</p>
              </div>
            )}
          </div>

          {cards.length > 1 && (
            <button className="card-nav-btn next" onClick={handleNextCard}>
              &gt;
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
            <svg
              className="opensea-logo"
              viewBox="0 0 90 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="45" cy="45" r="45" fill="#2081E2" />
              <path
                d="M22.216 46.653 22.4 46.3l13.098-20.435c.18-.282.61-.203.681.125a35.184 35.184 0 0 0 2.768 7.726c.467 1.063.998 2.096 1.588 3.092.1.169.085.38-.041.53l-16.05 9.242a.378.378 0 0 1-.525-.097.384.384 0 0 1-.036-.102l-.666-1.728z"
                fill="white"
              />
              <path
                d="M66.21 50.578h-6.573a.35.35 0 0 1-.308-.184l-3.228-5.59a.35.35 0 0 0-.308-.184h-8.645a.35.35 0 0 0-.308.184l-3.227 5.59a.35.35 0 0 1-.308.184h-6.574a.35.35 0 0 1-.308-.525l9.927-17.2a.35.35 0 0 1 .308-.184h9.927a.35.35 0 0 1 .308.184l9.927 17.2a.35.35 0 0 1-.308.525z"
                fill="white"
              />
            </svg>
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
            View on BaseScan [^]
          </a>
          <button
            className="action-link"
            onClick={() => downloadCardArt(currentCard, currentCardIndex)}
            disabled={downloading[currentCardIndex] || loadingImages}
          >
            {downloading[currentCardIndex]
              ? "Downloading..."
              : "[D] Download Art"}
          </button>
        </div>

        <button className="close-success-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

export default MintSuccessModal;
