import React from 'react';
import { Anime, Friend, UserProfile, WatchlistItem, WatchStatus } from '../types';
import { Watchlist } from './Watchlist';
import { ArrowLeftIcon, UserIcon } from './icons';

const FriendProfileSummary: React.FC<{ friend: Friend, profile: UserProfile | null }> = ({ friend, profile }) => {
    return (
        <div className="bg-brand-bg-light p-4 md:p-8 rounded-2xl shadow-2xl max-w-2xl mx-auto text-brand-text mb-8">
            <div className="flex flex-col items-center text-center">
                <UserIcon className="w-24 h-24 p-4 text-slate-400 bg-brand-bg-dark rounded-full mb-4 shadow-lg" />
                <h2 className="text-3xl font-bold">{friend.displayName}</h2>
                {profile?.anilistToken && <p className="text-sm text-brand-accent font-semibold mt-1">Synced with AniList</p>}
            </div>
        </div>
    );
};

export const FriendProfile: React.FC<{
    friend: Friend;
    friendProfile: UserProfile | null;
    friendWatchlist: WatchlistItem[];
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
    onSelectAnime: (anime: Anime) => void;
    currentUserWatchlistMap: Map<number, WatchlistItem>;
    onAddToCurrentUserWatchlist: (anime: Anime, status: WatchStatus) => void;
    syncingIds: Set<number>;
}> = ({
    friend,
    friendProfile,
    friendWatchlist,
    isLoading,
    error,
    onClose,
    onSelectAnime,
    currentUserWatchlistMap,
    onAddToCurrentUserWatchlist,
    syncingIds
}) => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    if (error) {
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
                    <h1 className="text-3xl font-bold text-red-400">Error</h1>
                </div>
                <div className="text-center py-20 bg-brand-bg-light rounded-lg">
                    <p className="text-red-400">{`Could not load profile for ${friend.displayName}:`}</p>
                    <p className="text-red-300 mt-2">{error}</p>
                </div>
            </div>
        );
    }

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
                <h1 className="text-3xl font-bold">{friend.displayName}'s Watchlist</h1>
            </div>
            
            <FriendProfileSummary friend={friend} profile={friendProfile} />

            <Watchlist
                watchlist={friendWatchlist}
                onCardClick={onSelectAnime}
                isReadOnly={true}
                currentUserWatchlistMap={currentUserWatchlistMap}
                onUpdateStatus={onAddToCurrentUserWatchlist}
                syncingIds={syncingIds}
            />
        </div>
    );
};