import { useRef } from "react";
import * as THREE from "three";

// Low-poly surf shack / beach bungalow
function SurfShack() {
  const groupRef = useRef();

  // Colors for the surf shack
  const colors = {
    wood: "#8B4513",
    woodLight: "#A0522D",
    woodDark: "#5D3A1A",
    thatch: "#DAA520",
    thatchDark: "#B8860B",
    bamboo: "#D2B48C",
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main floor / deck */}
      <mesh receiveShadow position={[0, 0.05, 0]}>
        <boxGeometry args={[14, 0.1, 12]} />
        <meshStandardMaterial color={colors.wood} roughness={0.8} />
      </mesh>

      {/* Deck planks (decorative lines) */}
      {[-5, -3, -1, 1, 3, 5].map((x, i) => (
        <mesh key={i} position={[x, 0.11, 0]} receiveShadow>
          <boxGeometry args={[0.05, 0.02, 12]} />
          <meshStandardMaterial color={colors.woodDark} roughness={0.9} />
        </mesh>
      ))}

      {/* Main support pillars */}
      {[
        [-6, 4], [-6, -4], [6, 4], [6, -4],
        [-6, 0], [6, 0],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 2, z]} castShadow>
          <cylinderGeometry args={[0.15, 0.18, 4, 8]} />
          <meshStandardMaterial color={colors.bamboo} roughness={0.7} />
        </mesh>
      ))}

      {/* Back wall */}
      <mesh position={[0, 2, -5.5]} castShadow receiveShadow>
        <boxGeometry args={[12, 4, 0.2]} />
        <meshStandardMaterial color={colors.bamboo} roughness={0.6} />
      </mesh>

      {/* Back wall horizontal slats */}
      {[0.5, 1.5, 2.5, 3.5].map((y, i) => (
        <mesh key={i} position={[0, y, -5.4]} castShadow>
          <boxGeometry args={[11.8, 0.08, 0.05]} />
          <meshStandardMaterial color={colors.woodDark} roughness={0.8} />
        </mesh>
      ))}

      {/* Partial side walls (bamboo style) */}
      {/* Left side */}
      <mesh position={[-6.5, 1.5, 0]} castShadow>
        <boxGeometry args={[0.2, 3, 8]} />
        <meshStandardMaterial color={colors.bamboo} roughness={0.6} transparent opacity={0.85} />
      </mesh>

      {/* Right side */}
      <mesh position={[6.5, 1.5, 0]} castShadow>
        <boxGeometry args={[0.2, 3, 8]} />
        <meshStandardMaterial color={colors.bamboo} roughness={0.6} transparent opacity={0.85} />
      </mesh>

      {/* Roof frame beams */}
      <mesh position={[0, 4.1, 0]}>
        <boxGeometry args={[14, 0.2, 0.2]} />
        <meshStandardMaterial color={colors.wood} roughness={0.7} />
      </mesh>
      <mesh position={[0, 4.1, -5]}>
        <boxGeometry args={[14, 0.2, 0.2]} />
        <meshStandardMaterial color={colors.wood} roughness={0.7} />
      </mesh>
      <mesh position={[0, 4.1, 5]}>
        <boxGeometry args={[14, 0.2, 0.2]} />
        <meshStandardMaterial color={colors.wood} roughness={0.7} />
      </mesh>

      {/* Cross beams */}
      {[-5, 0, 5].map((x, i) => (
        <mesh key={i} position={[x, 4.1, 0]}>
          <boxGeometry args={[0.15, 0.15, 12]} />
          <meshStandardMaterial color={colors.wood} roughness={0.7} />
        </mesh>
      ))}

      {/* Thatched roof - main section */}
      <mesh position={[0, 5, 0]} castShadow>
        <coneGeometry args={[10, 3, 4]} />
        <meshStandardMaterial
          color={colors.thatch}
          roughness={1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Roof overhang layers */}
      <mesh position={[0, 4.3, 0]}>
        <cylinderGeometry args={[9, 9.5, 0.3, 4]} />
        <meshStandardMaterial color={colors.thatchDark} roughness={1} />
      </mesh>

      {/* Decorative hanging lights */}
      {[[-3, 3.5, -2], [3, 3.5, -2], [0, 3.5, 2], [-4, 3.5, 2], [4, 3.5, 2]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          {/* Wire */}
          <mesh>
            <cylinderGeometry args={[0.01, 0.01, 0.5]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          {/* Bulb */}
          <mesh position={[0, -0.3, 0]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial
              color="#ffcc44"
              emissive="#ffaa00"
              emissiveIntensity={0.8}
            />
          </mesh>
          <pointLight position={[0, -0.3, 0]} intensity={0.3} color="#ffcc77" distance={3} />
        </group>
      ))}

      {/* Surfboard decorations on wall */}
      <group position={[0, 2.5, -5.3]} rotation={[0.1, 0, 0.2]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.15, 2, 4, 8]} />
          <meshStandardMaterial color="#ff6b6b" roughness={0.4} />
        </mesh>
        {/* Stripe */}
        <mesh position={[0, 0, 0.16]}>
          <capsuleGeometry args={[0.05, 1.8, 4, 8]} />
          <meshStandardMaterial color="#fff" roughness={0.4} />
        </mesh>
      </group>

      <group position={[3, 2.8, -5.3]} rotation={[0.1, 0, -0.15]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.15, 2.2, 4, 8]} />
          <meshStandardMaterial color="#4ecdc4" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.16]}>
          <capsuleGeometry args={[0.05, 2, 4, 8]} />
          <meshStandardMaterial color="#ffe66d" roughness={0.4} />
        </mesh>
      </group>

      {/* Tiki torches outside */}
      {[[-8, 5], [8, 5], [-8, 10], [8, 10]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          {/* Pole */}
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.1, 3, 6]} />
            <meshStandardMaterial color={colors.bamboo} roughness={0.8} />
          </mesh>
          {/* Flame holder */}
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.15, 0.1, 0.3, 6]} />
            <meshStandardMaterial color={colors.woodDark} roughness={0.9} />
          </mesh>
          {/* Flame glow */}
          <pointLight position={[0, 1.8, 0]} intensity={0.5} color="#ff6600" distance={4} />
          {/* Flame mesh */}
          <mesh position={[0, 1.9, 0]}>
            <coneGeometry args={[0.1, 0.3, 6]} />
            <meshStandardMaterial
              color="#ff4400"
              emissive="#ff6600"
              emissiveIntensity={1}
              transparent
              opacity={0.9}
            />
          </mesh>
        </group>
      ))}

      {/* Welcome sign */}
      <group position={[0, 3.8, 5.5]}>
        <mesh castShadow>
          <boxGeometry args={[3, 0.6, 0.1]} />
          <meshStandardMaterial color={colors.wood} roughness={0.7} />
        </mesh>
        {/* Text would go here - using a simple mesh for now */}
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[2.8, 0.5]} />
          <meshStandardMaterial color={colors.woodDark} roughness={0.8} />
        </mesh>
      </group>

      {/* Hanging plants */}
      {[[-5, 3.8, 3], [5, 3.8, 3]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <sphereGeometry args={[0.25, 8, 6]} />
            <meshStandardMaterial color="#654321" roughness={0.9} />
          </mesh>
          {/* Leaves */}
          {[0, 1, 2, 3, 4].map((j) => (
            <mesh
              key={j}
              position={[
                Math.cos(j * 1.25) * 0.2,
                -0.1,
                Math.sin(j * 1.25) * 0.2
              ]}
              rotation={[0.5, j * 1.25, 0]}
            >
              <planeGeometry args={[0.15, 0.4]} />
              <meshStandardMaterial color="#228B22" side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export default SurfShack;
