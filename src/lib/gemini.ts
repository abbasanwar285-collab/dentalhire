
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CV, Job } from '@/types';

// Initialize Gemini
// Note: In production, you would want to handle this more robustly
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface AIAnalysisResult {
    score: number;
    reasoning: string;
    strengths: string[];
    weaknesses: string[];
}

/**
 * Generate a job description based on title and skills
 */
export async function generateJobDescription(title: string, skills: string[], location: string): Promise<string> {
    if (!apiKey) {
        console.warn('Gemini API key is missing');
        return 'Please configure the Gemini API key to use this feature.';
    }

    try {
        const prompt = `
        Write a professional and attractive job description for a dental clinic.
        Role: ${title}
        Location: ${location}
        Required Skills: ${skills.join(', ')}
        
        The description should be engaging, highlight the key responsibilities, and include a section on what we are looking for.
        Keep it concise (around 150-200 words).
        Return ONLY the description text, no markdown formatting like **bold** or headers if possible, just plain text paragraphs or bullet points where appropriate.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating job description:', error);
        throw new Error('Failed to generate description');
    }
}

/**
 * Analyze a CV and provide improvement tips
 */
export async function analyzeCV(cv: CV): Promise<{ tips: string[]; summary: string }> {
    if (!apiKey) return { tips: [], summary: 'AI features not configured' };

    try {
        // Serialize CV data for the prompt
        const cvData = JSON.stringify({
            title: cv.experience[0]?.title || 'Dental Professional',
            experience: cv.experience.map(e => `${e.title} at ${e.company} (${e.startDate} - ${e.current ? 'Present' : e.endDate || 'N/A'})`),
            skills: cv.skills,
            summary: cv.personalInfo.bio,
            location: `${cv.location.province}, ${cv.location.district}`,
            availability: cv.availability?.type
        });

        const prompt = `
        You are an expert dental recruiter. specific tips to improve the following CV to make it more attractive to dental clinics.
        CV Data: ${cvData}
        
        Provide 3-5 specific, actionable tips. Also provide a brief 1-sentence summary of the candidate's profile strength.
        Format the response as JSON: { "tips": ["tip 1", "tip 2"], "summary": "summary text" }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Cleanup markdown code blocks if present
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error('Error analyzing CV:', error);
        return { tips: ['Could not analyze CV at this time.'], summary: 'Error' };
    }
}

/**
 * Calculate match score between CV and Job using AI
 */
export async function calculateAIMatchScore(cv: CV, job: Job): Promise<AIAnalysisResult> {
    if (!apiKey) {
        return {
            score: 0,
            reasoning: 'API Key missing',
            strengths: [],
            weaknesses: []
        };
    }

    try {
        const prompt = `
        Evaluate the fit between this candidate and the job opening.
        
        Job:
        Title: ${job.title}
        Description: ${job.description}
        Requirements: ${job.requirements.join(', ')}
        Skills: ${job.skills.join(', ')}
        Location: ${job.location}
        
        Candidate:
        Title: ${cv.experience[0]?.title || 'N/A'}
        Experience: ${cv.experience.map(e => `${e.title} (${e.startDate} - ${e.current ? 'Present' : e.endDate || 'N/A'})`).join(', ')}
        Skills: ${cv.skills.join(', ')}
        Bio: ${cv.personalInfo.bio || 'N/A'}
        Location: ${cv.location.province}, ${cv.location.district}
        Availability: ${cv.availability?.type || 'N/A'}
        
        Rate the match on a scale of 0-100.
        Provide a reasoning, list of strengths, and list of weaknesses/gaps.
        
        Format response as JSON:
        {
            "score": number,
            "reasoning": "string",
            "strengths": ["string"],
            "weaknesses": ["string"]
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error('Error calculating match score:', error);
        return {
            score: 0,
            reasoning: 'Failed to calculate score',
            strengths: [],
            weaknesses: []
        };
    }
}
