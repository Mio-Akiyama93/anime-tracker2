import React, { useMemo } from 'react';
import { UserProfile, WatchlistItem, WatchStatus } from '../types';
import { Watchlist } from './Watchlist';
import { UserIcon, TvIcon } from './icons';

const PublicHeader: React.FC = () => (
    <header className="bg-brand-bg-light/80 backdrop-blur-lg w-full py-4 px-8 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <TvIcon className="w-8 h-8 text-brand-primary" />
                <h1 className="text-2xl font-bold text-white">AnimeTracker</h1>
            </div>
            <a 
                href="/"
                className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors"
            >
                Create Your Own Watchlist
            </a>
        </div>
    </header>
);

const ProfileSummary: React.FC<{ profile: UserProfile }> = ({ profile }) => (
    <div className="bg-brand-bg-light p-4 md:p-8 rounded-2xl shadow-2xl max-w-2xl mx-auto text-brand-text mb-8">
        <div className="flex flex-col items-center text-center">
            <UserIcon className="w-24 h-24 p-4 text-slate-400 bg-brand-bg-dark rounded-full mb-4 shadow-lg" />
            <h2 className="text-3xl font-bold">{profile.displayName}</h2>
            {profile.anilistToken && <p className="text-sm text-brand-accent font-semibold mt-1">Synced with AniList</p>}
        </div>
    </div>
);

const statusConfig: Record<WatchStatus, { label: string; color: string }> = {
  [WatchStatus.Watching]: { label: 'Watching', color: '#0ea5e9' },
  [WatchStatus.Completed]: { label: 'Completed', color: '#10b981' },
  [WatchStatus.PlanToWatch]: { label: 'Plan to Watch', color: '#6366f1' },
  [WatchStatus.Dropped]: { label: 'Dropped', color: '#ef4444' },
  [WatchStatus.Paused]: { label: 'Paused', color: '#f59e0b' },
};

export const PublicProfile: React.FC<{
    profile: UserProfile;
    watchlist: WatchlistItem[];
}> = ({ profile, watchlist }) => {

    const stats = useMemo(() => {
        const watchlistStatusCounts = new Map<WatchStatus, number>();
        for (const item of watchlist) {
            watchlistStatusCounts.set(item.status, (watchlistStatusCounts.get(item.status) || 0) + 1);
        }
        const orderedStatuses: WatchStatus[] = [
            WatchStatus.Watching, WatchStatus.Completed, WatchStatus.PlanToWatch, WatchStatus.Paused, WatchStatus.Dropped,
        ];
        const fullStatusArray = orderedStatuses.map(status => ({
            status,
            count: watchlistStatusCounts.get(status) || 0,
        }));
        const episodesWatched = watchlist.reduce((sum, item) => sum + item.watchedEpisodes, 0);
        return { totalAnime: watchlist.length, episodesWatched, fullStatusArray };
    }, [watchlist]);

    return (
        <div className="min-h-screen bg-brand-bg-dark text-brand-text">
            <PublicHeader />
            <main className="container mx-auto p-4 md:p-8">
                <ProfileSummary profile={profile} />
                
                <div className="bg-brand-bg-light p-4 md:p-8 rounded-2xl shadow-2xl max-w-2xl mx-auto text-brand-text mb-8">
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
                    <hr className="border-slate-700 my-6" />
                    <div className="text-center">
                        <p className="text-2xl font-bold">{stats.episodesWatched.toLocaleString()}</p>
                        <p className="text-sm text-brand-text-muted">Episodes Watched</p>
                    </div>
                </div>

                <div className="bg-brand-bg-light p-4 md:p-8 rounded-2xl shadow-2xl max-w-7xl mx-auto text-brand-text">
                    <h2 className="text-3xl font-bold mb-6">{profile.displayName}'s Watchlist</h2>
                    <Watchlist
                        watchlist={watchlist}
                        onCardClick={() => {}} // No-op for public view
                        syncingIds={new Set()}
                        onUpdateStatus={() => {}} // No-op for public view
                        isReadOnly={true}
                    />
                </div>
            </main>
        </div>
    );
};
