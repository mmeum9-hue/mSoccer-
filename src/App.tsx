import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { LiveMatches } from './components/LiveMatches';
import { ChampionshipSection } from './components/ChampionshipSection';
import { NewsSection } from './components/NewsSection';
import { ProfileSection } from './components/ProfileSection';
import { AdminPanel } from './components/AdminPanel';
import { MatchDetails } from './components/MatchDetails';
import { ClubDetails } from './components/ClubDetails';
import { PlayerDetails } from './components/PlayerDetails';
import { LeagueDetails } from './components/LeagueDetails';
import { ChatSection } from './components/ChatSection';
import { NotificationsSection } from './components/NotificationsSection';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Trophy, BookOpen, Bell, X } from 'lucide-react';

function AppContent() {
  const { currentView, theme, toast, setToast, navigateTo } = useApp();

  // Auto-dismiss the floating toast after 4 seconds
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);

  const getToastIcon = (type: string) => {
    if (type.startsWith('💬') || type.includes('Chat') || type.includes('chat')) {
      return <MessageSquare className="w-5 h-5 text-[#1E3A8A] dark:text-blue-400 shrink-0" />;
    }
    switch (type) {
      case 'golo':
        return <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'noticia':
        return <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'sistema':
      default:
        return <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />;
    }
  };

  const handleToastClick = () => {
    if (!toast) return;
    if (toast.type.includes('Chat') || toast.title.includes('💬') || toast.title.includes('Chat')) {
      navigateTo({ type: 'chat' });
    } else {
      navigateTo({ type: 'notificacoes' });
    }
    setToast(null);
  };

  // Render the currently selected state view
  const renderCurrentView = () => {
    switch (currentView.type) {
      case 'home':
      case 'jogos':
        return <LiveMatches />;
      case 'tables':
      case 'tabela':
        return <ChampionshipSection />;
      case 'news':
      case 'noticias':
        return <NewsSection />;
      case 'profile':
      case 'perfil':
        return <ProfileSection />;
      case 'chat':
        return <ChatSection />;
      case 'notificacoes':
        return <NotificationsSection />;
      case 'admin':
        return <AdminPanel />;
      case 'match':
        return <MatchDetails matchId={currentView.id!} />;
      case 'club':
        return <ClubDetails clubId={currentView.id!} />;
      case 'player':
        return <PlayerDetails playerId={currentView.id!} />;
      case 'league':
        return <LeagueDetails leagueId={currentView.id!} />;
      default:
        return <LiveMatches />;
    }
  };

  const isAdminView = currentView.type === 'admin';

  return (
    <div className={`min-h-screen flex flex-col ${isAdminView ? 'bg-[#0b0f19]' : 'bg-slate-50'} text-slate-900`}>
      {/* Universal Top Header */}
      {!isAdminView && <Header />}

      {/* Content Container */}
      <main className={`flex-grow ${isAdminView ? 'pb-0' : 'pb-12'}`}>
        {renderCurrentView()}
      </main>

      {/* Interactive Bottom Nav */}
      {!isAdminView && <BottomNav />}

      {/* Interactive Visual Floating Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            onClick={handleToastClick}
            className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 flex items-start space-x-3 cursor-pointer hover:shadow-2xl transition-all select-none"
          >
            <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800/60 shrink-0">
              {getToastIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <h4 className="text-[11px] font-black text-slate-800 dark:text-white truncate uppercase tracking-wider">
                {toast.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                {toast.body}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setToast(null);
              }}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
