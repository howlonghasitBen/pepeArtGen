import { useRef, useState, useEffect } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";

// Individual 3D card with hover animation and click handling
function Card3D({ card, position, onClick, index = 0 }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [texture, setTexture] = useState(null);

  // Card dimensions (3:4 aspect ratio to match SwipeableCard)
  const cardWidth = 0.6;
  const cardHeight = 0.8;
  const cardDepth = 0.02;

  // Load card image as texture
  useEffect(() => {
    if (card?.image || card?.imageData) {
      const imageUrl = card.image || card.imageData;
      const loader = new THREE.TextureLoader();

      loader.load(
        imageUrl,
        (loadedTexture) => {
          loadedTexture.colorSpace = THREE.SRGBColorSpace;
          setTexture(loadedTexture);
        },
        undefined,
        (error) => {
          console.warn("Failed to load card texture:", error);
        }
      );
    }
  }, [card]);

  // Animation
  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;

    // Gentle floating animation
    meshRef.current.position.y = position[1] + Math.sin(time * 1.5 + index * 0.5) * 0.02;

    // Hover effect - slight rotation toward camera
    if (hovered) {
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        Math.sin(time * 2) * 0.1,
        0.1
      );
      meshRef.current.scale.lerp(new THREE.Vector3(1.15, 1.15, 1.15), 0.1);
    } else {
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.1);
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
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
      <group position={[0, -cardHeight / 2 - 0.05, 0.1]}>
        {/* Stand base */}
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.05, 0.3]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Stand back support */}
        <mesh position={[0, 0.2, -0.1]} rotation={[-0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.3, 0.4, 0.02]} />
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

      {/* Card front face with image - full size, no frame */}
      <mesh position={[0, 0, cardDepth / 2 + 0.001]}>
        <planeGeometry args={[cardWidth, cardHeight]} />
        {texture ? (
          <meshStandardMaterial
            map={texture}
            roughness={0.4}
            metalness={0.1}
          />
        ) : (
          <meshStandardMaterial color="#2a2a4e" roughness={0.5} />
        )}
      </mesh>

      {/* Glow effect when hovered */}
      {hovered && (
        <pointLight
          position={[0, 0, 0.3]}
          intensity={0.5}
          color="#00ff88"
          distance={1}
        />
      )}

      {/* Card name label (floating below) */}
      {card?.name && (
        <group position={[0, -cardHeight / 2 - 0.15, 0.1]}>
          <mesh>
            <planeGeometry args={[0.5, 0.1]} />
            <meshStandardMaterial
              color="#000"
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default Card3D;
