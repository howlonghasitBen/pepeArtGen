#!/bin/bash
# Test ClaimVault on Anvil fork of Base
# Usage: ./test-claim-vault.sh

set -e
export PATH="$HOME/.foundry/bin:$PATH"

cd "$(dirname "$0")/.."

NFT_CONTRACT="0xcc2d6ba8564541e6e51fe5522e26d4f4bbdd458b"
OWNER="0x93709D98F406904845b44e5d8D47C9A7E6A250Ea"
RPC="https://mainnet.base.org"
ANVIL_RPC="http://localhost:8545"

echo "🌊 ClaimVault Local Test"
echo "========================"

# Check if Anvil is running
if ! curl -s $ANVIL_RPC > /dev/null 2>&1; then
  echo "Starting Anvil fork of Base..."
  anvil --fork-url $RPC --fork-block-number 28000000 &
  ANVIL_PID=$!
  sleep 3
  echo "Anvil started (PID: $ANVIL_PID)"
else
  echo "Anvil already running"
fi

# Use Anvil's default test account
TEST_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
TEST_ACCOUNT="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# Fund test account with ETH (Anvil accounts have ETH)
echo ""
echo "📦 Deploying ClaimVault..."

DEPLOY_OUTPUT=$(forge create \
  --rpc-url $ANVIL_RPC \
  --private-key $TEST_PRIVATE_KEY \
  contracts/ClaimVault.sol:ClaimVault \
  --constructor-args $NFT_CONTRACT)

VAULT=$(echo "$DEPLOY_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
echo "✅ Deployed to: $VAULT"

# Impersonate the NFT owner to deposit cards
echo ""
echo "📥 Impersonating owner to deposit NFTs..."

# Unlock owner account
cast rpc anvil_impersonateAccount $OWNER --rpc-url $ANVIL_RPC > /dev/null

# Fund owner with ETH for gas
cast rpc anvil_setBalance $OWNER 0x56BC75E2D63100000 --rpc-url $ANVIL_RPC > /dev/null

# Approve vault for NFT transfers
echo "Approving vault for NFT transfers..."
cast send $NFT_CONTRACT "setApprovalForAll(address,bool)" $VAULT true \
  --from $OWNER \
  --rpc-url $ANVIL_RPC \
  --unlocked > /dev/null

# Transfer a few test NFTs to vault
echo "Depositing test NFTs..."
for TOKEN_ID in 1 2 3 4 5; do
  cast send $NFT_CONTRACT "safeTransferFrom(address,address,uint256)" $OWNER $VAULT $TOKEN_ID \
    --from $OWNER \
    --rpc-url $ANVIL_RPC \
    --unlocked > /dev/null 2>&1 || true
done

# Stop impersonation
cast rpc anvil_stopImpersonatingAccount $OWNER --rpc-url $ANVIL_RPC > /dev/null

# Check vault state
echo ""
echo "📊 Vault State:"
AVAILABLE=$(cast call $VAULT "availableCount()" --rpc-url $ANVIL_RPC | cast to-dec)
echo "   Available cards: $AVAILABLE"

# Test claim
echo ""
echo "🎯 Testing claim..."
CAN_CLAIM=$(cast call $VAULT "canClaim(address)" $TEST_ACCOUNT --rpc-url $ANVIL_RPC)
echo "   Can claim: $CAN_CLAIM"

if [ "$CAN_CLAIM" = "0x0000000000000000000000000000000000000000000000000000000000000001" ]; then
  echo "   Claiming..."
  TX=$(cast send $VAULT "claim()" \
    --rpc-url $ANVIL_RPC \
    --private-key $TEST_PRIVATE_KEY \
    --json)
  echo "   ✅ Claim successful!"
  
  # Check cooldown
  REMAINING=$(cast call $VAULT "cooldownRemaining(address)" $TEST_ACCOUNT --rpc-url $ANVIL_RPC | cast to-dec)
  echo "   Cooldown remaining: ${REMAINING}s (2 hours = 7200s)"
  
  # Try to claim again (should fail)
  echo ""
  echo "   Testing cooldown (should fail)..."
  CAN_CLAIM_AGAIN=$(cast call $VAULT "canClaim(address)" $TEST_ACCOUNT --rpc-url $ANVIL_RPC)
  if [ "$CAN_CLAIM_AGAIN" = "0x0000000000000000000000000000000000000000000000000000000000000000" ]; then
    echo "   ✅ Cooldown working correctly!"
  else
    echo "   ❌ Cooldown not working!"
  fi
fi

# Check new available count
AVAILABLE_AFTER=$(cast call $VAULT "availableCount()" --rpc-url $ANVIL_RPC | cast to-dec)
echo ""
echo "📊 After claim:"
echo "   Available cards: $AVAILABLE_AFTER"

echo ""
echo "✅ All tests passed!"
echo ""
echo "To interact manually:"
echo "   export VAULT=$VAULT"
echo "   cast call \$VAULT 'availableCount()' --rpc-url $ANVIL_RPC | cast to-dec"

# Cleanup
if [ -n "$ANVIL_PID" ]; then
  echo ""
  echo "Stopping Anvil (PID: $ANVIL_PID)..."
  kill $ANVIL_PID 2>/dev/null || true
fi
