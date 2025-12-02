import { useState, useCallback } from "react";
import { useWriteContract } from "wagmi";
import { useWeb3 } from "../context/Web3Context";
import WAVES_TCG_NFT_ABI from "../contracts/WavesTCGNFT.json";

export function useMintCard() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);
  const [mintData, setMintData] = useState(null);

  const { address, publicClient, config } = useWeb3();
  const { writeContractAsync } = useWriteContract();

  /**
   * Record mint to backend database
   */
  const recordMint = useCallback(
    async (cardIds, transactionHash, metadataURIs) => {
      try {
        console.log("💾 Recording mint to database...");

        const response = await fetch(`${config.apiBaseUrl}/api/mint/record`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cardIds,
            transactionHash,
            minterAddress: address,
            metadataURIs,
            verify: true,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to record mint");
        }

        const data = await response.json();
        console.log("✅ Mint recorded successfully:", data);
        return data;
      } catch (err) {
        console.error("❌ Failed to record mint:", err);
        // Don't throw - recording failure shouldn't fail the entire mint
        return null;
      }
    },
    [address, config.apiBaseUrl]
  );

  /**
   * Upload card to IPFS via backend
   */
  const uploadToIPFS = useCallback(
    async (card) => {
      console.log("📤 Uploading to IPFS:", card.name);

      const response = await fetch(`${config.apiBaseUrl}/api/upload-to-ipfs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ card }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "IPFS upload failed");
      }

      const data = await response.json();
      console.log("✅ IPFS upload successful:", data.metadataURI);

      return data.metadataURI;
    },
    [config.apiBaseUrl]
  );

  /**
   * Mint a single card (FREE - only gas)
   */
  const mintSingleCard = useCallback(
    async (card) => {
      if (!config.nftContractAddress) {
        throw new Error(
          "NFT contract not deployed. Set VITE_NFT_CONTRACT_ADDRESS in .env"
        );
      }

      if (!address) {
        throw new Error("Wallet not connected");
      }

      // Step 1: Upload to IPFS
      setStatus("uploading");
      const metadataURI = await uploadToIPFS(card);

      // Step 2: Mint NFT on WavesTCGNFT (FREE - only gas)
      setStatus("minting");
      console.log("🎨 Minting NFT with metadata:", metadataURI);
      console.log("💰 Minting is FREE - only gas fees (~$0.01 on Base)");

      const hash = await writeContractAsync({
        address: config.nftContractAddress,
        abi: WAVES_TCG_NFT_ABI.abi,
        functionName: "mint",
        args: [metadataURI],
        value: 0n,
      });

      setTransactionHash(hash);
      setStatus("confirming");
      console.log("⏳ Transaction submitted:", hash);

      // Step 3: Wait for confirmation
      console.log("⏳ Waiting for transaction confirmation...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

      // Step 4: Record mint to database
      const recordedMint = await recordMint([card.id], hash, [metadataURI]);

      // Step 5: Store mint data for success modal
      setMintData({
        cards: [card],
        tokenIds: recordedMint?.tokenIds || [],
        transactionHash: hash,
      });

      setStatus("success");
      return hash;
    },
    [
      address,
      config.nftContractAddress,
      publicClient,
      uploadToIPFS,
      recordMint,
      writeContractAsync,
    ]
  );

  /**
   * Mint batch of cards (FREE - only gas)
   */
  const mintBatchCards = useCallback(
    async (cards) => {
      if (!config.nftContractAddress) {
        throw new Error(
          "NFT contract not deployed. Set VITE_NFT_CONTRACT_ADDRESS in .env"
        );
      }

      if (!address) {
        throw new Error("Wallet not connected");
      }

      // Step 1: Upload all cards to IPFS
      setStatus("uploading");
      console.log(`📤 Uploading ${cards.length} cards to IPFS...`);

      const metadataURIs = [];
      for (let i = 0; i < cards.length; i++) {
        console.log(`  Uploading ${i + 1}/${cards.length}: ${cards[i].name}`);
        const uri = await uploadToIPFS(cards[i]);
        metadataURIs.push(uri);
      }

      console.log("✅ All cards uploaded to IPFS");

      // Step 2: Batch mint NFTs
      setStatus("minting");
      console.log(`🎨 Batch minting ${cards.length} NFTs...`);
      console.log("💰 Minting is FREE - only gas fees");

      const hash = await writeContractAsync({
        address: config.nftContractAddress,
        abi: WAVES_TCG_NFT_ABI.abi,
        functionName: "mintBatch",
        args: [metadataURIs],
        value: 0n,
      });

      setTransactionHash(hash);
      setStatus("confirming");
      console.log("⏳ Batch transaction submitted:", hash);

      // Step 3: Wait for confirmation
      console.log("⏳ Waiting for transaction confirmation...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

      // Step 4: Record mints to database
      const cardIds = cards.map((card) => card.id);
      const recordedMint = await recordMint(cardIds, hash, metadataURIs);

      // Step 5: Store mint data for success modal
      setMintData({
        cards: cards,
        tokenIds: recordedMint?.tokenIds || [],
        transactionHash: hash,
      });

      setStatus("success");
      return hash;
    },
    [
      address,
      config.nftContractAddress,
      publicClient,
      uploadToIPFS,
      recordMint,
      writeContractAsync,
    ]
  );

  /**
   * Main mint function - handles single or batch
   */
  const mint = useCallback(
    async (cards) => {
      setStatus("idle");
      setError(null);
      setTransactionHash(null);
      setMintData(null);

      try {
        if (Array.isArray(cards) && cards.length > 1) {
          return await mintBatchCards(cards);
        } else {
          const card = Array.isArray(cards) ? cards[0] : cards;
          return await mintSingleCard(card);
        }
      } catch (err) {
        console.error("Minting failed:", err);

        // Parse common wallet errors
        let errorMessage = err.message || "Minting failed";
        if (
          err.message?.includes("User rejected") ||
          err.message?.includes("user rejected")
        ) {
          errorMessage = "Transaction cancelled by user";
        } else if (err.message?.includes("insufficient funds")) {
          errorMessage = "Insufficient ETH for gas fees";
        }

        setError(errorMessage);
        setStatus("error");
        throw new Error(errorMessage);
      }
    },
    [mintSingleCard, mintBatchCards]
  );

  // Reset state
  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setTransactionHash(null);
    setMintData(null);
  }, []);

  return {
    mint,
    reset,
    status,
    error,
    transactionHash,
    mintData,
    isLoading: status !== "idle" && status !== "error" && status !== "success",
  };
}
