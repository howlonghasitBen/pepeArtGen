import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Stylized low-poly ocean with wave animation
function Ocean() {
  const meshRef = useRef();
  const geometryRef = useRef();

  // Create wave animation
  useFrame((state) => {
    if (!meshRef.current || !geometryRef.current) return;

    const time = state.clock.elapsedTime;
    const positions = geometryRef.current.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      // Create wave effect
      const waveX = Math.sin(x * 0.5 + time) * 0.15;
      const waveZ = Math.sin(z * 0.3 + time * 0.8) * 0.1;
      const wave = waveX + waveZ;

      positions.setY(i, wave);
    }

    positions.needsUpdate = true;
    geometryRef.current.computeVertexNormals();
  });

  return (
    <group position={[0, -0.5, 30]}>
      {/* Main ocean surface */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry ref={geometryRef} args={[100, 60, 50, 30]} />
        <meshStandardMaterial
          color="#1e90ff"
          roughness={0.3}
          metalness={0.6}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Foam/white caps near shore */}
      <mesh position={[0, 0.1, -25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 5, 20, 1]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.4}
          roughness={0.8}
        />
      </mesh>

      {/* Deeper water in the distance */}
      <mesh position={[0, -0.3, 15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 40]} />
        <meshStandardMaterial
          color="#0055aa"
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>
    </group>
  );
}

export default Ocean;
