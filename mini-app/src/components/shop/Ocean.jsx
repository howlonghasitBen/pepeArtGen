import { useRef, useMemo } from "react";
import { useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";

// PS2-style ocean with animated wave loops
function Ocean({ isMobile = false }) {
  const oceanRef = useRef();
  const foamRef = useRef();
  const waveGeometryRef = useRef();
  const foamGeometryRef = useRef();

  // Shoreline position (at edge of movable space, Z = 25)
  const shorelineZ = 25;

  // Reduce polygon count and computation frequency on mobile
  const oceanSegments = isMobile ? [40, 30] : [120, 80]; // Mobile: 1,200 vertices vs Desktop: 9,600
  const foamSegments = isMobile ? [30, 4] : [60, 8];
  const computeNormalsInterval = isMobile ? 3 : 1; // Only compute normals every 3rd frame on mobile
  let frameCount = 0;

  // Create wave animation with multiple layers
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    frameCount++;

    // Animate main ocean surface
    if (waveGeometryRef.current) {
      const positions = waveGeometryRef.current.attributes.position;
      const originalPositions = waveGeometryRef.current.userData.originalPositions;

      if (!originalPositions) {
        // Store original positions on first frame
        waveGeometryRef.current.userData.originalPositions = positions.array.slice();
      } else {
        for (let i = 0; i < positions.count; i++) {
          const x = originalPositions[i * 3];
          const z = originalPositions[i * 3 + 2];

          // Multiple wave frequencies for realistic ocean
          const wave1 = Math.sin(x * 0.15 + time * 1.2) * 0.4;
          const wave2 = Math.sin(z * 0.1 + time * 0.8) * 0.3;
          const wave3 = Math.sin((x + z) * 0.08 + time * 1.5) * 0.2;
          const wave4 = Math.sin(x * 0.3 - time * 2.0) * 0.15;
          const wave5 = Math.cos(z * 0.2 + time * 0.6) * 0.1;

          // Combine waves
          const totalWave = wave1 + wave2 + wave3 + wave4 + wave5;

          // Waves get smaller near shore
          const distanceFromShore = Math.max(0, z - (-30));
          const shoreFactor = Math.min(1, distanceFromShore / 20);

          positions.setY(i, totalWave * shoreFactor);
        }

        positions.needsUpdate = true;
        // Only compute vertex normals on interval (expensive operation)
        if (frameCount % computeNormalsInterval === 0) {
          waveGeometryRef.current.computeVertexNormals();
        }
      }
    }

    // Animate foam layer (moves toward shore in a loop)
    if (foamRef.current && foamGeometryRef.current) {
      const foamPositions = foamGeometryRef.current.attributes.position;
      const originalFoamPositions = foamGeometryRef.current.userData.originalPositions;

      if (!originalFoamPositions) {
        foamGeometryRef.current.userData.originalPositions = foamPositions.array.slice();
      } else {
        for (let i = 0; i < foamPositions.count; i++) {
          const x = originalFoamPositions[i * 3];
          const baseZ = originalFoamPositions[i * 3 + 2];

          // Foam wave animation - moves toward shore and recedes
          const wavePhase = (time * 0.5) % (Math.PI * 2);
          const foamWave = Math.sin(x * 0.2 + wavePhase) * 0.3;
          const foamHeight = Math.sin(wavePhase + x * 0.1) * 0.15 + 0.1;

          foamPositions.setY(i, foamHeight + foamWave * 0.1);
          foamPositions.setZ(i, baseZ + Math.sin(wavePhase) * 1.5);
        }

        foamPositions.needsUpdate = true;
        // Only compute vertex normals on interval (expensive operation)
        if (frameCount % computeNormalsInterval === 0) {
          foamGeometryRef.current.computeVertexNormals();
        }
      }

      // Animate foam opacity for breaking wave effect
      if (foamRef.current.material) {
        const wavePhase = (time * 0.5) % (Math.PI * 2);
        foamRef.current.material.opacity = 0.3 + Math.sin(wavePhase) * 0.2;
      }
    }
  });

  // Ocean material with better PS2-style appearance
  const oceanMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x1e90ff),
      roughness: 0.2,
      metalness: 0.7,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      envMapIntensity: 1.5,
    });
  }, []);

  const deepOceanMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x0a4a7a),
      roughness: 0.4,
      metalness: 0.5,
      side: THREE.DoubleSide,
    });
  }, []);

  const foamMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xffffff),
      roughness: 0.9,
      metalness: 0,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
  }, []);

  return (
    <group position={[0, 0, shorelineZ]}>
      {/* Main animated ocean surface - high poly for smooth waves */}
      <mesh
        ref={oceanRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 15]}
        receiveShadow
      >
        <planeGeometry
          ref={waveGeometryRef}
          args={[120, 80, ...oceanSegments]} // Adaptive polygon count: 1200 vertices mobile, 9600 desktop
        />
        <primitive object={oceanMaterial} />
      </mesh>

      {/* Animated foam/whitecaps near shore */}
      <mesh
        ref={foamRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, -2]}
      >
        <planeGeometry
          ref={foamGeometryRef}
          args={[120, 8, ...foamSegments]} // Foam strip with mobile optimization
        />
        <primitive object={foamMaterial} />
      </mesh>

      {/* Secondary foam layer */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
      >
        <planeGeometry args={[120, 4, 30, 4]} />
        <meshStandardMaterial
          color="#e0f0ff"
          transparent
          opacity={0.3}
          roughness={0.9}
        />
      </mesh>

      {/* Deep ocean in the distance */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 40]}
      >
        <planeGeometry args={[150, 60, 20, 20]} />
        <primitive object={deepOceanMaterial} />
      </mesh>

      {/* Horizon fade */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.6, 80]}
      >
        <planeGeometry args={[200, 40]} />
        <meshStandardMaterial
          color="#87ceeb"
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Breaking wave crests */}
      {[-20, 0, 20].map((x, i) => (
        <mesh
          key={i}
          position={[x, 0.1, -1 + Math.sin(i) * 0.5]}
          rotation={[-Math.PI / 2, 0, Math.random() * 0.2]}
        >
          <ringGeometry args={[0, 2 + i * 0.3, 16, 2, 0, Math.PI]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.4}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}

export default Ocean;
