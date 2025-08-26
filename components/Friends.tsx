import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserProfile, FriendRequest, Friend } from '../types';
import { SearchIcon, UserIcon, XMarkIcon, CheckIcon, PlusIcon } from './icons';

type FriendsView = 'list' | 'add' | 'requests';

interface FriendsProps {
    onViewFriend: (friend: Friend) => void;
}

export const Friends: React.FC<FriendsProps> = ({ onViewFriend }) => {
    const { userProfile, friends, incomingRequests, outgoingRequests, searchUsers, sendFriendRequest, respondToFriendRequest, cancelFriendRequest, removeFriend } = useAuth();
    const [view, setView] = useState<FriendsView>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setError(null);
        try {
            const results = await searchUsers(searchQuery);
            setSearchResults(results);
        } catch (err) {
            setError("Failed to search for users.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleAction = async (action: () => Promise<void>) => {
        setActionLoading(true);
        setError(null);
        try {
            await action();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setActionLoading(false);
        }
    };
    
    const getActionForUser = (user: UserProfile): React.ReactNode => {
        if (!userProfile) return null;
        if (friends.some(f => f.uid === user.uid)) {
            return <span className="text-xs font-semibold text-emerald-400">Already Friends</span>;
        }
        if (outgoingRequests.some(r => r.toUid === user.uid)) {
            return <span className="text-xs font-semibold text-amber-400">Request Sent</span>;
        }
        if (incomingRequests.some(r => r.fromUid === user.uid)) {
             return <span className="text-xs font-semibold text-sky-400">Check Incoming Requests</span>;
        }
        return (
            <button
                onClick={() => handleAction(() => sendFriendRequest(user))}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-md hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
                <PlusIcon className="w-4 h-4" />
            </button>
        );
    };

    const renderContent = () => {
        if (!userProfile) return null;

        switch (view) {
            case 'list':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">My Friends ({friends.length})</h2>
                        {friends.length > 0 ? (
                            <ul className="space-y-3">
                                {friends.map(friend => (
                                    <li key={friend.uid} className="flex items-center justify-between bg-brand-bg-light p-3 rounded-lg">
                                        <button onClick={() => onViewFriend(friend)} className="flex items-center gap-3 text-left w-full hover:opacity-80 transition-opacity">
                                            <UserIcon className="w-8 h-8 p-1 bg-brand-bg-dark rounded-full text-slate-400 flex-shrink-0" />
                                            <span className="font-semibold">{friend.displayName}</span>
                                        </button>
                                        <button 
                                            onClick={() => handleAction(() => removeFriend(friend))}
                                            disabled={actionLoading}
                                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex-shrink-0 ml-4"
                                        >
                                            Unfriend
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-brand-text-muted text-center py-8">You haven't added any friends yet. Use the "Find People" tab to connect with others!</p>
                        )}
                    </div>
                );
            case 'add':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Find People</h2>
                        <form onSubmit={handleSearch} className="flex items-center gap-2 mb-6">
                            <div className="relative flex-grow">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by display name..."
                                    className="w-full pl-10 pr-4 py-3 bg-brand-bg-dark border border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-text-muted">
                                    <SearchIcon className="w-5 h-5"/>
                                </div>
                            </div>
                            <button type="submit" className="px-6 py-3 bg-brand-secondary text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors" disabled={isSearching}>
                                {isSearching ? "Searching..." : "Search"}
                            </button>
                        </form>
                        {searchResults.length > 0 && (
                            <ul className="space-y-3">
                                {searchResults.map(user => (
                                    <li key={user.uid} className="flex items-center justify-between bg-brand-bg-light p-3 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <UserIcon className="w-8 h-8 p-1 bg-brand-bg-dark rounded-full text-slate-400" />
                                            <span className="font-semibold">{user.displayName}</span>
                                        </div>
                                        {getActionForUser(user)}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                );
            case 'requests':
                const requestCount = incomingRequests.length + outgoingRequests.length;
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Friend Requests ({requestCount})</h2>
                        <div className="space-y-6">
                            <section>
                                <h3 className="text-lg font-semibold border-b border-slate-700 pb-2 mb-3">Incoming ({incomingRequests.length})</h3>
                                {incomingRequests.length > 0 ? (
                                    <ul className="space-y-3">
                                        {incomingRequests.map(req => (
                                            <li key={req.id} className="flex items-center justify-between bg-brand-bg-light p-3 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <UserIcon className="w-8 h-8 p-1 bg-brand-bg-dark rounded-full text-slate-400" />
                                                    <span className="font-semibold">{req.fromName}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleAction(() => respondToFriendRequest(req, true))} disabled={actionLoading} className="p-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"><CheckIcon className="w-4 h-4"/></button>
                                                    <button onClick={() => handleAction(() => respondToFriendRequest(req, false))} disabled={actionLoading} className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"><XMarkIcon className="w-4 h-4"/></button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-brand-text-muted text-sm">No incoming friend requests.</p>}
                            </section>
                            <section>
                                <h3 className="text-lg font-semibold border-b border-slate-700 pb-2 mb-3">Outgoing ({outgoingRequests.length})</h3>
                                {outgoingRequests.length > 0 ? (
                                    <ul className="space-y-3">
                                        {outgoingRequests.map(req => (
                                            <li key={req.id} className="flex items-center justify-between bg-brand-bg-light p-3 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <UserIcon className="w-8 h-8 p-1 bg-brand-bg-dark rounded-full text-slate-400" />
                                                    <span className="font-semibold">{req.toName}</span>
                                                </div>
                                                <button onClick={() => handleAction(() => cancelFriendRequest(req))} disabled={actionLoading} className="px-3 py-1.5 bg-slate-600 text-white text-xs font-semibold rounded-md hover:bg-slate-700">Cancel</button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-brand-text-muted text-sm">No outgoing friend requests.</p>}
                            </section>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-6 border-b border-slate-700">
                <nav className="flex items-center gap-2 p-1 bg-brand-bg-dark rounded-lg">
                    <button onClick={() => setView('list')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${view === 'list' ? 'bg-brand-secondary text-white' : 'text-brand-text-muted hover:bg-brand-bg-light'}`}>My Friends</button>
                    <button onClick={() => setView('add')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${view === 'add' ? 'bg-brand-secondary text-white' : 'text-brand-text-muted hover:bg-brand-bg-light'}`}>Find People</button>
                    <button onClick={() => setView('requests')} className={`relative px-4 py-2 text-sm font-semibold rounded-md transition-colors ${view === 'requests' ? 'bg-brand-secondary text-white' : 'text-brand-text-muted hover:bg-brand-bg-light'}`}>
                        Requests
                        {incomingRequests.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-primary text-white text-[10px] items-center justify-center">{incomingRequests.length}</span>
                            </span>
                        )}
                    </button>
                </nav>
            </div>
            
            {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 text-center">
                    <p>{error}</p>
                </div>
            )}
            
            <div className="animate-fade-in">
                {renderContent()}
            </div>
        </div>
    );
};