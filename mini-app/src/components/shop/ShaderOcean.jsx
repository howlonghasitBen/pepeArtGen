/**
 * ShaderOcean.jsx
 *
 * Three.js Water shader implementation for realistic ocean.
 * Based on https://threejs.org/examples/webgl_shaders_ocean.html
 */

import { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';

// Fallback ocean component (simple animated plane)
function FallbackOcean({ position = [0, -0.5, 0], waterColor = '#001e0f', size = 10000 }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      // Simple wave animation using vertex displacement illusion via position
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
      <planeGeometry args={[size, size, 1, 1]} />
      <meshStandardMaterial
        color={waterColor}
        roughness={0.2}
        metalness={0.8}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// Inner component that loads the texture
function ShaderOceanInner({
  position = [0, -0.5, 0],
  sunDirection = [100, 20, 100],
  sunColor = '#ffffff',
  waterColor = '#001e0f',
  distortionScale = 3.7,
  size = 10000,
  isMobile = false,
}) {
  const waterRef = useRef();
  const { scene } = useThree();

  // Use THREE.TextureLoader directly for better error handling
  const waterNormals = useLoader(
    THREE.TextureLoader,
    'https://threejs.org/examples/textures/waternormals.jpg'
  );

  // Configure texture wrapping after load
  useEffect(() => {
    if (waterNormals) {
      waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
    }
  }, [waterNormals]);

  // Create water object with mobile optimizations
  const water = useMemo(() => {
    if (!waterNormals) return null;

    const waterGeometry = new THREE.PlaneGeometry(size, size);

    // Reduce texture resolution on mobile to save GPU memory
    const textureSize = isMobile ? 256 : 512;

    const waterObj = new Water(waterGeometry, {
      textureWidth: textureSize,
      textureHeight: textureSize,
      waterNormals: waterNormals,
      sunDirection: new THREE.Vector3(...sunDirection).normalize(),
      sunColor: new THREE.Color(sunColor),
      waterColor: new THREE.Color(waterColor),
      distortionScale: distortionScale,
      fog: scene.fog !== undefined,
    });

    waterObj.rotation.x = -Math.PI / 2;

    return waterObj;
  }, [waterNormals, sunDirection, sunColor, waterColor, distortionScale, size, scene.fog, isMobile]);

  // Cleanup water geometry and material on unmount
  useEffect(() => {
    return () => {
      if (water) {
        if (water.geometry) {
          water.geometry.dispose();
        }
        if (water.material) {
          // Dispose render targets used by Water shader
          if (water.material.uniforms) {
            const uniforms = water.material.uniforms;
            if (uniforms.mirrorSampler && uniforms.mirrorSampler.value) {
              uniforms.mirrorSampler.value.dispose();
            }
          }
          water.material.dispose();
        }
      }
    };
  }, [water]);

  // Animate water
  useFrame((state, delta) => {
    if (water && water.material.uniforms['time']) {
      water.material.uniforms['time'].value += delta;
    }
  });

  if (!water) {
    return <FallbackOcean position={position} waterColor={waterColor} size={size} />;
  }

  return <primitive ref={waterRef} object={water} position={position} />;
}

// Main component with Suspense wrapper
function ShaderOcean(props) {
  const [hasError, setHasError] = useState(false);

  // Reset error state when component remounts
  useEffect(() => {
    setHasError(false);
  }, []);

  if (hasError) {
    return <FallbackOcean position={props.position} waterColor={props.waterColor} size={props.size} />;
  }

  return (
    <Suspense fallback={<FallbackOcean position={props.position} waterColor={props.waterColor} size={props.size} />}>
      <ShaderOceanInner {...props} />
    </Suspense>
  );
}

export default ShaderOcean;
