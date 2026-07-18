import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, Star, Search, Trophy, Award, Calendar, 
  Activity, Globe, DollarSign, Clock, AlertCircle, 
  ChevronRight, User, X, Check
} from 'lucide-react';
import { Player } from '../types';

interface PlayerDetailsProps {
  playerId: string;
}

const CANTOLO_PLAYER: Player = {
  id: 'cantolo',
  name: 'Ângelo Tomás Cantolo',
  photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&q=80',
  age: 23,
  nationality: 'Moçambique',
  clubId: 'black_bulls',
  clubName: 'Black Bulls Maputo',
  number: 11,
  position: 'Atacante',
  marketValue: '23 K.€',
  height: '1.80 m',
  stats: {
    matches: 1,
    goals: 1,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    minutesPlayed: 90
  },
  history: [
    { season: '2025/26', club: 'Black Bulls Maputo', matches: 1, goals: 1 },
    { season: '2024/25', club: 'Black Bulls Maputo', matches: 12, goals: 4 }
  ]
};

export const PlayerDetails: React.FC<PlayerDetailsProps> = ({ playerId }) => {
  const { players, clubs, championships, matches, favorites, toggleFavorite, navigateBack, navigateTo } = useApp();

  const [activeTab, setActiveTab] = useState<'info' | 'matches' | 'career' | 'injuries'>('info');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find player
  const foundPlayer = players.find((p) => p.id === playerId) || 
                       players.find((p) => p.name.toLowerCase().includes('cantolo')) ||
                       (playerId === 'cantolo' ? CANTOLO_PLAYER : null);

  const player = foundPlayer || (players.length > 0 ? players[0] : CANTOLO_PLAYER);

  const isFav = favorites.players.includes(player.id);

  // Country Code mapping for flagCDN
  const getCountryCode = (country: string) => {
    const map: { [key: string]: string } = {
      'Brasil': 'br',
      'Uruguai': 'uy',
      'Argentina': 'ar',
      'Portugal': 'pt',
      'Espanha': 'es',
      'Moçambique': 'mz',
      'Angola': 'ao',
      'Cabo Verde': 'cv',
      'França': 'fr',
      'Inglaterra': 'gb',
      'Itália': 'it',
      'Alemanha': 'de',
    };
    return map[country] || 'mz';
  };

  const getCountryFlagEmoji = (country: string) => {
    const map: { [key: string]: string } = {
      'Brasil': '🇧🇷',
      'Uruguai': '🇺🇾',
      'Argentina': '🇦🇷',
      'Portugal': '🇵🇹',
      'Espanha': '🇪🇸',
      'Moçambique': '🇲🇿',
      'Angola': '🇦🇴',
      'Cabo Verde': '🇨🇻',
      'França': '🇫🇷',
      'Inglaterra': '🇬🇧',
      'Itália': '🇮🇹',
      'Alemanha': '🇩🇪',
    };
    return map[country] || '🇲🇿';
  };

  const getPositionAbbreviation = (pos: string) => {
    if (pos === 'Goleiro') return 'GR';
    if (pos === 'Defensor') return 'DF';
    if (pos === 'Meio-campista') return 'MC';
    if (pos === 'Atacante') return 'AV';
    return 'PL';
  };

  const getContinentAndRegion = (country: string) => {
    if (country === 'Brasil' || country === 'Uruguai' || country === 'Argentina') {
      return { continent: 'América do Sul', region: 'América Latina' };
    }
    if (country === 'Moçambique') {
      return { continent: 'África', region: 'África Oriental' };
    }
    if (country === 'Angola') {
      return { continent: 'África', region: 'África Central' };
    }
    return { continent: 'Europa', region: 'Europa Ocidental' };
  };

  const getAbbreviatedName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return fullName;
    const firstInitial = parts[0].charAt(0).toUpperCase() + '.';
    const lastName = parts[parts.length - 1];
    return `${firstInitial} ${lastName}`;
  };

  const getBirthDateText = (age: number) => {
    const birthYear = 2026 - age;
    return `Nascido em 23 de Maio de ${birthYear}`;
  };

  // Find club and championship
  const club = clubs.find((c) => c.id === player.clubId);
  const championship = championships.find((c) => 
    c.standings.some((s) => s.clubId === player.clubId)
  );

  const leagueName = championship ? championship.name : 'Moçambola';
  const flagCode = getCountryCode(player.nationality);
  const flagEmoji = getCountryFlagEmoji(player.nationality);
  const abbrevName = getAbbreviatedName(player.name);

  // Filter matches involving the player's club
  const clubMatches = matches.filter(
    (m) => m.homeClubId === player.clubId || m.awayClubId === player.clubId
  ).slice(0, 5);

  // Search filter
  const filteredPlayers = searchQuery.trim() === '' 
    ? [] 
    : players.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-md mx-auto w-full h-[calc(100vh-80px)] flex flex-col bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-3xl overflow-hidden shadow-2xl relative my-2">
      
      {/* 1. GREEN HEADER (VIBRANT SPORTS SOCCER BACKGROUND) */}
      <div className="bg-[#3C8C21] text-white pt-3 pb-2.5 px-4 relative flex flex-col shrink-0">
        
        {/* Top Navbar */}
        <div className="flex items-center justify-between h-9 mb-2.5">
          <button 
            onClick={navigateBack}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            id="player-back-btn"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <span className="text-[15px] font-black tracking-tight text-white uppercase">
            {abbrevName}
          </span>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => toggleFavorite('players', player.id)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              id="player-fav-btn"
            >
              <Star className={`w-5 h-5 ${isFav ? 'fill-yellow-300 text-yellow-300' : 'text-white'}`} />
            </button>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              id="player-search-btn"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Player Banner Info Grid */}
        <div className="grid grid-cols-12 gap-1 items-center pb-1">
          
          {/* Left: Club & League badge (Clickable to navigate to club profile) */}
          <div 
            onClick={() => navigateTo({ type: 'club', id: player.clubId })}
            className="col-span-4 flex flex-col items-start space-y-1 cursor-pointer hover:opacity-90 active:scale-95 transition-all"
            title={`Ver perfil do ${player.clubName}`}
          >
            <p className="text-[11px] font-black leading-tight text-white/95 max-w-[110px] break-words uppercase">
              {player.clubName}
            </p>
            <p className="text-[10px] font-extrabold text-yellow-300 uppercase tracking-wide">
              {leagueName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {club?.logoUrl ? (
                <img 
                  src={club.logoUrl} 
                  alt={player.clubName} 
                  className="w-8 h-8 rounded-full object-cover bg-white/15 p-0.5 border border-white/20 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 border border-white/20 flex items-center justify-center text-xs shadow-sm font-bold">
                  {player.clubId === 'black_bulls' ? '🐃' : player.clubName.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Center: Circular Player Photo (80px) */}
          <div className="col-span-4 flex justify-center relative">
            <div className="relative">
              <img 
                src={player.photoUrl} 
                alt={player.name} 
                className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-lg bg-zinc-200"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full border border-white bg-slate-900 shadow-md flex items-center justify-center overflow-hidden">
                <img 
                  src={`https://flagcdn.com/w40/${flagCode}.png`} 
                  alt={player.nationality} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if flag CDN fails
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="text-[10px] leading-none absolute">{flagEmoji}</span>
              </div>
            </div>
          </div>

          {/* Right: Key Stats Stack */}
          <div className="col-span-4 flex flex-col items-end space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center font-black text-white text-[15px] shadow-inner font-mono">
                {player.number}
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[11px] font-mono font-bold tracking-tight text-white bg-white/15 px-1.5 py-0.5 rounded border border-white/15">
                  {player.marketValue}
                </span>
                <span className="text-[10px] font-bold text-white/90">
                  {player.age} Anos
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="bg-zinc-950 text-white font-mono font-black text-[9px] px-2 py-0.5 rounded tracking-wider border border-zinc-800">
                {player.number}
              </span>
              <span className="bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded tracking-wider border border-red-700">
                {getPositionAbbreviation(player.position)}
              </span>
            </div>
          </div>

        </div>

        {/* 2. COMPACT TABS */}
        <div className="flex justify-between border-t border-white/20 mt-2.5 pt-2">
          {[
            { id: 'info', label: 'Informação' },
            { id: 'matches', label: 'Partidas' },
            { id: 'career', label: 'Carreira' },
            { id: 'injuries', label: 'Lesões' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-[10px] font-extrabold uppercase tracking-wider pb-1 transition-all cursor-pointer relative ${
                  isActive ? 'text-white' : 'text-white/60 hover:text-white/90'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full animate-fade-in" />
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* 3. SCROLL-FREE CONTENT CONTAINER */}
      <div className="flex-1 p-2.5 flex flex-col justify-between overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-zinc-100 gap-2">
        
        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div className="flex-1 flex flex-col justify-between gap-2.5 animate-fade-in h-full">
            
            {/* A. ÉPOCA CARD */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm space-y-1.5 shrink-0">
              <div className="flex justify-between items-center px-0.5">
                <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                  Época 2025/26
                </span>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                  Partidas oficiais
                </span>
              </div>

              {/* Stats Bento Grid */}
              <div className="grid grid-cols-5 gap-1.5 text-center">
                
                {/* Partidas */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800/30 flex flex-col items-center justify-center">
                  <div className="w-5 h-5 flex items-center justify-center text-zinc-500 mb-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-mono font-black text-[18px] text-slate-850 dark:text-white tracking-tight">
                    {player.stats.matches}
                  </span>
                  <span className="text-[8px] text-zinc-400 font-extrabold uppercase">
                    Partidas
                  </span>
                </div>

                {/* Minutos */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800/30 flex flex-col items-center justify-center">
                  <div className="w-5 h-5 flex items-center justify-center text-zinc-500 mb-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-mono font-black text-[18px] text-slate-850 dark:text-white tracking-tight">
                    {player.stats.minutesPlayed}
                  </span>
                  <span className="text-[8px] text-zinc-400 font-extrabold uppercase">
                    Minutos
                  </span>
                </div>

                {/* Gols */}
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-1.5 rounded-xl border border-emerald-100/30 flex flex-col items-center justify-center">
                  <div className="w-5 h-5 flex items-center justify-center text-emerald-500 mb-0.5 bg-emerald-100 dark:bg-emerald-950/35 rounded-full">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-mono font-black text-[18px] text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {player.stats.goals}
                  </span>
                  <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">
                    Gols
                  </span>
                </div>

                {/* Assistências */}
                <div className="bg-blue-50/50 dark:bg-blue-950/20 p-1.5 rounded-xl border border-blue-100/30 flex flex-col items-center justify-center">
                  <div className="w-5 h-5 flex items-center justify-center text-blue-500 mb-0.5 bg-blue-100 dark:bg-blue-950/35 rounded-full">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-mono font-black text-[18px] text-blue-600 dark:text-blue-400 tracking-tight">
                    {player.stats.assists}
                  </span>
                  <span className="text-[8px] text-blue-600 dark:text-blue-400 font-extrabold uppercase">
                    Assists
                  </span>
                </div>

                {/* Cartões */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800/30 flex flex-col items-center justify-center">
                  <div className="w-5 h-5 flex items-center justify-center text-zinc-500 mb-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full gap-0.5">
                    <span className="w-1.5 h-2.5 bg-yellow-400 rounded-xs inline-block" />
                    <span className="w-1.5 h-2.5 bg-red-500 rounded-xs inline-block" />
                  </div>
                  <span className="font-mono font-black text-[16px] text-slate-850 dark:text-white tracking-tight">
                    <span className="text-yellow-500">{player.stats.yellowCards}</span>
                    <span className="text-zinc-400 mx-0.5">/</span>
                    <span className="text-red-500">{player.stats.redCards}</span>
                  </span>
                  <span className="text-[8px] text-zinc-400 font-extrabold uppercase">
                    Cartões
                  </span>
                </div>

              </div>
            </div>

            {/* B. FICHA DO JOGADOR CARD */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-3 shadow-sm flex-1 flex flex-col justify-between overflow-hidden gap-2">
              
              <div className="text-center space-y-0.5 shrink-0">
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {player.name}
                </h3>
                <p className="text-[11px] text-zinc-400 font-semibold uppercase font-mono">
                  {abbrevName}
                </p>
              </div>

              {/* 4 Metrics Row */}
              <div className="grid grid-cols-4 gap-1 border-y border-slate-100 dark:border-slate-800/80 py-1.5 shrink-0 text-center items-center">
                <div className="space-y-0.5">
                  <p className="font-mono font-black text-[14px] text-slate-800 dark:text-white">
                    {player.age}
                  </p>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">Anos</p>
                </div>
                <div className="space-y-0.5 border-l border-slate-100 dark:border-slate-800/80">
                  <p className="font-mono font-black text-[14px] text-slate-800 dark:text-white">
                    74 kg
                  </p>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">Peso</p>
                </div>
                <div className="space-y-0.5 border-l border-slate-100 dark:border-slate-800/80">
                  <p className="font-mono font-black text-[14px] text-slate-800 dark:text-white">
                    {player.height || '1.80 m'}
                  </p>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">Altura</p>
                </div>
                <div className="space-y-0.5 border-l border-slate-100 dark:border-slate-800/80">
                  <p className="font-mono font-black text-[13px] text-emerald-500">
                    {player.marketValue}
                  </p>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">Valor</p>
                </div>
              </div>

              {/* Badges and birth date row */}
              <div className="flex items-center justify-center gap-3 py-1 shrink-0 bg-slate-50/60 dark:bg-slate-800/20 rounded-xl border border-slate-100/50 dark:border-slate-800/30">
                <span className="w-7 h-7 bg-red-500 rounded-full text-white font-black text-[10px] flex items-center justify-center shadow-sm">
                  {getPositionAbbreviation(player.position)}
                </span>
                <span className="text-[14px]">{flagEmoji}</span>
                <span className="w-7 h-7 bg-zinc-950 dark:bg-zinc-800 text-white font-mono font-black text-[10px] flex items-center justify-center rounded-full shadow-sm">
                  {player.number}
                </span>
                <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wide font-mono pl-1 border-l border-slate-200 dark:border-slate-700">
                  {getBirthDateText(player.age)}
                </span>
              </div>

              {/* INFORMAÇÃO PESSOAL */}
              <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 py-1 px-2.5 rounded-lg shrink-0 justify-center uppercase tracking-wider">
                  Informação Pessoal
                </div>
                
                <div className="space-y-1 text-[11px] px-1">
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-50 dark:border-slate-800/40">
                    <span className="text-zinc-400 font-bold">País de Nascimento</span>
                    <span className="font-extrabold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                      {flagEmoji} {player.nationality}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-50 dark:border-slate-800/40">
                    <span className="text-zinc-400 font-bold">Continente</span>
                    <span className="font-extrabold text-slate-800 dark:text-zinc-200">
                      {getContinentAndRegion(player.nationality).continent}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-zinc-400 font-bold">Região</span>
                    <span className="font-extrabold text-slate-800 dark:text-zinc-200">
                      {getContinentAndRegion(player.nationality).region}
                    </span>
                  </div>
                </div>
              </div>

              {/* INFORMAÇÃO DA CARREIRA */}
              <div className="space-y-1.5 shrink-0">
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 py-1 px-2.5 rounded-lg shrink-0 justify-center uppercase tracking-wider">
                  Informação da Carreira
                </div>
                
                <div className="space-y-1 text-[11px] px-1">
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-50 dark:border-slate-800/40">
                    <span className="text-zinc-400 font-bold">Equipa Atual</span>
                    <span className="font-extrabold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                      {club?.logoUrl ? (
                        <img src={club.logoUrl} alt="" className="w-4.5 h-4.5 rounded-full object-cover" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white">
                          {player.clubId === 'black_bulls' ? '🐃' : '⚽'}
                        </span>
                      )}
                      {player.clubName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-zinc-400 font-bold">Competição</span>
                    <span className="font-extrabold text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                      🏆 {leagueName}
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* PARTIDAS TAB */}
        {activeTab === 'matches' && (
          <div className="flex-1 flex flex-col gap-2.5 animate-fade-in h-full overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-[12px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                  Próximas Partidas / Resultados
                </span>
                <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase">
                  {player.clubName}
                </span>
              </div>

              {clubMatches.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Calendar className="w-8 h-8 text-zinc-400 mx-auto" />
                  <p className="text-xs text-zinc-500 font-semibold">Nenhuma partida programada para este clube.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clubMatches.map((m) => {
                    const isHome = m.homeClubId === player.clubId;
                    return (
                      <div 
                        key={m.id} 
                        onClick={() => navigateTo({ type: 'match', id: m.id })}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/40 rounded-xl flex items-center justify-between text-xs hover:border-emerald-500 cursor-pointer transition-all"
                      >
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-mono text-[9px] text-zinc-400">{m.date} às {m.time}</span>
                          <span className="text-[8px] font-extrabold bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300 uppercase">
                            {m.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-[11px] ${isHome ? 'text-emerald-500 font-black' : 'text-slate-800 dark:text-slate-200'}`}>
                            {m.homeClubName}
                          </span>
                          <span className="font-mono bg-zinc-950 dark:bg-slate-800 text-white font-black px-1.5 py-0.5 rounded text-[10px]">
                            {m.score.home} - {m.score.away}
                          </span>
                          <span className={`font-black text-[11px] ${!isHome ? 'text-emerald-500 font-black' : 'text-slate-800 dark:text-slate-200'}`}>
                            {m.awayClubName}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CARREIRA TAB */}
        {activeTab === 'career' && (
          <div className="flex-1 flex flex-col gap-2.5 animate-fade-in h-full overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-[12px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                  Histórico Profissional
                </span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase">
                  Épocas Passadas
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/80 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="py-2">Época</th>
                      <th className="py-2">Clube</th>
                      <th className="py-2 text-center">Partidas</th>
                      <th className="py-2 text-center">Golos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-zinc-300">
                    {player.history.map((hist, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="py-2 font-mono font-bold text-slate-800 dark:text-zinc-100">{hist.season}</td>
                        <td className="py-2 font-semibold text-slate-800 dark:text-zinc-100">{hist.club}</td>
                        <td className="py-2 text-center font-mono font-extrabold text-slate-800 dark:text-zinc-100">{hist.matches}</td>
                        <td className="py-2 text-center font-mono font-black text-emerald-500">{hist.goals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LESÕES / SUSPENSÕES TAB */}
        {activeTab === 'injuries' && (
          <div className="flex-1 flex flex-col gap-2.5 animate-fade-in h-full overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center space-y-3.5">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-150 dark:border-emerald-800 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                <Activity className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Boletim Médico & Disciplinar</h4>
                <p className="text-[11px] text-emerald-500 font-bold flex items-center justify-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Apto para Competir (100% de Condição Física)
                </p>
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 text-left space-y-2.5 text-[11px]">
                <div className="flex justify-between items-center pb-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-zinc-400 font-bold">Lesões Atuais</span>
                  <span className="font-extrabold text-emerald-500 flex items-center gap-1">
                    Nenhuma Registrada
                  </span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-zinc-400 font-bold">Cartões Vermelhos Recentes</span>
                  <span className="font-extrabold text-slate-800 dark:text-zinc-200">
                    {player.stats.redCards} na temporada
                  </span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-zinc-400 font-bold">Cartões Amarelos Recentes</span>
                  <span className="font-extrabold text-slate-800 dark:text-zinc-200">
                    {player.stats.yellowCards} na temporada
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-bold">Elegibilidade Disciplinar</span>
                  <span className="font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Disponível
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 4. HIGH-END SEARCH OVERLAY */}
      {isSearchOpen && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90%] border border-slate-200 dark:border-slate-800">
            
            {/* Search Input Bar */}
            <div className="flex items-center gap-2 p-3 border-b border-slate-150 dark:border-slate-800 shrink-0">
              <Search className="w-5 h-5 text-zinc-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por jogador..."
                className="flex-1 bg-transparent border-none text-xs text-slate-850 dark:text-white placeholder-zinc-400 focus:outline-none"
                autoFocus
              />
              <button 
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-2">
              {searchQuery.trim() === '' ? (
                <div className="text-center py-10 text-zinc-400 space-y-2">
                  <User className="w-8 h-8 mx-auto opacity-50" />
                  <p className="text-[11px] font-semibold">Digite o nome de um jogador para iniciar a busca.</p>
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className="text-center py-10 text-zinc-400 space-y-2">
                  <AlertCircle className="w-8 h-8 mx-auto opacity-50" />
                  <p className="text-[11px] font-semibold">Nenhum jogador encontrado com "{searchQuery}".</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredPlayers.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        navigateTo({ type: 'player', id: p.id });
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={p.photoUrl} 
                          alt={p.name} 
                          className="w-8 h-8 rounded-full object-cover bg-zinc-100 border border-slate-200 dark:border-slate-800 shadow-xs" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-semibold uppercase leading-tight font-mono">
                            {p.clubName} • {p.position}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
