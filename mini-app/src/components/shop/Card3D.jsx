import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CARD_LAYOUT } from "../../constants/cardLayout";

/**
 * Individual 3D card with hover animation and click handling
 * Enforces 3:4 aspect ratio to match cardHTMLGenerator output
 */
function Card3D({ card, position, onClick, index = 0, scale = 1.0 }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [texture, setTexture] = useState(null);
  const cardDepth = 0.02;
  const baseScale = 0.9; // Base size for cards

  // Card dimensions - fixed 3:4 aspect ratio
  const cardHeight = baseScale;
  const cardWidth = cardHeight * (3 / 4); // Maintain 3:4 aspect ratio

  // Load card image as texture with proper cleanup
  useEffect(() => {
    let loadedTexture = null;
    let isMounted = true;

    if (card?.image || card?.imageData) {
      const imageUrl = card.image || card.imageData;
      const loader = new THREE.TextureLoader();

      loader.load(
        imageUrl,
        (tex) => {
          if (isMounted) {
            tex.colorSpace = THREE.SRGBColorSpace;
            loadedTexture = tex;
            setTexture(tex);
          } else {
            // Component unmounted before texture loaded - dispose immediately
            tex.dispose();
          }
        },
        undefined,
        (error) => {
          console.warn("Failed to load card texture:", error);
        }
      );
    }

    // Cleanup: dispose texture when component unmounts or card changes
    return () => {
      isMounted = false;
      if (loadedTexture) {
        loadedTexture.dispose();
      }
    };
  }, [card]);

  // Animation - hover effects only, no idle floating
  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    const { HOVER_SCALE } = CARD_LAYOUT.CARD_3D;

    // Hover effect
    const targetScale = hovered ? HOVER_SCALE : 1;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );

    // Slight rotation on hover
    if (hovered) {
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        Math.sin(time * 2) * 0.08,
        0.1
      );
    } else {
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        0,
        0.1
      );
    }
  });

  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = "default";
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <group ref={meshRef} position={position}>
      {/* Card stand/easel */}
      <group position={[0, -cardHeight / 2 - 0.03, 0.08]}>
        {/* Stand base */}
        <mesh castShadow>
          <boxGeometry args={[cardWidth * 0.6, 0.04, 0.2]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Stand back support */}
        <mesh position={[0, 0.15, -0.08]} rotation={[-0.3, 0, 0]} castShadow>
          <boxGeometry args={[cardWidth * 0.4, 0.3, 0.015]} />
          <meshStandardMaterial color="#333" metalness={0.4} roughness={0.6} />
        </mesh>
      </group>

      {/* Card body */}
      <mesh
        castShadow
        receiveShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry args={[cardWidth, cardHeight, cardDepth]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Card front face with image */}
      <mesh position={[0, 0, cardDepth / 2 + 0.001]}>
        <planeGeometry args={[cardWidth, cardHeight]} />
        {texture ? (
          <meshStandardMaterial map={texture} roughness={0.4} metalness={0.1} />
        ) : (
          <meshStandardMaterial color="#2a2a4e" roughness={0.5} />
        )}
      </mesh>

      {/* Glow effect when hovered */}
      {hovered && (
        <pointLight
          position={[0, 0, 0.3]}
          intensity={0.4}
          color="#00ff88"
          distance={0.8}
        />
      )}
    </group>
  );
}

export default Card3D;
