import { useState, useEffect, useCallback } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import WAVES_TCG_NFT_ABI from '../contracts/WavesTCGNFT.json'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

export function useMyCards() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()

  const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS
  const NETWORK = import.meta.env.VITE_NETWORK || 'base'

  /**
   * Fetch user's minted cards from backend
   */
  const fetchCardsFromBackend = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cards/wallet/${address}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch cards from backend')
      }

      const data = await response.json()
      return data.cards || []
    } catch (err) {
      console.warn('Backend fetch failed, falling back to on-chain:', err)
      return null
    }
  }

  /**
   * Fetch token metadata from IPFS
   */
  const fetchTokenMetadata = async (tokenURI) => {
    try {
      // Handle IPFS URIs
      let url = tokenURI
      if (tokenURI.startsWith('ipfs://')) {
        url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch metadata')
      }

      return await response.json()
    } catch (err) {
      console.error('Error fetching token metadata:', err)
      return null
    }
  }

  /**
   * Get OpenSea URL for a token
   */
  const getOpenSeaUrl = (tokenId) => {
    const network = NETWORK === 'baseSepolia' ? 'base-sepolia' : 'base'
    return `https://opensea.io/assets/${network}/${NFT_CONTRACT_ADDRESS}/${tokenId}`
  }

  /**
   * Fetch cards from blockchain using CardMinted events
   */
  const fetchCardsFromBlockchain = async () => {
    try {
      if (!NFT_CONTRACT_ADDRESS || !publicClient) {
        return []
      }

      // Query CardMinted events for this address
      const logs = await publicClient.getLogs({
        address: NFT_CONTRACT_ADDRESS,
        event: {
          type: 'event',
          name: 'CardMinted',
          inputs: [
            { type: 'address', indexed: true, name: 'minter' },
            { type: 'uint256', indexed: true, name: 'tokenId' },
            { type: 'string', indexed: false, name: 'tokenURI' }
          ]
        },
        args: {
          minter: address
        },
        fromBlock: 'earliest',
        toBlock: 'latest'
      })

      if (!logs || logs.length === 0) {
        return []
      }

      // Process each minted card
      const cardsPromises = logs.map(async (log) => {
        try {
          const tokenId = log.args.tokenId.toString()
          const tokenURI = log.args.tokenURI

          // Fetch metadata from IPFS
          const metadata = await fetchTokenMetadata(tokenURI)

          if (!metadata) {
            return {
              id: `token-${tokenId}`,
              tokenId,
              name: `Card #${tokenId}`,
              image: null,
              openSeaUrl: getOpenSeaUrl(tokenId),
            }
          }

          // Extract attributes from metadata
          const getAttr = (traitType, defaultValue = '') => {
            const attr = metadata.attributes?.find(attr => attr.trait_type === traitType)
            return attr ? attr.value : defaultValue
          }

          // Process image URL
          let imageUrl = metadata.image
          if (imageUrl?.startsWith('ipfs://')) {
            imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
          }

          // Build card object compatible with MintedCardDisplay
          return {
            id: `token-${tokenId}`,
            tokenId,
            name: metadata.name || `Card #${tokenId}`,
            subtitle: '',
            image: imageUrl,
            imageData: imageUrl,
            rarity: getAttr('Rarity', 'Common'),
            type: getAttr('Type', 'Creature'),
            level: getAttr('Level', '1'),
            artist: getAttr('Artist', 'Waves TCG'),
            stats: {
              attack: getAttr('Attack', 0),
              defense: getAttr('Defense', 0),
            },
            manaCost: [
              { type: 'hp', value: getAttr('HP', 0), color: '#ff4444', textColor: '#fff' },
              { type: 'mana', value: getAttr('Mana', 0), color: '#4444ff', textColor: '#fff' },
            ],
            flavorText: metadata.description || `${metadata.name} - A unique trading card`,
            theme: {
              background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
              header: {
                background: 'rgba(0, 0, 0, 0.6)',
                color: '#fff',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              },
              imageArea: {
                background: 'rgba(0, 0, 0, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
              },
              typeSection: {
                background: 'rgba(0, 0, 0, 0.6)',
                color: '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              },
              stat: {
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              },
              flavorText: {
                background: 'rgba(0, 0, 0, 0.4)',
                color: '#ddd',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
              bottomSection: {
                background: 'rgba(0, 0, 0, 0.6)',
              },
              rarity: {
                background: 'rgba(255, 215, 0, 0.2)',
                color: '#ffd700',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)',
              },
            },
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
            openSeaUrl: getOpenSeaUrl(tokenId),
          }
        } catch (err) {
          console.error(`Error processing token ${log.args.tokenId}:`, err)
          return null
        }
      })

      const cards = await Promise.all(cardsPromises)
      return cards.filter(card => card !== null)
    } catch (err) {
      console.error('Error fetching cards from blockchain:', err)
      return []
    }
  }

  /**
   * Fetch cards - tries backend first, then falls back to on-chain
   */
  const fetchCards = useCallback(async () => {
    if (!isConnected || !address) {
      setCards([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Try backend first
      const backendCards = await fetchCardsFromBackend()

      if (backendCards && backendCards.length > 0) {
        // Format backend cards
        const formattedCards = backendCards.map(card => ({
          id: card.id,
          tokenId: card.tokenId,
          name: card.name || 'Unknown Card',
          imageData: card.imageData || card.image,
          image: card.ipfsLinks?.find(l => l.type === 'styled_card')?.gateway_url ||
                 card.ipfsLinks?.find(l => l.type === 'raw_image')?.gateway_url ||
                 card.imageData,
          rarity: card.rarity,
          type: card.type,
          stats: card.stats,
          flavorText: card.flavorText,
          theme: card.theme,
          mintedAt: card.mintedAt,
          transactionHash: card.transactionHash,
          openSeaUrl: card.tokenId ? getOpenSeaUrl(card.tokenId) : null,
        }))

        setCards(formattedCards)
        setLoading(false)
        return
      }

      // Fallback: fetch from blockchain using CardMinted events
      console.log('Backend returned no cards, fetching from blockchain...')
      const blockchainCards = await fetchCardsFromBlockchain()

      if (blockchainCards.length > 0) {
        setCards(blockchainCards)
      } else {
        setCards([])
      }

    } catch (err) {
      console.error('Error fetching cards:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [address, isConnected, NFT_CONTRACT_ADDRESS, publicClient])

  // Fetch cards when wallet connects
  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  return {
    cards,
    loading,
    error,
    refetch: fetchCards,
    isConnected,
    getOpenSeaUrl,
  }
}
