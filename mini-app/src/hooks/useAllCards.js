import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import WAVES_TCG_NFT_ABI from "../contracts/WavesTCGNFT.json";
import { getContractDeploymentBlock } from "../utils/getContractDeploymentBlock";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export function useAllCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const publicClient = usePublicClient();

  const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
  const NETWORK = import.meta.env.VITE_NETWORK || "base";

  /**
   * Fetch all minted cards from backend
   */
  const fetchCardsFromBackend = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cards/all`);

      if (!response.ok) {
        throw new Error("Failed to fetch cards from backend");
      }

      const data = await response.json();
      return data.cards || [];
    } catch (err) {
      console.warn("Backend fetch failed, falling back to on-chain:", err);
      return null;
    }
  };

  /**
   * Fetch token metadata from IPFS (with fallback gateways)
   */
  const fetchTokenMetadata = async (tokenURI) => {
    // IPFS gateways to try (in order)
    const gateways = [
      "https://gateway.pinata.cloud/ipfs/",
      "https://ipfs.io/ipfs/",
      "https://cloudflare-ipfs.com/ipfs/",
      "https://dweb.link/ipfs/",
    ];

    let ipfsCID = null;
    let url = tokenURI;

    // Extract CID if it's an ipfs:// URI
    if (tokenURI.startsWith("ipfs://")) {
      ipfsCID = tokenURI.replace("ipfs://", "");
    } else if (tokenURI.includes("/ipfs/")) {
      // Extract CID from gateway URL
      const match = tokenURI.match(/\/ipfs\/([^/?]+)/);
      if (match) {
        ipfsCID = match[1];
      }
    }

    // Try each gateway
    for (const gateway of gateways) {
      try {
        const fetchUrl = ipfsCID ? `${gateway}${ipfsCID}` : url;
        console.log(`    Trying gateway: ${fetchUrl}`);

        const response = await fetch(fetchUrl, {
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (response.ok) {
          const metadata = await response.json();
          console.log(`    ✅ Success with ${gateway}`);
          return metadata;
        }
      } catch (err) {
        console.warn(`    ⚠️ Gateway ${gateway} failed:`, err.message);
        continue;
      }
    }

    console.error(`    ❌ All gateways failed for: ${tokenURI}`);
    return null;
  };

  /**
   * Get OpenSea URL for a token
   */
  const getOpenSeaUrl = (tokenId) => {
    const network = NETWORK === "baseSepolia" ? "base-sepolia" : "base";
    return `https://opensea.io/assets/${network}/${NFT_CONTRACT_ADDRESS}/${tokenId}`;
  };

  // Max blocks per query (RPC free tier limit)
  const MAX_BLOCKS_PER_QUERY = 9999n;

  /**
   * Fetch events in chunks to respect RPC block limits
   */
  const fetchEventsInChunks = async (fromBlock, toBlock) => {
    const allLogs = [];
    let currentFrom = fromBlock;

    console.log(
      `📊 Fetching events from block ${fromBlock} to ${toBlock} in chunks...`
    );

    while (currentFrom < toBlock) {
      const currentTo =
        currentFrom + MAX_BLOCKS_PER_QUERY > toBlock
          ? toBlock
          : currentFrom + MAX_BLOCKS_PER_QUERY;

      try {
        console.log(`  📦 Querying blocks ${currentFrom} to ${currentTo}...`);

        const logs = await publicClient.getContractEvents({
          address: NFT_CONTRACT_ADDRESS,
          abi: WAVES_TCG_NFT_ABI.abi,
          eventName: "CardMinted",
          fromBlock: currentFrom,
          toBlock: currentTo,
        });

        if (logs && logs.length > 0) {
          allLogs.push(...logs);
          console.log(`  ✅ Found ${logs.length} events in this chunk`);
        }
      } catch (err) {
        console.warn(
          `  ⚠️ Failed to fetch chunk ${currentFrom}-${currentTo}:`,
          err.message
        );
        // Continue to next chunk even if one fails
      }

      currentFrom = currentTo + 1n;

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`📊 Total events found: ${allLogs.length}`);
    return allLogs;
  };

  /**
   * Fetch ALL cards from blockchain using CardMinted events (no address filter)
   */
  const fetchCardsFromBlockchain = async () => {
    try {
      if (!NFT_CONTRACT_ADDRESS || !publicClient) {
        console.warn("Missing NFT_CONTRACT_ADDRESS or publicClient");
        return [];
      }

      console.log("🔍 Fetching ALL NFTs from blockchain");
      console.log("📝 Contract address:", NFT_CONTRACT_ADDRESS);

      // Get contract deployment block and current block
      const [deploymentBlock, currentBlock] = await Promise.all([
        getContractDeploymentBlock(publicClient, NFT_CONTRACT_ADDRESS),
        publicClient.getBlockNumber(),
      ]);

      console.log("📦 Querying from deployment block:", deploymentBlock.toString());

      // Fetch events in chunks from deployment block to current block
      const logs = await fetchEventsInChunks(deploymentBlock, currentBlock);

      console.log(`📦 Found ${logs.length} total CardMinted events`);

      if (!logs || logs.length === 0) {
        return [];
      }

      // Process each minted card
      const cardsPromises = logs.map(async (log) => {
        try {
          const tokenId = log.args.tokenId.toString();
          const tokenURI = log.args.tokenURI;
          const minter = log.args.minter;

          console.log(
            `  🎴 Processing token #${tokenId} (minted by ${minter})`
          );
          console.log(`  📍 Token URI: ${tokenURI}`);

          // Fetch metadata from IPFS
          const metadata = await fetchTokenMetadata(tokenURI);

          if (!metadata) {
            console.warn(`  ⚠️ Failed to fetch metadata for token #${tokenId}`);
          } else {
            console.log(
              `  ✅ Metadata loaded for token #${tokenId}: ${metadata.name}`
            );
          }

          if (!metadata) {
            return {
              id: `token-${tokenId}`,
              tokenId,
              name: `Card #${tokenId}`,
              image: null,
              minter,
              openSeaUrl: getOpenSeaUrl(tokenId),
            };
          }

          // Extract attributes from metadata
          const getAttr = (traitType, defaultValue = "") => {
            const attr = metadata.attributes?.find(
              (attr) => attr.trait_type === traitType
            );
            return attr ? attr.value : defaultValue;
          };

          // Process image URL
          let imageUrl = metadata.image;
          if (imageUrl?.startsWith("ipfs://")) {
            imageUrl = imageUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
          }

          // Build card object compatible with MintedCardDisplay
          return {
            id: `token-${tokenId}`,
            tokenId,
            name: metadata.name || `Card #${tokenId}`,
            subtitle: "",
            image: imageUrl,
            imageData: imageUrl,
            rarity: getAttr("Rarity", "Common"),
            type: getAttr("Type", "Creature"),
            level: getAttr("Level", "1"),
            artist: getAttr("Artist", "Waves TCG"),
            stats: {
              attack: getAttr("Attack", 0),
              defense: getAttr("Defense", 0),
            },
            manaCost: [
              {
                type: "hp",
                value: getAttr("HP", 0),
                color: "#ff4444",
                textColor: "#fff",
              },
              {
                type: "mana",
                value: getAttr("Mana", 0),
                color: "#4444ff",
                textColor: "#fff",
              },
            ],
            flavorText:
              metadata.description ||
              `${metadata.name} - A unique trading card`,
            theme: {
              background: "linear-gradient(145deg, #2a2a2a, #1a1a1a)",
              header: {
                background: "rgba(0, 0, 0, 0.6)",
                color: "#fff",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              },
              imageArea: {
                background: "rgba(0, 0, 0, 0.3)",
                border: "2px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
              },
              typeSection: {
                background: "rgba(0, 0, 0, 0.6)",
                color: "#fff",
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              },
              stat: {
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              },
              flavorText: {
                background: "rgba(0, 0, 0, 0.4)",
                color: "#ddd",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              },
              bottomSection: {
                background: "rgba(0, 0, 0, 0.6)",
              },
              rarity: {
                background: "rgba(255, 215, 0, 0.2)",
                color: "#ffd700",
                border: "1px solid rgba(255, 215, 0, 0.4)",
                boxShadow: "0 0 10px rgba(255, 215, 0, 0.3)",
              },
            },
            minter,
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
            openSeaUrl: getOpenSeaUrl(tokenId),
          };
        } catch (err) {
          console.error(`Error processing token ${log.args.tokenId}:`, err);
          return null;
        }
      });

      const cards = await Promise.all(cardsPromises);
      const validCards = cards.filter((card) => card !== null);

      // Sort by block number (newest first)
      validCards.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));

      console.log(
        `✅ Successfully processed ${validCards.length} cards from blockchain`
      );
      return validCards;
    } catch (err) {
      console.error("❌ Error fetching cards from blockchain:", err);
      console.error("Error details:", err.message, err.stack);
      throw err; // Propagate error so it can be caught by fetchCards
    }
  };

  /**
   * Fetch cards - tries backend first, then falls back to on-chain
   */
  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try backend first
      const backendCards = await fetchCardsFromBackend();

      if (backendCards && backendCards.length > 0) {
        // Format backend cards
        const formattedCards = backendCards.map((card) => ({
          id: card.id,
          tokenId: card.tokenId,
          name: card.name || "Unknown Card",
          imageData: card.imageData || card.image,
          image:
            card.ipfsLinks?.find((l) => l.type === "styled_card")
              ?.gateway_url ||
            card.ipfsLinks?.find((l) => l.type === "raw_image")?.gateway_url ||
            card.imageData,
          rarity: card.rarity,
          type: card.type,
          stats: card.stats,
          flavorText: card.flavorText,
          theme: card.theme,
          minter: card.walletAddress,
          mintedAt: card.mintedAt,
          transactionHash: card.transactionHash,
          openSeaUrl: card.tokenId ? getOpenSeaUrl(card.tokenId) : null,
        }));

        // Sort by mintedAt (newest first)
        formattedCards.sort(
          (a, b) => new Date(b.mintedAt) - new Date(a.mintedAt)
        );

        setCards(formattedCards);
        setLoading(false);
        return;
      }

      // Fallback: fetch from blockchain using CardMinted events
      console.log("Backend returned no cards, fetching from blockchain...");

      if (!NFT_CONTRACT_ADDRESS) {
        console.error("❌ NFT_CONTRACT_ADDRESS not configured");
        setError(
          "NFT contract not configured. Please set VITE_NFT_CONTRACT_ADDRESS in your environment."
        );
        setCards([]);
        setLoading(false);
        return;
      }

      if (!publicClient) {
        console.error("❌ publicClient not available");
        setError(
          "Blockchain client not configured. Please check your wallet connection."
        );
        setCards([]);
        setLoading(false);
        return;
      }

      try {
        const blockchainCards = await fetchCardsFromBlockchain();

        if (blockchainCards.length > 0) {
          console.log(
            `✅ Loaded ${blockchainCards.length} total cards from blockchain`
          );
          setCards(blockchainCards);
        } else {
          console.log("ℹ️ No cards found in contract");
          setCards([]);
        }
      } catch (blockchainErr) {
        console.error("❌ Blockchain fetch failed:", blockchainErr);
        setError(`Failed to fetch NFTs: ${blockchainErr.message}`);
        setCards([]);
      }
    } catch (err) {
      console.error("❌ Error fetching cards:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [NFT_CONTRACT_ADDRESS, publicClient]);

  // Fetch cards on mount
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return {
    cards,
    loading,
    error,
    refetch: fetchCards,
    getOpenSeaUrl,
  };
}
