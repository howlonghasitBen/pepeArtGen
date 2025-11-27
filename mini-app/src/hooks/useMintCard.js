import { useState } from 'react'
import { useAccount, useWriteContract, usePublicClient, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import WAVES_TCG_NFT_ABI from '../contracts/WavesTCGNFT.json'

const API_BASE_URL = 'http://localhost:3001'

export function useMintCard() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [transactionHash, setTransactionHash] = useState(null)
  const [mintData, setMintData] = useState(null)
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()

  const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS

  /**
   * Record mint to backend database
   */
  const recordMint = async (cardIds, transactionHash, metadataURIs) => {
    try {
      console.log('💾 Recording mint to database...')

      const response = await fetch(`${API_BASE_URL}/api/mint/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardIds,
          transactionHash,
          minterAddress: address,
          metadataURIs,
          verify: true, // Enable on-chain verification
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to record mint')
      }

      const data = await response.json()
      console.log('✅ Mint recorded successfully:', data)
      return data
    } catch (err) {
      console.error('❌ Failed to record mint:', err)
      // Don't throw - recording failure shouldn't fail the entire mint
      // The mint already succeeded on-chain
      return null
    }
  }

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
   * Mint a single card (FREE - only gas)
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

      // Step 2: Mint NFT on WavesTCGNFT (FREE - only gas)
      setStatus('minting')
      console.log('🎨 Minting NFT with metadata:', metadataURI)
      console.log('💰 Minting is FREE - only gas fees (~$0.01 on Base)')

      const hash = await writeContractAsync({
        address: NFT_CONTRACT_ADDRESS,
        abi: WAVES_TCG_NFT_ABI.abi,
        functionName: 'mint',
        args: [metadataURI],
        value: 0n, // Free minting (set mintPrice to 0 in contract)
      })

      setTransactionHash(hash)
      setStatus('confirming')
      console.log('⏳ Transaction submitted:', hash)

      // Step 3: Wait for confirmation
      console.log('⏳ Waiting for transaction confirmation...')
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber)

      // Step 4: Record mint to database
      const recordedMint = await recordMint([card.id], hash, [metadataURI])

      // Step 5: Store mint data for success modal
      if (recordedMint) {
        setMintData({
          cards: [card],
          tokenIds: recordedMint.tokenIds || [],
          transactionHash: hash,
        })
      }

      setStatus('success')
      return hash
    } catch (err) {
      console.error('Minting failed:', err)
      setError(err.message)
      setStatus('error')
      throw err
    }
  }

  /**
   * Mint batch of cards (FREE - only gas)
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

      // Step 2: Batch mint NFTs on WavesTCGNFT (FREE - only gas)
      setStatus('minting')
      console.log(`🎨 Batch minting ${cards.length} NFTs...`)
      console.log('💰 Minting is FREE - only gas fees')

      const hash = await writeContractAsync({
        address: NFT_CONTRACT_ADDRESS,
        abi: WAVES_TCG_NFT_ABI.abi,
        functionName: 'mintBatch',
        args: [metadataURIs],
        value: 0n, // Free minting (set mintPrice to 0 in contract)
      })

      setTransactionHash(hash)
      setStatus('confirming')
      console.log('⏳ Batch transaction submitted:', hash)

      // Step 3: Wait for confirmation
      console.log('⏳ Waiting for transaction confirmation...')
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber)

      // Step 4: Record mints to database
      const cardIds = cards.map(card => card.id)
      const recordedMint = await recordMint(cardIds, hash, metadataURIs)

      // Step 5: Store mint data for success modal
      if (recordedMint) {
        setMintData({
          cards: cards,
          tokenIds: recordedMint.tokenIds || [],
          transactionHash: hash,
        })
      }

      setStatus('success')
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
    setMintData(null)

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
    mintData,
    isLoading: status !== 'idle' && status !== 'error' && status !== 'success',
  }
}
