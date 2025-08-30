import React from 'react';
import { AppNotification } from '../types';
import { useAuth } from '../hooks/useAuth';
import { UserIcon } from './icons';

const timeSince = (date: any) => {
    if (!date?.seconds) return 'just now';
    const seconds = Math.floor((new Date().getTime() - date.seconds * 1000) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
};

export const Notifications: React.FC = () => {
    const { notifications } = useAuth();
    
    if (notifications.length === 0) {
        return (
            <div className="p-8 text-center text-brand-text-muted">
                You have no notifications.
            </div>
        );
    }
    
    return (
        <div className="flex flex-col">
            {notifications.map(notif => (
                <div key={notif.id} className={`p-4 border-b border-slate-700 flex items-start gap-3 transition-colors ${!notif.read ? 'bg-brand-secondary/10' : ''}`}>
                    <div className="flex-shrink-0 mt-1">
                       <UserIcon className="w-6 h-6 text-brand-accent" />
                    </div>
                    <div>
                        <p className="text-sm text-brand-text">{notif.message}</p>
                        <p className="text-xs text-brand-text-muted mt-1">{timeSince(notif.timestamp)}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
