import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { jsPDF } from 'jspdf';
import { getDocument } from 'pdfjs-dist';
import './QuizGenerator.css';

const QuizGenerator = () => {
    const [file, setFile] = useState(null);
    const [quiz, setQuiz] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [answers, setAnswers] = useState({});
    const [discussions, setDiscussions] = useState({});
    const [discussionInputs, setDiscussionInputs] = useState({});
    const [discussionLoading, setDiscussionLoading] = useState({});
    const [answerLoading, setAnswerLoading] = useState({});
    const [parsedQuestions, setParsedQuestions] = useState([]);
    const [showDiscussionInput, setShowDiscussionInput] = useState({});
    const [lectureContent, setLectureContent] = useState("");
    const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

    const extractPDFContent = async (file) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await getDocument({ data: arrayBuffer }).promise;
            let textContent = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const pageText = content.items.map(item => item.str).join(' ');
                textContent += pageText + '\n';
            }

            return textContent;
        } catch (error) {
            console.error('Error extracting PDF content:', error);
            throw new Error('Failed to extract PDF content');
        }
    };

    const formatQuiz = (text) => {
        return text
            .split('\n')
            .map(line => {
                // Handle section titles
                if (line.trim().startsWith('#')) {
                    const title = line.trim().replace(/^#+\s*/, '');
                    return `<h3 class="section-title">${title}</h3>`;
                }
                // Handle questions and options
                else if (line.trim().startsWith('Q')) {
                    return `<div class="question">${line.trim()}</div>`;
                }
                // Handle options
                else if (line.trim().match(/^[A-D]\)/)) {
                    return `<div class="option">${line.trim()}</div>`;
                }
                // Handle True/False questions
                else if (line.trim().startsWith('T/F')) {
                    return `<div class="true-false">${line.trim()}</div>`;
                }
                // Handle written questions
                else if (line.trim().startsWith('Written')) {
                    return `<div class="written-question">${line.trim()}</div>`;
                }
                // Regular text
                else {
                    return `<p>${line.trim()}</p>`;
                }
            })
            .join('\n');
    };

    const generatePDF = async (quizContent) => {
        const doc = new jsPDF();
        const splitText = doc.splitTextToSize(quizContent.replace(/<[^>]+>/g, ''), 180);

        let y = 20;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('Practice Quiz', 105, y, { align: 'center' });

        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);

        splitText.forEach(line => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }

            if (line.startsWith('Q')) {
                y += 5;
                doc.setFont('helvetica', 'bold');
            } else if (line.match(/^[A-D]\)/)) {
                doc.setFont('helvetica', 'normal');
            } else if (line.startsWith('T/F') || line.startsWith('Written')) {
                y += 5;
                doc.setFont('helvetica', 'bold');
            }

            doc.text(line, 15, y);
            y += 7;
        });

        doc.save('practice_quiz.pdf');
    };

    // Helper to extract questions from quiz text
    const extractQuestions = (quizText) => {
        const lines = quizText.split('\n');
        const questions = [];
        let current = null;
        lines.forEach(line => {
            if (line.trim().startsWith('Q') || line.trim().startsWith('T/F') || line.trim().startsWith('Written')) {
                if (current) questions.push(current);
                current = { question: line.trim(), options: [] };
            } else if (line.trim().match(/^[A-D]\)/)) {
                if (current) current.options.push(line.trim());
            } else if (line.trim() === '' && current) {
                questions.push(current);
                current = null;
            }
        });
        if (current) questions.push(current);
        return questions;
    };

    // Helper to clean markdown formatting from AI output
    const cleanMarkdown = (text) => {
        return text
            .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
            .replace(/\*([^*]+)\*/g, '$1') // italic
            .replace(/`([^`]+)`/g, '$1') // inline code
            .replace(/\n{2,}/g, '\n') // remove extra newlines
            .replace(/^- /gm, '') // remove bullet dashes
            .replace(/\n- /g, '\n') // remove bullet dashes
            .replace(/\n\s*\*/g, '\n') // remove bullet stars
            .replace(/\*/g, '') // remove any remaining stars
            .replace(/Discussion:/g, '') // remove 'Discussion:' label
            .trim();
    };

    // Helper to format answer/discussion as a numbered list if possible
    const formatAnswer = (text) => {
        const cleaned = cleanMarkdown(text);
        // Detect numbered points (e.g., 1. ... 2. ...)
        const numbered = cleaned.match(/\d+\.\s/);
        if (numbered) {
            // Split by numbers (1. 2. 3. ...)
            const parts = cleaned.split(/(?=\d+\.\s)/g).map(s => s.trim()).filter(Boolean);
            if (parts.length > 1) {
                return (
                    <ol style={{ paddingLeft: 20, margin: 0 }}>
                        {parts.map((p, i) => <li key={i} style={{ marginBottom: 8, lineHeight: 1.7 }}>{p.replace(/^\d+\.\s/, '')}</li>)}
                    </ol>
                );
            }
        }
        // Otherwise, split by newlines
        return cleaned.split(/\n+/).map((line, i) => <div key={i} style={{ marginBottom: 6 }}>{line}</div>);
    };

    const generateQuiz = async () => {
        if (!file) {
            setError('Please upload a PDF file first');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const fileContent = await extractPDFContent(file);
            setLectureContent(fileContent);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const prompt = `Generate a comprehensive practice quiz based on the following lecture content. Include:

            # Multiple Choice Questions
            * Generate 5 multiple-choice questions
            * Each question should have 4 options (A, B, C, D)
            * Format: Q1) Question text
                     A) Option
                     B) Option
                     C) Option
                     D) Option

            # True/False Questions
            * Generate 3 true/false questions
            * Format: T/F 1) Statement

            # Written Questions
            * Generate 2 short answer questions
            * Format: Written 1) Question

            Important:
            - Make questions progressively more challenging
            - Include questions testing both recall and understanding
            - Cover different topics from the lecture
            - Each question should be on a new line
            - Keep questions clear and concise

            Here's the lecture content:
            ${fileContent}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const quizText = await response.text();
            const formattedQuiz = formatQuiz(quizText);

            setQuiz(formattedQuiz);
            setParsedQuestions(extractQuestions(quizText));
            generatePDF(quizText);
        } catch (err) {
            console.error('Quiz generation error:', err);

            if (err.message && err.message.includes('503')) {
                setError('The AI model is currently busy. Please wait a moment and try again.');
            } else if (err.message && err.message.includes('429')) {
                setError('API rate limit reached. Please wait a few minutes and try again.');
            } else if (err.message && err.message.includes('quota')) {
                setError('API quota exceeded. Please try again later or contact support for assistance.');
            } else if (err.message && err.message.includes('permission')) {
                setError('API key error. Please check your API key configuration.');
            } else {
                setError('Failed to generate the quiz. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // AI answer fetcher
    const handleShowAnswer = async (idx, questionObj) => {
        setAnswerLoading(prev => ({ ...prev, [idx]: true }));
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `Based only on the following lecture content, answer the quiz question below.\nLecture Content:\n${lectureContent}\n\nQuiz Question: ${questionObj.question}${questionObj.options ? '\n' + questionObj.options.join('\n') : ''}\nGive a clear and concise answer based only on the lecture content.`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const answerText = await response.text();
            setAnswers(prev => ({ ...prev, [idx]: answerText }));
        } catch (e) {
            setAnswers(prev => ({ ...prev, [idx]: 'Failed to get answer.' }));
        } finally {
            setAnswerLoading(prev => ({ ...prev, [idx]: false }));
        }
    };

    // AI discussion fetcher
    const handleDiscuss = async (idx, questionObj) => {
        const userInput = discussionInputs[idx] || '';
        if (!userInput) return;
        setDiscussionLoading(prev => ({ ...prev, [idx]: true }));
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `You are an AI tutor. The student asked about this question from a lecture.\nLecture Content:\n${lectureContent}\n\nQuiz Question: ${questionObj.question}${questionObj.options ? '\n' + questionObj.options.join('\n') : ''}\nStudent's question: ${userInput}\nPlease answer based only on the lecture content above.`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const discussionText = await response.text();
            setDiscussions(prev => ({ ...prev, [idx]: discussionText }));
        } catch (e) {
            setDiscussions(prev => ({ ...prev, [idx]: 'Failed to get discussion.' }));
        } finally {
            setDiscussionLoading(prev => ({ ...prev, [idx]: false }));
        }
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setError('');
        } else {
            setFile(null);
            setError('Please select a valid PDF file');
        }
    };

    const handleBack = () => {
        window.location.href = '/ai-chat';
    };

    return (
        <div className="quiz-generator">
            <button className="back-button" onClick={handleBack}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
            </button>
            <h2>Practice Quiz Generator</h2>
            <div className="upload-container">
                <div className="file-upload">
                    <label className="upload-label">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                        />
                        📄 Upload your lecture PDF
                    </label>
                </div>
                {file && <p className="file-name">{file.name}</p>}
                <button
                    onClick={generateQuiz}
                    disabled={!file || loading}
                    className="generate-button"
                >
                    {loading ? 'Generating Quiz...' : 'Generate Quiz'}
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {loading && (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Creating your practice quiz...</p>
                </div>
            )}

            {quiz && (
                <div className="quiz-content">
                    {/* Render questions with answer/discussion buttons */}
                    {parsedQuestions.length > 0 ? (
                        parsedQuestions.map((q, idx) => (
                            <div key={idx} className="quiz-question-block" style={{
                                background: '#fff',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                margin: '24px 0',
                                padding: '24px',
                                maxWidth: '600px',
                                marginLeft: 'auto',
                                marginRight: 'auto',
                                direction: 'ltr'
                            }}>
                                <div className="question-text" style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: 12, color: '#2d3a4a', textAlign: 'left' }}>
                                    {q.question}
                                </div>
                                {q.options && q.options.length > 0 && (
                                    <div className="options-list" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                                        {q.options.map((opt, i) => (
                                            <label key={i} style={{
                                                display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: 6, padding: '8px 12px', border: '1px solid #e0e0e0', justifyContent: 'flex-start', fontWeight: 500, width: '100%', margin: 0
                                            }}>
                                                {/* <input type="radio" name={`question-${idx}`} style={{ marginRight: 10, marginLeft: 0 }} disabled /> */}
                                                <span style={{ fontSize: '1.05rem', cursor: 'pointer', color: '#333', marginLeft: 8, textAlign: 'left', width: '100%', display: 'block' }}>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                <div className="question-actions" style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', marginBottom: 10 }}>
                                    <button onClick={() => handleShowAnswer(idx, q)} disabled={answerLoading[idx]} style={{ padding: '6px 18px', borderRadius: 6, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                                        {answerLoading[idx] ? 'Loading Answer...' : 'Show Answer'}
                                    </button>
                                    <button onClick={() => setShowDiscussionInput(prev => ({ ...prev, [idx]: true }))} style={{ padding: '6px 18px', borderRadius: 6, background: '#43a047', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Discuss</button>
                                </div>
                                {answers[idx] && (
                                    <div className="answer-block" style={{ background: '#f1f8e9', borderRadius: 8, padding: 12, margin: '10px 0', color: '#1b5e20', fontWeight: 'bold', fontSize: '1rem' }}>
                                        <span style={{ color: '#388e3c' }}>Model Answer:</span>
                                        <div style={{ fontWeight: 'normal', color: '#222', marginTop: 6 }}>{formatAnswer(answers[idx])}</div>
                                    </div>
                                )}
                                {showDiscussionInput[idx] && (
                                    <div className="discussion-block" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                                        <input
                                            type="text"
                                            placeholder="Ask about this question..."
                                            value={typeof discussionInputs[idx] === 'string' ? discussionInputs[idx] : ''}
                                            onChange={e => setDiscussionInputs(prev => ({ ...prev, [idx]: e.target.value }))}
                                            style={{ padding: '6px 10px', color:"black", borderRadius: 6, border: '1px solid #bbb', minWidth: 180 }}
                                        />
                                        <button onClick={() => handleDiscuss(idx, q)} disabled={discussionLoading[idx]} style={{ padding: '6px 14px', borderRadius: 6, background: '#ffa000', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                                            {discussionLoading[idx] ? 'Discussing...' : 'Send'}
                                        </button>
                                    </div>
                                )}
                                {discussions[idx] && (
                                    <div className="discussion-answer" style={{ background: '#e3f2fd', borderRadius: 8, padding: 10, margin: '10px 0', color: '#0d47a1', fontWeight: 'bold', fontSize: '1rem' }}>
                                        <span style={{ color: '#1976d2' }}>Discussion:</span>
                                        <div style={{ fontWeight: 'normal', color: '#222', marginTop: 6 }}>{formatAnswer(discussions[idx])}</div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div dangerouslySetInnerHTML={{ __html: quiz }} />
                    )}
                </div>
            )}
        </div>
    );
};

export default QuizGenerator;
