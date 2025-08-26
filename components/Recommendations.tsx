import React, { useState, useEffect } from 'react';
import { Anime, WatchlistItem, AIRecommendation, WatchStatus } from '../types';
import { getAIRecommendations } from '../services/geminiService';
import { searchAnime } from '../services/anilistService';
import { SparklesIcon } from './icons';
import { AnimeCard } from './AnimeCard';

const loadingMessages = [
    "Analyzing your watchlist...",
    "Consulting the anime oracle...",
    "Finding hidden gems for you...",
    "Cross-referencing with otaku wisdom...",
    "Just a moment, crunching the data...",
];

const LoadingState: React.FC = () => {
    const [message, setMessage] = useState(loadingMessages[0]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setMessage(prevMessage => {
                const currentIndex = loadingMessages.indexOf(prevMessage);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                return loadingMessages[nextIndex];
            });
        }, 2000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto"></div>
            <p className="mt-4 text-lg text-brand-text-muted">{message}</p>
        </div>
    );
};

const RecommendationCard: React.FC<{
    anime: Anime;
    reason: string;
    onAddToWatchlist: (anime: Anime, status: WatchStatus) => void;
    watchlistItem?: WatchlistItem;
    onCardClick: (anime: Anime) => void;
}> = ({ anime, reason, onAddToWatchlist, watchlistItem, onCardClick }) => {
    return (
        <div className="bg-brand-bg-light rounded-lg shadow-lg overflow-hidden flex flex-col">
            <AnimeCard anime={anime} onAddToWatchlist={onAddToWatchlist} watchlistItem={watchlistItem} onCardClick={onCardClick} />
            <div className="p-4">
                <h4 className="font-bold text-brand-accent flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5" />
                    Why you'll like it
                </h4>
                <p className="text-sm text-brand-text-muted mt-2">{reason}</p>
            </div>
        </div>
    );
};

interface RecommendationsProps {
    watchlist: WatchlistItem[];
    watchlistMap: Map<number, WatchlistItem>;
    onAddToWatchlist: (anime: Anime, status: WatchStatus) => void;
    onSelectAnime: (anime: Anime) => void;
}

export const Recommendations: React.FC<RecommendationsProps> = ({ watchlist, watchlistMap, onAddToWatchlist, onSelectAnime }) => {
    type FullRecommendation = AIRecommendation & { anime: Anime | null };
    const [recommendations, setRecommendations] = useState<FullRecommendation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchRecommendations = async () => {
        setIsLoading(true);
        setError(null);
        setRecommendations([]);

        try {
            const aiRecs = await getAIRecommendations(watchlist);
            
            const watchlistTitles = new Set(watchlist.map(item => (item.anime.title.english || item.anime.title.romaji).toLowerCase()));
            const newAiRecs = aiRecs.filter(rec => !watchlistTitles.has(rec.title.toLowerCase()));

            if (newAiRecs.length === 0) {
                 setRecommendations([]);
                 setError("Could not find any new recommendations based on your list. Try adding more shows!");
                 return;
            }

            const animePromises = newAiRecs.map(rec => searchAnime(rec.title).then(results => results[0] || null));
            const animes = await Promise.all(animePromises);

            const fullRecs = newAiRecs.map((rec, i) => ({
                ...rec,
                anime: animes[i],
            })).filter(rec => rec.anime);

            setRecommendations(fullRecs as FullRecommendation[]);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    if (watchlist.length === 0) {
        return (
            <div className="text-center py-20">
                <SparklesIcon className="w-16 h-16 mx-auto text-brand-text-muted" />
                <h2 className="mt-4 text-2xl font-semibold">Get Personalized Recommendations</h2>
                <p className="mt-2 text-brand-text-muted">Add some anime to your watchlist, and our AI will suggest what to watch next!</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold">AI Recommendations</h1>
                <p className="text-brand-text-muted mt-2">Discover your next favorite show based on your watchlist.</p>
                <button
                    onClick={handleFetchRecommendations}
                    disabled={isLoading}
                    className="mt-6 px-8 py-3 bg-brand-primary text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg-dark focus:ring-brand-primary transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center gap-2 mx-auto"
                >
                    <SparklesIcon className="w-5 h-5" />
                    {isLoading ? 'Generating...' : 'Get AI Recommendations'}
                </button>
            </div>

            {isLoading && <LoadingState />}
            {error && !isLoading && <p className="text-center text-red-400">{error}</p>}
            {!isLoading && recommendations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map(rec => rec.anime && (
                        <RecommendationCard
                            key={rec.anime.id}
                            anime={rec.anime}
                            reason={rec.reason}
                            onAddToWatchlist={onAddToWatchlist}
                            watchlistItem={watchlistMap.get(rec.anime.id)}
                            onCardClick={onSelectAnime}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};