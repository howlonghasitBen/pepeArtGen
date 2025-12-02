import { useState, useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, erc20Abi } from "viem";
import { useWeb3 } from "../context/Web3Context";

const GENERATION_FEE_USDC = "2.50"; // $2.50 USDC
const GENERATION_FEE_RAW = parseUnits(GENERATION_FEE_USDC, 6);

export function useGenerationPayment() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const {
    address,
    isConnected,
    isCorrectChain,
    usdcBalance,
    usdcBalanceFormatted,
    isBalanceLoading,
    balanceError,
    refetchUsdcBalance,
    paymentSession,
    checkActiveSession,
    updateSession,
    config,
  } = useWeb3();

  const { writeContractAsync } = useWriteContract();

  // Check if user has sufficient balance
  const hasSufficientBalance = useCallback(() => {
    if (usdcBalance === undefined || usdcBalance === null) return false;
    return usdcBalance >= GENERATION_FEE_RAW;
  }, [usdcBalance]);

  // Main payment function with improved error handling
  const payForGeneration = useCallback(async () => {
    // Pre-flight checks
    if (!address) {
      throw new Error("Wallet not connected");
    }

    if (!isCorrectChain) {
      throw new Error(
        `Please switch to Base network (Chain ID: ${config.targetChainId})`
      );
    }

    if (!config.usdcContractAddress) {
      throw new Error("USDC contract not configured");
    }

    if (!config.treasuryAddress) {
      throw new Error("Treasury address not configured");
    }

    if (!hasSufficientBalance()) {
      throw new Error(
        `Insufficient USDC balance. Need ${GENERATION_FEE_USDC} USDC, have ${usdcBalanceFormatted}`
      );
    }

    setStatus("paying");
    setError(null);
    setTxHash(null);

    try {
      // Step 1: Send USDC transfer transaction
      console.log("💰 Sending USDC payment...");
      console.log(`   Amount: ${GENERATION_FEE_USDC} USDC`);
      console.log(`   To: ${config.treasuryAddress}`);

      const hash = await writeContractAsync({
        address: config.usdcContractAddress,
        abi: erc20Abi,
        functionName: "transfer",
        args: [config.treasuryAddress, GENERATION_FEE_RAW],
      });

      setTxHash(hash);
      console.log("✅ Transaction submitted:", hash);

      // Step 2: Register payment session with backend
      setStatus("creating_session");
      console.log("📝 Creating payment session...");

      const sessionResponse = await fetch(
        `${config.apiBaseUrl}/api/payment/initiate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address,
            transactionHash: hash,
            amountUsdc: GENERATION_FEE_USDC,
          }),
        }
      );

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json().catch(() => ({}));

        // Special handling for duplicate transaction
        if (sessionResponse.status === 409) {
          console.warn(
            "⚠️ Transaction already used, checking for existing session..."
          );
          const existingSession = await checkActiveSession();
          if (existingSession) {
            setStatus("success");
            return { sessionId: existingSession.id, transactionHash: hash };
          }
        }

        throw new Error(
          errorData.message || errorData.error || "Failed to initiate session"
        );
      }

      const sessionData = await sessionResponse.json();
      console.log("✅ Session created:", sessionData.sessionId);

      // Step 3: Verify payment on-chain (this waits for confirmation)
      setStatus("verifying_payment");
      console.log("🔍 Verifying payment on-chain...");

      const verifyResponse = await fetch(
        `${config.apiBaseUrl}/api/payment/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionHash: hash,
            walletAddress: address,
          }),
        }
      );

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || "Payment verification failed"
        );
      }

      const verifyData = await verifyResponse.json();
      console.log("✅ Payment verified!");

      // Update local session state
      const newSession = {
        id: verifyData.sessionId,
        generationsRemaining: verifyData.generationsRemaining,
        confirmedAt: verifyData.confirmedAt,
      };
      updateSession(newSession);

      // Refresh USDC balance
      await refetchUsdcBalance();

      setStatus("success");
      return {
        sessionId: verifyData.sessionId,
        transactionHash: hash,
        generationsRemaining: verifyData.generationsRemaining,
      };
    } catch (err) {
      console.error("❌ Payment failed:", err);

      // Parse common wallet errors
      let errorMessage = err.message || "Payment failed";

      if (
        err.message?.includes("User rejected") ||
        err.message?.includes("user rejected")
      ) {
        errorMessage = "Transaction cancelled by user";
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH for gas fees";
      } else if (err.message?.includes("nonce")) {
        errorMessage = "Transaction nonce error. Please try again.";
      }

      setError(errorMessage);
      setStatus("error");
      throw new Error(errorMessage);
    }
  }, [
    address,
    isCorrectChain,
    config,
    hasSufficientBalance,
    usdcBalanceFormatted,
    writeContractAsync,
    checkActiveSession,
    updateSession,
    refetchUsdcBalance,
  ]);

  // Retry verification for a pending transaction
  const retryVerification = useCallback(
    async (transactionHash) => {
      if (!transactionHash || !address) {
        throw new Error("Missing transaction hash or wallet address");
      }

      setStatus("verifying_payment");
      setError(null);

      try {
        const response = await fetch(
          `${config.apiBaseUrl}/api/payment/retry-verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transactionHash,
              walletAddress: address,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Verification retry failed");
        }

        const data = await response.json();

        if (data.sessionId) {
          updateSession({
            id: data.sessionId,
            generationsRemaining: data.generationsRemaining,
          });
        }

        setStatus("success");
        return data;
      } catch (err) {
        setError(err.message);
        setStatus("error");
        throw err;
      }
    },
    [address, config.apiBaseUrl, updateSession]
  );

  // Clear error and reset status
  const clearError = useCallback(() => {
    setError(null);
    setStatus("idle");
    setTxHash(null);
  }, []);

  return {
    // Actions
    payForGeneration,
    retryVerification,
    checkActiveSession,
    clearError,
    refetchBalance: refetchUsdcBalance,

    // State
    status,
    error,
    txHash,
    isProcessing:
      status !== "idle" && status !== "error" && status !== "success",

    // From context (re-exported for convenience)
    paymentSession,
    usdcBalance,
    usdcBalanceFormatted,
    isBalanceLoading,
    balanceError,
    hasSufficientBalance,
    isCorrectChain: () => isCorrectChain,
    chainId: config.targetChainId,
    expectedChainId: config.targetChainId,
    generationFeeUsdc: GENERATION_FEE_USDC,
  };
}
