import { useState, useRef, useEffect, useCallback } from "react";
import "./MobileControls.css";

function MobileControls({ onInputChange, visible = true }) {
  const joystickRef = useRef(null);
  const knobRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const touchId = useRef(null);
  const centerPos = useRef({ x: 0, y: 0 });

  const joystickRadius = 50;
  const knobRadius = 25;
  const maxDistance = joystickRadius - knobRadius;

  const handleStart = useCallback((clientX, clientY, identifier) => {
    if (!joystickRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    centerPos.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    touchId.current = identifier;
    setIsActive(true);

    // Calculate initial position
    handleMove(clientX, clientY);
  }, []);

  const handleMove = useCallback((clientX, clientY) => {
    if (!knobRef.current || !isActive) return;

    const deltaX = clientX - centerPos.current.x;
    const deltaY = clientY - centerPos.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let clampedX = deltaX;
    let clampedY = deltaY;

    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      clampedX = Math.cos(angle) * maxDistance;
      clampedY = Math.sin(angle) * maxDistance;
    }

    // Update knob position
    knobRef.current.style.transform = `translate(${clampedX}px, ${clampedY}px)`;

    // Normalize input to -1 to 1 range
    const normalizedX = clampedX / maxDistance;
    const normalizedY = -clampedY / maxDistance; // Invert Y for forward/backward

    onInputChange?.({ x: normalizedX, y: normalizedY });
  }, [isActive, maxDistance, onInputChange]);

  const handleEnd = useCallback(() => {
    touchId.current = null;
    setIsActive(false);

    if (knobRef.current) {
      knobRef.current.style.transform = "translate(0px, 0px)";
    }

    onInputChange?.({ x: 0, y: 0 });
  }, [onInputChange]);

  // Touch event handlers
  useEffect(() => {
    if (!visible) return;

    const handleTouchStart = (e) => {
      // Only handle touches on the left side of the screen
      for (const touch of e.changedTouches) {
        if (touch.clientX < window.innerWidth / 2 && touchId.current === null) {
          e.preventDefault();
          handleStart(touch.clientX, touch.clientY, touch.identifier);
          break;
        }
      }
    };

    const handleTouchMove = (e) => {
      if (touchId.current === null) return;

      for (const touch of e.changedTouches) {
        if (touch.identifier === touchId.current) {
          e.preventDefault();
          handleMove(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const handleTouchEnd = (e) => {
      if (touchId.current === null) return;

      for (const touch of e.changedTouches) {
        if (touch.identifier === touchId.current) {
          handleEnd();
          break;
        }
      }
    };

    // Add listeners to document to capture all touches
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
  }, [visible, handleStart, handleMove, handleEnd]);

  if (!visible) return null;

  return (
    <div className="mobile-controls">
      {/* Movement joystick */}
      <div
        ref={joystickRef}
        className={`joystick-base ${isActive ? "active" : ""}`}
      >
        <div ref={knobRef} className="joystick-knob" />
        <div className="joystick-directions">
          <span className="dir-up">W</span>
          <span className="dir-down">S</span>
          <span className="dir-left">A</span>
          <span className="dir-right">D</span>
        </div>
      </div>

      {/* Camera hint */}
      <div className="camera-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8M8 12h8" />
        </svg>
        <span>Drag right side to look</span>
      </div>

      {/* Action button */}
      <div className="action-buttons">
        <button className="action-btn interact-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default MobileControls;
