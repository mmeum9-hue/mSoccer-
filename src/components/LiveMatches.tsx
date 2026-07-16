import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { MatchStatus, Match, formatMatchMinute } from '../types';
import { Star, Trophy, MapPin, ChevronRight, Eye, Calendar, Award, CheckCircle, Info, Sparkles, X } from 'lucide-react';

export const LiveMatches: React.FC = () => {
  const { matches, championships, news, favorites, toggleFavorite, navigateTo, updateMatch, user, language } = useApp();
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  
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
  const matchTabs = [
    { id: 'yesterday', label: 'Ontem', isLive: false, getCount: () => allDisplayMatches.filter(m => m.date === getRelativeDateStr(-1) && m.status === MatchStatus.FINISHED).length },
    { id: 'live', label: 'Ao Vivo', isLive: true, getCount: () => allDisplayMatches.filter(m => m.status === MatchStatus.LIVE || m.status === MatchStatus.HT).length },
    { id: 'today', label: 'Hoje', isLive: false, getCount: () => allDisplayMatches.filter(m => m.date === getRelativeDateStr(0)).length },
    { id: 'tomorrow', label: 'Amanhã', isLive: false, getCount: () => allDisplayMatches.filter(m => m.date === getRelativeDateStr(1)).length },
  ];

  // Add subsequent 12 days to cover dynamic future dates
  for (let i = 2; i <= 13; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = getRelativeDateStr(i);
    const label = formatTabDate(d);
    matchTabs.push({
      id: dateStr,
      label: label,
      isLive: false,
      getCount: () => allDisplayMatches.filter(m => m.date === dateStr).length
    });
  }

  // Filter display matches based on selected tab and showOnlyFavorites mode
  const getFilteredMatches = () => {
    let result = allDisplayMatches;

    // Filter by selected tab
    if (selectedTab === 'yesterday') {
      result = result.filter((m) => m.date === getRelativeDateStr(-1) && m.status === MatchStatus.FINISHED);
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
      const key = `${m.homeClubId || m.homeClubName}_${m.awayClubId || m.awayClubName}`;
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
  const liveCount = allDisplayMatches.filter(m => m.status === MatchStatus.LIVE || m.status === MatchStatus.HT).length;

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
    <div className="space-y-4 pb-24">
      <div className="max-w-6xl mx-auto px-3.5 space-y-4 pt-4">
        {/* Hidden internal helper inputs to listen to simulated events from BottomNav */}
        <div className="hidden">
          <button id="filter-all" onClick={() => setShowOnlyFavorites(false)}></button>
          <button id="filter-favorites" onClick={() => setShowOnlyFavorites(true)}></button>
        </div>

        {/* Quick standings link */}
        <div 
          onClick={() => navigateTo({ type: 'tabela' })}
          className="bg-gradient-to-r from-[#1E3A8A] to-blue-600 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between cursor-pointer hover:opacity-95 transition-all border border-blue-500/10"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="font-bold text-sm leading-tight">{translations[language].tabelaClassificacao}</h3>
              <p className="text-[10px] text-blue-100 font-semibold uppercase tracking-wider mt-0.5">{translations[language].pontuacaoEstatisticas}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-100 shrink-0" />
        </div>

        {/* Date/Status Tab Bar with automatic dates and horizontal scrolling */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800/40 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {matchTabs.map((tab) => {
            const isActive = selectedTab === tab.id;
            const count = tab.getCount();
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex-none py-2 px-3 rounded-lg text-[11px] font-black tracking-wide uppercase transition-all flex items-center justify-center space-x-1.5 cursor-pointer relative select-none shrink-0 ${
                  isActive
                    ? 'bg-white dark:bg-[#1E293B] text-[#1E3A8A] dark:text-blue-400 shadow-sm border border-slate-200/30 dark:border-slate-700/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.isLive && count > 0 && (
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping absolute top-1 right-2" />
                )}
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={`text-[8.5px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? tab.isLive ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' : 'bg-blue-100 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400'
                      : tab.isLive ? 'bg-rose-500/15 text-rose-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. MAIN "FAVORITOS" & CHAMPIONSHIPS CONTAINER */}
        <div className="bg-[#131F32] border border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
          {/* Card Header matching the screenshot exactly */}
          <div className="bg-[#1A2536] px-4 py-3.5 border-b border-slate-800/40 flex items-center space-x-2">
            <Star className="w-4 h-4 text-slate-100 fill-slate-100" />
            <h2 className="text-xs font-black text-slate-100 uppercase tracking-wider">
              {showOnlyFavorites ? translations[language].favoritos : translations[language].partidas}
            </h2>
          </div>

          {/* Grouped Matches Content in a sleek vertical list */}
          <div className="divide-y divide-slate-800/50">
            {filteredMatches.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1.5 bg-[#131F32]">
                <p className="text-xs font-medium">{translations[language].nenhumaPartida}</p>
                <p className="text-[10px] text-slate-500">{translations[language].favoritarInstrucao}</p>
              </div>
            ) : (
              filteredMatches.map((match) => {
                const isFav = favorites?.matches?.includes(match.id) || false;
                const isLiveMatch = match.status === MatchStatus.LIVE || match.status === MatchStatus.HT;
                
                // Determine header layout and labels dynamically to match the screenshot
                let headerLeft = '';
                let statusBadge = null;

                if (match.status === MatchStatus.LIVE) {
                  headerLeft = match.championshipName;
                  statusBadge = (
                    <span className="text-[8px] text-rose-400 font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/10 px-2 py-0.5 rounded-sm flex items-center space-x-1">
                      <span className="flex h-1 w-1 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1 w-1 bg-rose-500"></span>
                      </span>
                      <span>Ao Vivo • {formatMatchMinute(match.minute, match.injuryTime1stHalf, match.injuryTime2ndHalf)}</span>
                    </span>
                  );
                } else if (match.status === MatchStatus.HT) {
                  headerLeft = `Intervalo • ${match.championshipName}`;
                  statusBadge = (
                    <span className="text-[8px] text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/10 px-2 py-0.5 rounded-sm flex items-center space-x-1">
                      <span className="h-1 w-1 rounded-full bg-amber-500 shrink-0"></span>
                      <span>Intervalo</span>
                    </span>
                  );
                } else if (match.status === MatchStatus.FINISHED) {
                  headerLeft = `Finalizado • ${match.championshipName}`;
                  statusBadge = (
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider bg-slate-800/60 border border-slate-700/10 px-2 py-0.5 rounded-sm">
                      Finalizado
                    </span>
                  );
                } else {
                  headerLeft = `${match.time} • ${match.championshipName}`;
                  statusBadge = (
                    <span className="text-[8px] text-blue-400 font-bold uppercase tracking-wider bg-blue-900/30 border border-blue-500/15 px-2 py-0.5 rounded-sm">
                      Agendado
                    </span>
                  );
                }

                return (
                  <div
                    key={match.id}
                    onClick={() => navigateTo({ type: 'match', id: match.id })}
                    className="p-4 hover:bg-[#1A263B]/30 transition-colors cursor-pointer space-y-3 select-none"
                  >
                    {/* Mini Header Row: Time, Championship & Status */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span className="truncate max-w-[70%]">{headerLeft}</span>
                      <span>{statusBadge}</span>
                    </div>

                    {/* Team Entries Match Row */}
                    <div className="flex items-center justify-between">
                      {/* Favorite Button (Star) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite('matches', match.id);
                        }}
                        className="w-7 flex-none text-slate-400 hover:text-yellow-400 transition-colors cursor-pointer text-left"
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </button>

                      {/* Home Team Side */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo({ type: 'club', id: match.homeClubId });
                        }}
                        className="flex-1 flex items-center justify-end space-x-2 text-right group/home truncate"
                      >
                        <span className="text-xs font-black text-slate-100 uppercase tracking-wide group-hover/home:text-blue-400 transition-colors truncate">
                          {match.homeClubName}
                        </span>
                        <img
                          src={match.homeClubLogo}
                          alt={match.homeClubName}
                          className="w-6 h-6 rounded-full object-cover bg-slate-800 shrink-0 border border-slate-700/50 group-hover/home:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* VS / Score Badge Column */}
                      <div className="w-16 flex-none flex justify-center">
                        {match.status === MatchStatus.SCHEDULED ? (
                          <div className="bg-[#1C2C42] px-3 py-0.5 rounded-full text-[10px] font-black text-slate-400 font-mono tracking-wider text-center select-none border border-slate-800/40">
                            VS
                          </div>
                        ) : (
                          <div className={`px-2.5 py-0.5 rounded text-xs font-black font-mono tracking-tight text-center select-none border ${isLiveMatch ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-800/80 text-slate-300 border-slate-700/30'}`}>
                            {match.score.home} - {match.score.away}
                          </div>
                        )}
                      </div>

                      {/* Away Team Side */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo({ type: 'club', id: match.awayClubId });
                        }}
                        className="flex-1 flex items-center justify-start space-x-2 text-left group/away truncate"
                      >
                        <img
                          src={match.awayClubLogo}
                          alt={match.awayClubName}
                          className="w-6 h-6 rounded-full object-cover bg-slate-800 shrink-0 border border-slate-700/50 group-hover/away:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-xs font-black text-slate-100 uppercase tracking-wide group-hover/away:text-blue-400 transition-colors truncate">
                          {match.awayClubName}
                        </span>
                      </div>

                      {/* Chevron Navigation Indicator */}
                      <div className="w-6 flex-none flex justify-end text-slate-500">
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 4. BEAUTIFUL SOCCER NEWS INSIGHTS CAROUSEL */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
            📰 Notícias Recomendadas
          </h3>
          <div className="grid gap-3.5">
            {news.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => navigateTo({ type: 'noticias' })}
                className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden hover:border-[#1E3A8A] transition-all cursor-pointer shadow-sm flex flex-col sm:flex-row"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-32 sm:w-36 w-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-[#1E3A8A]">
                      <span>{item.category}</span>
                      <span className="text-zinc-400">{item.publishedAt.split(' ')[0]}</span>
                    </div>
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-white line-clamp-2 leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-1">
                      {item.summary}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-[8.5px] text-zinc-400 font-semibold pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-1">
                    <Eye className="w-3 h-3" />
                    <span>{item.views.toLocaleString()} visualizações</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE 1xBET PREDICTOR GAME MODAL */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setShowPromoModal(false)}
          ></div>
          
          <div className="relative bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Design Banner inside Modal */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#0081C9]"></div>
            
            <div className="flex justify-between items-start pt-2 mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-bounce" />
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-base uppercase tracking-wider">
                  {translations[language].predictorTitulo}
                </h3>
              </div>
              <button 
                onClick={() => setShowPromoModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {predictionSubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold animate-pulse">
                  ✓
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{translations[language].palpiteSucesso}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 px-4 leading-relaxed">
                    {translations[language].apostouEm} <span className="font-bold text-slate-800 dark:text-slate-200">{predictedHome} x {predictedAway}</span>. {translations[language].multiplicadorEstimado} <span className="text-blue-600 font-extrabold font-mono text-sm">3.45x</span>.
                  </p>
                  <p className="text-[10.5px] text-[#1E3A8A] font-bold italic pt-2">
                    {translations[language].dicaAdmin}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePredictorSubmit} className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                  <span className="font-bold uppercase text-[9.5px] text-[#0081C9] block">{translations[language].comoFunciona}</span>
                  <p>{translations[language].comoFuncionaDesc}</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block">{translations[language].escolhaPartida}</label>
                    <select
                      value={selectedMatchId}
                      onChange={(e) => setSelectedMatchId(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#0081C9]"
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
                        className="w-full text-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-black text-lg rounded-xl py-2 focus:outline-none focus:ring-1 focus:ring-[#0081C9]"
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
                        className="w-full text-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-black text-lg rounded-xl py-2 focus:outline-none focus:ring-1 focus:ring-[#0081C9]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0081C9] hover:bg-[#006FA3] text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
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
