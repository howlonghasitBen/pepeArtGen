/**
 * MeshyPepeCharacter.jsx
 *
 * Animated Pepe character using Meshy AI generated model.
 * Features all animations from the GLB file with emote support.
 */

import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text } from '@react-three/drei';
import * as THREE from 'three';
import { clone as SkeletonUtilsClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

// Preload the model
useGLTF.preload('/models/props/pepeBlueAlohaShirtAnimations.glb');

function MeshyPepeCharacter({
  position,
  rotation,
  positionRef,
  rotationRef,
  scale = 1,
  playerName = 'Player',
  isMoving = false,
  isRunning = false,
  isLocalPlayer = true,
  emoteAnimation = null,
  onAnimationsLoaded,
  onEmoteComplete,
}) {
  const useRefs = Boolean(positionRef && rotationRef);
  const staticPosition = position || [0, 0, 0];
  const staticRotation = rotation || [0, 0, 0];
  const groupRef = useRef();
  const mixerRef = useRef();
  const actionsRef = useRef({});
  const [currentEmote, setCurrentEmote] = useState(null);

  const { scene, animations } = useGLTF('/models/props/pepeBlueAlohaShirtAnimations.glb');

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

  // Set up animation mixer and report available animations
  useEffect(() => {
    if (!clonedScene || !animations.length) return;

    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    const actions = {};
    const animationNames = [];
    animations.forEach((clip) => {
      actions[clip.name] = mixer.clipAction(clip);
      animationNames.push(clip.name);
    });
    actionsRef.current = actions;

    if (onAnimationsLoaded) {
      onAnimationsLoaded(animationNames);
    }

    const handleFinished = () => {
      if (currentEmote && onEmoteComplete) {
        onEmoteComplete();
      }
      setCurrentEmote(null);
    };
    mixer.addEventListener('finished', handleFinished);

    return () => {
      mixer.removeEventListener('finished', handleFinished);
      mixer.stopAllAction();
      mixer.uncacheRoot(clonedScene);
    };
  }, [clonedScene, animations, onAnimationsLoaded, onEmoteComplete, currentEmote]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (clonedScene) {
        clonedScene.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
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

  // Handle emote animation
  useEffect(() => {
    if (emoteAnimation && emoteAnimation !== currentEmote) {
      const actions = actionsRef.current;
      if (!actions || !actions[emoteAnimation]) return;

      Object.values(actions).forEach(action => {
        if (action) action.fadeOut(0.2);
      });

      const emoteAction = actions[emoteAnimation];
      emoteAction.reset();
      emoteAction.setEffectiveTimeScale(1);
      emoteAction.setEffectiveWeight(1);
      emoteAction.setLoop(THREE.LoopOnce, 1);
      emoteAction.clampWhenFinished = true;
      emoteAction.fadeIn(0.2);
      emoteAction.play();
      
      setCurrentEmote(emoteAnimation);
    }
  }, [emoteAnimation, currentEmote]);

  // Handle movement animations (when not emoting)
  useEffect(() => {
    if (emoteAnimation || currentEmote) return;

    const actions = actionsRef.current;
    if (!actions || Object.keys(actions).length === 0) return;

    const walkAction = actions['Walking'];
    const runAction = actions['Running'];

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
  }, [isMoving, isRunning, emoteAnimation, currentEmote]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    if (useRefs) {
      const pos = positionRef.current;
      groupRef.current.position.set(pos[0], pos[1], pos[2]);
      groupRef.current.rotation.y = rotationRef.current;
    }
  });

  const initialPosition = useRefs ? positionRef.current : staticPosition;
  const initialRotation = useRefs ? [0, rotationRef.current, 0] : staticRotation;

  return (
    <group
      ref={groupRef}
      position={initialPosition}
      rotation={initialRotation}
      scale={typeof scale === 'number' ? [scale, scale, scale] : scale}
    >
      <primitive object={clonedScene} />

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

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[0.4, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export default MeshyPepeCharacter;
