import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits } from 'viem'
import USDC_ABI from '../contracts/USDC.json'

const API_BASE_URL = 'http://localhost:3001'
const GENERATION_FEE_USDC = '2.50' // $2.50 USDC for 1 gen + 2 re-rolls

export function useGenerationPayment() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [paymentSession, setPaymentSession] = useState(null)
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const USDC_CONTRACT_ADDRESS = import.meta.env.VITE_USDC_CONTRACT_ADDRESS
  const TREASURY_ADDRESS = import.meta.env.TREASURY_ADDRESS || import.meta.env.VITE_TREASURY_ADDRESS

  // Read USDC balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: USDC_ABI.abi,
    functionName: 'balanceOf',
    args: [address],
  })

  /**
   * Check if user has an active payment session
   */
  const checkActiveSession = async () => {
    try {
      if (!address) return null

      const response = await fetch(`${API_BASE_URL}/api/payment/session/${address}`)

      if (!response.ok) {
        throw new Error('Failed to check payment session')
      }

      const data = await response.json()

      if (data.hasActiveSession) {
        setPaymentSession(data.session)
        return data.session
      }

      return null
    } catch (err) {
      console.error('Error checking active session:', err)
      return null
    }
  }

  /**
   * Pay USDC for generation credits (1 initial + 2 re-rolls)
   */
  const payForGeneration = async () => {
    try {
      if (!address) {
        throw new Error('Wallet not connected')
      }

      if (!USDC_CONTRACT_ADDRESS) {
        throw new Error('USDC contract not configured. Set VITE_USDC_CONTRACT_ADDRESS in .env')
      }

      if (!TREASURY_ADDRESS) {
        throw new Error('Treasury address not configured. Set TREASURY_ADDRESS in .env')
      }

      // Calculate USDC amount (6 decimals)
      const usdcAmount = parseUnits(GENERATION_FEE_USDC, 6) // 2.50 USDC = 2500000

      // Check balance
      if (usdcBalance && BigInt(usdcBalance) < BigInt(usdcAmount)) {
        throw new Error(`Insufficient USDC balance. Need ${GENERATION_FEE_USDC} USDC`)
      }

      // Transfer USDC to treasury
      setStatus('paying')
      console.log(`💰 Paying ${GENERATION_FEE_USDC} USDC for generation credits...`)

      const hash = await writeContractAsync({
        address: USDC_CONTRACT_ADDRESS,
        abi: USDC_ABI.abi,
        functionName: 'transfer',
        args: [TREASURY_ADDRESS, usdcAmount],
      })

      console.log('⏳ Payment transaction submitted:', hash)

      // Create payment session in backend
      setStatus('creating_session')

      const sessionResponse = await fetch(`${API_BASE_URL}/api/payment/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          transactionHash: hash,
          amountUsdc: GENERATION_FEE_USDC,
        }),
      })

      if (!sessionResponse.ok) {
        const data = await sessionResponse.json()
        throw new Error(data.error || 'Failed to create payment session')
      }

      const sessionData = await sessionResponse.json()
      console.log('✅ Payment session created:', sessionData.sessionId)

      setPaymentSession({
        id: sessionData.sessionId,
        generationsRemaining: sessionData.generationsRemaining,
        expiresAt: sessionData.expiresAt,
      })

      // Wait for transaction to be mined
      setStatus('confirming_payment')

      // Confirm payment after a delay (in production, you'd watch for transaction confirmation)
      await new Promise(resolve => setTimeout(resolve, 3000))

      await fetch(`${API_BASE_URL}/api/payment/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionHash: hash,
        }),
      })

      setStatus('success')
      console.log('🎉 Payment confirmed! You have 3 generations (1 initial + 2 re-rolls)')

      return {
        transactionHash: hash,
        sessionId: sessionData.sessionId,
      }
    } catch (err) {
      console.error('Payment failed:', err)
      setError(err.message)
      setStatus('error')
      throw err
    }
  }

  /**
   * Get payment info
   */
  const getPaymentInfo = () => {
    return {
      feeUsdc: GENERATION_FEE_USDC,
      generationsIncluded: 3,
      description: 'Includes 1 initial generation + 2 re-rolls',
    }
  }

  /**
   * Check if user has sufficient USDC
   */
  const hasSufficientBalance = () => {
    if (!usdcBalance) return false
    const requiredAmount = parseUnits(GENERATION_FEE_USDC, 6)
    return BigInt(usdcBalance) >= BigInt(requiredAmount)
  }

  return {
    payForGeneration,
    checkActiveSession,
    getPaymentInfo,
    hasSufficientBalance,
    paymentSession,
    usdcBalance,
    status,
    error,
    isLoading: status !== 'idle' && status !== 'error' && status !== 'success',
    generationFeeUsdc: GENERATION_FEE_USDC,
  }
}
