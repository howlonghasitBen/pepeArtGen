import { useState, useEffect, useCallback } from "react";

// Sample fallback cards for when OpenSea API fails
const SAMPLE_CARDS = [
  {
    id: "sample-1",
    tokenId: "1",
    name: "Cosmic Surfer",
    image: "https://picsum.photos/seed/card1/400/560",
    imageData: "https://picsum.photos/seed/card1/400/560",
    rarity: "rare",
    description: "A cosmic traveler riding the waves of the universe.",
    openSeaUrl: "#",
  },
  {
    id: "sample-2",
    tokenId: "2",
    name: "Beach Chill Pepe",
    image: "https://picsum.photos/seed/card2/400/560",
    imageData: "https://picsum.photos/seed/card2/400/560",
    rarity: "common",
    description: "Just vibing on the beach.",
    openSeaUrl: "#",
  },
  {
    id: "sample-3",
    tokenId: "3",
    name: "Tidal Wave Master",
    image: "https://picsum.photos/seed/card3/400/560",
    imageData: "https://picsum.photos/seed/card3/400/560",
    rarity: "epic",
    description: "Commands the power of the ocean.",
    openSeaUrl: "#",
  },
  {
    id: "sample-4",
    tokenId: "4",
    name: "Sunset Rider",
    image: "https://picsum.photos/seed/card4/400/560",
    imageData: "https://picsum.photos/seed/card4/400/560",
    rarity: "uncommon",
    description: "Catches the last wave at golden hour.",
    openSeaUrl: "#",
  },
  {
    id: "sample-5",
    tokenId: "5",
    name: "Neon Reef Dweller",
    image: "https://picsum.photos/seed/card5/400/560",
    imageData: "https://picsum.photos/seed/card5/400/560",
    rarity: "legendary",
    description: "Glows with bioluminescent power.",
    openSeaUrl: "#",
  },
  {
    id: "sample-6",
    tokenId: "6",
    name: "Palm Tree Vibes",
    image: "https://picsum.photos/seed/card6/400/560",
    imageData: "https://picsum.photos/seed/card6/400/560",
    rarity: "common",
    description: "Living that island life.",
    openSeaUrl: "#",
  },
];

export function useAllCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingSampleData, setUsingSampleData] = useState(false);

  const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
  const NETWORK = import.meta.env.VITE_NETWORK || "base";
  const OPENSEA_API_KEY = import.meta.env.VITE_OPENSEA_API_KEY || "";

  /**
   * Get OpenSea URL for a token
   */
  const getOpenSeaUrl = (tokenId) => {
    const network = NETWORK === "baseSepolia" ? "base-sepolia" : "base";
    return `https://opensea.io/assets/${network}/${NFT_CONTRACT_ADDRESS}/${tokenId}`;
  };

  /**
   * Fetch all minted cards from OpenSea
   */
  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingSampleData(false);

    try {
      // Check if we have the required environment variables
      if (!NFT_CONTRACT_ADDRESS || NFT_CONTRACT_ADDRESS === "0x_your_deployed_waves_tcg_contract_address") {
        console.log("ℹ️ NFT contract address not configured, using sample cards");
        setCards(SAMPLE_CARDS);
        setUsingSampleData(true);
        return;
      }

      console.log("📋 Fetching cards from OpenSea");

      // Use OpenSea API v2 to fetch NFTs from the collection
      const chain = NETWORK === "baseSepolia" ? "base_sepolia" : "base";
      const apiUrl = `https://api.opensea.io/api/v2/chain/${chain}/contract/${NFT_CONTRACT_ADDRESS}/nfts`;

      const headers = {
        "Accept": "application/json",
      };

      // OpenSea API v2 requires an API key for most endpoints
      if (OPENSEA_API_KEY) {
        headers["X-API-KEY"] = OPENSEA_API_KEY;
      }

      const response = await fetch(apiUrl, { headers });

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 401) {
          console.warn("⚠️ OpenSea API authentication failed (401)");
          console.log("To fix this:");
          console.log("1. Get an API key from https://docs.opensea.io/reference/api-keys");
          console.log("2. Add VITE_OPENSEA_API_KEY=your_key to your .env file");
          console.log("Using sample cards for now...");
          setCards(SAMPLE_CARDS);
          setUsingSampleData(true);
          setError("OpenSea API key required. Using sample cards.");
          return;
        }

        if (response.status === 404) {
          console.log("ℹ️ No NFTs found for this contract");
          setCards(SAMPLE_CARDS);
          setUsingSampleData(true);
          return;
        }

        if (response.status === 429) {
          console.warn("⚠️ OpenSea rate limit exceeded");
          setCards(SAMPLE_CARDS);
          setUsingSampleData(true);
          setError("Rate limited. Using sample cards.");
          return;
        }

        throw new Error(`OpenSea API error: ${response.status}`);
      }

      const data = await response.json();
      const nfts = data.nfts || [];

      if (nfts.length > 0) {
        console.log(`📋 Found ${nfts.length} NFTs, fetching full details...`);

        // Fetch full details for each NFT to get proper image URLs
        // The list endpoint returns deprecated image_url, Get NFT returns the correct one
        const formattedCards = await Promise.all(
          nfts.map(async (nft) => {
            try {
              // Fetch individual NFT details for proper image URL
              const nftUrl = `https://api.opensea.io/api/v2/chain/${chain}/contract/${NFT_CONTRACT_ADDRESS}/nfts/${nft.identifier}`;
              const nftResponse = await fetch(nftUrl, { headers });

              if (nftResponse.ok) {
                const nftData = await nftResponse.json();
                const fullNft = nftData.nft;
                return {
                  id: fullNft.identifier,
                  tokenId: fullNft.identifier,
                  name: fullNft.name || `Card #${fullNft.identifier}`,
                  image: fullNft.image_url || fullNft.display_image_url,
                  imageData: fullNft.image_url || fullNft.display_image_url,
                  animationUrl: fullNft.animation_url,
                  rarity: fullNft.rarity,
                  type: fullNft.contract,
                  description: fullNft.description,
                  openSeaUrl: getOpenSeaUrl(fullNft.identifier),
                };
              }
            } catch (err) {
              console.warn(`Failed to fetch NFT ${nft.identifier}:`, err);
            }

            // Fallback to list data if individual fetch fails
            return {
              id: nft.identifier,
              tokenId: nft.identifier,
              name: nft.name || `Card #${nft.identifier}`,
              image: nft.image_url || nft.display_image_url,
              imageData: nft.image_url || nft.display_image_url,
              rarity: nft.rarity,
              type: nft.contract,
              description: nft.description,
              openSeaUrl: getOpenSeaUrl(nft.identifier),
            };
          })
        );

        console.log(`✅ Loaded ${formattedCards.length} cards with full details`);
        setCards(formattedCards);
      } else {
        console.log("ℹ️ No cards found in collection, using sample cards");
        setCards(SAMPLE_CARDS);
        setUsingSampleData(true);
      }
    } catch (err) {
      console.error("❌ Error fetching from OpenSea:", err);
      // Use sample cards as fallback
      console.log("Using sample cards as fallback...");
      setCards(SAMPLE_CARDS);
      setUsingSampleData(true);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [NFT_CONTRACT_ADDRESS, NETWORK, OPENSEA_API_KEY]);

  // Fetch cards on mount
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return {
    cards,
    loading,
    error,
    usingSampleData,
    refetch: fetchCards,
    getOpenSeaUrl,
  };
}
