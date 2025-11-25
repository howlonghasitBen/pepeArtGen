import { useState } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { parseUnits } from 'viem'
import PEPE_CARD_NFT_ABI from '../contracts/PepeCardNFT.json'
import USDC_ABI from '../contracts/USDC.json'

const API_BASE_URL = 'http://localhost:3001'

export function useMintCard() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [transactionHash, setTransactionHash] = useState(null)
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS
  const USDC_CONTRACT_ADDRESS = import.meta.env.VITE_USDC_CONTRACT_ADDRESS
  const MINT_FEE_USDC = '2.50' // 2.50 USDC

  // Read USDC allowance
  const { data: usdcAllowance } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: USDC_ABI.abi,
    functionName: 'allowance',
    args: [address, NFT_CONTRACT_ADDRESS],
  })

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
   * Approve USDC spending for NFT contract
   */
  const approveUSDC = async (amount) => {
    try {
      if (!USDC_CONTRACT_ADDRESS || !NFT_CONTRACT_ADDRESS) {
        throw new Error('Contract addresses not configured')
      }

      setStatus('approving')
      console.log('💰 Approving USDC spending...')

      const hash = await writeContractAsync({
        address: USDC_CONTRACT_ADDRESS,
        abi: USDC_ABI.abi,
        functionName: 'approve',
        args: [NFT_CONTRACT_ADDRESS, amount],
      })

      console.log('⏳ USDC approval transaction submitted:', hash)
      return hash
    } catch (err) {
      console.error('USDC approval failed:', err)
      throw new Error(`Failed to approve USDC: ${err.message}`)
    }
  }

  /**
   * Check if USDC approval is needed
   */
  const needsApproval = (requiredAmount) => {
    if (!usdcAllowance) return true
    return BigInt(usdcAllowance) < BigInt(requiredAmount)
  }

  /**
   * Mint a single card (USDC-based)
   */
  const mintSingleCard = async (card) => {
    try {
      if (!NFT_CONTRACT_ADDRESS) {
        throw new Error('NFT contract not deployed. Set VITE_NFT_CONTRACT_ADDRESS in .env')
      }

      if (!USDC_CONTRACT_ADDRESS) {
        throw new Error('USDC contract not configured. Set VITE_USDC_CONTRACT_ADDRESS in .env')
      }

      if (!address) {
        throw new Error('Wallet not connected')
      }

      // Calculate USDC amount (6 decimals)
      const usdcAmount = parseUnits(MINT_FEE_USDC, 6) // 2.50 USDC = 2500000

      // Step 1: Check and approve USDC if needed
      if (needsApproval(usdcAmount)) {
        console.log('💰 USDC approval required')
        await approveUSDC(usdcAmount)
        setStatus('waiting_approval')

        // Wait a bit for approval to be mined
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Step 2: Upload to IPFS
      const metadataURI = await uploadToIPFS(card)

      // Step 3: Mint NFT (pays USDC fee automatically via contract)
      setStatus('minting')
      console.log('🎨 Minting NFT with metadata:', metadataURI)
      console.log('💰 Paying 2.50 USDC fee via contract')

      const hash = await writeContractAsync({
        address: NFT_CONTRACT_ADDRESS,
        abi: PEPE_CARD_NFT_ABI.abi,
        functionName: 'mintCard',
        args: [address, metadataURI],
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
   * Mint batch of cards (USDC-based)
   */
  const mintBatchCards = async (cards) => {
    try {
      if (!NFT_CONTRACT_ADDRESS) {
        throw new Error('NFT contract not deployed. Set VITE_NFT_CONTRACT_ADDRESS in .env')
      }

      if (!USDC_CONTRACT_ADDRESS) {
        throw new Error('USDC contract not configured. Set VITE_USDC_CONTRACT_ADDRESS in .env')
      }

      if (!address) {
        throw new Error('Wallet not connected')
      }

      // Calculate total USDC amount (6 decimals)
      const usdcPerCard = parseUnits(MINT_FEE_USDC, 6)
      const totalUsdcAmount = BigInt(usdcPerCard) * BigInt(cards.length)

      // Step 1: Check and approve USDC if needed
      if (needsApproval(totalUsdcAmount)) {
        console.log(`💰 USDC approval required for ${cards.length} cards`)
        await approveUSDC(totalUsdcAmount)
        setStatus('waiting_approval')

        // Wait a bit for approval to be mined
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Step 2: Upload all cards to IPFS
      setStatus('uploading')
      console.log(`📤 Uploading ${cards.length} cards to IPFS...`)

      const metadataURIs = []
      for (let i = 0; i < cards.length; i++) {
        console.log(`  Uploading ${i + 1}/${cards.length}: ${cards[i].name}`)
        const uri = await uploadToIPFS(cards[i])
        metadataURIs.push(uri)
      }

      console.log('✅ All cards uploaded to IPFS')

      // Step 3: Batch mint NFTs (pays USDC fees automatically via contract)
      setStatus('minting')
      console.log(`🎨 Batch minting ${cards.length} NFTs...`)
      console.log(`💰 Paying ${parseFloat(MINT_FEE_USDC) * cards.length} USDC total fee via contract`)

      const hash = await writeContractAsync({
        address: NFT_CONTRACT_ADDRESS,
        abi: PEPE_CARD_NFT_ABI.abi,
        functionName: 'batchMintCards',
        args: [address, metadataURIs],
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
    approveUSDC,
    needsApproval: (count = 1) => needsApproval(BigInt(parseUnits(MINT_FEE_USDC, 6)) * BigInt(count)),
    usdcAllowance,
    status,
    error,
    transactionHash,
    isLoading: status !== 'idle' && status !== 'error' && status !== 'success',
    mintFeeUsdc: MINT_FEE_USDC,
  }
}
