import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useGenerationPayment } from "../hooks/useGenerationPayment";
import "./PaymentModal.css";

function PaymentModal({ onClose, onPaymentSuccess }) {
  const { isConnected, address } = useAccount();
  const {
    payForGeneration,
    checkActiveSession,
    hasSufficientBalance,
    isCorrectChain,
    clearError,
    refetchBalance,
    fetchBalanceManually,
    usdcBalance,
    manualBalance,
    status,
    error,
    isBalanceLoading,
    balanceError,
    chainId,
    expectedChainId,
    generationFeeUsdc,
  } = useGenerationPayment();

  const [txHash, setTxHash] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      if (isConnected) {
        const session = await checkActiveSession();
        if (session && session.generationsRemaining > 0) {
          onPaymentSuccess(session);
          onClose();
        }
      }
      setChecking(false);
    };
    checkSession();
  }, [isConnected]);

  const handlePayment = async () => {
    try {
      clearError();
      const result = await payForGeneration();
      setTxHash(result.transactionHash);
      onPaymentSuccess({
        id: result.sessionId,
        generationsRemaining: 3,
      });
    } catch (err) {
      // Error handled in hook/UI
    }
  };

  const handleClose = () => {
    clearError();
    onClose();
  };

  const formatUsdcBalance = () => {
    if (isBalanceLoading && !manualBalance) return "Loading...";
    if (balanceError && !manualBalance) return "Error";

    const effectiveBalance = usdcBalance ?? manualBalance;

    if (effectiveBalance === undefined || effectiveBalance === null)
      return "0.00";

    // Convert BigInt to string safely
    return (Number(effectiveBalance) / 1_000_000).toFixed(2);
  };

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleRefreshBalance = async () => {
    await refetchBalance();
    await fetchBalanceManually();
  };

  const getStatusMessage = () => {
    switch (status) {
      case "paying":
        return "💰 Sending USDC payment...";
      case "creating_session":
        return "📝 Creating generation session...";
      case "verifying_payment":
        return "🔍 Verifying payment on-chain...";
      case "success":
        return "🎉 Payment verified!";
      case "error":
        return "❌ Payment failed";
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content payment-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={handleClose}>
          ✕
        </button>

        <h2>💰 Pay for Card Generation</h2>

        {checking ? (
          <div className="checking-session">
            <div className="spinner"></div>
            <p>Checking for active session...</p>
          </div>
        ) : (
          <>
            <div className="payment-info">
              <p className="info-text">
                Generate your custom Pepe trading card with AI!
              </p>
              <ul className="features-list">
                <li>
                  ✨ <strong>1 initial generation</strong>
                </li>
                <li>
                  🔄 <strong>2 re-rolls</strong> to curate the perfect card
                </li>
                <li>🎨 AI-generated artwork using Google Imagen</li>
              </ul>
            </div>

            <div className="mint-summary">
              <div className="summary-row">
                <span>Wallet:</span>
                <span className="value" style={{ fontFamily: "monospace" }}>
                  {formatAddress(address)}
                </span>
              </div>
              <div className="summary-row">
                <span>Your USDC balance:</span>
                <span className="value">
                  {formatUsdcBalance()} USDC
                  <button
                    onClick={handleRefreshBalance}
                    style={{
                      marginLeft: "8px",
                      cursor: "pointer",
                      border: "none",
                      background: "none",
                    }}
                    title="Refresh balance"
                  >
                    🔄
                  </button>
                </span>
              </div>
              <div className="summary-row total">
                <span>Total cost:</span>
                <span className="value price">{generationFeeUsdc} USDC</span>
              </div>
            </div>

            {getStatusMessage() && (
              <div className={`status-message ${status}`}>
                <div className="status-title">{getStatusMessage()}</div>
              </div>
            )}

            {isConnected && !isCorrectChain() && (
              <div className="error-message">
                <strong>⚠️ Wrong Network</strong>
                <p>Please switch to Base (Chain ID: {expectedChainId})</p>
              </div>
            )}

            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="modal-actions">
              {!isConnected ? (
                <appkit-button />
              ) : !isCorrectChain() ? (
                <button className="btn-secondary" disabled>
                  Switch Network in Wallet
                </button>
              ) : !hasSufficientBalance() ? (
                <div className="insufficient-balance">
                  <p>⚠️ Insufficient USDC balance</p>
                  <a
                    href="https://bridge.base.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bridge-link"
                  >
                    Bridge to Base ↗
                  </a>
                </div>
              ) : (
                <button
                  className="btn-primary"
                  onClick={handlePayment}
                  disabled={status !== "idle" && status !== "error"}
                >
                  {status === "paying"
                    ? "Confirm in Wallet..."
                    : status === "creating_session"
                    ? "Creating Session..."
                    : status === "verifying_payment"
                    ? "Verifying..."
                    : `Pay ${generationFeeUsdc} USDC`}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentModal;
