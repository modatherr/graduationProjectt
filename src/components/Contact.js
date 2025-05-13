import React, { useState, useEffect } from "react";
import "./Contact.css";
import Navbar from "./Navbar";
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaLinkedin, FaGithub, FaTwitter } from 'react-icons/fa';

function Contact() {
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    const [dotPosition, setDotPosition] = useState({ x: 0, y: 0 });
    const [trails, setTrails] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: Implement actual form submission logic
        alert("Message sent! We'll get back to you soon.");
        setFormData({
            name: "",
            email: "",
            subject: "",
            message: ""
        });
    };

    return (
        <div className="contact-container">
            {/* Overlay */}
            <div className="contact-overlay" />

            {/* Content */}
            <div className="contact-content-wrapper">
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

                <Navbar />
                
                <div className="contact-wrapper">
                    <div className="contact-content">
                        <div className="contact-left">
                            <div className="contact-header">
                                <h1>Contact Us</h1>
                                <p>Have questions or want to collaborate? Reach out to our team!</p>
                            </div>

                            <div className="contact-info-grid">
                                <div className="contact-info-item">
                                    <FaEnvelope className="contact-icon" />
                                    <div>
                                        <h3>Email</h3>
                                        <p>info@eruchatbot.com</p>
                                    </div>
                                </div>
                                <div className="contact-info-item">
                                    <FaPhone className="contact-icon" />
                                    <div>
                                        <h3>Phone</h3>
                                        <p>+20 123 456 7890</p>
                                    </div>
                                </div>
                                <div className="contact-info-item">
                                    <FaMapMarkerAlt className="contact-icon" />
                                    <div>
                                        <h3>Location</h3>
                                        <p>Cairo, Egypt</p>
                                    </div>
                                </div>
                            </div>

                            <div className="social-links">
                                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                                    <FaLinkedin />
                                </a>
                                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                                    <FaGithub />
                                </a>
                                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                                    <FaTwitter />
                                </a>
                            </div>
                        </div>

                        <div className="contact-right">
                            <form onSubmit={handleSubmit} className="contact-form">
                                <div className="form-group">
                                    <label htmlFor="name">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter your email"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="subject">Subject</label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter message subject"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="message">Your Message</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        placeholder="Type your message here"
                                        rows="5"
                                    ></textarea>
                                </div>

                                <button type="submit" className="submit-btn">
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Contact;
