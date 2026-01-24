/**
 * MeshyModel.jsx
 *
 * Generic loader for 3D models created with Meshy AI.
 * Supports GLB/GLTF files with automatic material optimization.
 *
 * Usage:
 *   <MeshyModel
 *     url="/models/props/arcade-machine.glb"
 *     position={[5, 0, -3]}
 *     scale={1}
 *     rotation={[0, Math.PI / 4, 0]}
 *   />
 */

import { useRef, useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Preload models for better performance
export function preloadModel(url) {
  useGLTF.preload(url);
}

function MeshyModel({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  castShadow = true,
  receiveShadow = true,
  onClick,
  onPointerOver,
  onPointerOut,
  // Animation options
  animate = false,
  floatSpeed = 1,
  floatAmplitude = 0.1,
  rotateSpeed = 0,
  // Material overrides
  emissiveIntensity = 0,
  emissiveColor = '#ffffff',
  metalness,
  roughness,
}) {
  const groupRef = useRef();
  const { scene } = useGLTF(url);

  // Clone the scene to allow multiple instances
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    // Apply shadow settings and material overrides to all meshes
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;

        // Clone material to avoid affecting other instances
        if (child.material) {
          child.material = child.material.clone();

          // Apply material overrides if specified
          if (emissiveIntensity > 0) {
            child.material.emissive = new THREE.Color(emissiveColor);
            child.material.emissiveIntensity = emissiveIntensity;
          }
          if (metalness !== undefined) {
            child.material.metalness = metalness;
          }
          if (roughness !== undefined) {
            child.material.roughness = roughness;
          }
        }
      }
    });

    return clone;
  }, [scene, castShadow, receiveShadow, emissiveIntensity, emissiveColor, metalness, roughness]);

  // Cleanup cloned materials and geometries on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (clonedScene) {
        clonedScene.traverse((child) => {
          if (child.isMesh) {
            // Dispose geometry
            if (child.geometry) {
              child.geometry.dispose();
            }
            // Dispose material (whether single material or array)
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(material => material.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
      }
    };
  }, [clonedScene]);

  // Animation frame
  useFrame((state) => {
    if (!groupRef.current || !animate) return;

    const time = state.clock.elapsedTime;

    // Floating animation
    if (floatAmplitude > 0) {
      groupRef.current.position.y = position[1] + Math.sin(time * floatSpeed) * floatAmplitude;
    }

    // Rotation animation
    if (rotateSpeed > 0) {
      groupRef.current.rotation.y += rotateSpeed * 0.01;
    }
  });

  // Normalize scale to array format
  const scaleArray = typeof scale === 'number' ? [scale, scale, scale] : scale;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scaleArray}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

export default MeshyModel;
