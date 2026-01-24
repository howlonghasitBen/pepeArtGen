/**
 * ShaderOcean.jsx
 *
 * Three.js Water shader implementation for realistic ocean.
 * Based on https://threejs.org/examples/webgl_shaders_ocean.html
 */

import { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';

function ShaderOcean({
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
  const [textureError, setTextureError] = useState(false);

  // Load water normals texture with error handling
  let waterNormals;
  try {
    waterNormals = useTexture(
      'https://threejs.org/examples/textures/waternormals.jpg',
      (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      },
      (error) => {
        console.error('[ShaderOcean] Failed to load water normals texture:', error);
        setTextureError(true);
      }
    );
  } catch (error) {
    console.error('[ShaderOcean] Texture loading error:', error);
    setTextureError(true);
  }

  // Fallback to simple plane if texture fails to load
  if (textureError || !waterNormals) {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
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

  // Create water object with mobile optimizations
  const water = useMemo(() => {
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

  // Animate water using stable clock time to prevent jitter
  useFrame((state) => {
    if (water.material.uniforms['time']) {
      // Use the stable clock elapsed time instead of variable delta
      water.material.uniforms['time'].value = state.clock.elapsedTime * 0.5;
    }
  });

  return <primitive ref={waterRef} object={water} position={position} />;
}

export default ShaderOcean;
