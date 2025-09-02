import React, { useState, useMemo } from 'react';
import { WatchStatus, WatchlistItem } from '../types';
import { useAuth } from '../hooks/useAuth';
import { ChikaraIcon, UserIcon, LinkIcon, CheckIcon } from './icons';

const statusConfig: Record<WatchStatus, { label: string; color: string }> = {
  [WatchStatus.Watching]: { label: 'Watching', color: '#0ea5e9' }, // sky-500
  [WatchStatus.Completed]: { label: 'Completed', color: '#10b981' }, // emerald-500
  [WatchStatus.PlanToWatch]: { label: 'Plan to Watch', color: '#6366f1' }, // indigo-500
  [WatchStatus.Dropped]: { label: 'Dropped', color: '#ef4444' }, // red-500
  [WatchStatus.Paused]: { label: 'Paused', color: '#f59e0b' }, // amber-500
};

const AuthForm: React.FC = () => {
    const { login, register, isLoading, error } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginView, setIsLoginView] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isLoginView) {
                if (!email.trim() || !password.trim()) return;
                await login(email.trim(), password.trim());
            } else {
                if (!name.trim() || !email.trim() || !password.trim()) return;
                await register(name.trim(), email.trim(), password.trim());
            }
        } catch (err) {
            console.error(err); // Error is already handled in AuthContext
        }
    };
    
    const toggleView = () => {
        setName('');
        setEmail('');
        setPassword('');
        setIsLoginView(!isLoginView);
    }

    return (
        <div className="bg-brand-bg-light p-8 rounded-2xl shadow-2xl max-w-md mx-auto text-brand-text text-center">
            <ChikaraIcon className="w-24 h-24 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Welcome to AnimeTracker</h2>
            <p className="text-brand-text-muted mb-6">
                {isLoginView ? 'Log in to your account' : 'Create a new account'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                 {!isLoginView && (
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Display Name"
                        className="w-full p-3 bg-brand-bg-dark border border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors"
                        disabled={isLoading}
                        required
                    />
                 )}
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full p-3 bg-brand-bg-dark border border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors"
                    disabled={isLoading}
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full p-3 bg-brand-bg-dark border border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors"
                    disabled={isLoading}
                    required
                />
                <button
                    type="submit"
                    className="w-full py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg-dark focus:ring-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || !email || !password || (!isLoginView && !name)}
                >
                    {isLoading ? 'Loading...' : (isLoginView ? 'Login' : 'Register')}
                </button>
            </form>

            {error && <p className="text-red-400 mt-4">{error}</p>}

            <p className="mt-6 text-sm text-brand-text-muted">
                {isLoginView ? "Don't have an account? " : "Already have an account? "}
                <button onClick={toggleView} className="font-semibold text-brand-accent hover:underline">
                    {isLoginView ? 'Register' : 'Login'}
                </button>
            </p>
        </div>
    );
};


interface ProfileProps {
    watchlist: WatchlistItem[];
}

export const Profile: React.FC<ProfileProps> = ({ watchlist }) => {
    const { anilistProfile, userProfile, friends } = useAuth();
    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        if (!userProfile) return;
        const url = `${window.location.origin}/@${userProfile.displayName}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    const stats = useMemo(() => {
        const watchlistStatusCounts = new Map<WatchStatus, number>();
        for (const item of watchlist) {
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
        
        let episodesWatched: number;

        if (anilistProfile) {
            episodesWatched = anilistProfile.statistics.anime.episodesWatched;
        } else {
            episodesWatched = watchlist.reduce((sum, item) => sum + item.watchedEpisodes, 0);
        }

        return {
            totalAnime: watchlist.length,
            episodesWatched,
            fullStatusArray,
        };
    }, [anilistProfile, watchlist]);

    if (!userProfile) {
        return <AuthForm />;
    }
    
    return (
        <div className="bg-brand-bg-light p-4 md:p-8 rounded-2xl shadow-2xl max-w-2xl mx-auto text-brand-text">
            <div className="flex flex-col items-center text-center">
                {anilistProfile ? (
                    <>
                        <img src={anilistProfile.avatar.large} alt={anilistProfile.name} className="w-24 h-24 rounded-full mb-4 shadow-lg"/>
                        <h2 className="text-3xl font-bold">{anilistProfile.name}</h2>
                        <p className="text-sm text-brand-text-muted">(Local: {userProfile.displayName})</p>
                    </>
                ) : (
                    <>
                        <UserIcon className="w-24 h-24 p-4 text-slate-400 bg-brand-bg-dark rounded-full mb-4 shadow-lg" />
                         <h2 className="text-3xl font-bold">{userProfile.displayName}</h2>
                         <p className="text-sm text-brand-accent font-semibold mt-1">Not Synced with AniList</p>
                    </>
                )}
                <div className="mt-4">
                    <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-bg-dark rounded-full hover:bg-slate-700 transition-colors"
                    >
                        {copied ? (
                            <> <CheckIcon className="w-4 h-4 text-emerald-400" /> Copied! </>
                        ) : (
                            <> <LinkIcon className="w-4 h-4" /> Share Profile </>
                        )}
                    </button>
                </div>
            </div>
            
            <hr className="border-slate-700 my-6" />

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
            
            <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                    <p className="text-2xl font-bold">{friends.length}</p>
                    <p className="text-sm text-brand-text-muted">Friends</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">{stats.episodesWatched.toLocaleString()}</p>
                    <p className="text-sm text-brand-text-muted">Episodes</p>
                </div>
            </div>
        </div>
    );
};
