import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMintCard } from "../hooks/useMintCard";
import "./MintingModal.css";

function MintingModal({ cards, onClose, onSuccess }) {
  const { isConnected } = useAccount();
  const { mint, status, error } = useMintCard();
  const [txHash, setTxHash] = useState(null);

  const handleMint = async () => {
    try {
      const hash = await mint(cards);
      setTxHash(hash);

      // Wait a bit then call success
      setTimeout(() => {
        onSuccess(hash);
      }, 2000);
    } catch (err) {
      console.error("Minting error:", err);
    }
  };

  const gasCost = "~$0.01"; // Approximate gas cost on Base L2

  const getStatusMessage = () => {
    switch (status) {
      case "uploading":
        return "📤 Uploading to IPFS...";
      case "minting":
        return "⚡ Minting NFT on BASE...";
      case "confirming":
        return "⏳ Confirming transaction...";
      case "success":
        return "🎉 Minted successfully!";
      case "error":
        return "❌ Minting failed";
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <h2>🪙 Mint NFTs on BASE</h2>

        <div className="mint-summary">
          <div className="summary-row">
            <span>Cards to mint:</span>
            <span className="value">{cards.length}</span>
          </div>
          <div className="summary-row">
            <span>Minting cost:</span>
            <span className="value">FREE</span>
          </div>
          <div className="summary-row total">
            <span>Gas fees (estimated):</span>
            <span className="value">{gasCost}</span>
          </div>
        </div>

        <div className="info-note">
          <p>✅ You already paid $2.50 USDC for generation</p>
          <p>🆓 Minting is FREE - only gas fees apply</p>
        </div>

        {getStatusMessage() && (
          <div className={`status-message ${status}`}>{getStatusMessage()}</div>
        )}

        {error && <div className="error-message">{error}</div>}

        {txHash && (
          <div className="tx-hash">
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on BaseScan ↗
            </a>
          </div>
        )}

        {!isConnected ? (
          <div className="connect-section">
            <p>Connect your wallet to mint</p>
            <ConnectButton />
          </div>
        ) : status === "idle" || status === "error" ? (
          <button className="mint-btn" onClick={handleMint}>
            🪙 Mint {cards.length} Card{cards.length > 1 ? "s" : ""} (FREE)
          </button>
        ) : status === "success" ? (
          <button className="success-btn" onClick={onClose}>
            ✅ Done
          </button>
        ) : (
          <button className="mint-btn" disabled>
            Processing...
          </button>
        )}
      </div>
    </div>
  );
}

export default MintingModal;
