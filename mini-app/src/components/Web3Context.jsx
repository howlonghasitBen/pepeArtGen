import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  useAccount,
  useBalance,
  usePublicClient,
  useChainId,
  useSwitchChain,
} from "wagmi";

const Web3Context = createContext(null);

// Configuration
const TARGET_CHAIN_ID = Number(import.meta.env.VITE_TARGET_CHAIN_ID || 8453); // Base mainnet
const USDC_CONTRACT_ADDRESS = import.meta.env.VITE_USDC_CONTRACT_ADDRESS;
const TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS;
const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export function Web3Provider({ children }) {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  // Payment session state (centralized)
  const [paymentSession, setPaymentSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  // USDC Balance - single source of truth
  const {
    data: usdcBalanceData,
    refetch: refetchUsdcBalance,
    isLoading: isBalanceLoading,
    error: balanceError,
  } = useBalance({
    address: address,
    token: USDC_CONTRACT_ADDRESS,
    chainId: TARGET_CHAIN_ID,
    query: {
      enabled: !!address && !!USDC_CONTRACT_ADDRESS && isConnected,
      refetchInterval: 15000, // Refresh every 15 seconds
      staleTime: 5000, // Consider data stale after 5 seconds
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Derived state
  const isCorrectChain = chainId === TARGET_CHAIN_ID;
  const usdcBalance = usdcBalanceData?.value ?? 0n;
  const usdcBalanceFormatted = usdcBalanceData?.formatted ?? "0.00";

  // Check for active payment session
  const checkActiveSession = useCallback(async () => {
    if (!address || !isConnected) {
      setPaymentSession(null);
      return null;
    }

    setIsLoadingSession(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/payment/session/${address}`
      );
      if (!response.ok) {
        throw new Error("Failed to check payment session");
      }

      const data = await response.json();
      if (data.hasActiveSession && data.session) {
        setPaymentSession(data.session);
        return data.session;
      } else {
        setPaymentSession(null);
        return null;
      }
    } catch (err) {
      console.error("Error checking active session:", err);
      setPaymentSession(null);
      return null;
    } finally {
      setIsLoadingSession(false);
    }
  }, [address, isConnected]);

  // Update session after successful payment
  const updateSession = useCallback((session) => {
    setPaymentSession(session);
  }, []);

  // Decrement generations remaining locally
  const useGeneration = useCallback(() => {
    setPaymentSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        generationsRemaining: Math.max(0, prev.generationsRemaining - 1),
      };
    });
  }, []);

  // Clear session
  const clearSession = useCallback(() => {
    setPaymentSession(null);
  }, []);

  // Switch to correct chain
  const switchToCorrectChain = useCallback(async () => {
    if (!switchChain) return false;
    try {
      await switchChain({ chainId: TARGET_CHAIN_ID });
      return true;
    } catch (err) {
      console.error("Failed to switch chain:", err);
      return false;
    }
  }, [switchChain]);

  // Refresh all Web3 state
  const refreshAll = useCallback(async () => {
    await Promise.all([refetchUsdcBalance(), checkActiveSession()]);
  }, [refetchUsdcBalance, checkActiveSession]);

  // Check for active session when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      checkActiveSession();
    } else {
      setPaymentSession(null);
    }
  }, [isConnected, address, checkActiveSession]);

  // Log config issues in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      if (!USDC_CONTRACT_ADDRESS)
        console.warn("⚠️ VITE_USDC_CONTRACT_ADDRESS not set");
      if (!TREASURY_ADDRESS) console.warn("⚠️ VITE_TREASURY_ADDRESS not set");
      if (!NFT_CONTRACT_ADDRESS)
        console.warn("⚠️ VITE_NFT_CONTRACT_ADDRESS not set");
    }
  }, []);

  const value = {
    // Wallet state
    address,
    isConnected,
    isConnecting: isConnecting || isReconnecting,
    chainId,
    isCorrectChain,
    isSwitchingChain,
    switchToCorrectChain,
    publicClient,

    // USDC balance
    usdcBalance,
    usdcBalanceFormatted,
    isBalanceLoading,
    balanceError,
    refetchUsdcBalance,

    // Payment session
    paymentSession,
    isLoadingSession,
    checkActiveSession,
    updateSession,
    useGeneration,
    clearSession,
    hasActiveSession:
      !!paymentSession && paymentSession.generationsRemaining > 0,
    generationsRemaining: paymentSession?.generationsRemaining ?? 0,

    // Config
    config: {
      targetChainId: TARGET_CHAIN_ID,
      usdcContractAddress: USDC_CONTRACT_ADDRESS,
      treasuryAddress: TREASURY_ADDRESS,
      nftContractAddress: NFT_CONTRACT_ADDRESS,
      apiBaseUrl: API_BASE_URL,
    },

    // Utilities
    refreshAll,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}

export default Web3Context;
