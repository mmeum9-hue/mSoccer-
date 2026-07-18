import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, Star, Search, Trophy, Award, Calendar, 
  Activity, Clock, AlertCircle, ChevronRight, User, X, 
  Check, Eye, ArrowRight, TrendingUp
} from 'lucide-react';
import { Club, Match, Player, NewsArticle, MatchStatus } from '../types';

interface ClubDetailsProps {
  clubId: string;
}

// Extra mock players for Black Bulls to have a fully populated squad
const MOCK_SQUAD_ABB: Player[] = [
  {
    id: 'diop',
    name: 'Ivan Diop',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80',
    age: 25,
    nationality: 'Senegal',
    clubId: 'black_bulls',
    clubName: 'Black Bulls Maputo',
    number: 9,
    position: 'Atacante',
    marketValue: '85 K.€',
    height: '1.83 m',
    stats: { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0 },
    history: []
  },
  {
    id: 'victor',
    name: 'Victor Bernardo',
    photoUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop&q=80',
    age: 26,
    nationality: 'Moçambique',
    clubId: 'black_bulls',
    clubName: 'Black Bulls Maputo',
    number: 1,
    position: 'Goleiro',
    marketValue: '50 K.€',
    height: '1.88 m',
    stats: { matches: 15, goals: 0, assists: 0, yellowCards: 1, redCards: 0, minutesPlayed: 1350 },
    history: []
  },
  {
    id: 'fidel',
    name: 'Fidel de Sousa',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80',
    age: 28,
    nationality: 'Moçambique',
    clubId: 'black_bulls',
    clubName: 'Black Bulls Maputo',
    number: 4,
    position: 'Defensor',
    marketValue: '75 K.€',
    height: '1.82 m',
    stats: { matches: 14, goals: 1, assists: 1, yellowCards: 3, redCards: 0, minutesPlayed: 1260 },
    history: []
  },
  {
    id: 'martinho',
    name: 'Martinho Alexandre',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&q=80',
    age: 22,
    nationality: 'Moçambique',
    clubId: 'black_bulls',
    clubName: 'Black Bulls Maputo',
    number: 8,
    position: 'Meio-campista',
    marketValue: '60 K.€',
    height: '1.76 m',
    stats: { matches: 12, goals: 2, assists: 3, yellowCards: 2, redCards: 0, minutesPlayed: 980 },
    history: []
  },
  {
    id: 'melque',
    name: 'Melque Alexandre',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&q=80',
    age: 27,
    nationality: 'Moçambique',
    clubId: 'black_bulls',
    clubName: 'Black Bulls Maputo',
    number: 7,
    position: 'Atacante',
    marketValue: '110 K.€',
    height: '1.75 m',
    stats: { matches: 15, goals: 8, assists: 4, yellowCards: 1, redCards: 0, minutesPlayed: 1210 },
    history: []
  }
];

export const ClubDetails: React.FC<ClubDetailsProps> = ({ clubId }) => {
  const { clubs, players, championships, matches, news, favorites, toggleFavorite, navigateBack, navigateTo } = useApp();

  const [activeTab, setActiveTab] = useState<'info' | 'matches' | 'transfers' | 'squad'>('info');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);

  // Find club
  const club = clubs.find((c) => c.id === clubId) || clubs.find((c) => c.name.toLowerCase().includes('black')) || clubs[0];

  const isFav = favorites.clubs.includes(club.id);

  // Mozambique country code & flag code helper
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
      'Senegal': 'sn',
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
      'Senegal': '🇸🇳',
    };
    return map[country] || '🇲🇿';
  };

  const flagCode = getCountryCode(club.country);
  const flagEmoji = getCountryFlagEmoji(club.country);

  // Dynamic ELO computation matching the 74 ELO shown in screenshot for Black Bulls Maputo
  const eloScore = useMemo(() => {
    if (club.id === 'black_bulls') return 74;
    // Calculate realistic dynamic score based on wins/draws/losses
    const base = 65;
    const wins = club.stats?.wins ?? 0;
    const draws = club.stats?.draws ?? 0;
    const losses = club.stats?.losses ?? 0;
    const computed = base + (wins * 2) + draws - (losses * 2);
    return Math.min(99, Math.max(50, computed));
  }, [club]);

  // Find championship
  const championship = championships.find((champ) => 
    champ.standings.some((s) => s.clubId === club.id)
  );
  const leagueName = championship ? championship.name : 'Moçambola';
  const leagueLogo = championship?.logoUrl || 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop&q=80';

  // Club players list (Merge initial + specific mock squad members for Black Bulls Maputo)
  const squadList = useMemo(() => {
    const dbPlayers = players.filter((p) => p.clubId === club.id);
    if (club.id === 'black_bulls') {
      const merged = [...dbPlayers];
      MOCK_SQUAD_ABB.forEach(mockP => {
        if (!merged.some(p => p.id === mockP.id || p.name === mockP.name)) {
          merged.push(mockP);
        }
      });
      return merged;
    }
    return dbPlayers;
  }, [players, club.id]);

  // Squad grouped by position
  const groupedSquad = useMemo(() => {
    const groups = {
      'Goleiros': [] as Player[],
      'Defensores': [] as Player[],
      'Meio-campistas': [] as Player[],
      'Atacantes': [] as Player[]
    };
    squadList.forEach(p => {
      if (p.position === 'Goleiro') groups['Goleiros'].push(p);
      else if (p.position === 'Defensor') groups['Defensores'].push(p);
      else if (p.position === 'Meio-campista') groups['Meio-campistas'].push(p);
      else if (p.position === 'Atacante') groups['Atacantes'].push(p);
    });
    return groups;
  }, [squadList]);

  const getMonthAbbr = (month: number) => {
    const abbrs = ['JAN.', 'FEV.', 'MAR.', 'ABR.', 'MAI.', 'JUN.', 'JUL.', 'AGO.', 'SET.', 'OUT.', 'NOV.', 'DEZ.'];
    return abbrs[month - 1] || 'MÊS';
  };

  const formatClubName = (name: string) => {
    if (!name) return '';
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '';
    
    const uppercaseFirst = words[0].toUpperCase();
    const prefixes = ['CD', 'FC', 'GD', 'UD', 'AD', 'CR', 'SC', 'SL', 'AC', 'CLUB', 'CLUBE', 'ASSOCIAÇÃO', 'ASSOCIACAO'];
    
    if (prefixes.includes(uppercaseFirst) && words.length > 1) {
      return `${words[0]} ${words[1]}`.substring(0, 16);
    }
    return words[0].substring(0, 13);
  };

  // Compute club specific form (Draw: Amber, Win: Green, Loss: Red)
  const clubForm = useMemo(() => {
    // Build form dynamically for all clubs based on finished matches
    const finished = matches
      .filter((m) => (m.homeClubId === club.id || m.awayClubId === club.id) && m.status === MatchStatus.FINISHED)
      .sort((a, b) => {
        const dateA = `${a.date}T${a.time || '00:00'}`;
        const dateB = `${b.date}T${b.time || '00:00'}`;
        return dateB.localeCompare(dateA); // Newest first
      })
      .slice(0, 5)
      .reverse(); // Display oldest on left, newest on right

    if (finished.length === 0) {
      return [];
    }

    return finished.map(m => {
      const isHome = m.homeClubId === club.id;
      const opponentId = isHome ? m.awayClubId : m.homeClubId;
      const opponentName = isHome ? m.awayClubName : m.homeClubName;
      
      const oppClub = clubs.find(c => c.id === opponentId) || clubs.find(c => c.name.toLowerCase() === opponentName.toLowerCase());
      const opponentLogo = oppClub?.logoUrl || (isHome ? m.awayClubLogo : m.homeClubLogo) || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop&q=80';

      const myScore = isHome ? m.score.home : m.score.away;
      const oppScore = isHome ? m.score.away : m.score.home;
      const result = myScore > oppScore ? 'W' as const : myScore < oppScore ? 'L' as const : 'D' as const;
      
      // Parse match date
      const dateParts = m.date.split('-');
      const dateFormatted = dateParts.length >= 3 ? `${dateParts[2]} ${getMonthAbbr(parseInt(dateParts[1]))}` : m.date;

      return {
        opponentName,
        opponentLogo,
        score: `${m.score.home} - ${m.score.away}`,
        date: dateFormatted,
        result
      };
    });
  }, [club, matches, clubs]);

  // Club Matches tab list
  const tabMatches = useMemo(() => {
    return matches
      .filter(m => m.homeClubId === club.id || m.awayClubId === club.id)
      .sort((a, b) => {
        const dateA = `${a.date}T${a.time || '00:00'}`;
        const dateB = `${b.date}T${b.time || '00:00'}`;
        return dateA.localeCompare(dateB); // Chronological order
      });
  }, [club, matches]);

  // Last match and Next match computed with robust sorting
  const lastMatch = useMemo(() => {
    const finished = matches
      .filter(m => (m.homeClubId === club.id || m.awayClubId === club.id) && m.status === MatchStatus.FINISHED)
      .sort((a, b) => {
        const dateA = `${a.date}T${a.time || '00:00'}`;
        const dateB = `${b.date}T${b.time || '00:00'}`;
        return dateB.localeCompare(dateA); // Newest first
      });
    if (finished.length > 0) return finished[0];
    return null;
  }, [club, matches]);

  const nextMatch = useMemo(() => {
    const scheduled = matches
      .filter(m => (m.homeClubId === club.id || m.awayClubId === club.id) && m.status === MatchStatus.SCHEDULED)
      .sort((a, b) => {
        const dateA = `${a.date}T${a.time || '00:00'}`;
        const dateB = `${b.date}T${b.time || '00:00'}`;
        return dateA.localeCompare(dateB); // Soonest first
      });
    if (scheduled.length > 0) return scheduled[0];
    return null;
  }, [club, matches]);

  // Robust dynamic logo lookups for last and next matches
  const lastMatchHomeLogo = useMemo(() => {
    if (!lastMatch) return '';
    const found = clubs.find(c => c.id === lastMatch.homeClubId) || clubs.find(c => c.name.toLowerCase() === lastMatch.homeClubName.toLowerCase());
    return found?.logoUrl || lastMatch.homeClubLogo || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop&q=80';
  }, [lastMatch, clubs]);

  const lastMatchAwayLogo = useMemo(() => {
    if (!lastMatch) return '';
    const found = clubs.find(c => c.id === lastMatch.awayClubId) || clubs.find(c => c.name.toLowerCase() === lastMatch.awayClubName.toLowerCase());
    return found?.logoUrl || lastMatch.awayClubLogo || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop&q=80';
  }, [lastMatch, clubs]);

  const nextMatchHomeLogo = useMemo(() => {
    if (!nextMatch) return '';
    const found = clubs.find(c => c.id === nextMatch.homeClubId) || clubs.find(c => c.name.toLowerCase() === nextMatch.homeClubName.toLowerCase());
    return found?.logoUrl || nextMatch.homeClubLogo || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop&q=80';
  }, [nextMatch, clubs]);

  const nextMatchAwayLogo = useMemo(() => {
    if (!nextMatch) return '';
    const found = clubs.find(c => c.id === nextMatch.awayClubId) || clubs.find(c => c.name.toLowerCase() === nextMatch.awayClubName.toLowerCase());
    return found?.logoUrl || nextMatch.awayClubLogo || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop&q=80';
  }, [nextMatch, clubs]);

  // Club specific transfers
  const clubTransfers = useMemo(() => {
    return [];
  }, []);

  // Featured News Card dynamic mapping
  const featuredNews = useMemo(() => {
    // Find news related to this club
    const related = news.filter(n => n.clubId === club.id || n.title.toLowerCase().includes(club.name.toLowerCase()));
    if (related.length > 0) return related[0];

    return null;
  }, [news, club]);

  // Search filtering
  const filteredClubs = useMemo(() => {
    if (searchQuery.trim() === '') return [];
    return clubs.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, clubs]);

  return (
    <div className="max-w-md mx-auto w-full h-[calc(100vh-80px)] flex flex-col bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-3xl overflow-hidden shadow-2xl relative my-2">
      
      {/* 1. GREEN HEADER (VIBRANT SPORTS SOCCER BACKGROUND) */}
      <div className="bg-[#3C8C21] text-white pt-3 pb-2 px-4 relative flex flex-col shrink-0">
        
        {/* Top Navbar */}
        <div className="flex items-center justify-between h-9 mb-2">
          <button 
            onClick={navigateBack}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            id="club-back-btn"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <span className="text-[15px] font-black tracking-tight text-white uppercase truncate max-w-[220px]">
            {club.name}
          </span>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => toggleFavorite('clubs', club.id)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              id="club-fav-btn"
            >
              <Star className={`w-5 h-5 ${isFav ? 'fill-yellow-300 text-yellow-300' : 'text-white'}`} />
            </button>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              id="club-search-btn"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Club Banner Info Grid (Screenshot layout) */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          
          {/* Left: Championship logo/badge */}
          <div className="flex flex-col items-center space-y-1">
            <div className="w-12 h-12 rounded-full bg-white p-0.5 border border-white/20 shadow-sm flex items-center justify-center overflow-hidden">
              <img 
                src={leagueLogo} 
                alt={leagueName} 
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-[10px] font-extrabold text-white/90 uppercase tracking-wider text-center max-w-[85px] truncate">
              {leagueName}
            </span>
          </div>

          {/* Center: Large Club Shield (80px) with overlapping country flag */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-white shadow-lg overflow-hidden flex items-center justify-center">
              <img 
                src={club.logoUrl} 
                alt={club.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop&q=80";
                }}
              />
            </div>
            {/* Overlapping Flag circular on top-right */}
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full border border-white bg-slate-900 shadow-md flex items-center justify-center overflow-hidden">
              <img 
                src={`https://flagcdn.com/w40/${flagCode}.png`} 
                alt={club.country} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="text-[10px] leading-none absolute">{flagEmoji}</span>
            </div>
          </div>

          {/* Right: ELO Rating Circle Badge */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-white/30 bg-white/15 flex flex-col items-center justify-center shadow-inner">
              <span className="font-mono font-black text-[15px] text-white leading-tight">
                {eloScore}
              </span>
              <span className="text-[8px] font-black tracking-wider text-white/80 leading-none">
                ELO
              </span>
            </div>
            <span className="text-[9px] font-bold text-yellow-300 uppercase tracking-wider mt-1">
              {club.shortName || club.name.substring(0, 3).toUpperCase()}
            </span>
          </div>

        </div>

        {/* 2. COMPACT TABS */}
        <div className="flex justify-between border-t border-white/20 mt-1 pt-2">
          {[
            { id: 'info', label: 'Informação' },
            { id: 'matches', label: 'Partidas' },
            { id: 'transfers', label: 'Transferências' },
            { id: 'squad', label: 'Elenco' }
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

      {/* 3. SCROLL-FREE COMPACT CONTENT CONTAINER */}
      <div className="flex-1 p-2.5 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-zinc-100 gap-2.5">
        
        {/* INFORMAÇÃO TAB */}
        {activeTab === 'info' && (
          <div className="flex flex-col gap-2.5 animate-fade-in">
            
            {/* A. ÚLTIMO JOGO CARD */}
            {lastMatch && (
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm space-y-2">
                <div className="flex justify-between items-center px-0.5">
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                    ÚLTIMO JOGO
                  </span>
                  <button 
                    onClick={() => setActiveTab('matches')} 
                    className="text-[10px] text-[#3C8C21] font-bold uppercase tracking-wider hover:underline"
                  >
                    MAIS
                  </button>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-800/10 border border-slate-100/50 dark:border-slate-800/40 rounded-xl p-2.5 relative">
                  <div className="absolute top-2.5 left-2.5 bg-slate-200 dark:bg-slate-800 text-zinc-600 dark:text-zinc-300 font-black text-[8px] px-1.5 py-0.5 rounded uppercase">
                    FIM
                  </div>
                  
                  <p className="text-[9px] text-zinc-400 font-semibold text-center uppercase tracking-wider mb-2">
                    {lastMatch.championshipName || 'Moçambola. Ronda 9'}
                  </p>

                  <div className="grid grid-cols-12 gap-1 items-center">
                    {/* Home team */}
                    <div className="col-span-4 flex flex-col items-center text-center space-y-1">
                      <img src={lastMatchHomeLogo} alt="" className="w-8 h-8 rounded-full object-cover bg-white p-0.5 shadow-xs border" />
                      <span className={`text-[10px] font-black tracking-tight leading-tight max-w-[90px] break-words uppercase text-center ${
                        lastMatch.homeClubId === club.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-300'
                      }`}>
                        {lastMatch.homeClubName}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="col-span-4 flex flex-col items-center justify-center">
                      <span className="font-mono font-black text-[22px] text-slate-900 dark:text-white tracking-tight leading-none">
                        {lastMatch.score.home} - {lastMatch.score.away}
                      </span>
                    </div>

                    {/* Away team */}
                    <div className="col-span-4 flex flex-col items-center text-center space-y-1">
                      <img src={lastMatchAwayLogo} alt="" className="w-8 h-8 rounded-full object-cover bg-white p-0.5 shadow-xs border" />
                      <span className={`text-[10px] font-black tracking-tight leading-tight max-w-[90px] break-words uppercase text-center ${
                        lastMatch.awayClubId === club.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-300'
                      }`}>
                        {lastMatch.awayClubName}
                      </span>
                    </div>
                  </div>

                  <p className="text-[9px] text-zinc-400 font-medium text-center uppercase tracking-wide mt-2.5 font-mono">
                    {lastMatch.date} {lastMatch.time}
                  </p>
                </div>
              </div>
            )}

            {/* B. PRÓXIMO JOGO CARD */}
            {nextMatch && (
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm space-y-2">
                <div className="flex justify-between items-center px-0.5">
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                    PRÓXIMO JOGO
                  </span>
                  <button 
                    onClick={() => setActiveTab('matches')} 
                    className="text-[10px] text-[#3C8C21] font-bold uppercase tracking-wider hover:underline"
                  >
                    MAIS
                  </button>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-800/10 border border-slate-100/50 dark:border-slate-800/40 rounded-xl p-2.5">
                  <p className="text-[9px] text-zinc-400 font-semibold text-center uppercase tracking-wider mb-2">
                    {nextMatch.championshipName || 'Moçambola. Ronda 10'}
                  </p>

                  <div className="grid grid-cols-12 gap-1 items-center">
                    {/* Home team */}
                    <div className="col-span-4 flex flex-col items-center text-center space-y-1">
                      <img src={nextMatchHomeLogo} alt="" className="w-8 h-8 rounded-full object-cover bg-white p-0.5 shadow-xs border" />
                      <span className={`text-[10px] font-black tracking-tight leading-tight max-w-[90px] break-words uppercase text-center ${
                        nextMatch.homeClubId === club.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-300'
                      }`}>
                        {nextMatch.homeClubName}
                      </span>
                    </div>

                    {/* VS / Info */}
                    <div className="col-span-4 flex flex-col items-center justify-center text-center">
                      <span className="text-[11px] font-mono font-black text-slate-800 dark:text-white uppercase leading-none">
                        {nextMatch.time}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase mt-1 leading-none font-mono">
                        {nextMatch.date}
                      </span>
                    </div>

                    {/* Away team */}
                    <div className="col-span-4 flex flex-col items-center text-center space-y-1">
                      <img src={nextMatchAwayLogo} alt="" className="w-8 h-8 rounded-full object-cover bg-white p-0.5 shadow-xs border" />
                      <span className={`text-[10px] font-black tracking-tight leading-tight max-w-[90px] break-words uppercase text-center ${
                        nextMatch.awayClubId === club.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-300'
                      }`}>
                        {nextMatch.awayClubName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* C. FORMA NOS ÚLTIMOS JOGOS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm space-y-2">
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight block px-0.5">
                FORMA NOS ÚLTIMOS JOGOS
              </span>

              {clubForm.length > 0 ? (
                <div className="grid grid-cols-5 gap-1">
                  {clubForm.map((f, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-1.5 border border-slate-100 dark:border-slate-800/40 flex flex-col items-center relative pt-2.5 overflow-hidden text-center"
                    >
                      {/* Top color indicator line */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${
                        f.result === 'W' ? 'bg-emerald-500' : f.result === 'D' ? 'bg-amber-400' : 'bg-red-500'
                      }`} />

                      {/* Competitor / Opponent and Competition badges */}
                      <div className="flex items-center justify-center gap-1 mb-1.5">
                        <img 
                          src={f.opponentLogo} 
                          alt={f.opponentName} 
                          className="w-6 h-6 rounded-full object-cover bg-white shadow-xs border border-slate-100 dark:border-slate-800" 
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=50&h=50&fit=crop&q=80";
                          }}
                        />
                        <div className="w-6 h-6 rounded-full bg-[#3C8C21]/15 flex items-center justify-center text-[10px] border border-[#3C8C21]/20 font-sans">
                          🇲🇿
                        </div>
                      </div>

                      <span className="font-mono font-black text-[10px] text-slate-850 dark:text-white leading-none">
                        {f.score}
                      </span>
                      <span className="text-[8px] text-zinc-400 font-extrabold uppercase mt-1 leading-none font-mono">
                        {f.date}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl px-4">
                  <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Nenhum jogo encerrado
                  </p>
                  <p className="text-[9px] text-zinc-400/80 dark:text-zinc-500/70 mt-1 max-w-[200px] mx-auto leading-normal font-medium">
                    O histórico de forma será gerado assim que as primeiras partidas forem finalizadas.
                  </p>
                </div>
              )}
            </div>

            {/* D. FEATURED NEWS CARD (Screenshot style) */}
            {featuredNews && (
              <div 
                onClick={() => setSelectedNews(featuredNews as any)}
                className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:border-emerald-500 cursor-pointer transition-all"
              >
                <div className="grid grid-cols-12 gap-0">
                  <div className="col-span-5 h-24 overflow-hidden relative">
                    <img src={featuredNews.imageUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="col-span-7 p-2.5 flex flex-col justify-between text-left">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-black text-[#3C8C21] uppercase tracking-wider leading-none">
                        {featuredNews.category || 'ORDEM MATEUS'}
                      </span>
                      <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase leading-snug line-clamp-3">
                        {featuredNews.title}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-zinc-400 font-semibold uppercase font-mono mt-1">
                      <span>{featuredNews.publishedAt}</span>
                      <span className="flex items-center gap-0.5">
                        <Eye className="w-3 h-3" /> {featuredNews.views > 1000 ? `${(featuredNews.views/1000).toFixed(0)}K` : featuredNews.views}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* E. NOTÍCIAS ATUAIS DE TRANSFERÊNCIAS (Graphic block matching screenshot) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm space-y-2.5">
              <div className="flex justify-between items-center px-0.5">
                <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                  NOTÍCIAS ATUAIS DE TRANSFERÊNCIAS
                </span>
                <button 
                  onClick={() => setActiveTab('transfers')} 
                  className="text-[10px] text-[#3C8C21] font-bold uppercase tracking-wider hover:underline"
                >
                  MAIS
                </button>
              </div>

              {clubTransfers.length > 0 ? (
                <div className="bg-slate-50/50 dark:bg-slate-800/10 border border-slate-100/50 dark:border-slate-800/40 rounded-xl p-2.5 flex flex-col items-center">
                  <div className="self-start bg-blue-500 text-white font-black text-[8px] px-1.5 py-0.5 rounded tracking-wide uppercase mb-2">
                    {clubTransfers[0].type}
                  </div>

                  {/* Graphic transfer path */}
                  <div className="flex items-center justify-center gap-1.5 py-2 w-full max-w-[280px]">
                    {/* Left: Source Logo */}
                    <div className="w-10 h-10 rounded-full bg-white shadow-xs border p-0.5 flex items-center justify-center overflow-hidden">
                      <img src={clubTransfers[0].sourceLogo} alt="" className="w-full h-full object-cover rounded-full" />
                    </div>

                    {/* Dotted Arrow 1 */}
                    <div className="flex-1 flex items-center justify-center gap-0.5 text-[#3C8C21] font-bold text-[10px] tracking-tight">
                      <span className="animate-pulse">···</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>

                    {/* Center: Player Silhouette/Photo */}
                    <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-slate-300 overflow-hidden flex items-center justify-center relative">
                      <img src={clubTransfers[0].playerPhoto} alt="" className="w-full h-full object-cover" />
                    </div>

                    {/* Dotted Arrow 2 */}
                    <div className="flex-1 flex items-center justify-center gap-0.5 text-[#3C8C21] font-bold text-[10px] tracking-tight">
                      <span className="animate-pulse">···</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>

                    {/* Right: Dest Logo */}
                    <div className="w-10 h-10 rounded-full bg-white shadow-xs border p-0.5 flex items-center justify-center overflow-hidden">
                      <img src={clubTransfers[0].destLogo} alt="" className="w-full h-full object-cover rounded-full" />
                    </div>
                  </div>

                  <p className="text-[10px] font-black text-slate-800 dark:text-zinc-200 text-center uppercase tracking-tight mt-2 px-1">
                    {clubTransfers[0].destClub} contratou {clubTransfers[0].playerName} ao {clubTransfers[0].sourceClub}
                  </p>
                </div>
              ) : (
                <div className="text-center py-5 bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl px-4">
                  <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Nenhuma transferência recente
                  </p>
                  <p className="text-[9px] text-zinc-400/80 dark:text-zinc-500/70 mt-1 max-w-[200px] mx-auto leading-normal font-medium text-center">
                    As novidades e movimentações do mercado serão exibidas assim que registradas.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* PARTIDAS TAB */}
        {activeTab === 'matches' && (
          <div className="flex flex-col gap-2.5 animate-fade-in h-full">
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-[12px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                  Resultados & Calendário
                </span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase">
                  {club.name}
                </span>
              </div>

              {tabMatches.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Calendar className="w-8 h-8 text-zinc-400 mx-auto" />
                  <p className="text-xs text-zinc-500 font-semibold">Nenhum jogo programado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tabMatches.map((m) => {
                    const isHome = m.homeClubId === club.id;
                    const isFinished = m.status === 'Encerrado';
                    return (
                      <div 
                        key={m.id} 
                        onClick={() => {
                          if (!m.id.startsWith('bb_')) {
                            navigateTo({ type: 'match', id: m.id });
                          }
                        }}
                        className={`p-2.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/40 rounded-xl flex items-center justify-between text-xs hover:border-[#3C8C21] transition-all ${!m.id.startsWith('bb_') ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-mono text-[9px] text-zinc-400">{m.date} às {m.time}</span>
                          <span className="text-[8px] font-extrabold bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300 uppercase">
                            {m.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-[11px] ${isHome ? 'text-[#3C8C21] font-black' : 'text-slate-850 dark:text-slate-200'}`}>
                            {formatClubName(m.homeClubName)}
                          </span>
                          <span className="font-mono bg-zinc-950 dark:bg-slate-800 text-white font-black px-1.5 py-0.5 rounded text-[10px]">
                            {isFinished ? `${m.score.home} - ${m.score.away}` : 'VS'}
                          </span>
                          <span className={`font-black text-[11px] ${!isHome ? 'text-[#3C8C21] font-black' : 'text-slate-850 dark:text-slate-200'}`}>
                            {formatClubName(m.awayClubName)}
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

        {/* TRANSFERÊNCIAS TAB */}
        {activeTab === 'transfers' && (
          <div className="flex flex-col gap-2.5 animate-fade-in h-full">
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-[12px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                  Atividades de Transferência
                </span>
                <span className="text-[10px] text-[#3C8C21] font-black uppercase tracking-wider font-mono">
                  Época 2025/26
                </span>
              </div>

              <div className="space-y-2.5">
                {clubTransfers.length > 0 ? (
                  clubTransfers.map((t, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/40 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono text-zinc-400">{t.date}</span>
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[8px] px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                          {t.type} • {t.value}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={t.playerPhoto} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                          <div className="text-left">
                            <p className="text-xs font-black text-slate-800 dark:text-white leading-tight">{t.playerName}</p>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase">Atacante</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <img src={t.sourceLogo} alt="" className="w-5 h-5 rounded-full object-cover" title={t.sourceClub} />
                          <ArrowRight className="w-3 h-3 text-zinc-400" />
                          <img src={t.destLogo} alt="" className="w-5 h-5 rounded-full object-cover" title={t.destClub} />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                      Sem transferências registradas
                    </p>
                    <p className="text-[11px] text-zinc-400/80 leading-normal max-w-[240px] mx-auto">
                      Não há registro de transferências nesta época para este clube.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ELENCO (SQUAD) TAB */}
        {activeTab === 'squad' && (
          <div className="flex flex-col gap-2.5 animate-fade-in h-full">
            
            {/* Position Groups */}
            {Object.entries(groupedSquad).map(([positionName, list]) => {
              const playersList = list as Player[];
              if (playersList.length === 0) return null;
              return (
                <div key={positionName} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-2">
                  <h3 className="text-[11px] font-black text-[#3C8C21] uppercase tracking-wider border-b border-slate-50 dark:border-slate-800/50 pb-1.5">
                    {positionName} ({playersList.length})
                  </h3>

                  <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800/40">
                    {playersList.map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => navigateTo({ type: 'player', id: p.id })}
                        className="flex items-center justify-between py-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 cursor-pointer rounded-lg transition-all px-1"
                      >
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={p.photoUrl} 
                            alt={p.name} 
                            className="w-8 h-8 rounded-full object-cover bg-zinc-100 border border-slate-200 dark:border-slate-800" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="text-left">
                            <p className="text-xs font-black text-slate-800 dark:text-zinc-100 leading-tight">
                              {p.name}
                            </p>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase leading-tight font-mono">
                              Nº {p.number} • {getCountryFlagEmoji(p.nationality)} {p.age} Anos
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-zinc-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100/50 dark:border-slate-800/40">
                            {p.marketValue}
                          </span>
                          <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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
                placeholder="Pesquisar por clube..."
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
                  <Trophy className="w-8 h-8 mx-auto opacity-50" />
                  <p className="text-[11px] font-semibold">Digite o nome de um clube para iniciar a busca.</p>
                </div>
              ) : filteredClubs.length === 0 ? (
                <div className="text-center py-10 text-zinc-400 space-y-2">
                  <AlertCircle className="w-8 h-8 mx-auto opacity-50" />
                  <p className="text-[11px] font-semibold">Nenhum clube encontrado com "{searchQuery}".</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredClubs.map((c) => (
                    <div 
                      key={c.id}
                      onClick={() => {
                        navigateTo({ type: 'club', id: c.id });
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={c.logoUrl} 
                          alt={c.name} 
                          className="w-8 h-8 rounded-full object-cover bg-zinc-100 border border-slate-200 dark:border-slate-800 shadow-xs" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=50&h=50&fit=crop&q=80";
                          }}
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                            {c.name}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-semibold uppercase leading-tight font-mono">
                            📍 {c.country} • ELO {c.id === 'black_bulls' ? 74 : 85}
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

      {/* 5. DYNAMIC NEWS READER MODAL */}
      {selectedNews && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-h-[85%] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 dark:border-slate-850">
            {/* Header image */}
            <div className="h-36 relative overflow-hidden shrink-0">
              <img src={selectedNews.imageUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
              <button 
                onClick={() => setSelectedNews(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/45 hover:bg-black/65 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="absolute bottom-3 left-4 right-4 text-left">
                <span className="text-[8px] font-black bg-[#3C8C21] text-white px-1.5 py-0.5 rounded tracking-wider uppercase">
                  {selectedNews.category || 'NOTÍCIA'}
                </span>
                <h3 className="text-sm font-black text-white mt-1 leading-tight uppercase line-clamp-2">
                  {selectedNews.title}
                </h3>
              </div>
            </div>

            {/* Scrollable text */}
            <div className="flex-1 overflow-y-auto p-4 text-left space-y-3">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
                📅 Publicado: {selectedNews.publishedAt} • 👀 {selectedNews.views} Visualizações
              </p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 border-l-2 border-[#3C8C21] pl-2.5 leading-relaxed italic">
                {selectedNews.summary}
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {selectedNews.content}
              </p>
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800/80 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedNews(null)}
                className="bg-[#3C8C21] text-white font-extrabold text-[10px] px-4 py-1.5 rounded-xl uppercase hover:opacity-90 transition-opacity cursor-pointer"
              >
                Fechar Artigo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

