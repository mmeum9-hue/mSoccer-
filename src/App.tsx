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

function AppContent() {
  const { currentView, theme } = useApp();

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
