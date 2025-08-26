import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, getDocs, query, getDoc } from 'firebase/firestore';
import { Anime, WatchlistItem, WatchStatus, User, Friend, UserProfile } from './types';
import { searchAnime, getWatchlist, saveWatchlistItem, deleteWatchlistItem } from './services/anilistService';
import { useAuth } from './hooks/useAuth';
import { db } from './services/firebase';
import { SearchBar } from './components/SearchBar';
import { AnimeCard } from './components/AnimeCard';
import { AnimeDetail } from './components/AnimeDetail';
import { GenreOverview } from './components/GenreOverview';
import { Profile } from './components/Profile';
import { Recommendations } from './components/Recommendations';
import { Sync } from './components/Sync';
import { TvIcon, SearchIcon, XMarkIcon, SparklesIcon, ChartBarIcon, UserIcon, UsersIcon } from './components/icons';
import { Watchlist } from './components/Watchlist';
import { Friends } from './components/Friends';
import { FriendProfile } from './components/FriendProfile';

type View = 'search' | 'watchlist' | 'overview' | 'profile' | 'recommendations' | 'sync' | 'friends';

const Header: React.FC<{
    currentView: View;
    onViewChange: (view: View) => void;
    isWatchlistSyncing?: boolean;
}> = ({ currentView, onViewChange, isWatchlistSyncing }) => {
    const { userProfile, anilistProfile, logout } = useAuth();
    
    return (
        <header className="bg-brand-bg-light/50 backdrop-blur-lg sticky top-0 z-30 w-full py-4 px-8 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <TvIcon className="w-8 h-8 text-brand-primary" />
                    <h1 className="text-2xl font-bold text-white">AnimeTracker</h1>
                </div>
                <nav className="hidden md:flex items-center gap-2 p-1 bg-brand-bg-dark rounded-lg">
                    <button onClick={() => onViewChange('search')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${currentView === 'search' ? 'bg-brand-secondary text-white' : 'text-brand-text-muted hover:bg-brand-bg-light'}`}>Search</button>
                    <button onClick={() => onViewChange('watchlist')} className={`flex items-center px-4 py-2 text-sm font-semibold rounded-md transition-colors ${currentView === 'watchlist' ? 'bg-brand-secondary text-white' : 'text-brand-text-muted hover:bg-brand-bg-light'}`}>
                        <span>My Watchlist</span>
                        {isWatchlistSyncing && (
                            <svg className="animate-spin ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                    </button>
                    <button onClick={() => onViewChange('overview')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${currentView === 'overview' ? 'bg-brand-secondary text-white' : 'text-brand-text-muted hover:bg-brand-bg-light'}`}>Overview</button>
                    <button onClick={() => onViewChange('recommendations')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${currentView === 'recommendations' ? 'bg-brand-primary text-white' : 'text-brand-text-muted hover:bg-brand-bg-light'}`}>
                        <SparklesIcon className="w-4 h-4" /> AI Recs
                    </button>
                    <button onClick={() => onViewChange('friends')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${currentView === 'friends' ? 'bg-brand-secondary text-white' : 'text-brand-text-muted hover:bg-brand-bg-light'}`}>Friends</button>
                    <button onClick={() => onViewChange('sync')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${currentView === 'sync' ? 'bg-brand-secondary text-white' : 'text-brand-text-muted hover:bg-brand-bg-light'}`}>Sync</button>
                    <button onClick={() => onViewChange('profile')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${currentView === 'profile' ? 'bg-brand-secondary text-white' : 'text-brand-text-muted hover:bg-brand-bg-light'}`}>Profile</button>
                </nav>
                <div className="hidden md:flex items-center gap-4">
                    {userProfile && (
                        <>
                            {anilistProfile ? (
                                <img src={anilistProfile.avatar.large} alt={anilistProfile.name} className="w-10 h-10 rounded-full" />
                            ) : (
                                <UserIcon className="w-10 h-10 p-2 text-slate-400 bg-brand-bg-dark rounded-full" />
                            )}
                             <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{userProfile.displayName}</span>
                                <button onClick={logout} className="text-sm font-semibold text-brand-text-muted hover:text-white">Logout</button>
                             </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

const BottomNavBar: React.FC<{
    currentView: View;
    onViewChange: (view: View) => void;
}> = ({ currentView, onViewChange }) => {
    const navItems = [
        { view: 'search', label: 'Search', icon: SearchIcon },
        { view: 'watchlist', label: 'Watchlist', icon: TvIcon },
        { view: 'overview', label: 'Overview', icon: ChartBarIcon },
        { view: 'recommendations', label: 'AI Recs', icon: SparklesIcon },
        { view: 'friends', label: 'Friends', icon: UsersIcon },
        { view: 'profile', label: 'Profile', icon: UserIcon },
    ] as const;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-brand-bg-light border-t border-slate-700 p-2 grid grid-cols-6 gap-1 z-40 md:hidden">
            {navItems.map(({ view, label, icon: Icon }) => (
                <button
                    key={view}
                    onClick={() => onViewChange(view)}
                    aria-label={label}
                    className={`flex flex-col items-center justify-center w-full text-xs transition-colors ${
                        currentView === view ? 'text-brand-primary' : 'text-brand-text-muted hover:text-white'
                    }`}
                >
                    <Icon className="w-6 h-6 mb-1" />
                    <span className="truncate">{label}</span>
                </button>
            ))}
        </nav>
    );
};

export default function App() {
  const { userProfile, anilistProfile, isLoading: isAuthLoading } = useAuth();
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(true);
  const [view, setView] = useState<View>('profile');
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncingIds, setSyncingIds] = useState(new Set<number>());
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);

  // State for viewing friend's profile
  const [viewingFriend, setViewingFriend] = useState<Friend | null>(null);
  const [friendProfile, setFriendProfile] = useState<UserProfile | null>(null);
  const [friendWatchlist, setFriendWatchlist] = useState<WatchlistItem[]>([]);
  const [isFetchingFriendData, setIsFetchingFriendData] = useState(false);


  const isInitialSyncing = useRef(false);
  const lastSyncTimestamp = useRef<number>(0);

  // Firestore real-time listener for watchlist
  useEffect(() => {
    if (!userProfile) {
        setWatchlist([]);
        setIsWatchlistLoading(false);
        return;
    }
    
    setIsWatchlistLoading(true);
    const watchlistRef = collection(db, 'users', userProfile.uid, 'watchlist');
    const q = query(watchlistRef);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userWatchlist = querySnapshot.docs.map(doc => doc.data() as WatchlistItem);
        setWatchlist(userWatchlist);
        setIsWatchlistLoading(false);
    }, (err) => {
        console.error("Watchlist listener error: ", err);
        setError("Could not load your watchlist.");
        setIsWatchlistLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handleInitialSync = useCallback(async (firestoreWatchlist: WatchlistItem[], profile: User, token: string) => {
    if (!userProfile) return;
    isInitialSyncing.current = true;
    setIsWatchlistLoading(true);
    setSyncError(null);
    try {
        const anilistWatchlist = await getWatchlist(profile.id, token);
        const anilistMap = new Map(anilistWatchlist.map(item => [item.anime.id, item]));
        const firestoreMap = new Map(firestoreWatchlist.map(item => [item.anime.id, item]));

        // Upload items only in Firestore to AniList
        const itemsToUpload = firestoreWatchlist.filter(item => !anilistMap.has(item.anime.id));
        for (const item of itemsToUpload) {
            await saveWatchlistItem(item.anime.id, item.status, item.watchedEpisodes, token);
        }

        // Write AniList items to Firestore (overwrite duplicates)
        const batch = writeBatch(db);
        for(const item of anilistWatchlist) {
            const docRef = doc(db, `users/${userProfile.uid}/watchlist`, item.anime.id.toString());
            batch.set(docRef, item);
        }
        await batch.commit();

    } catch (err) {
        console.error("Failed to sync and merge watchlist", err);
        setSyncError(`Failed to sync watchlist: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
        throw err;
    } finally {
        setIsWatchlistLoading(false);
        isInitialSyncing.current = false;
    }
  }, [userProfile]);


  useEffect(() => {
    if (!userProfile) {
        setView('profile');
        setSelectedAnime(null);
        setSearchResults([]);
    } else {
        if(view === 'profile' && !selectedAnime) setView('watchlist');
    }
  }, [userProfile]);

  useEffect(() => {
    if (selectedAnime) window.scrollTo(0, 0);
  }, [selectedAnime]);

  const handleSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setSelectedAnime(null);
    setView('search');
    try {
      const results = await searchAnime(query);
      setSearchResults(results);
      if (results.length === 0) setError("No results found.");
    } catch (err) {
      setError('Failed to fetch anime. Please try again later.');
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  const handleSelectAnime = (anime: Anime) => setSelectedAnime(anime);
  const handleCloseDetail = () => setSelectedAnime(null);

  const handleAddToWatchlist = useCallback(async (anime: Anime, status: WatchStatus) => {
    if (!userProfile) return;

    const existingItem = watchlist.find(item => item.anime.id === anime.id);

    let watchedEpisodes = existingItem?.watchedEpisodes || 0;
    if (status === WatchStatus.Completed && anime.episodes) watchedEpisodes = anime.episodes;
    else if (existingItem?.status !== WatchStatus.Watching && status === WatchStatus.Watching && watchedEpisodes === 0 && anime.episodes !== 0) watchedEpisodes = 1;
    else if (status === WatchStatus.PlanToWatch) watchedEpisodes = 0;

    const newItem: WatchlistItem = { ...existingItem, anime, status, watchedEpisodes };

    setSyncingIds(prev => new Set(prev).add(anime.id));
    try {
        const docRef = doc(db, 'users', userProfile.uid, 'watchlist', anime.id.toString());
        await setDoc(docRef, newItem, { merge: true });

        if (userProfile.anilistToken) {
            const result = await saveWatchlistItem(anime.id, status, watchedEpisodes, userProfile.anilistToken);
            await setDoc(docRef, { mediaListId: result.id, status: result.status, watchedEpisodes: result.progress }, { merge: true });
        }
    } catch (err) {
        console.error("Failed to save watchlist item:", err);
        setSyncError(`Failed to sync "${anime.title.english || anime.title.romaji}".`);
    } finally {
        setSyncingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(anime.id);
            return newSet;
        });
    }
}, [userProfile, watchlist]);


  const handleRemoveFromWatchlist = useCallback(async (animeId: number) => {
    if (!userProfile) return;

    const itemToRemove = watchlist.find(item => item.anime.id === animeId);
    if (!itemToRemove) return;
    
    setSyncingIds(prev => new Set(prev).add(animeId));
    try {
        const docRef = doc(db, 'users', userProfile.uid, 'watchlist', animeId.toString());
        await deleteDoc(docRef);

        if (userProfile.anilistToken && itemToRemove.mediaListId) {
            await deleteWatchlistItem(itemToRemove.mediaListId, userProfile.anilistToken);
        }
    } catch(err) {
        console.error("Failed to delete item:", err);
        setSyncError(`Failed to sync deletion for "${itemToRemove.anime.title.english || itemToRemove.anime.title.romaji}".`);
    } finally {
        setSyncingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(animeId);
            return newSet;
        });
    }
  }, [userProfile, watchlist]);

  const handleUpdateWatchedEpisodes = useCallback(async (animeId: number, change: number) => {
    if (!userProfile) return;

    const item = watchlist.find(i => i.anime.id === animeId);
    if (!item || item.anime.episodes === null || typeof item.anime.episodes === 'undefined') return;
    
    const newWatchedCount = Math.max(0, Math.min(item.anime.episodes, item.watchedEpisodes + change));
    let newStatus = item.status;

    if (newWatchedCount === item.anime.episodes) newStatus = WatchStatus.Completed;
    else if (newWatchedCount > 0 && item.status !== WatchStatus.Paused && item.status !== WatchStatus.Dropped) newStatus = WatchStatus.Watching;
    else if (item.status === WatchStatus.Completed && newWatchedCount < item.anime.episodes) newStatus = WatchStatus.Watching;
    
    setSyncingIds(prev => new Set(prev).add(animeId));
    try {
        const docRef = doc(db, 'users', userProfile.uid, 'watchlist', animeId.toString());
        await setDoc(docRef, { watchedEpisodes: newWatchedCount, status: newStatus }, { merge: true });
        
        if (userProfile.anilistToken) {
            const result = await saveWatchlistItem(animeId, newStatus, newWatchedCount, userProfile.anilistToken);
            await setDoc(docRef, { status: result.status, watchedEpisodes: result.progress }, { merge: true });
        }
    } catch (err) {
        console.error("Failed to update watched episodes:", err);
        setSyncError(`Failed to update episodes for "${item.anime.title.english || item.anime.title.romaji}".`);
    } finally {
         setSyncingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(animeId);
            return newSet;
        });
    }
  }, [userProfile, watchlist]);

  const syncAniListWatchlist = useCallback(async () => {
    if (isBackgroundSyncing || (Date.now() - lastSyncTimestamp.current < 60000)) {
        return;
    }
    if (!userProfile || !userProfile.anilistToken || !anilistProfile) {
        return;
    }

    setIsBackgroundSyncing(true);
    setSyncError(null);

    try {
      const anilistItems = await getWatchlist(anilistProfile.id, userProfile.anilistToken);
      const anilistMap = new Map(anilistItems.map(item => [item.anime.id, item]));

      const watchlistRef = collection(db, 'users', userProfile.uid, 'watchlist');
      const firestoreSnapshot = await getDocs(watchlistRef);
      const firestoreItems = firestoreSnapshot.docs.map(doc => doc.data() as WatchlistItem);

      const batch = writeBatch(db);

      for (const anilistItem of anilistItems) {
        const docRef = doc(watchlistRef, anilistItem.anime.id.toString());
        batch.set(docRef, anilistItem);
      }
      for (const firestoreItem of firestoreItems) {
        if (!anilistMap.has(firestoreItem.anime.id)) {
          const docRef = doc(watchlistRef, firestoreItem.anime.id.toString());
          batch.delete(docRef);
        }
      }

      await batch.commit();
      lastSyncTimestamp.current = Date.now();

    } catch (err) {
      console.error("Automatic sync failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while syncing.";
      setSyncError(`Auto-sync failed: ${errorMessage}`);
    } finally {
      setIsBackgroundSyncing(false);
    }
  }, [userProfile, anilistProfile, isBackgroundSyncing]);
  
  // Effect for initial load/profile change
  useEffect(() => {
    if (anilistProfile) {
      syncAniListWatchlist();
    }
  }, [anilistProfile, syncAniListWatchlist]);

  // Effect for tab visibility and periodic sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncAniListWatchlist();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncAniListWatchlist();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [syncAniListWatchlist]);

  const handleViewFriend = useCallback(async (friend: Friend) => {
    setView('friends');
    setSelectedAnime(null);
    setViewingFriend(friend);
    setIsFetchingFriendData(true);
    setError(null);
    try {
        const friendProfileDoc = await getDoc(doc(db, 'users', friend.uid));
        if (friendProfileDoc.exists()) {
            setFriendProfile(friendProfileDoc.data() as UserProfile);
        } else {
            throw new Error("Could not find friend's profile.");
        }
        const friendWatchlistRef = collection(db, 'users', friend.uid, 'watchlist');
        const friendWatchlistSnap = await getDocs(friendWatchlistRef);
        const watchlistData = friendWatchlistSnap.docs.map(doc => doc.data() as WatchlistItem);
        setFriendWatchlist(watchlistData);
    } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load friend's data.");
        setViewingFriend(null);
    } finally {
        setIsFetchingFriendData(false);
    }
  }, []);

  const handleCloseFriendView = () => {
      setViewingFriend(null);
      setFriendProfile(null);
      setFriendWatchlist([]);
  };
  
  const watchlistMap = useMemo(() => new Map(watchlist.map(item => [item.anime.id, item])), [watchlist]);
  const anySyncing = isWatchlistLoading || syncingIds.size > 0 || isBackgroundSyncing;

  const renderContent = () => {
      if (!userProfile) {
          return <main className="container mx-auto p-4 md:p-8"><Profile watchlist={[]} /></main>;
      }
      if (selectedAnime) {
          return <AnimeDetail anime={selectedAnime} onClose={handleCloseDetail} onNavigate={handleSelectAnime} />;
      }
      return (
          <main className="container mx-auto p-4 md:p-8">
            {view === 'search' && (
              <>
                <SearchBar onSearch={handleSearch} isLoading={isSearching} />
                {error && !isSearching && <p className="text-center text-red-400 mt-4">{error}</p>}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 mt-8">
                  {isSearching ? (
                     Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="bg-brand-bg-light rounded-lg shadow-lg aspect-[2/3] animate-pulse"></div>
                     ))
                  ) : (
                    searchResults.map(anime => (
                      <AnimeCard 
                        key={anime.id} 
                        anime={anime} 
                        onAddToWatchlist={handleAddToWatchlist}
                        watchlistItem={watchlistMap.get(anime.id)}
                        onCardClick={handleSelectAnime}
                        isSyncing={syncingIds.has(anime.id)}
                      />
                    ))
                  )}
                </div>
              </>
            )}
            {view === 'watchlist' && (
              <Watchlist 
                watchlist={watchlist} 
                onUpdateStatus={handleAddToWatchlist} 
                onUpdateWatchedEpisodes={handleUpdateWatchedEpisodes} 
                onRemoveFromWatchlist={handleRemoveFromWatchlist}
                onCardClick={handleSelectAnime}
                syncingIds={syncingIds}
              />
            )}
            {view === 'overview' && <GenreOverview watchlist={watchlist} />}
            {view === 'recommendations' && (
              <Recommendations 
                watchlist={watchlist} 
                watchlistMap={watchlistMap}
                onAddToWatchlist={handleAddToWatchlist}
                onSelectAnime={handleSelectAnime}
              />
            )}
            {view === 'friends' && (
              viewingFriend ? (
                 <FriendProfile
                    friend={viewingFriend}
                    friendProfile={friendProfile}
                    friendWatchlist={friendWatchlist}
                    isLoading={isFetchingFriendData}
                    onClose={handleCloseFriendView}
                    onSelectAnime={handleSelectAnime}
                    currentUserWatchlistMap={watchlistMap}
                    onAddToCurrentUserWatchlist={handleAddToWatchlist}
                    syncingIds={syncingIds}
                />
              ) : (
                <Friends onViewFriend={handleViewFriend} />
              )
            )}
            {view === 'sync' && (
                <Sync 
                    onSyncSuccess={handleInitialSync} 
                    currentWatchlist={watchlist} 
                    onSyncStart={() => {
                        isInitialSyncing.current = true;
                        setIsWatchlistLoading(true);
                    }}
                    onSyncFail={() => {
                        isInitialSyncing.current = false;
                        setIsWatchlistLoading(false);
                    }}
                />
            )}
            {view === 'profile' && <Profile watchlist={watchlist} />}
          </main>
      );
  };

  return (
    <div className="min-h-screen bg-brand-bg-dark text-brand-text pb-20 md:pb-0">
        {isAuthLoading ? (
             <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-brand-primary"></div>
            </div>
        ) : (
            <>
                {userProfile && <Header currentView={view} onViewChange={setView} isWatchlistSyncing={anySyncing} />}
                {renderContent()}
                {userProfile && <BottomNavBar currentView={view} onViewChange={setView} />}
                
                {syncError && (
                    <div className="fixed bottom-24 md:bottom-5 right-5 bg-red-600 text-white py-2 px-4 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in z-50">
                        <p>{syncError}</p>
                        <button onClick={() => setSyncError(null)} aria-label="Dismiss error">
                            <XMarkIcon className="w-5 h-5"/>
                        </button>
                    </div>
                )}
            </>
        )}
    </div>
  );
}