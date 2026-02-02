#!/bin/bash
# One-click install for SURF Waves Cards auto-claim skill
# Usage: curl -sL https://raw.githubusercontent.com/howlonghasitBen/pepeArtGen/main/skills/waves-claim/install.sh | bash

set -e

SKILL_DIR="${OPENCLAW_SKILLS:-$HOME/.openclaw/skills}/waves-claim"
REPO_URL="https://raw.githubusercontent.com/howlonghasitBen/pepeArtGen/main/skills/waves-claim"

echo "🎴 Installing SURF Waves Cards claim skill..."

# Create skill directory
mkdir -p "$SKILL_DIR/scripts"

# Download skill files
echo "📥 Downloading skill files..."
curl -sL "$REPO_URL/SKILL.md" > "$SKILL_DIR/SKILL.md"
curl -sL "$REPO_URL/scripts/check-claim.sh" > "$SKILL_DIR/scripts/check-claim.sh"
curl -sL "$REPO_URL/scripts/claim.sh" > "$SKILL_DIR/scripts/claim.sh"

# Make scripts executable
chmod +x "$SKILL_DIR/scripts/"*.sh

echo ""
echo "✅ Skill installed to: $SKILL_DIR"
echo ""
echo "📋 Usage:"
echo "  Check eligibility: $SKILL_DIR/scripts/check-claim.sh"
echo "  Claim a card:      $SKILL_DIR/scripts/claim.sh"
echo ""
echo "🔧 Requirements:"
echo "  - Foundry (cast CLI)"
echo "  - PRIVATE_KEY env var or ~/.config/clawtasks/credentials.json"
echo "  - Base ETH for gas"
echo ""
echo "🌊 Happy claiming!"
