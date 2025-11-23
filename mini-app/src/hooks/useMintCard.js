import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import NFT_ABI from '../contracts/abi.json'

const API_BASE_URL = 'http://localhost:3001'

export function useMintCard() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [transactionHash, setTransactionHash] = useState(null)
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS
  const MINT_PRICE = import.meta.env.VITE_MINT_PRICE || '0.001' // Default 0.001 ETH

  /**
   * Upload card to IPFS via backend
   */
  const uploadToIPFS = async (card) => {
    try {
      setStatus('uploading')
      console.log('📤 Uploading to IPFS:', card.name)

      const response = await fetch(`${API_BASE_URL}/api/upload-to-ipfs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ card }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'IPFS upload failed')
      }

      const data = await response.json()
      console.log('✅ IPFS upload successful:', data.metadataURI)

      return data.metadataURI
    } catch (err) {
      console.error('IPFS upload error:', err)
      throw new Error(`Failed to upload to IPFS: ${err.message}`)
    }
  }

  /**
   * Mint a single card
   */
  const mintSingleCard = async (card) => {
    try {
      if (!NFT_CONTRACT_ADDRESS) {
        throw new Error('NFT contract not deployed. Set VITE_NFT_CONTRACT_ADDRESS in .env')
      }

      if (!address) {
        throw new Error('Wallet not connected')
      }

      // Step 1: Upload to IPFS
      const metadataURI = await uploadToIPFS(card)

      // Step 2: Mint NFT
      setStatus('minting')
      console.log('🎨 Minting NFT with metadata:', metadataURI)

      const hash = await writeContractAsync({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'mint',
        args: [metadataURI],
        value: parseEther(MINT_PRICE),
      })

      setTransactionHash(hash)
      setStatus('confirming')
      console.log('⏳ Transaction submitted:', hash)

      return hash
    } catch (err) {
      console.error('Minting failed:', err)
      setError(err.message)
      setStatus('error')
      throw err
    }
  }

  /**
   * Mint batch of cards
   */
  const mintBatchCards = async (cards) => {
    try {
      if (!NFT_CONTRACT_ADDRESS) {
        throw new Error('NFT contract not deployed. Set VITE_NFT_CONTRACT_ADDRESS in .env')
      }

      if (!address) {
        throw new Error('Wallet not connected')
      }

      // Step 1: Upload all cards to IPFS
      setStatus('uploading')
      console.log(`📤 Uploading ${cards.length} cards to IPFS...`)

      const metadataURIs = []
      for (let i = 0; i < cards.length; i++) {
        console.log(`  Uploading ${i + 1}/${cards.length}: ${cards[i].name}`)
        const uri = await uploadToIPFS(cards[i])
        metadataURIs.push(uri)
      }

      console.log('✅ All cards uploaded to IPFS')

      // Step 2: Batch mint NFTs
      setStatus('minting')
      console.log(`🎨 Batch minting ${cards.length} NFTs...`)

      const totalPrice = parseEther((parseFloat(MINT_PRICE) * cards.length).toString())

      const hash = await writeContractAsync({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'mintBatch',
        args: [metadataURIs],
        value: totalPrice,
      })

      setTransactionHash(hash)
      setStatus('confirming')
      console.log('⏳ Batch transaction submitted:', hash)

      return hash
    } catch (err) {
      console.error('Batch minting failed:', err)
      setError(err.message)
      setStatus('error')
      throw err
    }
  }

  /**
   * Main mint function - handles single or batch
   */
  const mint = async (cards) => {
    setStatus('idle')
    setError(null)
    setTransactionHash(null)

    if (Array.isArray(cards) && cards.length > 1) {
      return mintBatchCards(cards)
    } else {
      const card = Array.isArray(cards) ? cards[0] : cards
      return mintSingleCard(card)
    }
  }

  return {
    mint,
    status,
    error,
    transactionHash,
    isLoading: status !== 'idle' && status !== 'error' && status !== 'success',
  }
}
