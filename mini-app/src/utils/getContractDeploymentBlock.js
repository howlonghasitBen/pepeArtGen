/**
 * Utility to find the block at which a contract was deployed
 * Uses binary search to efficiently find when contract code first appeared
 */

// Cache deployment blocks to avoid repeated queries
const deploymentBlockCache = new Map();

// Version for cache invalidation - increment when logic changes
const CACHE_VERSION = "v2";

/**
 * Find the block at which a contract was deployed using binary search
 * @param {object} publicClient - viem public client
 * @param {string} contractAddress - contract address to check
 * @returns {Promise<bigint>} - deployment block number
 */
export async function getContractDeploymentBlock(publicClient, contractAddress) {
  const cacheKey = contractAddress.toLowerCase();
  const localStorageKey = `deploymentBlock_${CACHE_VERSION}_${cacheKey}`;

  // Check memory cache first
  if (deploymentBlockCache.has(cacheKey)) {
    return deploymentBlockCache.get(cacheKey);
  }

  // Check localStorage for persistence across sessions
  const cached = localStorage.getItem(localStorageKey);
  if (cached) {
    const block = BigInt(cached);
    deploymentBlockCache.set(cacheKey, block);
    console.log(`📦 Using cached deployment block: ${block}`);
    return block;
  }

  console.log(`🔍 Finding deployment block for contract ${contractAddress}...`);

  const currentBlock = await publicClient.getBlockNumber();

  // First verify contract exists at current block
  const currentCode = await publicClient.getCode({
    address: contractAddress,
  });

  if (!currentCode || currentCode === "0x") {
    console.error("❌ Contract does not exist at current block");
    return 0n;
  }

  // Binary search to find deployment block
  // Start from a reasonable lower bound for Base (launched around block 0 in mid-2023)
  let low = 0n;
  let high = currentBlock;
  let deploymentBlock = currentBlock; // Default to current if search fails

  // Limit iterations to prevent infinite loops
  let iterations = 0;
  const maxIterations = 50;

  while (low <= high && iterations < maxIterations) {
    iterations++;
    const mid = (low + high) / 2n;

    try {
      const code = await publicClient.getCode({
        address: contractAddress,
        blockNumber: mid,
      });

      // Contract exists at this block
      if (code && code !== "0x") {
        deploymentBlock = mid;
        high = mid - 1n; // Search earlier blocks
      } else {
        low = mid + 1n; // Search later blocks
      }
    } catch (err) {
      // RPC might not support historical state that far back
      // Try a more recent block
      console.warn(`⚠️ getCode failed at block ${mid}:`, err.message);
      low = mid + 1n;
    }

    // Small delay to avoid rate limiting
    if (iterations % 5 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  console.log(`✅ Contract deployed at block ${deploymentBlock} (found in ${iterations} iterations)`);

  // Cache the result
  deploymentBlockCache.set(cacheKey, deploymentBlock);
  localStorage.setItem(localStorageKey, deploymentBlock.toString());

  // Clean up old cache keys
  try {
    const oldKey = `deploymentBlock_${cacheKey}`;
    localStorage.removeItem(oldKey);
  } catch (e) {
    // Ignore cleanup errors
  }

  return deploymentBlock;

}

/**
 * Clear cached deployment block for a contract
 * Useful if you suspect the cached value is incorrect
 */
export function clearDeploymentBlockCache(contractAddress) {
  const cacheKey = contractAddress?.toLowerCase();
  if (cacheKey) {
    deploymentBlockCache.delete(cacheKey);
    localStorage.removeItem(`deploymentBlock_${CACHE_VERSION}_${cacheKey}`);
    localStorage.removeItem(`deploymentBlock_${cacheKey}`);
    console.log(`🗑️ Cleared deployment block cache for ${contractAddress}`);
  }
}
