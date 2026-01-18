import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Card3D from "./Card3D";

// Bar counter with card display stands
function CardBar({ cards = [], onCardClick }) {
  const groupRef = useRef();

  // Colors
  const colors = {
    barTop: "#4a3728",
    barBase: "#3d2817",
    metal: "#888888",
    neon: "#00ff88",
  };

  // Calculate card positions along the bar
  const cardPositions = useMemo(() => {
    if (!cards.length) return [];

    const barWidth = 10;
    const maxCards = Math.min(cards.length, 8); // Max 8 cards displayed
    const spacing = barWidth / (maxCards + 1);

    return cards.slice(0, maxCards).map((card, i) => ({
      card,
      position: [
        -barWidth / 2 + spacing * (i + 1),
        1.7,
        -3,
      ],
      rotation: [0, 0, 0],
    }));
  }, [cards]);

  return (
    <group ref={groupRef}>
      {/* Main bar counter */}
      <group position={[0, 0, -3.5]}>
        {/* Bar top surface */}
        <mesh receiveShadow castShadow position={[0, 1.1, 0]}>
          <boxGeometry args={[12, 0.15, 1.5]} />
          <meshStandardMaterial
            color={colors.barTop}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>

        {/* Bar front panel */}
        <mesh receiveShadow castShadow position={[0, 0.5, 0.65]}>
          <boxGeometry args={[12, 1, 0.1]} />
          <meshStandardMaterial color={colors.barBase} roughness={0.7} />
        </mesh>

        {/* Bar back panel */}
        <mesh receiveShadow castShadow position={[0, 0.5, -0.65]}>
          <boxGeometry args={[12, 1, 0.1]} />
          <meshStandardMaterial color={colors.barBase} roughness={0.7} />
        </mesh>

        {/* Bar side panels */}
        <mesh receiveShadow castShadow position={[-5.95, 0.5, 0]}>
          <boxGeometry args={[0.1, 1, 1.5]} />
          <meshStandardMaterial color={colors.barBase} roughness={0.7} />
        </mesh>
        <mesh receiveShadow castShadow position={[5.95, 0.5, 0]}>
          <boxGeometry args={[0.1, 1, 1.5]} />
          <meshStandardMaterial color={colors.barBase} roughness={0.7} />
        </mesh>

        {/* Bar foot rail */}
        <mesh position={[0, 0.2, 0.8]}>
          <cylinderGeometry args={[0.04, 0.04, 11, 8]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color={colors.metal} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Neon strip under bar top */}
        <mesh position={[0, 1.0, 0.7]}>
          <boxGeometry args={[11.5, 0.03, 0.03]} />
          <meshStandardMaterial
            color={colors.neon}
            emissive={colors.neon}
            emissiveIntensity={2}
          />
        </mesh>
        <pointLight position={[0, 1.0, 0.7]} intensity={0.3} color={colors.neon} distance={3} />

        {/* Bar stools */}
        {[-4, -2, 0, 2, 4].map((x, i) => (
          <group key={i} position={[x, 0, 1.5]}>
            {/* Stool base */}
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.35, 0.1, 8]} />
              <meshStandardMaterial color={colors.metal} metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Stool pole */}
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
              <meshStandardMaterial color={colors.metal} metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Stool seat */}
            <mesh castShadow position={[0, 0.85, 0]}>
              <cylinderGeometry args={[0.25, 0.22, 0.1, 16]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Back shelf for displaying more cards */}
      <group position={[0, 0, -4.8]}>
        {/* Shelf structure */}
        <mesh receiveShadow position={[0, 2.2, 0]}>
          <boxGeometry args={[10, 0.1, 0.4]} />
          <meshStandardMaterial color={colors.barBase} roughness={0.6} />
        </mesh>
        <mesh receiveShadow position={[0, 3.2, 0]}>
          <boxGeometry args={[10, 0.1, 0.4]} />
          <meshStandardMaterial color={colors.barBase} roughness={0.6} />
        </mesh>

        {/* Shelf brackets */}
        {[-4, 0, 4].map((x, i) => (
          <mesh key={i} position={[x, 2.7, 0.15]} castShadow>
            <boxGeometry args={[0.1, 1.1, 0.05]} />
            <meshStandardMaterial color={colors.metal} metalness={0.6} roughness={0.4} />
          </mesh>
        ))}

        {/* LED strip on shelves */}
        <mesh position={[0, 2.15, 0.25]}>
          <boxGeometry args={[9.5, 0.02, 0.02]} />
          <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0, 3.15, 0.25]}>
          <boxGeometry args={[9.5, 0.02, 0.02]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1.5} />
        </mesh>
      </group>

      {/* Display stand cards on the bar */}
      {cardPositions.map(({ card, position }, index) => (
        <Card3D
          key={card.id || index}
          card={card}
          position={position}
          onClick={() => onCardClick?.(card)}
          index={index}
        />
      ))}

      {/* "CARDS" sign */}
      <group position={[0, 3.6, -5]}>
        <mesh>
          <boxGeometry args={[2.5, 0.6, 0.1]} />
          <meshStandardMaterial color="#111" roughness={0.8} />
        </mesh>
        {/* Neon text effect */}
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[2.3, 0.4]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={3}
            transparent
            opacity={0.9}
          />
        </mesh>
        <pointLight position={[0, 0, 0.5]} intensity={0.5} color="#00ff88" distance={2} />
      </group>

      {/* Empty state message when no cards */}
      {cards.length === 0 && (
        <group position={[0, 1.6, -3]}>
          <mesh>
            <planeGeometry args={[3, 0.5]} />
            <meshStandardMaterial
              color="#333"
              transparent
              opacity={0.8}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default CardBar;
