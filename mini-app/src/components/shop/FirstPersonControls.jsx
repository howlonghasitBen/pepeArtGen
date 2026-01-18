import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function FirstPersonControls({ onLockChange }) {
  const { camera, gl } = useThree();
  const moveSpeed = 0.08;
  const lookSpeed = 0.002;

  const isLocked = useRef(false);
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));

  const moveForward = useRef(false);
  const moveBackward = useRef(false);
  const moveLeft = useRef(false);
  const moveRight = useRef(false);

  // Boundaries for movement (inside the shack area)
  const bounds = {
    minX: -8,
    maxX: 8,
    minZ: -5,
    maxZ: 12,
    minY: 1.5,
    maxY: 3,
  };

  useEffect(() => {
    const domElement = gl.domElement;

    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === domElement;
      isLocked.current = locked;
      onLockChange?.(locked);
    };

    const onMouseMove = (event) => {
      if (!isLocked.current) return;

      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      euler.current.setFromQuaternion(camera.quaternion);
      euler.current.y -= movementX * lookSpeed;
      euler.current.x -= movementY * lookSpeed;
      euler.current.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, euler.current.x));

      camera.quaternion.setFromEuler(euler.current);
    };

    const onKeyDown = (event) => {
      if (!isLocked.current) return;

      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          moveForward.current = true;
          break;
        case "KeyS":
        case "ArrowDown":
          moveBackward.current = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          moveLeft.current = true;
          break;
        case "KeyD":
        case "ArrowRight":
          moveRight.current = true;
          break;
      }
    };

    const onKeyUp = (event) => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          moveForward.current = false;
          break;
        case "KeyS":
        case "ArrowDown":
          moveBackward.current = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          moveLeft.current = false;
          break;
        case "KeyD":
        case "ArrowRight":
          moveRight.current = false;
          break;
      }
    };

    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    return () => {
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [camera, gl, onLockChange]);

  useFrame(() => {
    if (!isLocked.current) return;

    // Calculate direction
    direction.current.z = Number(moveForward.current) - Number(moveBackward.current);
    direction.current.x = Number(moveRight.current) - Number(moveLeft.current);
    direction.current.normalize();

    // Apply movement
    velocity.current.x = direction.current.x * moveSpeed;
    velocity.current.z = -direction.current.z * moveSpeed;

    // Move relative to camera orientation
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const newPos = camera.position.clone();
    newPos.addScaledVector(forward, -velocity.current.z);
    newPos.addScaledVector(right, velocity.current.x);

    // Clamp to bounds
    newPos.x = Math.max(bounds.minX, Math.min(bounds.maxX, newPos.x));
    newPos.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, newPos.z));
    newPos.y = Math.max(bounds.minY, Math.min(bounds.maxY, newPos.y));

    camera.position.copy(newPos);
  });

  return null;
}

export default FirstPersonControls;
