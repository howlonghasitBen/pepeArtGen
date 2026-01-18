import { Suspense, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Sky, Environment, Loader } from "@react-three/drei";
import { useAllCards } from "../../hooks/useAllCards";
import SurfShack from "./SurfShack";
import CardBar from "./CardBar";
import FirstPersonControls from "./FirstPersonControls";
import Ocean from "./Ocean";
import Beach from "./Beach";
import CardDetailModal from "./CardDetailModal";
import "./SurfShackShop.css";

function SurfShackShop({ onBack }) {
  const { cards, loading, error } = useAllCards();
  const [selectedCard, setSelectedCard] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  const handleCardClick = useCallback((card) => {
    setSelectedCard(card);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedCard(null);
  }, []);

  const handleLockChange = useCallback((locked) => {
    setIsLocked(locked);
  }, []);

  return (
    <div className="surf-shack-shop">
      {/* Instructions overlay */}
      <div className={`shop-instructions ${isLocked ? "hidden" : ""}`}>
        <h3>SURF SHACK CARD SHOP</h3>
        <p>Click anywhere to start exploring</p>
        <p className="controls-hint">
          <span>WASD</span> Move
          <span>MOUSE</span> Look
          <span>ESC</span> Pause
        </p>
      </div>

      {/* Back button */}
      <button className="shop-back-btn" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Loading state */}
      {loading && (
        <div className="shop-loading">
          <div className="loading-spinner" />
          <p>Loading cards from the collection...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="shop-error">
          <p>Error loading cards: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 1.7, 8] }}
        onPointerDown={(e) => e.target.requestPointerLock?.()}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />
          <pointLight position={[0, 3, 0]} intensity={0.5} color="#ffcc77" />

          {/* Sky and environment */}
          <Sky
            distance={450000}
            sunPosition={[100, 20, 100]}
            inclination={0.6}
            azimuth={0.25}
            rayleigh={0.5}
          />
          <Environment preset="sunset" />

          {/* Scene elements */}
          <Beach />
          <Ocean />
          <SurfShack />
          <CardBar cards={cards} onCardClick={handleCardClick} />

          {/* First person controls */}
          <FirstPersonControls onLockChange={handleLockChange} />
        </Suspense>
      </Canvas>

      {/* Loading indicator for Three.js */}
      <Loader />

      {/* Card detail modal */}
      {selectedCard && (
        <CardDetailModal card={selectedCard} onClose={handleCloseModal} />
      )}
    </div>
  );
}

export default SurfShackShop;
