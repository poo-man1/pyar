
import { GoogleGenAI } from "@google/genai";

// The environment is expected to inject process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes text for toxicity using the Gemini API.
 * @param text The text to analyze.
 * @returns A promise that resolves to an object with an `isToxic` boolean property.
 */
export async function analyzeText(text: string): Promise<{ isToxic: boolean }> {
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
    // Fallback in case of API error, default to not toxic to not block users.
    return { isToxic: false };
  }
}
