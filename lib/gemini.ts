import { GoogleGenAI } from "@google/genai";

// Safely access the API key to prevent "process is not defined" errors in browser environments.
// The environment is expected to inject this variable.
const API_KEY = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
    ? process.env.API_KEY 
    : undefined;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.warn("API_KEY not found. Text analysis will use a simple keyword-based fallback.");
}

/**
 * Analyzes text for toxicity using the Gemini API.
 * @param text The text to analyze.
 * @returns A promise that resolves to an object with an `isToxic` boolean property.
 */
export async function analyzeText(text: string): Promise<{ isToxic: boolean }> {
  if (!ai) {
    // Fallback for when API key is not available
    const toxicKeywords = ['idiot', 'stupid', 'hate', 'kill', 'jerk', 'nude'];
    const isToxic = toxicKeywords.some(keyword => text.toLowerCase().includes(keyword));
    return { isToxic };
  }

  try {
    const prompt = `Analyze the following text for toxicity, harassment, insults, or hate speech. Respond with only a single word: "YES" if it is toxic, "NO" if it is not.
    
    Text: "${text}"
    
    Answer:`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0, // Be deterministic for classification
        }
    });
    
    const analysis = response.text.trim().toUpperCase();
    return { isToxic: analysis === 'YES' };

  } catch (error) {
    console.error("Error analyzing text with Gemini API:", error);
    // Fallback in case of API error, default to not toxic.
    return { isToxic: false };
  }
}
