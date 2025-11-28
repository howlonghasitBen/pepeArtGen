import { useState } from 'react'
import MintedCardDisplay from './MintedCardDisplay'
import './MintSuccessModal.css'

function MintSuccessModal({ mintData, onClose }) {
  const { cards, tokenIds, transactionHash } = mintData
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [downloading, setDownloading] = useState({})

  const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS
  const NETWORK = import.meta.env.VITE_NETWORK || 'base'

  const currentCard = cards[currentCardIndex]
  const currentTokenId = tokenIds[currentCardIndex]

  /**
   * Download card art from IPFS
   */
  const downloadCardArt = async (card, index) => {
    try {
      setDownloading((prev) => ({ ...prev, [index]: true }))

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

      const response = await fetch(`${API_BASE_URL}/api/cards/${card.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch card IPFS links')
      }

      const cardData = await response.json()

      const styledCardLink = cardData.ipfsLinks?.find(
        (link) => link.type === 'styled_card'
      )

      if (!styledCardLink) {
        const rawImageLink = cardData.ipfsLinks?.find(
          (link) => link.type === 'raw_image'
        )
        if (rawImageLink) {
          window.open(rawImageLink.gateway_url, '_blank')
          return
        }
        throw new Error('No card image found in IPFS')
      }

      const imageResponse = await fetch(styledCardLink.gateway_url)
      const blob = await imageResponse.blob()
      const url = window.URL.createObjectURL(blob)

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
    const network = NETWORK === 'baseSepolia' ? 'base-sepolia' : 'base'
    return `https://opensea.io/assets/${network}/${NFT_CONTRACT_ADDRESS}/${tokenId}`
  }

  const handlePrevCard = () => {
    setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : cards.length - 1))
  }

  const handleNextCard = () => {
    setCurrentCardIndex((prev) => (prev < cards.length - 1 ? prev + 1 : 0))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
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
          
          <MintedCardDisplay card={currentCard} />
          
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
            <svg className="opensea-logo" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="45" cy="45" r="45" fill="#2081E2"/>
              <path d="M22.216 46.653 22.4 46.3l13.098-20.435c.18-.282.61-.203.681.125a35.184 35.184 0 0 0 2.768 7.726c.467 1.063.998 2.096 1.588 3.092.1.169.085.38-.041.53l-16.05 9.242a.378.378 0 0 1-.525-.097.384.384 0 0 1-.036-.102l-.666-1.728z" fill="white"/>
              <path d="M66.21 50.578h-6.573a.35.35 0 0 1-.308-.184l-3.228-5.59a.35.35 0 0 0-.308-.184h-8.645a.35.35 0 0 0-.308.184l-3.227 5.59a.35.35 0 0 1-.308.184h-6.574a.35.35 0 0 1-.308-.525l9.927-17.2a.35.35 0 0 1 .308-.184h9.927a.35.35 0 0 1 .308.184l9.927 17.2a.35.35 0 0 1-.308.525z" fill="white"/>
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
            View on BaseScan ↗
          </a>
          <button
            className="action-link"
            onClick={() => downloadCardArt(currentCard, currentCardIndex)}
            disabled={downloading[currentCardIndex]}
          >
            {downloading[currentCardIndex] ? 'Downloading...' : '📥 Download Art'}
          </button>
        </div>

        <button className="close-success-btn" onClick={onClose}>
          ✨ Done
        </button>
      </div>
    </div>
  )
}

export default MintSuccessModal
