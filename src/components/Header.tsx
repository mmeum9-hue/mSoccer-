import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { Bell, Sun, Moon, Search, RotateCw, X, AlertCircle, Play, Pause, Zap, Menu, Calendar, User, Sliders, LogOut, ChevronRight, Globe } from 'lucide-react';
import logoImg from '../assets/images/logo-official.png';

export const Header: React.FC = () => {
  const {
    theme,
    setTheme,
    headerColor,
    setHeaderColor,
    language,
    setLanguage,
    notifications,
    markNotificationRead,
    clearNotifications,
    liveSimSpeed,
    setLiveSimSpeed,
    navigateTo,
    matches,
    clubs,
    players,
    championships,
    user,
    logoutUser,
    drawerOpen,
    setDrawerOpen
  } = useApp();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [secretClicks, setSecretClicks] = useState(0);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000); // 2 seconds simulated spin
  };

  // Perform multi-category search
  const filteredClubs = searchQuery
    ? clubs.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];
  const filteredPlayers = searchQuery
    ? players.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];
  const filteredLeagues = searchQuery
    ? championships.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];
  const filteredMatches = searchQuery
    ? matches.filter(
        (m) =>
          m.homeClubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.awayClubName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const colorConfig: { [key: string]: { bg: string; border: string; text: string; name: string; hex: string } } = {
    green: { bg: 'bg-[#3C8C21]', border: 'border-[#2d6e19]', text: 'text-[#3C8C21]', name: 'Verde', hex: '#3C8C21' },
    blue: { bg: 'bg-[#1E3A8A]', border: 'border-[#172554]', text: 'text-[#1E3A8A]', name: 'Azul', hex: '#1E3A8A' },
    red: { bg: 'bg-[#991B1B]', border: 'border-[#7F1D1D]', text: 'text-[#991B1B]', name: 'Vermelho', hex: '#991B1B' },
    purple: { bg: 'bg-[#5B21B6]', border: 'border-[#4C1D95]', text: 'text-[#5B21B6]', name: 'Roxo', hex: '#5B21B6' },
    orange: { bg: 'bg-[#C2410C]', border: 'border-[#9A3412]', text: 'text-[#C2410C]', name: 'Laranja', hex: '#C2410C' },
    black: { bg: 'bg-[#111827]', border: 'border-[#030712]', text: 'text-[#111827]', name: 'Preto', hex: '#111827' }
  };

  const activeColor = colorConfig[headerColor] || colorConfig.green;

  return (
    <header className={`sticky top-0 z-50 ${activeColor.bg} text-white shadow-md border-b ${activeColor.border}`}>
      <div className="w-full flex items-center justify-between h-13 px-2.5 sm:px-3">
        {/* Left: Burger Menu & BeSoccer-style Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Menu principal"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          
          <div 
            onClick={() => navigateTo({ type: 'jogos' })}
            className="flex items-center space-x-2.5 cursor-pointer select-none"
          >
            {/* Custom BeSoccer-style Icon: logo image instead of the generic soccer ball */}
            <img 
              src={logoImg} 
              alt="mSoccer" 
              className="w-9 h-9 object-contain shrink-0 rounded-xl shadow-sm" 
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-sans font-black text-base tracking-wider text-white leading-none">
                mSoccer
              </span>
              <span className="font-sans text-[8px] italic text-emerald-100 font-medium tracking-wide leading-none mt-0.5">
                Mambone futebol
              </span>
            </div>
          </div>
        </div>

        {/* Right: Creator Info, Calendar, Search & Notifications */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSecretClicks((prev) => {
                const next = prev + 1;
                if (next >= 5) {
                  navigateTo({ type: 'admin' });
                  return 0;
                }
                return next;
              });
              setShowCreatorModal(true);
            }}
            className="inline-block text-[9px] font-extrabold bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white whitespace-nowrap tracking-wide cursor-pointer transition-all border border-white/15 select-none"
            title="Informações do Criador"
          >
            by: djumã
          </button>

          {/* Calendar Icon - BeSoccer Style Date Picker */}
          <div className="relative">
            <input
              type="date"
              id="header-calendar-picker"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                const dateValue = e.target.value; // e.g. "2026-07-18"
                if (dateValue) {
                  navigateTo({ type: 'jogos' });
                  window.dispatchEvent(new CustomEvent('set-match-date', { detail: dateValue }));
                }
              }}
              title="Selecionar Data"
            />
            <button
              className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              aria-label="Calendário"
              title="Selecionar Data"
            >
              <Calendar className="w-5.5 h-5.5 text-white" />
            </button>
          </div>
          
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Pesquisar"
          >
            <Search className="w-5.5 h-5.5 text-white" />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <Bell className="w-5.5 h-5.5 text-white animate-pulse" />
              <span 
                className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border"
                style={{ borderColor: activeColor.hex }}
              >
                {unreadCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* SIDE DRAWER (MENU LATERAL) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          ></div>

          {/* Drawer Content */}
          <div className="relative flex flex-col w-80 max-w-[85vw] h-full bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-100 shadow-2xl animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className={`flex items-center justify-between p-4 ${activeColor.bg} text-white`}>
              <div className="flex items-center space-x-2">
                <img 
                  src={logoImg} 
                  alt="mSoccer" 
                  className="w-7 h-7 object-contain shrink-0 rounded-lg" 
                  referrerPolicy="no-referrer" 
                />
                <span className="font-bold tracking-wider text-sm">mSoccer Menu</span>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-full hover:bg-white/15 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* User Section */}
              {!user ? (
                <button
                  onClick={() => {
                    navigateTo({ type: 'profile' });
                    setDrawerOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#1E3A8A] text-white hover:bg-blue-800 transition-colors cursor-pointer font-bold text-sm shadow-md"
                >
                  <div className="flex items-center space-x-2.5">
                    <User className="w-5 h-5 text-white" />
                    <span>Entrar ou Cadastrar</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-200" />
                </button>
              ) : (
                <div
                  onClick={() => {
                    navigateTo({ type: 'profile' });
                    setDrawerOpen(false);
                  }}
                  role="button"
                  tabIndex={0}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-colors cursor-pointer text-left focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigateTo({ type: 'profile' });
                      setDrawerOpen(false);
                    }
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold truncate max-w-[130px]">{user.name}</p>
                      <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">{user.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </div>
                </div>
              )}

              {/* SIMULATOR SPEED CONTROLS */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Simulador de Jogos</span>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                  <button
                    onClick={() => setLiveSimSpeed('off')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      liveSimSpeed === 'off'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
                    }`}
                  >
                    Pausado
                  </button>
                  <button
                    onClick={() => setLiveSimSpeed('normal')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      liveSimSpeed === 'normal'
                        ? 'bg-[#1E3A8A] text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setLiveSimSpeed('fast')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-1 ${
                      liveSimSpeed === 'fast'
                        ? 'bg-amber-500 text-slate-900 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
                    }`}
                  >
                    <Zap className="w-3 h-3 animate-pulse" />
                    <span>Rápido</span>
                  </button>
                </div>
              </div>

              {/* LANGUAGE & THEME SELECTORS */}
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Preferências do App</span>
                
                {/* Language selection in menu */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400">
                    <Globe className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">{translations[language].idioma}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                    {[
                      { id: 'pt', label: 'Português', flag: '🇧🇷' },
                      { id: 'en', label: 'English', flag: '🇺🇸' },
                      { id: 'es', label: 'Español', flag: '🇪🇸' }
                    ].map((lang) => {
                      const isActive = language === lang.id;
                      return (
                        <button
                          key={lang.id}
                          onClick={() => setLanguage(lang.id as any)}
                          className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer select-none ${
                            isActive
                              ? 'bg-white dark:bg-[#1E293B] text-[#1E3A8A] dark:text-blue-400 shadow-sm border border-slate-200/30 dark:border-slate-700/30'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                          }`}
                        >
                          <span className="text-sm">{lang.flag}</span>
                          <span className="text-[11px] font-black uppercase">{lang.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Theme toggle in menu */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400">
                    {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-yellow-500" />}
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {translations[language].visualApp}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                    <button
                      onClick={() => setTheme('light')}
                      className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer select-none ${
                        theme === 'light'
                          ? 'bg-white dark:bg-[#1E293B] text-[#1E3A8A] dark:text-blue-400 shadow-sm border border-slate-200/30 dark:border-slate-700/30'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-yellow-500" />
                      <span className="text-[11px] font-black uppercase">{translations[language].claro}</span>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer select-none ${
                        theme === 'dark'
                          ? 'bg-white dark:bg-[#1E293B] text-[#1E3A8A] dark:text-blue-400 shadow-sm border border-slate-200/30 dark:border-slate-700/30'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-[#60A5FA]" />
                      <span className="text-[11px] font-black uppercase">{translations[language].escuro}</span>
                    </button>
                  </div>
                </div>

                {/* Header Color Picker */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400">
                    <Sliders className={`w-4 h-4 ${activeColor.text}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">Cor do Cabeçalho</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                    {Object.keys(colorConfig).map((colorKey) => {
                      const col = colorConfig[colorKey];
                      const isSelected = headerColor === colorKey;
                      return (
                        <button
                          key={colorKey}
                          onClick={() => setHeaderColor(colorKey)}
                          className={`py-1.5 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center justify-center cursor-pointer select-none border ${
                            isSelected
                              ? 'bg-white dark:bg-[#1E293B] text-slate-800 dark:text-white shadow-sm border-slate-200 dark:border-slate-700'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 border-transparent'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full ${col.bg} border border-white dark:border-slate-800 shadow-sm mb-1`} />
                          <span className="text-[9px] uppercase font-bold tracking-tight">{col.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* CREATOR INFO IN DRAWER */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowCreatorModal(true)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#1E3A8A]/5 dark:bg-blue-500/5 border border-blue-100/50 dark:border-blue-900/40 hover:bg-[#1E3A8A]/10 dark:hover:bg-blue-500/10 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-lg">👨‍💻</span>
                    <div>
                      <span className="text-[10px] text-[#1E3A8A] dark:text-blue-400 uppercase font-black tracking-wider block">Criador do App</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">criador: djumã</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
                </button>
              </div>

              {/* APP REFRESH */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Dados do App</span>
                <button
                  onClick={handleRefresh}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <RotateCw className={`w-4 h-4 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="text-xs font-semibold">Atualizar Resultados</span>
                  </div>
                  {refreshing && <span className="text-[10px] text-blue-600 uppercase font-bold">Girando...</span>}
                </button>
              </div>

              {/* NOTIFICATIONS CONTAINER */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Notificações Recentes</span>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-center text-zinc-400 text-[11px] py-4">Nenhum alerta recente.</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={`p-2.5 rounded-lg text-[11px] border transition-colors ${
                          !notif.read
                            ? 'bg-blue-50/50 border-blue-100'
                            : 'bg-slate-50/40 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800/40'
                        }`}
                      >
                        <div className="flex justify-between items-start font-bold mb-1">
                          <span className="truncate max-w-[180px] text-zinc-900 dark:text-zinc-100">
                            {notif.type === 'golo' && '⚽ '}
                            {notif.title}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-normal">{notif.timestamp}</span>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-tight">{notif.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-zinc-400">
              <span>mSoccer v5.1</span>
              {user && (
                <button
                  onClick={() => {
                    logoutUser();
                    setDrawerOpen(false);
                  }}
                  className="flex items-center space-x-1 text-rose-500 hover:underline cursor-pointer font-bold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SEARCH OVERLAY */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center space-x-2 flex-1">
                <Search className="w-5 h-5 text-zinc-400" />
                <input
                  id="search-input"
                  type="text"
                  placeholder={translations[language].buscarClubeJogador}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-zinc-900 dark:text-white focus:outline-none focus:ring-0 text-base"
                  autoFocus
                />
              </div>
              <button
                id="btn-search-close"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            {/* Search results */}
            <div className="max-h-96 overflow-y-auto p-4 space-y-4">
              {!searchQuery && (
                <p className="text-zinc-500 text-sm text-center py-8">
                  {language === 'pt'
                    ? 'Digite algo acima para iniciar sua busca instantânea.'
                    : language === 'en'
                    ? 'Type something above to start your instant search.'
                    : 'Escriba algo arriba para comenzar su búsqueda instantánea.'}
                </p>
              )}

              {searchQuery &&
                filteredClubs.length === 0 &&
                filteredPlayers.length === 0 &&
                filteredLeagues.length === 0 &&
                filteredMatches.length === 0 && (
                  <div className="text-center py-8 text-zinc-500">
                    {language === 'pt'
                      ? `Nenhum resultado encontrado para "${searchQuery}".`
                      : language === 'en'
                      ? `No results found for "${searchQuery}".`
                      : `No se encontraron resultados para "${searchQuery}".`}
                  </div>
                )}

              {filteredClubs.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    Clubes ({filteredClubs.length})
                  </h4>
                  <div className="space-y-2">
                    {filteredClubs.map((club) => (
                      <div
                        key={club.id}
                        onClick={() => {
                          navigateTo({ type: 'club', id: club.id });
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                      >
                        <img
                          src={club.logoUrl}
                          alt={club.name}
                          className="w-8 h-8 rounded-full bg-zinc-200 object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{club.name}</p>
                          <p className="text-xs text-zinc-500">{club.country}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredPlayers.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    Jogadores ({filteredPlayers.length})
                  </h4>
                  <div className="space-y-2">
                    {filteredPlayers.map((player) => (
                      <div
                        key={player.id}
                        onClick={() => {
                          navigateTo({ type: 'player', id: player.id });
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                      >
                        <img
                          src={player.photoUrl}
                          alt={player.name}
                          className="w-8 h-8 rounded-full object-cover bg-zinc-200"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{player.name}</p>
                          <p className="text-xs text-zinc-500">
                            {player.position} • {player.clubName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredLeagues.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    Campeonatos ({filteredLeagues.length})
                  </h4>
                  <div className="space-y-2">
                    {filteredLeagues.map((league) => (
                      <div
                        key={league.id}
                        onClick={() => {
                          navigateTo({ type: 'league', id: league.id });
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-black">
                          🏆
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{league.name}</p>
                          <p className="text-xs text-zinc-500">
                            {league.type} • Temporada {league.season}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredMatches.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    Partidas ({filteredMatches.length})
                  </h4>
                  <div className="space-y-2">
                    {filteredMatches.map((match) => (
                      <div
                        key={match.id}
                        onClick={() => {
                          navigateTo({ type: 'match', id: match.id });
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/20 transition-colors text-sm border border-zinc-100 dark:border-zinc-800"
                      >
                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                          <span>{match.championshipName}</span>
                          <span className="font-semibold text-emerald-500">{match.status}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {match.homeClubName} vs {match.awayClubName}
                          </span>
                          <span className="font-mono font-bold bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded text-xs text-zinc-900 dark:text-white">
                            {match.score.home} - {match.score.away}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATOR INFO MODAL */}
      {showCreatorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800/80 animate-in zoom-in-95 duration-200">
            {/* Header / Banner */}
            <div className="bg-[#1E3A8A] p-5 text-white relative">
              <button
                onClick={() => setShowCreatorModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 text-white cursor-pointer transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col items-center text-center mt-2">
                <div 
                  onClick={() => {
                    navigateTo({ type: 'admin' });
                    setShowCreatorModal(false);
                  }}
                  className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20 shadow-inner text-3xl mb-3 cursor-pointer hover:bg-white/20 hover:scale-105 transition-all"
                  title="Painel Admin Secreto"
                >
                  👨‍💻
                </div>
                <h3 className="font-sans font-black text-lg tracking-wider">mSoccer Criador</h3>
                <p className="text-xs text-blue-200 font-medium mt-0.5">Informações de Contato</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                  Nome do Criador
                </span>
                <p className="text-sm font-black text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 leading-relaxed">
                  Esmeraldo Francisco Chinhiquinhela
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                  Contacto
                </span>
                <a 
                  href="tel:871553529"
                  className="flex items-center space-x-2 text-sm font-black text-[#1E3A8A] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-950/40 p-3 rounded-xl border border-blue-100/50 dark:border-blue-900/30 transition-colors"
                >
                  <span>📞</span>
                  <span>871553529</span>
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
              <button
                onClick={() => setShowCreatorModal(false)}
                className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
