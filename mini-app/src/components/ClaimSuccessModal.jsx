import { useState, useEffect } from 'react';
import './ClaimSuccessModal.css';

const NFT_CONTRACT = '0xcc2d6ba8564541e6e51fe5522e26d4f4bbdd458b';

function ClaimSuccessModal({ tokenId, txHash, onClose }) {
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    const fetchCardData = async () => {
      try {
        // Fetch token URI from contract
        const response = await fetch(`https://mainnet.base.org`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{
              to: NFT_CONTRACT,
              data: `0xc87b56dd${tokenId.toString(16).padStart(64, '0')}` // tokenURI(uint256)
            }, 'latest'],
            id: 1
          })
        });

        const result = await response.json();
        if (result.result && result.result !== '0x') {
          // Decode the URI from hex
          const hex = result.result.slice(2);
          // Skip first 64 chars (offset) and next 64 (length), then decode
          const lengthHex = hex.slice(64, 128);
          const length = parseInt(lengthHex, 16);
          const dataHex = hex.slice(128, 128 + length * 2);
          const uri = decodeURIComponent(
            dataHex.match(/.{2}/g).map(byte => '%' + byte).join('')
          );

          // Fetch metadata
          const metaUrl = uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
          const metaResponse = await fetch(metaUrl);
          const metadata = await metaResponse.json();
          
          setCardData(metadata);
          
          // Get image URL
          if (metadata.image) {
            const imgUrl = metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
            setImageUrl(imgUrl);
          }
        }
      } catch (err) {
        console.error('Failed to fetch card data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (tokenId !== null && tokenId !== undefined) {
      fetchCardData();
    }
  }, [tokenId]);

  const openSeaUrl = `https://opensea.io/assets/base/${NFT_CONTRACT}/${tokenId}`;

  return (
    <div className="claim-modal-overlay" onClick={onClose}>
      <div className="claim-modal-content" onClick={e => e.stopPropagation()}>
        <button className="claim-modal-close" onClick={onClose}>×</button>

        <div className="claim-success-header">
          <div className="claim-success-icon">🎴</div>
          <h2>Card Claimed!</h2>
          <p className="claim-token-badge">Token #{tokenId}</p>
        </div>

        <div className="claim-card-container">
          {loading ? (
            <div className="claim-card-loading">
              <div className="claim-spinner"></div>
              <p>Loading your card...</p>
            </div>
          ) : imageUrl ? (
            <img 
              src={imageUrl} 
              alt={cardData?.name || `Card #${tokenId}`}
              className="claim-card-image"
            />
          ) : (
            <div className="claim-card-placeholder">
              <p>🌊 SURF Waves Card #{tokenId}</p>
            </div>
          )}
        </div>

        {cardData && (
          <div className="claim-card-info">
            <h3>{cardData.name}</h3>
            {cardData.description && (
              <p className="claim-card-desc">{cardData.description.slice(0, 100)}...</p>
            )}
          </div>
        )}

        <a 
          href={openSeaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="claim-opensea-btn"
        >
          <span>View on OpenSea</span>
          <span>→</span>
        </a>

        <div className="claim-modal-links">
          <a 
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Transaction ↗
          </a>
        </div>

        <button className="claim-done-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

export default ClaimSuccessModal;
