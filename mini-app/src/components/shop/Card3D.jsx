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
  const textureRef = useRef(null);

  // Card dimensions - enforced 3:4 aspect ratio
  const { cardWidth, cardHeight, cardDepth } = useMemo(() => {
    const height = CARD_LAYOUT.CARD_3D.BASE_HEIGHT * scale;
    const width = height * CARD_LAYOUT.ASPECT_RATIO;
    return {
      cardWidth: width,
      cardHeight: height,
      cardDepth: CARD_LAYOUT.CARD_3D.CARD_DEPTH,
    };
  }, [scale]);

  // Load card image as texture with cleanup
  useEffect(() => {
    const imageUrl = card?.image || card?.imageData;
    if (!imageUrl) return;

    let isMounted = true;
    const loader = new THREE.TextureLoader();

    loader.load(
      imageUrl,
      (loadedTexture) => {
        if (!isMounted) {
          loadedTexture.dispose();
          return;
        }
        loadedTexture.colorSpace = THREE.SRGBColorSpace;

        // Adjust UV mapping for non-3:4 images (like OpenSea's square thumbnails)
        // This acts like CSS object-fit: cover - crops to fill 3:4 space
        const img = loadedTexture.image;
        if (img && img.width && img.height) {
          const sourceAspect = img.width / img.height;
          const targetAspect = CARD_LAYOUT.ASPECT_RATIO; // 0.75 (3:4)

          if (Math.abs(sourceAspect - targetAspect) > 0.01) {
            // Image aspect differs from target - need to crop
            if (sourceAspect > targetAspect) {
              // Source is wider (e.g., square) - crop sides
              const scale = targetAspect / sourceAspect;
              loadedTexture.repeat.set(scale, 1);
              loadedTexture.offset.set((1 - scale) / 2, 0);
            } else {
              // Source is taller - crop top/bottom
              const scale = sourceAspect / targetAspect;
              loadedTexture.repeat.set(1, scale);
              loadedTexture.offset.set(0, (1 - scale) / 2);
            }
          }
        }

        // Dispose previous texture if exists
        if (textureRef.current) {
          textureRef.current.dispose();
        }
        textureRef.current = loadedTexture;
        setTexture(loadedTexture);
      },
      undefined,
      (error) => {
        console.warn("Failed to load card texture:", error);
      }
    );

    // Cleanup on unmount or when card changes
    return () => {
      isMounted = false;
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
    };
  }, [card?.image, card?.imageData]);

  // Animation
  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    const { FLOAT_AMPLITUDE, FLOAT_SPEED, HOVER_SCALE } = CARD_LAYOUT.CARD_3D;

    // Gentle floating animation
    meshRef.current.position.y =
      position[1] + Math.sin(time * FLOAT_SPEED + index * 0.5) * FLOAT_AMPLITUDE;

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
