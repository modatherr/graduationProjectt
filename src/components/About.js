import { useEffect, useState } from "react";
import "./About.css";
import Navbar from "./Navbar";

function About() {
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
        <div className="about-container">
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

            <div className="about-overlay">
                <Navbar />
                <br />

                <div className="about-content">
                    <div className="about-section main-section">
                        <h2>About ERU Chatbot</h2>
                        <p>
                            Welcome to ERU Chatbot, your intelligent companion for mastering languages. 
                            Our AI-powered platform combines cutting-edge technology with personalized 
                            learning to create an immersive and effective language learning experience.
                        </p>
                    </div>

                    <div className="about-section features">
                        <h2>Key Features</h2>
                        <div className="features-grid">
                            <div className="feature-card">
                                <i className="fas fa-brain"></i>
                                <h3>AI-Powered Learning</h3>
                                <p>Advanced language models adapt to your learning style and pace</p>
                            </div>
                            <div className="feature-card">
                                <i className="fas fa-comments"></i>
                                <h3>Natural Conversations</h3>
                                <p>Practice real-world conversations with our intelligent chatbot</p>
                            </div>
                            <div className="feature-card">
                                <i className="fas fa-chart-line"></i>
                                <h3>Progress Tracking</h3>
                                <p>Monitor your improvement with detailed analytics and insights</p>
                            </div>
                            <div className="feature-card">
                                <i className="fas fa-user-graduate"></i>
                                <h3>Personalized Path</h3>
                                <p>Custom learning paths tailored to your goals and interests</p>
                            </div>
                        </div>
                    </div>

                    <div className="about-section mission">
                        <h2>Our Mission</h2>
                        <p>
                            We're on a mission to revolutionize language learning by making it more 
                            accessible, engaging, and effective through the power of artificial intelligence. 
                            Our goal is to break down language barriers and connect people across cultures.
                        </p>
                    </div>

                    <div className="about-section team-section">
                        <h2>Meet Our Team</h2>
                        <div className="team-members">
                            <div className="team-member" data-aos="fade-up">
                                <div className="member-image">
                                    <img src="/assets/team/member1.jpg" alt="Team Member" />
                                </div>
                                <h3>Mohamed Abdelaziz</h3>
                                <p className="role">Project Lead & AI Architect</p>
                                <p className="description">Leading the technical vision and AI implementation</p>
                                <div className="social-links">
                                    <a href="#" target="_blank" rel="noopener noreferrer">
                                        <i className="fab fa-linkedin"></i>
                                    </a>
                                    <a href="#" target="_blank" rel="noopener noreferrer">
                                        <i className="fab fa-github"></i>
                                    </a>
                                </div>
                            </div>
                            <div className="team-member" data-aos="fade-up" data-aos-delay="100">
                                <div className="member-image">
                                    <img src="/assets/team/member2.jpg" alt="Team Member" />
                                </div>
                                <h3>Ahmed Hassan</h3>
                                <p className="role">Full Stack Developer</p>
                                <p className="description">Building robust and scalable solutions</p>
                                <div className="social-links">
                                    <a href="#" target="_blank" rel="noopener noreferrer">
                                        <i className="fab fa-linkedin"></i>
                                    </a>
                                    <a href="#" target="_blank" rel="noopener noreferrer">
                                        <i className="fab fa-github"></i>
                                    </a>
                                </div>
                            </div>
                            <div className="team-member" data-aos="fade-up" data-aos-delay="200">
                                <div className="member-image">
                                    <img src="/assets/team/member3.jpg" alt="Team Member" />
                                </div>
                                <h3>Sarah Mohamed</h3>
                                <p className="role">UI/UX Designer</p>
                                <p className="description">Crafting beautiful user experiences</p>
                                <div className="social-links">
                                    <a href="#" target="_blank" rel="noopener noreferrer">
                                        <i className="fab fa-linkedin"></i>
                                    </a>
                                    <a href="#" target="_blank" rel="noopener noreferrer">
                                        <i className="fab fa-github"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="about-section contact">
                        <h2>Get in Touch</h2>
                        <p>
                            Have questions or suggestions? We'd love to hear from you! 
                            Reach out to us through our social media channels or drop us an email.
                        </p>
                        <div className="contact-links">
                            <a href="mailto:contact@eruchatbot.com" className="contact-button">
                                <i className="fas fa-envelope"></i> Email Us
                            </a>
                            <a href="#" className="contact-button">
                                <i className="fab fa-twitter"></i> Follow Us
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default About;