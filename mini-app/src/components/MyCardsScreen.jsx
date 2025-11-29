import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useMyCards } from '../hooks/useMyCards'
import './MyCardsScreen.css'

function MyCardsScreen({ onBack }) {
  const { isConnected } = useAccount()
  const { cards, loading, error, refetch, getOpenSeaUrl } = useMyCards()
  const [selectedCard, setSelectedCard] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'detail'

  const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS
  const NETWORK = import.meta.env.VITE_NETWORK || 'base'

  const getCollectionUrl = () => {
    const network = NETWORK === 'baseSepolia' ? 'base-sepolia' : 'base'
    return `https://opensea.io/assets/${network}/${NFT_CONTRACT_ADDRESS}`
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="my-cards-screen">
        <div className="screen-header">
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
          <h2>My Cards</h2>
          <div className="header-spacer"></div>
        </div>

        <div className="connect-prompt">
          <div className="connect-icon">🔗</div>
          <h3>Connect Your Wallet</h3>
          <p>Connect your wallet to view your minted cards</p>
          <div className="connect-btn-wrapper">
            <ConnectButton />
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="my-cards-screen">
        <div className="screen-header">
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
          <h2>My Cards</h2>
          <div className="header-spacer"></div>
        </div>

        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your collection...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="my-cards-screen">
        <div className="screen-header">
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
          <h2>My Cards</h2>
          <div className="header-spacer"></div>
        </div>

        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Failed to Load</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={refetch}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (cards.length === 0) {
    return (
      <div className="my-cards-screen">
        <div className="screen-header">
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
          <h2>My Cards</h2>
          <div className="header-spacer"></div>
        </div>

        <div className="empty-state">
          <div className="empty-icon">🃏</div>
          <h3>No Cards Yet</h3>
          <p>Generate and mint your first trading card!</p>
          <button className="generate-cta" onClick={onBack}>
            🎨 Generate a Card
          </button>
        </div>
      </div>
    )
  }

  // Detail view for selected card
  if (selectedCard && viewMode === 'detail') {
    return (
      <div className="my-cards-screen">
        <div className="screen-header">
          <button className="back-btn" onClick={() => setSelectedCard(null)}>
            ← Back to Collection
          </button>
          <h2>Card Details</h2>
          <div className="header-spacer"></div>
        </div>

        <div className="card-detail-view">
          {/* Display the IPFS image directly (already a full card screenshot) */}
          <div className="nft-image-container">
            <img
              src={selectedCard.image || selectedCard.imageData}
              alt={selectedCard.name}
              className="nft-card-image"
            />
          </div>

          <div className="card-detail-info">
            {selectedCard.tokenId && (
              <div className="token-badge">Token #{selectedCard.tokenId}</div>
            )}

            <div className="detail-actions">
              {selectedCard.tokenId && (
                <a
                  href={getOpenSeaUrl(selectedCard.tokenId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opensea-btn-large"
                >
                  <svg className="opensea-logo" viewBox="0 0 90 90" fill="none">
                    <circle cx="45" cy="45" r="45" fill="#2081E2"/>
                    <path d="M22.216 46.653 22.4 46.3l13.098-20.435c.18-.282.61-.203.681.125a35.184 35.184 0 0 0 2.768 7.726c.467 1.063.998 2.096 1.588 3.092.1.169.085.38-.041.53l-16.05 9.242a.378.378 0 0 1-.525-.097.384.384 0 0 1-.036-.102l-.666-1.728z" fill="white"/>
                    <path d="M66.21 50.578h-6.573a.35.35 0 0 1-.308-.184l-3.228-5.59a.35.35 0 0 0-.308-.184h-8.645a.35.35 0 0 0-.308.184l-3.227 5.59a.35.35 0 0 1-.308.184h-6.574a.35.35 0 0 1-.308-.525l9.927-17.2a.35.35 0 0 1 .308-.184h9.927a.35.35 0 0 1 .308.184l9.927 17.2a.35.35 0 0 1-.308.525z" fill="white"/>
                  </svg>
                  View on OpenSea
                </a>
              )}

              {selectedCard.transactionHash && (
                <a
                  href={`https://basescan.org/tx/${selectedCard.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="basescan-link"
                >
                  View Transaction ↗
                </a>
              )}
            </div>

            {selectedCard.mintedAt && (
              <p className="minted-date">
                Minted {new Date(selectedCard.mintedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Grid view (main collection)
  return (
    <div className="my-cards-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h2>My Cards</h2>
        <button className="refresh-btn" onClick={refetch} title="Refresh">
          ↻
        </button>
      </div>

      <div className="collection-stats">
        <div className="stat-item">
          <span className="stat-number">{cards.length}</span>
          <span className="stat-label">Cards</span>
        </div>
        <a 
          href={getCollectionUrl()} 
          target="_blank" 
          rel="noopener noreferrer"
          className="opensea-collection-link"
        >
          View Collection on OpenSea ↗
        </a>
      </div>

      <div className="cards-grid">
        {cards.map((card, index) => (
          <div 
            key={card.id || index} 
            className="card-grid-item"
            onClick={() => {
              setSelectedCard(card)
              setViewMode('detail')
            }}
          >
            <div className="card-image-wrapper">
              {card.image || card.imageData ? (
                <img 
                  src={card.image || card.imageData} 
                  alt={card.name}
                  className="card-grid-image"
                />
              ) : (
                <div className="card-placeholder">🃏</div>
              )}
              {card.rarity && (
                <span className={`rarity-badge rarity-${card.rarity.toLowerCase()}`}>
                  {card.rarity}
                </span>
              )}
            </div>
            <div className="card-grid-info">
              <h4 className="card-grid-name">{card.name}</h4>
              {card.tokenId && (
                <span className="card-grid-token">#{card.tokenId}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyCardsScreen
