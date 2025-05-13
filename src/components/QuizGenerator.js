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

    const generateQuiz = async () => {
        if (!file) {
            setError('Please upload a PDF file first');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const fileContent = await extractPDFContent(file);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
            const formattedQuiz = formatQuiz(await response.text());

            setQuiz(formattedQuiz);
            generatePDF(await response.text());
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
                    <div dangerouslySetInnerHTML={{ __html: quiz }} />
                </div>
            )}
        </div>
    );
};

export default QuizGenerator;
