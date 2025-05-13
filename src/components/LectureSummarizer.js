import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import jsPDF from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import './LectureSummarizer.css';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const LectureSummarizer = () => {
    const [file, setFile] = useState(null);
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const summaryRef = useRef(null);

    const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setError('');
        } else {
            setFile(null);
            setError('Please upload a PDF file only');
        }
    };

    const extractPDFContent = async (file) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = '';

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                // Process each text item on the page
                const pageText = textContent.items.map(item => {
                    // Add spacing based on item positions if needed
                    return {
                        text: item.str,
                        x: item.transform[4],
                        y: item.transform[5],
                        fontSize: Math.sqrt(item.transform[0] * item.transform[0] + item.transform[1] * item.transform[1])
                    };
                });

                // Sort items by vertical position (top to bottom)
                pageText.sort((a, b) => b.y - a.y);

                // Group items by approximate y-position (lines)
                let currentY = pageText[0]?.y;
                let currentLine = [];
                let lines = [];

                pageText.forEach(item => {
                    if (Math.abs(item.y - currentY) < 5) {
                        // Same line
                        currentLine.push(item);
                    } else {
                        // New line
                        if (currentLine.length > 0) {
                            // Sort items in line by x-position (left to right)
                            currentLine.sort((a, b) => a.x - b.x);
                            lines.push(currentLine);
                        }
                        currentLine = [item];
                        currentY = item.y;
                    }
                });

                // Add the last line
                if (currentLine.length > 0) {
                    currentLine.sort((a, b) => a.x - b.x);
                    lines.push(currentLine);
                }

                // Convert lines to text with proper spacing
                const pageContent = lines.map(line => {
                    return line.map(item => item.text).join(' ');
                }).join('\n');

                fullText += pageContent + '\n\n';
            }

            return fullText;
        } catch (error) {
            console.error('Error extracting PDF content:', error);
            throw new Error('Failed to extract PDF content. Please try a different file.');
        }
    };

    const formatText = (text) => {
        // Replace markdown with HTML tags while preserving bullet points
        return text
            .split('\n')
            .map(line => {
                // Handle section titles (lines starting with #)
                if (line.trim().startsWith('#')) {
                    const title = line.trim().replace(/^#+\s*/, '');
                    return `<h3 class="lecture-summarizer-section-title">${title}</h3>`;
                }
                // Handle bullet points and format their content
                else if (line.trim().startsWith('*') || line.trim().startsWith('•')) {
                    const content = line.trim()
                        .replace(/^[*•]\s*/, '') // Remove bullet point symbol
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Handle bold
                        .replace(/\*(.*?)\*/g, '<em>$1</em>'); // Handle italic
                    return `<div class="lecture-summarizer-bullet-point">• ${content}</div>`;
                }
                // Handle regular text
                else {
                    return line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>');
                }
            })
            .join('\n');
    };

    const formatSummaryForDisplay = (text) => {
        // First format the markdown
        const formattedText = formatText(text);
        
        // Then split into sections and create HTML structure
        const sections = formattedText.split('\n\n').map(section => {
            if (section.includes('class="lecture-summarizer-section-title"')) {
                // It's already a formatted section title
                return section;
            } else if (section.includes('class="lecture-summarizer-bullet-point"')) {
                // It's a bullet point list
                return `<div class="lecture-summarizer-bullet-list">${section}</div>`;
            } else {
                // Regular paragraph
                return `<p>${section.trim()}</p>`;
            }
        });

        return sections.join('\n');
    };

    const summarizeLecture = async () => {
        if (!file) {
            setError('Please upload a PDF file first');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const fileContent = await extractPDFContent(file);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `Please analyze and summarize the following lecture content. Format your response using the following structure:

            # Main Topics
            * Key topic 1
            * Key topic 2
            * Major themes and concepts

            # Key Points
            * Important point 1
            * Important point 2
            * Critical concepts
            * Key definitions

            # Summary
            * Overview point 1
            * Overview point 2
            * Practical applications

            Important: 
            - Use * at the start of each new point
            - Use **text** for bold text
            - Use *text* for italic text
            - Each * should be on a new line

            Here's the content to analyze:
            ${fileContent}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const formattedSummary = formatSummaryForDisplay(await response.text());
            
            setSummary(formattedSummary);
        } catch (err) {
            console.error('Summarization error:', err);
            
            if (err.message && err.message.includes('429')) {
                setError('API rate limit reached. Please wait a few minutes and try again.');
            } else if (err.message && err.message.includes('quota')) {
                setError('API quota exceeded. Please try again later or contact support for assistance.');
            } else if (err.message && err.message.includes('permission')) {
                setError('API key error. Please check your API key configuration.');
            } else {
                setError('Failed to summarize the lecture. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = () => {
        if (!summary) return;

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // PDF styling constants
        const pageWidth = pdf.internal.pageSize.width;
        const margin = 20;
        const contentWidth = pageWidth - 2 * margin;
        let yPosition = margin;

        // Add header with title
        pdf.setFillColor(44, 62, 80);
        pdf.rect(0, 0, pageWidth, 40, 'F');
        
        // Add main title
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(24);
        pdf.text("Lecture Summary", margin, 28);

        // Add metadata
        pdf.setTextColor(64, 64, 64);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        const fileName = file ? file.name : "Document";
        pdf.text(`File: ${fileName}`, margin, 45);

        const date = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        pdf.text(`Generated on: ${date}`, margin, 52);

        yPosition = 65;

        // Parse the HTML content from summary
        const parser = new DOMParser();
        const doc = parser.parseFromString(summary, 'text/html');

        // Process sections
        const sections = doc.querySelectorAll('.lecture-summarizer-section-title, .lecture-summarizer-bullet-point, p');
        
        sections.forEach(section => {
            // Check if we need a new page
            if (yPosition > pdf.internal.pageSize.height - margin) {
                pdf.addPage();
                yPosition = margin;
            }

            if (section.classList.contains('lecture-summarizer-section-title')) {
                // Section title
                pdf.setTextColor(44, 62, 80);
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(14);
                pdf.text(section.textContent.replace('#', '').trim(), margin, yPosition);
                yPosition += 8;

                // Add underline
                pdf.setDrawColor(44, 62, 80);
                pdf.setLineWidth(0.5);
                pdf.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 8;
            } else if (section.classList.contains('lecture-summarizer-bullet-point')) {
                // Bullet point
                pdf.setTextColor(51, 51, 51);
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(11);
                
                const bulletText = section.textContent;
                const lines = pdf.splitTextToSize(bulletText, contentWidth - 10);
                
                lines.forEach((line, index) => {
                    if (yPosition > pdf.internal.pageSize.height - margin) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    if (index === 0) {
                        pdf.text('•', margin, yPosition);
                        pdf.text(line, margin + 5, yPosition);
                    } else {
                        pdf.text(line, margin + 5, yPosition);
                    }
                    yPosition += 7;
                });
                yPosition += 3;
            } else {
                // Regular paragraph
                pdf.setTextColor(51, 51, 51);
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(11);
                
                const lines = pdf.splitTextToSize(section.textContent, contentWidth);
                lines.forEach(line => {
                    if (yPosition > pdf.internal.pageSize.height - margin) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    pdf.text(line, margin, yPosition);
                    yPosition += 7;
                });
                yPosition += 3;
            }
        });

        // Add page numbers
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setTextColor(128, 128, 128);
            pdf.setFontSize(10);
            pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pdf.internal.pageSize.height - 10);
        }

        pdf.save('lecture-summary.pdf');
    };

    const handleBack = () => {
        window.location.href = '/ai-chat';
    };

    // Add a delay between API calls
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Debounced version of summarizeLecture
    const debouncedSummarizeLecture = debounce(summarizeLecture, 1000);

    return (
        <div className="lecture-summarizer-container">
            <button className="back-button" onClick={handleBack}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
            </button>
            <div className="lecture-summarizer-card">
                <div className="lecture-summarizer-header">
                    <h2>Lecture Summarizer</h2>
                    <p className="lecture-summarizer-instruction">Transform your lecture PDFs into concise, structured summaries</p>
                </div>

                <div className="lecture-summarizer-file-upload-area">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        id="fileInput"
                        className="lecture-summarizer-file-input"
                    />
                    <label htmlFor="fileInput" className="lecture-summarizer-file-label">
                        <div className="lecture-summarizer-upload-icon">📄</div>
                        <div className="lecture-summarizer-upload-text">
                            {file ? file.name : 'Choose PDF file'}
                            <span className="lecture-summarizer-upload-subtext">
                                {file ? 'Click to change file' : 'or drag and drop here'}
                            </span>
                        </div>
                    </label>
                </div>

                {error && <div className="lecture-summarizer-error-message">{error}</div>}

                <button
                    onClick={debouncedSummarizeLecture}
                    className={`lecture-summarizer-button ${loading ? 'loading' : ''}`}
                    disabled={!file || loading}
                >
                    {loading ? (
                        <>
                            <div className="lecture-summarizer-button-spinner"></div>
                            Analyzing Content...
                        </>
                    ) : (
                        'Generate Summary'
                    )}
                </button>

                {loading && (
                    <div className="lecture-summarizer-loading-container">
                        <div className="lecture-summarizer-loading-animation">
                            <div className="lecture-summarizer-loading-bar"></div>
                            <div className="lecture-summarizer-loading-bar"></div>
                            <div className="lecture-summarizer-loading-bar"></div>
                        </div>
                        <p>Analyzing your lecture content...</p>
                        <p className="lecture-summarizer-loading-subtext">This may take a moment</p>
                    </div>
                )}

                {summary && (
                    <div className="lecture-summarizer-summary-section">
                        <div className="lecture-summarizer-summary-header">
                            <h3>Generated Summary</h3>
                            <button onClick={generatePDF} className="lecture-summarizer-download-pdf-button">
                                Download PDF
                            </button>
                        </div>
                        <div 
                            ref={summaryRef}
                            className="lecture-summarizer-summary-content"
                            dangerouslySetInnerHTML={{ __html: summary }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default LectureSummarizer;
