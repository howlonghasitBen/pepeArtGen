import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbi } from 'viem';
import './ClaimCard.css';

// ClaimVault ABI (minimal)
const CLAIM_VAULT_ABI = parseAbi([
  'function claim() external returns (uint256)',
  'function canClaim(address user) external view returns (bool)',
  'function timeUntilClaim(address user) external view returns (uint256)',
  'function availableCount() external view returns (uint256)',
  'function lastClaim(address) external view returns (uint256)',
]);

// Contract address - UPDATE AFTER DEPLOY
const CLAIM_VAULT_ADDRESS = import.meta.env.VITE_CLAIM_VAULT_ADDRESS || '0x0000000000000000000000000000000000000000';
const OPENSEA_COLLECTION = 'https://opensea.io/collection/surf-waves-cards';

export default function ClaimCard() {
  const { address, isConnected } = useAccount();
  const [countdown, setCountdown] = useState(0);

  // Read: Can claim?
  const { data: canClaim, refetch: refetchCanClaim } = useReadContract({
    address: CLAIM_VAULT_ADDRESS,
    abi: CLAIM_VAULT_ABI,
    functionName: 'canClaim',
    args: [address],
    enabled: !!address && CLAIM_VAULT_ADDRESS !== '0x0000000000000000000000000000000000000000',
  });

  // Read: Time until claim
  const { data: timeUntil, refetch: refetchTimeUntil } = useReadContract({
    address: CLAIM_VAULT_ADDRESS,
    abi: CLAIM_VAULT_ABI,
    functionName: 'timeUntilClaim',
    args: [address],
    enabled: !!address && CLAIM_VAULT_ADDRESS !== '0x0000000000000000000000000000000000000000',
  });

  // Read: Available count
  const { data: availableCount, refetch: refetchAvailable } = useReadContract({
    address: CLAIM_VAULT_ADDRESS,
    abi: CLAIM_VAULT_ABI,
    functionName: 'availableCount',
    enabled: CLAIM_VAULT_ADDRESS !== '0x0000000000000000000000000000000000000000',
  });

  // Write: Claim
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  // Wait for tx
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Countdown timer
  useEffect(() => {
    if (timeUntil && timeUntil > 0n) {
      setCountdown(Number(timeUntil));
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            refetchCanClaim();
            refetchTimeUntil();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeUntil, refetchCanClaim, refetchTimeUntil]);

  // Refetch after successful claim
  useEffect(() => {
    if (isSuccess) {
      refetchCanClaim();
      refetchTimeUntil();
      refetchAvailable();
    }
  }, [isSuccess, refetchCanClaim, refetchTimeUntil, refetchAvailable]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleClaim = () => {
    writeContract({
      address: CLAIM_VAULT_ADDRESS,
      abi: CLAIM_VAULT_ABI,
      functionName: 'claim',
    });
  };

  // Not deployed yet
  if (CLAIM_VAULT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="claim-card-section">
        <h2>🎴 Free Card Claims</h2>
        <p className="claim-description">Coming soon! Claim a free SURF Waves Card every 2 hours.</p>
        <a href={OPENSEA_COLLECTION} target="_blank" rel="noopener noreferrer" className="opensea-link">
          View Collection on OpenSea →
        </a>
      </div>
    );
  }

  return (
    <div className="claim-card-section">
      <h2>🎴 Free Card Claims</h2>
      <p className="claim-description">
        Claim a random SURF Waves Card NFT for free! One claim per wallet every 2 hours.
      </p>

      <div className="claim-stats">
        <div className="stat">
          <span className="stat-value">{availableCount?.toString() || '...'}</span>
          <span className="stat-label">Cards Available</span>
        </div>
        <div className="stat">
          <span className="stat-value">2h</span>
          <span className="stat-label">Cooldown</span>
        </div>
      </div>

      {!isConnected ? (
        <p className="connect-prompt">Connect wallet to claim</p>
      ) : isSuccess ? (
        <div className="claim-success">
          <p>🎉 Card claimed successfully!</p>
          <a 
            href={`https://basescan.org/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="tx-link"
          >
            View transaction →
          </a>
          <a href={OPENSEA_COLLECTION} target="_blank" rel="noopener noreferrer" className="opensea-link">
            View on OpenSea →
          </a>
        </div>
      ) : canClaim ? (
        <button 
          className="claim-button"
          onClick={handleClaim}
          disabled={isPending || isConfirming}
        >
          {isPending ? 'Confirm in wallet...' : isConfirming ? 'Claiming...' : '🎴 Claim Free Card'}
        </button>
      ) : (
        <div className="cooldown-display">
          <p>⏳ Cooldown: {formatTime(countdown)}</p>
          <p className="cooldown-hint">Come back later for another free card!</p>
        </div>
      )}

      {error && (
        <p className="claim-error">
          {error.shortMessage || error.message}
        </p>
      )}

      <a href={OPENSEA_COLLECTION} target="_blank" rel="noopener noreferrer" className="opensea-link">
        View Collection on OpenSea →
      </a>
    </div>
  );
}
