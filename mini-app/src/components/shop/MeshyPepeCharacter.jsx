/**
 * MeshyPepeCharacter.jsx
 *
 * Animated Pepe character using Meshy AI generated model.
 * Features Walking and Running animations.
 */

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text } from '@react-three/drei';
import * as THREE from 'three';
import { clone as SkeletonUtilsClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

// Preload the model
useGLTF.preload('/models/props/pepeBlueAlohaShirtAnimations.glb');

function MeshyPepeCharacter({
  position,           // Static position array (for non-player characters)
  rotation,           // Static rotation array (for non-player characters)
  positionRef,        // Ref for dynamic position (for player character)
  rotationRef,        // Ref for dynamic rotation (for player character)
  scale = 1,
  playerName = 'Player',
  isMoving = false,
  isRunning = false,
  isLocalPlayer = true,
}) {
  // Determine if using refs or static values
  const useRefs = Boolean(positionRef && rotationRef);
  const staticPosition = position || [0, 0, 0];
  const staticRotation = rotation || [0, 0, 0];
  const groupRef = useRef();
  const mixerRef = useRef();
  const actionsRef = useRef({});

  const { scene, animations } = useGLTF('/models/props/pepeBlueAlohaShirtAnimations.glb');

  // Clone the scene properly for skinned meshes
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtilsClone(scene);
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
        }
      }
    });
    return clone;
  }, [scene]);

  // Set up animation mixer for this instance
  useEffect(() => {
    if (!clonedScene || !animations.length) return;

    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    // Create actions for each animation
    const actions = {};
    animations.forEach((clip) => {
      actions[clip.name] = mixer.clipAction(clip);
    });
    actionsRef.current = actions;

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(clonedScene);
    };
  }, [clonedScene, animations]);

  // Cleanup cloned materials and geometries on unmount
  useEffect(() => {
    return () => {
      if (clonedScene) {
        clonedScene.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
      }
    };
  }, [clonedScene]);

  // Handle animation transitions
  useEffect(() => {
    const actions = actionsRef.current;
    if (!actions || Object.keys(actions).length === 0) return;

    const walkAction = actions['Walking'];
    const runAction = actions['Running'];

    // Stop all actions first
    Object.values(actions).forEach(action => {
      if (action) action.stop();
    });

    if (isMoving) {
      const activeAction = isRunning && runAction ? runAction : walkAction;
      if (activeAction) {
        activeAction.reset();
        activeAction.setEffectiveTimeScale(1);
        activeAction.setEffectiveWeight(1);
        activeAction.play();
      }
    }
  }, [isMoving, isRunning]);

  // Update position, rotation, and animation mixer
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Update animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    if (useRefs) {
      // For player character: read directly from refs (no lerp needed, ThirdPersonControls handles smoothing)
      const pos = positionRef.current;
      groupRef.current.position.set(pos[0], pos[1], pos[2]);
      groupRef.current.rotation.y = rotationRef.current;
    }
    // For static characters (shopkeeper), position is set via JSX props and doesn't need updating
  });

  // Initial position for static characters or starting position for dynamic
  const initialPosition = useRefs ? positionRef.current : staticPosition;
  const initialRotation = useRefs ? [0, rotationRef.current, 0] : staticRotation;

  return (
    <group
      ref={groupRef}
      position={initialPosition}
      rotation={initialRotation}
      scale={typeof scale === 'number' ? [scale, scale, scale] : scale}
    >
      {/* The character model */}
      <primitive object={clonedScene} />

      {/* Player name floating above */}
      {playerName && (
        <Text
          position={[0, 2.5, 0]}
          fontSize={0.25}
          color={isLocalPlayer ? '#00ff88' : '#ffffff'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {playerName}
        </Text>
      )}

      {/* Shadow blob under character */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[0.4, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export default MeshyPepeCharacter;
