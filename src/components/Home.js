import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import "./Home.css";

function Home() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [dotPosition, setDotPosition] = useState({ x: 0, y: 0 });
  const [trails, setTrails] = useState([]);

  // Cursor effect
  useEffect(() => {
    const moveCursor = (e) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
      setTimeout(() => setDotPosition({ x: e.clientX, y: e.clientY }), 50);
      setTrails((prevTrails) => {
        const newTrails = [...prevTrails, { x: e.clientX, y: e.clientY }];
        return newTrails.length > 20
          ? newTrails.slice(newTrails.length - 20)
          : newTrails;
      });
    };

    window.addEventListener("mousemove", moveCursor);
    const cleanupInterval = setInterval(() => {
      setTrails((prevTrails) => prevTrails.slice(1));
    }, 50);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      clearInterval(cleanupInterval);
    };
  }, []);

  return (
    <div className="home-container">
      {/* Custom cursor */}
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

      {/* Trail effect */}
      {trails.map((trail, index) => (
        <div
          key={index}
          className="trail"
          style={{
            left: trail.x,
            top: trail.y,
            opacity: (index + 1) / trails.length,
          }}
        />
      ))}

      <div className="home-overlay">
        <Navbar />
        <div className="home-content">
          <div className="welcome-text">
            {/* <h1>WELCOME TO ERU</h1>
            <h1>CHATBOT SOCIETY</h1> */}
            <img src="/assets/title.png" alt="ERU Title" />
          </div>

          <div className="welcome-message">
            <p>
              Already have an account? Click {" "}
              {
                <Link
                  style={{
                    textDecoration: "none",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                  to="/login"
                >
                  Log in
                </Link>
              }
              {" "}
              to access your resources.
            </p>
            <p>
              If not, click{" "}
              {
                <Link
                  style={{
                    textDecoration: "none",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                  to="/signup"
                >
                  Sign up
                </Link>
              }{" "}
              to join and start your learning journey
            </p>
          </div>

          <div className="auth-buttons">
            <Link to="/login">
              <button className="home-login-button">Log in</button>
            </Link>

            <Link to="/signup">
              <button className="home-signup-button">Sign up</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
