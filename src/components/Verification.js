import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Verification.css';

function Verification() {
  const [code, setCode] = useState(['', '', '', '']);
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

  const handleCodeChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value !== '' && index < 3) {
        const nextInput = document.querySelector(`input[name="code-${index + 1}"]`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      const prevInput = document.querySelector(`input[name="code-${index - 1}"]`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleResendCode = () => {
    // Add resend code logic here
    console.log('Resending code to:', email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const verificationCode = code.join('');
    console.log('Verifying code:', verificationCode);
    // Add verification logic here
    navigate('/reset-password', { state: { email } });
  };

  return (
    <div className="verification-container">
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

      <div className="verification-overlay">
        <div className="verification-content">
          <div className="verification-image">
            <img src="assets/verification.png" alt="Verification" />
          </div>
          
          <div className="verification-text">
            <p>We've sent a code to</p>
            <p className="email">{email}</p>
          </div>

          <form onSubmit={handleSubmit} className="verification-form">
            <div className="code-inputs">
              {code.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  name={`code-${index}`}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  maxLength={1}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <div className="resend-code">
              <span>Didn't get a code?</span>
              <button type="button" onClick={handleResendCode} className="resend-button">
                Click to resend
              </button>
            </div>

            <div className="button-group">
              <button type="button" className="cancel-button" onClick={() => navigate('/forgot-password')}>
                Cancel
              </button>
              <button type="submit" className="verify-button">
                Verify
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Verification;
