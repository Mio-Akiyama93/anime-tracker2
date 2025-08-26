import React, { useMemo } from 'react';
import { WatchlistItem } from '../types';
import { ChartBarIcon } from './icons';

const GENRE_COLORS = [
  '#65a30d', // lime-600
  '#2563eb', // blue-600
  '#9333ea', // purple-600
  '#db2777', // pink-600
  '#dc2626', // red-600
  '#ea580c', // orange-600
  '#ca8a04', // yellow-600
];

export const GenreOverview: React.FC<{ watchlist: WatchlistItem[] }> = ({ watchlist }) => {
  const genreStats = useMemo(() => {
    const counts = new Map<string, number>();
    watchlist.forEach(item => {
      item.anime.genres.forEach(genre => {
        counts.set(genre, (counts.get(genre) || 0) + 1);
      });
    });

    const sortedGenres = Array.from(counts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const totalTopEntries = sortedGenres.reduce((sum, [, count]) => sum + count, 0);

    return {
      topGenres: sortedGenres.map(([name, count], index) => ({
        name,
        count,
        color: GENRE_COLORS[index % GENRE_COLORS.length],
        percentage: totalTopEntries > 0 ? (count / totalTopEntries) * 100 : 0,
      })),
      totalTopEntries
    };
  }, [watchlist]);

  if (watchlist.length === 0 || genreStats.topGenres.length === 0) {
    return (
      <div className="text-center py-20">
        <ChartBarIcon className="w-16 h-16 mx-auto text-brand-text-muted" />
        <h2 className="mt-4 text-2xl font-semibold">No Genre Data Available</h2>
        <p className="mt-2 text-brand-text-muted">Add some anime to your watchlist to see your genre overview.</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-bg-light p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-brand-text">Genre Overview</h2>
      
      <div className="flex justify-around items-start text-center mb-6">
        {genreStats.topGenres.map(genre => (
          <div key={genre.name} className="flex flex-col items-center gap-2">
            <span 
              className="px-4 py-2 text-sm font-bold text-white rounded-md shadow"
              style={{ backgroundColor: genre.color }}
            >
              {genre.name}
            </span>
            <span className="text-lg font-semibold text-brand-text-muted">{genre.count} <span className="text-sm">Entries</span></span>
          </div>
        ))}
      </div>

      <div className="w-full bg-brand-bg-dark rounded-full h-4 flex overflow-hidden">
        {genreStats.topGenres.map(genre => (
          <div
            key={genre.name}
            className="h-4 transition-all duration-500"
            style={{ 
              width: `${genre.percentage}%`, 
              backgroundColor: genre.color,
            }}
            title={`${genre.name}: ${genre.count} entries (${genre.percentage.toFixed(1)}%)`}
          />
        ))}
      </div>
    </div>
  );
};
