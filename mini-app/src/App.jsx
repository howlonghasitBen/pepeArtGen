import { useState, useEffect } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
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
import InfoModal from "./components/InfoModal";
import "./App.css";

// Get WalletConnect Project ID from env (optional for now)
const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo-project-id";

// Configure Wagmi with RainbowKit (wallet connection optional)
const config = getDefaultConfig({
  appName: "wavesTCG Community Creations",
  projectId,
  chains: [base, baseSepolia],
  ssr: false,
});

const queryClient = new QueryClient();

function AppContent() {
  const [screen, setScreen] = useState("generate"); // 'generate' or 'curate'
  const [generatedCards, setGeneratedCards] = useState([]);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleCardsGenerated = (cards) => {
    setGeneratedCards(cards.filter((card) => !card.error));
    setScreen("curate");
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>wavesTCG Community Creations</h1>
        <p className="subtitle">
          AI-generated trading cards. Near zero minting on Base L2.
        </p>

        <div className="header-actions">
          <button
            className="info-button"
            onClick={() => setShowInfoModal(true)}
          >
            How It Works
          </button>
          <div className="wallet-connect-wrapper">
            <ConnectButton />
          </div>
        </div>
      </header>

      {screen === "generate" ? (
        <GeneratorScreen onCardsGenerated={handleCardsGenerated} />
      ) : (
        <CurationScreen
          cards={generatedCards}
          onBack={() => setScreen("generate")}
        />
      )}

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
