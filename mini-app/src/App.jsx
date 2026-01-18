import { useState, useEffect, useRef } from "react";
import { WagmiProvider, useAccount, useConnect } from "wagmi";
import { reconnect } from "@wagmi/core";
import { base, baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit, useAppKitState } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sdk } from "@farcaster/miniapp-sdk";

// Import the Web3Provider and hook for USDC balance
import { Web3Provider, useWeb3 } from "./context/Web3Context";

// Images
import wavesLogo from "./public/waves-collection-logo.png";
import openseaLogo from "./public/opensea-logo.svg";

// Components
import GeneratorScreen from "./components/GeneratorScreen";
import CurationScreen from "./components/CurationScreen";
import InfoModal from "./components/InfoModal";
import CardEditorScreen from "./components/editor/CardEditorScreen";
import DeckBuilder from "./components/deck/DeckBuilder";
import SurfShackShop from "./components/shop/SurfShackShop";
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
  const [cardToEdit, setCardToEdit] = useState(null);
  const [expandedMenu, setExpandedMenu] = useState(null); // 'editor' | 'deckbuilder' | null

  // Send ready message to Base app using official Farcaster SDK
  useEffect(() => {
    const initMiniApp = async () => {
      try {
        console.log('📤 Signaling app ready to Base/Farcaster host');
        await sdk.actions.ready();
        console.log('✅ Mini app ready signal sent successfully');
      } catch (error) {
        console.error('❌ Failed to send ready signal:', error);
      }
    };

    initMiniApp();
  }, []);

  const handleCardsGenerated = (cards) => {
    setGeneratedCards(cards);
    setScreen("curation");
  };

  const handleBackToGenerator = () => {
    setScreen("generator");
    setGeneratedCards([]);
    setCardToEdit(null);
  };

  const handleOpenEditor = (card = null) => {
    setCardToEdit(card);
    setScreen("editor");
    setExpandedMenu(null);
  };

  const handleOpenDeckBuilder = () => {
    setScreen("deckbuilder");
    setExpandedMenu(null);
  };

  const handleOpenShop = () => {
    setScreen("shop");
    setExpandedMenu(null);
  };

  const handleEditorSave = (card) => {
    // Card saved, return to generator
    setCardToEdit(null);
    setScreen("generator");
  };

  const toggleMenu = (menu) => {
    setExpandedMenu(expandedMenu === menu ? null : menu);
  };

  const handleCloseFullscreen = () => {
    setScreen("generator");
    setCardToEdit(null);
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
            onEditCard={handleOpenEditor}
          />
        )}
      </main>

      {/* Fullscreen Editor Overlay */}
      {screen === "editor" && (
        <div className="fullscreen-overlay">
          <CardEditorScreen
            initialCard={cardToEdit}
            onSave={handleEditorSave}
            onBack={handleCloseFullscreen}
          />
        </div>
      )}

      {/* Fullscreen Deck Builder Overlay */}
      {screen === "deckbuilder" && (
        <div className="fullscreen-overlay">
          <DeckBuilder onBack={handleCloseFullscreen} />
        </div>
      )}

      {/* 3D Surf Shack Shop */}
      {screen === "shop" && (
        <SurfShackShop onBack={handleCloseFullscreen} />
      )}

      {/* Collapsible Menus */}
      <div className={`collapsible-menus ${expandedMenu ? 'has-expanded' : ''}`}>
        {/* Editor Menu */}
        <div className={`collapsible-menu ${expandedMenu === 'editor' ? 'expanded' : ''}`}>
          <div className="menu-content">
            <button className="menu-item" onClick={() => handleOpenEditor()}>
              <span className="menu-icon">[+]</span>
              <span>New Card</span>
            </button>
            <button className="menu-item" onClick={() => handleOpenEditor()}>
              <span className="menu-icon">[=]</span>
              <span>Open Drafts</span>
            </button>
            <button className="menu-item" onClick={() => handleOpenEditor()}>
              <span className="menu-icon">[v]</span>
              <span>Import Card</span>
            </button>
          </div>
        </div>

        {/* Deck Builder Menu */}
        <div className={`collapsible-menu ${expandedMenu === 'deckbuilder' ? 'expanded' : ''}`}>
          <div className="menu-content">
            <button className="menu-item" onClick={handleOpenDeckBuilder}>
              <span className="menu-icon">[#]</span>
              <span>My Decks</span>
            </button>
            <button className="menu-item" onClick={handleOpenDeckBuilder}>
              <span className="menu-icon">[+]</span>
              <span>New Deck</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={`bottom-bar ${screen === 'editor' || screen === 'deckbuilder' || screen === 'shop' ? 'hidden' : ''}`}>
        <div className="wallet-container">
          <WalletButtonWrapper />
        </div>
        <div className="bottom-bar-actions">
          <button
            className="nav-btn shop-btn"
            onClick={handleOpenShop}
            title="3D Card Shop"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </button>
          <button
            className={`nav-btn ${screen === "editor" || expandedMenu === 'editor' ? "active" : ""}`}
            onClick={() => toggleMenu('editor')}
            title="Card Editor"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            className={`nav-btn ${screen === "deckbuilder" || expandedMenu === 'deckbuilder' ? "active" : ""}`}
            onClick={() => toggleMenu('deckbuilder')}
            title="Deck Builder"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 3h4a2 2 0 0 1 2 2v2H2V5a2 2 0 0 1 2-2h4" />
              <path d="M12 3v4" />
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
