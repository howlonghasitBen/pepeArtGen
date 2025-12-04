/**
 * Utility to find the block at which a contract was deployed
 * Uses binary search to efficiently find when contract code first appeared
 */

// Cache deployment blocks to avoid repeated queries
const deploymentBlockCache = new Map();

/**
 * Find the block at which a contract was deployed using binary search
 * @param {object} publicClient - viem public client
 * @param {string} contractAddress - contract address to check
 * @returns {Promise<bigint>} - deployment block number
 */
export async function getContractDeploymentBlock(publicClient, contractAddress) {
  // Check cache first
  const cacheKey = contractAddress.toLowerCase();
  if (deploymentBlockCache.has(cacheKey)) {
    return deploymentBlockCache.get(cacheKey);
  }

  // Check localStorage for persistence across sessions
  const localStorageKey = `deploymentBlock_${cacheKey}`;
  const cached = localStorage.getItem(localStorageKey);
  if (cached) {
    const block = BigInt(cached);
    deploymentBlockCache.set(cacheKey, block);
    return block;
  }

  console.log(`🔍 Finding deployment block for contract ${contractAddress}...`);

  const currentBlock = await publicClient.getBlockNumber();

  // Binary search to find deployment block
  let low = 0n;
  let high = currentBlock;
  let deploymentBlock = 0n;

  while (low <= high) {
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
      // If we get an error (e.g., block doesn't exist), search later blocks
      low = mid + 1n;
    }
  }

  console.log(`✅ Contract deployed at block ${deploymentBlock}`);

  // Cache the result
  deploymentBlockCache.set(cacheKey, deploymentBlock);
  localStorage.setItem(localStorageKey, deploymentBlock.toString());

  return deploymentBlock;
}
