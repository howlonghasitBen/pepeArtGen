import { useState, useEffect, useCallback } from "react";

// Sample fallback cards for when API fails
const SAMPLE_CARDS = [
  {
    id: "sample-1",
    tokenId: "1",
    name: "Cosmic Surfer",
    image: "https://picsum.photos/seed/card1/400/533",
    imageData: "https://picsum.photos/seed/card1/400/533",
    rarity: "rare",
    description: "A cosmic traveler riding the waves of the universe.",
    openSeaUrl: "#",
  },
  {
    id: "sample-2",
    tokenId: "2",
    name: "Beach Chill Pepe",
    image: "https://picsum.photos/seed/card2/400/533",
    imageData: "https://picsum.photos/seed/card2/400/533",
    rarity: "common",
    description: "Just vibing on the beach.",
    openSeaUrl: "#",
  },
  {
    id: "sample-3",
    tokenId: "3",
    name: "Tidal Wave Master",
    image: "https://picsum.photos/seed/card3/400/533",
    imageData: "https://picsum.photos/seed/card3/400/533",
    rarity: "epic",
    description: "Commands the power of the ocean.",
    openSeaUrl: "#",
  },
  {
    id: "sample-4",
    tokenId: "4",
    name: "Sunset Rider",
    image: "https://picsum.photos/seed/card4/400/533",
    imageData: "https://picsum.photos/seed/card4/400/533",
    rarity: "uncommon",
    description: "Catches the last wave at golden hour.",
    openSeaUrl: "#",
  },
  {
    id: "sample-5",
    tokenId: "5",
    name: "Neon Reef Dweller",
    image: "https://picsum.photos/seed/card5/400/533",
    imageData: "https://picsum.photos/seed/card5/400/533",
    rarity: "legendary",
    description: "Glows with bioluminescent power.",
    openSeaUrl: "#",
  },
  {
    id: "sample-6",
    tokenId: "6",
    name: "Palm Tree Vibes",
    image: "https://picsum.photos/seed/card6/400/533",
    imageData: "https://picsum.photos/seed/card6/400/533",
    rarity: "common",
    description: "Living that island life.",
    openSeaUrl: "#",
  },
];

/**
 * Extract original image URL from IPFS metadata via backend proxy
 * This avoids CORS issues with Pinata gateway
 */
async function getOriginalImageFromMetadata(metadataUrl, apiBaseUrl) {
  if (!metadataUrl) return null;

  try {
    // Use backend proxy to fetch IPFS metadata (avoids CORS)
    const proxyUrl = `${apiBaseUrl}/api/ipfs/metadata?url=${encodeURIComponent(metadataUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) return null;

    const metadata = await response.json();
    return metadata.image || null;
  } catch (err) {
    console.warn('Failed to fetch metadata:', err);
    return null;
  }
}

export function useAllCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingSampleData, setUsingSampleData] = useState(false);

  const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
  const NETWORK = import.meta.env.VITE_NETWORK || "base";
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  const OPENSEA_API_KEY = import.meta.env.VITE_OPENSEA_API_KEY || "";

  /**
   * Get OpenSea URL for a token
   */
  const getOpenSeaUrl = (tokenId) => {
    const network = NETWORK === "baseSepolia" ? "base-sepolia" : "base";
    return `https://opensea.io/assets/${network}/${NFT_CONTRACT_ADDRESS}/${tokenId}`;
  };

  /**
   * Fetch cards - tries backend first, falls back to OpenSea with IPFS metadata
   */
  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingSampleData(false);

    try {
      // First try backend API (has Pinata gateway URLs)
      console.log("📋 Fetching cards from backend API");
      let backendCards = [];

      try {
        const response = await fetch(`${API_BASE_URL}/api/cards/all`);
        if (response.ok) {
          const data = await response.json();
          backendCards = data.cards || [];
          console.log(`Backend returned ${backendCards.length} cards`);
        }
      } catch (err) {
        console.warn("Backend API unavailable:", err);
      }

      // Also fetch from OpenSea to get all NFTs
      const chain = NETWORK === "baseSepolia" ? "base_sepolia" : "base";
      const apiUrl = `https://api.opensea.io/api/v2/chain/${chain}/contract/${NFT_CONTRACT_ADDRESS}/nfts`;

      const headers = { "Accept": "application/json" };
      if (OPENSEA_API_KEY) {
        headers["X-API-KEY"] = OPENSEA_API_KEY;
      }

      let openSeaNfts = [];
      try {
        const osResponse = await fetch(apiUrl, { headers });
        if (osResponse.ok) {
          const osData = await osResponse.json();
          openSeaNfts = osData.nfts || [];
          console.log(`OpenSea returned ${openSeaNfts.length} NFTs`);
        }
      } catch (err) {
        console.warn("OpenSea API unavailable:", err);
      }

      // Create a map of backend cards by tokenId for quick lookup
      const backendMap = new Map();
      backendCards.forEach(card => {
        if (card.tokenId) backendMap.set(String(card.tokenId), card);
      });

      // Merge: prefer backend data (has Pinata URLs), supplement with OpenSea
      const mergedCards = await Promise.all(
        openSeaNfts.map(async (nft) => {
          const tokenId = nft.identifier;

          // Check if we have this card from backend
          const backendCard = backendMap.get(tokenId);
          if (backendCard && backendCard.image) {
            return {
              id: backendCard.id,
              tokenId: tokenId,
              name: backendCard.name,
              image: backendCard.image,
              imageData: backendCard.imageData || backendCard.image,
              rarity: backendCard.rarity,
              type: backendCard.type || "Creature — Generated",
              description: backendCard.flavorText,
              stats: backendCard.stats,
              theme: backendCard.theme,
              openSeaUrl: getOpenSeaUrl(tokenId),
              mintedAt: backendCard.mintedAt,
              walletAddress: backendCard.walletAddress,
            };
          }

          // Not in backend - try to get original image from OpenSea's metadata_url
          let imageUrl = nft.image_url || nft.display_image_url;

          // Try to get original 3:4 image from IPFS metadata via backend proxy
          if (nft.metadata_url) {
            const originalImage = await getOriginalImageFromMetadata(nft.metadata_url, API_BASE_URL);
            if (originalImage) {
              imageUrl = originalImage;
            }
          }

          return {
            id: tokenId,
            tokenId: tokenId,
            name: nft.name || `Card #${tokenId}`,
            image: imageUrl,
            imageData: imageUrl,
            rarity: nft.rarity,
            type: "Creature — Generated",
            description: nft.description,
            openSeaUrl: getOpenSeaUrl(tokenId),
          };
        })
      );

      // Add any backend cards not in OpenSea (edge case)
      backendCards.forEach(card => {
        if (!mergedCards.find(c => String(c.tokenId) === String(card.tokenId))) {
          mergedCards.push({
            id: card.id,
            tokenId: card.tokenId,
            name: card.name,
            image: card.image,
            imageData: card.imageData || card.image,
            rarity: card.rarity,
            type: card.type || "Creature — Generated",
            description: card.flavorText,
            stats: card.stats,
            theme: card.theme,
            openSeaUrl: getOpenSeaUrl(card.tokenId),
            mintedAt: card.mintedAt,
            walletAddress: card.walletAddress,
          });
        }
      });

      if (mergedCards.length > 0) {
        console.log(`✅ Loaded ${mergedCards.length} cards total`);
        setCards(mergedCards);
      } else if (backendCards.length > 0) {
        // Fallback to just backend cards
        const formattedCards = backendCards.map((card) => ({
          id: card.id,
          tokenId: card.tokenId,
          name: card.name,
          image: card.image,
          imageData: card.imageData || card.image,
          rarity: card.rarity,
          type: card.type || "Creature — Generated",
          description: card.flavorText,
          stats: card.stats,
          theme: card.theme,
          openSeaUrl: getOpenSeaUrl(card.tokenId),
          mintedAt: card.mintedAt,
          walletAddress: card.walletAddress,
        }));
        console.log(`✅ Loaded ${formattedCards.length} cards from backend`);
        setCards(formattedCards);
      } else {
        console.log("ℹ️ No cards found, using sample cards");
        setCards(SAMPLE_CARDS);
        setUsingSampleData(true);
      }
    } catch (err) {
      console.error("❌ Error fetching cards:", err);
      setCards(SAMPLE_CARDS);
      setUsingSampleData(true);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, NFT_CONTRACT_ADDRESS, NETWORK, OPENSEA_API_KEY]);

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
