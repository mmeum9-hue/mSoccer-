import React from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Heart, MessageCircleMore, ListOrdered, BookOpen, BellRing, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentView, navigateTo, notifications } = useApp();

  const activeTab = currentView.type;
  const unreadCount = notifications.filter((n) => !n.read).length;

  // We map the mSoccer-like tabs to our existing App views including Perfil
  const tabs = [
    { type: 'jogos', label: 'Partidas', icon: Trophy },
    { type: 'tabela', label: 'Tabela', icon: ListOrdered },
    { type: 'chat', label: 'Chat', icon: MessageCircleMore },
    { type: 'noticias', label: 'Notícias', icon: BookOpen },
    { type: 'profile', label: 'Perfil', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-2 py-1 pb-safe">
      <div className="max-w-6xl mx-auto flex justify-around items-center h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          
          // Determine if tab is active
          let isActive = false;
          if (tab.type === 'jogos' && activeTab === 'jogos') {
            isActive = true;
          } else if (tab.type === 'tabela' && (activeTab === 'tabela' || activeTab === 'tables' || activeTab === 'league')) {
            isActive = true;
          } else if (tab.type === 'noticias' && activeTab === 'noticias') {
            isActive = true;
          } else if (tab.type === 'chat' && activeTab === 'chat') {
            isActive = true;
          } else if (tab.type === 'profile' && (activeTab === 'profile' || activeTab === 'perfil')) {
            isActive = true;
          }

          const handleTabClick = () => {
            navigateTo({ type: tab.type as any });
          };

          return (
            <button
              id={`nav-tab-${tab.type}`}
              key={tab.type}
              onClick={handleTabClick}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors duration-200 cursor-pointer ${
                isActive
                  ? 'text-[#1E3A8A] font-bold'
                  : 'text-slate-500 hover:text-[#2563EB]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5.5 h-5.5 mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.type === 'notificacoes' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight select-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
