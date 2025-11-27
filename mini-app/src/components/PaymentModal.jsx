import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useGenerationPayment } from "../hooks/useGenerationPayment";
import "./PaymentModal.css";

function PaymentModal({ onClose, onPaymentSuccess }) {
  const { isConnected } = useAccount();
  const {
    payForGeneration,
    checkActiveSession,
    getPaymentInfo,
    hasSufficientBalance,
    clearError,
    paymentSession,
    usdcBalance,
    status,
    error,
    generationFeeUsdc,
  } = useGenerationPayment();

  const [txHash, setTxHash] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check for existing active session on mount
    const checkSession = async () => {
      const session = await checkActiveSession();
      setChecking(false);

      if (session && session.generationsRemaining > 0) {
        // User already has an active session, close modal and proceed
        onPaymentSuccess(session);
        onClose();
      }
    };

    if (isConnected) {
      checkSession();
    } else {
      setChecking(false);
    }
  }, [isConnected]);

  const handlePayment = async () => {
    try {
      clearError();
      const result = await payForGeneration();
      setTxHash(result.transactionHash);

      // Payment verified - proceed
      onPaymentSuccess({
        id: result.sessionId,
        generationsRemaining: 3,
      });
    } catch (err) {
      console.error("Payment error:", err);
      // Error is handled by the hook, displayed below
    }
  };

  const handleClose = () => {
    clearError();
    onClose();
  };

  const paymentInfo = getPaymentInfo();

  const getStatusMessage = () => {
    switch (status) {
      case "paying":
        return "💰 Sending USDC payment...";
      case "creating_session":
        return "📝 Creating generation session...";
      case "verifying_payment":
        return "🔍 Verifying payment on-chain...";
      case "success":
        return "🎉 Payment verified! Starting generation...";
      case "error":
        return "❌ Payment failed";
      default:
        return null;
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case "paying":
        return "Please confirm the transaction in your wallet";
      case "creating_session":
        return "Recording your payment...";
      case "verifying_payment":
        return "Checking transaction on Base network...";
      case "success":
        return "Your payment has been confirmed on the blockchain";
      default:
        return null;
    }
  };

  const formatUsdcBalance = () => {
    if (!usdcBalance) return "0.00";
    // USDC has 6 decimals
    return (Number(usdcBalance) / 1_000_000).toFixed(2);
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
                Generate your custom Pepe trading card with AI! Your payment
                includes:
              </p>

              <ul className="features-list">
                <li>
                  ✨ <strong>1 initial generation</strong>
                </li>
                <li>
                  🔄 <strong>2 re-rolls</strong> to curate the perfect card
                </li>
                <li>🎨 AI-generated artwork using Google Imagen</li>
                <li>🃏 Unique stats, moves, and flavor text</li>
                <li>⏱️ Session valid for 1 hour</li>
              </ul>
            </div>

            <div className="mint-summary">
              <div className="summary-row">
                <span>Generation package:</span>
                <span className="value">3 attempts</span>
              </div>
              <div className="summary-row">
                <span>Your USDC balance:</span>
                <span className="value">{formatUsdcBalance()} USDC</span>
              </div>
              <div className="summary-row total">
                <span>Total cost:</span>
                <span className="value price">{generationFeeUsdc} USDC</span>
              </div>
            </div>

            {getStatusMessage() && (
              <div className={`status-message ${status}`}>
                <div className="status-title">{getStatusMessage()}</div>
                {getStatusDescription() && (
                  <div className="status-description">
                    {getStatusDescription()}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}

            {txHash && (
              <div className="tx-hash">
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View transaction on BaseScan ↗
                </a>
              </div>
            )}

            <div className="modal-actions">
              {!isConnected ? (
                <ConnectButton />
              ) : !hasSufficientBalance() ? (
                <div className="insufficient-balance">
                  <p>⚠️ Insufficient USDC balance</p>
                  <p className="help-text">
                    You need {generationFeeUsdc} USDC to generate cards. Bridge
                    USDC to Base network to continue.
                  </p>
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
                <>
                  <button
                    className="btn-primary"
                    onClick={handlePayment}
                    disabled={
                      status === "paying" ||
                      status === "creating_session" ||
                      status === "verifying_payment"
                    }
                  >
                    {status === "paying"
                      ? "Confirm in Wallet..."
                      : status === "creating_session"
                      ? "Creating Session..."
                      : status === "verifying_payment"
                      ? "Verifying On-Chain..."
                      : `Pay ${generationFeeUsdc} USDC`}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={handleClose}
                    disabled={
                      status === "paying" ||
                      status === "creating_session" ||
                      status === "verifying_payment"
                    }
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>

            <div className="payment-disclaimer">
              <small>
                💡 Payment is processed on Base L2 network. Transaction fees are
                ~$0.01. Your payment is <strong>verified on-chain</strong>{" "}
                before session activation.
              </small>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentModal;
