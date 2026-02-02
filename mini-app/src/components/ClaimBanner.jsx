import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import './ClaimBanner.css';

// ClaimVault contract - UPDATE AFTER DEPLOYMENT
const CLAIM_VAULT_ADDRESS = import.meta.env.VITE_CLAIM_VAULT_ADDRESS || '0x0000000000000000000000000000000000000000';
const NFT_CONTRACT = '0xcc2d6ba8564541e6e51fe5522e26d4f4bbdd458b';
const SKILL_INSTALL_URL = 'https://raw.githubusercontent.com/howlonghasitBen/pepeArtGen/main/skills/waves-claim/install.sh';

const CLAIM_VAULT_ABI = [
  { name: 'claim', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'nonpayable' },
  { name: 'canClaim', type: 'function', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  { name: 'timeUntilClaim', type: 'function', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'availableCount', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
];

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function ClaimBanner() {
  const { address, isConnected } = useAccount();
  const [countdown, setCountdown] = useState(0);
  const [showBotInfo, setShowBotInfo] = useState(false);

  const isVaultActive = CLAIM_VAULT_ADDRESS !== '0x0000000000000000000000000000000000000000';

  // Read contract data
  const { data: canClaim, refetch: refetchCanClaim } = useReadContract({
    address: CLAIM_VAULT_ADDRESS,
    abi: CLAIM_VAULT_ABI,
    functionName: 'canClaim',
    args: [address],
    query: { enabled: !!address && isVaultActive }
  });

  const { data: timeUntil, refetch: refetchTime } = useReadContract({
    address: CLAIM_VAULT_ADDRESS,
    abi: CLAIM_VAULT_ABI,
    functionName: 'timeUntilClaim',
    args: [address],
    query: { enabled: !!address && isVaultActive }
  });

  const { data: availableCount, refetch: refetchAvailable } = useReadContract({
    address: CLAIM_VAULT_ADDRESS,
    abi: CLAIM_VAULT_ABI,
    functionName: 'availableCount',
    query: { enabled: isVaultActive }
  });

  // Write claim
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Countdown
  useEffect(() => {
    if (timeUntil && Number(timeUntil) > 0) {
      setCountdown(Number(timeUntil));
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            refetchCanClaim();
            refetchTime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeUntil]);

  // Refetch on success
  useEffect(() => {
    if (isSuccess) {
      refetchCanClaim();
      refetchTime();
      refetchAvailable();
    }
  }, [isSuccess]);

  const handleClaim = () => {
    writeContract({
      address: CLAIM_VAULT_ADDRESS,
      abi: CLAIM_VAULT_ABI,
      functionName: 'claim',
    });
  };

  const copyInstallCommand = () => {
    navigator.clipboard.writeText(`curl -sL ${SKILL_INSTALL_URL} | bash`);
    alert('Install command copied!');
  };

  if (!isVaultActive) {
    return (
      <div className="claim-banner coming-soon">
        <span className="banner-icon">🎴</span>
        <span className="banner-text">Free card claims coming soon!</span>
        <a href="https://opensea.io/collection/surf-waves-cards" target="_blank" rel="noopener noreferrer" className="banner-link">
          View Collection →
        </a>
      </div>
    );
  }

  return (
    <div className="claim-banner">
      <div className="banner-main">
        <span className="banner-icon">🎴</span>
        <span className="banner-stats">
          <strong>{availableCount?.toString() || '...'}</strong> cards available
        </span>

        {!isConnected ? (
          <span className="banner-action">Connect wallet to claim free card</span>
        ) : isSuccess ? (
          <span className="banner-success">
            ✅ Claimed! <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer">View TX</a>
          </span>
        ) : canClaim ? (
          <button 
            className="claim-btn"
            onClick={handleClaim}
            disabled={isPending || isConfirming}
          >
            {isPending || isConfirming ? '⏳' : '🌊'} {isPending ? 'Confirm...' : isConfirming ? 'Claiming...' : 'Claim Free Card'}
          </button>
        ) : (
          <span className="banner-cooldown">
            ⏳ Next claim in <strong>{formatTime(countdown)}</strong>
          </span>
        )}

        <button className="bot-toggle" onClick={() => setShowBotInfo(!showBotInfo)} title="Bot/Agent auto-claim">
          🤖
        </button>
      </div>

      {showBotInfo && (
        <div className="bot-info">
          <p><strong>🤖 Auto-claim for OpenClaw agents:</strong></p>
          <code onClick={copyInstallCommand} title="Click to copy">
            curl -sL {SKILL_INSTALL_URL} | bash
          </code>
          <p className="bot-hint">Or add <code>waves-claim</code> skill to your agent's skills directory</p>
        </div>
      )}
    </div>
  );
}
