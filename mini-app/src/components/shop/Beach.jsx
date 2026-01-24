import { useRef, useEffect } from "react";
import * as THREE from "three";

// Create procedural sand texture with improved detail
function createSandTexture(size = 1024) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Base sand color with gradient variation
  const gradient = ctx.createLinearGradient(0, 0, size / 2, size / 2);
  gradient.addColorStop(0, "#f4d58d");
  gradient.addColorStop(0.5, "#e6c870");
  gradient.addColorStop(1, "#f9e4a8");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Add multi-layer noise for better texture
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  // Fine grain noise
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 35;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.9));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.6));
  }

  // Medium grain noise layer
  const step = Math.ceil(size / 256); // Scale step with texture size
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const noise = (Math.random() - 0.5) * 25;
      for (let dy = 0; dy < step && y + dy < size; dy++) {
        for (let dx = 0; dx < step && x + dx < size; dx++) {
          const pixelIdx = ((y + dy) * size + (x + dx)) * 4;
          if (pixelIdx < data.length) {
            data[pixelIdx] = Math.min(255, Math.max(0, data[pixelIdx] + noise));
            data[pixelIdx + 1] = Math.min(255, Math.max(0, data[pixelIdx + 1] + noise * 0.85));
            data[pixelIdx + 2] = Math.min(255, Math.max(0, data[pixelIdx + 2] + noise * 0.55));
          }
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Add darker spots (pebbles) with better blending - scale with texture size
  const pebbleCount = Math.floor((size / 1024) * 350);
  for (let i = 0; i < pebbleCount; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 0.5 + Math.random() * 4;
    const darkness = Math.random() * 35;

    const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    spotGradient.addColorStop(0, `rgba(${180 - darkness}, ${150 - darkness}, ${100 - darkness}, 0.7)`);
    spotGradient.addColorStop(1, `rgba(${180 - darkness}, ${150 - darkness}, ${100 - darkness}, 0)`);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = spotGradient;
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

// Create wet sand texture with improved reflections
function createWetSandTexture(size = 1024) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Darker, wet sand base with variation
  const gradient = ctx.createLinearGradient(0, 0, size / 2, size / 2);
  gradient.addColorStop(0, "#8a6d35");
  gradient.addColorStop(0.5, "#a08040");
  gradient.addColorStop(1, "#9a7845");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  // Subtle noise for texture
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 18;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.85));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.65));
  }

  ctx.putImageData(imageData, 0, 0);

  // Add water reflection spots - scale with texture size
  const reflectionCount = Math.floor((size / 1024) * 200);
  for (let i = 0; i < reflectionCount; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 3 + Math.random() * 8;

    const reflectionGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const alpha = 0.15 + Math.random() * 0.25;
    reflectionGradient.addColorStop(0, `rgba(135, 206, 250, ${alpha})`);
    reflectionGradient.addColorStop(0.7, `rgba(135, 206, 240, ${alpha * 0.5})`);
    reflectionGradient.addColorStop(1, `rgba(135, 206, 235, 0)`);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = reflectionGradient;
    ctx.fill();
  }

  // Add wave-like patterns
  const waveCount = Math.floor((size / 1024) * 8);
  for (let wave = 0; wave < waveCount; wave++) {
    const y = wave * (size / waveCount) + Math.random() * (size / (waveCount * 2));
    const amplitude = (size / 1024) * (20 + Math.random() * 15);
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < size; x += 2) {
      const waveY = y + Math.sin(x * (20 / size)) * amplitude;
      ctx.lineTo(x, waveY);
    }
    ctx.lineTo(size, y + amplitude);
    ctx.lineTo(size, y - amplitude);
    ctx.closePath();
    ctx.fillStyle = `rgba(135, 200, 235, ${0.05 + Math.random() * 0.1})`;
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 4);
  return texture;
}

// Sandy beach - just sand planes
function Beach({ isMobile = false }) {
  const sandTextureRef = useRef();
  const wetSandTextureRef = useRef();

  // Create textures once with mobile optimization
  useEffect(() => {
    const textureSize = isMobile ? 512 : 1024; // Half resolution on mobile saves ~75% GPU memory
    sandTextureRef.current = createSandTexture(textureSize);
    wetSandTextureRef.current = createWetSandTexture(textureSize);

    // Cleanup textures on unmount to prevent memory leaks
    return () => {
      if (sandTextureRef.current) {
        sandTextureRef.current.dispose();
        sandTextureRef.current = null;
      }
      if (wetSandTextureRef.current) {
        wetSandTextureRef.current.dispose();
        wetSandTextureRef.current = null;
      }
    };
  }, [isMobile]);

  // Shoreline at Z = 25 (edge of movable space)
  const shorelineZ = 25;

  return (
    <group>
      {/* Main sand plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 10]} receiveShadow>
        <planeGeometry args={[50, 35, 80, 56]} />
        <meshStandardMaterial
          color="#f4d58d"
          roughness={0.95}
          metalness={0}
          map={sandTextureRef.current}
          aoMapIntensity={0.5}
        />
      </mesh>

      {/* Wet sand near water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, shorelineZ - 3]} receiveShadow>
        <planeGeometry args={[50, 8, 40, 12]} />
        <meshStandardMaterial
          color="#a08040"
          roughness={0.5}
          metalness={0.2}
          map={wetSandTextureRef.current}
          aoMapIntensity={0.4}
        />
      </mesh>
    </group>
  );
}

export default Beach;
