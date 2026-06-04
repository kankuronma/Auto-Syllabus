// pdfParser.js - Extract text and dates from PDF syllabuses
import pdfParse from 'pdf-parse';

// Common date patterns in syllabuses
const datePatterns = [
    // Pattern: Month Day, Year (January 15, 2026)
    { regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/gi, type: 'date' },
    // Pattern: MM/DD/YYYY or MM-DD-YYYY
    { regex: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g, type: 'date' },
    // Pattern: YYYY-MM-DD
    { regex: /(\d{4})-(\d{1,2})-(\d{1,2})/g, type: 'date' },
];

// Keywords that indicate important events
const eventKeywords = {
    exam: ['exam', 'midterm', 'final', 'test', 'quiz', 'assessment'],
    assignment: ['assignment', 'homework', 'problem set', 'paper', 'essay', 'project', 'report', 'due'],
    holiday: ['holiday', 'break', 'recess', 'no class', 'vacation', 'reading week'],
    deadline: ['deadline', 'last day', 'withdraw', 'drop deadline', 'registration'],
    event: ['seminar', 'workshop', 'guest lecture', 'presentation']
};

export async function parsePDF(fileBuffer) {
    try {
        // Extract text from PDF
        const data = await pdfParse(fileBuffer);
        const text = data.text;
        
        console.log('PDF Text length:', text.length);
        console.log('Number of pages:', data.numpages);
        
        // Extract potential events from text
        const events = extractEvents(text);
        
        return {
            success: true,
            events: events,
            text: text.substring(0, 1000), // First 1000 chars for preview
            pageCount: data.numpages
        };
    } catch (error) {
        console.error('PDF parsing error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

function extractEvents(text) {
    const events = [];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length < 5) continue; // Skip short lines
        
        // Find dates in the line
        const dates = extractDates(line);
        if (dates.length === 0) continue;
        
        // Determine event type based on keywords
        const eventType = classifyEvent(line);
        if (!eventType) continue;
        
        // Extract event name (clean up the text)
        let eventName = cleanEventText(line);
        
        events.push({
            title: eventName,
            description: `From syllabus: ${eventName}`,
            date: dates[0], // Use first date found
            type: eventType,
            rawText: line.substring(0, 100)
        });
    }
    
    // Remove duplicates and limit to reasonable number
    return deduplicateEvents(events).slice(0, 50);
}

function extractDates(text) {
    const dates = [];
    
    // Try each date pattern
    for (const pattern of datePatterns) {
        const matches = text.matchAll(pattern.regex);
        for (const match of matches) {
            let dateStr = match[0];
            // Try to parse the date
            const parsedDate = parseDateString(dateStr);
            if (parsedDate) {
                dates.push(parsedDate);
            }
        }
    }
    
    return [...new Set(dates)]; // Remove duplicates
}

function parseDateString(dateStr) {
    try {
        // Handle "Month Day, Year" format
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0]; // Return YYYY-MM-DD
        }
        
        // Try custom parsing for common formats
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const date = new Date(parts[2], parts[0] - 1, parts[1]);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
            }
        }
    } catch (e) {
        // Invalid date, ignore
    }
    return null;
}

function classifyEvent(text) {
    const lowerText = text.toLowerCase();
    
    for (const [type, keywords] of Object.entries(eventKeywords)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                return type;
            }
        }
    }
    return null;
}

function cleanEventText(text) {
    // Remove extra whitespace
    let cleaned = text.replace(/\s+/g, ' ').trim();
    
    // Remove common prefixes
    cleaned = cleaned.replace(/^(•|\*|\-|\d+\.)\s*/, '');
    
    // Limit length
    if (cleaned.length > 100) {
        cleaned = cleaned.substring(0, 97) + '...';
    }
    
    return cleaned;
}

function deduplicateEvents(events) {
    const seen = new Set();
    return events.filter(event => {
        const key = `${event.title}_${event.date}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export function exportEventsToCSV(events) {
    const headers = ['Title', 'Date', 'Type', 'Description'];
    const rows = events.map(e => [
        `"${e.title}"`,
        e.date,
        e.type,
        `"${e.description}"`
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    return csv;
}

export function exportEventsToJSON(events) {
    return JSON.stringify(events, null, 2);
}