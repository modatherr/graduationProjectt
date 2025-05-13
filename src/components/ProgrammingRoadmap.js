import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './ProgrammingRoadmap.css';

const TypeWriter = ({ text, speed = 10, onComplete }) => {
    const [displayText, setDisplayText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayText(prev => prev + text[currentIndex]);
                setCurrentIndex(currentIndex + 1);
            }, speed);

            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
    }, [currentIndex, text, speed, onComplete]);

    return <span>{displayText}</span>;
};

const ProgrammingRoadmap = () => {
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]);
    const [roadmap, setRoadmap] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState('language');
    const [isTyping, setIsTyping] = useState(false);
    const [displayedLines, setDisplayedLines] = useState([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [lines, setLines] = useState([]);

    const handleBack = () => {
        window.location.href = '/ai-chat';
    };

    useEffect(() => {
        if (roadmap) {
            setLines(roadmap.split('\n').filter(line => line.trim()));
        }
    }, [roadmap]);

    useEffect(() => {
        if (lines.length > 0 && !isTyping && currentLineIndex < lines.length) {
            setIsTyping(true);
        }
    }, [lines, currentLineIndex, isTyping]);

    const handleLineComplete = () => {
        setIsTyping(false);
        setCurrentLineIndex(prev => prev + 1);
        setDisplayedLines(prev => [...prev, lines[currentLineIndex]]);
    };

    const programmingLanguages = [
        { id: 'python', name: 'Python', icon: '🐍' },
        { id: 'javascript', name: 'JavaScript', icon: '📜' },
        { id: 'java', name: 'Java', icon: '☕' },
        { id: 'cpp', name: 'C++', icon: '⚡' },
        { id: 'csharp', name: 'C#', icon: '🎯' },
        { id: 'ruby', name: 'Ruby', icon: '💎' },
        { id: 'go', name: 'Go', icon: '🔵' },
        { id: 'rust', name: 'Rust', icon: '⚙️' },
        { id: 'swift', name: 'Swift', icon: '🦅' },
        { id: 'kotlin', name: 'Kotlin', icon: '🎨' },
        { id: 'typescript', name: 'TypeScript', icon: '📘' },
        { id: 'php', name: 'PHP', icon: '🐘' }
    ];

    const questions = {
        python: [
            'Have you used Python before?',
            'Are you familiar with object-oriented programming?',
            'Have you worked with Python libraries like NumPy or Pandas?',
            'Do you have experience with web frameworks like Django or Flask?',
            'Have you done any data science or machine learning projects?'
        ],
        javascript: [
            'Have you used JavaScript before?',
            'Are you familiar with modern ES6+ features?',
            'Have you worked with frameworks like React or Vue?',
            'Do you understand asynchronous programming (Promises, async/await)?',
            'Have you built any full-stack applications?'
        ],
        java: [
            'Have you used Java before?',
            'Are you familiar with object-oriented programming principles?',
            'Have you worked with Spring Framework?',
            'Do you understand Java Collections Framework?',
            'Have you built any Android applications?'
        ],
        cpp: [
            'Have you programmed in C++ before?',
            'Are you familiar with memory management in C++?',
            'Have you used STL (Standard Template Library)?',
            'Do you understand pointers and references?',
            'Have you worked on any game development projects?'
        ],
        csharp: [
            'Have you used C# before?',
            'Are you familiar with .NET Framework?',
            'Have you worked with ASP.NET?',
            'Do you understand LINQ?',
            'Have you developed any Windows applications?'
        ],
        ruby: [
            'Have you used Ruby before?',
            'Are you familiar with Ruby on Rails?',
            'Have you worked with gems and bundler?',
            'Do you understand Ruby metaprogramming?',
            'Have you built any web applications with Ruby?'
        ],
        go: [
            'Have you used Go before?',
            'Are you familiar with Go concurrency (goroutines)?',
            'Have you worked with Go packages and modules?',
            'Do you understand Go interfaces?',
            'Have you built any microservices with Go?'
        ],
        rust: [
            'Have you used Rust before?',
            'Are you familiar with Rust ownership model?',
            'Have you worked with cargo and crates?',
            'Do you understand lifetimes in Rust?',
            'Have you built any systems programming projects?'
        ],
        swift: [
            'Have you used Swift before?',
            'Are you familiar with iOS development?',
            'Have you worked with SwiftUI?',
            'Do you understand Swift protocols and extensions?',
            'Have you published any apps on the App Store?'
        ],
        kotlin: [
            'Have you used Kotlin before?',
            'Are you familiar with Android development?',
            'Have you worked with Kotlin coroutines?',
            'Do you understand Kotlin null safety?',
            'Have you built any Android apps with Kotlin?'
        ],
        typescript: [
            'Have you used TypeScript before?',
            'Are you familiar with TypeScript types and interfaces?',
            'Have you worked with decorators?',
            'Do you understand generics in TypeScript?',
            'Have you built any large-scale applications with TypeScript?'
        ],
        php: [
            'Have you used PHP before?',
            'Are you familiar with modern PHP frameworks like Laravel?',
            'Have you worked with Composer?',
            'Do you understand PHP namespaces and autoloading?',
            'Have you built any CMS or e-commerce sites?'
        ]
    };

    const handleLanguageSelect = (language) => {
        setSelectedLanguage(language);
        setCurrentQuestion(0);
        setUserAnswers([]);
        setStep('questions');
    };

    const handleAnswer = async (answer) => {
        const newAnswers = [...userAnswers, answer];
        setUserAnswers(newAnswers);

        if (currentQuestion < questions[selectedLanguage].length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setStep('roadmap');
            await generateRoadmap(newAnswers);
        }
    };

    const generateRoadmap = async (userAnswers) => {
        setLoading(true);
        setError('');
        try {
            const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `Create a detailed programming roadmap for ${selectedLanguage}. Do not use any special characters or markdown formatting. Format the response as plain text with clear headings and bullet points, based on the following user responses:

Questions and Answers:
${questions[selectedLanguage].map((q, i) => `Q: ${q}\nA: ${userAnswers[i]}`).join('\n\n')}

Structure the response with these exact headings and subheadings (without any special characters):

SKILL LEVEL ASSESSMENT
[Assess current skill level based on answers]

LEARNING PATH
Fundamentals
[List fundamental concepts to learn]

Intermediate Concepts
[List intermediate concepts]

Advanced Topics
[List advanced topics]

PROJECT SUGGESTIONS
Beginner Projects
[List beginner project ideas]

Intermediate Projects
[List intermediate project ideas]

Advanced Projects
[List advanced project ideas]

LEARNING RESOURCES
Documentation
[List official documentation]

Recommended Courses
[List recommended courses]

Tutorials and Books
[List tutorials and books]

TIMELINE
Phase 1: Fundamentals
[Estimated time and milestones]

Phase 2: Intermediate
[Estimated time and milestones]

Phase 3: Advanced
[Estimated time and milestones]

BEST PRACTICES
[List best practices]

COMMON PITFALLS
[List common pitfalls to avoid]

Important: Do not use any asterisks (*), hashes (#), or other special characters. Use plain text only.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            // Clean up any remaining special characters
            const cleanedText = response.text()
                .replace(/\*\*/g, '')  // Remove double asterisks
                .replace(/\*/g, '')    // Remove single asterisks
                .replace(/#+/g, '')    // Remove hash symbols
                .replace(/_{2,}/g, '') // Remove underscores
                .trim();
            setRoadmap(cleanedText);
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to generate roadmap. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const downloadAsHTML = () => {
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${programmingLanguages.find(l => l.id === selectedLanguage)?.name} Learning Roadmap</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    color: #333;
                    background-color: #f0f5ff;
                }
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding: 20px;
                    background: linear-gradient(to right, #e8f4fd, #d1e9fc, #e8f4fd);
                    border-radius: 8px;
                }
                h1 {
                    color: #2988e8;
                    margin-bottom: 20px;
                }
                h2 {
                    color: #2988e8;
                    border-bottom: 2px solid #2988e8;
                    padding-bottom: 10px;
                    margin-top: 30px;
                }
                h3 {
                    color: #2c3e50;
                    margin-top: 20px;
                }
                ul {
                    list-style-type: none;
                    padding-left: 0;
                }
                li {
                    margin: 10px 0;
                    padding-left: 20px;
                    position: relative;
                }
                li:before {
                    content: "•";
                    color: #2988e8;
                    position: absolute;
                    left: 0;
                }
                .section {
                    background: #ffffff;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                @media print {
                    body {
                        padding: 20px;
                    }
                    .section {
                        break-inside: avoid;
                        box-shadow: none;
                        border: 1px solid #eee;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${programmingLanguages.find(l => l.id === selectedLanguage)?.name} Learning Roadmap</h1>
            </div>
            ${roadmap.split('\n').map(line => {
            if (line.startsWith('# ')) {
                return `<div class="section"><h2>${line.substring(2)}</h2>`;
            } else if (line.startsWith('## ')) {
                return `<h3>${line.substring(3)}</h3>`;
            } else if (line.startsWith('- ')) {
                return `<li>${line.substring(2)}</li>`;
            } else if (line.trim() === '') {
                return '</div>';
            } else {
                return `<p>${line}</p>`;
            }
        }).join('\n')}
        </body>
        </html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedLanguage}_roadmap.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const renderLanguageSelection = () => (
        <div className="language-grid">
            {programmingLanguages.map(lang => (
                <button
                    key={lang.id}
                    className="language-card"
                    onClick={() => handleLanguageSelect(lang.id)}
                >
                    <span className="language-icon">{lang.icon}</span>
                    <span className="language-name">{lang.name}</span>
                </button>
            ))}
        </div>
    );

    const renderQuestions = () => (
        <div className="questions-container">
            <h3 className="question-text">{questions[selectedLanguage][currentQuestion]}</h3>
            <div className="answer-buttons">
                <button onClick={() => handleAnswer('Yes')}>Yes</button>
                <button onClick={() => handleAnswer('Somewhat')}>Somewhat</button>
                <button onClick={() => handleAnswer('No')}>No</button>
            </div>
            <div className="progress-bar">
                <div
                    className="progress"
                    style={{ width: `${((currentQuestion + 1) / questions[selectedLanguage].length) * 100}%` }}
                ></div>
            </div>
        </div>
    );

    const renderRoadmap = () => {
        return (
            <div className="roadmap-container">
                {loading ? (
                    <div className="loading">Generating your personalized roadmap...</div>
                ) : error ? (
                    <div className="error">{error}</div>
                ) : (
                    <div className="roadmap-content">
                        <h2>Your Personalized {programmingLanguages.find(l => l.id === selectedLanguage)?.name} Learning Roadmap</h2>
                        <div className="roadmap-sections">
                            {displayedLines.map((line, index) => {
                                const cleanLine = line.trim()
                                    .replace(/\*\*/g, '')
                                    .replace(/\*/g, '')
                                    .replace(/#+/g, '')
                                    .replace(/_{2,}/g, '');

                                if (/^[A-Z\s]+$/.test(cleanLine) && cleanLine.length > 3) {
                                    return (
                                        <div key={index} className="roadmap-section">
                                            <h2>{cleanLine}</h2>
                                        </div>
                                    );
                                } else if (cleanLine.includes(':')) {
                                    return <h3 key={index}>{cleanLine}</h3>;
                                } else if (cleanLine) {
                                    return (
                                        <div key={index} className="roadmap-item">
                                            <span className="bullet">•</span>
                                            <span>{cleanLine}</span>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                            {isTyping && currentLineIndex < lines.length && (
                                <div className="typing-line">
                                    {/^[A-Z\s]+$/.test(lines[currentLineIndex]) && lines[currentLineIndex].length > 3 ? (
                                        <div className="roadmap-section">
                                            <h2>
                                                <TypeWriter 
                                                    text={lines[currentLineIndex]} 
                                                    speed={5} 
                                                    onComplete={handleLineComplete}
                                                />
                                            </h2>
                                        </div>
                                    ) : lines[currentLineIndex].includes(':') ? (
                                        <h3>
                                            <TypeWriter 
                                                text={lines[currentLineIndex]} 
                                                speed={5} 
                                                onComplete={handleLineComplete}
                                            />
                                        </h3>
                                    ) : (
                                        <div className="roadmap-item">
                                            <span className="bullet">•</span>
                                            <span>
                                                <TypeWriter 
                                                    text={lines[currentLineIndex]} 
                                                    speed={5} 
                                                    onComplete={handleLineComplete}
                                                />
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {currentLineIndex >= lines.length && (
                            <div className="roadmap-actions">
                                <button className="download-button" onClick={downloadAsHTML}>
                                    Download as HTML
                                </button>
                                <button className="restart-button" onClick={() => {
                                    setStep('language');
                                    setDisplayedLines([]);
                                    setCurrentLineIndex(0);
                                    setLines([]);
                                }}>
                                    Start Over
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="programming-roadmap">
            <button className="back-button" onClick={handleBack}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
            </button>
            <h2>Programming Learning Path</h2>
            {step === 'language' && renderLanguageSelection()}
            {step === 'questions' && renderQuestions()}
            {step === 'roadmap' && renderRoadmap()}
        </div>
    );
};

export default ProgrammingRoadmap;
