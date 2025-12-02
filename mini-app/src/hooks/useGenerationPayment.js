import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { parseUnits, erc20Abi } from "viem";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const GENERATION_FEE_USDC = "2.50"; // $2.50 USDC
// Default to Base (8453) if not specified in env
const TARGET_CHAIN_ID = Number(import.meta.env.VITE_TARGET_CHAIN_ID || 8453);

export function useGenerationPayment() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);
  const [manualBalance, setManualBalance] = useState(null);

  const { address, isConnected, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const USDC_CONTRACT_ADDRESS = import.meta.env.VITE_USDC_CONTRACT_ADDRESS;
  const TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS;

  // Debug configuration issues
  useEffect(() => {
    if (!USDC_CONTRACT_ADDRESS)
      console.warn("⚠️ VITE_USDC_CONTRACT_ADDRESS is missing");
    if (!TREASURY_ADDRESS) console.warn("⚠️ VITE_TREASURY_ADDRESS is missing");
  }, [USDC_CONTRACT_ADDRESS, TREASURY_ADDRESS]);

  // --- Read USDC Balance using standard ERC20 ABI ---
  const {
    data: usdcBalance,
    refetch: refetchBalance,
    error: balanceError,
    isLoading: isBalanceLoading,
  } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    // Safely handle undefined address
    args: address ? [address] : undefined,
    chainId: TARGET_CHAIN_ID,
    query: {
      // Only run query if we have both addresses
      enabled: Boolean(address && USDC_CONTRACT_ADDRESS),
      refetchInterval: 10000,
      retry: 2,
    },
  });

  // Log specific balance errors for debugging
  useEffect(() => {
    if (balanceError) {
      console.error("❌ Balance fetch failed:", balanceError);
    }
  }, [balanceError]);

  // --- Helper: Check if on correct chain ---
  const isCorrectChain = () => {
    if (!chainId) return false;
    return chainId === TARGET_CHAIN_ID;
  };

  // --- Helper: Manual fallback for balance ---
  const fetchBalanceManually = async () => {
    try {
      const result = await refetchBalance();
      if (result.data !== undefined) {
        setManualBalance(result.data);
      }
      return result.data;
    } catch (e) {
      console.error("Manual fetch failed", e);
      return null;
    }
  };

  const checkActiveSession = async () => {
    try {
      if (!address) return null;
      const response = await fetch(
        `${API_BASE_URL}/api/payment/session/${address}`
      );
      if (!response.ok) throw new Error("Failed to check payment session");

      const data = await response.json();
      if (data.hasActiveSession) {
        setPaymentSession(data.session);
        return data.session;
      }
      return null;
    } catch (err) {
      console.error("Error checking active session:", err);
      return null;
    }
  };

  const payForGeneration = async () => {
    try {
      if (!address) throw new Error("Wallet not connected");
      if (!isCorrectChain())
        throw new Error(
          `Please switch to Base network (Chain ID: ${TARGET_CHAIN_ID})`
        );
      if (!USDC_CONTRACT_ADDRESS)
        throw new Error("USDC contract not configured");

      const usdcAmount = parseUnits(GENERATION_FEE_USDC, 6);
      // Use Wagmi balance, fall back to manual, default to 0n if neither exists yet
      const currentBalance = usdcBalance ?? manualBalance ?? 0n;

      if (currentBalance < usdcAmount) {
        throw new Error(
          `Insufficient USDC balance. Need ${GENERATION_FEE_USDC} USDC`
        );
      }

      setStatus("paying");
      setError(null);

      // 1. Send TX using standard ERC20 ABI
      const hash = await writeContractAsync({
        address: USDC_CONTRACT_ADDRESS,
        abi: erc20Abi,
        functionName: "transfer",
        args: [TREASURY_ADDRESS, usdcAmount],
      });

      // 2. Register Session
      setStatus("creating_session");
      const sessionResponse = await fetch(
        `${API_BASE_URL}/api/payment/initiate`,
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

      if (!sessionResponse.ok) throw new Error("Failed to initiate session");

      // 3. Verify
      setStatus("verifying_payment");
      const verifyResponse = await fetch(`${API_BASE_URL}/api/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionHash: hash, walletAddress: address }),
      });

      if (!verifyResponse.ok) throw new Error("Payment verification failed");
      const verifyData = await verifyResponse.json();

      setPaymentSession({
        id: verifyData.sessionId,
        generationsRemaining: verifyData.generationsRemaining,
      });

      setStatus("success");
      refetchBalance();
      return { sessionId: verifyData.sessionId, transactionHash: hash };
    } catch (err) {
      console.error("Payment failed:", err);
      setError(err.message || "Payment failed");
      setStatus("error");
      throw err;
    }
  };

  const hasSufficientBalance = () => {
    // If balance is undefined/loading, don't block (UI handles loading state)
    // but strict check requires knowing balance.
    const balance = usdcBalance ?? manualBalance;
    if (balance === undefined || balance === null) return false;
    const required = parseUnits(GENERATION_FEE_USDC, 6);
    return balance >= required;
  };

  return {
    payForGeneration,
    checkActiveSession,
    getPaymentInfo: () => ({ fee: GENERATION_FEE_USDC }),
    hasSufficientBalance,
    isCorrectChain,
    clearError: () => {
      setError(null);
      setStatus("idle");
    },
    refetchBalance,
    fetchBalanceManually,
    paymentSession,
    usdcBalance,
    manualBalance,
    status,
    error,
    isBalanceLoading,
    balanceError,
    chainId,
    expectedChainId: TARGET_CHAIN_ID,
    generationFeeUsdc: GENERATION_FEE_USDC,
  };
}
