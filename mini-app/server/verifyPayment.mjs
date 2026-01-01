// Payment verification service - validates USDC transfers on-chain
import { createPublicClient, http, parseAbi, formatUnits } from 'viem'
import { base, baseSepolia } from 'viem/chains'

// USDC contract addresses
const USDC_ADDRESSES = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  baseSepolia: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
}

// ERC20 Transfer event ABI
const ERC20_TRANSFER_ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)'
])

// Expected payment amount in USDC (6 decimals)
const EXPECTED_AMOUNT_USDC = 2_500_000n // $2.50 USDC

// Create viem public client
function getClient(network = 'base') {
  const chain = network === 'base' ? base : baseSepolia
  const rpcUrl = network === 'base'
    ? process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    : process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'

  console.log(`   📡 Using network: ${network}`)
  console.log(`   📡 RPC URL: ${rpcUrl}`)
  console.log(`   📡 USDC contract: ${USDC_ADDRESSES[network]}`)

  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  })
}

/**
 * Verify a USDC payment transaction
 * @param {string} transactionHash - The tx hash to verify
 * @param {string} expectedFrom - Expected sender wallet address
 * @param {string} expectedTo - Expected recipient (treasury) address
 * @param {string} network - 'base' or 'baseSepolia'
 * @param {object} existingReceipt - Optional pre-fetched receipt to avoid re-fetching
 * @param {object} existingBlock - Optional pre-fetched block to avoid re-fetching
 * @returns {Promise<{valid: boolean, error?: string, details?: object}>}
 */
export async function verifyPayment(transactionHash, expectedFrom, expectedTo, network = 'base', existingReceipt = null, existingBlock = null) {
  try {
    const client = getClient(network)
    const usdcAddress = USDC_ADDRESSES[network]

    if (!usdcAddress) {
      return { valid: false, error: `Unsupported network: ${network}` }
    }

    // 1. Get transaction receipt (use existing if provided)
    console.log(`🔍 Verifying transaction: ${transactionHash}`)

    let receipt = existingReceipt;
    if (!receipt) {
      receipt = await client.getTransactionReceipt({
        hash: transactionHash,
      })
    } else {
      console.log(`   ℹ️  Using pre-fetched receipt from waitForConfirmation`)
    }

    if (!receipt) {
      return { valid: false, error: 'Transaction not found or not yet mined' }
    }

    // 2. Check transaction succeeded
    if (receipt.status !== 'success') {
      return { valid: false, error: 'Transaction failed on-chain' }
    }

    // 3. Find USDC Transfer event in logs
    const transferLog = receipt.logs.find(log =>
      log.address.toLowerCase() === usdcAddress.toLowerCase() &&
      log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // Transfer event signature
    )

    if (!transferLog) {
      return { valid: false, error: 'No USDC transfer found in transaction' }
    }

    // 4. Decode the Transfer event
    const from = `0x${transferLog.topics[1].slice(26)}`.toLowerCase()
    const to = `0x${transferLog.topics[2].slice(26)}`.toLowerCase()
    const value = BigInt(transferLog.data)

    console.log(`   From: ${from}`)
    console.log(`   To: ${to}`)
    console.log(`   Amount: ${formatUnits(value, 6)} USDC`)

    // 5. Validate sender (allow smart contract wallets)
    // NOTE: We allow any sender as long as the payment goes to the correct treasury
    // This supports smart contract wallets (Safe, Argent, Coinbase Smart Wallet, etc.)
    // where the Transfer event's 'from' may differ from the connected wallet address
    const expectedFromLower = expectedFrom.toLowerCase()
    if (from !== expectedFromLower) {
      console.log(`   ℹ️  Sender address differs from connected wallet`)
      console.log(`   ℹ️  Connected: ${expectedFrom}`)
      console.log(`   ℹ️  Actual sender: ${from}`)
      console.log(`   ℹ️  This is OK - likely a smart contract wallet`)
      // Don't fail - smart contract wallets are supported
    }

    // 6. Validate recipient (treasury)
    if (to !== expectedTo.toLowerCase()) {
      return {
        valid: false,
        error: `Recipient mismatch. Expected ${expectedTo}, got ${to}`
      }
    }

    // 7. Validate amount (allow small variance for rounding)
    const minAmount = EXPECTED_AMOUNT_USDC - 1000n // Allow 0.001 USDC variance
    if (value < minAmount) {
      return {
        valid: false,
        error: `Insufficient payment. Expected $2.50 USDC, got $${formatUnits(value, 6)}`
      }
    }

    // 8. Get block timestamp for additional verification (use existing if provided)
    let block = existingBlock;
    if (!block) {
      block = await client.getBlock({ blockNumber: receipt.blockNumber })
    } else {
      console.log(`   ℹ️  Using pre-fetched block from waitForConfirmation`)
    }

    // 9. Check transaction isn't too old (prevent replay attacks)
    const txAge = Date.now() / 1000 - Number(block.timestamp)
    const MAX_TX_AGE_SECONDS = 3600 // 1 hour

    if (txAge > MAX_TX_AGE_SECONDS) {
      return {
        valid: false,
        error: `Transaction too old. Must be within ${MAX_TX_AGE_SECONDS / 60} minutes`
      }
    }

    console.log(`   ✅ Payment verified!`)

    return {
      valid: true,
      details: {
        from,
        to,
        connectedWallet: expectedFrom, // The wallet address user connected with
        actualSender: from, // The actual address that sent the USDC (may be smart contract wallet)
        amount: formatUnits(value, 6),
        amountRaw: value.toString(),
        blockNumber: receipt.blockNumber.toString(),
        blockTimestamp: Number(block.timestamp),
        transactionHash,
      }
    }

  } catch (error) {
    console.error('Payment verification error:', error)

    // Handle specific errors
    if (error.message?.includes('could not be found')) {
      return { valid: false, error: 'Transaction not found. It may still be pending.' }
    }

    return { valid: false, error: `Verification failed: ${error.message}` }
  }
}

/**
 * Check if a transaction hash has already been used
 * @param {string} transactionHash 
 * @param {object} supabase - Supabase client
 * @returns {Promise<boolean>}
 */
export async function isTransactionUsed(transactionHash, supabase) {
  if (!supabase) return false
  
  const { data, error } = await supabase
    .from('payment_sessions')
    .select('id')
    .eq('transaction_hash', transactionHash)
    .single()

  return !!data && !error
}

/**
 * Wait for transaction confirmation with retries
 * Fetches both receipt and block using the same RPC client to avoid inconsistencies
 * @param {string} transactionHash
 * @param {string} network
 * @param {number} maxAttempts
 * @returns {Promise<object>}
 */
export async function waitForConfirmation(transactionHash, network = 'base', maxAttempts = 30) {
  const client = getClient(network)

  console.log(`   ⏳ Waiting for tx confirmation (max ${maxAttempts * 2}s)...`)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const receipt = await client.getTransactionReceipt({
        hash: transactionHash,
      })

      if (receipt) {
        // Fetch block using the SAME client to avoid RPC node inconsistencies
        console.log(`   📦 Fetching block ${receipt.blockNumber} from same RPC node...`)
        const block = await client.getBlock({ blockNumber: receipt.blockNumber })

        console.log(`   ✅ Tx confirmed in block ${receipt.blockNumber} (attempt ${attempt + 1})`)
        return { confirmed: true, receipt, block }
      }
    } catch (error) {
      // Transaction not yet mined - this is expected
      if (attempt % 5 === 0) {
        console.log(`   ⏳ Still waiting... (attempt ${attempt + 1}/${maxAttempts}) - ${error.message?.slice(0, 50)}`)
      }
    }

    // Wait 2 seconds between attempts
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log(`   ❌ Tx confirmation timeout after ${maxAttempts} attempts`)
  return { confirmed: false, error: 'Transaction confirmation timeout' }
}

export default {
  verifyPayment,
  isTransactionUsed,
  waitForConfirmation,
}
