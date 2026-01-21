import { useState, useRef, useEffect, useCallback } from "react";
import "./MobileControls.css";

function MobileControls({ onInputChange, onCameraChange, visible = true }) {
  // Movement joystick state
  const moveJoystickRef = useRef(null);
  const moveKnobRef = useRef(null);
  const [isMoveActive, setIsMoveActive] = useState(false);
  const moveTouchId = useRef(null);
  const moveCenterPos = useRef({ x: 0, y: 0 });

  // Camera joystick state
  const camJoystickRef = useRef(null);
  const camKnobRef = useRef(null);
  const [isCamActive, setIsCamActive] = useState(false);
  const camTouchId = useRef(null);
  const camCenterPos = useRef({ x: 0, y: 0 });

  const joystickRadius = 50;
  const knobRadius = 25;
  const maxDistance = joystickRadius - knobRadius;

  // Movement joystick handlers
  const handleMoveStart = useCallback((clientX, clientY, identifier) => {
    if (!moveJoystickRef.current) return;

    const rect = moveJoystickRef.current.getBoundingClientRect();
    moveCenterPos.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    moveTouchId.current = identifier;
    setIsMoveActive(true);
    handleMoveUpdate(clientX, clientY);
  }, []);

  const handleMoveUpdate = useCallback((clientX, clientY) => {
    if (!moveKnobRef.current) return;

    const deltaX = clientX - moveCenterPos.current.x;
    const deltaY = clientY - moveCenterPos.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let clampedX = deltaX;
    let clampedY = deltaY;

    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      clampedX = Math.cos(angle) * maxDistance;
      clampedY = Math.sin(angle) * maxDistance;
    }

    moveKnobRef.current.style.transform = `translate(${clampedX}px, ${clampedY}px)`;

    const normalizedX = clampedX / maxDistance;
    const normalizedY = -clampedY / maxDistance;

    onInputChange?.({ x: normalizedX, y: normalizedY });
  }, [maxDistance, onInputChange]);

  const handleMoveEnd = useCallback(() => {
    moveTouchId.current = null;
    setIsMoveActive(false);

    if (moveKnobRef.current) {
      moveKnobRef.current.style.transform = "translate(0px, 0px)";
    }

    onInputChange?.({ x: 0, y: 0 });
  }, [onInputChange]);

  // Camera joystick handlers
  const handleCamStart = useCallback((clientX, clientY, identifier) => {
    if (!camJoystickRef.current) return;

    const rect = camJoystickRef.current.getBoundingClientRect();
    camCenterPos.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    camTouchId.current = identifier;
    setIsCamActive(true);
    handleCamUpdate(clientX, clientY);
  }, []);

  const handleCamUpdate = useCallback((clientX, clientY) => {
    if (!camKnobRef.current) return;

    const deltaX = clientX - camCenterPos.current.x;
    const deltaY = clientY - camCenterPos.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let clampedX = deltaX;
    let clampedY = deltaY;

    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      clampedX = Math.cos(angle) * maxDistance;
      clampedY = Math.sin(angle) * maxDistance;
    }

    camKnobRef.current.style.transform = `translate(${clampedX}px, ${clampedY}px)`;

    const normalizedX = clampedX / maxDistance;
    const normalizedY = clampedY / maxDistance;

    onCameraChange?.({ x: normalizedX, y: normalizedY });
  }, [maxDistance, onCameraChange]);

  const handleCamEnd = useCallback(() => {
    camTouchId.current = null;
    setIsCamActive(false);

    if (camKnobRef.current) {
      camKnobRef.current.style.transform = "translate(0px, 0px)";
    }

    onCameraChange?.({ x: 0, y: 0 });
  }, [onCameraChange]);

  // Touch event handlers
  useEffect(() => {
    if (!visible) return;

    const handleTouchStart = (e) => {
      for (const touch of e.changedTouches) {
        const isLeftSide = touch.clientX < window.innerWidth / 2;

        if (isLeftSide && moveTouchId.current === null) {
          e.preventDefault();
          handleMoveStart(touch.clientX, touch.clientY, touch.identifier);
        } else if (!isLeftSide && camTouchId.current === null) {
          e.preventDefault();
          handleCamStart(touch.clientX, touch.clientY, touch.identifier);
        }
      }
    };

    const handleTouchMove = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === moveTouchId.current) {
          e.preventDefault();
          handleMoveUpdate(touch.clientX, touch.clientY);
        } else if (touch.identifier === camTouchId.current) {
          e.preventDefault();
          handleCamUpdate(touch.clientX, touch.clientY);
        }
      }
    };

    const handleTouchEnd = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === moveTouchId.current) {
          handleMoveEnd();
        } else if (touch.identifier === camTouchId.current) {
          handleCamEnd();
        }
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
    document.addEventListener("touchcancel", handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [visible, handleMoveStart, handleMoveUpdate, handleMoveEnd, handleCamStart, handleCamUpdate, handleCamEnd]);

  if (!visible) return null;

  return (
    <div className="mobile-controls">
      {/* Movement joystick - Left side */}
      <div
        ref={moveJoystickRef}
        className={`joystick-base move-joystick ${isMoveActive ? "active" : ""}`}
      >
        <div ref={moveKnobRef} className="joystick-knob move-knob" />
        <div className="joystick-directions">
          <span className="dir-up">W</span>
          <span className="dir-down">S</span>
          <span className="dir-left">A</span>
          <span className="dir-right">D</span>
        </div>
        <span className="joystick-label">MOVE</span>
      </div>

      {/* Camera joystick - Right side */}
      <div
        ref={camJoystickRef}
        className={`joystick-base camera-joystick ${isCamActive ? "active" : ""}`}
      >
        <div ref={camKnobRef} className="joystick-knob camera-knob" />
        <div className="joystick-directions">
          <span className="dir-up">↑</span>
          <span className="dir-down">↓</span>
          <span className="dir-left">←</span>
          <span className="dir-right">→</span>
        </div>
        <span className="joystick-label">LOOK</span>
      </div>
    </div>
  );
}

export default MobileControls;
