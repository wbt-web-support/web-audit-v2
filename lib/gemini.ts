import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with secure server-side API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Gemini 2.5 Pro pricing (assuming similar to 1.5 Pro rates)
const GEMINI_2_5_PRO_INPUT_PRICE_PER_MILLION_TOKENS = 7.00; // $7 per 1M input tokens
const GEMINI_2_5_PRO_OUTPUT_PRICE_PER_MILLION_TOKENS = 21.00; // $21 per 1M output tokens
const TOKENS_PER_CHARACTER = 0.25; // Approximately 1 token per 4 characters

// Helper function to estimate token count (rough estimation)
function estimateTokenCount(text: string): number {
  // Gemini uses a tokenizer, but for estimation: ~4 characters per token
  return Math.ceil(text.length * TOKENS_PER_CHARACTER);
}

// Function to calculate cost from token counts
function calculateGeminiCost(inputTokens: number, outputTokens: number) {
  const inputCost = (inputTokens / 1_000_000) * GEMINI_2_5_PRO_INPUT_PRICE_PER_MILLION_TOKENS;
  const outputCost = (outputTokens / 1_000_000) * GEMINI_2_5_PRO_OUTPUT_PRICE_PER_MILLION_TOKENS;
  
  return {
    inputTokens,
    outputTokens,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}
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
  token_usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
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
  "analysis_timestamp": "ISO timestamp",
  
}

Provide only the JSON response, no additional text or explanations.
`;
    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const _duration = Date.now() - startTime;
    
    // Calculate and log token usage for debugging
    let inputTokens: number;
    let outputTokens: number;
    
    try {
      // @ts-ignore - usageMetadata might be available in the response
      const usageMetadata = response.usageMetadata;
      if (usageMetadata) {
        inputTokens = usageMetadata.promptTokenCount || estimateTokenCount(prompt);
        outputTokens = usageMetadata.candidatesTokenCount || estimateTokenCount(text);
      } else {
        inputTokens = estimateTokenCount(prompt);
        outputTokens = estimateTokenCount(text);
      }
    } catch (e) {
      // Fallback to estimation if metadata not available
      inputTokens = estimateTokenCount(prompt);
      outputTokens = estimateTokenCount(text);
    }
    
    const pricing = calculateGeminiCost(inputTokens, outputTokens);
    const totalTokens = inputTokens + outputTokens;
    
    // Debug: Log total token usage
    console.log('[GEMINI] Analysis token usage:', {
      totalTokens: totalTokens,
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      totalCost: `$${pricing.totalCost.toFixed(6)}`,
      breakdown: {
        input: `$${pricing.inputCost.toFixed(6)}`,
        output: `$${pricing.outputCost.toFixed(6)}`,
      },
      duration: `${_duration}ms`,
      contentLength: content.length,
      promptLength: prompt.length,
      responseLength: text.length
    });
    
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
    
    // Log token usage from Gemini's response if available
    if (analysisResult.token_usage) {
      console.log('[GEMINI] Token usage from Gemini response:', {
        inputTokens: analysisResult.token_usage.input_tokens,
        outputTokens: analysisResult.token_usage.output_tokens,
        totalTokens: analysisResult.token_usage.total_tokens
      });
    }
    
    console.log('[GEMINI] Analysis result: **********************************************************************************', analysisResult);
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
    const testPrompt = 'test';
    const startTime = Date.now();
    
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    const responseText = response.text();
    
    const _duration = Date.now() - startTime;
    
    // Try to get usage metadata if available
    let inputTokens: number;
    let outputTokens: number;
    
    try {
      // @ts-ignore - usageMetadata might be available in the response
      const usageMetadata = response.usageMetadata;
      if (usageMetadata) {
        inputTokens = usageMetadata.promptTokenCount || estimateTokenCount(testPrompt);
        outputTokens = usageMetadata.candidatesTokenCount || estimateTokenCount(responseText);
      } else {
        inputTokens = estimateTokenCount(testPrompt);
        outputTokens = estimateTokenCount(responseText);
      }
    } catch (e) {
      // Fallback to estimation if metadata not available
      inputTokens = estimateTokenCount(testPrompt);
      outputTokens = estimateTokenCount(responseText);
    }
    
    // Calculate pricing
    const pricing = calculateGeminiCost(inputTokens, outputTokens);
    
    // Console log the pricing
    console.log('[GEMINI] Status check pricing: **********************************************************************************', {
      inputTokens,
      outputTokens,
      totalCost: `$${pricing.totalCost.toFixed(6)}`,
      breakdown: {
        input: `$${pricing.inputCost.toFixed(6)}`,
        output: `$${pricing.outputCost.toFixed(6)}`,
      },
      duration: `${_duration}ms`
    });
    
    return true;
  } catch (error) {
    console.error('[GEMINI] API not available:', error);
    console.error('[GEMINI] Error type:', typeof error);
    console.error('[GEMINI] Error message:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}