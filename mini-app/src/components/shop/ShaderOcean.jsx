/**
 * ShaderOcean.jsx
 *
 * Three.js Water shader implementation for realistic ocean.
 * Based on https://threejs.org/examples/webgl_shaders_ocean.html
 */

import { useRef, useMemo } from 'react';
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
}) {
  const waterRef = useRef();
  const { scene } = useThree();

  // Load water normals texture
  const waterNormals = useTexture(
    'https://threejs.org/examples/textures/waternormals.jpg',
    (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }
  );

  // Create water object
  const water = useMemo(() => {
    const waterGeometry = new THREE.PlaneGeometry(size, size);

    const waterObj = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: waterNormals,
      sunDirection: new THREE.Vector3(...sunDirection).normalize(),
      sunColor: new THREE.Color(sunColor),
      waterColor: new THREE.Color(waterColor),
      distortionScale: distortionScale,
      fog: scene.fog !== undefined,
    });

    waterObj.rotation.x = -Math.PI / 2;

    return waterObj;
  }, [waterNormals, sunDirection, sunColor, waterColor, distortionScale, size, scene.fog]);

  // Animate water
  useFrame((state, delta) => {
    if (water.material.uniforms['time']) {
      water.material.uniforms['time'].value += delta;
    }
  });

  return <primitive ref={waterRef} object={water} position={position} />;
}

export default ShaderOcean;
