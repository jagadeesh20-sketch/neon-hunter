import React, { useEffect, useState } from 'react';
import { PlayerState, Notification } from '../types';

interface HUDProps {
  playerState: PlayerState;
  notifications: Notification[];
}

export const HUD: React.FC<HUDProps> = ({ playerState, notifications }) => {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (notifications.length > 0) {
      // Add new notification
      const latest = notifications[notifications.length - 1];
      setVisibleNotifications(prev => [...prev, latest]);
      
      // Auto dismiss after 3s
      const timer = setTimeout(() => {
        setVisibleNotifications(prev => prev.filter(n => n.id !== latest.id));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notifications]);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        {/* Player Stats */}
        <div className="bg-slate-900/90 border border-cyan-500/50 p-2 rounded-lg flex items-center space-x-4 shadow-lg backdrop-blur">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Detective</span>
            <span className="text-cyan-400 font-bold">{playerState.username}</span>
          </div>
          <div className="h-8 w-px bg-slate-700"></div>
          <div className="flex items-center space-x-2">
            <span className="text-yellow-500 text-lg">⭐</span>
            <span className="text-white font-mono font-bold">{playerState.xp}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500 text-lg">💳</span>
            <span className="text-white font-mono font-bold">{playerState.currency}</span>
          </div>
        </div>
      </div>

      {/* Notifications Toast Area (Bottom Right) */}
      <div className="flex flex-col items-end space-y-2 mb-8">
        {visibleNotifications.map(note => (
          <div 
            key={note.id}
            className={`
              pointer-events-auto transform transition-all duration-300
              min-w-[250px] p-3 rounded-lg shadow-xl border-l-4 flex items-center bg-slate-900 text-white
              ${note.type === 'success' ? 'border-green-500' : 
                note.type === 'info' ? 'border-blue-500' : 'border-yellow-500'}
            `}
          >
            <div className="mr-3">
              {note.type === 'success' && '✅'}
              {note.type === 'info' && '📨'}
              {note.type === 'warning' && '⚠️'}
            </div>
            <p className="text-sm font-medium">{note.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
