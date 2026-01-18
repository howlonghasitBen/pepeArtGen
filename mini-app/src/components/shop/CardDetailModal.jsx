import { useEffect } from "react";
import "./CardDetailModal.css";

function CardDetailModal({ card, onClose }) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Exit pointer lock when modal opens
    document.exitPointerLock?.();

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!card) return null;

  const imageUrl = card.image || card.imageData;
  const openSeaUrl = card.openSeaUrl;

  return (
    <div className="card-detail-overlay" onClick={onClose}>
      <div className="card-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="card-detail-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Card image */}
        <div className="card-detail-image-container">
          {imageUrl ? (
            <img src={imageUrl} alt={card.name} className="card-detail-image" />
          ) : (
            <div className="card-detail-placeholder">
              <span>No Image</span>
            </div>
          )}
        </div>

        {/* Card info */}
        <div className="card-detail-info">
          <h2 className="card-detail-name">{card.name || "Unknown Card"}</h2>

          {card.description && (
            <p className="card-detail-description">{card.description}</p>
          )}

          {card.tokenId && (
            <div className="card-detail-stat">
              <span className="stat-label">Token ID</span>
              <span className="stat-value">#{card.tokenId}</span>
            </div>
          )}

          {card.rarity && (
            <div className="card-detail-stat">
              <span className="stat-label">Rarity</span>
              <span className="stat-value rarity">{card.rarity}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="card-detail-actions">
            {openSeaUrl && (
              <a
                href={openSeaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="card-detail-btn opensea"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0ZM5.92 12.403l.051-.081 3.123-4.884a.107.107 0 0 1 .187.014c.52 1.169.972 2.623.76 3.528-.088.372-.335.876-.614 1.342a2.405 2.405 0 0 1-.117.199.106.106 0 0 1-.09.045H6.013a.106.106 0 0 1-.093-.163Zm13.914 1.68a.109.109 0 0 1-.065.101c-.243.103-1.07.485-1.414.962-.878 1.222-1.548 2.97-3.048 2.97H9.053a4.019 4.019 0 0 1-4.013-4.028v-.072c0-.058.048-.106.108-.106h3.485c.07 0 .12.063.115.132-.026.226.017.459.125.67.206.42.636.682 1.099.682h1.726v-1.347H9.99a.11.11 0 0 1-.089-.173l.063-.09c.16-.231.391-.586.621-.992.156-.274.308-.566.43-.86.024-.052.043-.107.065-.16.033-.094.067-.182.091-.269a4.57 4.57 0 0 0 .065-.223c.057-.25.081-.514.081-.787 0-.108-.004-.221-.014-.327-.005-.117-.02-.235-.034-.352a3.415 3.415 0 0 0-.048-.312 6.494 6.494 0 0 0-.098-.468l-.014-.06c-.029-.108-.052-.21-.086-.318a17.6 17.6 0 0 0-.27-.86c-.027-.08-.057-.165-.091-.25a7.09 7.09 0 0 0-.39-.909c-.029-.057-.057-.108-.086-.165l-.086-.16-.076-.141-.075-.147c-.024-.046-.043-.086-.067-.125l-.066-.13a.117.117 0 0 1 .021-.133l.04-.036.034-.029h.026l1.239.283.064.016.07.016.078.022.09.025v-.763c0-.323.26-.586.579-.586.16 0 .304.066.408.172.104.107.171.254.171.414v1.135l.065.017a.05.05 0 0 1 .014.01l.163.113c.07.048.14.105.223.163a6.7 6.7 0 0 1 .497.406c.169.148.357.322.564.52.054.053.108.107.163.166l.206.223c.091.104.178.212.265.325l.183.254c.024.034.043.067.067.101.076.117.143.24.206.362l.086.182c.076.173.138.352.182.536.019.063.033.131.043.2.029.192.039.39.029.586-.014.14-.033.28-.062.422l-.043.156-.06.188c-.052.15-.114.298-.19.446-.029.057-.057.118-.091.175a4.03 4.03 0 0 1-.266.417c-.038.057-.081.117-.124.175a4.382 4.382 0 0 1-.276.325l-.173.196a2.636 2.636 0 0 1-.163.163l-.107.103-.005.004-.063.063h-.008l-.02.017H12.7v1.347h1.348c.288 0 .565-.097.786-.274l.01-.01.007-.004 1.612-1.377a.107.107 0 0 1 .07-.025h3.235c.062 0 .108.054.101.112Z"/>
                </svg>
                View on OpenSea
              </a>
            )}
            <button className="card-detail-btn back" onClick={onClose}>
              Back to Shop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardDetailModal;
