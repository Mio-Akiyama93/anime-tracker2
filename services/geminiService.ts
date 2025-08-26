import { GoogleGenAI, Type } from '@google/genai';
import { WatchlistItem, WatchStatus } from '../types';

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

    // Group watchlist items by status, taking a limited number from each to keep the prompt concise.
    const getTitles = (items: WatchlistItem[], status: WatchStatus, limit: number) => {
        return items
            .filter(item => item.status === status)
            .slice(0, limit)
            .map(item => item.anime.title.english || item.anime.title.romaji)
            .filter(Boolean); // remove null/undefined titles
    };

    const completed = getTitles(watchlist, WatchStatus.Completed, 10);
    const watching = getTitles(watchlist, WatchStatus.Watching, 10);
    const planToWatch = getTitles(watchlist, WatchStatus.PlanToWatch, 5);
    const dropped = getTitles(watchlist, WatchStatus.Dropped, 5);
    const paused = getTitles(watchlist, WatchStatus.Paused, 5);

    let watchlistPrompt = "";
    if (completed.length > 0) watchlistPrompt += `\n\n**Completed:** ${completed.join(', ')}`;
    if (watching.length > 0) watchlistPrompt += `\n\n**Currently Watching:** ${watching.join(', ')}`;
    if (paused.length > 0) watchlistPrompt += `\n\n**Paused:** ${paused.join(', ')}`;
    if (planToWatch.length > 0) watchlistPrompt += `\n\n**Plan to Watch:** ${planToWatch.join(', ')}`;
    if (dropped.length > 0) watchlistPrompt += `\n\n**Dropped (disliked):** ${dropped.join(', ')}`;

    // If all lists are empty, there's nothing to recommend from.
    if (!watchlistPrompt.trim()) {
        throw new Error("Not enough data in watchlist to generate recommendations.");
    }

    const prompt = `You are an anime recommendation expert. A user has provided their watchlist, categorized by their viewing status. Use this information to recommend 5 new anime they would likely enjoy.

- **Analyze their preferences:** Pay close attention to the anime they have 'Completed' and are 'Watching' to understand what they enjoy. These are strong positive signals.
- **Analyze their dislikes:** The anime in the 'Dropped (disliked)' list are shows they did not like. Avoid recommending anime with similar genres, themes, or styles to those they've dropped. This is a strong negative signal.
- **Consider their interests:** The 'Plan to Watch' and 'Paused' lists show their interests, but are weaker signals. You can use this as a secondary signal.
- **Provide diverse recommendations:** Suggest a mix of anime that align with their tastes but also introduce them to potentially new, related genres.
- **Give compelling reasons:** For each recommendation, provide a short, compelling reason (2-3 sentences) explaining *why* they would enjoy it based on their specific watchlist categories.
- **Do not recommend any anime already on their lists.**

Here is the user's watchlist:${watchlistPrompt}

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