import { useRef, useEffect, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ThirdPersonControls({
  positionRef,        // Ref to update character position directly
  rotationRef,        // Ref to update character rotation directly
  onMovingChange,
  mobileInput,
  cameraInput,
  enabled = true
}) {
  const { camera } = useThree();

  // Character state - spawning in front of shack entrance (Z=18)
  const characterPos = useRef(new THREE.Vector3(0, 0, 18));
  const characterRotation = useRef(0); // Y-axis rotation
  const targetRotation = useRef(0);

  // Camera state
  const cameraOffset = useRef(new THREE.Vector3(0, 2.5, 5)); // Behind and above
  const cameraLookOffset = useRef(new THREE.Vector3(0, 1, 0)); // Look at character's upper body
  const currentCameraPos = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());

  // Camera orbit
  const cameraYaw = useRef(0); // Horizontal orbit
  const cameraPitch = useRef(0.3); // Vertical angle (0.3 = slightly above)
  const cameraDistance = useRef(4);
  const isPortrait = useRef(false);
  const baseCameraDistance = useRef(4); // Base distance for landscape

  // Movement state - snappier controls
  const moveSpeed = 0.18;           // Faster movement
  const rotationSpeed = 0.25;       // Faster turning
  const cameraLerpFactor = 0.25;    // Snappier camera follow
  const lookLerpFactor = 0.3;       // Snappier look-at

  const velocity = useRef(new THREE.Vector3());
  const isMoving = useRef(false);

  // Input state
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  // Mouse state for camera orbit
  const isMouseDown = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);

  // Boundaries - adjusted for beach-centered double-shack
  const bounds = {
    minX: -12,
    maxX: 12,
    minZ: 3,    // Behind back shack
    maxZ: 27,   // Toward the ocean
  };

  // Detect portrait orientation and adjust camera distance
  useEffect(() => {
    const handleOrientationChange = () => {
      const portrait = window.innerHeight > window.innerWidth;
      isPortrait.current = portrait;

      // In portrait mode, pull camera back further to see more of the scene
      if (portrait) {
        baseCameraDistance.current = 6; // Increased from 4 for portrait
        cameraDistance.current = Math.max(cameraDistance.current, 6);
      } else {
        baseCameraDistance.current = 4; // Default for landscape
        // Don't force reset if user has zoomed in/out
      }
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  // Handle keyboard input
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = true;
          break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = false;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled]);

  // Handle mouse input for camera orbit
  useEffect(() => {
    if (!enabled) return;

    const handleMouseDown = (e) => {
      if (e.button === 0 || e.button === 2) { // Left or right click
        isMouseDown.current = true;
        lastMouseX.current = e.clientX;
        lastMouseY.current = e.clientY;
      }
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };

    const handleMouseMove = (e) => {
      if (!isMouseDown.current) return;

      const deltaX = e.clientX - lastMouseX.current;
      const deltaY = e.clientY - lastMouseY.current;

      // Rotate camera around character
      cameraYaw.current -= deltaX * 0.005;
      cameraPitch.current = Math.max(0.1, Math.min(0.8, cameraPitch.current + deltaY * 0.003));

      lastMouseX.current = e.clientX;
      lastMouseY.current = e.clientY;
    };

    const handleWheel = (e) => {
      // Zoom in/out - respect minimum distance based on orientation
      const minDistance = isPortrait.current ? 4 : 2;
      cameraDistance.current = Math.max(minDistance, Math.min(10, cameraDistance.current + e.deltaY * 0.005));
    };

    const handleContextMenu = (e) => {
      e.preventDefault(); // Prevent right-click menu
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("wheel", handleWheel);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [enabled]);

  // Handle touch input for camera (swipe to rotate)
  useEffect(() => {
    if (!enabled) return;

    let lastTouchX = 0;
    let lastTouchY = 0;
    let touchId = null;

    const handleTouchStart = (e) => {
      // Use the second touch for camera rotation (first is for joystick)
      if (e.touches.length === 2) {
        const touch = e.touches[1];
        touchId = touch.identifier;
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
      } else if (e.touches.length === 1 && !mobileInput) {
        // Single touch for camera if no joystick active
        const touch = e.touches[0];
        // Only use right half of screen for camera
        if (touch.clientX > window.innerWidth / 2) {
          touchId = touch.identifier;
          lastTouchX = touch.clientX;
          lastTouchY = touch.clientY;
        }
      }
    };

    const handleTouchMove = (e) => {
      if (touchId === null) return;

      for (const touch of e.touches) {
        if (touch.identifier === touchId) {
          const deltaX = touch.clientX - lastTouchX;
          const deltaY = touch.clientY - lastTouchY;

          cameraYaw.current -= deltaX * 0.008;
          cameraPitch.current = Math.max(0.1, Math.min(0.8, cameraPitch.current + deltaY * 0.005));

          lastTouchX = touch.clientX;
          lastTouchY = touch.clientY;
          break;
        }
      }
    };

    const handleTouchEnd = (e) => {
      let found = false;
      for (const touch of e.touches) {
        if (touch.identifier === touchId) {
          found = true;
          break;
        }
      }
      if (!found) {
        touchId = null;
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, mobileInput]);

  // Main update loop
  useFrame((state, delta) => {
    if (!enabled) return;

    // Handle camera joystick input - increased sensitivity for snappier feel
    if (cameraInput) {
      const camX = cameraInput.x || 0;
      const camY = cameraInput.y || 0;

      if (Math.abs(camX) > 0.1 || Math.abs(camY) > 0.1) {
        // Rotate camera based on joystick - faster rotation
        cameraYaw.current -= camX * 0.06;
        cameraPitch.current = Math.max(0.1, Math.min(0.8, cameraPitch.current + camY * 0.04));
      }
    }

    // Get movement input (keyboard or mobile)
    let inputX = 0;
    let inputZ = 0;

    if (mobileInput) {
      inputX = mobileInput.x || 0;
      inputZ = mobileInput.y || 0;
    } else {
      inputZ = (keys.current.forward ? 1 : 0) - (keys.current.backward ? 1 : 0);
      inputX = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
    }

    const hasInput = Math.abs(inputX) > 0.1 || Math.abs(inputZ) > 0.1;

    if (hasInput !== isMoving.current) {
      isMoving.current = hasInput;
      onMovingChange?.(hasInput);
    }

    if (hasInput) {
      // Calculate movement direction relative to camera
      const cameraForward = new THREE.Vector3(
        -Math.sin(cameraYaw.current),
        0,
        -Math.cos(cameraYaw.current)
      ).normalize();

      const cameraRight = new THREE.Vector3(
        Math.cos(cameraYaw.current),
        0,
        -Math.sin(cameraYaw.current)
      ).normalize();

      // Calculate movement vector
      velocity.current.set(0, 0, 0);
      velocity.current.addScaledVector(cameraForward, inputZ * moveSpeed);
      velocity.current.addScaledVector(cameraRight, inputX * moveSpeed);

      // Update position
      characterPos.current.add(velocity.current);

      // Clamp to bounds
      characterPos.current.x = Math.max(bounds.minX, Math.min(bounds.maxX, characterPos.current.x));
      characterPos.current.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, characterPos.current.z));

      // Rotate character to face movement direction
      if (velocity.current.length() > 0.01) {
        targetRotation.current = Math.atan2(velocity.current.x, velocity.current.z);
      }
    }

    // Smooth rotation
    let rotDiff = targetRotation.current - characterRotation.current;
    // Handle wrap-around
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    characterRotation.current += rotDiff * rotationSpeed;

    // Update position/rotation refs directly (no React state, no re-renders)
    if (positionRef) {
      positionRef.current = [characterPos.current.x, characterPos.current.y, characterPos.current.z];
    }
    if (rotationRef) {
      rotationRef.current = characterRotation.current;
    }

    // Calculate camera position (orbit around character)
    const targetCameraPos = new THREE.Vector3(
      characterPos.current.x + Math.sin(cameraYaw.current) * cameraDistance.current,
      characterPos.current.y + cameraDistance.current * cameraPitch.current + 1,
      characterPos.current.z + Math.cos(cameraYaw.current) * cameraDistance.current
    );

    // Smooth camera position
    currentCameraPos.current.lerp(targetCameraPos, cameraLerpFactor);
    camera.position.copy(currentCameraPos.current);

    // Calculate look-at point (character position + offset)
    const targetLookAt = new THREE.Vector3(
      characterPos.current.x,
      characterPos.current.y + 1.2,
      characterPos.current.z
    );

    // Smooth look-at
    currentLookAt.current.lerp(targetLookAt, lookLerpFactor);
    camera.lookAt(currentLookAt.current);
  });

  // Initialize camera position
  useEffect(() => {
    if (!enabled) return;

    currentCameraPos.current.set(
      characterPos.current.x,
      characterPos.current.y + 3,
      characterPos.current.z + 5
    );
    currentLookAt.current.copy(characterPos.current);
    camera.position.copy(currentCameraPos.current);
  }, [camera, enabled]);

  return null;
}

export default ThirdPersonControls;
