import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import './ClaimScreen.css';

// ClaimVault contract address - UPDATE AFTER DEPLOYMENT
const CLAIM_VAULT_ADDRESS = '0x0000000000000000000000000000000000000000'; // Placeholder
const NFT_CONTRACT_ADDRESS = '0xcc2d6ba8564541e6e51fe5522e26d4f4bbdd458b';

const CLAIM_VAULT_ABI = [
  {
    "inputs": [],
    "name": "availableCount",
    "outputs": [{ "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "canClaim",
    "outputs": [{ "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "timeUntilClaim",
    "outputs": [{ "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "", "type": "address" }],
    "name": "lastClaim",
    "outputs": [{ "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claim",
    "outputs": [{ "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "user", "type": "address" },
      { "indexed": true, "name": "tokenId", "type": "uint256" }
    ],
    "name": "Claimed",
    "type": "event"
  }
];

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs}h ${mins}m ${secs}s`;
}

function ClaimScreen({ onBack }) {
  const { address, isConnected } = useAccount();
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [claimedTokenId, setClaimedTokenId] = useState(null);

  // Read available count
  const { data: availableCount, refetch: refetchAvailable } = useReadContract({
    address: CLAIM_VAULT_ADDRESS,
    abi: CLAIM_VAULT_ABI,
    functionName: 'availableCount',
    query: { enabled: CLAIM_VAULT_ADDRESS !== '0x0000000000000000000000000000000000000000' }
  });

  // Read can claim
  const { data: canClaim, refetch: refetchCanClaim } = useReadContract({
    address: CLAIM_VAULT_ADDRESS,
    abi: CLAIM_VAULT_ABI,
    functionName: 'canClaim',
    args: [address],
    query: { enabled: !!address && CLAIM_VAULT_ADDRESS !== '0x0000000000000000000000000000000000000000' }
  });

  // Read time until claim
  const { data: timeUntilClaim, refetch: refetchCooldown } = useReadContract({
    address: CLAIM_VAULT_ADDRESS,
    abi: CLAIM_VAULT_ABI,
    functionName: 'timeUntilClaim',
    args: [address],
    query: { enabled: !!address && CLAIM_VAULT_ADDRESS !== '0x0000000000000000000000000000000000000000' }
  });

  // Write claim
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract();

  // Wait for tx
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Countdown timer
  useEffect(() => {
    if (timeUntilClaim) {
      setCooldownSeconds(Number(timeUntilClaim));
    }
  }, [timeUntilClaim]);

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setInterval(() => {
        setCooldownSeconds(prev => {
          if (prev <= 1) {
            refetchCanClaim();
            refetchCooldown();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownSeconds, refetchCanClaim, refetchCooldown]);

  // Parse claimed token from receipt logs
  useEffect(() => {
    if (isConfirmed && receipt) {
      // Find Claimed event in logs
      const claimedLog = receipt.logs.find(log => 
        log.topics[0] === '0x4d68c2e95ef46bba9bc0e5e3b2b9f4a0e7e7a9a8d3c2b1a0' // Claimed event signature
      );
      if (claimedLog) {
        // Token ID is in the data field (non-indexed)
        const tokenId = parseInt(claimedLog.data, 16);
        setClaimedTokenId(tokenId);
      }
      refetchAvailable();
      refetchCanClaim();
      refetchCooldown();
    }
  }, [isConfirmed, receipt, refetchAvailable, refetchCanClaim, refetchCooldown]);

  const handleClaim = () => {
    writeContract({
      address: CLAIM_VAULT_ADDRESS,
      abi: CLAIM_VAULT_ABI,
      functionName: 'claim',
    });
  };

  const isVaultActive = CLAIM_VAULT_ADDRESS !== '0x0000000000000000000000000000000000000000';
  const isLoading = isWritePending || isConfirming;
  const available = availableCount ? Number(availableCount) : 0;

  return (
    <div className="claim-screen">
      <button className="back-button" onClick={onBack}>
        ← Back
      </button>

      <div className="claim-container">
        <div className="claim-header">
          <h1 className="claim-title">🎁 Free Card Claim</h1>
          <p className="claim-subtitle">
            Claim a random SURF Waves card every 2 hours!
          </p>
        </div>

        {!isVaultActive ? (
          <div className="claim-notice">
            <p>⏳ ClaimVault coming soon!</p>
            <p className="notice-sub">The vault is being deployed and loaded with cards.</p>
          </div>
        ) : (
          <div className="claim-stats">
            <div className="stat-box">
              <span className="stat-label">Available Cards</span>
              <span className="stat-value">{available}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Cooldown</span>
              <span className="stat-value">2 hours</span>
            </div>
          </div>
        )}

        {!isConnected ? (
          <div className="claim-connect">
            <p>Connect your wallet to claim a free card</p>
          </div>
        ) : !isVaultActive ? null : (
          <div className="claim-action">
            {cooldownSeconds > 0 ? (
              <div className="cooldown-display">
                <p>Next claim in:</p>
                <div className="cooldown-timer">{formatTime(cooldownSeconds)}</div>
              </div>
            ) : available === 0 ? (
              <div className="no-cards">
                <p>No cards available right now</p>
                <p className="notice-sub">Check back later!</p>
              </div>
            ) : (
              <button
                className="claim-button"
                onClick={handleClaim}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner" />
                    {isConfirming ? 'Confirming...' : 'Claiming...'}
                  </>
                ) : (
                  '🌊 Claim Random Card'
                )}
              </button>
            )}

            {writeError && (
              <div className="claim-error">
                Error: {writeError.shortMessage || writeError.message}
              </div>
            )}

            {isConfirmed && (
              <div className="claim-success">
                <p>✅ Card claimed successfully!</p>
                {claimedTokenId !== null && (
                  <a
                    href={`https://opensea.io/assets/base/${NFT_CONTRACT_ADDRESS}/${claimedTokenId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-card-link"
                  >
                    View on OpenSea →
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        <div className="claim-info">
          <h3>How it works</h3>
          <ul>
            <li>🃏 Each claim gives you a random card from the vault</li>
            <li>⏰ 2 hour cooldown between claims</li>
            <li>💎 Cards are real NFTs on Base blockchain</li>
            <li>🤖 Agents can also claim programmatically!</li>
          </ul>
        </div>

        <div className="claim-links">
          <a
            href="https://opensea.io/collection/surf-waves-cards"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Collection on OpenSea
          </a>
          <a
            href={`https://basescan.org/address/${CLAIM_VAULT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Contract on BaseScan
          </a>
        </div>
      </div>
    </div>
  );
}

export default ClaimScreen;
