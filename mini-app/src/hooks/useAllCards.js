import { useState, useEffect, useCallback } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export function useAllCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
  const NETWORK = import.meta.env.VITE_NETWORK || "base";

  /**
   * Get OpenSea URL for a token
   */
  const getOpenSeaUrl = (tokenId) => {
    const network = NETWORK === "baseSepolia" ? "base-sepolia" : "base";
    return `https://opensea.io/assets/${network}/${NFT_CONTRACT_ADDRESS}/${tokenId}`;
  };

  /**
   * Fetch all minted cards from backend (Supabase)
   */
  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("📋 Fetching all minted cards");

      const response = await fetch(`${API_BASE_URL}/api/cards/all`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch cards");
      }

      const data = await response.json();
      const backendCards = data.cards || [];

      if (backendCards.length > 0) {
        // Format cards for display
        const formattedCards = backendCards.map((card) => ({
          id: card.id,
          tokenId: card.tokenId,
          name: card.name || "Unknown Card",
          imageData: card.imageData || card.image,
          image: card.image || card.imageData,
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

        console.log(`✅ Found ${formattedCards.length} total minted cards`);
        setCards(formattedCards);
      } else {
        console.log("ℹ️ No minted cards found");
        setCards([]);
      }
    } catch (err) {
      console.error("❌ Error fetching cards:", err);
      setError(err.message);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [NFT_CONTRACT_ADDRESS, NETWORK]);

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
