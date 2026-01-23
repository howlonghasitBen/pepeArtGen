/**
 * CardPlayingField.jsx
 *
 * A trading card game playing field with:
 * - 3x3 grid for each player
 * - Deck pile for each player
 * - Discard pile for each player
 * - Space between the two player areas
 */

import { useMemo } from 'react';
import * as THREE from 'three';

// Card slot dimensions (3:4 aspect ratio)
const CARD_WIDTH = 0.75;
const CARD_HEIGHT = 1.0;
const CARD_GAP = 0.15;
const GRID_ROWS = 3;
const GRID_COLS = 3;

// Field layout
const PLAYER_FIELD_GAP = 9; // Space between player 1 and player 2 fields
const PILE_OFFSET = 0.5; // Space between grid and piles

// Colors
const FIELD_BG_COLOR = '#1a3a4a'; // Dark teal for field background
const CARD_SLOT_COLOR = '#0d2530'; // Darker slot color
const CARD_SLOT_BORDER = '#2a5a6a'; // Slot border highlight
const PLAYER_1_ACCENT = '#00aa88'; // Teal for player 1
const PLAYER_2_ACCENT = '#aa4400'; // Orange for player 2

// Single card slot component
function CardSlot({ position, isHighlighted = false }) {
  return (
    <group position={position}>
      {/* Slot background */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshStandardMaterial
          color={CARD_SLOT_COLOR}
          roughness={0.8}
          metalness={0.1}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Slot border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[
          Math.min(CARD_WIDTH, CARD_HEIGHT) / 2 - 0.02,
          Math.min(CARD_WIDTH, CARD_HEIGHT) / 2,
          4
        ]} />
        <meshStandardMaterial
          color={isHighlighted ? '#00ff88' : CARD_SLOT_BORDER}
          roughness={0.5}
          metalness={0.3}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Corner markers */}
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([cx, cz], i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[cx * (CARD_WIDTH / 2 - 0.05), 0.02, cz * (CARD_HEIGHT / 2 - 0.05)]}
        >
          <planeGeometry args={[0.08, 0.08]} />
          <meshStandardMaterial
            color={CARD_SLOT_BORDER}
            roughness={0.5}
            emissive={CARD_SLOT_BORDER}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

// 3x3 Grid component
function PlayerGrid({ position, rotation = 0, playerColor }) {
  const slots = useMemo(() => {
    const result = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = (col - (GRID_COLS - 1) / 2) * (CARD_WIDTH + CARD_GAP);
        const z = (row - (GRID_ROWS - 1) / 2) * (CARD_HEIGHT + CARD_GAP);
        result.push({ x, z, row, col });
      }
    }
    return result;
  }, []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Grid background */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[
          GRID_COLS * CARD_WIDTH + (GRID_COLS + 1) * CARD_GAP,
          GRID_ROWS * CARD_HEIGHT + (GRID_ROWS + 1) * CARD_GAP
        ]} />
        <meshStandardMaterial
          color={FIELD_BG_COLOR}
          roughness={0.7}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Grid border glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <planeGeometry args={[
          GRID_COLS * CARD_WIDTH + (GRID_COLS + 1) * CARD_GAP + 0.1,
          GRID_ROWS * CARD_HEIGHT + (GRID_ROWS + 1) * CARD_GAP + 0.1
        ]} />
        <meshStandardMaterial
          color={playerColor}
          roughness={0.5}
          metalness={0.2}
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Card slots */}
      {slots.map((slot, i) => (
        <CardSlot
          key={i}
          position={[slot.x, 0, slot.z]}
        />
      ))}
    </group>
  );
}

// Deck/Discard pile component
function CardPile({ position, isDeck = true }) {
  return (
    <group position={position}>
      {/* Pile base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[CARD_WIDTH + 0.2, CARD_HEIGHT + 0.2]} />
        <meshStandardMaterial
          color={FIELD_BG_COLOR}
          roughness={0.7}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Pile slot */}
      <CardSlot position={[0, 0, 0]} />
    </group>
  );
}

// Main playing field component
function CardPlayingField({ position = [0, 0, 19], rotation = [0, 0, 0] }) {
  const gridWidth = GRID_COLS * CARD_WIDTH + (GRID_COLS + 1) * CARD_GAP;
  const gridHeight = GRID_ROWS * CARD_HEIGHT + (GRID_ROWS + 1) * CARD_GAP;
  const pileAreaWidth = CARD_WIDTH + 0.4;

  // Player 1 (closer to ocean) - bottom
  const player1GridZ = PLAYER_FIELD_GAP / 2 + gridHeight / 2;
  // Player 2 (closer to shop) - top
  const player2GridZ = -(PLAYER_FIELD_GAP / 2 + gridHeight / 2);

  const totalFieldWidth = gridWidth + 2 * (pileAreaWidth + PILE_OFFSET) + 1;
  const totalFieldHeight = 2 * gridHeight + PLAYER_FIELD_GAP + 1;

  return (
    <group position={position} rotation={rotation}>
      {/* Main field surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[totalFieldWidth, totalFieldHeight]} />
        <meshStandardMaterial
          color="#5a4a30"
          roughness={0.6}
          metalness={0.15}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Center line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <planeGeometry args={[totalFieldWidth - 0.5, 0.08]} />
        <meshStandardMaterial
          color="#8a7a50"
          roughness={0.5}
          emissive="#8a7a50"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Player 1 area */}
      <PlayerGrid
        position={[0, 0, player1GridZ]}
        playerColor={PLAYER_1_ACCENT}
      />
      <CardPile
        position={[-(gridWidth / 2 + PILE_OFFSET + pileAreaWidth / 2), 0, player1GridZ]}
        isDeck={true}
      />
      <CardPile
        position={[(gridWidth / 2 + PILE_OFFSET + pileAreaWidth / 2), 0, player1GridZ]}
        isDeck={false}
      />

      {/* Player 2 area */}
      <PlayerGrid
        position={[0, 0, player2GridZ]}
        rotation={Math.PI}
        playerColor={PLAYER_2_ACCENT}
      />
      <CardPile
        position={[(gridWidth / 2 + PILE_OFFSET + pileAreaWidth / 2), 0, player2GridZ]}
        isDeck={true}
      />
      <CardPile
        position={[-(gridWidth / 2 + PILE_OFFSET + pileAreaWidth / 2), 0, player2GridZ]}
        isDeck={false}
      />

      {/* Ambient light */}
      <pointLight position={[0, 2, 0]} intensity={0.3} color="#ffffee" distance={8} decay={2} />
    </group>
  );
}

export default CardPlayingField;
