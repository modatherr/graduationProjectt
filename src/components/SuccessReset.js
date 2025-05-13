import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SuccessReset.css';

function SuccessReset() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [dotPosition, setDotPosition] = useState({ x: 0, y: 0 });
  const [trails, setTrails] = useState([]);
  const navigate = useNavigate();

  // Cursor effect
  useEffect(() => {
    const moveCursor = (e) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
      setTimeout(() => setDotPosition({ x: e.clientX, y: e.clientY }), 50);
      setTrails(prevTrails => {
        const newTrails = [...prevTrails, { x: e.clientX, y: e.clientY }];
        return newTrails.length > 20 ? newTrails.slice(newTrails.length - 20) : newTrails;
      });
    };

    window.addEventListener('mousemove', moveCursor);
    const cleanupInterval = setInterval(() => {
      setTrails(prevTrails => prevTrails.slice(1));
    }, 50);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      clearInterval(cleanupInterval);
    };
  }, []);

  return (
    <div className="success-reset-container">
      {/* Custom cursor */}
      <div className="custom-cursor" style={{ left: cursorPosition.x, top: cursorPosition.y }}></div>
      <div className="cursor-dot" style={{ left: dotPosition.x, top: dotPosition.y }}></div>
      {trails.map((trail, index) => (
        <div
          key={index}
          className="cursor-trail"
          style={{
            left: trail.x,
            top: trail.y,
            opacity: index / trails.length,
          }}
        ></div>
      ))}

      <div className="success-reset-overlay">
        <div className="success-reset-content">
          <div className="success-reset-image">
            <img src="assets/password-reset.png" alt="Success" />
          </div>

          <h1>Password updated successfully!</h1>
          <p>You can now log in with your new password.</p>

          <button className="done-button" onClick={() => navigate('/login')}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default SuccessReset;
