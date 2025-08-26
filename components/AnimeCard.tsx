import React, { useState } from 'react';
import { Anime, WatchStatus, WatchlistItem } from '../types';
import { PlusIcon, CheckIcon, MinusIcon, TvIcon } from './icons';

interface AnimeCardProps {
  anime: Anime;
  watchlistItem?: WatchlistItem | null;
  onAddToWatchlist?: (anime: Anime, status: WatchStatus) => void;
  onUpdateWatchedEpisodes?: (animeId: number, change: number) => void;
  onCardClick?: (anime: Anime) => void;
  isSyncing?: boolean;
  isReadOnly?: boolean;
  currentUserWatchlistItem?: WatchlistItem | null;
}

const getStatusColor = (status: WatchStatus) => {
  switch (status) {
    case WatchStatus.Watching: return 'bg-sky-500';
    case WatchStatus.Completed: return 'bg-emerald-500';
    case WatchStatus.PlanToWatch: return 'bg-indigo-500';
    case WatchStatus.Dropped: return 'bg-red-500';
    case WatchStatus.Paused: return 'bg-amber-500';
    default: return 'bg-slate-700';
  }
};

const getStatusLabel = (status: WatchStatus) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

const AddToWatchlistDropdown: React.FC<{ onSelect: (status: WatchStatus) => void }> = ({ onSelect }) => (
  <div className="absolute top-full right-0 mt-2 w-36 bg-slate-900/80 backdrop-blur-sm rounded-lg shadow-lg p-2 flex flex-col gap-2 z-20">
    {(Object.values(WatchStatus) as WatchStatus[]).map(status => (
      <button
        key={status}
        onClick={(e) => { e.stopPropagation(); onSelect(status); }}
        className={`px-3 py-1 text-xs font-semibold rounded-md text-white transition-transform transform hover:scale-105 ${getStatusColor(status)}`}
      >
        {getStatusLabel(status)}
      </button>
    ))}
  </div>
);


export const AnimeCard: React.FC<AnimeCardProps> = ({ 
    anime, 
    onAddToWatchlist, 
    watchlistItem, 
    onUpdateWatchedEpisodes, 
    onCardClick, 
    isSyncing,
    isReadOnly = false,
    currentUserWatchlistItem,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(prev => !prev);
  };
  
  const handleSelectStatus = (status: WatchStatus) => {
      onAddToWatchlist?.(anime, status);
      setIsDropdownOpen(false);
  }

  const title = anime.title.english || anime.title.romaji;
  const coverColor = anime.coverImage?.color || '#334155'; // slate-700
  const coverImageUrl = anime.coverImage?.extraLarge;

  const itemForAction = isReadOnly ? currentUserWatchlistItem : watchlistItem;

  return (
    <div 
        className="relative group bg-brand-bg-light rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
        onClick={() => onCardClick?.(anime)}
    >
      {isSyncing && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-30 rounded-lg animate-fade-in">
          <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 rounded-t-lg"></div>
      {coverImageUrl ? (
        <img src={coverImageUrl} alt={title} className="w-full h-72 object-cover rounded-t-lg" />
      ) : (
        <div className="w-full h-72 bg-slate-800 flex flex-col items-center justify-center rounded-t-lg">
            <TvIcon className="w-16 h-16 text-slate-600" />
            <span className="mt-2 text-sm text-slate-500">No Image</span>
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 p-4 z-10 w-full">
        <h3 className="text-lg font-bold text-white truncate group-hover:whitespace-normal group-hover:line-clamp-2" title={title}>
          {title}
        </h3>
        
        {watchlistItem && watchlistItem.anime.episodes && onUpdateWatchedEpisodes ? (
            <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={(e) => {e.stopPropagation(); onUpdateWatchedEpisodes(anime.id, -1)}}
                        disabled={watchlistItem.watchedEpisodes === 0}
                        className="p-1.5 bg-slate-700/50 rounded-full text-white hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Decrement watched episodes"
                    >
                        <MinusIcon className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-white tabular-nums">
                        {watchlistItem.watchedEpisodes} / {watchlistItem.anime.episodes}
                    </span>
                    <button 
                        onClick={(e) => {e.stopPropagation(); onUpdateWatchedEpisodes(anime.id, 1)}}
                        disabled={watchlistItem.watchedEpisodes === watchlistItem.anime.episodes}
                        className="p-1.5 bg-slate-700/50 rounded-full text-white hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Increment watched episodes"
                    >
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>
                {anime.averageScore && <span className="text-xs text-brand-text-muted">{anime.averageScore}%</span>}
            </div>
        ) : (
             <div className="flex items-center justify-between text-xs text-brand-text-muted mt-1 gap-2">
                <div className="flex items-center gap-2">
                    <span>{anime.episodes ? `${anime.episodes} episodes` : 'TBA'}</span>
                    {anime.averageScore && <><span>&bull;</span><span>{anime.averageScore}%</span></>}
                </div>
                 {isReadOnly && watchlistItem && (
                    <span className="font-semibold">{watchlistItem.watchedEpisodes} / {watchlistItem.anime.episodes ?? '?'}</span>
                )}
            </div>
        )}

      </div>

        <div className="absolute top-2 right-2 z-20 flex items-start gap-1">
             {isReadOnly && watchlistItem && (
                <div 
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white rounded-full shadow-lg ${getStatusColor(watchlistItem.status)}`}
                >
                    <TvIcon className="w-4 h-4" />
                </div>
            )}
            {onAddToWatchlist && (
                <div className="relative">
                {itemForAction ? (
                    <button 
                        onClick={handleToggleDropdown}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white rounded-full shadow-lg transition-transform transform group-hover:scale-110 hover:opacity-90 ${getStatusColor(itemForAction.status)}`}
                    >
                        <CheckIcon className="w-4 h-4" />
                        <span>{getStatusLabel(itemForAction.status)}</span>
                    </button>
                ) : (
                    <button 
                    onClick={handleToggleDropdown} 
                    style={{ backgroundColor: coverColor }}
                    className="p-2 rounded-full text-white shadow-lg transition-transform transform group-hover:scale-110 hover:opacity-90"
                    >
                    <PlusIcon className="w-5 h-5" />
                    </button>
                )}
                {isDropdownOpen && <AddToWatchlistDropdown onSelect={handleSelectStatus} />}
                </div>
            )}
      </div>
    </div>
  );
};