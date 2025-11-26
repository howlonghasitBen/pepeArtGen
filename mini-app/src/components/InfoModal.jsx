import { LiquidGlass } from 'liquid-glass-react'
import './InfoModal.css'

function InfoModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <LiquidGlass
        blurAmount={0.1}
        saturation={150}
        cornerRadius={24}
        displacementScale={40}
      >
        <div className="info-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <h2>ℹ️ How It Works</h2>

        <div className="info-steps">
          <div className="info-step">
            <span className="step-number">1</span>
            <div className="step-content">
              <h3>💰 Pay for Generation</h3>
              <p>Pay $2.50 USDC once to unlock 3 generation attempts (1 initial + 2 re-rolls)</p>
            </div>
          </div>

          <div className="info-step">
            <span className="step-number">2</span>
            <div className="step-content">
              <h3>🎨 Generate Your Card</h3>
              <p>Enter a monster name and our AI will create a unique Pepe trading card with custom artwork and stats</p>
            </div>
          </div>

          <div className="info-step">
            <span className="step-number">3</span>
            <div className="step-content">
              <h3>🔄 Curate with Re-rolls</h3>
              <p>Not happy with the result? Re-roll up to 2 times to get different artwork and attributes</p>
            </div>
          </div>

          <div className="info-step">
            <span className="step-number">4</span>
            <div className="step-content">
              <h3>➡️ Swipe to Select</h3>
              <p>Swipe right on cards you love, swipe left to discard. You can mint multiple cards from one session!</p>
            </div>
          </div>

          <div className="info-step">
            <span className="step-number">5</span>
            <div className="step-content">
              <h3>🆓 Mint for FREE</h3>
              <p>Minting is free - you only pay gas fees (~$0.01 on Base L2). Your card becomes an NFT on the blockchain!</p>
            </div>
          </div>
        </div>

        <div className="info-footer">
          <p className="pricing-note">
            <strong>Payment Model:</strong> $2.50 USDC for generation service. Minting is free (gas only).
          </p>
          <p className="tech-note">
            Built with Google Imagen AI • Minted on Base L2 • Stored on IPFS
          </p>
        </div>

        <button className="close-button" onClick={onClose}>
          Got it!
        </button>
        </div>
      </LiquidGlass>
    </div>
  )
}

export default InfoModal
