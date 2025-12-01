import { useState, useEffect } from "react";
import { WagmiProvider, createConfig, http, fallback } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  getDefaultConfig,
  ConnectButton,
} from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";

import GeneratorScreen from "./components/GeneratorScreen";
import CurationScreen from "./components/CurationScreen";
import MyCardsScreen from "./components/MyCardsScreen";
import InfoModal from "./components/InfoModal";
import wavesLogo from "./images/waves-collection-logo.png";
import openseaLogo from "./images/opensea-logo.svg";
import "./App.css";

// Get WalletConnect Project ID from env
// IMPORTANT: A valid project ID is REQUIRED for WalletConnect to function!
// Get a free project ID from: https://cloud.walletconnect.com/
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

// Warn if project ID is missing or using demo value
if (!projectId) {
  console.error(
    "❌ CRITICAL: VITE_WALLETCONNECT_PROJECT_ID is not set!\n" +
    "WalletConnect will NOT function without a valid project ID.\n" +
    "Get a free project ID from: https://cloud.walletconnect.com/\n" +
    "Add it to your .env file as: VITE_WALLETCONNECT_PROJECT_ID=your_project_id"
  );
}

// Configure multiple RPC endpoints with fallback for reliability
// Base public RPCs can be unreliable, so we use multiple providers
const baseTransport = fallback([
  http("https://base.llamarpc.com"),
  http("https://base.meowrpc.com"),
  http("https://base-rpc.publicnode.com"),
  http("https://mainnet.base.org"),
  http("https://base.gateway.tenderly.co"),
]);

const baseSepoliaTransport = fallback([
  http("https://base-sepolia-rpc.publicnode.com"),
  http("https://sepolia.base.org"),
  http("https://base-sepolia.gateway.tenderly.co"),
]);

// Configure Wagmi with custom transports for better reliability
// Note: projectId is required for WalletConnect functionality
const config = getDefaultConfig({
  appName: "wavesTCG Community Creations",
  projectId: projectId || "INVALID_PROJECT_ID", // Fallback to prevent crashes, but won't work
  chains: [base, baseSepolia],
  transports: {
    [base.id]: baseTransport,
    [baseSepolia.id]: baseSepoliaTransport,
  },
  ssr: false,
});

const queryClient = new QueryClient();

function AppContent() {
  const [screen, setScreen] = useState("generate"); // 'generate', 'curate', or 'mycards'
  const [generatedCards, setGeneratedCards] = useState([]);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const { isConnected } = useAccount();

  const handleCardsGenerated = (cards) => {
    setGeneratedCards(cards.filter((card) => !card.error));
    setScreen("curate");
  };

  // Show hero only on generate screen
  const showHero = screen === "generate";

  return (
    <div className="app">
      {/* WalletConnect Configuration Warning */}
      {!projectId && (
        <div style={{
          background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)",
          color: "white",
          padding: "12px 20px",
          textAlign: "center",
          fontWeight: "600",
          fontSize: "14px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          zIndex: 1000,
          position: "relative"
        }}>
          ⚠️ WalletConnect Not Configured: Set VITE_WALLETCONNECT_PROJECT_ID in .env file
        </div>
      )}

      {/* Hero Section - only on generate screen */}
      {showHero && (
        <header className="hero-section">
          <div className="hero-glow"></div>
          <div className="hero-content">
            <div className="logo-container">
              <span className="logo-icon">
                <img
                  src={wavesLogo}
                  alt="two surfboard crossed above intersecting waves. blue and orange sunset."
                />
              </span>
              <div className="logo-rings">
                <div className="ring ring-1"></div>
                <div className="ring ring-2"></div>
                <div className="ring ring-3"></div>
              </div>
            </div>
            <h1 className="hero-title">wavesTCG Community Creations</h1>
            <p className="hero-subtitle">AI-generated trading cards on Base</p>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="stat-value">~$0.01</span>
                <span className="stat-label">gas to mint</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="stat-value">FREE</span>
                <span className="stat-label">minting</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="stat-value">Base L2</span>
                <span className="stat-label">network</span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="main-content">
        {screen === "generate" && (
          <GeneratorScreen onCardsGenerated={handleCardsGenerated} />
        )}
        {screen === "curate" && (
          <CurationScreen
            cards={generatedCards}
            onBack={() => setScreen("generate")}
          />
        )}
        {screen === "mycards" && (
          <MyCardsScreen onBack={() => setScreen("generate")} />
        )}
      </main>

      {/* Bottom Fixed Bar */}
      <div className="bottom-bar">
        <div className="wallet-container">
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus={{
              smallScreen: "avatar",
              largeScreen: "full",
            }}
          />
        </div>

        <div className="bottom-bar-actions">
          {/* My Cards Button */}
          <button
            className={`my-cards-btn ${screen === "mycards" ? "active" : ""}`}
            onClick={() =>
              setScreen(screen === "mycards" ? "generate" : "mycards")
            }
            aria-label="My Cards"
          >
            <svg viewBox="0 0 512 512" fill="currentColor">
              <path d="M0 96C0 60.7 28.7 32 64 32H448c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6h96 32H424c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z" />
            </svg>
          </button>

          {/* OpenSea Collection Link */}
          <a
            href="https://opensea.io/collection/surf-waves-cards"
            target="_blank"
            rel="noopener noreferrer"
            className="opensea-btn"
            aria-label="View on OpenSea"
          >
            <img
              src={openseaLogo}
              alt="opensea ship logo"
              viewBox="0 0 90 90"
            ></img>
          </a>

          {/* Info Button */}
          <button
            className="info-btn"
            onClick={() => setShowInfoModal(true)}
            aria-label="How it works"
          >
            <svg viewBox="0 0 512 512" fill="currentColor">
              <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" />
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
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AppContent />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
