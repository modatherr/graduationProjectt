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
    const [answerType, setAnswerType] = useState('text'); // 'text', 'yesno', 'multiple'
    const [answerOptions, setAnswerOptions] = useState([]); // for multiple choice

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

    // حذف جميع الأسئلة الثابتة والمنطق القديم

    // منطق توليد السؤال الأول
    const handleLanguageSelect = (language) => {
        setSelectedLanguage(language);
        setUserAnswers([]);
        setStep('questions');
        setCurrentQuestion({
            text: `What is your goal for learning ${programmingLanguages.find(l => l.id === language)?.name}?`,
            type: 'text',
            options: []
        });
        setAnswerType('text');
        setAnswerOptions([]);
    };

    // منطق التحقق من ذكر لغة أخرى في الإجابة
    const checkForOtherLanguage = (answer, currentLangId) => {
        const allLangs = programmingLanguages.map(l => l.name.toLowerCase());
        const currentLang = programmingLanguages.find(l => l.id === currentLangId)?.name.toLowerCase();
        for (let lang of allLangs) {
            if (lang !== currentLang && answer.toLowerCase().includes(lang)) {
                return lang;
            }
        }
        return null;
    };

    // منطق توليد سؤال جديد ديناميكيًا من الذكاء الاصطناعي
    const MAX_QUESTIONS = 7;
    const generateNextQuestion = async (answers) => {
        setLoading(true);
        setError('');
        try {
            const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const langName = programmingLanguages.find(l => l.id === selectedLanguage)?.name;
            const prompt = `You are an expert programming learning assistant. Based on the following user answers about learning ${langName}, generate the next most relevant question to help build a personalized learning roadmap.\n\nUser Answers:\n${answers.map((a, i) => `Q${i+1}: ${a.question}\nA${i+1}: ${a.answer}`).join('\n')}\n\nInstructions:\n- The question must be in English.\n- Also, specify the answer type: 'yesno' (for Yes/No), 'text' (for free text), or 'multiple' (for multiple choice).\n- If 'multiple', provide the options as a list.\n- If the user mentions a different programming language than ${langName}, reply: 'It seems you are interested in [LANG], but you are currently in the ${langName} section. Please switch to the [LANG] section for accurate results.' and do not generate a new question.\n- Respond in JSON format: {"question": "...", "type": "yesno|text|multiple", "options": [..] } or {"message": "..."} if language mismatch.\n- Do not ask more than ${MAX_QUESTIONS} questions in total.\n- If you have enough information, reply with {"done": true} instead of a question.`;
            if (answers.length >= MAX_QUESTIONS) {
                setStep('roadmap');
                await generateRoadmap(answers.map(a => a.answer));
                return;
            }
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let json;
            try {
                json = JSON.parse(response.text().replace(/```json|```/g, '').trim());
            } catch (e) {
                // fallback: try to extract JSON
                const match = response.text().match(/\{[\s\S]*\}/);
                if (match) {
                    json = JSON.parse(match[0]);
                } else {
                    throw new Error('Invalid AI response');
                }
            }
            if (json.message) {
                setError(json.message);
                setLoading(false);
                return;
            }
            if (json.done) {
                setStep('roadmap');
                await generateRoadmap(answers.map(a => a.answer));
                return;
            }
            setCurrentQuestion({ text: json.question, type: json.type, options: json.options || [] });
            setAnswerType(json.type);
            setAnswerOptions(json.options || []);
        } catch (error) {
            setError('Failed to generate the next question. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // حالة إذا وافق المستخدم على الاستمرار في المسار الحالي بعد تحذير اللغة
    const [continueAfterLangWarning, setContinueAfterLangWarning] = useState(false);
    const [pendingAnswer, setPendingAnswer] = useState(null);

    // منطق الإجابة على السؤال الحالي
    const handleAnswer = async (answer) => {
        // إذا كان هناك تحذير لغة والمستخدم وافق على الاستمرار
        if (continueAfterLangWarning) {
            setContinueAfterLangWarning(false);
            setPendingAnswer(null);
            const newAnswers = [...userAnswers, { question: currentQuestion.text, answer }];
            setUserAnswers(newAnswers);
            await generateNextQuestion(newAnswers);
            return;
        }
        // تحقق من ذكر لغة أخرى (حتى في أول سؤال)
        const otherLang = checkForOtherLanguage(answer, selectedLanguage);
        if (otherLang) {
            setError(`It seems you are interested in ${otherLang.charAt(0).toUpperCase() + otherLang.slice(1)}, but you are currently in the ${programmingLanguages.find(l => l.id === selectedLanguage)?.name} section. Please switch to the ${otherLang.charAt(0).toUpperCase() + otherLang.slice(1)} section for accurate results.`);
            setPendingAnswer(answer);
            setContinueAfterLangWarning(false);
            return;
        }
        const newAnswers = [...userAnswers, { question: currentQuestion.text, answer }];
        setUserAnswers(newAnswers);
        await generateNextQuestion(newAnswers);
    };

    // توليد الرودماب مع تقييم المستوى بناءً على الإجابات
    const generateRoadmap = async (userAnswers) => {
        setLoading(true);
        setError('');
        try {
            const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `Create a detailed programming roadmap for ${selectedLanguage}. Do not use any special characters or markdown formatting. Format the response as plain text with clear headings and bullet points, based on the following user responses:\n\nQuestions and Answers:\n${userAnswers.map((a, i) => `Q: ${a.question}\nA: ${a}`).join('\n\n')}\n\nStructure the response with these exact headings and subheadings (without any special characters):\n\nSKILL LEVEL ASSESSMENT\n[Assess current skill level (beginner, intermediate, advanced) based on the user's answers and explain why. Do not say 'Cannot assess skill level without user answers'.]\n\nLEARNING PATH\nFundamentals\n[List fundamental concepts to learn]\nIntermediate Concepts\n[List intermediate concepts]\nAdvanced Topics\n[List advanced topics]\n\nPROJECT SUGGESTIONS\nBeginner Projects\n[List beginner project ideas]\nIntermediate Projects\n[List intermediate project ideas]\nAdvanced Projects\n[List advanced project ideas]\n\nLEARNING RESOURCES\nDocumentation\n[List official documentation]\nRecommended Courses\n[List recommended courses]\nTutorials and Books\n[List tutorials and books]\n\nTIMELINE\nPhase 1: Fundamentals\n[Estimated time and milestones]\nPhase 2: Intermediate\n[Estimated time and milestones]\nPhase 3: Advanced\n[Estimated time and milestones]\n\nBEST PRACTICES\n[List best practices]\n\nCOMMON PITFALLS\n[List common pitfalls to avoid]\n\nImportant: Do not use any asterisks (*), hashes (#), or other special characters. Use plain text only.`;
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

    // واجهة الأسئلة الذكية
    const renderQuestions = () => (
        <div className="questions-container">
            <div className="question-progress">Question {userAnswers.length + 1} of {MAX_QUESTIONS} (AI may finish earlier)</div>
            <h3 className="question-text">{currentQuestion?.text}</h3>
            <div className="answer-buttons">
                {error && pendingAnswer && !continueAfterLangWarning ? (
                    <>
                        <div className="error">{error}</div>
                        <button onClick={() => {
                            setContinueAfterLangWarning(true);
                            setError('');
                        }}>Continue in this section anyway</button>
                        <button onClick={() => {
                            setError('');
                            setPendingAnswer(null);
                        }}>Cancel</button>
                    </>
                ) : (
                    <>
                        {answerType === 'yesno' && (
                            <>
                                <button onClick={() => handleAnswer('Yes')}>Yes</button>
                                <button onClick={() => handleAnswer('No')}>No</button>
                            </>
                        )}
                        {answerType === 'multiple' && answerOptions.length > 0 && answerOptions.map((opt, idx) => (
                            <button key={idx} onClick={() => handleAnswer(opt)}>{opt}</button>
                        ))}
                        {answerType === 'text' && (
                            <form onSubmit={e => { e.preventDefault(); const val = e.target.elements[0].value; if(val) handleAnswer(val); }}>
                                <input type="text" placeholder="Type your answer..." autoFocus />
                                <button type="submit">Submit</button>
                            </form>
                        )}
                    </>
                )}
            </div>
            <div className="progress-bar">
                <div
                    className="progress"
                    style={{ width: `${((userAnswers.length + 1) / MAX_QUESTIONS) * 100}%` }}
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
