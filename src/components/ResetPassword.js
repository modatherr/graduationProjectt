import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ResetPassword.css';

function ResetPassword() {
  const [passwords, setPasswords] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [dotPosition, setDotPosition] = useState({ x: 0, y: 0 });
  const [trails, setTrails] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passwords.password !== passwords.confirmPassword) {
      // Add error handling for password mismatch
      return;
    }
    if (passwords.password.length < 8) {
      // Add error handling for password length
      return;
    }
    // Add password reset logic here
    console.log('Password reset successful');
    navigate('/success-reset');
  };

  return (
    <div className="reset-password-container">
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

      <div className="reset-password-overlay">
        <div className="reset-password-content">
          <div className="reset-password-image">
            <img src="assets/verification.png" alt="Reset Password" />
          </div>

          <h1>Set new password</h1>
          <p className="password-requirement">Must be at least 8 characters</p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>New password</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={passwords.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Confirm password</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="show-password">
              <label>
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                />
                Show Password
              </label>
            </div>

            <div className="button-group">
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate('/forgot-password')}
              >
                Cancel
              </button>
              <button type="submit" className="reset-button">
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
