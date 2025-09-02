import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, WatchlistItem } from '../types';

/**
 * Fetches a user's profile by their exact display name (case-insensitive).
 * @param displayName The display name to search for.
 * @returns The user profile object or null if not found.
 */
export const getUserProfileByDisplayName = async (displayName: string): Promise<UserProfile | null> => {
    const usersRef = collection(db, 'users');
    // Query using the pre-sanitized lowercase field for efficient, case-insensitive matching.
    const q = query(usersRef, where('displayName_lowercase', '==', displayName.toLowerCase()), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    
    return querySnapshot.docs[0].data() as UserProfile;
};

/**
 * Fetches the entire public watchlist for a given user UID.
 * @param uid The UID of the user whose watchlist is to be fetched.
 * @returns An array of WatchlistItem objects.
 */
export const getWatchlistForUser = async (uid: string): Promise<WatchlistItem[]> => {
    const watchlistRef = collection(db, 'users', uid, 'watchlist');
    const querySnapshot = await getDocs(watchlistRef);
    return querySnapshot.docs.map(doc => doc.data() as WatchlistItem);
};
