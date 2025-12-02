import { useState, useEffect } from "react";
import { WagmiProvider, useAccount } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// Import the Web3Provider
import { Web3Provider } from "./context/Web3Context";

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
  url: "https://surf.works",
  icons: ["https://surf.works/logo.png"],
};

// Determine which chain to use based on environment
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

// Query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 2,
    },
  },
});

// Wrapper component to handle button hydration
function WalletButtonWrapper() {
  const { isReconnecting, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Don't render server-side (hydration fix)
  if (!mounted) return <div style={{ height: "40px", width: "150px" }} />;

  // 2. Don't render while Wagmi is checking for existing sessions (prevents "Connect" flash)
  if (isReconnecting) {
    return (
      <button
        className="connect-btn"
        disabled
        style={{ opacity: 0.7, cursor: "wait" }}
      >
        Loading...
      </button>
    );
  }

  // 3. Once stable, render the standard AppKit button
  // We do NOT use a dynamic 'key' here, so connection flow on mobile remains stable
  return <appkit-button balance="show" />;
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
          {/* Use the wrapper to handle hydration logic safely */}
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
        {/* Web3Provider wraps all components that need Web3 state */}
        <Web3Provider>
          <AppContent />
        </Web3Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
