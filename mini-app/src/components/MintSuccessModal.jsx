import { useState } from 'react'
import './MintSuccessModal.css'

function MintSuccessModal({ mintData, onClose }) {
  const { cards, tokenIds, transactionHash } = mintData
  const [downloading, setDownloading] = useState({})

  const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS
  const NETWORK = import.meta.env.VITE_NETWORK || 'base'

  /**
   * Download card art from IPFS
   */
  const downloadCardArt = async (card, index) => {
    try {
      setDownloading((prev) => ({ ...prev, [index]: true }))

      // Get the styled card IPFS link from the card data
      // The IPFS upload creates a styled_card PNG that we can download
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

      // Fetch card details to get IPFS links
      const response = await fetch(`${API_BASE_URL}/api/cards/${card.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch card IPFS links')
      }

      const cardData = await response.json()

      // Find the styled_card IPFS link
      const styledCardLink = cardData.ipfsLinks?.find(
        (link) => link.type === 'styled_card'
      )

      if (!styledCardLink) {
        // Fallback: use the raw image if styled card not available
        const rawImageLink = cardData.ipfsLinks?.find(
          (link) => link.type === 'raw_image'
        )
        if (rawImageLink) {
          window.open(rawImageLink.gateway_url, '_blank')
          return
        }
        throw new Error('No card image found in IPFS')
      }

      // Download the image
      const imageResponse = await fetch(styledCardLink.gateway_url)
      const blob = await imageResponse.blob()
      const url = window.URL.createObjectURL(blob)

      // Create download link
      const a = document.createElement('a')
      a.href = url
      a.download = `${card.name.replace(/\s+/g, '_')}_NFT.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      console.log('✅ Card art downloaded:', card.name)
    } catch (err) {
      console.error('Download failed:', err)
      alert(`Failed to download card art: ${err.message}`)
    } finally {
      setDownloading((prev) => ({ ...prev, [index]: false }))
    }
  }

  /**
   * Get OpenSea URL for a token
   */
  const getOpenSeaUrl = (tokenId) => {
    // Base network uses 'base', Base Sepolia uses 'base-sepolia'
    const network = NETWORK === 'baseSepolia' ? 'base-sepolia' : 'base'
    return `https://opensea.io/assets/${network}/${NFT_CONTRACT_ADDRESS}/${tokenId}`
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="success-header">
          <div className="success-icon">🎉</div>
          <h2>Minting Successful!</h2>
          <p className="success-subtitle">
            Your {cards.length} card{cards.length > 1 ? 's have' : ' has'} been minted on BASE
          </p>
        </div>

        <div className="tx-info">
          <a
            href={`https://basescan.org/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tx-link"
          >
            View Transaction on BaseScan ↗
          </a>
        </div>

        <div className="minted-cards">
          {cards.map((card, index) => {
            const tokenId = tokenIds[index]
            return (
              <div key={index} className="minted-card-item">
                <div className="card-preview">
                  {card.imageData && (
                    <img
                      src={card.imageData}
                      alt={card.name}
                      className="card-thumbnail"
                    />
                  )}
                </div>

                <div className="card-info">
                  <h3 className="card-name">{card.name}</h3>
                  {tokenId !== undefined && (
                    <p className="token-id">Token ID: #{tokenId}</p>
                  )}

                  <div className="card-actions">
                    <button
                      className="download-btn"
                      onClick={() => downloadCardArt(card, index)}
                      disabled={downloading[index]}
                    >
                      {downloading[index] ? (
                        <>⏳ Downloading...</>
                      ) : (
                        <>📥 Download Art</>
                      )}
                    </button>

                    {tokenId !== undefined && (
                      <a
                        href={getOpenSeaUrl(tokenId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opensea-btn"
                      >
                        <img
                          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 90 90' fill='none'%3E%3Cpath fill='%232081E2' d='M45 0C20.151 0 0 20.151 0 45s20.151 45 45 45 45-20.151 45-45S69.849 0 45 0z'/%3E%3Cpath fill='white' d='M22.216 46.653 22.4 46.3l13.098-20.435c.18-.282.61-.203.681.125a35.184 35.184 0 0 0 2.768 7.726c.467 1.063.998 2.096 1.588 3.092.1.169.085.38-.041.53l-16.05 9.242a.378.378 0 0 1-.525-.097.384.384 0 0 1-.036-.102l-.666-1.728zm43.994 3.925h-6.573a.35.35 0 0 1-.308-.184l-3.228-5.59a.35.35 0 0 0-.308-.184h-8.645a.35.35 0 0 0-.308.184l-3.227 5.59a.35.35 0 0 1-.308.184h-6.574a.35.35 0 0 1-.308-.525l9.927-17.2a.35.35 0 0 1 .308-.184h9.927a.35.35 0 0 1 .308.184l9.927 17.2a.35.35 0 0 1-.308.525z'/%3E%3C/svg%3E"
                          alt="OpenSea"
                          className="opensea-icon"
                        />
                        View on OpenSea
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <button className="close-success-btn" onClick={onClose}>
          ✨ Awesome!
        </button>
      </div>
    </div>
  )
}

export default MintSuccessModal
