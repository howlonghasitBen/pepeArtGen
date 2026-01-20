import { useState, useEffect, useCallback } from "react";

// Sample fallback cards for when backend API fails
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

export function useAllCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingSampleData, setUsingSampleData] = useState(false);

  const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
  const NETWORK = import.meta.env.VITE_NETWORK || "base";
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  /**
   * Get OpenSea URL for a token
   */
  const getOpenSeaUrl = (tokenId) => {
    const network = NETWORK === "baseSepolia" ? "base-sepolia" : "base";
    return `https://opensea.io/assets/${network}/${NFT_CONTRACT_ADDRESS}/${tokenId}`;
  };

  /**
   * Fetch all minted cards from backend API (returns original Pinata gateway URLs)
   */
  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingSampleData(false);

    try {
      console.log("📋 Fetching cards from backend API");

      // Fetch from backend which returns original Pinata gateway URLs (proper 3:4 images)
      const response = await fetch(`${API_BASE_URL}/api/cards/all`);

      if (!response.ok) {
        if (response.status === 503) {
          console.log("ℹ️ Backend not configured, using sample cards");
          setCards(SAMPLE_CARDS);
          setUsingSampleData(true);
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const mintedCards = data.cards || [];

      if (mintedCards.length > 0) {
        // Format cards for display - backend returns Pinata gateway URLs
        const formattedCards = mintedCards.map((card) => ({
          id: card.id,
          tokenId: card.tokenId,
          name: card.name,
          // Use the Pinata gateway URL which has the proper 3:4 aspect ratio
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

        console.log(`✅ Loaded ${formattedCards.length} cards with original 3:4 images`);
        setCards(formattedCards);
      } else {
        console.log("ℹ️ No cards found, using sample cards");
        setCards(SAMPLE_CARDS);
        setUsingSampleData(true);
      }
    } catch (err) {
      console.error("❌ Error fetching cards:", err);
      // Use sample cards as fallback
      console.log("Using sample cards as fallback...");
      setCards(SAMPLE_CARDS);
      setUsingSampleData(true);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

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
