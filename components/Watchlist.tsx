import React, { useMemo, useState } from 'react';
import { Anime, WatchlistItem, WatchStatus } from '../types';
import { AnimeCard } from './AnimeCard';
import { ChevronDownIcon, ChevronUpIcon, SyncIcon, TvIcon, XMarkIcon } from './icons';

const statusOrder: WatchStatus[] = [
  WatchStatus.Watching,
  WatchStatus.Completed,
  WatchStatus.PlanToWatch,
  WatchStatus.Paused,
  WatchStatus.Dropped,
];

const getStatusLabel = (status: WatchStatus) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

export const Watchlist: React.FC<{ 
    watchlist: WatchlistItem[];
    onUpdateStatus: (anime: Anime, status: WatchStatus) => void;
    onUpdateWatchedEpisodes: (animeId: number, change: number) => void;
    onRemoveFromWatchlist: (animeId: number) => void;
    onCardClick: (anime: Anime) => void;
    syncingIds: Set<number>;
    onForceSync: () => void;
    isSyncing: boolean;
    isAnilistLinked: boolean;
}> = ({ 
    watchlist, 
    onUpdateStatus, 
    onUpdateWatchedEpisodes, 
    onRemoveFromWatchlist, 
    onCardClick, 
    syncingIds,
    onForceSync,
    isSyncing,
    isAnilistLinked
}) => {
    const groupedByStatus = useMemo(() => {
        const groups: Partial<Record<WatchStatus, WatchlistItem[]>> = {};
        for(const item of watchlist) {
            if(!groups[item.status]) groups[item.status] = [];
            groups[item.status]!.push(item);
        }
        return groups;
    }, [watchlist]);
    
    const [expandedCategories, setExpandedCategories] = useState<Set<WatchStatus>>(new Set([WatchStatus.Watching]));

    const toggleCategory = (category: WatchStatus) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            newSet.has(category) ? newSet.delete(category) : newSet.add(category);
            return newSet;
        });
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">My Watchlist</h1>
                {isAnilistLinked && (
                    <button
                        onClick={onForceSync}
                        disabled={isSyncing}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-secondary text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-wait"
                        aria-label="Force sync with AniList"
                    >
                        <SyncIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync with AniList'}</span>
                    </button>
                )}
            </div>
            {watchlist.length === 0 ? (
                <div className="text-center py-20">
                    <TvIcon className="w-16 h-16 mx-auto text-brand-text-muted" />
                    <h2 className="mt-4 text-2xl font-semibold">Your Watchlist is Empty</h2>
                    <p className="mt-2 text-brand-text-muted">Use the search to find anime and add it to your list.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {statusOrder.map(status => {
                        const items = groupedByStatus[status];
                        if (!items || items.length === 0) return null;
                        const isExpanded = expandedCategories.has(status);

                        return (
                            <section key={status}>
                                <button onClick={() => toggleCategory(status)} className="w-full flex justify-between items-center text-left mb-4 pb-2 border-b-2 border-slate-700 hover:bg-slate-800/50 p-2 rounded-t-lg transition-colors" aria-expanded={isExpanded}>
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? <ChevronUpIcon className="w-6 h-6 text-brand-text-muted" /> : <ChevronDownIcon className="w-6 h-6 text-brand-text-muted" />}
                                        <h2 className="text-2xl font-bold">{getStatusLabel(status)} ({items.length})</h2>
                                    </div>
                                </button>
                                <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className="overflow-hidden">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 pt-2">
                                            {items.map(item => (
                                                <div key={item.anime.id} className="relative">
                                                    <AnimeCard 
                                                        anime={item.anime} 
                                                        onAddToWatchlist={onUpdateStatus} 
                                                        watchlistItem={item}
                                                        onUpdateWatchedEpisodes={onUpdateWatchedEpisodes}
                                                        onCardClick={onCardClick}
                                                        isSyncing={syncingIds.has(item.anime.id)}
                                                    />
                                                    <button onClick={() => onRemoveFromWatchlist(item.anime.id)} className="absolute -top-2 -right-2 z-20 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors" aria-label="Remove from watchlist">
                                                        <XMarkIcon className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
};