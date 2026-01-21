import { Suspense, useState, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Sky, Environment, Loader } from "@react-three/drei";
import { useAllCards } from "../../hooks/useAllCards";
import MeshySurfShack from "./MeshySurfShack";
import CardBar from "./CardBar";
import ThirdPersonControls from "./ThirdPersonControls";
import MeshyPepeCharacter from "./MeshyPepeCharacter";
import Ocean from "./Ocean";
import Beach from "./Beach";
import ShopProps from "./ShopProps";
import CardDetailModal from "./CardDetailModal";
import NameInputModal from "./NameInputModal";
import MobileControls from "./MobileControls";
import "./SurfShackShop.css";

function SurfShackShop({ onBack }) {
  const { cards, loading, error, usingSampleData } = useAllCards();
  const [selectedCard, setSelectedCard] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const [showNameModal, setShowNameModal] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileInput, setMobileInput] = useState({ x: 0, y: 0 });

  // Character state
  const [characterPosition, setCharacterPosition] = useState([0, 0, 6]);
  const [characterRotation, setCharacterRotation] = useState(0);
  const [isMoving, setIsMoving] = useState(false);

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Check for stored name
  useEffect(() => {
    const storedName = localStorage.getItem("surfShackPlayerName");
    if (storedName) {
      setPlayerName(storedName);
      setShowNameModal(false);
    }
  }, []);

  const handleNameSubmit = useCallback((name) => {
    setPlayerName(name);
    localStorage.setItem("surfShackPlayerName", name);
    setShowNameModal(false);
  }, []);

  const handleCardClick = useCallback((card) => {
    setSelectedCard(card);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedCard(null);
  }, []);

  const handleMobileInput = useCallback((input) => {
    setMobileInput(input);
  }, []);

  // Show name input modal
  if (showNameModal) {
    return <NameInputModal onSubmit={handleNameSubmit} />;
  }

  return (
    <div className="surf-shack-shop">
      {/* Instructions overlay */}
      <div className="shop-instructions-minimal">
        <p>
          {isMobile ? (
            <>Use joystick to move, drag right side to look</>
          ) : (
            <>
              <span>WASD</span> Move
              <span>MOUSE</span> Look around
              <span>SCROLL</span> Zoom
            </>
          )}
        </p>
      </div>

      {/* Player info */}
      <div className="player-info">
        <span className="player-name">{playerName}</span>
        <button
          className="change-name-btn"
          onClick={() => setShowNameModal(true)}
          title="Change name"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      {/* Back button */}
      <button className="shop-back-btn" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Sample data warning */}
      {usingSampleData && (
        <div className="sample-data-notice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Showing sample cards (OpenSea API unavailable)</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="shop-loading">
          <div className="loading-spinner" />
          <p>Loading cards from the collection...</p>
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 3, 10] }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={1.5}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={60}
            shadow-camera-left={-25}
            shadow-camera-right={25}
            shadow-camera-top={25}
            shadow-camera-bottom={-25}
          />
          <pointLight position={[0, 3, 0]} intensity={0.5} color="#ffcc77" />
          <hemisphereLight
            skyColor="#87ceeb"
            groundColor="#f4d58d"
            intensity={0.3}
          />

          {/* Sky and environment */}
          <Sky
            distance={450000}
            sunPosition={[100, 20, 100]}
            inclination={0.6}
            azimuth={0.25}
            rayleigh={0.5}
          />
          <Environment preset="sunset" />

          {/* Fog for depth */}
          <fog attach="fog" args={["#87ceeb", 30, 80]} />

          {/* Scene elements */}
          <Beach />
          <Ocean />
          <MeshySurfShack position={[0, 3, 0]} scale={7.5} />
          <CardBar cards={cards} onCardClick={handleCardClick} />

          {/* Meshy AI generated props (neon sign, shelves) */}
          <ShopProps onPropClick={(prop) => console.log('Clicked prop:', prop.id)} />

          {/* Shopkeeper Pepe - stationary behind the counter */}
          <MeshyPepeCharacter
            position={[0, 0, -3]}
            rotation={[0, Math.PI, 0]}
            playerName="Shopkeeper"
            isMoving={false}
            isLocalPlayer={false}
            scale={1}
          />

          {/* Player character - Meshy AI Pepe with animations */}
          <MeshyPepeCharacter
            position={characterPosition}
            rotation={[0, characterRotation, 0]}
            playerName={playerName}
            isMoving={isMoving}
            isLocalPlayer={true}
            scale={1}
          />

          {/* Third person camera controls */}
          <ThirdPersonControls
            onPositionChange={(pos) => setCharacterPosition([pos.x, pos.y, pos.z])}
            onRotationChange={setCharacterRotation}
            onMovingChange={setIsMoving}
            mobileInput={isMobile ? mobileInput : null}
            enabled={!selectedCard && !showNameModal}
          />
        </Suspense>
      </Canvas>

      {/* Loading indicator for Three.js */}
      <Loader />

      {/* Mobile controls */}
      {isMobile && !selectedCard && (
        <MobileControls
          onInputChange={handleMobileInput}
          visible={!selectedCard}
        />
      )}

      {/* Card detail modal */}
      {selectedCard && (
        <CardDetailModal card={selectedCard} onClose={handleCloseModal} />
      )}
    </div>
  );
}

export default SurfShackShop;
