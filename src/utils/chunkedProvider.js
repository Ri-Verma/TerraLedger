/**
 * fetchEventsChunked
 *
 * Fetches all contract events between startBlock and 'latest' by splitting
 * the range into chunks. This bypasses the 50,000-block-range limit
 * enforced by most free-tier public RPC nodes (publicnode, Alchemy, etc.).
 *
 * @param {ethers.Contract} contract - The ethers.js contract instance.
 * @param {ethers.ContractEventName} filter - The event filter from contract.filters.EventName().
 * @param {number} startBlock - The block to start scanning from (use DEPLOY_BLOCK).
 * @param {ethers.Provider} provider - The ethers provider (used to get latest block number).
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

  // Fetch all chunks in parallel for maximum speed
  const results = await Promise.all(
    chunks.map(({ from, to }) =>
      contract.queryFilter(filter, from, to).catch((err) => {
        console.warn(`Chunk [${from} - ${to}] failed:`, err.message);
        return []; // Return empty array for failed chunks rather than crashing
      })
    )
  );

  // Flatten all chunk results into a single sorted array
  return results.flat();
}
