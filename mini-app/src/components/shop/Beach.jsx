import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Sandy beach with detailed low-poly decorative elements
function Beach() {
  const seagullsRef = useRef([]);

  // Generate random positions for beach items
  const palmTrees = useMemo(() => {
    return [
      { position: [-12, 0, 8], rotation: 0.1, scale: 1 },
      { position: [12, 0, 6], rotation: -0.15, scale: 0.9 },
      { position: [-15, 0, 15], rotation: 0.2, scale: 1.1 },
      { position: [15, 0, 12], rotation: -0.1, scale: 0.85 },
      { position: [-18, 0, 20], rotation: 0.05, scale: 1.2 },
      { position: [18, 0, 18], rotation: -0.2, scale: 0.95 },
    ];
  }, []);

  const shells = useMemo(() => {
    const items = [];
    for (let i = 0; i < 25; i++) {
      items.push({
        position: [
          (Math.random() - 0.5) * 40,
          0.02,
          Math.random() * 25 + 5,
        ],
        rotation: Math.random() * Math.PI * 2,
        scale: 0.03 + Math.random() * 0.04,
        color: ["#f5deb3", "#ffe4c4", "#ffefd5", "#deb887"][Math.floor(Math.random() * 4)],
      });
    }
    return items;
  }, []);

  const rocks = useMemo(() => {
    return [
      { position: [-10, 0.2, 18], scale: [0.8, 0.5, 0.6], color: "#696969" },
      { position: [11, 0.15, 16], scale: [0.5, 0.3, 0.4], color: "#808080" },
      { position: [-8, 0.1, 20], scale: [0.3, 0.2, 0.25], color: "#778899" },
      { position: [14, 0.25, 22], scale: [0.6, 0.4, 0.5], color: "#708090" },
      { position: [-14, 0.18, 24], scale: [0.45, 0.3, 0.35], color: "#696969" },
      { position: [0, 0.15, 26], scale: [0.35, 0.25, 0.3], color: "#808080" },
    ];
  }, []);

  const starfish = useMemo(() => {
    return [
      { position: [-5, 0.02, 15], rotation: 0.3, color: "#ff6347" },
      { position: [7, 0.02, 18], rotation: 1.2, color: "#ff7f50" },
      { position: [-3, 0.02, 22], rotation: 2.1, color: "#ffa07a" },
      { position: [10, 0.02, 20], rotation: 0.8, color: "#ff6347" },
    ];
  }, []);

  const driftwood = useMemo(() => {
    return [
      { position: [-6, 0.1, 12], rotation: [0.1, 0.5, 0], scale: [0.15, 0.15, 1.5] },
      { position: [9, 0.08, 14], rotation: [0, -0.3, 0.1], scale: [0.12, 0.12, 1.2] },
      { position: [-12, 0.12, 20], rotation: [0.05, 1.2, 0], scale: [0.18, 0.18, 2] },
    ];
  }, []);

  const seagulls = useMemo(() => {
    return [
      { basePosition: [5, 8, 15], offset: 0 },
      { basePosition: [-8, 10, 20], offset: 2 },
      { basePosition: [12, 7, 25], offset: 4 },
    ];
  }, []);

  const beachGrass = useMemo(() => {
    const grass = [];
    for (let i = 0; i < 30; i++) {
      grass.push({
        position: [
          (Math.random() - 0.5) * 35,
          0,
          Math.random() * 5 + 3,
        ],
        rotation: Math.random() * Math.PI * 2,
        scale: 0.6 + Math.random() * 0.4,
      });
    }
    return grass;
  }, []);

  // Animate seagulls
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    seagullsRef.current.forEach((ref, i) => {
      if (ref) {
        const seagull = seagulls[i];
        ref.position.x = seagull.basePosition[0] + Math.sin(time * 0.5 + seagull.offset) * 5;
        ref.position.y = seagull.basePosition[1] + Math.sin(time * 0.8 + seagull.offset) * 1;
        ref.position.z = seagull.basePosition[2] + Math.cos(time * 0.3 + seagull.offset) * 3;
        ref.rotation.y = Math.sin(time * 0.5 + seagull.offset) * 0.5;
      }
    });
  });

  return (
    <group>
      {/* Main sand plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 15]}
        receiveShadow
      >
        <planeGeometry args={[60, 50]} />
        <meshStandardMaterial color="#f4d58d" roughness={1} metalness={0} />
      </mesh>

      {/* Wet sand near water */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 32]}
        receiveShadow
      >
        <planeGeometry args={[60, 15]} />
        <meshStandardMaterial color="#c9a227" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Sand dunes */}
      {[[-15, 0.5, 2], [15, 0.4, 3], [-8, 0.3, 0], [10, 0.35, 1]].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <sphereGeometry args={[2 + i * 0.3, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e6c870" roughness={1} />
        </mesh>
      ))}

      {/* Beach grass clusters */}
      {beachGrass.map((grass, index) => (
        <group
          key={index}
          position={grass.position}
          rotation={[0, grass.rotation, 0]}
          scale={grass.scale}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh
              key={i}
              position={[Math.sin(i * 1.2) * 0.1, 0.25, Math.cos(i * 1.2) * 0.1]}
              rotation={[Math.sin(i) * 0.2, 0, Math.cos(i) * 0.2]}
            >
              <coneGeometry args={[0.02, 0.5, 4]} />
              <meshStandardMaterial color="#90a955" roughness={0.9} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}

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
                <meshStandardMaterial color="#228B22" roughness={0.8} side={THREE.DoubleSide} />
              </mesh>
            </group>
          ))}

          {/* Coconuts */}
          {[0, 1, 2].map((i) => (
            <mesh
              key={i}
              castShadow
              position={[Math.cos(i * 2) * 0.15, 3.8, Math.sin(i * 2) * 0.15]}
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

      {/* Starfish */}
      {starfish.map((star, index) => (
        <group key={index} position={star.position} rotation={[-Math.PI / 2, 0, star.rotation]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[Math.cos(i * Math.PI * 0.4) * 0.12, Math.sin(i * Math.PI * 0.4) * 0.12, 0]}>
              <coneGeometry args={[0.04, 0.15, 4]} />
              <meshStandardMaterial color={star.color} roughness={0.7} />
            </mesh>
          ))}
          <mesh>
            <cylinderGeometry args={[0.06, 0.06, 0.02, 8]} />
            <meshStandardMaterial color={star.color} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Rocks */}
      {rocks.map((rock, index) => (
        <mesh key={index} position={rock.position} scale={rock.scale} castShadow>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={rock.color} roughness={0.9} />
        </mesh>
      ))}

      {/* Driftwood */}
      {driftwood.map((wood, index) => (
        <mesh key={index} position={wood.position} rotation={wood.rotation} scale={wood.scale} castShadow>
          <cylinderGeometry args={[1, 0.7, 1, 6]} />
          <meshStandardMaterial color="#a0826d" roughness={0.95} />
        </mesh>
      ))}

      {/* Beach umbrella */}
      <group position={[8, 0, 10]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.05, 2.5, 8]} />
          <meshStandardMaterial color="#fff" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 2.3, 0]} castShadow>
          <coneGeometry args={[1.5, 0.5, 8]} />
          <meshStandardMaterial color="#ff6b6b" roughness={0.6} />
        </mesh>
        <mesh position={[0, 2.35, 0]} rotation={[0, Math.PI / 8, 0]}>
          <coneGeometry args={[1.4, 0.45, 8]} />
          <meshStandardMaterial color="#fff" roughness={0.6} />
        </mesh>
      </group>

      {/* Beach chairs */}
      {[[6, 0, 9], [-7, 0, 11]].map((pos, i) => (
        <group key={i} position={pos} rotation={[0, i * 0.5 + 0.2, 0]}>
          {/* Chair frame */}
          <mesh castShadow position={[0, 0.4, 0]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.8, 0.05, 1.5]} />
            <meshStandardMaterial color={i === 0 ? "#4ecdc4" : "#ff6b6b"} roughness={0.8} />
          </mesh>
          {/* Back rest */}
          <mesh castShadow position={[0, 0.7, -0.5]} rotation={[-1.2, 0, 0]}>
            <boxGeometry args={[0.8, 0.05, 0.8]} />
            <meshStandardMaterial color={i === 0 ? "#4ecdc4" : "#ff6b6b"} roughness={0.8} />
          </mesh>
          {/* Legs */}
          {[[-0.35, 0.2, 0.5], [0.35, 0.2, 0.5], [-0.35, 0.2, -0.3], [0.35, 0.2, -0.3]].map((legPos, j) => (
            <mesh key={j} position={legPos}>
              <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
              <meshStandardMaterial color="#fff" roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Beach towels */}
      {[[6.5, 0.02, 9], [-6, 0.02, 10.5], [4, 0.02, 15]].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[-Math.PI / 2, 0, i * 0.4]} receiveShadow>
          <planeGeometry args={[1.5, 2]} />
          <meshStandardMaterial color={["#4ecdc4", "#ff6b6b", "#ffe66d"][i]} roughness={0.9} />
        </mesh>
      ))}

      {/* Surfboards */}
      {[
        { pos: [-10, 0.3, 10], rot: [0.1, 0.5, -1.4], colors: ["#ffe66d", "#ff6b6b"] },
        { pos: [11, 0.25, 8], rot: [0.15, -0.8, -1.5], colors: ["#4ecdc4", "#fff"] },
        { pos: [-14, 0.2, 14], rot: [0.05, 0.2, -1.55], colors: ["#ff6b6b", "#fff"] },
      ].map((board, i) => (
        <group key={i} position={board.pos} rotation={board.rot}>
          <mesh castShadow>
            <capsuleGeometry args={[0.2, 2.5, 4, 12]} />
            <meshStandardMaterial color={board.colors[0]} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.21]}>
            <capsuleGeometry args={[0.08, 2.3, 4, 8]} />
            <meshStandardMaterial color={board.colors[1]} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Sand castle */}
      <group position={[3, 0, 16]}>
        {/* Main tower */}
        <mesh castShadow position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.25, 0.3, 0.6, 8]} />
          <meshStandardMaterial color="#e6c870" roughness={1} />
        </mesh>
        {/* Tower top */}
        <mesh castShadow position={[0, 0.65, 0]}>
          <coneGeometry args={[0.28, 0.2, 8]} />
          <meshStandardMaterial color="#d4a853" roughness={1} />
        </mesh>
        {/* Side towers */}
        {[[0.35, 0.2, 0.35], [-0.35, 0.2, 0.35], [0.35, 0.2, -0.35], [-0.35, 0.2, -0.35]].map((pos, i) => (
          <group key={i} position={pos}>
            <mesh castShadow>
              <cylinderGeometry args={[0.12, 0.15, 0.4, 6]} />
              <meshStandardMaterial color="#e6c870" roughness={1} />
            </mesh>
            <mesh castShadow position={[0, 0.25, 0]}>
              <coneGeometry args={[0.14, 0.12, 6]} />
              <meshStandardMaterial color="#d4a853" roughness={1} />
            </mesh>
          </group>
        ))}
        {/* Walls */}
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rot, i) => (
          <mesh key={i} position={[Math.sin(rot) * 0.25, 0.1, Math.cos(rot) * 0.25]} rotation={[0, rot, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.05]} />
            <meshStandardMaterial color="#e6c870" roughness={1} />
          </mesh>
        ))}
        {/* Moat */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.5, 0.65, 16]} />
          <meshStandardMaterial color="#5dade2" roughness={0.3} />
        </mesh>
        {/* Flag */}
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.3, 4]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        <mesh position={[0.08, 0.95, 0]} rotation={[0, 0, 0.1]}>
          <planeGeometry args={[0.15, 0.1]} />
          <meshStandardMaterial color="#ff6b6b" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Beach ball */}
      <mesh position={[5, 0.3, 12]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#ff6b6b" roughness={0.5} />
      </mesh>

      {/* Bucket and spade */}
      <group position={[2, 0, 17]}>
        <mesh castShadow position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.12, 0.08, 0.2, 8]} />
          <meshStandardMaterial color="#4ecdc4" roughness={0.6} />
        </mesh>
        <mesh position={[0.2, 0.05, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.15, 0.02, 0.1]} />
          <meshStandardMaterial color="#ffe66d" roughness={0.6} />
        </mesh>
        <mesh position={[0.32, 0.05, 0]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.01, 0.01, 0.15, 4]} />
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </mesh>
      </group>

      {/* Seagulls */}
      {seagulls.map((_, index) => (
        <group key={index} ref={(el) => (seagullsRef.current[index] = el)}>
          {/* Body */}
          <mesh>
            <sphereGeometry args={[0.15, 6, 6]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.8} />
          </mesh>
          {/* Head */}
          <mesh position={[0.15, 0.05, 0]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.8} />
          </mesh>
          {/* Beak */}
          <mesh position={[0.25, 0.02, 0]} rotation={[0, 0, -0.2]}>
            <coneGeometry args={[0.02, 0.08, 4]} />
            <meshStandardMaterial color="#ffa500" roughness={0.6} />
          </mesh>
          {/* Wings */}
          <mesh position={[0, 0.05, 0.18]} rotation={[0.3, 0, 0.5]}>
            <boxGeometry args={[0.15, 0.02, 0.25]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.05, -0.18]} rotation={[-0.3, 0, -0.5]}>
            <boxGeometry args={[0.15, 0.02, 0.25]} />
            <meshStandardMaterial color="#e0e0e0" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Lifeguard tower in the distance */}
      <group position={[-18, 0, 22]}>
        {/* Platform */}
        <mesh castShadow position={[0, 2, 0]}>
          <boxGeometry args={[1.5, 0.1, 1.5]} />
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </mesh>
        {/* Legs */}
        {[[-0.6, 1, -0.6], [0.6, 1, -0.6], [-0.6, 1, 0.6], [0.6, 1, 0.6]].map((pos, i) => (
          <mesh key={i} position={pos} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 2, 6]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
        ))}
        {/* Cabin */}
        <mesh castShadow position={[0, 2.6, 0]}>
          <boxGeometry args={[1.3, 1, 1.3]} />
          <meshStandardMaterial color="#f5deb3" roughness={0.7} />
        </mesh>
        {/* Roof */}
        <mesh castShadow position={[0, 3.3, 0]}>
          <coneGeometry args={[1.1, 0.5, 4]} />
          <meshStandardMaterial color="#ff6b6b" roughness={0.7} />
        </mesh>
        {/* Ladder */}
        <mesh position={[0, 1, 0.8]}>
          <boxGeometry args={[0.4, 2, 0.05]} />
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </mesh>
      </group>

      {/* Distant boats */}
      {[[20, 0.5, 35], [-22, 0.4, 38]].map((pos, i) => (
        <group key={i} position={pos}>
          <mesh castShadow>
            <capsuleGeometry args={[0.15, 0.8, 4, 8]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color={i === 0 ? "#fff" : "#4ecdc4"} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 4]} />
            <meshStandardMaterial color="#8B4513" roughness={0.8} />
          </mesh>
          <mesh position={[0.1, 0.5, 0]} rotation={[0, 0, 0.2]}>
            <planeGeometry args={[0.3, 0.4]} />
            <meshStandardMaterial color="#fff" side={THREE.DoubleSide} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default Beach;
