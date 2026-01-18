import { useMemo } from "react";
import * as THREE from "three";

// Sandy beach with some decorative elements
function Beach() {
  // Generate random positions for beach items
  const palmTrees = useMemo(() => {
    return [
      { position: [-12, 0, 8], rotation: 0.1, scale: 1 },
      { position: [12, 0, 6], rotation: -0.15, scale: 0.9 },
      { position: [-15, 0, 15], rotation: 0.2, scale: 1.1 },
      { position: [15, 0, 12], rotation: -0.1, scale: 0.85 },
    ];
  }, []);

  const shells = useMemo(() => {
    const items = [];
    for (let i = 0; i < 15; i++) {
      items.push({
        position: [
          (Math.random() - 0.5) * 30,
          0.02,
          Math.random() * 20 + 8,
        ],
        rotation: Math.random() * Math.PI * 2,
        scale: 0.05 + Math.random() * 0.05,
        color: Math.random() > 0.5 ? "#f5deb3" : "#ffe4c4",
      });
    }
    return items;
  }, []);

  const rocks = useMemo(() => {
    return [
      { position: [-10, 0.2, 18], scale: [0.8, 0.5, 0.6] },
      { position: [11, 0.15, 16], scale: [0.5, 0.3, 0.4] },
      { position: [-8, 0.1, 20], scale: [0.3, 0.2, 0.25] },
    ];
  }, []);

  return (
    <group>
      {/* Main sand plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 15]}
        receiveShadow
      >
        <planeGeometry args={[50, 40]} />
        <meshStandardMaterial
          color="#f4d58d"
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Wet sand near water */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 28]}
        receiveShadow
      >
        <planeGeometry args={[50, 10]} />
        <meshStandardMaterial
          color="#c9a227"
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Palm trees */}
      {palmTrees.map((tree, index) => (
        <group
          key={index}
          position={tree.position}
          rotation={[0, tree.rotation, 0]}
          scale={tree.scale}
        >
          {/* Trunk */}
          <mesh castShadow position={[0, 2, 0]}>
            <cylinderGeometry args={[0.15, 0.25, 4, 8]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>

          {/* Trunk segments */}
          {[0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((y, i) => (
            <mesh key={i} position={[0, y, 0]}>
              <torusGeometry args={[0.18 - i * 0.01, 0.03, 4, 8]} />
              <meshStandardMaterial color="#654321" roughness={0.9} />
            </mesh>
          ))}

          {/* Palm fronds */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <group
              key={i}
              position={[0, 4, 0]}
              rotation={[0.4, (i * Math.PI) / 4, 0.2]}
            >
              <mesh castShadow>
                <coneGeometry args={[0.3, 2.5, 4]} />
                <meshStandardMaterial
                  color="#228B22"
                  roughness={0.8}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          ))}

          {/* Coconuts */}
          {[0, 1, 2].map((i) => (
            <mesh
              key={i}
              castShadow
              position={[
                Math.cos(i * 2) * 0.15,
                3.8,
                Math.sin(i * 2) * 0.15,
              ]}
            >
              <sphereGeometry args={[0.12, 8, 8]} />
              <meshStandardMaterial color="#8B4513" roughness={0.7} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Seashells */}
      {shells.map((shell, index) => (
        <mesh
          key={index}
          position={shell.position}
          rotation={[0, shell.rotation, 0]}
          scale={shell.scale}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={shell.color} roughness={0.5} />
        </mesh>
      ))}

      {/* Rocks */}
      {rocks.map((rock, index) => (
        <mesh
          key={index}
          position={rock.position}
          scale={rock.scale}
          castShadow
        >
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#696969" roughness={0.9} />
        </mesh>
      ))}

      {/* Beach umbrella */}
      <group position={[8, 0, 10]}>
        {/* Pole */}
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.05, 2.5, 8]} />
          <meshStandardMaterial color="#fff" metalness={0.3} roughness={0.5} />
        </mesh>
        {/* Umbrella top */}
        <mesh position={[0, 2.3, 0]} castShadow>
          <coneGeometry args={[1.5, 0.5, 8]} />
          <meshStandardMaterial color="#ff6b6b" roughness={0.6} />
        </mesh>
        {/* Stripes */}
        <mesh position={[0, 2.35, 0]} rotation={[0, Math.PI / 8, 0]}>
          <coneGeometry args={[1.4, 0.45, 8]} />
          <meshStandardMaterial color="#fff" roughness={0.6} />
        </mesh>
      </group>

      {/* Beach towel */}
      <mesh
        position={[6.5, 0.02, 9]}
        rotation={[-Math.PI / 2, 0, 0.3]}
        receiveShadow
      >
        <planeGeometry args={[1.5, 2]} />
        <meshStandardMaterial color="#4ecdc4" roughness={0.9} />
      </mesh>

      {/* Surfboard on beach */}
      <group position={[-10, 0.3, 10]} rotation={[0.1, 0.5, -1.4]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.2, 2.5, 4, 12]} />
          <meshStandardMaterial color="#ffe66d" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.21]}>
          <capsuleGeometry args={[0.08, 2.3, 4, 8]} />
          <meshStandardMaterial color="#ff6b6b" roughness={0.4} />
        </mesh>
      </group>

      {/* Beach ball */}
      <mesh position={[5, 0.3, 12]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#ff6b6b" roughness={0.5} />
      </mesh>
    </group>
  );
}

export default Beach;
