// Import necessary React hooks and styles
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Login.css";

// Main Login component
function Login() {
  // State management for form inputs and UI elements
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // State for custom cursor and trail effects
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [dotPosition, setDotPosition] = useState({ x: 0, y: 0 });
  const [trails, setTrails] = useState([]);

  const navigate = useNavigate();

  // Effect hook for cursor movement and trail animations
  useEffect(() => {
    // Function to handle cursor movement
    const moveCursor = (e) => {
      // Update main cursor position immediately
      setCursorPosition({ x: e.clientX, y: e.clientY });

      // Add smooth delay to dot movement for trailing effect
      setTimeout(() => {
        setDotPosition({ x: e.clientX, y: e.clientY });
      }, 50);

      // Create trail effect by adding new trail points
      setTrails((prevTrails) => {
        const newTrail = {
          x: e.clientX,
          y: e.clientY,
          id: Date.now(),
        };
        // Keep only the last 15 trail points
        const updatedTrails = [...prevTrails, newTrail].slice(-15);
        return updatedTrails;
      });
    };

    // Add mouse move event listener
    window.addEventListener("mousemove", moveCursor);

    // Cleanup trails periodically
    const cleanupInterval = setInterval(() => {
      setTrails((prevTrails) => prevTrails.slice(1));
    }, 50);

    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener("mousemove", moveCursor);
      clearInterval(cleanupInterval);
    };
  }, []);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Add login logic here
  };

  // Utility function to clear input fields
  const clearInput = (setter) => {
    setter("");
  };

  return (
    <div className="login-container">
      {/* Custom cursor elements */}
      <div
        className="cursor"
        style={{ left: cursorPosition.x, top: cursorPosition.y }}
      />
      <div
        className="cursor-dot"
        style={{ left: dotPosition.x, top: dotPosition.y }}
      />
      <div
        className="glow"
        style={{ left: cursorPosition.x, top: cursorPosition.y }}
      />

      {/* Trail effect elements */}
      {trails.map((trail, index) => (
        <div
          key={trail.id}
          className="trail"
          style={{
            left: trail.x,
            top: trail.y,
            opacity: (index + 1) / trails.length,
          }}
        />
      ))}

      {/* Main login content */}
      <div className="login-overlay">
        <Navbar />
        <div className="login-content">
          <h1>LOG IN</h1>
          <br />
          <form onSubmit={handleSubmit}>
            {/* Email input field */}
            <div className="input-group">
              <div className="input-wrapper">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Please enter your e-mail"
                  required
                />
                {email && (
                  <button
                    type="button"
                    className="clear-input"
                    onClick={() => clearInput(setEmail)}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Password input field */}
            <div className="input-group">
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Please enter your password"
                  required
                />
                {password && (
                  <button
                    type="button"
                    className="clear-input"
                    onClick={() => clearInput(setPassword)}
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="login-options">
                <label>
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                  />
                  Show Password
                </label>
                <Link to="/forgot-password" className="forgot-password-link">
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Submit button */}
            <button type="submit" className="login-button">
              Log in
            </button>

            {/* Signup link */}
            <div className="auth-switch">
              Don't have an account?{" "}
              <Link to="/signup" className="auth-link">
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Export the Login component
export default Login;
