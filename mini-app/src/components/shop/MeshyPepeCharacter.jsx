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
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  playerName = 'Player',
  isMoving = false,
  isRunning = false,
  isLocalPlayer = true,
}) {
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
  const idleTime = useRef(0);
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Update animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // Always sync position from props (X and Z from controls)
    groupRef.current.position.x = position[0];
    groupRef.current.position.z = position[2];

    // Handle Y position with idle bob when not moving
    if (!isMoving) {
      idleTime.current += delta;
      groupRef.current.position.y = position[1] + Math.sin(idleTime.current * 2) * 0.02;
    } else {
      idleTime.current = 0;
      groupRef.current.position.y = position[1];
    }

    // Sync rotation from props
    groupRef.current.rotation.y = rotation[1];
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
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
