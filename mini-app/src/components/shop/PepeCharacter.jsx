import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text } from "@react-three/drei";

// Low-poly Pepe the Frog character
function PepeCharacter({ position, rotation, playerName, isMoving, isLocalPlayer }) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();

  // Pepe colors
  const colors = useMemo(() => ({
    skinGreen: "#7cb342",
    skinLightGreen: "#9ccc65",
    skinDarkGreen: "#558b2f",
    belly: "#c5e1a5",
    lipRed: "#e53935",
    eyeWhite: "#ffffff",
    pupil: "#1a1a1a",
    mouth: "#2e7d32",
  }), []);

  // Walking animation
  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;

    // Gentle idle bob
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(time * 2) * 0.02;
    }

    // Walking animation when moving
    if (isMoving) {
      const walkSpeed = 8;
      const legSwing = Math.sin(time * walkSpeed) * 0.4;
      const armSwing = Math.sin(time * walkSpeed) * 0.3;

      if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -armSwing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = armSwing;
    } else {
      // Reset to idle
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.1);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.1);
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 0.1);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 0.1);
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Player name tag */}
      {playerName && (
        <Text
          position={[0, 1.8, 0]}
          fontSize={0.15}
          color={isLocalPlayer ? "#00ff88" : "#ffffff"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {playerName}
        </Text>
      )}

      <group ref={bodyRef}>
        {/* Main body/torso */}
        <mesh castShadow position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial color={colors.skinGreen} roughness={0.8} />
        </mesh>

        {/* Belly */}
        <mesh position={[0, 0.55, 0.15]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshStandardMaterial color={colors.belly} roughness={0.9} />
        </mesh>

        {/* Head */}
        <group position={[0, 1.05, 0]}>
          {/* Main head - wider, flatter frog shape */}
          <mesh castShadow>
            <sphereGeometry args={[0.35, 8, 6]} />
            <meshStandardMaterial color={colors.skinGreen} roughness={0.8} />
          </mesh>

          {/* Head top (slightly darker) */}
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.32, 8, 6]} />
            <meshStandardMaterial color={colors.skinDarkGreen} roughness={0.8} />
          </mesh>

          {/* Left eye bulge */}
          <group position={[-0.15, 0.15, 0.2]}>
            <mesh castShadow>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshStandardMaterial color={colors.skinLightGreen} roughness={0.7} />
            </mesh>
            {/* Eye white */}
            <mesh position={[0, 0, 0.1]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color={colors.eyeWhite} roughness={0.3} />
            </mesh>
            {/* Pupil */}
            <mesh position={[0, 0, 0.15]}>
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshStandardMaterial color={colors.pupil} roughness={0.5} />
            </mesh>
          </group>

          {/* Right eye bulge */}
          <group position={[0.15, 0.15, 0.2]}>
            <mesh castShadow>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshStandardMaterial color={colors.skinLightGreen} roughness={0.7} />
            </mesh>
            {/* Eye white */}
            <mesh position={[0, 0, 0.1]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color={colors.eyeWhite} roughness={0.3} />
            </mesh>
            {/* Pupil */}
            <mesh position={[0, 0, 0.15]}>
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshStandardMaterial color={colors.pupil} roughness={0.5} />
            </mesh>
          </group>

          {/* Wide frog mouth */}
          <mesh position={[0, -0.12, 0.25]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.35, 0.08, 0.1]} />
            <meshStandardMaterial color={colors.mouth} roughness={0.9} />
          </mesh>

          {/* Red lips (signature Pepe smile) */}
          <mesh position={[0, -0.15, 0.28]} rotation={[0.3, 0, 0]}>
            <torusGeometry args={[0.12, 0.03, 4, 12, Math.PI]} />
            <meshStandardMaterial color={colors.lipRed} roughness={0.6} />
          </mesh>

          {/* Chin */}
          <mesh position={[0, -0.2, 0.1]}>
            <sphereGeometry args={[0.15, 6, 6]} />
            <meshStandardMaterial color={colors.belly} roughness={0.9} />
          </mesh>
        </group>

        {/* Left arm */}
        <group ref={leftArmRef} position={[-0.35, 0.65, 0]}>
          {/* Upper arm */}
          <mesh castShadow rotation={[0, 0, 0.3]}>
            <capsuleGeometry args={[0.06, 0.2, 4, 8]} />
            <meshStandardMaterial color={colors.skinGreen} roughness={0.8} />
          </mesh>
          {/* Hand */}
          <mesh position={[-0.15, -0.15, 0]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color={colors.skinLightGreen} roughness={0.8} />
          </mesh>
        </group>

        {/* Right arm */}
        <group ref={rightArmRef} position={[0.35, 0.65, 0]}>
          {/* Upper arm */}
          <mesh castShadow rotation={[0, 0, -0.3]}>
            <capsuleGeometry args={[0.06, 0.2, 4, 8]} />
            <meshStandardMaterial color={colors.skinGreen} roughness={0.8} />
          </mesh>
          {/* Hand */}
          <mesh position={[0.15, -0.15, 0]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color={colors.skinLightGreen} roughness={0.8} />
          </mesh>
        </group>

        {/* Left leg */}
        <group ref={leftLegRef} position={[-0.12, 0.25, 0]}>
          {/* Thigh */}
          <mesh castShadow>
            <capsuleGeometry args={[0.08, 0.15, 4, 8]} />
            <meshStandardMaterial color={colors.skinGreen} roughness={0.8} />
          </mesh>
          {/* Foot */}
          <mesh position={[0, -0.2, 0.08]}>
            <boxGeometry args={[0.12, 0.05, 0.2]} />
            <meshStandardMaterial color={colors.skinLightGreen} roughness={0.8} />
          </mesh>
        </group>

        {/* Right leg */}
        <group ref={rightLegRef} position={[0.12, 0.25, 0]}>
          {/* Thigh */}
          <mesh castShadow>
            <capsuleGeometry args={[0.08, 0.15, 4, 8]} />
            <meshStandardMaterial color={colors.skinGreen} roughness={0.8} />
          </mesh>
          {/* Foot */}
          <mesh position={[0, -0.2, 0.08]}>
            <boxGeometry args={[0.12, 0.05, 0.2]} />
            <meshStandardMaterial color={colors.skinLightGreen} roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* Shadow underneath */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[0.3, 16]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export default PepeCharacter;
