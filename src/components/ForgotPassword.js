import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add email validation logic here
    navigate('/verification', { state: { email } });
  };

  const handleClearInput = () => {
    setEmail('');
  };

  return (
    <div className="forgot-password-container">
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

      <div className="forgot-password-overlay">
        <div className="forgot-password-content">
          <h1>Forgot Password</h1>
          <h2>Enter your email to reset your password</h2>

          <div className="verification-image">
            <img src="assets/verification.png" alt="Verification" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-wrapper">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              {email && (
                <button
                  type="button"
                  className="clear-input"
                  onClick={handleClearInput}
                >
                  ×
                </button>
              )}
            </div>

            <div className="button-group">
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate('/login')}
              >
                Cancel
              </button>
              <button type="submit" className="confirm-button">
                Confirm
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
