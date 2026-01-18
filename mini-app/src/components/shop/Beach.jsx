import { useMemo, useRef, useEffect } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

// Create procedural sand texture with improved detail
function createSandTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; // Higher resolution
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  // Base sand color with gradient variation
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, "#f4d58d");
  gradient.addColorStop(0.5, "#e6c870");
  gradient.addColorStop(1, "#f9e4a8");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);

  // Add multi-layer noise for better texture
  const imageData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imageData.data;

  // Fine grain noise
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 35;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));     // R
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.9)); // G
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.6)); // B
  }

  // Medium grain noise layer
  for (let y = 0; y < 1024; y += 4) {
    for (let x = 0; x < 1024; x += 4) {
      const idx = (y * 1024 + x) * 4;
      const noise = (Math.random() - 0.5) * 25;
      for (let dy = 0; dy < 4 && y + dy < 1024; dy++) {
        for (let dx = 0; dx < 4 && x + dx < 1024; dx++) {
          const pixelIdx = ((y + dy) * 1024 + (x + dx)) * 4;
          if (pixelIdx < data.length) {
            data[pixelIdx] = Math.min(255, Math.max(0, data[pixelIdx] + noise));
            data[pixelIdx + 1] = Math.min(255, Math.max(0, data[pixelIdx + 1] + noise * 0.85));
            data[pixelIdx + 2] = Math.min(255, Math.max(0, data[pixelIdx + 2] + noise * 0.55));
          }
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Add darker spots (pebbles/shells) with better blending
  for (let i = 0; i < 350; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const radius = 0.5 + Math.random() * 4;
    const darkness = Math.random() * 35;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${180 - darkness}, ${150 - darkness}, ${100 - darkness}, 0.7)`);
    gradient.addColorStop(1, `rgba(${180 - darkness}, ${150 - darkness}, ${100 - darkness}, 0)`);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

// Create wet sand texture with improved reflections
function createWetSandTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; // Higher resolution
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  // Darker, wet sand base with variation
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, "#8a6d35");
  gradient.addColorStop(0.5, "#a08040");
  gradient.addColorStop(1, "#9a7845");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);

  const imageData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imageData.data;

  // Subtle noise for texture
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 18;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.85));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.65));
  }

  ctx.putImageData(imageData, 0, 0);

  // Add water reflection spots with gradient for better realism
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const radius = 3 + Math.random() * 8;
    
    const reflectionGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const alpha = 0.15 + Math.random() * 0.25;
    reflectionGradient.addColorStop(0, `rgba(135, 206, 250, ${alpha})`);
    reflectionGradient.addColorStop(0.7, `rgba(135, 206, 240, ${alpha * 0.5})`);
    reflectionGradient.addColorStop(1, `rgba(135, 206, 235, 0)`);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = reflectionGradient;
    ctx.fill();
  }

  // Add wave-like patterns near the water edge
  for (let wave = 0; wave < 8; wave++) {
    const y = wave * 128 + Math.random() * 64;
    const amplitude = 20 + Math.random() * 15;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < 1024; x += 2) {
      const waveY = y + Math.sin(x * 0.02) * amplitude;
      ctx.lineTo(x, waveY);
    }
    ctx.lineTo(1024, y + amplitude);
    ctx.lineTo(1024, y - amplitude);
    ctx.closePath();
    ctx.fillStyle = `rgba(135, 200, 235, ${0.05 + Math.random() * 0.1})`;
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 4);
  return texture;
}

// Improved palm tree component with natural frond arrangement
function PalmTree({ position, rotation = 0, scale = 1, seed = 0 }) {
  const groupRef = useRef();

  // Use seed for consistent randomization
  const random = (min, max) => {
    const x = Math.sin(seed * 9999 + min * 100) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };

  // Generate frond data with varied angles
  const fronds = useMemo(() => {
    const frondData = [];
    const numFronds = 12; // More fronds for fuller tree

    for (let i = 0; i < numFronds; i++) {
      const angle = (i / numFronds) * Math.PI * 2 + random(-0.2, 0.2);
      const tilt = 0.3 + random(0.1, 0.4); // Varied tilt
      const droop = random(0.2, 0.5); // How much it droops
      const length = 2 + random(0, 0.8);
      const twist = random(-0.3, 0.3);

      frondData.push({ angle, tilt, droop, length, twist });
    }
    return frondData;
  }, [seed]);

  // Gentle sway animation
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      groupRef.current.rotation.z = Math.sin(time * 0.5 + seed) * 0.02;
      groupRef.current.rotation.x = Math.sin(time * 0.3 + seed * 2) * 0.01;
    }
  });

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <group ref={groupRef}>
        {/* Trunk - curved, higher poly */}
        <mesh castShadow position={[0, 2, 0]}>
          <cylinderGeometry args={[0.12, 0.22, 4, 12, 8]} />
          <meshStandardMaterial color="#6d4c2a" roughness={0.9} />
        </mesh>

        {/* Trunk rings/texture */}
        {[0.3, 0.7, 1.1, 1.5, 1.9, 2.3, 2.7, 3.1, 3.5].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <torusGeometry args={[0.18 - i * 0.006, 0.025, 8, 16]} />
            <meshStandardMaterial color="#5a3d1f" roughness={0.95} />
          </mesh>
        ))}

        {/* Palm fronds with natural varied directions */}
        {fronds.map((frond, i) => (
          <group
            key={i}
            position={[0, 4, 0]}
            rotation={[frond.tilt, frond.angle, frond.twist]}
          >
            {/* Main frond stem */}
            <mesh castShadow rotation={[frond.droop, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.04, frond.length, 6]} />
              <meshStandardMaterial color="#3d5a1f" roughness={0.8} />
            </mesh>

            {/* Frond leaves - multiple segments */}
            {[0.3, 0.5, 0.7, 0.9, 1.1, 1.3].map((offset, j) => (
              <group key={j} position={[0, offset * frond.length * 0.4, 0]} rotation={[frond.droop * offset, 0, 0]}>
                {/* Left leaf */}
                <mesh
                  position={[-0.15 - j * 0.02, 0, 0]}
                  rotation={[0.1, -0.3 - j * 0.1, -0.4 - j * 0.05]}
                  castShadow
                >
                  <planeGeometry args={[0.3 - j * 0.03, 0.08, 4, 1]} />
                  <meshStandardMaterial
                    color={j < 2 ? "#4a7c23" : "#3d6b1a"}
                    roughness={0.8}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                {/* Right leaf */}
                <mesh
                  position={[0.15 + j * 0.02, 0, 0]}
                  rotation={[0.1, 0.3 + j * 0.1, 0.4 + j * 0.05]}
                  castShadow
                >
                  <planeGeometry args={[0.3 - j * 0.03, 0.08, 4, 1]} />
                  <meshStandardMaterial
                    color={j < 2 ? "#4a7c23" : "#3d6b1a"}
                    roughness={0.8}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              </group>
            ))}

            {/* Frond tip */}
            <mesh
              position={[0, frond.length * 0.45, 0]}
              rotation={[frond.droop * 1.2, 0, 0]}
              castShadow
            >
              <coneGeometry args={[0.15, 0.4, 6]} />
              <meshStandardMaterial color="#3d6b1a" roughness={0.8} />
            </mesh>
          </group>
        ))}

        {/* Coconuts */}
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={i}
            castShadow
            position={[
              Math.cos(i * 1.8 + seed) * 0.18,
              3.7,
              Math.sin(i * 1.8 + seed) * 0.18,
            ]}
          >
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color="#5a3d1f" roughness={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Sandy beach with PS2-level detail
function Beach() {
  const seagullsRef = useRef([]);
  const sandTextureRef = useRef();
  const wetSandTextureRef = useRef();

  // Create textures once
  useEffect(() => {
    sandTextureRef.current = createSandTexture();
    wetSandTextureRef.current = createWetSandTexture();
  }, []);

  // Shoreline at Z = 25 (edge of movable space)
  const shorelineZ = 25;

  // Palm tree positions - moved relative to new shoreline
  const palmTrees = useMemo(() => [
    { position: [-10, 0, 18], rotation: 0.1, scale: 1, seed: 1 },
    { position: [10, 0, 16], rotation: -0.15, scale: 0.9, seed: 2 },
    { position: [-14, 0, 12], rotation: 0.2, scale: 1.1, seed: 3 },
    { position: [14, 0, 14], rotation: -0.1, scale: 0.85, seed: 4 },
    { position: [-8, 0, 8], rotation: 0.05, scale: 1.15, seed: 5 },
    { position: [8, 0, 10], rotation: -0.2, scale: 0.95, seed: 6 },
    { position: [-16, 0, 22], rotation: 0.15, scale: 1.05, seed: 7 },
    { position: [16, 0, 20], rotation: -0.08, scale: 0.88, seed: 8 },
  ], []);

  const shells = useMemo(() => {
    const items = [];
    for (let i = 0; i < 40; i++) {
      items.push({
        position: [
          (Math.random() - 0.5) * 35,
          0.02,
          Math.random() * 20 + 3,
        ],
        rotation: Math.random() * Math.PI * 2,
        scale: 0.02 + Math.random() * 0.03,
        color: ["#f5deb3", "#ffe4c4", "#ffefd5", "#deb887", "#d2b48c"][Math.floor(Math.random() * 5)],
      });
    }
    return items;
  }, []);

  const rocks = useMemo(() => [
    { position: [-8, 0.25, shorelineZ - 3], scale: [1, 0.6, 0.8], color: "#5a5a5a" },
    { position: [9, 0.2, shorelineZ - 4], scale: [0.6, 0.4, 0.5], color: "#6a6a6a" },
    { position: [-6, 0.15, shorelineZ - 2], scale: [0.4, 0.3, 0.35], color: "#707070" },
    { position: [12, 0.3, shorelineZ - 5], scale: [0.8, 0.5, 0.6], color: "#5a5a5a" },
    { position: [-12, 0.22, shorelineZ - 4], scale: [0.55, 0.35, 0.45], color: "#6a6a6a" },
  ], [shorelineZ]);

  const starfish = useMemo(() => [
    { position: [-4, 0.02, 18], rotation: 0.3, color: "#ff6347" },
    { position: [5, 0.02, 20], rotation: 1.2, color: "#ff7f50" },
    { position: [-2, 0.02, 22], rotation: 2.1, color: "#ffa07a" },
    { position: [8, 0.02, 19], rotation: 0.8, color: "#ff6347" },
    { position: [0, 0.02, 23], rotation: 1.5, color: "#ff8c00" },
  ], []);

  const driftwood = useMemo(() => [
    { position: [-5, 0.12, 15], rotation: [0.1, 0.5, 0], scale: [0.12, 0.12, 1.8] },
    { position: [7, 0.1, 17], rotation: [0, -0.3, 0.1], scale: [0.1, 0.1, 1.4] },
    { position: [-10, 0.15, shorelineZ - 3], rotation: [0.05, 1.2, 0], scale: [0.15, 0.15, 2.2] },
  ], [shorelineZ]);

  const seagulls = useMemo(() => [
    { basePosition: [5, 8, 12], offset: 0 },
    { basePosition: [-8, 10, 15], offset: 2 },
    { basePosition: [12, 7, 18], offset: 4 },
    { basePosition: [-3, 9, 20], offset: 6 },
  ], []);

  const beachGrass = useMemo(() => {
    const grass = [];
    for (let i = 0; i < 50; i++) {
      grass.push({
        position: [(Math.random() - 0.5) * 30, 0, Math.random() * 8 + 1],
        rotation: Math.random() * Math.PI * 2,
        scale: 0.5 + Math.random() * 0.5,
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
        ref.position.x = seagull.basePosition[0] + Math.sin(time * 0.5 + seagull.offset) * 6;
        ref.position.y = seagull.basePosition[1] + Math.sin(time * 0.8 + seagull.offset) * 1.5;
        ref.position.z = seagull.basePosition[2] + Math.cos(time * 0.3 + seagull.offset) * 4;
        ref.rotation.y = Math.sin(time * 0.5 + seagull.offset) * 0.5 + Math.PI;
        // Wing flap
        ref.children.forEach((child, j) => {
          if (j >= 3) { // Wings
            child.rotation.z = Math.sin(time * 8 + seagull.offset) * 0.3 * (j === 3 ? 1 : -1);
          }
        });
      }
    });
  });

  return (
    <group>
      {/* Main sand plane with texture - higher detail */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 10]} receiveShadow>
        <planeGeometry args={[50, 35, 80, 56]} />
        <meshStandardMaterial
          color="#f4d58d"
          roughness={0.95}
          metalness={0}
          map={sandTextureRef.current}
          aoMapIntensity={0.5}
        />
      </mesh>

      {/* Wet sand near water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, shorelineZ - 3]} receiveShadow>
        <planeGeometry args={[50, 8, 40, 12]} />
        <meshStandardMaterial
          color="#a08040"
          roughness={0.5}
          metalness={0.2}
          map={wetSandTextureRef.current}
          aoMapIntensity={0.4}
        />
      </mesh>

      {/* Sand dunes with more polygons */}
      {[[-12, 0.6, 0], [12, 0.5, 2], [-6, 0.4, -2], [8, 0.45, -1]].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <sphereGeometry args={[2.5 + i * 0.3, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e6c870" roughness={0.95} map={sandTextureRef.current} />
        </mesh>
      ))}

      {/* Beach grass clusters */}
      {beachGrass.map((grass, index) => (
        <group key={index} position={grass.position} rotation={[0, grass.rotation, 0]} scale={grass.scale}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <mesh
              key={i}
              position={[Math.sin(i * 0.9) * 0.12, 0.2, Math.cos(i * 0.9) * 0.12]}
              rotation={[Math.sin(i) * 0.25, i * 0.5, Math.cos(i) * 0.2]}
            >
              <coneGeometry args={[0.015, 0.45, 6]} />
              <meshStandardMaterial color="#7a9a45" roughness={0.9} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Palm trees with natural fronds */}
      {palmTrees.map((tree, index) => (
        <PalmTree key={index} {...tree} />
      ))}

      {/* Seashells - higher detail */}
      {shells.map((shell, index) => (
        <mesh key={index} position={shell.position} rotation={[0, shell.rotation, 0]} scale={shell.scale}>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={shell.color} roughness={0.5} />
        </mesh>
      ))}

      {/* Starfish - higher detail */}
      {starfish.map((star, index) => (
        <group key={index} position={star.position} rotation={[-Math.PI / 2, 0, star.rotation]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[Math.cos(i * Math.PI * 0.4) * 0.1, Math.sin(i * Math.PI * 0.4) * 0.1, 0]}>
              <coneGeometry args={[0.035, 0.14, 8]} />
              <meshStandardMaterial color={star.color} roughness={0.6} />
            </mesh>
          ))}
          <mesh>
            <cylinderGeometry args={[0.055, 0.055, 0.025, 16]} />
            <meshStandardMaterial color={star.color} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Rocks - higher detail */}
      {rocks.map((rock, index) => (
        <mesh key={index} position={rock.position} scale={rock.scale} castShadow>
          <dodecahedronGeometry args={[1, 2]} />
          <meshStandardMaterial color={rock.color} roughness={0.85} />
        </mesh>
      ))}

      {/* Driftwood - higher detail */}
      {driftwood.map((wood, index) => (
        <mesh key={index} position={wood.position} rotation={wood.rotation} scale={wood.scale} castShadow>
          <cylinderGeometry args={[1, 0.6, 1, 12, 4]} />
          <meshStandardMaterial color="#8b7355" roughness={0.9} />
        </mesh>
      ))}

      {/* Beach umbrella */}
      <group position={[6, 0, 12]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.04, 2.5, 12]} />
          <meshStandardMaterial color="#fff" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[0, 2.3, 0]} castShadow>
          <coneGeometry args={[1.5, 0.5, 16]} />
          <meshStandardMaterial color="#ff6b6b" roughness={0.5} />
        </mesh>
        <mesh position={[0, 2.35, 0]} rotation={[0, Math.PI / 16, 0]}>
          <coneGeometry args={[1.4, 0.45, 16]} />
          <meshStandardMaterial color="#fff" roughness={0.5} />
        </mesh>
      </group>

      {/* Beach chairs - higher detail */}
      {[[5, 0, 11], [-5, 0, 13]].map((pos, i) => (
        <group key={i} position={pos} rotation={[0, i * 0.6 + 0.3, 0]}>
          <mesh castShadow position={[0, 0.4, 0]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.75, 0.04, 1.4]} />
            <meshStandardMaterial color={i === 0 ? "#4ecdc4" : "#ff6b6b"} roughness={0.7} />
          </mesh>
          <mesh castShadow position={[0, 0.68, -0.48]} rotation={[-1.15, 0, 0]}>
            <boxGeometry args={[0.75, 0.04, 0.75]} />
            <meshStandardMaterial color={i === 0 ? "#4ecdc4" : "#ff6b6b"} roughness={0.7} />
          </mesh>
          {[[-0.32, 0.2, 0.45], [0.32, 0.2, 0.45], [-0.32, 0.2, -0.28], [0.32, 0.2, -0.28]].map((legPos, j) => (
            <mesh key={j} position={legPos}>
              <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
              <meshStandardMaterial color="#e0e0e0" roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Beach towels */}
      {[[5.5, 0.02, 11.5], [-4, 0.02, 12.5]].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[-Math.PI / 2, 0, i * 0.5]} receiveShadow>
          <planeGeometry args={[1.4, 1.9, 4, 4]} />
          <meshStandardMaterial color={["#4ecdc4", "#ff6b6b"][i]} roughness={0.85} />
        </mesh>
      ))}

      {/* Surfboards */}
      {[
        { pos: [-8, 0.25, 14], rot: [0.1, 0.5, -1.4], colors: ["#ffe66d", "#ff6b6b"] },
        { pos: [9, 0.2, 12], rot: [0.15, -0.8, -1.5], colors: ["#4ecdc4", "#fff"] },
      ].map((board, i) => (
        <group key={i} position={board.pos} rotation={board.rot}>
          <mesh castShadow>
            <capsuleGeometry args={[0.18, 2.4, 8, 16]} />
            <meshStandardMaterial color={board.colors[0]} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.19]}>
            <capsuleGeometry args={[0.07, 2.2, 6, 12]} />
            <meshStandardMaterial color={board.colors[1]} roughness={0.35} />
          </mesh>
        </group>
      ))}

      {/* Sand castle - higher detail */}
      <group position={[2, 0, 18]}>
        <mesh castShadow position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.28, 0.35, 0.7, 16]} />
          <meshStandardMaterial color="#e6c870" roughness={0.95} />
        </mesh>
        <mesh castShadow position={[0, 0.75, 0]}>
          <coneGeometry args={[0.32, 0.25, 16]} />
          <meshStandardMaterial color="#d4a853" roughness={0.95} />
        </mesh>
        {[[0.4, 0.22, 0.4], [-0.4, 0.22, 0.4], [0.4, 0.22, -0.4], [-0.4, 0.22, -0.4]].map((pos, i) => (
          <group key={i} position={pos}>
            <mesh castShadow>
              <cylinderGeometry args={[0.14, 0.17, 0.44, 12]} />
              <meshStandardMaterial color="#e6c870" roughness={0.95} />
            </mesh>
            <mesh castShadow position={[0, 0.28, 0]}>
              <coneGeometry args={[0.16, 0.14, 12]} />
              <meshStandardMaterial color="#d4a853" roughness={0.95} />
            </mesh>
          </group>
        ))}
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rot, i) => (
          <mesh key={i} position={[Math.sin(rot) * 0.28, 0.12, Math.cos(rot) * 0.28]} rotation={[0, rot, 0]}>
            <boxGeometry args={[0.35, 0.24, 0.06]} />
            <meshStandardMaterial color="#e6c870" roughness={0.95} />
          </mesh>
        ))}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.55, 0.72, 24]} />
          <meshStandardMaterial color="#5dade2" roughness={0.25} />
        </mesh>
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.35, 6]} />
          <meshStandardMaterial color="#6d4c2a" />
        </mesh>
        <mesh position={[0.09, 1.05, 0]} rotation={[0, 0, 0.12]}>
          <planeGeometry args={[0.18, 0.12]} />
          <meshStandardMaterial color="#ff6b6b" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Beach ball */}
      <mesh position={[4, 0.28, 14]} castShadow>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial color="#ff6b6b" roughness={0.4} />
      </mesh>

      {/* Bucket and spade */}
      <group position={[1.5, 0, 19]}>
        <mesh castShadow position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.14, 0.1, 0.24, 16]} />
          <meshStandardMaterial color="#4ecdc4" roughness={0.5} />
        </mesh>
        <mesh position={[0.22, 0.06, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.16, 0.025, 0.12]} />
          <meshStandardMaterial color="#ffe66d" roughness={0.5} />
        </mesh>
        <mesh position={[0.35, 0.06, 0]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.015, 0.015, 0.18, 8]} />
          <meshStandardMaterial color="#6d4c2a" roughness={0.75} />
        </mesh>
      </group>

      {/* Seagulls - higher detail with animated wings */}
      {seagulls.map((_, index) => (
        <group key={index} ref={(el) => (seagullsRef.current[index] = el)}>
          <mesh>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshStandardMaterial color="#f8f8f8" roughness={0.7} />
          </mesh>
          <mesh position={[0.16, 0.04, 0]}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshStandardMaterial color="#f8f8f8" roughness={0.7} />
          </mesh>
          <mesh position={[0.26, 0.02, 0]} rotation={[0, 0, -0.25]}>
            <coneGeometry args={[0.025, 0.1, 6]} />
            <meshStandardMaterial color="#ffa500" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.04, 0.16]} rotation={[0.25, 0, 0.4]}>
            <boxGeometry args={[0.14, 0.02, 0.28]} />
            <meshStandardMaterial color="#e8e8e8" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.04, -0.16]} rotation={[-0.25, 0, -0.4]}>
            <boxGeometry args={[0.14, 0.02, 0.28]} />
            <meshStandardMaterial color="#e8e8e8" roughness={0.75} />
          </mesh>
        </group>
      ))}

      {/* Lifeguard tower */}
      <group position={[-14, 0, 6]}>
        <mesh castShadow position={[0, 2.1, 0]}>
          <boxGeometry args={[1.6, 0.12, 1.6]} />
          <meshStandardMaterial color="#6d4c2a" roughness={0.75} />
        </mesh>
        {[[-0.65, 1.05, -0.65], [0.65, 1.05, -0.65], [-0.65, 1.05, 0.65], [0.65, 1.05, 0.65]].map((pos, i) => (
          <mesh key={i} position={pos} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 2.1, 10]} />
            <meshStandardMaterial color="#6d4c2a" roughness={0.75} />
          </mesh>
        ))}
        <mesh castShadow position={[0, 2.7, 0]}>
          <boxGeometry args={[1.4, 1.1, 1.4]} />
          <meshStandardMaterial color="#f5deb3" roughness={0.65} />
        </mesh>
        <mesh castShadow position={[0, 3.45, 0]}>
          <coneGeometry args={[1.2, 0.55, 4]} />
          <meshStandardMaterial color="#ff6b6b" roughness={0.65} />
        </mesh>
        <mesh position={[0, 1.05, 0.85]}>
          <boxGeometry args={[0.45, 2.1, 0.06]} />
          <meshStandardMaterial color="#6d4c2a" roughness={0.75} />
        </mesh>
      </group>

      {/* Distant boats */}
      {[[18, 0.4, shorelineZ + 12], [-20, 0.35, shorelineZ + 15]].map((pos, i) => (
        <group key={i} position={pos}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.18, 0.9, 8, 12]} />
            <meshStandardMaterial color={i === 0 ? "#fff" : "#4ecdc4"} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.65, 8]} />
            <meshStandardMaterial color="#6d4c2a" roughness={0.75} />
          </mesh>
          <mesh position={[0.12, 0.55, 0]} rotation={[0, 0, 0.22]}>
            <planeGeometry args={[0.35, 0.45]} />
            <meshStandardMaterial color="#fff" side={THREE.DoubleSide} roughness={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default Beach;
