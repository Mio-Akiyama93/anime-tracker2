import { GoogleGenAI, Type } from '@google/genai';
import { WatchlistItem } from '../types';

const recommendationSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description: 'The official English or Romaji title of the recommended anime.',
            },
            reason: {
                type: Type.STRING,
                description: 'A short, compelling reason (2-3 sentences) explaining why the user would enjoy this anime based on their watchlist.',
            },
        },
        required: ['title', 'reason'],
    },
};

export async function getAIRecommendations(watchlist: WatchlistItem[]): Promise<{ title: string, reason: string }[]> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        // Prevents the app from crashing on load and provides a clear error in the UI when the feature is used.
        throw new Error("AI features are disabled. The VITE_GEMINI_API_KEY is missing from your app's configuration.");
    }
    const ai = new GoogleGenAI({ apiKey });

    if (watchlist.length === 0) {
        throw new Error("Watchlist is empty. Cannot generate recommendations.");
    }

    // Use a subset of the watchlist to keep the prompt focused and efficient
    const watchlistTitles = watchlist
        .slice(0, 20) // Limit to 20 most recent/relevant items
        .map(item => item.anime.title.english || item.anime.title.romaji)
        .join(', ');

    const prompt = `You are an anime recommendation expert. Based on the following list of anime that a user has on their watchlist, please recommend 5 new anime for them to watch. For each recommendation, provide a short, compelling reason (2-3 sentences) why they would enjoy it based on their existing list. Do not recommend any of the anime from the list I provide.

User's watchlist includes: ${watchlistTitles}.

Return your response as a JSON array.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: recommendationSchema,
            },
        });

        const jsonText = response.text.trim();
        const recommendations = JSON.parse(jsonText);
        
        return recommendations;

    } catch (error) {
        console.error("Error fetching AI recommendations:", error);
        throw new Error("Failed to get recommendations from AI. Please try again later.");
    }
}