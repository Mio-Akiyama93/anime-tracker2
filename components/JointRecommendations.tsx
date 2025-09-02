import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Anime, WatchlistItem, AIRecommendation, WatchStatus, Friend, UserProfile } from '../types';
import { getJointAIRecommendations } from '../services/geminiService';
import { searchAnime } from '../services/anilistService';
import { SparklesIcon, ArrowLeftIcon, UserIcon } from './icons';
import { AnimeCard } from './AnimeCard';

const loadingMessages = [
    "Analyzing both of your watchlists...",
    "Finding your shared anime tastes...",
    "Consulting the friendship oracle...",
    "Generating perfect recommendations for two...",
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
        }, 2500);
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
    isSyncing?: boolean;
}> = ({ anime, reason, onAddToWatchlist, watchlistItem, onCardClick, isSyncing }) => {
    return (
        <div className="bg-brand-bg-light rounded-lg shadow-lg overflow-hidden flex flex-col">
            <AnimeCard anime={anime} onAddToWatchlist={onAddToWatchlist} watchlistItem={watchlistItem} onCardClick={onCardClick} isSyncing={isSyncing} />
            <div className="p-4">
                <h4 className="font-bold text-brand-accent flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5" />
                    Why you'll both like it
                </h4>
                <p className="text-sm text-brand-text-muted mt-2">{reason}</p>
            </div>
        </div>
    );
};


interface JointRecommendationsProps {
    friend: Friend;
    userProfile: UserProfile;
    currentUserWatchlist: WatchlistItem[];
    watchlistMap: Map<number, WatchlistItem>;
    onAddToWatchlist: (anime: Anime, status: WatchStatus) => void;
    onSelectAnime: (anime: Anime) => void;
    onClose: () => void;
    syncingIds: Set<number>;
}

export const JointRecommendations: React.FC<JointRecommendationsProps> = ({ friend, userProfile, currentUserWatchlist, watchlistMap, onAddToWatchlist, onSelectAnime, onClose, syncingIds }) => {
    type FullRecommendation = AIRecommendation & { anime: Anime | null };
    const [recommendations, setRecommendations] = useState<FullRecommendation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [friendWatchlist, setFriendWatchlist] = useState<WatchlistItem[] | null>(null);

    useEffect(() => {
        const fetchFriendWatchlist = async () => {
            setError(null);
            try {
                const friendWatchlistRef = collection(db, 'users', friend.uid, 'watchlist');
                const friendWatchlistSnap = await getDocs(friendWatchlistRef);
                const watchlistData = friendWatchlistSnap.docs.map(doc => doc.data() as WatchlistItem);
                setFriendWatchlist(watchlistData);
            } catch (err) {
                const message = err instanceof Error ? err.message : "An unknown error occurred.";
                setError(`Could not load friend's watchlist: ${message}`);
                setFriendWatchlist([]);
            }
        };
        fetchFriendWatchlist();
    }, [friend.uid]);

    const handleFetchRecommendations = async () => {
        if (!friendWatchlist) return;

        setIsLoading(true);
        setError(null);
        setRecommendations([]);

        try {
            const aiRecs = await getJointAIRecommendations(currentUserWatchlist, friendWatchlist);
            
            const combinedWatchlistTitles = new Set([
                ...currentUserWatchlist.map(item => (item.anime.title.english || item.anime.title.romaji).toLowerCase()),
                ...friendWatchlist.map(item => (item.anime.title.english || item.anime.title.romaji).toLowerCase()),
            ]);

            const newAiRecs = aiRecs.filter(rec => !combinedWatchlistTitles.has(rec.title.toLowerCase()));

            if (newAiRecs.length === 0) {
                 setRecommendations([]);
                 setError("Could not find any new recommendations for both of you. Try adding more shows to your lists!");
                 return;
            }

            const animePromises = newAiRecs.map(rec => searchAnime(rec.title).then(results => results[0] || null));
            const animes = await Promise.all(animePromises);

            const fullRecs = newAiRecs.map((rec, i) => ({ ...rec, anime: animes[i] })).filter(rec => rec.anime);
            setRecommendations(fullRecs as FullRecommendation[]);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const canGenerate = friendWatchlist !== null;

    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
                 <button 
                    onClick={onClose} 
                    className="bg-brand-bg-light p-2 rounded-full hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    aria-label="Go back to friends list"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                 <div className="flex items-center">
                    <div className="flex flex-col items-center -space-x-4">
                        <UserIcon className="w-10 h-10 p-2 text-slate-400 bg-brand-bg-dark rounded-full ring-2 ring-brand-bg-light" />
                        <UserIcon className="w-10 h-10 p-2 text-slate-400 bg-brand-bg-dark rounded-full ring-2 ring-brand-bg-light" />
                    </div>
                    <div className="ml-3">
                         <h1 className="text-2xl font-bold">AI Sync-Up</h1>
                         <p className="text-sm text-brand-text-muted">For {userProfile.displayName} & {friend.displayName}</p>
                    </div>
                </div>
            </div>

            <div className="text-center mb-8 p-6 bg-brand-bg-light rounded-lg">
                <p className="text-brand-text-muted mt-2 max-w-2xl mx-auto">Find the perfect show for you and {friend.displayName} to watch next. Our AI will analyze both of your watchlists to suggest something you'll both love.</p>
                <button
                    onClick={handleFetchRecommendations}
                    disabled={isLoading || !canGenerate}
                    className="mt-6 px-8 py-3 bg-brand-primary text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg-dark focus:ring-brand-primary transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center gap-2 mx-auto"
                >
                    <SparklesIcon className="w-5 h-5" />
                    {isLoading ? 'Generating...' : !canGenerate ? "Loading Friend's Data..." : 'Get Joint Recommendations'}
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
                            isSyncing={syncingIds.has(rec.anime.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};