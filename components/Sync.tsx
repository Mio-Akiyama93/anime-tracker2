import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { SyncIcon } from './icons';
import { WatchlistItem, User as AnilistUser } from '../types';

interface SyncProps {
    onSyncSuccess: (localWatchlistToMerge: WatchlistItem[], profile: AnilistUser, token: string) => Promise<void>;
    onSyncStart: () => void;
    onSyncFail: () => void;
    currentWatchlist: WatchlistItem[];
}

export const Sync: React.FC<SyncProps> = ({ onSyncSuccess, onSyncStart, onSyncFail, currentWatchlist }) => {
    const { linkAnilist, unlinkAnilist, anilistProfile, isLoading: isAuthLoading, error } = useAuth();
    const [token, setToken] = useState('');
    const [clientId, setClientId] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);
    const [isMerging, setIsMerging] = useState(false);

    const handleProceedWithSync = async (listToMerge: WatchlistItem[]) => {
        const trimmedToken = token.trim();
        if (!trimmedToken) return;
        
        onSyncStart();
        setIsMerging(true);
        try {
            const profile = await linkAnilist(trimmedToken);
            if (profile) {
                await onSyncSuccess(listToMerge, profile, trimmedToken);
            } else {
                onSyncFail();
            }
        } catch (err) {
            console.error("Failed to link or merge:", err);
            onSyncFail();
        } finally {
            setIsMerging(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentWatchlist.length > 0) {
            setIsConfirming(true);
        } else {
            handleProceedWithSync(currentWatchlist);
        }
    };
    
    const handleConfirmSync = async () => {
        setIsConfirming(false);
        await handleProceedWithSync(currentWatchlist);
    }

    const authUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&response_type=token`;

    if (anilistProfile) {
        return (
            <div className="bg-brand-bg-light p-8 rounded-2xl shadow-2xl max-w-md mx-auto text-brand-text text-center">
                <img src={anilistProfile.avatar.large} alt={anilistProfile.name} className="w-24 h-24 rounded-full mb-4 shadow-lg mx-auto"/>
                <h2 className="text-3xl font-bold">Successfully Synced!</h2>
                <p className="text-brand-text-muted mt-2">
                    Your account is linked with AniList user: <strong className="text-white">{anilistProfile.name}</strong>.
                </p>
                <p className="text-brand-text-muted mt-1">
                    Your watchlist and stats are now available across the app.
                </p>
                 <button 
                    onClick={unlinkAnilist} 
                    className="mt-6 w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg-dark focus:ring-red-500 transition-colors"
                >
                    Unlink AniList Account
                </button>
            </div>
        )
    }

    return (
        <>
         <div className="bg-brand-bg-light p-8 rounded-2xl shadow-2xl max-w-md mx-auto text-brand-text">
            <div className="text-center">
                <SyncIcon className="w-16 h-16 mx-auto mb-4 text-brand-primary" />
                <h2 className="text-3xl font-bold mb-2">Sync with AniList</h2>
                <p className="text-brand-text-muted mb-6">Link your AniList account to manage your watchlist and view stats.</p>
            </div>
            
            <div className="text-left mb-6 border-b border-slate-700 pb-6">
                <h3 className="text-lg font-semibold mb-2">Step 1: Get Your Access Token</h3>
                <p className="text-xs text-brand-text-muted mb-2">First, you'll need to get a Client ID from AniList.</p>
                <ol className="list-decimal list-inside pl-2 space-y-2 text-xs text-brand-text-muted mb-4">
                    <li>Go to <a href="https://anilist.co/settings/developer" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">AniList Developer Settings</a> and click "Create New Client".</li>
                    <li>Enter a name (e.g., "Tracker").</li>
                    <li>For <strong>Redirect URL</strong>, enter: <code className="text-pink-400 text-[10px] bg-slate-900 px-1 py-0.5 rounded">https://anilist.co/api/v2/oauth/pin</code></li>
                    <li>Click "Save". You will now see your <strong>Client ID</strong>. Paste it below.</li>
                </ol>
                <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value.trim())}
                    placeholder="Paste your Client ID here"
                    className="w-full p-3 bg-brand-bg-dark border border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors"
                />
                <a 
                    href={authUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block w-full text-center mt-3 py-3 font-semibold rounded-lg transition-colors ${
                        clientId 
                        ? 'bg-brand-primary text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg-dark focus:ring-brand-primary' 
                        : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    }`}
                    onClick={(e) => !clientId && e.preventDefault()}
                    aria-disabled={!clientId}
                >
                    Authorize and Get Token
                </a>
            </div>

            <div className="text-left">
                <h3 className="text-lg font-semibold mb-2">Step 2: Link Account</h3>
                <p className="text-xs text-brand-text-muted mb-4">After authorizing, AniList will show you a page with an "access_token". Copy the entire token and paste it here to link your account.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Paste your AniList Access Token here"
                        className="w-full p-3 bg-brand-bg-dark border border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors h-32 resize-none"
                        disabled={isAuthLoading || isMerging}
                    />
                     <button type="submit" className="w-full py-3 bg-brand-secondary text-white font-semibold rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg-dark focus:ring-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isAuthLoading || isMerging || !token}>
                        {isAuthLoading ? 'Verifying...' : isMerging ? 'Merging Watchlist...' : 'Link Account'}
                     </button>
                </form>
            </div>

            {error && <p className="text-red-400 mt-4">{error}</p>}
        </div>

        {isConfirming && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
                <div className="bg-brand-bg-light rounded-lg shadow-xl max-w-sm w-full p-6 text-center">
                    <h2 id="confirm-dialog-title" className="text-xl font-bold text-white mb-2">Merge Watchlists?</h2>
                    <p className="text-brand-text-muted mb-6 text-sm">
                        You have items in your current watchlist. Syncing with AniList will merge your list with your AniList account.
                        This action will add any unique anime to your AniList profile and import your AniList entries here. This cannot be undone.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setIsConfirming(false)} className="px-6 py-2 rounded-md bg-slate-600 hover:bg-slate-700 text-white font-semibold transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleConfirmSync} className="px-6 py-2 rounded-md bg-brand-primary hover:bg-indigo-500 text-white font-semibold transition-colors">
                            Confirm & Sync
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};
