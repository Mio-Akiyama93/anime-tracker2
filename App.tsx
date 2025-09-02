import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, getDocs, query, where, getDoc } from 'firebase/firestore';
import { Anime, WatchlistItem, WatchStatus, User, Friend, UserProfile } from './types';
import { searchAnime, getWatchlist, saveWatchlistItem, deleteWatchlistItem } from './services/anilistService';
import { getUserProfileByDisplayName, getWatchlistForUser } from './services/publicService';
import { useAuth } from './hooks/useAuth';
import { db } from './services/firebase';
import { SearchBar } from './components/SearchBar';
import { AnimeCard } from './components/AnimeCard';
import { AnimeDetail } from './components/AnimeDetail';
import { GenreOverview } from './components/GenreOverview';
import { Profile } from './components/Profile';
import { Recommendations } from './components/Recommendations';
import { Sync } from './components/Sync';
import { TvIcon, SearchIcon, XMarkIcon, SparklesIcon, ChartBarIcon, UserIcon, UsersIcon, BellIcon } from './components/icons';
import { Watchlist } from './components/Watchlist';
import { Friends } from './components/Friends';
import { FriendProfile } from './components/FriendProfile';
import { Notifications } from './components/Notifications';
import { PublicProfile } from './components/PublicProfile';

type View = 'search' | 'watchlist' | 'overview' | 'profile' | 'recommendations' | 'sync' | 'friends';

const Header: React.FC<{
    currentView: View;
    onViewChange: (view: View) => void;
    isWatchlistSyncing?: boolean;
    unreadNotifications: number;
    onOpenNotifications: () => void;
}> = ({ currentView, onViewChange, isWatchlistSyncing, unreadNotifications, onOpenNotifications }) => {
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
                <div className="flex items-center gap-2 sm:gap-4">
                    {userProfile && (
                        <>
                            <button onClick={onOpenNotifications} className="relative p-2 rounded-full text-brand-text-muted hover:text-white hover:bg-brand-bg-light transition-colors" aria-label="Open notifications">
                                <BellIcon className="w-6 h-6" />
                                {unreadNotifications > 0 && (
                                     <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-primary text-white text-[10px] items-center justify-center">{unreadNotifications}</span>
                                    </span>
                                )}
                            </button>
                            {anilistProfile ? (
                                <img src={anilistProfile.avatar.large} alt={anilistProfile.name} className="w-10 h-10 rounded-full" />
                            ) : (
                                <UserIcon className="w-10 h-10 p-2 text-slate-400 bg-brand-bg-dark rounded-full" />
                            )}
                             <div className="hidden sm:flex items-center gap-2">
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
  const { userProfile, anilistProfile, isLoading: isAuthLoading, notifications, markNotificationsAsRead } = useAuth();
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [view, setView] = useState<View>('profile');
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncingIds, setSyncingIds] = useState(new Set<number>());
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // State for public profile view
  const [publicViewData, setPublicViewData] = useState<{ profile: UserProfile; watchlist: WatchlistItem[] } | null>(null);
  const [isPublicViewLoading, setIsPublicViewLoading] = useState(true);
  const [publicViewError, setPublicViewError] = useState<string | null>(null);

  // State for viewing friend's profile
  const [viewingFriend, setViewingFriend] = useState<Friend | null>(null);
  const [friendProfile, setFriendProfile] = useState<UserProfile | null>(null);
  const [friendWatchlist, setFriendWatchlist] = useState<WatchlistItem[] | null>([]);
  const [isFetchingFriendData, setIsFetchingFriendData] = useState(false);
  const [friendViewError, setFriendViewError] = useState<string | null>(null);


  const isInitialSyncing = useRef(false);
  const lastSyncTimestamp = useRef<number>(0);

  // Handle public profile routing on initial load
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/@(\w+)$/);

    if (match) {
      const displayName = match[1];
      const loadPublicProfile = async () => {
        try {
          const profile = await getUserProfileByDisplayName(displayName);
          if (!profile) {
            throw new Error('User not found.');
          }
          const watchlist = await getWatchlistForUser(profile.uid);
          setPublicViewData({ profile, watchlist });
        } catch (err) {
          setPublicViewError(err instanceof Error ? err.message : 'Failed to load profile.');
        } finally {
          setIsPublicViewLoading(false);
        }
      };
      loadPublicProfile();
    } else {
      setIsPublicViewLoading(false); // Not a public path, proceed with normal app loading
    }
  }, []);

  // Firestore real-time listener for watchlist
  useEffect(() => {
    if (!userProfile) {
        setWatchlist([]);
        return;
    }
    
    const watchlistRef = collection(db, 'users', userProfile.uid, 'watchlist');
    const q = query(watchlistRef);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userWatchlist = querySnapshot.docs.map(doc => doc.data() as WatchlistItem);
        setWatchlist(userWatchlist);
    }, (err) => {
        console.error("Watchlist listener error: ", err);
        setError("Could not load your watchlist.");
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handleInitialSync = useCallback(async (firestoreWatchlist: WatchlistItem[], profile: User, token: string) => {
    if (!userProfile) return;
    isInitialSyncing.current = true;
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
        isInitialSyncing.current = false;
    }
  }, [userProfile]);


  // Determine overall app loading state
  useEffect(() => {
    // App is considered loaded when auth is checked AND it's not a public view path that's still loading.
    if (!isAuthLoading && !isPublicViewLoading) setIsAppLoading(false);
  }, [isAuthLoading, isPublicViewLoading]);

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
    setFriendViewError(null);
    setFriendProfile(null);
    setFriendWatchlist([]); // Reset to empty array for loading state

    try {
        const friendProfileRef = doc(db, 'users', friend.uid);
        const friendProfileSnap = await getDoc(friendProfileRef);

        if (friendProfileSnap.exists()) {
            setFriendProfile(friendProfileSnap.data() as UserProfile);
        } else {
            throw new Error("Could not find friend's profile.");
        }

        const friendWatchlistRef = collection(db, 'users', friend.uid, 'watchlist');
        const friendWatchlistSnap = await getDocs(friendWatchlistRef);
        const watchlistData = friendWatchlistSnap.docs.map(doc => doc.data() as WatchlistItem);
        setFriendWatchlist(watchlistData);
    } catch (err) {
        console.warn(`Could not fetch friend's data:`, err);
        if (err instanceof Error && err.message.includes('permission-denied')) {
             setFriendViewError("This user's watchlist is private.");
             setFriendWatchlist(null); // Explicitly set to null to indicate a failed/private fetch
        } else {
             setFriendViewError(err instanceof Error ? err.message : "Failed to load friend's data.");
        }
    } finally {
        setIsFetchingFriendData(false);
    }
  }, []);

  const handleCloseFriendView = () => {
      setViewingFriend(null);
      setFriendProfile(null);
      setFriendWatchlist([]);
      setFriendViewError(null);
  };
  
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const handleOpenNotifications = () => {
      setIsNotificationsOpen(true);
      if (unreadCount > 0) {
          markNotificationsAsRead();
      }
  };

  const handleCloseNotifications = () => {
      setIsNotificationsOpen(false);
  };

  const watchlistMap = useMemo(() => new Map(watchlist.map(item => [item.anime.id, item])), [watchlist]);
  const anySyncing = syncingIds.size > 0 || isBackgroundSyncing;

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
                syncingIds={syncingIds}
              />
            )}
            {view === 'friends' && (
              viewingFriend ? (
                 <FriendProfile
                    friend={viewingFriend}
                    friendProfile={friendProfile}
                    friendWatchlist={friendWatchlist}
                    isLoading={isFetchingFriendData}
                    error={friendViewError}
                    onClose={handleCloseFriendView}
                    onSelectAnime={handleSelectAnime}
                    currentUserWatchlistMap={watchlistMap}
                    onAddToCurrentUserWatchlist={handleAddToWatchlist}
                    syncingIds={syncingIds}
                />
              ) : (
                <Friends 
                    onViewFriend={handleViewFriend} 
                    currentUserWatchlist={watchlist}
                    onAddToWatchlist={handleAddToWatchlist}
                    onSelectAnime={handleSelectAnime}
                    watchlistMap={watchlistMap}
                    syncingIds={syncingIds}
                />
              )
            )}
            {view === 'sync' && (
                <Sync 
                    onSyncSuccess={handleInitialSync} 
                    currentWatchlist={watchlist} 
                    onSyncStart={() => {
                        isInitialSyncing.current = true;
                    }}
                    onSyncFail={() => {
                        isInitialSyncing.current = false;
                    }}
                />
            )}
            {view === 'profile' && <Profile watchlist={watchlist} />}
          </main>
      );
  };

  // Render public profile if URL matches
  if (!isPublicViewLoading && publicViewData) {
    return <PublicProfile profile={publicViewData.profile} watchlist={publicViewData.watchlist} />;
  }

  // Render error page for public profile
  if (!isPublicViewLoading && publicViewError) {
      return (
        <div className="min-h-screen bg-brand-bg-dark text-brand-text flex flex-col items-center justify-center text-center p-4">
            <TvIcon className="w-24 h-24 text-brand-primary mb-4" />
            <h1 className="text-4xl font-bold text-red-500">Could Not Load Profile</h1>
            <p className="text-lg text-brand-text-muted mt-2">{publicViewError}</p>
            <a href="/" className="mt-8 px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors">
                Back to AnimeTracker
            </a>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-brand-bg-dark text-brand-text pb-20 md:pb-0">
        {isAppLoading ? (
             // Show a spinner if the main app is still loading (auth check, etc.)
             // or if we are waiting to determine if it's a public path.
             <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-brand-primary"></div>
            </div>
        ) : (
            <>
                {userProfile && <Header currentView={view} onViewChange={setView} isWatchlistSyncing={anySyncing} unreadNotifications={unreadCount} onOpenNotifications={handleOpenNotifications} />}
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

                {isNotificationsOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={handleCloseNotifications} role="dialog" aria-modal="true" aria-labelledby="notifications-title">
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-16 right-4 sm:right-8 w-full max-w-sm bg-brand-bg-light rounded-lg shadow-2xl overflow-hidden animate-fade-in"
                        >
                            <div className="p-4 flex justify-between items-center border-b border-slate-700">
                                <h2 id="notifications-title" className="text-lg font-bold">Notifications</h2>
                                <button onClick={handleCloseNotifications} aria-label="Close notifications">
                                    <XMarkIcon className="w-6 h-6 text-brand-text-muted hover:text-white" />
                                </button>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto">
                                <Notifications />
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}
    </div>
  );
}
