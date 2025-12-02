import { useState, useEffect, useRef } from "react";
import { WagmiProvider, useAccount, useConnect } from "wagmi";
import { reconnect } from "@wagmi/core";
import { base, baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit, useAppKitState } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// Import the Web3Provider and hook for USDC balance
import { Web3Provider, useWeb3 } from "./context/Web3Context";

// Images
import wavesLogo from "./public/waves-collection-logo.png";
import openseaLogo from "./public/opensea-logo.svg";

// Components
import GeneratorScreen from "./components/GeneratorScreen";
import CurationScreen from "./components/CurationScreen";
import MyCardsScreen from "./components/MyCardsScreen";
import InfoModal from "./components/InfoModal";
import "./App.css";

// Configuration
const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

const metadata = {
  name: "SURF Waves TCG",
  description: "Generate AI-powered trading cards on Base",
  url: "https://wavestcg.xyz",
  icons: ["https://wavestcg.xyz/public/favicon.ico"],
};

const targetChainId = Number(import.meta.env.VITE_TARGET_CHAIN_ID || 8453);
const chains = targetChainId === 84532 ? [baseSepolia] : [base];

// Create Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: chains,
  ssr: false,
});

// Create AppKit
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: chains,
  metadata,
  features: {
    analytics: true,
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 2,
    },
  },
});

/**
 * 🔄 Wallet session reconnection using wagmi.recentConnectorId
 * Runs once after AppKit is initialized, no UI.
 */
function WalletSessionManager() {
  const { status, isReconnecting } = useAccount();
  const { initialized } = useAppKitState();
  const reconnectAttempted = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!initialized) return;
    if (reconnectAttempted.current) return;

    // Only attempt when fully disconnected and not already reconnecting
    if (status !== "disconnected" || isReconnecting) return;

    const recentId =
      window.localStorage.getItem("wagmi.recentConnectorId") ||
      window.localStorage.getItem("wagmi.recent.ConnectorId");

    if (!recentId) {
      reconnectAttempted.current = true;
      return;
    }

    reconnectAttempted.current = true;

    console.log("🔄 Attempting wagmi reconnect from storage...", { recentId });
    reconnect(wagmiAdapter.wagmiConfig).catch((err) => {
      console.warn("⚠️ Wallet reconnect failed:", err);
    });
  }, [initialized, status, isReconnecting]);

  return null;
}

/**
 * 🛠️ FIX FOR BASE APP / COINBASE WALLET
 * Only attempts auto-connect if we are strictly on a Mobile device inside Coinbase Wallet.
 * This prevents it from breaking Desktop auto-connect.
 */
function AutoConnectBaseApp() {
  const { isConnected, isReconnecting } = useAccount();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    // 1. If connected or currently restoring session, do nothing.
    if (isConnected || isReconnecting) return;

    // 2. Strict Environment Check:
    // Ensure we are in Coinbase Wallet AND on a Mobile device.
    // This prevents the logic from firing on Desktop with the Coinbase Extension installed.
    const isCoinbaseBrowser =
      window.ethereum && window.ethereum.isCoinbaseWallet;
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);

    if (isCoinbaseBrowser && isMobile) {
      console.log(
        "📱 Detected Base App (Mobile) - Attempting auto-connection..."
      );

      const coinbaseConnector = connectors.find(
        (c) => c.id === "coinbaseWalletSDK" || c.name === "Coinbase Wallet"
      );

      if (coinbaseConnector) {
        connect({ connector: coinbaseConnector });
      }
    }
  }, [isConnected, isReconnecting, connect, connectors]);

  return null;
}

// Wrapper component: custom React button + hidden appkit-button trigger
function WalletButtonWrapper() {
  const { isConnected, address } = useAccount();
  const { usdcBalanceFormatted, isBalanceLoading, balanceError } = useWeb3();
  const [mounted, setMounted] = useState(false);
  const hiddenButtonRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Simple hydration guard to avoid SSR/CSR mismatch
  if (!mounted) return <div style={{ height: "40px", width: "150px" }} />;

  const handleClick = () => {
    if (hiddenButtonRef.current) {
      hiddenButtonRef.current.click();
    }
  };

  const shortAddress =
    isConnected && address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : null;

  const balanceLabel = isBalanceLoading
    ? "USDC: ..."
    : balanceError
    ? "USDC: error"
    : `USDC: ${usdcBalanceFormatted}`;

  return (
    <>
      <button
        className={isConnected ? "wallet-connected-btn" : "connect-btn"}
        onClick={handleClick}
      >
        {isConnected && shortAddress ? (
          <>
            <span className="wallet-dot" />
            <span>{shortAddress}</span>
            <span className="wallet-balance">{balanceLabel}</span>
          </>
        ) : (
          "Connect Wallet"
        )}
      </button>
      {/* Hidden AppKit button to trigger the modal and underlying logic */}
      <appkit-button ref={hiddenButtonRef} style={{ display: "none" }} />
    </>
  );
}

function AppContent() {
  const [screen, setScreen] = useState("generator");
  const [generatedCards, setGeneratedCards] = useState([]);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleCardsGenerated = (cards) => {
    setGeneratedCards(cards);
    setScreen("curation");
  };

  const handleBackToGenerator = () => {
    setScreen("generator");
    setGeneratedCards([]);
  };

  const handleShowMyCards = () => {
    setScreen(screen === "mycards" ? "generator" : "mycards");
  };

  return (
    <div className="app">
      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="logo-container">
            <div className="logo-icon">
              <img src={wavesLogo} alt="SURF" />
            </div>
            <div className="logo-rings">
              <div className="ring ring-1" />
              <div className="ring ring-2" />
              <div className="ring ring-3" />
            </div>
          </div>
          <h1 className="hero-title">SURF Waves TCG</h1>
          <p className="hero-subtitle">AI-Powered Trading Cards on Base</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {screen === "generator" && (
          <GeneratorScreen onCardsGenerated={handleCardsGenerated} />
        )}
        {screen === "curation" && (
          <CurationScreen
            cards={generatedCards}
            onBack={handleBackToGenerator}
          />
        )}
        {screen === "mycards" && (
          <MyCardsScreen onBack={handleBackToGenerator} />
        )}
      </main>

      {/* Bottom Bar */}
      <div className="bottom-bar">
        <div className="wallet-container">
          <WalletButtonWrapper />
        </div>
        <div className="bottom-bar-actions">
          <button
            className={`my-cards-btn ${screen === "mycards" ? "active" : ""}`}
            onClick={handleShowMyCards}
            title="My Cards"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <a
            href="https://opensea.io/collection/surf-waves-cards"
            target="_blank"
            rel="noopener noreferrer"
            className="opensea-btn"
            title="View on OpenSea"
          >
            <img src={openseaLogo} alt="OpenSea" />
          </a>
          <button
            className="info-btn"
            onClick={() => setShowInfoModal(true)}
            title="How it works"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}
    </div>
  );
}

function App() {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Web3Provider>
          {/* One-time session restore from wagmi.recentConnectorId */}
          <WalletSessionManager />
          {/* Handles Mobile Base App Auto-Connect */}
          <AutoConnectBaseApp />
          <AppContent />
        </Web3Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
