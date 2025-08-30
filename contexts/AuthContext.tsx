import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User as FirebaseUser, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc, writeBatch, onSnapshot, Unsubscribe, collectionGroup, orderBy, serverTimestamp } from 'firebase/firestore';
import { User as AnilistUser, UserProfile, Friend, FriendRequest, AppNotification, NotificationType } from '../types';
import { getViewerProfile } from '../services/anilistService';
import { auth, db } from '../services/firebase';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  anilistProfile: AnilistUser | null;
  friends: Friend[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  notifications: AppNotification[];
  isLoading: boolean;
  error: string | null;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  linkAnilist: (token: string) => Promise<AnilistUser | null>;
  unlinkAnilist: () => Promise<void>;
  searchUsers: (query: string) => Promise<UserProfile[]>;
  sendFriendRequest: (toUser: UserProfile) => Promise<void>;
  respondToFriendRequest: (request: FriendRequest, accept: boolean) => Promise<void>;
  cancelFriendRequest: (request: FriendRequest) => Promise<void>;
  removeFriend: (friend: Friend) => Promise<void>;
  markNotificationsAsRead: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [anilistProfile, setAnilistProfile] = useState<AnilistUser | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const verifyAnilistToken = useCallback(async (token: string, user: FirebaseUser) => {
    try {
      const viewer = await getViewerProfile(token);
      setAnilistProfile(viewer);
      return viewer;
    } catch (err) {
      console.error('AniList token verification failed', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to link AniList account: ${errorMessage}`);
      setAnilistProfile(null);
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { anilistToken: null });
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setIsLoading(true);
        if (user) {
            setCurrentUser(user);
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if(userSnap.exists()) {
                const profileData = userSnap.data() as UserProfile;
                setUserProfile(profileData);
                if (profileData.anilistToken) {
                    await verifyAnilistToken(profileData.anilistToken, user);
                }
            } else {
                 // This might happen if Firestore doc creation fails after registration
                 const profile: UserProfile = { uid: user.uid, displayName: user.displayName || "User", displayName_lowercase: (user.displayName || "User").toLowerCase(), email: user.email };
                 await setDoc(userRef, profile);
                 setUserProfile(profile);
            }
        } else {
            setCurrentUser(null);
            setUserProfile(null);
            setAnilistProfile(null);
            setFriends([]);
            setIncomingRequests([]);
            setOutgoingRequests([]);
            setNotifications([]);
        }
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [verifyAnilistToken]);
  
  useEffect(() => {
    if (!userProfile) return;

    const friendsRef = collection(db, 'users', userProfile.uid, 'friends');
    const friendsUnsub = onSnapshot(friendsRef, (snapshot) => {
        const friendsList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Friend));
        setFriends(friendsList);
    });
    
    const incomingReqRef = collection(db, 'friendRequests');
    const incomingQuery = query(incomingReqRef, where('toUid', '==', userProfile.uid));
    const incomingUnsub = onSnapshot(incomingQuery, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
        setIncomingRequests(requests);
    });

    const outgoingReqRef = collection(db, 'friendRequests');
    const outgoingQuery = query(outgoingReqRef, where('fromUid', '==', userProfile.uid));
    const outgoingUnsub = onSnapshot(outgoingQuery, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
        setOutgoingRequests(requests);
    });

    const notifsRef = collection(db, 'users', userProfile.uid, 'notifications');
    const notifsQuery = query(notifsRef, orderBy('timestamp', 'desc'));
    const notifsUnsub = onSnapshot(notifsQuery, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
        setNotifications(notifs);
    });

    return () => {
        friendsUnsub();
        incomingUnsub();
        outgoingUnsub();
        notifsUnsub();
    }
  }, [userProfile]);

  const register = async (displayName: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName });
      
      const newUserProfile: UserProfile = {
          uid: user.uid,
          displayName,
          displayName_lowercase: displayName.toLowerCase(),
          email: user.email,
          anilistToken: null,
      };
      await setDoc(doc(db, "users", user.uid), newUserProfile);

      setUserProfile(newUserProfile); // Immediately set profile
      setCurrentUser(user); // onAuthStateChanged will also fire
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged handles setting user and profile state
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(errorMessage);
        throw err;
    } finally {
        setIsLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const linkAnilist = async (token: string): Promise<AnilistUser | null> => {
    if (!currentUser) return null;
    setIsLoading(true);
    const profile = await verifyAnilistToken(token, currentUser);
    if (profile) {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { anilistToken: token });
      setUserProfile(prev => prev ? { ...prev, anilistToken: token } : null);
    }
    setIsLoading(false);
    return profile;
  };

  const unlinkAnilist = async () => {
    if (!currentUser) return;
    setAnilistProfile(null);
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, { anilistToken: null });
    setUserProfile(prev => prev ? { ...prev, anilistToken: null } : null);
  };

  const searchUsers = async (searchQuery: string): Promise<UserProfile[]> => {
    if (!userProfile || !searchQuery.trim()) return [];
    const lowerCaseQuery = searchQuery.toLowerCase();

    // Fetch all users and filter client-side.
    // This is more robust against missing indexes or inconsistent data
    // but less scalable. For this app's scale, it's a reliable solution.
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);

    const users = querySnapshot.docs
        .map(doc => doc.data() as UserProfile)
        .filter(user => {
            if (user.uid === userProfile.uid) {
                return false; // Exclude self
            }
            // Use the lowercase field if it exists, otherwise compute it.
            const nameToTest = user.displayName_lowercase || user.displayName.toLowerCase();
            return nameToTest.startsWith(lowerCaseQuery);
        });
        
    return users;
  };

  const sendFriendRequest = async (toUser: UserProfile) => {
      if (!userProfile) throw new Error("You must be logged in.");
      
      const newRequest = {
          fromUid: userProfile.uid,
          fromName: userProfile.displayName,
          toUid: toUser.uid,
          toName: toUser.displayName,
      };
      await addDoc(collection(db, 'friendRequests'), newRequest);
      
      const notificationRef = collection(db, 'users', toUser.uid, 'notifications');
      await addDoc(notificationRef, {
        uid: toUser.uid,
        type: NotificationType.FriendRequest,
        message: `${userProfile.displayName} sent you a friend request.`,
        fromUid: userProfile.uid,
        fromName: userProfile.displayName,
        timestamp: serverTimestamp(),
        read: false,
      });
  };
  
  const respondToFriendRequest = async (request: FriendRequest, accept: boolean) => {
      if (!userProfile) throw new Error("You must be logged in.");

      await deleteDoc(doc(db, 'friendRequests', request.id));

      if (accept) {
          const batch = writeBatch(db);
          const currentUserFriendRef = doc(db, `users/${userProfile.uid}/friends`, request.fromUid);
          batch.set(currentUserFriendRef, { displayName: request.fromName });

          const otherUserFriendRef = doc(db, `users/${request.fromUid}/friends`, userProfile.uid);
          batch.set(otherUserFriendRef, { displayName: userProfile.displayName });
          
          await batch.commit();
          
          const notificationRef = collection(db, 'users', request.fromUid, 'notifications');
          await addDoc(notificationRef, {
            uid: request.fromUid,
            type: NotificationType.FriendAccept,
            message: `${userProfile.displayName} accepted your friend request.`,
            fromUid: userProfile.uid,
            fromName: userProfile.displayName,
            timestamp: serverTimestamp(),
            read: false,
          });
      }
  };

  const cancelFriendRequest = async (request: FriendRequest) => {
    await deleteDoc(doc(db, 'friendRequests', request.id));
  };
  
  const removeFriend = async (friend: Friend) => {
      if (!userProfile) throw new Error("You must be logged in.");

      const batch = writeBatch(db);
      const currentUserFriendRef = doc(db, `users/${userProfile.uid}/friends`, friend.uid);
      batch.delete(currentUserFriendRef);

      const otherUserFriendRef = doc(db, `users/${friend.uid}/friends`, userProfile.uid);
      batch.delete(otherUserFriendRef);
      
      await batch.commit();
  };
  
  const markNotificationsAsRead = async () => {
    if (!userProfile) return;
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(db);
    unreadNotifications.forEach(notif => {
        const notifRef = doc(db, 'users', userProfile.uid, 'notifications', notif.id);
        batch.update(notifRef, { read: true });
    });
    await batch.commit();
  };


  const value = { currentUser, userProfile, anilistProfile, friends, incomingRequests, outgoingRequests, notifications, isLoading, error, register, login, logout, linkAnilist, unlinkAnilist, searchUsers, sendFriendRequest, respondToFriendRequest, cancelFriendRequest, removeFriend, markNotificationsAsRead };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};