import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import PaymentModal from "./PaymentModal";
import { useGenerationPayment } from "../hooks/useGenerationPayment";
import "./GeneratorScreen.css";

function GeneratorScreen({ onCardsGenerated }) {
  const [monsterName, setMonsterName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSession, setPaymentSession] = useState(null);
  const [rerollsUsed, setRerollsUsed] = useState(0);

  const { isConnected, address } = useAccount();
  const { checkActiveSession } = useGenerationPayment();

  // Check for active session on mount and when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      loadActiveSession();
    } else {
      setPaymentSession(null);
    }
  }, [isConnected, address]);

  const loadActiveSession = async () => {
    const session = await checkActiveSession();
    if (session && session.generationsRemaining > 0) {
      setPaymentSession(session);
      // Calculate re-rolls used (3 - remaining)
      const used = 3 - session.generationsRemaining;
      setRerollsUsed(used);
    }
  };

  const handlePaymentSuccess = (session) => {
    setPaymentSession(session);
    setRerollsUsed(0);
    setShowPaymentModal(false);
  };

  const handleGenerate = async (isReroll = false) => {
    setError("");
    setLoading(true);

    try {
      if (!monsterName.trim()) {
        setError("Please enter a monster name");
        setLoading(false);
        return;
      }

      // Check if user needs to pay first
      if (!paymentSession || paymentSession.generationsRemaining <= 0) {
        setShowPaymentModal(true);
        setLoading(false);
        return;
      }

      const monsterNames = [monsterName.trim()];

      // Call API to generate card with Imagen
      const response = await fetch("http://localhost:3001/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monsterNames,
          sessionId: paymentSession.id,
          walletAddress: address,
        }),
      });

      if (!response.ok) {
        const data = await response.json();

        // Handle specific errors
        if (data.error === "No generations remaining") {
          setError("No generations remaining. Please make a new payment.");
          setPaymentSession(null);
          setLoading(false);
          return;
        }

        throw new Error(data.error || "Generation failed");
      }

      const data = await response.json();

      if (data.success && data.cards.length > 0) {
        // Increment re-rolls used if this is a re-roll
        if (isReroll) {
          setRerollsUsed((prev) => prev + 1);
        }

        // Update session generations remaining
        setPaymentSession((prev) => ({
          ...prev,
          generationsRemaining: prev.generationsRemaining - 1,
        }));

        onCardsGenerated(data.cards);
      } else {
        setError("Generation failed");
      }
    } catch (err) {
      setError(err.message);
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

  const rerollsRemaining = paymentSession
    ? paymentSession.generationsRemaining - 1
    : 0;
  const canReroll = rerollsRemaining > 0;
  const hasActiveSession =
    paymentSession && paymentSession.generationsRemaining > 0;

  return (
    <div className="generator-screen">
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      <div className="session-status">
        {hasActiveSession ? (
          <div className="active-session">
            <span className="session-badge">✓ Active Session</span>
            <span className="generations-info">
              {paymentSession.generationsRemaining} generation
              {paymentSession.generationsRemaining !== 1 ? "s" : ""} remaining
            </span>
          </div>
        ) : (
          <div className="no-session">
            <span className="session-badge warning">⚠️ No Active Session</span>
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
            e.key === "Enter" && !loading && handleGenerate(false)
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

      <button
        className="generate-btn"
        onClick={() => handleGenerate(false)}
        disabled={loading || !isConnected}
      >
        {loading
          ? "Generating..."
          : !isConnected
          ? "Connect Wallet to Generate"
          : "🎨 Generate Card"}
      </button>

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
    </div>
  );
}

export default GeneratorScreen;
