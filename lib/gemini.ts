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
      model: 'gemini-2.5-flash-lite'
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
export interface GeminiImageAnalysisResult {
  ui_ux_score: number;
  content_score: number;
  overall_score: number;
  ui_ux_analysis: {
    layout_score: number;
    color_scheme_score: number;
    typography_score: number;
    spacing_score: number;
    visual_hierarchy_score: number;
    accessibility_score: number;
    mobile_responsiveness_score: number;
    navigation_score: number;
    call_to_action_score: number;
    issues: Array<{
      type: 'layout' | 'color' | 'typography' | 'spacing' | 'hierarchy' | 'accessibility' | 'mobile' | 'navigation' | 'cta';
      severity: 'high' | 'medium' | 'low';
      description: string;
      suggestion: string;
      location?: string;
      impact?: string;
    }>;
    strengths: string[];
    detailed_metrics: {
      color_contrast_ratio: string;
      font_sizes_used: string[];
      spacing_consistency: string;
      element_alignment: string;
      visual_balance: string;
    };
  };
  content_analysis: {
    readability_score: number;
    clarity_score: number;
    structure_score: number;
    seo_score: number;
    content_length_score: number;
    heading_structure_score: number;
    issues: Array<{
      type: 'readability' | 'clarity' | 'structure' | 'formatting' | 'seo' | 'length' | 'headings';
      severity: 'high' | 'medium' | 'low';
      description: string;
      suggestion: string;
      location?: string;
    }>;
    strengths: string[];
    detailed_metrics: {
      word_count_estimate: number;
      heading_count: number;
      paragraph_count: number;
      list_usage: string;
      content_density: string;
    };
  };
  design_patterns: {
    identified_patterns: string[];
    modern_design_elements: string[];
    outdated_elements: string[];
    best_practices_followed: string[];
    best_practices_missing: string[];
  };
  brand_consistency: {
    score: number;
    color_consistency: string;
    typography_consistency: string;
    style_consistency: string;
    issues: Array<{
      description: string;
      suggestion: string;
    }>;
  };
  recommendations: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }>;
  summary: string;
  detailed_summary: {
    overall_assessment: string;
    key_strengths: string[];
    key_weaknesses: string[];
    quick_wins: string[];
    long_term_improvements: string[];
  };
  analysis_timestamp: string;
  token_usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

export async function analyzeImageWithGemini(imageUrl: string, pageUrl: string, viewType: 'desktop' | 'mobile' = 'desktop'): Promise<GeminiImageAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp'
    });

    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    // Convert ArrayBuffer to base64 (Node.js compatible)
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const imageMimeType = imageResponse.headers.get('content-type') || 'image/png';

    const viewContext = viewType === 'mobile' 
      ? `This is a MOBILE view screenshot. You are analyzing a mobile-responsive web page. CRITICAL: Focus on mobile-specific aspects:
- Touch targets: Are buttons and interactive elements at least 44x44px (iOS) or 48x48dp (Android)? Are they easily tappable?
- Mobile navigation: Hamburger menus, bottom navigation, swipe gestures, mobile-friendly menu patterns
- Content stacking: How content is organized vertically, scrolling behavior, fold content placement
- Typography: Are font sizes readable on small screens? Is text large enough for mobile reading?
- Spacing: Is there adequate spacing between touch targets? Can users easily tap without accidental clicks?
- Mobile-first design patterns: Card layouts, collapsible sections, mobile-optimized forms
- Thumb-friendly zones: Are important actions within easy thumb reach?
- Loading states: Are there mobile-friendly loading indicators?
- Form design: Are forms optimized for mobile input? Are inputs large enough?
- Content prioritization: Is the most important content visible above the fold on mobile?
- Mobile performance: Visual indicators of performance (image loading, layout shifts)`
      : `This is a DESKTOP view screenshot. You are analyzing a desktop web page. CRITICAL: Focus on desktop-specific aspects:
- Horizontal layout: Multi-column layouts, sidebars, desktop navigation patterns
- Desktop navigation: Horizontal menus, dropdowns, mega menus, desktop menu patterns
- Mouse interactions: Hover states, clickable areas, cursor indicators
- Content width: Optimal reading width, content max-width, white space utilization
- Desktop-specific features: Keyboard shortcuts hints, right-click menus, desktop tooltips
- Multi-column content: Sidebars, content areas, desktop information architecture
- Desktop typography: Font sizes appropriate for larger screens, line lengths, reading comfort
- Desktop spacing: Generous whitespace, grid layouts, desktop-specific spacing patterns
- Desktop CTAs: Prominent call-to-action buttons, desktop conversion optimization
- Desktop performance: Visual indicators of performance on desktop`;

    const prompt = `
You are an expert UI/UX designer and content analyst specializing in ${viewType === 'mobile' ? 'mobile-first design and mobile user experience' : 'desktop web design and desktop user experience'}. Analyze the provided screenshot of a web page and provide an EXTREMELY COMPREHENSIVE and DETAILED assessment.

**Page URL:** ${pageUrl}
**View Type:** ${viewType.toUpperCase()} view

**CRITICAL: Provide maximum detail and analysis. This is not a brief overview - provide deep insights.**

**Context:** ${viewContext}

**IMPORTANT:** When analyzing the ${viewType} view, pay special attention to:
- ${viewType === 'mobile' ? 'Touch-friendly elements (44px+ touch targets), mobile navigation patterns (hamburger menus, bottom nav), vertical scrolling patterns, content stacking, thumb-friendly zones, mobile-specific usability issues, and how content is optimized for smaller screens (375px-428px typical mobile widths)' : 'Desktop layout patterns (multi-column, sidebars), horizontal navigation (top menus, mega menus), desktop interactions (hover states, mouse interactions), multi-column structures, and how content is optimized for larger screens (1920px+ typical desktop widths)'}
- How the design adapts to this specific viewport size
- View-specific accessibility concerns (WCAG compliance for ${viewType} view)
- View-specific performance and user experience considerations
- ${viewType === 'mobile' ? 'Mobile-specific best practices: thumb zones, touch targets, mobile navigation patterns, mobile form design' : 'Desktop-specific best practices: mouse interactions, hover states, keyboard navigation, desktop information architecture'}

**Analysis Requirements:**

1. **UI/UX Analysis (0-100 score for each category with detailed metrics):**
   - Layout: Evaluate visual layout, grid structure, alignment, organization, symmetry, balance
   - Color Scheme: Assess color choices, contrast ratios, accessibility (WCAG compliance), visual appeal, color psychology
   - Typography: Analyze font choices, sizes, hierarchy, readability, font pairing, line height, letter spacing
   - Spacing: Evaluate whitespace, padding, margins, visual breathing room, consistency
   - Visual Hierarchy: Assess how well elements guide user attention, focal points, information architecture
   - Accessibility: Check for accessibility issues (contrast, text sizing, interactive elements, ARIA indicators)
   - Mobile Responsiveness: ${viewType === 'mobile' ? 'Evaluate how well the mobile design is optimized, touch targets, mobile navigation patterns, and mobile-specific usability' : 'Evaluate how the design would adapt to mobile, breakpoints, responsive patterns, and mobile-friendliness indicators'}
   - Navigation: Assess navigation structure, menu design, user flow, breadcrumbs
   - Call-to-Action: Evaluate CTA visibility, placement, design, urgency, conversion optimization

2. **Content Analysis (0-100 score for each category with detailed metrics):**
   - Readability: How easy is the content to read, Flesch reading ease estimate, sentence complexity
   - Clarity: How clear and well-organized is the content, information architecture
   - Structure: Evaluate content organization, headings (H1-H6), sections, logical flow
   - SEO Elements: Check for visible SEO elements (headings, meta indicators, structured content)
   - Content Length: Assess if content is too short/long, appropriate for page type
   - Heading Structure: Evaluate proper heading hierarchy and usage

3. **Design Patterns Analysis:**
   - Identify modern design patterns used (cards, hero sections, etc.)
   - Note modern design elements (glassmorphism, gradients, animations, etc.)
   - Identify outdated design elements
   - Check best practices followed
   - List missing best practices

4. **Brand Consistency:**
   - Evaluate color consistency across page
   - Typography consistency
   - Overall style consistency
   - Brand identity alignment

**Response Format (JSON only, no markdown - BE EXTREMELY DETAILED):**
{
  "ui_ux_score": number,
  "content_score": number,
  "overall_score": number,
  "ui_ux_analysis": {
    "layout_score": number,
    "color_scheme_score": number,
    "typography_score": number,
    "spacing_score": number,
    "visual_hierarchy_score": number,
    "accessibility_score": number,
    "mobile_responsiveness_score": number,
    "navigation_score": number,
    "call_to_action_score": number,
    "issues": [
      {
        "type": "layout|color|typography|spacing|hierarchy|accessibility|mobile|navigation|cta",
        "severity": "high|medium|low",
        "description": "VERY detailed description with specific examples",
        "suggestion": "specific, actionable improvement recommendation",
        "location": "where on the page",
        "impact": "explanation of impact on user experience"
      }
    ],
    "strengths": ["detailed list of UI/UX strengths with specific examples"],
    "detailed_metrics": {
      "color_contrast_ratio": "estimated contrast ratios",
      "font_sizes_used": ["list of font sizes observed"],
      "spacing_consistency": "assessment of spacing consistency",
      "element_alignment": "alignment quality assessment",
      "visual_balance": "balance and symmetry assessment"
    }
  },
  "content_analysis": {
    "readability_score": number,
    "clarity_score": number,
    "structure_score": number,
    "seo_score": number,
    "content_length_score": number,
    "heading_structure_score": number,
    "issues": [
      {
        "type": "readability|clarity|structure|formatting|seo|length|headings",
        "severity": "high|medium|low",
        "description": "detailed description",
        "suggestion": "specific improvement",
        "location": "where on page"
      }
    ],
    "strengths": ["detailed list of content strengths"],
    "detailed_metrics": {
      "word_count_estimate": number,
      "heading_count": number,
      "paragraph_count": number,
      "list_usage": "assessment of list usage",
      "content_density": "content density assessment"
    }
  },
  "design_patterns": {
    "identified_patterns": ["list of design patterns used"],
    "modern_design_elements": ["modern elements present"],
    "outdated_elements": ["outdated elements found"],
    "best_practices_followed": ["best practices observed"],
    "best_practices_missing": ["missing best practices"]
  },
  "brand_consistency": {
    "score": number,
    "color_consistency": "detailed assessment",
    "typography_consistency": "detailed assessment",
    "style_consistency": "detailed assessment",
    "issues": [
      {
        "description": "consistency issue",
        "suggestion": "how to fix"
      }
    ]
  },
  "recommendations": [
    {
      "category": "ui_ux|content|design|brand",
      "priority": "high|medium|low",
      "title": "recommendation title",
      "description": "detailed description",
      "impact": "impact on user experience",
      "effort": "low|medium|high"
    }
  ],
  "summary": "brief overall assessment",
  "detailed_summary": {
    "overall_assessment": "comprehensive assessment paragraph",
    "key_strengths": ["detailed strengths"],
    "key_weaknesses": ["detailed weaknesses"],
    "quick_wins": ["quick improvements"],
    "long_term_improvements": ["long-term improvements"]
  },
  "analysis_timestamp": "ISO timestamp"
}

Provide only the JSON response, no additional text or explanations. Be EXTREMELY detailed and comprehensive.
`;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: imageMimeType
      }
    };

    const startTime = Date.now();
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    const duration = Date.now() - startTime;

    // Calculate token usage
    let inputTokens: number;
    let outputTokens: number;

    try {
      const usageMetadata = response.usageMetadata;
      if (usageMetadata) {
        inputTokens = usageMetadata.promptTokenCount || estimateTokenCount(prompt);
        outputTokens = usageMetadata.candidatesTokenCount || estimateTokenCount(text);
      } else {
        inputTokens = estimateTokenCount(prompt);
        outputTokens = estimateTokenCount(text);
      }
    } catch (e) {
      inputTokens = estimateTokenCount(prompt);
      outputTokens = estimateTokenCount(text);
    }

    const pricing = calculateGeminiCost(inputTokens, outputTokens);
    console.log('[GEMINI] Image analysis token usage:', {
      totalTokens: inputTokens + outputTokens,
      inputTokens,
      outputTokens,
      totalCost: `$${pricing.totalCost.toFixed(6)}`,
      duration: `${duration}ms`
    });

    // Clean the response text before parsing
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    cleanedText = cleanedText.trim();

    const analysisResult = JSON.parse(cleanedText) as GeminiImageAnalysisResult;
    if (!analysisResult.analysis_timestamp) {
      analysisResult.analysis_timestamp = new Date().toISOString();
    }

    analysisResult.token_usage = {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens
    };

    return analysisResult;
  } catch (error) {
    console.error('[GEMINI] Error analyzing image with Gemini:', error);
    throw new Error('Failed to analyze image with AI');
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