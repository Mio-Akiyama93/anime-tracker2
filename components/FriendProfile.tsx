import React, { useMemo } from 'react';
import { Anime, Friend, UserProfile, WatchlistItem, WatchStatus } from '../types';
import { Watchlist } from './Watchlist';
import { ArrowLeftIcon, UserIcon } from './icons';

const statusConfig: Record<WatchStatus, { label: string; color: string }> = {
  [WatchStatus.Watching]: { label: 'Watching', color: '#0ea5e9' }, // sky-500
  [WatchStatus.Completed]: { label: 'Completed', color: '#10b981' }, // emerald-500
  [WatchStatus.PlanToWatch]: { label: 'Plan to Watch', color: '#6366f1' }, // indigo-500
  [WatchStatus.Dropped]: { label: 'Dropped', color: '#ef4444' }, // red-500
  [WatchStatus.Paused]: { label: 'Paused', color: '#f59e0b' }, // amber-500
};

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
    friendWatchlist: WatchlistItem[] | null;
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
    const stats = useMemo(() => {
        if (!friendWatchlist) return null;

        const watchlistStatusCounts = new Map<WatchStatus, number>();
        for (const item of friendWatchlist) {
            watchlistStatusCounts.set(item.status, (watchlistStatusCounts.get(item.status) || 0) + 1);
        }

        const orderedStatuses: WatchStatus[] = [
            WatchStatus.Watching,
            WatchStatus.Completed,
            WatchStatus.PlanToWatch,
            WatchStatus.Paused,
            WatchStatus.Dropped,
        ];

        const fullStatusArray = orderedStatuses.map(status => ({
            status,
            count: watchlistStatusCounts.get(status) || 0,
        }));
        
        const episodesWatched = friendWatchlist.reduce((sum, item) => sum + item.watchedEpisodes, 0);

        return {
            totalAnime: friendWatchlist.length,
            episodesWatched,
            fullStatusArray,
        };
    }, [friendWatchlist]);

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
                    <p className="text-red-400 mt-2">{error}</p>
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
                <h1 className="text-3xl font-bold">{friend.displayName}'s Profile</h1>
            </div>

            <FriendProfileSummary friend={friend} profile={friendProfile} />
            
            {stats && (
                <div className="bg-brand-bg-light p-4 md:p-8 rounded-2xl shadow-2xl max-w-2xl mx-auto text-brand-text mb-8">
                    <div>
                        <h3 className="text-xl font-bold mb-4">Anime Statistics</h3>
                        <div className="space-y-2 w-full">
                            {stats.fullStatusArray.map(({status, count}) => (
                               <div key={status} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: statusConfig[status].color }}></span>
                                        <span>{statusConfig[status].label}</span>
                                    </div>
                                    <span className="font-semibold">{count}</span>
                                </div>
                            ))}
                             <hr className="border-slate-700 !my-3" />
                             <div className="flex justify-between items-center font-bold">
                                <span>Total</span>
                                <span>{stats.totalAnime}</span>
                            </div>
                        </div>
                    </div>
                    <hr className="border-slate-700 my-6" />
                    <div className="text-center">
                        <div>
                            <p className="text-2xl font-bold">{stats.episodesWatched.toLocaleString()}</p>
                            <p className="text-sm text-brand-text-muted">Episodes Watched</p>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="bg-brand-bg-light p-4 md:p-8 rounded-2xl shadow-2xl max-w-7xl mx-auto text-brand-text">
                {friendWatchlist ? (
                    <Watchlist
                        watchlist={friendWatchlist}
                        onCardClick={onSelectAnime}
                        onUpdateStatus={onAddToCurrentUserWatchlist}
                        syncingIds={syncingIds}
                        isReadOnly={true}
                        currentUserWatchlistMap={currentUserWatchlistMap}
                    />
                ) : (
                    <div className="text-center py-20">
                        <UserIcon className="w-16 h-16 mx-auto text-brand-text-muted" />
                        <h2 className="mt-4 text-2xl font-semibold">Watchlist is Private</h2>
                        <p className="mt-2 text-brand-text-muted">This user's watchlist cannot be viewed due to their privacy settings.</p>
                    </div>
                )}
            </div>
        </div>
    );
};