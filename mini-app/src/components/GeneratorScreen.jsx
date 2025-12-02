import { useState, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";
import PaymentModal from "./PaymentModal";
import MintedCardsCarousel from "./MintedCardsCarousel";
import { useAllCards } from "../hooks/useAllCards";
import "./GeneratorScreen.css";

function GeneratorScreen({ onCardsGenerated }) {
  const [monsterName, setMonsterName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const {
    address,
    isConnected,
    hasActiveSession,
    paymentSession,
    useGeneration,
    config,
  } = useWeb3();

  const { cards: allMintedCards } = useAllCards();

  // FIX: Wrap handlers in useCallback to prevent infinite useEffect loops in PaymentModal
  const handlePaymentSuccess = useCallback((session) => {
    // Session is now managed by Web3Context, just close modal
    setShowPaymentModal(false);
  }, []);

  const handlePaymentModalClose = useCallback(() => {
    setShowPaymentModal(false);
  }, []);

  const handleGenerate = async (isReroll = false) => {
    setError("");

    if (!monsterName.trim()) {
      setError("Please enter a monster name");
      return;
    }

    // Check if user needs to pay first
    if (!hasActiveSession) {
      setShowPaymentModal(true);
      return;
    }

    setLoading(true);

    try {
      const monsterNames = [monsterName.trim()];

      // Call API to generate card with Imagen
      const response = await fetch(`${config.apiBaseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monsterNames,
          sessionId: paymentSession?.id,
          walletAddress: address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific errors
        if (data.error === "No generations remaining") {
          setError("No generations remaining. Please make a new payment.");
          return;
        }
        throw new Error(data.error || data.message || "Generation failed");
      }

      if (data.success && data.cards.length > 0) {
        // Update local session state (decrement generations)
        useGeneration();
        onCardsGenerated(data.cards);
      } else {
        setError("Generation failed - no cards returned");
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(err.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReroll = () => {
    handleGenerate(true);
  };

  const exampleMonsters = [
    "Shadow Dragon",
    "Crystal Golem",
    "Void Reaper",
    "Lightning Phoenix",
    "Frost Giant",
  ];

  const handleExampleClick = (name) => {
    setMonsterName(name);
  };

  const generationsRemaining = paymentSession?.generationsRemaining ?? 0;
  const rerollsRemaining = Math.max(0, generationsRemaining - 1);
  const canReroll = rerollsRemaining > 0;

  return (
    <div className="generator-screen">
      {showPaymentModal && (
        <PaymentModal
          onClose={handlePaymentModalClose}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      <div className="session-status">
        {hasActiveSession ? (
          <div className="active-session">
            <span className="session-badge">✓ Active Session</span>
            <span className="generations-info">
              {generationsRemaining} generation
              {generationsRemaining !== 1 ? "s" : ""} remaining
            </span>
          </div>
        ) : (
          <div className="no-session">
            <span className="session-badge warning">
              No Active Gemini Imagen Session
            </span>
            <span className="generations-info">Pay $2.50 USDC to start</span>
          </div>
        )}
      </div>

      <div className="input-section">
        <label htmlFor="monsterName">Monster Name</label>
        <input
          id="monsterName"
          type="text"
          placeholder="Enter monster name..."
          value={monsterName}
          onChange={(e) => setMonsterName(e.target.value)}
          onKeyPress={(e) =>
            e.key === "Enter" &&
            !loading &&
            isConnected &&
            handleGenerate(false)
          }
          disabled={loading}
          className="monster-input"
        />

        <div className="examples">
          <p className="examples-label">Try these:</p>
          <div className="example-chips">
            {exampleMonsters.map((name) => (
              <button
                key={name}
                className="example-chip"
                onClick={() => handleExampleClick(name)}
                disabled={loading}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      {loading && (
        <div className="loading-container">
          <div className="spinner" />
          <p className="loading-text">Generating card...</p>
          <p className="loading-subtext">
            AI is creating your unique Pepe card...
          </p>
        </div>
      )}

      {!isConnected ? (
        <div className="connect-wallet-container">
          <appkit-button label="Connect Wallet to Generate" balance="hide" />
        </div>
      ) : (
        <button
          className="generate-btn"
          onClick={() => handleGenerate(false)}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Card"}
        </button>
      )}

      {hasActiveSession && rerollsRemaining > 0 && (
        <div className="reroll-info">
          <p>Not happy with your card?</p>
          <button
            className="reroll-btn"
            onClick={handleReroll}
            disabled={loading || !canReroll}
          >
            🔄 Re-roll ({rerollsRemaining} remaining)
          </button>
        </div>
      )}

      {allMintedCards && allMintedCards.length > 0 && (
        <MintedCardsCarousel cards={allMintedCards} />
      )}
    </div>
  );
}

export default GeneratorScreen;
