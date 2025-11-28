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

      // Fallback: fetch from contract (if backend is empty or failed)
      if (!NFT_CONTRACT_ADDRESS || !publicClient) {
        setCards([])
        setLoading(false)
        return
      }

      // Get wallet's mint count from contract
      const mintCount = await publicClient.readContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: WAVES_TCG_NFT_ABI.abi,
        functionName: 'walletMintCount',
        args: [address],
      })

      if (!mintCount || mintCount === 0n) {
        setCards([])
        setLoading(false)
        return
      }

      // Note: This is a simplified approach. In production, you'd want to 
      // use events or an indexer to get the actual token IDs owned by the wallet
      console.log(`Wallet has minted ${mintCount} cards total`)
      
      // For now, show empty if backend didn't return cards
      // A full implementation would query Transfer events or use an indexer
      setCards([])
      
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
