import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import LectureSummarizer from './LectureSummarizer';
import './AIChat.css';
import QuizGenerator from './QuizGenerator';
import CVBuilder from './CVBuilder';
import ProgrammingRoadmap from './ProgrammingRoadmap';

const AIChat = () => {
    const [selectedOption, setSelectedOption] = useState(null);
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    const [dotPosition, setDotPosition] = useState({ x: 0, y: 0 });
    const [trails, setTrails] = useState([]);

    const chatOptions = [
        {
            id: 'lectures',
            title: 'Lecture Summarizer',
            description: 'Upload your lecture materials and get concise summaries',
            icon: '📚'
        },
        {
            id: 'quizzes',
            title: 'Practical Quizzes',
            description: 'Test your knowledge with AI-generated practice questions',
            icon: '✍️'
        },
        {
            id: 'cv',
            title: 'CV Building Assistant',
            description: 'Get professional help in crafting your perfect CV',
            icon: '📝'
        },
        {
            id: 'programming',
            title: 'Programming Roadmap',
            description: 'Personalized learning paths for programming skills',
            icon: '💻'
        }
    ];

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

    const handleOptionClick = (optionId) => {
        setSelectedOption(optionId);
    };

    const renderContent = () => {
        switch (selectedOption) {
            case 'lectures':
                return <LectureSummarizer />;
            case 'quizzes':
                return <QuizGenerator />
            case 'cv':
                return <CVBuilder />;
            case 'programming':
                return <ProgrammingRoadmap />;
            default:
                return (
                    <div className="options-grid">
                        {chatOptions.map((option) => (
                            <div
                                key={option.id}
                                className={`option-card ${selectedOption === option.id ? 'selected' : ''}`}
                                onClick={() => handleOptionClick(option.id)}
                            >
                                <div className="option-icon">{option.icon}</div>
                                <h2>{option.title}</h2>
                                <p>{option.description}</p>
                            </div>
                        ))}
                    </div>
                );
        }
    };

    return (
        <div className="aichat-container">
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
            <div className="aichat-overlay">
                <Navbar />
                <div className="aichat-content">
                    <div className="aichat-header">
                        <h1>AI Assistant</h1>
                        {!selectedOption && <p>Choose an option to get started</p>}
                    </div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default AIChat;
