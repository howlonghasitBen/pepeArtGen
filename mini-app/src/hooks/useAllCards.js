import { useState, useEffect, useCallback } from "react";

export function useAllCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

    try {
      console.log("📋 Fetching cards from OpenSea");

      // Use OpenSea API v2 to fetch NFTs from the collection
      const chain = NETWORK === "baseSepolia" ? "base_sepolia" : "base";
      const apiUrl = `https://api.opensea.io/api/v2/chain/${chain}/contract/${NFT_CONTRACT_ADDRESS}/nfts`;

      const headers = {};
      if (OPENSEA_API_KEY) {
        headers["X-API-KEY"] = OPENSEA_API_KEY;
      }

      const response = await fetch(apiUrl, { headers });

      if (!response.ok) {
        throw new Error(`OpenSea API error: ${response.status}`);
      }

      const data = await response.json();
      const nfts = data.nfts || [];

      if (nfts.length > 0) {
        // Format NFTs for display
        const formattedCards = nfts.map((nft) => ({
          id: nft.identifier,
          tokenId: nft.identifier,
          name: nft.name || `Card #${nft.identifier}`,
          image: nft.image_url || nft.display_image_url,
          imageData: nft.image_url || nft.display_image_url,
          rarity: nft.rarity,
          type: nft.contract,
          description: nft.description,
          openSeaUrl: getOpenSeaUrl(nft.identifier),
        }));

        console.log(`✅ Found ${formattedCards.length} cards from OpenSea`);
        setCards(formattedCards);
      } else {
        console.log("ℹ️ No cards found in collection");
        setCards([]);
      }
    } catch (err) {
      console.error("❌ Error fetching from OpenSea:", err);
      setError(err.message);
      setCards([]);
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
    refetch: fetchCards,
    getOpenSeaUrl,
  };
}
