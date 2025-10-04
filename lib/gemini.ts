import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with secure server-side API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
export interface GeminiAnalysisResult {
  grammar_score: number;
  consistency_score: number;
  readability_score: number;
  overall_score: number;
  grammar_issues: Array<{
    type: 'grammar' | 'spelling' | 'punctuation' | 'style';
    severity: 'high' | 'medium' | 'low';
    text: string;
    suggestion: string;
    position?: number;
  }>;
  consistency_issues: Array<{
    type: 'tone' | 'voice' | 'terminology' | 'formatting';
    severity: 'high' | 'medium' | 'low';
    description: string;
    suggestion: string;
  }>;
  readability_issues: Array<{
    type: 'sentence_length' | 'complexity' | 'clarity' | 'structure';
    severity: 'high' | 'medium' | 'low';
    description: string;
    suggestion: string;
  }>;
  uk_english_issues: Array<{
    type: 'uk_english';
    severity: 'high' | 'medium' | 'low';
    text: string;
    suggestion: string;
    description: string;
  }>;
  strengths: string[];
  recommendations: string[];
  summary: string;
  word_count: number;
  sentence_count: number;
  average_sentence_length: number;
  reading_level: string;
  analysis_timestamp: string;
}
export async function analyzeContentWithGemini(content: string, url: string): Promise<GeminiAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro'
    });
    const prompt = `
You are an expert content analyst specializing in grammar, consistency, and readability analysis. Analyze the following web page content and provide a comprehensive assessment.

**Content to Analyze:**
URL: ${url}
Content: ${content.substring(0, 8000)} ${content.length > 8000 ? '... (truncated)' : ''}

**Analysis Requirements:**

1. **Grammar Analysis (0-100 score):**
   - Check for grammatical errors, spelling mistakes, punctuation issues
   - Identify style inconsistencies
   - Look for run-on sentences, fragments, and awkward phrasing

2. **Consistency Analysis (0-100 score):**
   - Evaluate tone consistency throughout the content
   - Check for consistent voice and writing style
   - Identify terminology inconsistencies
   - Look for formatting inconsistencies

3. **Readability Analysis (0-100 score):**
   - Assess sentence length and complexity
   - Evaluate clarity and structure
   - Check for appropriate reading level
   - Identify areas that need simplification

4. **UK English Analysis:**
   - Identify American English spellings that should be British English
   - Look for words like: color/colour, favor/favour, honor/honour, center/centre, theater/theatre, organize/organise, realize/realise
   - Check for other British vs American English differences
   - Provide British English alternatives

**Response Format (JSON only, no markdown):**
{
  "grammar_score": number,
  "consistency_score": number,
  "readability_score": number,
  "overall_score": number,
  "grammar_issues": [
    {
      "type": "grammar|spelling|punctuation|style",
      "severity": "high|medium|low",
      "text": "specific text with issue",
      "suggestion": "corrected version",
      "position": number
    }
  ],
  "consistency_issues": [
    {
      "type": "tone|voice|terminology|formatting",
      "severity": "high|medium|low",
      "description": "description of inconsistency",
      "suggestion": "how to fix it"
    }
  ],
  "readability_issues": [
    {
      "type": "sentence_length|complexity|clarity|structure",
      "severity": "high|medium|low",
      "description": "description of issue",
      "suggestion": "improvement suggestion"
    }
  ],
  "uk_english_issues": [
    {
      "type": "uk_english",
      "severity": "high|medium|low",
      "text": "American English word found",
      "suggestion": "British English alternative",
      "description": "explanation of the difference"
    }
  ],
  "strengths": ["list of content strengths"],
  "recommendations": ["actionable improvement recommendations"],
  "summary": "brief overall assessment",
  "word_count": number,
  "sentence_count": number,
  "average_sentence_length": number,
  "reading_level": "elementary|middle|high school|college|graduate",
  "analysis_timestamp": "ISO timestamp"
}

Provide only the JSON response, no additional text or explanations.
`;
    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const _duration = Date.now() - startTime;
    // Clean the response text before parsing
    let cleanedText = text.trim();

    // Remove markdown code blocks if present
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Remove any leading/trailing whitespace and newlines
    cleanedText = cleanedText.trim();

    // Parse the JSON response

    const analysisResult = JSON.parse(cleanedText) as GeminiAnalysisResult;
    // Add timestamp if not provided
    if (!analysisResult.analysis_timestamp) {
      analysisResult.analysis_timestamp = new Date().toISOString();
    }
    return analysisResult;
  } catch (error) {
    console.error('[GEMINI] Error analyzing content with Gemini:', error);
    console.error('[GEMINI] Error type:', typeof error);
    console.error('[GEMINI] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[GEMINI] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw new Error('Failed to analyze content with AI');
  }
}
export async function getGeminiAnalysisStatus(): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro'
    });
    const startTime = Date.now();
    await model.generateContent('test');
    const _duration = Date.now() - startTime;
    return true;
  } catch (error) {
    console.error('[GEMINI] API not available:', error);
    console.error('[GEMINI] Error type:', typeof error);
    console.error('[GEMINI] Error message:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}