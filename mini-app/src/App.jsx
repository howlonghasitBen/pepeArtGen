import { useState } from "react";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base, baseSepolia } from "@reown/appkit/networks";
import { WagmiProvider, http, fallback } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount } from "wagmi";

// Components
import GeneratorScreen from "./components/GeneratorScreen";
import CurationScreen from "./components/CurationScreen";
import MyCardsScreen from "./components/MyCardsScreen";
import InfoModal from "./components/InfoModal";
import wavesLogo from "./images/waves-collection-logo.png";
import openseaLogo from "./images/opensea-logo.svg";
import "./App.css";

// 1. Get Project ID
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error("VITE_WALLETCONNECT_PROJECT_ID is not set");
}

// 2. Configure Networks
export const networks = [base, baseSepolia];

// 3. Set up Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  transports: {
    [base.id]: fallback([
      http("https://base.llamarpc.com"),
      http("https://base.meowrpc.com"),
      http("https://mainnet.base.org"),
    ]),
    [baseSepolia.id]: http("https://sepolia.base.org"),
  },
});

// 4. Create Reown AppKit Modal
createAppKit({
  adapters: [wagmiAdapter],
  networks: networks,
  projectId,
  metadata: {
    name: "wavesTCG Community Creations",
    description: "AI Generated Trading Cards",
    url: "https://wavestcg.com", // Replace with your actual URL
    icons: ["https://avatars.githubusercontent.com/u/179229932"],
  },
});

const queryClient = new QueryClient();

function AppContent() {
  const [screen, setScreen] = useState("generate");
  const [generatedCards, setGeneratedCards] = useState([]);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const { isConnected } = useAccount();

  const handleCardsGenerated = (cards) => {
    setGeneratedCards(cards.filter((card) => !card.error));
    setScreen("curate");
  };

  const showHero = screen === "generate";

  return (
    <div className="app">
      {/* Hero Section */}
      {showHero && (
        <header className="hero-section">
          {/* ... Your existing hero HTML ... */}
          <h1 className="hero-title">wavesTCG Community Creations</h1>
          {/* ... */}
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

      {/* Bottom Fixed Bar with Reown Button */}
      <div className="bottom-bar">
        <div className="wallet-container">
          {/* REPLACE ConnectButton WITH REOWN BUTTON */}
          <appkit-button />
        </div>

        <div className="bottom-bar-actions">
          {/* Your existing bottom buttons */}
          <button
            className={`my-cards-btn ${screen === "mycards" ? "active" : ""}`}
            onClick={() =>
              setScreen(screen === "mycards" ? "generate" : "mycards")
            }
          >
            <svg viewBox="0 0 512 512" fill="currentColor">
              <path d="M0 96C0 60.7 28.7 32 64 32H448c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6h96 32H424c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z" />
            </svg>
          </button>

          {/* ... Opensea and Info buttons ... */}
          <button className="info-btn" onClick={() => setShowInfoModal(true)}>
            <svg viewBox="0 0 512 512" fill="currentColor">
              <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" />
            </svg>
          </button>
        </div>
      </div>

      {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}
    </div>
  );
}

function App() {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
