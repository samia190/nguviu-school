// utils/pdfExtraction.js
// PDF Text Extraction and Result Parsing Utility

import fs from 'fs';
import path from 'path';

/**
 * Simple PDF text extraction using regex patterns
 * Note: For production, consider using pdf-parse or similar library
 * This is a basic implementation that works with text-based PDFs
 */

// Common patterns for extracting data from report cards
const PATTERNS = {
  // Student information patterns
  studentName: [
    /(?:student\s*name|name\s*of\s*student|name)\s*[:\-]?\s*([A-Za-z\s]+?)(?:\n|admission|class|grade|$)/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s*$/m
  ],
  admissionNumber: [
    /(?:admission\s*(?:no|number|#)|adm\s*(?:no)?)\s*[:\-]?\s*([A-Z0-9\/\-]+)/i,
    /(?:reg(?:istration)?\s*(?:no|number|#))\s*[:\-]?\s*([A-Z0-9\/\-]+)/i
  ],
  class: [
    /(?:class|grade|form)\s*[:\-]?\s*([0-9A-Za-z\s]+?)(?:\n|stream|term|$)/i,
    /(?:form|fom|fm)\s*(\d+)/i
  ],
  term: [
    /(?:term)\s*[:\-]?\s*(\d|one|two|three|1|2|3)/i,
    /(?:first|second|third)\s*term/i
  ],
  year: [
    /(?:year|academic\s*year)\s*[:\-]?\s*(\d{4})/i,
    /20\d{2}/
  ],
  
  // Results patterns
  averageMarks: [
    /(?:average|mean|avg)\s*(?:marks?|score)?\s*[:\-]?\s*(\d+\.?\d*)\s*%?/i,
    /(?:overall|total)\s*(?:average|mean)\s*[:\-]?\s*(\d+\.?\d*)/i
  ],
  totalMarks: [
    /(?:total\s*marks?|grand\s*total)\s*[:\-]?\s*(\d+)/i
  ],
  position: [
    /(?:position|rank|pos)\s*[:\-]?\s*(\d+)\s*(?:out\s*of|\/|\s+of\s+)?\s*(\d+)?/i
  ],
  overallGrade: [
    /(?:overall\s*grade|mean\s*grade|final\s*grade|grade)\s*[:\-]?\s*([A-E][+-]?)/i
  ],
  
  // Subject results - more flexible patterns
  subjectLine: [
    /^(\d+\.?\s*)?([A-Za-z\/\s&]+?)\s+(\d{1,3})\s*%?\s*([A-E][+-]?)?/gm,
    /([A-Za-z\/\s&]+?)\s+(\d{1,3})\s*([A-E][+-]?)/gm
  ]
};

// Common subject names to help identify subject lines
const COMMON_SUBJECTS = [
  'mathematics', 'math', 'maths',
  'english', 'eng',
  'kiswahili', 'kisw', 'swahili',
  'science', 'sci',
  'biology', 'bio',
  'chemistry', 'chem',
  'physics', 'phy', 'phys',
  'history', 'hist',
  'geography', 'geo', 'geog',
  'cre', 'christian religious education', 'religion',
  'ire', 'islamic religious education',
  'agriculture', 'agri', 'agric',
  'business', 'business studies',
  'computer', 'computer studies', 'ict',
  'french', 'german', 'arabic',
  'home science', 'home economics',
  'art', 'art and design', 'art & design',
  'music',
  'physical education', 'p.e', 'pe',
  'social studies',
  'integrated science',
  'creative arts',
  'hygiene', 'health education'
];

/**
 * Extract text from PDF buffer
 * Basic implementation - for better results, install pdf-parse: npm install pdf-parse
 */
export async function extractTextFromPDF(pdfPathOrBuffer) {
  try {
    // Try to use pdf-parse if available
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const dataBuffer = Buffer.isBuffer(pdfPathOrBuffer)
        ? pdfPathOrBuffer
        : fs.readFileSync(pdfPathOrBuffer);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (e) {
      // pdf-parse not installed, return placeholder
      console.log('pdf-parse not installed. Install with: npm install pdf-parse');
      return null;
    }
  } catch (error) {
    console.error('PDF extraction error:', error);
    return null;
  }
}

/**
 * Apply pattern to extract data
 */
function applyPatterns(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Extract subject results from text
 */
function extractSubjects(text) {
  const subjects = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;
    
    // Check if line starts with a number or contains a subject name
    for (const subjectName of COMMON_SUBJECTS) {
      if (cleanLine.toLowerCase().includes(subjectName)) {
        // Try to extract marks from this line
        const marksMatch = cleanLine.match(/(\d{1,3})\s*%?(?:\s+([A-E][+-]?))?/);
        if (marksMatch) {
          const marks = parseInt(marksMatch[1]);
          if (marks >= 0 && marks <= 100) {
            // Found a valid subject line
            let extractedName = cleanLine
              .replace(/^\d+\.?\s*/, '') // Remove leading number
              .replace(/\s*\d{1,3}\s*%?.*$/, '') // Remove marks and everything after
              .trim();
            
            // Capitalize properly
            extractedName = extractedName
              .split(/\s+/)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
            
            subjects.push({
              subjectName: extractedName,
              marks: marks,
              grade: marksMatch[2] || calculateGrade(marks),
              remarks: ''
            });
            break; // Found subject, move to next line
          }
        }
      }
    }
  }
  
  // Remove duplicates
  const uniqueSubjects = [];
  const seenNames = new Set();
  for (const subject of subjects) {
    if (!seenNames.has(subject.subjectName.toLowerCase())) {
      seenNames.add(subject.subjectName.toLowerCase());
      uniqueSubjects.push(subject);
    }
  }
  
  return uniqueSubjects;
}

/**
 * Calculate grade from marks
 */
function calculateGrade(marks) {
  if (marks >= 80) return 'A';
  if (marks >= 75) return 'A-';
  if (marks >= 70) return 'B+';
  if (marks >= 65) return 'B';
  if (marks >= 60) return 'B-';
  if (marks >= 55) return 'C+';
  if (marks >= 50) return 'C';
  if (marks >= 45) return 'C-';
  if (marks >= 40) return 'D+';
  if (marks >= 35) return 'D';
  if (marks >= 30) return 'D-';
  return 'E';
}

/**
 * Parse term string to standard format
 */
function parseTerm(termStr) {
  if (!termStr) return null;
  const lower = termStr.toLowerCase();
  if (lower.includes('1') || lower.includes('one') || lower.includes('first')) return 'Term 1';
  if (lower.includes('2') || lower.includes('two') || lower.includes('second')) return 'Term 2';
  if (lower.includes('3') || lower.includes('three') || lower.includes('third')) return 'Term 3';
  return null;
}

/**
 * Extract all result data from PDF text
 */
export function parseResultFromText(text) {
  if (!text || text.trim().length === 0) {
    return { success: false, error: 'No text content found in PDF' };
  }
  
  const result = {
    success: true,
    data: {},
    warnings: [],
    confidence: 'low'
  };
  
  // Extract student info
  result.data.studentName = applyPatterns(text, PATTERNS.studentName);
  result.data.admissionNumber = applyPatterns(text, PATTERNS.admissionNumber);
  result.data.class = applyPatterns(text, PATTERNS.class);
  
  // Extract academic period
  const termRaw = applyPatterns(text, PATTERNS.term);
  result.data.term = parseTerm(termRaw);
  
  const yearMatch = text.match(/20\d{2}/);
  result.data.year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
  
  // Extract results
  const avgStr = applyPatterns(text, PATTERNS.averageMarks);
  result.data.averageMarks = avgStr ? parseFloat(avgStr) : null;
  
  const totalStr = applyPatterns(text, PATTERNS.totalMarks);
  result.data.totalMarks = totalStr ? parseInt(totalStr) : null;
  
  result.data.overallGrade = applyPatterns(text, PATTERNS.overallGrade);
  
  // Extract position
  const positionMatch = text.match(PATTERNS.position[0]);
  if (positionMatch) {
    result.data.position = parseInt(positionMatch[1]);
    result.data.outOf = positionMatch[2] ? parseInt(positionMatch[2]) : null;
  }
  
  // Extract subjects
  result.data.subjects = extractSubjects(text);
  
  // Calculate totals if not found
  if (result.data.subjects.length > 0) {
    if (!result.data.totalMarks) {
      result.data.totalMarks = result.data.subjects.reduce((sum, s) => sum + s.marks, 0);
    }
    if (!result.data.averageMarks) {
      result.data.averageMarks = result.data.totalMarks / result.data.subjects.length;
    }
    if (!result.data.overallGrade) {
      result.data.overallGrade = calculateGrade(result.data.averageMarks);
    }
  }
  
  // Assess confidence
  let fieldsFound = 0;
  const importantFields = ['studentName', 'admissionNumber', 'term', 'averageMarks'];
  importantFields.forEach(field => {
    if (result.data[field]) fieldsFound++;
  });
  
  if (fieldsFound >= 3 && result.data.subjects.length >= 3) {
    result.confidence = 'high';
  } else if (fieldsFound >= 2 || result.data.subjects.length >= 2) {
    result.confidence = 'medium';
  }
  
  // Add warnings for missing fields
  if (!result.data.studentName) result.warnings.push('Could not extract student name');
  if (!result.data.admissionNumber) result.warnings.push('Could not extract admission number');
  if (!result.data.term) result.warnings.push('Could not extract term');
  if (result.data.subjects.length === 0) result.warnings.push('Could not extract any subjects');
  
  return result;
}

/**
 * Main function to extract and parse a PDF result
 */
export async function extractResultFromPDF(pdfPath) {
  const text = await extractTextFromPDF(pdfPath);
  
  if (!text) {
    return {
      success: false,
      error: 'Could not extract text from PDF. Please install pdf-parse: npm install pdf-parse',
      needsManualEntry: true
    };
  }
  
  const parsed = parseResultFromText(text);
  
  if (parsed.confidence === 'low' && parsed.data.subjects.length === 0) {
    parsed.needsManualEntry = true;
    parsed.warnings.push('Low confidence extraction. Manual verification recommended.');
  }
  
  return parsed;
}

export default {
  extractTextFromPDF,
  parseResultFromText,
  extractResultFromPDF
};
