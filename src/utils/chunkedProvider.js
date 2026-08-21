import { ethers } from 'ethers';
import { SEPOLIA_RPC_POOL, CONTRACT_ADDRESS, CONTRACT_ABI } from '../contractConfig';

/**
 * fetchEventsChunked
 *
 * Fetches all contract events between startBlock and 'latest' by splitting
 * the range into chunks. This bypasses the 10,000-block-range limit
 * enforced by most free-tier public RPC nodes.
 *
 * On 429 / rate-limit errors, the failing chunk is automatically retried on
 * the next provider in SEPOLIA_RPC_POOL, cycling through all nodes before giving
 * up on that individual chunk (returning [] for it rather than crashing).
 *
 * @param {ethers.Contract} contract - The ethers.js contract instance.
 * @param {ethers.ContractEventName} filter - The event filter from contract.filters.EventName().
 * @param {number} startBlock - The block to start scanning from (use DEPLOY_BLOCK).
 * @param {ethers.Provider} provider - The primary ethers provider.
 * @param {number} chunkSize - Max blocks per request (default 9000, safely under 10k limit).
 * @returns {Promise<Array>} - A flat array of all matching event logs.
 */
export async function fetchEventsChunked(contract, filter, startBlock, provider, chunkSize = 9000) {
  const latestBlock = await provider.getBlockNumber();

  const chunks = [];
  for (let from = startBlock; from <= latestBlock; from += chunkSize) {
    const to = Math.min(from + chunkSize - 1, latestBlock);
    chunks.push({ from, to });
  }

  /**
   * Query a single chunk with automatic RPC fallback on 429 / error.
   * It tries the primary contract first, then builds fresh contract instances
   * on backup RPC nodes from SEPOLIA_RPC_POOL if the primary fails.
   */
  const queryChunkWithFallback = async ({ from, to }) => {
    // Attempt 1: primary contract/provider
    try {
      return await contract.queryFilter(filter, from, to);
    } catch (primaryErr) {
      const is429 = primaryErr?.message?.includes('429') ||
                    primaryErr?.message?.toLowerCase().includes('rate') ||
                    primaryErr?.code === 'SERVER_ERROR';

      if (!is429 && !primaryErr?.message?.includes('limit')) {
        // Not a rate-limit error — don't waste retries
        console.warn(`Chunk [${from} - ${to}] failed (non-rate-limit):`, primaryErr.message);
        return [];
      }

      // Attempt 2..N: try each backup RPC in sequence
      for (const rpcUrl of SEPOLIA_RPC_POOL) {
        try {
          const backupProvider = new ethers.JsonRpcProvider(rpcUrl);
          const backupContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, backupProvider);
          const result = await backupContract.queryFilter(filter, from, to);
          console.info(`Chunk [${from} - ${to}] succeeded via backup: ${rpcUrl}`);
          return result;
        } catch (backupErr) {
          console.warn(`Backup ${rpcUrl} also failed for chunk [${from} - ${to}]:`, backupErr.message);
        }
      }

      // All providers failed for this chunk — return empty rather than crashing
      console.error(`Chunk [${from} - ${to}] failed on all providers. Skipping.`);
      return [];
    }
  };

  // Process all chunks in parallel for speed — each has its own fallback chain
  const results = await Promise.all(chunks.map(queryChunkWithFallback));

  // Flatten all chunk results into a single sorted array
  return results.flat();
}
