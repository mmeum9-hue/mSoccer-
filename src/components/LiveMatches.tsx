import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { MatchStatus, Match, formatMatchMinute } from '../types';
import { Star, Trophy, ChevronRight, Eye, Calendar, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CompetitionAdBanner } from './CompetitionAdBanner';

export const LiveMatches: React.FC = () => {
  const { matches, championships, news, favorites, toggleFavorite, navigateTo, user, language, headerColor } = useApp();

  const colorConfig: { [key: string]: { bg: string; border: string; text: string; tabText: string } } = {
    green: { bg: 'bg-[#3C8C21]', border: 'border-[#2d6e19]', text: 'text-[#3C8C21]', tabText: 'text-emerald-100/75 hover:text-white' },
    blue: { bg: 'bg-[#1E3A8A]', border: 'border-[#172554]', text: 'text-[#1E3A8A]', tabText: 'text-blue-100/75 hover:text-white' },
    red: { bg: 'bg-[#991B1B]', border: 'border-[#7F1D1D]', text: 'text-[#991B1B]', tabText: 'text-rose-100/75 hover:text-white' },
    purple: { bg: 'bg-[#5B21B6]', border: 'border-[#4C1D95]', text: 'text-[#5B21B6]', tabText: 'text-purple-100/75 hover:text-white' },
    orange: { bg: 'bg-[#C2410C]', border: 'border-[#9A3412]', text: 'text-[#C2410C]', tabText: 'text-orange-100/75 hover:text-white' },
    black: { bg: 'bg-[#111827]', border: 'border-[#030712]', text: 'text-[#111827]', tabText: 'text-zinc-400 hover:text-white' }
  };

  const activeColor = colorConfig[headerColor] || colorConfig.green;
  
  // Track whether we are currently filtering only favorites in the matches list
  const [showOnlyFavorites, setShowOnlyFavoritesState] = useState(() => {
    return localStorage.getItem('mSoccer_showOnlyFavorites') === 'true';
  });

  const setShowOnlyFavorites = (val: boolean) => {
    setShowOnlyFavoritesState(val);
    localStorage.setItem('mSoccer_showOnlyFavorites', String(val));
    window.dispatchEvent(new CustomEvent('show-only-favorites-changed', { detail: val }));
  };

  useEffect(() => {
    const handleSetFav = (e: Event) => {
      const customEvent = e as CustomEvent;
      setShowOnlyFavoritesState(customEvent.detail);
    };
    window.addEventListener('set-show-only-favorites', handleSetFav);
    return () => window.removeEventListener('set-show-only-favorites', handleSetFav);
  }, []);

  useEffect(() => {
    const handleSetDate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const targetDate = customEvent.detail;
      
      const yesterdayStr = getRelativeDateStr(-1);
      const todayStr = getRelativeDateStr(0);
      const tomorrowStr = getRelativeDateStr(1);
      
      if (targetDate === todayStr) {
        setSelectedTab('today');
      } else if (targetDate === yesterdayStr) {
        setSelectedTab('yesterday');
      } else if (targetDate === tomorrowStr) {
        setSelectedTab('tomorrow');
      } else {
        setSelectedTab(targetDate);
      }
      
      setTimeout(() => {
        const tabId = targetDate === todayStr ? 'tab-today' : targetDate === yesterdayStr ? 'tab-yesterday' : targetDate === tomorrowStr ? 'tab-tomorrow' : `tab-${targetDate}`;
        const tabEl = document.getElementById(tabId);
        if (tabEl) {
          tabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 150);
    };
    
    window.addEventListener('set-match-date', handleSetDate);
    return () => window.removeEventListener('set-match-date', handleSetDate);
  }, []);

  useEffect(() => {
    // Initial scroll to today's tab so the user lands on the active day
    setTimeout(() => {
      const tabEl = document.getElementById('tab-today');
      if (tabEl) {
        tabEl.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
      }
    }, 400);
  }, []);
  
  // Predictor modal state
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [predictedHome, setPredictedHome] = useState('2');
  const [predictedAway, setPredictedAway] = useState('1');
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [predictionSubmitted, setPredictionSubmitted] = useState(false);

  const getMappedChampionshipName = (name: string): string => {
    if (name.toLowerCase().includes('champions league')) return '🇪🇺 UEFA CHAMPIONS LEAGUE';
    if (name.toLowerCase().includes('brasileirão')) return '🇧🇷 BRASILEIRÃO SÉRIE A';
    if (name.toLowerCase().includes('la liga') || name.toLowerCase().includes('laliga')) return '🇪🇸 LALIGA ESPANHOLA';
    if (name.toLowerCase().includes('mundial')) return '🇺🇳 MUNDIAL';
    if (name.toLowerCase().includes('moçambola')) return '🇲🇿 MOÇAMBOLA';
    return `🏆 ${name.toUpperCase()}`;
  };

  // Tab state for match filtering
  const [selectedTab, setSelectedTab] = useState<string>('today');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Dynamic relative date helper
  const getRelativeDateStr = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatTabDate = (d: Date): string => {
    const day = d.getDate();
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const month = months[d.getMonth()];
    return `${day} ${month}`;
  };

  const allDisplayMatches = matches.map(m => ({
    ...m,
    championshipName: getMappedChampionshipName(m.championshipName)
  }));

  // Define the tabs dynamically
  const matchTabs: Array<{
    id: string;
    label: string;
    isLive: boolean;
    getCount: () => number;
    sortTime: number;
  }> = [];

  const getOffsetTimestamp = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(12, 0, 0, 0);
    return d.getTime();
  };

  // 1. Add historical/past dates before 'Ontem' (-14 to -2)
  for (let i = -14; i <= -2; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = getRelativeDateStr(i);
    const label = formatTabDate(d);
    matchTabs.push({
      id: dateStr,
      label: label,
      isLive: false,
      getCount: () => allDisplayMatches.filter(m => m.date === dateStr).length,
      sortTime: getOffsetTimestamp(i)
    });
  }

  // 2. Add 'yesterday' (-1)
  matchTabs.push({
    id: 'yesterday',
    label: 'Ontem',
    isLive: false,
    getCount: () => allDisplayMatches.filter(m => m.date === getRelativeDateStr(-1)).length,
    sortTime: getOffsetTimestamp(-1)
  });

  // 3. Add 'today' (0)
  matchTabs.push({
    id: 'today',
    label: 'Hoje',
    isLive: false,
    getCount: () => allDisplayMatches.filter(m => m.date === getRelativeDateStr(0)).length,
    sortTime: getOffsetTimestamp(0)
  });

  // 4. Add 'live' (between today and tomorrow, as originally laid out)
  matchTabs.push({
    id: 'live',
    label: 'Ao Vivo',
    isLive: true,
    getCount: () => allDisplayMatches.filter(m => m.status === MatchStatus.LIVE || m.status === MatchStatus.HT).length,
    sortTime: getOffsetTimestamp(0) + 1000 // Just after today for sorting
  });

  // 5. Add 'tomorrow' (+1)
  matchTabs.push({
    id: 'tomorrow',
    label: 'Amanhã',
    isLive: false,
    getCount: () => allDisplayMatches.filter(m => m.date === getRelativeDateStr(1)).length,
    sortTime: getOffsetTimestamp(1)
  });

  // 6. Add future dates after 'Amanhã' (+2 to +14)
  for (let i = 2; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = getRelativeDateStr(i);
    const label = formatTabDate(d);
    matchTabs.push({
      id: dateStr,
      label: label,
      isLive: false,
      getCount: () => allDisplayMatches.filter(m => m.date === dateStr).length,
      sortTime: getOffsetTimestamp(i)
    });
  }

  // Dynamically insert tabs for any match dates in the database that are not yet in matchTabs
  allDisplayMatches.forEach((m) => {
    if (m.date) {
      const isAlreadyInTabs = matchTabs.some(
        (t) =>
          t.id === m.date ||
          (t.id === 'yesterday' && m.date === getRelativeDateStr(-1)) ||
          (t.id === 'today' && m.date === getRelativeDateStr(0)) ||
          (t.id === 'tomorrow' && m.date === getRelativeDateStr(1))
      );
      if (!isAlreadyInTabs) {
        try {
          const parts = m.date.split('-');
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const d = new Date(year, month, day, 12, 0, 0);
            if (!isNaN(d.getTime())) {
              const label = formatTabDate(d);
              matchTabs.push({
                id: m.date,
                label: label,
                isLive: false,
                getCount: () => allDisplayMatches.filter((x) => x.date === m.date).length,
                sortTime: d.getTime()
              });
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  });

  // Dynamically insert custom selected date tab if not present
  const hasSelectedTab = matchTabs.some((t) => t.id === selectedTab);
  if (!hasSelectedTab && selectedTab !== 'live') {
    try {
      const parts = selectedTab.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day, 12, 0, 0);
        if (!isNaN(d.getTime())) {
          const label = formatTabDate(d);
          matchTabs.push({
            id: selectedTab,
            label: label,
            isLive: false,
            getCount: () => allDisplayMatches.filter((m) => m.date === selectedTab).length,
            sortTime: d.getTime()
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Sort matchTabs chronologically based on sortTime
  matchTabs.sort((a, b) => a.sortTime - b.sortTime);

  const changeTab = (tabId: string) => {
    const currentIndex = matchTabs.findIndex((t) => t.id === selectedTab);
    const targetIndex = matchTabs.findIndex((t) => t.id === tabId);
    if (targetIndex !== -1 && currentIndex !== -1 && targetIndex !== currentIndex) {
      setSlideDirection(targetIndex > currentIndex ? 'left' : 'right');
    }
    setSelectedTab(tabId);
  };

  // Scroll active tab to center of tab bar
  useEffect(() => {
    const tabEl = document.getElementById(`tab-${selectedTab}`);
    if (tabEl) {
      tabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedTab]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = touchStartX - e.changedTouches[0].clientX;
    const diffY = touchStartY - e.changedTouches[0].clientY;

    // Detect horizontal swipes only (must be significantly wider than vertical)
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 60) {
        const currentIndex = matchTabs.findIndex((t) => t.id === selectedTab);
        if (diffX > 0) {
          // Swiped left -> load next tab on the right (index + 1)
          const nextIndex = currentIndex + 1;
          if (nextIndex < matchTabs.length) {
            setSlideDirection('left');
            setSelectedTab(matchTabs[nextIndex].id);
          }
        } else {
          // Swiped right -> load previous tab on the left (index - 1)
          const prevIndex = currentIndex - 1;
          if (prevIndex >= 0) {
            setSlideDirection('right');
            setSelectedTab(matchTabs[prevIndex].id);
          }
        }
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Filter display matches based on selected tab and showOnlyFavorites mode
  const getFilteredMatches = () => {
    let result = allDisplayMatches;

    // Filter by selected tab
    if (selectedTab === 'yesterday') {
      result = result.filter((m) => m.date === getRelativeDateStr(-1));
    } else if (selectedTab === 'live') {
      result = result.filter((m) => m.status === MatchStatus.LIVE || m.status === MatchStatus.HT);
    } else if (selectedTab === 'today') {
      result = result.filter((m) => m.date === getRelativeDateStr(0) || m.status === MatchStatus.LIVE || m.status === MatchStatus.HT);
    } else if (selectedTab === 'tomorrow') {
      result = result.filter((m) => m.date === getRelativeDateStr(1));
    } else {
      // Specific date string (e.g. '2026-07-18')
      result = result.filter((m) => m.date === selectedTab);
    }

    // Filter by favorites if toggled
    if (showOnlyFavorites) {
      result = result.filter((m) => favorites.matches.includes(m.id));
    }

    // Filter out duplicated/less-important matches of the same matchup
    const matchupGroups: { [key: string]: Match[] } = {};
    result.forEach((m) => {
      const key = m.id;
      if (!matchupGroups[key]) {
        matchupGroups[key] = [];
      }
      matchupGroups[key].push(m);
    });

    const finalResult: Match[] = [];
    Object.values(matchupGroups).forEach((group) => {
      if (group.length === 1) {
        finalResult.push(group[0]);
      } else {
        // Sort by status priority: LIVE or HT (3) > FINISHED (2) > SCHEDULED (1)
        group.sort((a, b) => {
          const getPriority = (status: MatchStatus) => {
            if (status === MatchStatus.LIVE || status === MatchStatus.HT) return 3;
            if (status === MatchStatus.FINISHED) return 2;
            return 1;
          };
          return getPriority(b.status) - getPriority(a.status);
        });
        finalResult.push(group[0]);
      }
    });

    return finalResult;
  };

  const filteredMatches = getFilteredMatches();

  // Group matches by championship
  const matchesByLeague: { [leagueName: string]: Match[] } = {};
  filteredMatches.forEach((match) => {
    if (!matchesByLeague[match.championshipName]) {
      matchesByLeague[match.championshipName] = [];
    }
    matchesByLeague[match.championshipName].push(match);
  });

  // Sort matches inside each championship by time (horário)
  Object.keys(matchesByLeague).forEach((leagueName) => {
    matchesByLeague[leagueName].sort((a, b) => a.time.localeCompare(b.time));
  });

  const handlePredictorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPredictionSubmitted(true);
    setTimeout(() => {
      setShowPromoModal(false);
      setPredictionSubmitted(false);
    }, 3500);
  };

  return (
    <div className="bg-white min-h-screen pb-24 flex flex-col select-none">
      {/* 1. DATE TAB NAVIGATION (BeSoccer Style, dynamic background, horizontal scrolling) */}
      <div className={`${activeColor.bg} w-full border-b ${activeColor.border} sticky top-13 z-30`}>
        <div className="w-full flex items-center space-x-4 px-2.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] h-10">
          {matchTabs.map((tab) => {
            const isToday = tab.id === 'today';
            const isActive = selectedTab === tab.id;
            const count = tab.getCount();
            
            // Format labels like 'AO VIVO (44)'
            let displayLabel = tab.label;
            if (count > 0) {
              displayLabel = `${tab.label} (${count})`;
            }

            return (
              <button
                id={`tab-${tab.id}`}
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                className={`h-full flex items-center justify-center text-[11px] uppercase whitespace-nowrap transition-all relative cursor-pointer select-none shrink-0 ${
                  isToday && isActive
                    ? 'bg-white text-zinc-950 px-3 py-1 rounded-full text-[11px] font-black shadow-md border-0 self-center h-7 my-auto'
                    : isActive
                      ? 'border-b-3 border-white text-white font-black px-1.5'
                      : `border-b-3 border-transparent ${activeColor.tabText} font-bold px-1.5`
                }`}
              >
                {tab.isLive && count > 0 && (
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping absolute top-2 right-0.5" />
                )}
                <span>{displayLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main layout container */}
      <div className="w-full mx-auto">
        
        {/* Hidden internal helper inputs to listen to simulated events from BottomNav */}
        <div className="hidden">
          <button id="filter-all" onClick={() => setShowOnlyFavorites(false)}></button>
          <button id="filter-favorites" onClick={() => setShowOnlyFavorites(true)}></button>
        </div>

        {/* 2. NEUTRAL mSOCCER PREDICTOR INFO ROW */}
        <div 
          onClick={() => {
            if (filteredMatches.length > 0) {
              setSelectedMatchId(filteredMatches[0].id);
            }
            setShowPromoModal(true);
          }}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800/80 cursor-pointer transition-all rounded-none shadow-none flex items-center justify-between"
        >
          <div className="flex items-center space-x-3 pr-2">
            <div className={`w-8 h-8 rounded-full ${activeColor.bg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-none`}>
              🔮
            </div>
            <div className="leading-tight">
              <h4 className="text-[10.5px] font-extrabold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide flex items-center space-x-1.5">
                <span>Predictor mSoccer</span>
                <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 text-[8px] font-black px-1.5 py-0.5 tracking-wider">
                  GRÁTIS
                </span>
              </h4>
              <p className="text-[9.5px] text-zinc-500 dark:text-zinc-400 font-medium line-clamp-1 mt-0.5">
                Faça seu palpite para o jogo da rodada! Toque para participar.
              </p>
            </div>
          </div>
          <button className={`${activeColor.bg} hover:opacity-90 text-white text-[9.5px] font-extrabold px-3 py-1.5 uppercase tracking-wider shrink-0 transition-colors shadow-none border-0`}>
            Palpitar
          </button>
        </div>

        {/* 3. QUICK TABELA LINK ROW */}
        <div 
          onClick={() => navigateTo({ type: 'tabela' })}
          className="w-full px-4 py-2.5 bg-zinc-50 hover:bg-zinc-100 border-b border-zinc-200/60 flex items-center justify-between cursor-pointer transition-all rounded-none shadow-none"
        >
          <div className="flex items-center space-x-2.5">
            <span className="text-base select-none">📊</span>
            <div>
              <h3 className="text-[10.5px] font-bold text-zinc-700 leading-none">Classificações e Estatísticas</h3>
              <p className="text-[8.5px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">Tabela completa de campeonatos e clubes</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
        </div>

        {/* 4. BE-SOCCER SECTION TITLE (FAVORITOS OR PARTIDAS) WITH CLICKABLE TOGGLE */}
        <div 
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          className="bg-white border-b border-zinc-200/80 px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50/50 transition-colors select-none"
        >
          <div className="flex items-center space-x-2">
            <Star className={`w-4.5 h-4.5 transition-all ${showOnlyFavorites ? 'text-yellow-400 fill-yellow-400 scale-105' : 'text-zinc-400'}`} />
            <h2 className="text-[11.5px] font-black text-zinc-800 uppercase tracking-widest">
              {showOnlyFavorites ? 'MEUS FAVORITOS' : 'TODAS AS PARTIDAS'}
            </h2>
          </div>
          <div className={`text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border transition-all ${
            showOnlyFavorites 
              ? 'bg-yellow-50 text-yellow-700 border-yellow-200/60' 
              : 'bg-zinc-100 text-zinc-500 border-zinc-200/50'
          }`}>
            {showOnlyFavorites ? 'Ver Todas' : 'Ver Favoritos'}
          </div>
        </div>

        {/* 5. MATCH FEED GROUPS (100% WIDTH, NO CARDS, EDGE-TO-EDGE, SWIPEABLE & SLIDING) */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full bg-white overflow-hidden relative"
        >
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={selectedTab}
              initial={{ x: slideDirection === 'left' ? '100%' : '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: slideDirection === 'left' ? '-100%' : '100%', opacity: 0 }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.22 }}
              className="w-full"
            >
              <div className="w-full divide-y divide-zinc-150">
                {filteredMatches.length === 0 ? (
                  <div className="py-12 px-6 text-center text-zinc-500 space-y-1">
                    <p className="text-[12px] font-bold">Nenhuma partida agendada para este dia.</p>
                    <p className="text-[10px] text-zinc-400">Tente favoritar clubes nas outras abas ou mude a data acima.</p>
                  </div>
                ) : (
                  Object.keys(matchesByLeague).sort().map((leagueName, leagueIndex, leagueArray) => {
                    const leagueMatches = matchesByLeague[leagueName];
                    
                    return (
                      <React.Fragment key={leagueName}>
                        <div className="w-full flex flex-col">
                          {/* COMPETITION HEADER - OCCUPIES 100% WIDTH EDGE-TO-EDGE */}
                          <div className="bg-[#F4F4F6] border-y border-zinc-200/60 py-1.5 px-4 flex items-center justify-between select-none">
                            <span className="text-[10.5px] font-black text-zinc-600 uppercase tracking-wider">
                              {leagueName}
                            </span>
                            <span className="text-[8.5px] text-zinc-400 font-bold uppercase tracking-widest">
                              {leagueMatches.length} jogos
                            </span>
                          </div>

                          {/* CONTINUOUS MATCH LIST UNDER COMPETITION (NO ADS INSIDE MATCHES) */}
                          <div className="w-full divide-y divide-zinc-100 bg-white">
                            {leagueMatches.map((match) => {
                              const isFav = favorites?.matches?.includes(match.id) || false;
                              const isLive = match.status === MatchStatus.LIVE || match.status === MatchStatus.HT;
                              const isFinishedOrLive = match.status === MatchStatus.FINISHED || match.status === MatchStatus.LIVE || match.status === MatchStatus.HT;
                              const isHomeWinner = isFinishedOrLive && match.score.home > match.score.away;
                              const isAwayWinner = isFinishedOrLive && match.score.away > match.score.home;
                              
                              return (
                                <div
                                  key={match.id}
                                  onClick={() => navigateTo({ type: 'match', id: match.id })}
                                  className="w-full flex items-center py-2 pl-9 pr-9 hover:bg-zinc-50/70 transition-all cursor-pointer select-none relative"
                                >
                                  {/* Symmetrical Absolute Placements for Side Controls */}
                                  {/* Column 1: Star icon for Favorite (Absolutely positioned on the left) */}
                                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center z-10">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite('matches', match.id);
                                      }}
                                      className="p-1 text-zinc-300 hover:text-yellow-400 transition-colors cursor-pointer"
                                    >
                                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-300'}`} />
                                    </button>
                                  </div>

                                  {/* Column 2: Home Team (Right-aligned, flex-1) */}
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigateTo({ type: 'club', id: match.homeClubId });
                                    }}
                                    className="flex-1 min-w-0 flex items-center justify-end space-x-2 text-right cursor-pointer group pr-2"
                                  >
                                    <span className={`text-[12px] break-words whitespace-normal max-w-[130px] group-hover:text-[#3C8C21] transition-colors leading-snug ${
                                      isHomeWinner 
                                        ? 'font-black text-black dark:text-white' 
                                        : (isAwayWinner ? 'font-normal text-zinc-400 dark:text-zinc-500' : 'font-medium text-zinc-800 dark:text-zinc-200')
                                    }`}>
                                      {match.homeClubName}
                                    </span>
                                    <img
                                      src={match.homeClubLogo}
                                      alt={match.homeClubName}
                                      className="w-5.5 h-5.5 rounded-full object-contain bg-zinc-50 shrink-0 border border-zinc-100/40"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>

                                  {/* Column 3: Central Time/Score Column (Fixed width, dead center) */}
                                  <div className="w-20 shrink-0 flex flex-col items-center justify-center text-center">
                                    {match.status === MatchStatus.SCHEDULED ? (
                                      <div className="flex flex-col items-center justify-center">
                                        <span className="text-[11.5px] font-black text-zinc-800 font-mono tracking-tight">
                                          {match.time}
                                        </span>
                                        <span className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                                          AGEND
                                        </span>
                                      </div>
                                    ) : match.status === MatchStatus.POSTPONED ? (
                                      <div className="flex flex-col items-center justify-center">
                                        <span className="text-[11.5px] font-black text-zinc-500 font-mono tracking-tight line-through">
                                          {match.time}
                                        </span>
                                        <span className="text-[8px] bg-amber-100 text-amber-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider mt-0.5">
                                          ADIADO
                                        </span>
                                      </div>
                                    ) : isLive ? (
                                      <div className="flex flex-col items-center justify-center">
                                        <span className="text-[13px] font-mono tracking-tight leading-none">
                                          <span className={isHomeWinner ? 'font-black text-rose-600' : (isAwayWinner ? 'font-normal text-zinc-500' : 'font-black text-rose-600')}>{match.score.home}</span>
                                          <span className="text-zinc-400 font-normal px-0.5">-</span>
                                          <span className={isAwayWinner ? 'font-black text-rose-600' : (isHomeWinner ? 'font-normal text-zinc-500' : 'font-black text-rose-600')}>{match.score.away}</span>
                                        </span>
                                        <span className="text-[8px] text-rose-600 font-extrabold uppercase tracking-widest mt-1 flex items-center space-x-1 justify-center animate-pulse">
                                          <span className="h-1 w-1 bg-rose-600 rounded-full shrink-0"></span>
                                          <span>
                                            {match.status === MatchStatus.HT ? 'INT' : formatMatchMinute(match.minute, match.injuryTime1stHalf, match.injuryTime2ndHalf)}
                                          </span>
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center justify-center">
                                        <span className="text-[12.5px] font-mono tracking-tight leading-none">
                                          <span className={isHomeWinner ? 'font-black text-black dark:text-white' : (isAwayWinner ? 'font-normal text-zinc-400' : 'font-bold text-zinc-700 dark:text-zinc-300')}>{match.score.home}</span>
                                          <span className="text-zinc-400 font-normal px-0.5">-</span>
                                          <span className={isAwayWinner ? 'font-black text-black dark:text-white' : (isHomeWinner ? 'font-normal text-zinc-400' : 'font-bold text-zinc-700 dark:text-zinc-300')}>{match.score.away}</span>
                                        </span>
                                        <span className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                                          FIM
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Column 4: Away Team (Left-aligned, flex-1) */}
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigateTo({ type: 'club', id: match.awayClubId });
                                    }}
                                    className="flex-1 min-w-0 flex items-center justify-start space-x-2 text-left cursor-pointer group pl-2"
                                  >
                                    <img
                                      src={match.awayClubLogo}
                                      alt={match.awayClubName}
                                      className="w-5.5 h-5.5 rounded-full object-contain bg-zinc-50 shrink-0 border border-zinc-100/40"
                                      referrerPolicy="no-referrer"
                                    />
                                    <span className={`text-[12px] break-words whitespace-normal max-w-[130px] group-hover:text-[#3C8C21] transition-colors leading-snug ${
                                      isAwayWinner 
                                        ? 'font-black text-black dark:text-white' 
                                        : (isHomeWinner ? 'font-normal text-zinc-400 dark:text-zinc-500' : 'font-medium text-zinc-800 dark:text-zinc-200')
                                    }`}>
                                      {match.awayClubName}
                                    </span>
                                  </div>

                                  {/* Column 5: Right Chevron navigation target (Absolutely positioned on the right) */}
                                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center text-zinc-300 z-10">
                                    <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* BESOCCER VIDEO AD BANNER - ONLY BETWEEN COMPETITIONS */}
                        {leagueIndex < leagueArray.length - 1 && (
                          <div className="w-full my-2">
                            <CompetitionAdBanner />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* IN-LINE AD BANNER BETWEEN MATCHES SECTION AND RECOMMENDED NEWS */}
        <div className="w-full my-4">
          <CompetitionAdBanner />
        </div>

        {/* 6. COMPACT BE-SOCCER NEWS CAROUSEL AT FOOTER */}
        <div className="mt-6 border-t border-zinc-200/80 pt-4 px-4 space-y-3 pb-8">
          <div className="flex items-center space-x-2">
            <span className="text-sm">📰</span>
            <h3 className="text-[11px] font-black text-zinc-600 uppercase tracking-widest">
              Notícias Recomendadas
            </h3>
          </div>
          <div className="grid gap-2">
            {news.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => navigateTo({ type: 'noticias' })}
                className="bg-[#fafafa] hover:bg-zinc-100/80 border border-zinc-200/50 rounded-lg overflow-hidden transition-all cursor-pointer p-2.5 flex items-center space-x-3.5 shadow-sm"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-16 h-14 object-cover rounded shrink-0 border border-zinc-200/20"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex justify-between items-center text-[7.5px] font-extrabold uppercase tracking-wider text-[#3C8C21]">
                    <span>{item.category}</span>
                    <span className="text-zinc-400">{item.publishedAt.split(' ')[0]}</span>
                  </div>
                  <h4 className="font-extrabold text-[10.5px] text-zinc-800 line-clamp-1 leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[9px] text-zinc-400 line-clamp-1">
                    {item.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 7. INTERACTIVE PREDICTOR GAME MODAL */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setShowPromoModal(false)}
          ></div>
          
          <div className="relative bg-white border border-zinc-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Design Banner inside Modal */}
            <div className={`absolute top-0 left-0 right-0 h-2 ${activeColor.bg}`}></div>
            
            <div className="flex justify-between items-start pt-2 mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-bounce" />
                <h3 className="font-black text-slate-800 text-base uppercase tracking-wider">
                  {translations[language].predictorTitulo}
                </h3>
              </div>
              <button 
                onClick={() => setShowPromoModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {predictionSubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className={`w-16 h-16 bg-slate-100 ${activeColor.text} rounded-full flex items-center justify-center mx-auto text-3xl font-bold animate-pulse`}>
                  ✓
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-slate-900 text-sm">{translations[language].palpiteSucesso}</h4>
                  <p className="text-xs text-slate-500 px-4 leading-relaxed">
                    {translations[language].apostouEm} <span className="font-bold text-slate-800">{predictedHome} x {predictedAway}</span>. {translations[language].multiplicadorEstimado} <span className={`${activeColor.text} font-extrabold font-mono text-sm`}>3.45x</span>.
                  </p>
                  <p className={`text-[10.5px] ${activeColor.text} font-bold italic pt-2`}>
                    {translations[language].dicaAdmin}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePredictorSubmit} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <span className={`font-bold uppercase text-[9.5px] ${activeColor.text} block`}>{translations[language].comoFunciona}</span>
                  <p>{translations[language].comoFuncionaDesc}</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block">{translations[language].escolhaPartida}</label>
                    <select
                      value={selectedMatchId}
                      onChange={(e) => setSelectedMatchId(e.target.value)}
                      className="w-full bg-slate-100 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-300"
                    >
                      {allDisplayMatches.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.homeClubName} vs {m.awayClubName} ({m.championshipName.replace(/🇺🇳|🇲🇿|🇪🇺|🇪🇸|🇧🇷/g, '').trim()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase truncate block">{translations[language].golsCasa}</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={predictedHome}
                        onChange={(e) => setPredictedHome(e.target.value)}
                        className="w-full text-center bg-slate-100 border border-slate-200 font-mono font-black text-lg rounded-xl py-2 focus:outline-none focus:ring-1 focus:ring-slate-300"
                      />
                    </div>
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase truncate block">{translations[language].golsFora}</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={predictedAway}
                        onChange={(e) => setPredictedAway(e.target.value)}
                        className="w-full text-center bg-slate-100 border border-slate-200 font-mono font-black text-lg rounded-xl py-2 focus:outline-none focus:ring-1 focus:ring-slate-300"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full ${activeColor.bg} hover:opacity-95 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm`}
                >
                  {translations[language].confirmarPalpite} (Odds 3.45)
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
