import { Suspense, useState, useCallback, useEffect, Component } from "react";
import { Canvas } from "@react-three/fiber";
import { Sky, Environment, Loader } from "@react-three/drei";
import { useAllCards } from "../../hooks/useAllCards";
import MeshySurfShack from "./MeshySurfShack";
import ThirdPersonControls from "./ThirdPersonControls";
import MeshyPepeCharacter from "./MeshyPepeCharacter";
import ShaderOcean from "./ShaderOcean";
import Beach from "./Beach";
import ShopProps from "./ShopProps";
import CardDetailModal from "./CardDetailModal";
import NameInputModal from "./NameInputModal";
import MobileControls from "./MobileControls";
import MeshyModel, { preloadModel } from "./MeshyModel";
import CardPlayingField from "./CardPlayingField";
import "./SurfShackShop.css";

// Error Boundary to prevent page reloads on WebGL errors
class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[WebGL Error Boundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="webgl-error-screen">
          <h2>3D Scene Error</h2>
          <p>The 3D shop encountered an issue. This can happen on mobile devices with limited memory.</p>
          <button onClick={this.props.onBack} className="shop-back-btn">
            Return to Main Menu
          </button>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="shop-back-btn"
            style={{ marginLeft: '10px' }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Preload palm tree model
preloadModel('/models/props/palmTree.glb');

// Palm tree positions along the beach (left and right sides)
// Y position adjusted to place base flush with ground
const PALM_TREE_POSITIONS = [
  // Left side of beach
  { position: [-18, 6, 20], rotation: [0, 0.3, 0], scale: 7.2 },
  { position: [-15, 6, 16], rotation: [0, -0.5, 0], scale: 8.0 },
  { position: [-20, 6, 12], rotation: [0, 0.8, 0], scale: 6.4 },
  { position: [-16, 6, 8], rotation: [0, -0.2, 0], scale: 7.6 },
  // Right side of beach
  { position: [18, 6, 20], rotation: [0, -0.4, 0], scale: 6.8 },
  { position: [15, 6, 15], rotation: [0, 0.6, 0], scale: 8.4 },
  { position: [20, 6, 10], rotation: [0, -0.7, 0], scale: 7.2 },
  { position: [17, 6, 6], rotation: [0, 0.4, 0], scale: 6.0 },
];

function SurfShackShop({ onBack }) {
  const { cards, loading, error, usingSampleData } = useAllCards();
  const [selectedCard, setSelectedCard] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const [showNameModal, setShowNameModal] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileInput, setMobileInput] = useState({ x: 0, y: 0 });
  const [cameraInput, setCameraInput] = useState({ x: 0, y: 0 });

  // Character state - spawn in front of the shack entrance (centered on beach)
  const [characterPosition, setCharacterPosition] = useState([0, 0, 18]);
  const [characterRotation, setCharacterRotation] = useState(Math.PI); // Face the shack
  const [isMoving, setIsMoving] = useState(false);

  // WebGL context state for handling context loss on mobile
  const [contextLost, setContextLost] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024 || "ontouchstart" in window;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Check for stored name
  useEffect(() => {
    const storedName = localStorage.getItem("surfShackPlayerName");
    if (storedName) {
      setPlayerName(storedName);
      setShowNameModal(false);
    }
  }, []);

  // Handle WebGL context loss (critical for mobile)
  useEffect(() => {
    const handleContextLost = (event) => {
      event.preventDefault();
      console.warn('[WebGL] Context lost - preventing page reload');
      setContextLost(true);
    };

    const handleContextRestored = () => {
      console.log('[WebGL] Context restored - reloading scene');
      setContextLost(false);
      // Force Canvas remount by changing key
      setCanvasKey(prev => prev + 1);
    };

    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('webglcontextlost', handleContextLost);
      canvas.addEventListener('webglcontextrestored', handleContextRestored);

      return () => {
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      };
    }
  }, [canvasKey]); // Re-attach listeners after canvas remount

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

  const handleCameraInput = useCallback((input) => {
    setCameraInput(input);
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

      {/* WebGL context lost warning */}
      {contextLost && (
        <div className="sample-data-notice" style={{ background: '#ff6b6b' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Graphics memory low - scene reloading...</span>
        </div>
      )}

      {/* 3D Canvas wrapped in Error Boundary */}
      <WebGLErrorBoundary onBack={onBack}>
        <Canvas
          key={canvasKey}
          shadows
          camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 3, 10] }}
          gl={{
            powerPreference: isMobile ? 'low-power' : 'high-performance',
            antialias: !isMobile,
          }}
        >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={1.5}
            castShadow
            shadow-mapSize={isMobile ? [1024, 1024] : [2048, 2048]}
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
          <Beach isMobile={isMobile} />
          <ShaderOcean
            position={[0, -0.5, 0]}
            sunDirection={[100, 20, 100]}
            waterColor="#006994"
            distortionScale={2}
            isMobile={isMobile}
          />

          {/* Surf Shack - two shacks back-to-back, centered on beach plane */}
          {/* Front shack - facing the beach (raised by 1) */}
          <MeshySurfShack position={[0, 5.25, 13]} scale={7.5} />
          {/* Back shack - rotated 180° and positioned snugly behind */}
          <MeshySurfShack position={[0, 5.25, 7]} rotation={[0, Math.PI, 0]} scale={7.5} />

          {/* Shelves with cards inside the shack */}
          <ShopProps
            cards={cards}
            onCardClick={handleCardClick}
            onPropClick={(prop) => console.log('Clicked prop:', prop.id)}
          />

          {/* Palm trees along the beach (fewer on mobile to save memory) */}
          {PALM_TREE_POSITIONS
            .filter((_, index) => !isMobile || index % 2 === 0) // Show every other tree on mobile
            .map((tree, index) => (
              <MeshyModel
                key={`palm-tree-${index}`}
                url="/models/props/palmTree.glb"
                position={tree.position}
                rotation={tree.rotation}
                scale={tree.scale}
              />
            ))}

          {/* Trading card playing field on the wet sand */}
          <CardPlayingField position={[0, 0.05, 22]} rotation={[0, Math.PI / 2, 0]} />

          {/* Shopkeeper Pepe - at the entrance, greeting visitors */}
          <MeshyPepeCharacter
            position={[2, 0, 14]}
            rotation={[0, Math.PI / 2, 0]}
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
            cameraInput={isMobile ? cameraInput : null}
            enabled={!selectedCard && !showNameModal}
          />
        </Suspense>
      </Canvas>
      </WebGLErrorBoundary>

      {/* Loading indicator for Three.js */}
      <Loader />

      {/* Mobile controls */}
      {isMobile && !selectedCard && (
        <MobileControls
          onInputChange={handleMobileInput}
          onCameraChange={handleCameraInput}
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
