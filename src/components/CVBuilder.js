import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import './CVBuilder.css';

const CVBuilder = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        summary: '',
        education: '',
        experience: '',
        skills: '',
        projects: '',
        languages: '',
        certifications: '',
        interests: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cvPreview, setCvPreview] = useState('');

    const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const cleanText = (text) => {
        return text
            .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
            .replace(/ðl/g, '-')  // Replace specific problematic characters
            .replace(/\s+/g, ' ')  // Normalize whitespace
            .trim();
    };

    const generateHTML = (content) => {
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${cleanText(formData.fullName)} - CV</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    color: #333;
                    background-color: #fff;
                }
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding: 20px;
                    background: linear-gradient(to right, #f8f9fa, #e9ecef, #f8f9fa);
                    border-radius: 8px;
                }
                .name {
                    font-size: 32px;
                    font-weight: bold;
                    margin-bottom: 15px;
                    text-transform: uppercase;
                    color: #2c3e50;
                }
                .contact {
                    margin-bottom: 20px;
                    font-size: 15px;
                    color: #495057;
                }
                .section {
                    margin-bottom: 35px;
                    background: #fff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .section-title {
                    font-size: 20px;
                    font-weight: bold;
                    text-transform: uppercase;
                    color: #2c3e50;
                    border-bottom: 3px solid #3498db;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                }
                .content {
                    margin-left: 20px;
                }
                .bullet-point {
                    margin-bottom: 8px;
                    position: relative;
                    padding-left: 20px;
                    line-height: 1.8;
                }
                .bullet-point:before {
                    content: "•";
                    position: absolute;
                    left: 0;
                    color: #3498db;
                    font-weight: bold;
                }
                .skills-grid {
                    text-align: center;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 12px;
                    padding: 10px;
                }
                .skill-item {
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    color: #2c3e50;
                    border: 1px solid #dee2e6;
                    transition: all 0.3s ease;
                }
                .skill-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .experience-item, .project-item, .certification-item {
                    margin-bottom: 25px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border-left: 4px solid #3498db;
                }
                .experience-item:last-child, 
                .project-item:last-child, 
                .certification-item:last-child {
                    margin-bottom: 0;
                }
                .title-line {
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 10px;
                    font-size: 16px;
                }
                .date-line {
                    color: #6c757d;
                    font-size: 14px;
                    margin-bottom: 10px;
                }
                .description-line {
                    color: #495057;
                    margin-left: 15px;
                }
                @media print {
                    body {
                        padding: 20px;
                        background: none;
                    }
                    .section {
                        page-break-inside: avoid;
                        box-shadow: none;
                        border: 1px solid #dee2e6;
                    }
                    .experience-item, .project-item, .certification-item {
                        background: none;
                        border-left: 2px solid #3498db;
                    }
                    .skill-item {
                        background: none;
                        border: 1px solid #dee2e6;
                    }
                    .header {
                        background: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="name">${cleanText(formData.fullName)}</div>
                <div class="contact">
                    ${cleanText(formData.email)} | ${cleanText(formData.phone)}
                </div>
            </div>

            ${formData.summary ? `
            <div class="section">
                <div class="section-title">Professional Summary</div>
                <div class="content">
                    ${cleanText(formData.summary)}
                </div>
            </div>` : ''}

            <div class="section">
                <div class="section-title">Education</div>
                <div class="content">
                    ${cleanText(formData.education).split('\n').map(line => 
                        line.trim() ? `<div class="bullet-point">${line.startsWith('-') ? line.substring(1).trim() : line}</div>` : ''
                    ).join('')}
                </div>
            </div>

            <div class="section">
                <div class="section-title">Professional Experience</div>
                <div class="content">
                    ${cleanText(formData.experience).split('\n\n').map(exp => {
                        const lines = exp.split('\n');
                        const title = lines[0]?.trim();
                        const date = lines[1]?.trim();
                        const details = lines.slice(2).filter(l => l.trim());
                        
                        return `
                        <div class="experience-item">
                            ${title ? `<div class="title-line">${title.startsWith('-') ? title.substring(1).trim() : title}</div>` : ''}
                            ${date ? `<div class="date-line">${date.startsWith('-') ? date.substring(1).trim() : date}</div>` : ''}
                            <div class="description-line">
                                ${details.map(line => 
                                    line.trim() ? `<div class="bullet-point">${line.startsWith('-') ? line.substring(1).trim() : line}</div>` : ''
                                ).join('')}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <div class="section">
                <div class="section-title">Skills</div>
                <div class="skills-grid">
                    ${cleanText(formData.skills).split(',').map(skill => 
                        `<span class="skill-item">${skill.trim()}</span>`
                    ).join('')}
                </div>
            </div>

            ${formData.projects ? `
            <div class="section">
                <div class="section-title">Projects</div>
                <div class="content">
                    ${cleanText(formData.projects).split('\n\n').map(project => {
                        const lines = project.split('\n');
                        const title = lines[0]?.trim();
                        const date = lines[1]?.trim();
                        const details = lines.slice(2).filter(l => l.trim());
                        
                        return `
                        <div class="project-item">
                            ${title ? `<div class="title-line">${title.startsWith('-') ? title.substring(1).trim() : title}</div>` : ''}
                            ${date ? `<div class="date-line">${date.startsWith('-') ? date.substring(1).trim() : date}</div>` : ''}
                            <div class="description-line">
                                ${details.map(line => 
                                    line.trim() ? `<div class="bullet-point">${line.startsWith('-') ? line.substring(1).trim() : line}</div>` : ''
                                ).join('')}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>` : ''}

            ${formData.languages ? `
            <div class="section">
                <div class="section-title">Languages</div>
                <div class="content">
                    ${cleanText(formData.languages).split('\n').map(line => 
                        line.trim() ? `<div class="bullet-point">${line.startsWith('-') ? line.substring(1).trim() : line}</div>` : ''
                    ).join('')}
                </div>
            </div>` : ''}

            ${formData.certifications ? `
            <div class="section">
                <div class="section-title">Certifications</div>
                <div class="content">
                    ${cleanText(formData.certifications).split('\n\n').map(cert => {
                        const lines = cert.split('\n');
                        const title = lines[0]?.trim();
                        const date = lines[1]?.trim();
                        const details = lines.slice(2).filter(l => l.trim());
                        
                        return `
                        <div class="certification-item">
                            ${title ? `<div class="title-line">${title.startsWith('-') ? title.substring(1).trim() : title}</div>` : ''}
                            ${date ? `<div class="date-line">${date.startsWith('-') ? date.substring(1).trim() : date}</div>` : ''}
                            <div class="description-line">
                                ${details.map(line => 
                                    line.trim() ? `<div class="bullet-point">${line.startsWith('-') ? line.substring(1).trim() : line}</div>` : ''
                                ).join('')}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>` : ''}
        </body>
        </html>
        `;

        // Create a Blob with the HTML content
        const blob = new Blob([html], { type: 'text/html' });
        
        // Create a download link and trigger it
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Professional_CV.html';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `Create a professional CV with the following information. Format each section with bullet points starting with "-". Keep the content concise and professional:

Full Name: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone}

Professional Summary:
${formData.summary}

Education:
${formData.education}

Professional Experience:
${formData.experience}

Skills:
${formData.skills}

${formData.projects ? `Projects:
${formData.projects}

` : ''}${formData.languages ? `Languages:
${formData.languages}

` : ''}${formData.certifications ? `Certifications:
${formData.certifications}` : ''}

Format Guidelines:
- Use bullet points starting with "-" for all list items
- Keep descriptions concise and professional
- Focus on achievements and responsibilities
- Use action verbs and quantifiable results where possible`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const content = response.text();
            
            generateHTML(content);
        } catch (error) {
            console.error('Error:', error);
            setError('An error occurred while generating the CV. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        window.location.href = '/ai-chat';
    };

    return (
        <div className="cv-builder">
            <button className="back-button" onClick={handleBack}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
            </button>
            <h2>CV Builder</h2>
            <div className="cv-form">
                <div className="form-section">
                    <h3>Personal Information</h3>
                    <input
                        type="text"
                        name="fullName"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={handleInputChange}
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleInputChange}
                    />
                    <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-section">
                    <h3>Professional Summary</h3>
                    <textarea
                        name="summary"
                        placeholder="Brief overview of your professional background and career objectives"
                        value={formData.summary}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-section">
                    <h3>Education</h3>
                    <textarea
                        name="education"
                        placeholder="Format: Degree - Institution - Year
Example:
- Bachelor of Science in Computer Science
  University of Example, 2018-2022
  GPA: 3.8/4.0"
                        value={formData.education}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-section">
                    <h3>Work Experience</h3>
                    <textarea
                        name="experience"
                        placeholder="Format: Position - Company - Duration
Example:
- Software Engineer at Tech Corp (2022-Present)
  - Led development of key features
  - Improved system performance by 40%"
                        value={formData.experience}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-section">
                    <h3>Skills</h3>
                    <textarea
                        name="skills"
                        placeholder="List your skills separated by commas
Example: JavaScript, React, Node.js, Python, Project Management"
                        value={formData.skills}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-section">
                    <h3>Projects</h3>
                    <textarea
                        name="projects"
                        placeholder="Format: Project Name - Description
Example:
- E-commerce Platform
  - Developed using React and Node.js
  - Increased sales by 25%"
                        value={formData.projects}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-section">
                    <h3>Languages</h3>
                    <textarea
                        name="languages"
                        placeholder="Format: Language: Proficiency Level
Example:
English: Native
Spanish: Fluent
French: Intermediate"
                        value={formData.languages}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-section">
                    <h3>Certifications</h3>
                    <textarea
                        name="certifications"
                        placeholder="Format: Certification - Issuing Organization - Year
Example:
- AWS Certified Developer - Amazon - 2023
- Scrum Master Certification - Scrum Alliance - 2022"
                        value={formData.certifications}
                        onChange={handleInputChange}
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="generate-button"
                >
                    {loading ? 'Generating CV...' : 'Generate CV'}
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {loading && (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Creating your professional CV...</p>
                </div>
            )}

            {cvPreview && (
                <div className="cv-preview">
                    <h3>CV Preview</h3>
                    <div className="cv-content" dangerouslySetInnerHTML={{ __html: cvPreview }} />
                </div>
            )}
        </div>
    );
};

export default CVBuilder;
