import { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { useGenerationPayment } from "../hooks/useGenerationPayment";
import "./PaymentModal.css";

function PaymentModal({ onClose, onPaymentSuccess }) {
  const {
    address,
    isConnected,
    isCorrectChain,
    usdcBalanceFormatted,
    isBalanceLoading,
    balanceError,
    refetchUsdcBalance,
    // Removed isLoadingSession from destructuring as we won't use it for UI blocking
    switchToCorrectChain,
    isSwitchingChain,
    config,
  } = useWeb3();

  const {
    payForGeneration,
    retryVerification,
    checkActiveSession,
    hasSufficientBalance,
    clearError,
    status,
    error,
    txHash,
    generationFeeUsdc,
  } = useGenerationPayment();

  const [checking, setChecking] = useState(true);

  // Check for existing session on mount with timeout and cleanup
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      if (isConnected) {
        try {
          // Race the session check against a 5-second timeout
          // This prevents infinite loading on bad mobile connections
          const sessionPromise = checkActiveSession();
          const timeoutPromise = new Promise((resolve) =>
            setTimeout(() => resolve(null), 5000)
          );

          const session = await Promise.race([sessionPromise, timeoutPromise]);

          if (mounted && session && session.generationsRemaining > 0) {
            onPaymentSuccess(session);
            onClose();
            return;
          }
        } catch (err) {
          console.warn("Session check failed or timed out:", err);
        }
      }

      if (mounted) {
        setChecking(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, [isConnected, checkActiveSession, onPaymentSuccess, onClose]);

  const handlePayment = async () => {
    try {
      clearError();
      const result = await payForGeneration();
      onPaymentSuccess({
        id: result.sessionId,
        generationsRemaining: result.generationsRemaining || 3,
      });
    } catch (err) {
      // Error is handled in the hook and displayed in UI
      console.error("Payment failed:", err);
    }
  };

  const handleRetryVerification = async () => {
    if (!txHash) return;
    try {
      const result = await retryVerification(txHash);
      onPaymentSuccess({
        id: result.sessionId,
        generationsRemaining: result.generationsRemaining,
      });
    } catch (err) {
      console.error("Retry verification failed:", err);
    }
  };

  const handleClose = () => {
    clearError();
    onClose();
  };

  const handleSwitchNetwork = async () => {
    await switchToCorrectChain();
  };

  const handleRefreshBalance = async () => {
    await refetchUsdcBalance();
  };

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getStatusMessage = () => {
    switch (status) {
      case "paying":
        return {
          icon: "[$]",
          text: "Confirm in your wallet...",
          subtext: "Sending USDC payment",
        };
      case "creating_session":
        return {
          icon: "[+]",
          text: "Creating session...",
          subtext: "Registering payment",
        };
      case "verifying_payment":
        return {
          icon: "[?]",
          text: "Verifying on-chain...",
          subtext: "This may take 30-60 seconds",
        };
      case "success":
        return {
          icon: "[OK]",
          text: "Payment verified!",
          subtext: "Ready to generate",
        };
      case "error":
        return { icon: "[X]", text: "Payment failed", subtext: null };
      default:
        return null;
    }
  };

  const statusInfo = getStatusMessage();
  const isProcessing =
    status !== "idle" && status !== "error" && status !== "success";
  const canPay =
    isConnected && isCorrectChain && hasSufficientBalance() && !isProcessing;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content payment-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={handleClose}
          disabled={isProcessing}
        >
          x
        </button>

        <h2>Pay for Card Generation</h2>

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
                  [*] <strong>1 initial generation</strong>
                </li>
                <li>
                  [~] <strong>2 re-rolls</strong> to curate the perfect card
                </li>
                <li>[#] AI-generated artwork using Google Imagen</li>
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
                  {isBalanceLoading
                    ? "Loading..."
                    : balanceError
                    ? "Error"
                    : `${usdcBalanceFormatted} USDC`}
                  <button
                    onClick={handleRefreshBalance}
                    disabled={isBalanceLoading}
                    style={{
                      marginLeft: "8px",
                      cursor: isBalanceLoading ? "wait" : "pointer",
                      border: "none",
                      background: "none",
                      opacity: isBalanceLoading ? 0.5 : 1,
                    }}
                    title="Refresh balance"
                  >
                    [R]
                  </button>
                </span>
              </div>
              <div className="summary-row total">
                <span>Total cost:</span>
                <span className="value price">{generationFeeUsdc} USDC</span>
              </div>
            </div>

            {statusInfo && (
              <div className={`status-message ${status}`}>
                <div className="status-title">
                  {statusInfo.icon} {statusInfo.text}
                </div>
                {statusInfo.subtext && (
                  <div className="status-description">{statusInfo.subtext}</div>
                )}
              </div>
            )}

            {txHash && (
              <div className="tx-hash">
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View transaction on BaseScan [^]
                </a>
              </div>
            )}

            {isConnected && !isCorrectChain && (
              <div className="error-message">
                <strong>[!] Wrong Network</strong>
                <p>Please switch to Base (Chain ID: {config.targetChainId})</p>
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
              ) : !isCorrectChain ? (
                <button
                  className="btn-primary"
                  onClick={handleSwitchNetwork}
                  disabled={isSwitchingChain}
                >
                  {isSwitchingChain ? "Switching..." : "Switch to Base Network"}
                </button>
              ) : !hasSufficientBalance() ? (
                <div className="insufficient-balance">
                  <p>[!] Insufficient USDC balance</p>
                  <p className="help-text">
                    You need {generationFeeUsdc} USDC. Current balance:{" "}
                    {usdcBalanceFormatted} USDC
                  </p>
                  <a
                    href="https://bridge.base.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bridge-link"
                  >
                    Bridge to Base [^]
                  </a>
                </div>
              ) : status === "error" && txHash ? (
                <button
                  className="btn-primary"
                  onClick={handleRetryVerification}
                >
                  Retry Verification
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={handlePayment}
                  disabled={!canPay}
                >
                  {status === "paying"
                    ? "Confirm in Wallet..."
                    : status === "creating_session"
                    ? "Creating Session..."
                    : status === "verifying_payment"
                    ? "Verifying Payment..."
                    : `Pay ${generationFeeUsdc} USDC`}
                </button>
              )}

              {status === "error" && !txHash && (
                <button className="btn-secondary" onClick={clearError}>
                  Try Again
                </button>
              )}
            </div>

            <div className="payment-disclaimer">
              <small>
                Payment is sent directly to the treasury. Session is valid for 1
                hour.
                <br />
                <strong>Network:</strong> Base L2
              </small>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentModal;
