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

const getApiKey = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("AI features are disabled. The VITE_GEMINI_API_KEY is missing from your app's configuration.");
    }
    return apiKey;
};

const generateWatchlistPrompt = (watchlist: WatchlistItem[]): string => {
    const getTitles = (items: WatchlistItem[], status: WatchStatus, limit: number) => {
        return items
            .filter(item => item.status === status)
            .slice(0, limit)
            .map(item => item.anime.title.english || item.anime.title.romaji)
            .filter(Boolean);
    };

    const completed = getTitles(watchlist, WatchStatus.Completed, 10);
    const watching = getTitles(watchlist, WatchStatus.Watching, 10);
    const planToWatch = getTitles(watchlist, WatchStatus.PlanToWatch, 5);
    const dropped = getTitles(watchlist, WatchStatus.Dropped, 5);
    const paused = getTitles(watchlist, WatchStatus.Paused, 5);

    let promptPart = "";
    if (completed.length > 0) promptPart += `\n\n**Completed:** ${completed.join(', ')}`;
    if (watching.length > 0) promptPart += `\n\n**Currently Watching:** ${watching.join(', ')}`;
    if (paused.length > 0) promptPart += `\n\n**Paused:** ${paused.join(', ')}`;
    if (planToWatch.length > 0) promptPart += `\n\n**Plan to Watch:** ${planToWatch.join(', ')}`;
    if (dropped.length > 0) promptPart += `\n\n**Dropped (disliked):** ${dropped.join(', ')}`;

    return promptPart.trim() || "This user's list is empty or contains no relevant titles.";
};


export async function getAIRecommendations(watchlist: WatchlistItem[]): Promise<{ title: string, reason: string }[]> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    if (watchlist.length === 0) {
        throw new Error("Watchlist is empty. Cannot generate recommendations.");
    }

    const watchlistPrompt = generateWatchlistPrompt(watchlist);
    
    if (watchlistPrompt.includes("empty")) {
        throw new Error("Not enough data in watchlist to generate recommendations.");
    }

    const prompt = `You are an anime recommendation expert. A user has provided their watchlist, categorized by their viewing status. Use this information to recommend 5 new anime they would likely enjoy.

- **Analyze their preferences:** Pay close attention to the anime they have 'Completed' and are 'Watching' to understand what they enjoy. These are strong positive signals.
- **Analyze their dislikes:** The anime in the 'Dropped (disliked)' list are shows they did not like. Avoid recommending anime with similar genres, themes, or styles to those they've dropped. This is a strong negative signal.
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

export async function getJointAIRecommendations(
    userWatchlist: WatchlistItem[],
    friendWatchlist: WatchlistItem[]
): Promise<{ title: string, reason: string }[]> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    const userPrompt = generateWatchlistPrompt(userWatchlist);
    const friendPrompt = generateWatchlistPrompt(friendWatchlist);
    
    const prompt = `You are an anime recommendation expert specializing in finding shows that groups of people will enjoy together. Two friends, User A (the main user) and User B (their friend), have provided their watchlists. Analyze both lists to find shared tastes and complementary preferences. Recommend 5 new anime they would both likely enjoy watching together.

- **Analyze shared interests:** Look for genres or specific anime they both have on their 'Completed' or 'Watching' lists.
- **Analyze individual tastes:** Identify strong preferences for each user that might overlap.
- **Avoid dislikes:** Do not recommend anything similar to what either user has 'Dropped'.
- **Justify each recommendation:** For each anime, provide a short reason explaining *why it's a good fit for both users*, referencing specific shows from their lists if possible.
- **Do not recommend any anime already on either of their lists.**

Here is User A's watchlist:${userPrompt}

Here is User B's watchlist:${friendPrompt}

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
        console.error("Error fetching joint AI recommendations:", error);
        throw new Error("Failed to get joint recommendations from AI. Please try again later.");
    }
}