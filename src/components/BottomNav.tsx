import React from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, ListOrdered, MessageCircle, BookOpen, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentView, navigateTo, notifications, headerColor } = useApp();

  const activeTab = currentView.type;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const colorConfig: { [key: string]: { text: string } } = {
    green: { text: 'text-[#3C8C21]' },
    blue: { text: 'text-[#1E3A8A]' },
    red: { text: 'text-[#991B1B]' },
    purple: { text: 'text-[#5B21B6]' },
    orange: { text: 'text-[#C2410C]' },
    black: { text: 'text-[#111827]' }
  };

  const activeColor = colorConfig[headerColor] || colorConfig.blue;

  const tabs = [
    { id: 'partidas', label: 'Partidas', icon: Trophy, view: 'jogos' },
    { id: 'tabela', label: 'Tabela', icon: ListOrdered, view: 'tabela' },
    { id: 'chat', label: 'Chat', icon: MessageCircle, view: 'chat' },
    { id: 'noticias', label: 'Notícias', icon: BookOpen, view: 'noticias' },
    { id: 'perfil', label: 'Perfil', icon: User, view: 'profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] px-1 py-1 pb-safe">
      <div className="w-full flex justify-around items-center h-13 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          
          // Determine if tab is active based on current view
          let isActive = false;
          if (tab.id === 'partidas') {
            isActive = activeTab === 'jogos' || activeTab === 'home' || activeTab === 'match';
          } else if (tab.id === 'tabela') {
            isActive = activeTab === 'tabela' || activeTab === 'tables' || activeTab === 'league' || activeTab === 'club' || activeTab === 'player';
          } else if (tab.id === 'chat') {
            isActive = activeTab === 'chat';
          } else if (tab.id === 'noticias') {
            isActive = activeTab === 'noticias' || activeTab === 'news';
          } else if (tab.id === 'perfil') {
            isActive = activeTab === 'profile' || activeTab === 'perfil' || activeTab === 'admin';
          }

          const handleTabClick = () => {
            if (tab.id === 'partidas') {
              navigateTo({ type: 'jogos' });
              // Turn off favorites filter when clicking Matches tab directly to see all matches as default
              window.dispatchEvent(new CustomEvent('set-show-only-favorites', { detail: false }));
            } else if (tab.id === 'tabela') {
              navigateTo({ type: 'tabela' });
            } else if (tab.id === 'chat') {
              navigateTo({ type: 'chat' });
            } else if (tab.id === 'noticias') {
              navigateTo({ type: 'noticias' });
            } else if (tab.id === 'perfil') {
              navigateTo({ type: 'profile' });
            }
          };

          return (
            <button
              id={`nav-tab-${tab.id}`}
              key={tab.id}
              onClick={handleTabClick}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-150 cursor-pointer ${
                isActive
                  ? `${activeColor.text} font-bold`
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon 
                  className={`w-[22px] h-[22px] mb-1.5 transition-transform ${
                    isActive 
                      ? 'scale-105 stroke-[2.3px]' 
                      : 'stroke-[1.7px]'
                  }`} 
                />
                {tab.id === 'chat' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight transition-all uppercase select-none ${
                isActive ? 'font-black tracking-wide' : 'font-medium'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
