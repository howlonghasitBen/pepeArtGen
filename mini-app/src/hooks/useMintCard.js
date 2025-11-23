import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import NFT_ABI from '../contracts/abi.json'

// USDC on BASE mainnet
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const USDC_ABI = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
]

export function useMintCard() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS

  const uploadMetadata = async (card) => {
    // In production, upload to IPFS
    // For now, create a data URI with metadata
    const metadata = {
      name: card.name,
      description: `${card.move} - ${card.flavorText}`,
      image: card.imageData,
      attributes: [
        { trait_type: 'Level', value: card.stats.level },
        { trait_type: 'Attack', value: card.stats.attack },
        { trait_type: 'Defense', value: card.stats.defense },
        { trait_type: 'HP', value: card.stats.hp },
        { trait_type: 'Mana Cost', value: card.stats.manaCost },
        { trait_type: 'Signature Move', value: card.move },
      ],
    }

    // For demo: return data URI
    // In production: upload to IPFS and return ipfs:// URI
    const dataUri = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`
    return dataUri
  }

  const approveUSDC = async (amount) => {
    try {
      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [NFT_CONTRACT_ADDRESS, amount],
      })
      return hash
    } catch (err) {
      console.error('USDC approval failed:', err)
      throw new Error('Failed to approve USDC')
    }
  }

  const mintSingleCard = async (card) => {
    try {
      setStatus('uploading')
      const metadataURI = await uploadMetadata(card)

      setStatus('approving')
      const mintFee = parseUnits('1', 6) // 1 USDC (6 decimals)
      await approveUSDC(mintFee)

      setStatus('minting')
      const hash = await writeContractAsync({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'mintCard',
        args: [address, metadataURI],
      })

      setStatus('confirming')
      return hash
    } catch (err) {
      console.error('Minting failed:', err)
      setError(err.message)
      setStatus('error')
      throw err
    }
  }

  const mintBatchCards = async (cards) => {
    try {
      setStatus('uploading')
      const metadataURIs = await Promise.all(cards.map(uploadMetadata))

      setStatus('approving')
      const mintFee = parseUnits(cards.length.toString(), 6) // N USDC
      await approveUSDC(mintFee)

      setStatus('minting')
      const hash = await writeContractAsync({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'batchMintCards',
        args: [address, metadataURIs],
      })

      setStatus('confirming')
      return hash
    } catch (err) {
      console.error('Batch minting failed:', err)
      setError(err.message)
      setStatus('error')
      throw err
    }
  }

  const mint = async (cards) => {
    if (!NFT_CONTRACT_ADDRESS) {
      throw new Error('NFT contract not deployed. Run: npm run deploy:contract')
    }

    setStatus('idle')
    setError(null)

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
    isLoading: status !== 'idle' && status !== 'error' && status !== 'success',
  }
}
