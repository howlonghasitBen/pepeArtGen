import { useState } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { parseUnits } from 'viem'
import USDC_ABI from '../contracts/USDC.json'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const GENERATION_FEE_USDC = '2.50' // $2.50 USDC for 1 gen + 2 re-rolls

export function useGenerationPayment() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [paymentSession, setPaymentSession] = useState(null)
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const USDC_CONTRACT_ADDRESS = import.meta.env.VITE_USDC_CONTRACT_ADDRESS
  const TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS

  // Read USDC balance
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: USDC_ABI.abi,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address && !!USDC_CONTRACT_ADDRESS,
    },
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
   * Now includes on-chain verification
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
        throw new Error('Treasury address not configured. Set VITE_TREASURY_ADDRESS in .env')
      }

      // Calculate USDC amount (6 decimals)
      const usdcAmount = parseUnits(GENERATION_FEE_USDC, 6) // 2.50 USDC = 2500000

      // Check balance
      if (usdcBalance && BigInt(usdcBalance) < BigInt(usdcAmount)) {
        throw new Error(`Insufficient USDC balance. Need ${GENERATION_FEE_USDC} USDC`)
      }

      // Step 1: Transfer USDC to treasury
      setStatus('paying')
      setError(null)
      console.log(`💰 Paying ${GENERATION_FEE_USDC} USDC for generation credits...`)

      const hash = await writeContractAsync({
        address: USDC_CONTRACT_ADDRESS,
        abi: USDC_ABI.abi,
        functionName: 'transfer',
        args: [TREASURY_ADDRESS, usdcAmount],
      })

      console.log('⏳ Payment transaction submitted:', hash)

      // Step 2: Create pending session in backend
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
      console.log('📝 Pending session created:', sessionData.sessionId)

      // Step 3: Verify payment on-chain (backend checks the actual tx)
      setStatus('verifying_payment')
      console.log('🔍 Verifying payment on-chain...')

      const verifyResponse = await fetch(`${API_BASE_URL}/api/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionHash: hash,
          walletAddress: address,
        }),
      })

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json()
        throw new Error(data.message || data.error || 'Payment verification failed')
      }

      const verifyData = await verifyResponse.json()
      console.log('✅ Payment verified on-chain:', verifyData.verification)

      // Update session state
      setPaymentSession({
        id: verifyData.sessionId,
        generationsRemaining: verifyData.generationsRemaining,
        expiresAt: sessionData.expiresAt,
      })

      setStatus('success')
      console.log('🎉 Payment confirmed! You have 3 generations (1 initial + 2 re-rolls)')

      // Refresh balance
      refetchBalance()

      return {
        transactionHash: hash,
        sessionId: verifyData.sessionId,
        verification: verifyData.verification,
      }
    } catch (err) {
      console.error('Payment failed:', err)
      setError(err.message)
      setStatus('error')
      throw err
    }
  }

  /**
   * Check payment status by transaction hash
   */
  const checkPaymentStatus = async (transactionHash) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/status/${transactionHash}`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to check payment status')
      }

      return await response.json()
    } catch (err) {
      console.error('Error checking payment status:', err)
      return null
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
      treasuryAddress: TREASURY_ADDRESS,
      usdcContract: USDC_CONTRACT_ADDRESS,
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

  /**
   * Reset error state
   */
  const clearError = () => {
    setError(null)
    setStatus('idle')
  }

  return {
    payForGeneration,
    checkActiveSession,
    checkPaymentStatus,
    getPaymentInfo,
    hasSufficientBalance,
    clearError,
    paymentSession,
    usdcBalance,
    status,
    error,
    isLoading: ['paying', 'creating_session', 'verifying_payment'].includes(status),
    generationFeeUsdc: GENERATION_FEE_USDC,
  }
}
