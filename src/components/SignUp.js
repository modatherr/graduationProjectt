// Import necessary React hooks and styles
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./SignUp.css";

function SignUp() {
  // State management for form inputs
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [dotPosition, setDotPosition] = useState({ x: 0, y: 0 });
  const [trails, setTrails] = useState([]);
  const navigate = useNavigate();

  // Track cursor position
  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });

      setTimeout(() => {
        setDotPosition({ x: e.clientX, y: e.clientY });
      }, 50);

      setTrails((prevTrails) => {
        const newTrail = {
          x: e.clientX,
          y: e.clientY,
          id: Date.now(),
        };
        const updatedTrails = [...prevTrails, newTrail].slice(-15);
        return updatedTrails;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    const cleanupInterval = setInterval(() => {
      setTrails((prevTrails) => prevTrails.slice(1));
    }, 50);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(cleanupInterval);
    };
  }, []);

  // Move button away from cursor if passwords don't match
  useEffect(() => {
    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      const buttonElement = document.querySelector(".signup-button");

      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        const buttonCenterX = rect.left + rect.width / 2;
        const buttonCenterY = rect.top + rect.height / 2;

        // Calculate direction from cursor to button
        const angle = Math.atan2(
          cursorPosition.y - buttonCenterY,
          cursorPosition.x - buttonCenterX
        );

        // Calculate distance between cursor and button
        const distance = Math.sqrt(
          Math.pow(cursorPosition.x - buttonCenterX, 2) +
            Math.pow(cursorPosition.y - buttonCenterY, 2)
        );

        // Move further and faster when cursor is closer
        const moveDistance = Math.min(200, 400 / (distance / 50));
        const moveX = Math.cos(angle) * -moveDistance;
        const moveY = Math.sin(angle) * -moveDistance;

        setButtonPosition({ x: moveX, y: moveY });
      }
    } else {
      // Reset button position when passwords match
      setButtonPosition({ x: 0, y: 0 });
    }
  }, [cursorPosition, formData.password, formData.confirmPassword]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password === formData.confirmPassword) {
      // Proceed with signup
      console.log("Signup successful!", formData);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const passwordsMatch = formData.password === formData.confirmPassword;

  return (
    <div className="signup-container">
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

      <div className="signup-overlay">
        <Navbar />
        <div className="signup-content">
          <h1>SIGN UP</h1>
          <br />
          <form onSubmit={handleSubmit}>
            {/* Name input field */}
            <div className="input-wrapper">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Please enter your name"
                required
              />
              {formData.name && (
                <button
                  type="button"
                  className="clear-input"
                  onClick={() =>
                    handleInputChange({ target: { name: "name", value: "" } })
                  }
                >
                  ×
                </button>
              )}
            </div>

            {/* Email input field */}
            <div className="input-wrapper">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Please enter your e-mail"
                required
              />
              {formData.email && (
                <button
                  type="button"
                  className="clear-input"
                  onClick={() =>
                    handleInputChange({ target: { name: "email", value: "" } })
                  }
                >
                  ×
                </button>
              )}
            </div>

            {/* Password input field */}
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Please enter your password"
                required
              />
              {formData.password && (
                <button
                  type="button"
                  className="clear-input"
                  onClick={() =>
                    handleInputChange({
                      target: { name: "password", value: "" },
                    })
                  }
                >
                  ×
                </button>
              )}
            </div>

            {/* Confirm Password input field */}
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Please confirm your password"
                className={
                  !passwordsMatch && formData.confirmPassword
                    ? "password-mismatch"
                    : ""
                }
              />
              {formData.confirmPassword && (
                <button
                  type="button"
                  className="clear-input"
                  onClick={() =>
                    handleInputChange({
                      target: { name: "confirmPassword", value: "" },
                    })
                  }
                >
                  ×
                </button>
              )}
            </div>

            {/* Options */}
            <div className="signup-options">
              <label>
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={togglePasswordVisibility}
                />{" "}
                Show Password
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />{" "}
                Remember me
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className={`signup-button ${!passwordsMatch ? "run-away" : ""}`}
              style={{
                transform:
                  buttonPosition.x || buttonPosition.y
                    ? `translate(${buttonPosition.x}px, ${buttonPosition.y}px)`
                    : "none",
              }}
              disabled={!passwordsMatch}
            >
              SIGN UP
            </button>

            {/* Login link */}
            <div className="auth-switch">
              Already have an account?{" "}
              <Link to="/login" className="auth-link">
                Log In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
