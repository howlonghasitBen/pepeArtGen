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
        {/* Main body/torso - higher poly for smoother look */}
        <mesh castShadow position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.3, 16, 12]} />
          <meshStandardMaterial color={colors.skinGreen} roughness={0.8} />
        </mesh>

        {/* Belly with better shape */}
        <mesh position={[0, 0.55, 0.15]} scale={[0.88, 1, 0.8]}>
          <sphereGeometry args={[0.25, 12, 10]} />
          <meshStandardMaterial color={colors.belly} roughness={0.9} />
        </mesh>

        {/* Chest highlight */}
        <mesh position={[0, 0.7, 0.12]}>
          <sphereGeometry args={[0.18, 12, 8]} />
          <meshStandardMaterial color={colors.skinLightGreen} roughness={0.85} transparent opacity={0.4} />
        </mesh>

        {/* Head */}
        <group position={[0, 1.05, 0]}>
          {/* Main head - wider, flatter frog shape with more detail */}
          <mesh castShadow scale={[1, 1.09, 0.86]}>
            <sphereGeometry args={[0.38, 16, 14]} />
            <meshStandardMaterial color={colors.skinGreen} roughness={0.8} />
          </mesh>

          {/* Head top (slightly darker) */}
          <mesh position={[0, 0.1, -0.05]} scale={[1, 1.09, 0.88]}>
            <sphereGeometry args={[0.35, 14, 12]} />
            <meshStandardMaterial color={colors.skinDarkGreen} roughness={0.8} />
          </mesh>

          {/* Forehead highlight */}
          <mesh position={[0, 0.2, -0.1]}>
            <sphereGeometry args={[0.18, 10, 8]} />
            <meshStandardMaterial color={colors.skinLightGreen} roughness={0.7} transparent opacity={0.3} />
          </mesh>

          {/* Left eye bulge - more detailed */}
          <group position={[-0.15, 0.15, 0.2]}>
            <mesh castShadow>
              <sphereGeometry args={[0.15, 12, 10]} />
              <meshStandardMaterial color={colors.skinLightGreen} roughness={0.7} />
            </mesh>
            {/* Eye white with iris ring */}
            <mesh position={[0, 0, 0.1]}>
              <sphereGeometry args={[0.1, 12, 10]} />
              <meshStandardMaterial color={colors.eyeWhite} roughness={0.2} metalness={0.1} />
            </mesh>
            {/* Iris */}
            <mesh position={[0, 0, 0.13]}>
              <sphereGeometry args={[0.07, 10, 8]} />
              <meshStandardMaterial color="#4a7c59" roughness={0.6} />
            </mesh>
            {/* Pupil */}
            <mesh position={[0, 0, 0.16]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color={colors.pupil} roughness={0.3} />
            </mesh>
            {/* Eye shine */}
            <mesh position={[-0.02, 0.02, 0.17]}>
              <sphereGeometry args={[0.015, 6, 6]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} />
            </mesh>
          </group>

          {/* Right eye bulge - more detailed */}
          <group position={[0.15, 0.15, 0.2]}>
            <mesh castShadow>
              <sphereGeometry args={[0.15, 12, 10]} />
              <meshStandardMaterial color={colors.skinLightGreen} roughness={0.7} />
            </mesh>
            {/* Eye white with iris ring */}
            <mesh position={[0, 0, 0.1]}>
              <sphereGeometry args={[0.1, 12, 10]} />
              <meshStandardMaterial color={colors.eyeWhite} roughness={0.2} metalness={0.1} />
            </mesh>
            {/* Iris */}
            <mesh position={[0, 0, 0.13]}>
              <sphereGeometry args={[0.07, 10, 8]} />
              <meshStandardMaterial color="#4a7c59" roughness={0.6} />
            </mesh>
            {/* Pupil */}
            <mesh position={[0, 0, 0.16]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color={colors.pupil} roughness={0.3} />
            </mesh>
            {/* Eye shine */}
            <mesh position={[0.02, 0.02, 0.17]}>
              <sphereGeometry args={[0.015, 6, 6]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} />
            </mesh>
          </group>

          {/* Nostrils */}
          <mesh position={[-0.06, 0.05, 0.22]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color={colors.skinDarkGreen} roughness={0.9} />
          </mesh>
          <mesh position={[0.06, 0.05, 0.22]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color={colors.skinDarkGreen} roughness={0.9} />
          </mesh>

          {/* Wide frog mouth - more detailed */}
          <mesh position={[0, -0.12, 0.25]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.35, 0.08, 0.1]} />
            <meshStandardMaterial color={colors.mouth} roughness={0.9} />
          </mesh>

          {/* Mouth interior (tongue/teeth hint) */}
          <mesh position={[0, -0.12, 0.28]} rotation={[0.25, 0, 0]}>
            <boxGeometry args={[0.3, 0.06, 0.04]} />
            <meshStandardMaterial color="#2a5a32" roughness={0.95} />
          </mesh>

          {/* Red lips (signature Pepe smile) - more detailed */}
          <mesh position={[0, -0.15, 0.28]} rotation={[0.3, 0, 0]}>
            <torusGeometry args={[0.12, 0.035, 6, 16, Math.PI]} />
            <meshStandardMaterial color={colors.lipRed} roughness={0.5} metalness={0.2} />
          </mesh>

          {/* Lip highlight */}
          <mesh position={[0, -0.14, 0.29]} rotation={[0.32, 0, 0]}>
            <torusGeometry args={[0.12, 0.015, 4, 12, Math.PI]} />
            <meshStandardMaterial color="#ff4444" roughness={0.3} metalness={0.3} transparent opacity={0.6} />
          </mesh>

          {/* Chin - more rounded */}
          <mesh position={[0, -0.2, 0.1]} scale={[1, 0.8, 0.53]}>
            <sphereGeometry args={[0.15, 10, 8]} />
            <meshStandardMaterial color={colors.belly} roughness={0.9} />
          </mesh>
        </group>

        {/* Left arm - more detailed */}
        <group ref={leftArmRef} position={[-0.35, 0.65, 0]}>
          {/* Upper arm */}
          <mesh castShadow rotation={[0, 0, 0.3]}>
            <capsuleGeometry args={[0.06, 0.2, 6, 10]} />
            <meshStandardMaterial color={colors.skinGreen} roughness={0.8} />
          </mesh>
          {/* Forearm */}
          <mesh position={[-0.12, -0.1, 0]} rotation={[0, 0, 0.2]}>
            <capsuleGeometry args={[0.055, 0.16, 6, 10]} />
            <meshStandardMaterial color={colors.skinGreen} roughness={0.8} />
          </mesh>
          {/* Hand - more detailed */}
          <group position={[-0.15, -0.15, 0]}>
            <mesh castShadow scale={[1, 1.125, 0.75]}>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial color={colors.skinLightGreen} roughness={0.8} />
            </mesh>
            {/* Fingers hint */}
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[-0.03 + i * 0.03, 0.05, 0]}>
                <sphereGeometry args={[0.015, 4, 4]} />
                <meshStandardMaterial color={colors.skinLightGreen} roughness={0.85} />
              </mesh>
            ))}
          </group>
        </group>

        {/* Right arm - more detailed */}
        <group ref={rightArmRef} position={[0.35, 0.65, 0]}>
          {/* Upper arm */}
          <mesh castShadow rotation={[0, 0, -0.3]}>
            <capsuleGeometry args={[0.06, 0.2, 6, 10]} />
            <meshStandardMaterial color={colors.skinGreen} roughness={0.8} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0.12, -0.1, 0]} rotation={[0, 0, -0.2]}>
            <capsuleGeometry args={[0.055, 0.16, 6, 10]} />
            <meshStandardMaterial color={colors.skinGreen} roughness={0.8} />
          </mesh>
          {/* Hand - more detailed */}
          <group position={[0.15, -0.15, 0]}>
            <mesh castShadow scale={[1, 1.125, 0.75]}>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial color={colors.skinLightGreen} roughness={0.8} />
            </mesh>
            {/* Fingers hint */}
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[0.03 - i * 0.03, 0.05, 0]}>
                <sphereGeometry args={[0.015, 4, 4]} />
                <meshStandardMaterial color={colors.skinLightGreen} roughness={0.85} />
              </mesh>
            ))}
          </group>
        </group>

        {/* Left leg - more detailed */}
        <group ref={leftLegRef} position={[-0.12, 0.25, 0]}>
          {/* Thigh */}
          <mesh castShadow>
            <capsuleGeometry args={[0.08, 0.15, 6, 10]} />
            <meshStandardMaterial color={colors.skinGreen} roughness={0.8} />
          </mesh>
          {/* Calf */}
          <mesh position={[0, -0.08, 0]}>
            <capsuleGeometry args={[0.075, 0.14, 6, 10]} />
            <meshStandardMaterial color={colors.skinGreen} roughness={0.8} />
          </mesh>
          {/* Foot - more detailed webbed foot */}
          <group position={[0, -0.2, 0.08]}>
            <mesh castShadow>
              <boxGeometry args={[0.12, 0.05, 0.2]} />
              <meshStandardMaterial color={colors.skinLightGreen} roughness={0.8} />
            </mesh>
            {/* Toe webbing hint */}
            {[-0.04, 0, 0.04].map((x, i) => (
              <mesh key={i} position={[x, 0.03, 0.1]}>
                <boxGeometry args={[0.02, 0.02, 0.08]} />
                <meshStandardMaterial color={colors.skinLightGreen} roughness={0.85} />
              </mesh>
            ))}
          </group>
        </group>

        {/* Right leg - more detailed */}
        <group ref={rightLegRef} position={[0.12, 0.25, 0]}>
          {/* Thigh */}
          <mesh castShadow>
            <capsuleGeometry args={[0.08, 0.15, 6, 10]} />
            <meshStandardMaterial color={colors.skinGreen} roughness={0.8} />
          </mesh>
          {/* Calf */}
          <mesh position={[0, -0.08, 0]}>
            <capsuleGeometry args={[0.075, 0.14, 6, 10]} />
            <meshStandardMaterial color={colors.skinGreen} roughness={0.8} />
          </mesh>
          {/* Foot - more detailed webbed foot */}
          <group position={[0, -0.2, 0.08]}>
            <mesh castShadow>
              <boxGeometry args={[0.12, 0.05, 0.2]} />
              <meshStandardMaterial color={colors.skinLightGreen} roughness={0.8} />
            </mesh>
            {/* Toe webbing hint */}
            {[-0.04, 0, 0.04].map((x, i) => (
              <mesh key={i} position={[x, 0.03, 0.1]}>
                <boxGeometry args={[0.02, 0.02, 0.08]} />
                <meshStandardMaterial color={colors.skinLightGreen} roughness={0.85} />
              </mesh>
            ))}
          </group>
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
