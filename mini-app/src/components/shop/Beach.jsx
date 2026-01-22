import { useRef, useEffect } from "react";
import * as THREE from "three";

// Create procedural sand texture with improved detail
function createSandTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  // Base sand color with gradient variation
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, "#f4d58d");
  gradient.addColorStop(0.5, "#e6c870");
  gradient.addColorStop(1, "#f9e4a8");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);

  // Add multi-layer noise for better texture
  const imageData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imageData.data;

  // Fine grain noise
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 35;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.9));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.6));
  }

  // Medium grain noise layer
  for (let y = 0; y < 1024; y += 4) {
    for (let x = 0; x < 1024; x += 4) {
      const noise = (Math.random() - 0.5) * 25;
      for (let dy = 0; dy < 4 && y + dy < 1024; dy++) {
        for (let dx = 0; dx < 4 && x + dx < 1024; dx++) {
          const pixelIdx = ((y + dy) * 1024 + (x + dx)) * 4;
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

  // Add darker spots (pebbles) with better blending
  for (let i = 0; i < 350; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
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
function createWetSandTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  // Darker, wet sand base with variation
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, "#8a6d35");
  gradient.addColorStop(0.5, "#a08040");
  gradient.addColorStop(1, "#9a7845");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);

  const imageData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imageData.data;

  // Subtle noise for texture
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 18;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.85));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.65));
  }

  ctx.putImageData(imageData, 0, 0);

  // Add water reflection spots
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
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
  for (let wave = 0; wave < 8; wave++) {
    const y = wave * 128 + Math.random() * 64;
    const amplitude = 20 + Math.random() * 15;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < 1024; x += 2) {
      const waveY = y + Math.sin(x * 0.02) * amplitude;
      ctx.lineTo(x, waveY);
    }
    ctx.lineTo(1024, y + amplitude);
    ctx.lineTo(1024, y - amplitude);
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
function Beach() {
  const sandTextureRef = useRef();
  const wetSandTextureRef = useRef();

  // Create textures once
  useEffect(() => {
    sandTextureRef.current = createSandTexture();
    wetSandTextureRef.current = createWetSandTexture();
  }, []);

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
