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

export function useAllCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [syncing, setSyncing] = useState(false);

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
   * Trigger a sync of NFTs from OpenSea to Supabase
   */
  const syncNfts = useCallback(async () => {
    try {
      setSyncing(true);
      console.log("🔄 Triggering NFT sync...");

      const response = await fetch(`${API_BASE_URL}/api/nfts/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractAddress: NFT_CONTRACT_ADDRESS,
          network: NETWORK
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Sync complete: ${data.synced} new NFTs`);
        return data;
      }
    } catch (err) {
      console.warn("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
    return null;
  }, [API_BASE_URL, NFT_CONTRACT_ADDRESS, NETWORK]);

  /**
   * Fetch cards from Supabase (primary source)
   */
  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingSampleData(false);

    try {
      console.log("📋 Fetching NFTs from Supabase...");

      // Fetch from Supabase (cached data with proper 3:4 images)
      const response = await fetch(`${API_BASE_URL}/api/nfts/all`);

      if (response.ok) {
        const data = await response.json();
        const nfts = data.nfts || [];

        if (nfts.length > 0) {
          // Format for display
          const formattedCards = nfts.map((nft) => ({
            id: nft.id,
            tokenId: nft.tokenId,
            name: nft.name,
            // Use the cached Pinata gateway URL (proper 3:4 aspect ratio)
            image: nft.image || nft.imageUrl || nft.openseaImageUrl,
            imageData: nft.image || nft.imageUrl || nft.openseaImageUrl,
            rarity: nft.metadata?.attributes?.find(a => a.trait_type === "Edition")?.value || "1/1",
            type: "Creature — Generated",
            description: nft.description,
            metadata: nft.metadata,
            openSeaUrl: getOpenSeaUrl(nft.tokenId),
            syncedAt: nft.syncedAt
          }));

          console.log(`✅ Loaded ${formattedCards.length} NFTs from Supabase`);
          setCards(formattedCards);
          return;
        }

        // No NFTs in Supabase - trigger sync and retry
        console.log("ℹ️ No NFTs in Supabase, triggering sync...");
        const syncResult = await syncNfts();

        if (syncResult && syncResult.synced > 0) {
          // Retry fetch after sync
          const retryResponse = await fetch(`${API_BASE_URL}/api/nfts/all`);
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            const retryNfts = retryData.nfts || [];

            if (retryNfts.length > 0) {
              const formattedCards = retryNfts.map((nft) => ({
                id: nft.id,
                tokenId: nft.tokenId,
                name: nft.name,
                image: nft.image || nft.imageUrl || nft.openseaImageUrl,
                imageData: nft.image || nft.imageUrl || nft.openseaImageUrl,
                rarity: nft.metadata?.attributes?.find(a => a.trait_type === "Edition")?.value || "1/1",
                type: "Creature — Generated",
                description: nft.description,
                metadata: nft.metadata,
                openSeaUrl: getOpenSeaUrl(nft.tokenId),
                syncedAt: nft.syncedAt
              }));

              console.log(`✅ Loaded ${formattedCards.length} NFTs after sync`);
              setCards(formattedCards);
              return;
            }
          }
        }
      }

      // Fallback to sample cards
      console.log("ℹ️ No NFTs found, using sample cards");
      setCards(SAMPLE_CARDS);
      setUsingSampleData(true);
    } catch (err) {
      console.error("❌ Error fetching NFTs:", err);
      setCards(SAMPLE_CARDS);
      setUsingSampleData(true);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, syncNfts]);

  // Fetch cards on mount
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return {
    cards,
    loading,
    error,
    syncing,
    usingSampleData,
    refetch: fetchCards,
    syncNfts,
    getOpenSeaUrl,
  };
}
