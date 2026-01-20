/**
 * MeshySurfShack.jsx
 *
 * Meshy AI generated surf shack building.
 * Replaces the procedural SurfShack component.
 */

import { useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Preload the model
useGLTF.preload('/models/props/surfShack.glb');

function MeshySurfShack({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}) {
  const groupRef = useRef();
  const { scene } = useGLTF('/models/props/surfShack.glb');

  // Clone and configure the scene
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // The Meshy model may not have materials, add a default if missing
        if (!child.material || child.material.type === 'MeshBasicMaterial') {
          child.material = new THREE.MeshStandardMaterial({
            color: '#d4a574',
            roughness: 0.8,
            metalness: 0.1,
            // Use vertex colors if available
            vertexColors: child.geometry.attributes.color ? true : false,
          });
        }

        // Clone material to prevent shared state
        if (child.material) {
          child.material = child.material.clone();
        }
      }
    });
    return clone;
  }, [scene]);

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={typeof scale === 'number' ? [scale, scale, scale] : scale}
    >
      <primitive object={clonedScene} />

      {/* Add ambient lighting inside the shack */}
      <pointLight
        position={[0, 2.5, 0]}
        intensity={0.5}
        color="#ffcc77"
        distance={8}
        decay={2}
      />
    </group>
  );
}

export default MeshySurfShack;
