import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, BellOff, CheckCircle, Trash2, Calendar, Newspaper, Award, AlertCircle } from 'lucide-react';

export const NotificationsSection: React.FC = () => {
  const { notifications, markNotificationRead, clearNotifications } = useApp();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.read;
    return true;
  });

  const markAllAsRead = () => {
    notifications.forEach((notif) => {
      if (!notif.read) {
        markNotificationRead(notif.id);
      }
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'golo':
        return (
          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-sm font-semibold select-none">
            ⚽
          </div>
        );
      case 'noticia':
        return (
          <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 select-none">
            <Newspaper className="w-4.5 h-4.5" />
          </div>
        );
      case 'jogo':
        return (
          <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 select-none">
            <Calendar className="w-4.5 h-4.5" />
          </div>
        );
      case 'sistema':
      default:
        return (
          <div className="w-9 h-9 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center shrink-0 select-none">
            <AlertCircle className="w-4.5 h-4.5" />
          </div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto min-h-[calc(100vh-8.5rem)] flex flex-col bg-slate-50 pb-12">
      
      {/* Header bar matching BeSoccer style blue header */}
      <div className="bg-[#1E3A8A] text-white p-4 shadow-sm shrink-0 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Bell className="w-5 h-5" />
          <h1 className="text-base font-black uppercase tracking-wider">Notificações</h1>
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={markAllAsRead}
              className="p-1.5 hover:bg-white/10 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer select-none"
              title="Marcar todas como lidas"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button
              onClick={clearNotifications}
              className="p-1.5 hover:bg-white/10 rounded-lg text-xs font-semibold flex items-center gap-1 text-rose-200 hover:text-rose-100 transition-colors cursor-pointer select-none"
              title="Limpar todas as notificações"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-[#1E293B] border-b border-slate-100 dark:border-slate-800/80 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[#1E3A8A] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todas ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filter === 'unread'
                ? 'bg-[#1E3A8A] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Não lidas ({notifications.filter(n => !n.read).length})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 p-3.5 space-y-2.5 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <BellOff className="w-12 h-12 mb-2 stroke-1 opacity-50 text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Nenhuma notificação encontrada.</p>
            <p className="text-[10px] text-slate-400">Notificações de golos ao vivo e sistema aparecerão aqui.</p>
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              className={`flex items-start p-3.5 rounded-xl border transition-all cursor-pointer shadow-sm relative overflow-hidden ${
                notif.read
                  ? 'bg-white dark:bg-[#1E293B] border-slate-100 dark:border-slate-800/50 opacity-75'
                  : 'bg-white dark:bg-[#1E293B] border-[#1E3A8A]/30 hover:border-[#1E3A8A]/50'
              }`}
            >
              {/* Unread dot indicator */}
              {!notif.read && (
                <div className="absolute top-0 left-0 w-1 h-full bg-[#1E3A8A]" />
              )}

              {/* Notification Category Icon */}
              <div className="mr-3 shrink-0">
                {getIcon(notif.type)}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs font-bold leading-tight ${notif.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white font-black'}`}>
                    {notif.type === 'golo' && '⚽ '}
                    {notif.title}
                  </h3>
                  <span className="text-[9px] text-slate-400 shrink-0 ml-2 font-medium">{notif.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  {notif.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
