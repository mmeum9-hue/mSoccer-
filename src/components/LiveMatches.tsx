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
  const [selectedTab, setSelectedTab] = useState<'yesterday' | 'today' | 'live' | 'tomorrow' | 'all'>('today');

  // Dynamic relative date helper
  const getRelativeDateStr = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const allDisplayMatches = matches.map(m => ({
    ...m,
    championshipName: getMappedChampionshipName(m.championshipName)
  }));

  // Match counts for Yesterday, Today, Live, and Tomorrow tabs
  const yesterdayMatchesCount = allDisplayMatches.filter(m => m.date === getRelativeDateStr(-1)).length;
  const todayMatchesCount = allDisplayMatches.filter(m => m.date === getRelativeDateStr(0)).length;
  const liveMatchesCount = allDisplayMatches.filter(m => m.status === MatchStatus.LIVE || m.status === MatchStatus.HT).length;
  const tomorrowMatchesCount = allDisplayMatches.filter(m => m.date === getRelativeDateStr(1)).length;
  const allMatchesCount = allDisplayMatches.length;

  // Filter display matches based on selected tab and showOnlyFavorites mode
  const getFilteredMatches = () => {
    let result = allDisplayMatches;

    // Filter by selected tab
    if (selectedTab === 'yesterday') {
      result = result.filter((m) => m.date === getRelativeDateStr(-1));
    } else if (selectedTab === 'today') {
      result = result.filter((m) => m.date === getRelativeDateStr(0));
    } else if (selectedTab === 'live') {
      result = result.filter((m) => m.status === MatchStatus.LIVE || m.status === MatchStatus.HT);
    } else if (selectedTab === 'tomorrow') {
      result = result.filter((m) => m.date === getRelativeDateStr(1));
    } else if (selectedTab === 'all') {
      // Show all matches without filtering by date
    }

    // Filter by favorites if toggled
    if (showOnlyFavorites) {
      result = result.filter((m) => favorites.matches.includes(m.id));
    }

    return result;
  };

  const filteredMatches = getFilteredMatches();
  const liveCount = liveMatchesCount;

  // Group matches by championship
  const matchesByLeague: { [leagueName: string]: Match[] } = {};
  filteredMatches.forEach((match) => {
    if (!matchesByLeague[match.championshipName]) {
      matchesByLeague[match.championshipName] = [];
    }
    matchesByLeague[match.championshipName].push(match);
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

        {/* Date/Status Tab Bar: ONTEM, HOJE, AO VIVO, AMANHÃ, TODAS */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800/40 overflow-x-auto">
          {[
            { id: 'yesterday', label: translations[language].ontem, count: yesterdayMatchesCount, isLive: false },
            { id: 'today', label: translations[language].hoje, count: todayMatchesCount, isLive: false },
            { id: 'live', label: translations[language].aoVivo, count: liveMatchesCount, isLive: true },
            { id: 'tomorrow', label: translations[language].amanha, count: tomorrowMatchesCount, isLive: false },
            { id: 'all', label: translations[language].todas, count: allMatchesCount, isLive: false }
          ].map((tab) => {
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex-1 py-2 px-1 rounded-lg text-[11px] font-black tracking-wide uppercase transition-all flex items-center justify-center space-x-1.5 cursor-pointer relative select-none ${
                  isActive
                    ? 'bg-white dark:bg-[#1E293B] text-[#1E3A8A] dark:text-blue-400 shadow-sm border border-slate-200/30 dark:border-slate-700/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.isLive && tab.count > 0 && (
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping absolute top-1 right-2" />
                )}
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-[8.5px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? tab.isLive ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' : 'bg-blue-100 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400'
                      : tab.isLive ? 'bg-rose-500/15 text-rose-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. MAIN "FAVORITOS" & CHAMPIONSHIPS CONTAINER */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
          {/* Card Header matching the screenshot exactly */}
          <div className="bg-slate-50 dark:bg-slate-900/40 px-4 py-3 border-b border-slate-200 dark:border-slate-800/60 flex items-center space-x-2">
            <Star className={`w-4 h-4 ${showOnlyFavorites ? 'text-yellow-500 fill-yellow-500' : 'text-slate-500 fill-slate-500'}`} />
            <h2 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              {showOnlyFavorites ? translations[language].favoritos : translations[language].partidas}
            </h2>
          </div>

          {/* Grouped Matches Content */}
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {Object.keys(matchesByLeague).length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 space-y-1.5">
                <p className="text-xs font-medium">{translations[language].nenhumaPartida}</p>
                <p className="text-[10px] text-slate-400">{translations[language].favoritarInstrucao}</p>
              </div>
            ) : (
              Object.keys(matchesByLeague).map((leagueName) => (
                <div key={leagueName} className="bg-white dark:bg-[#1E293B]">
                  {/* League/Championship Sub-header inside Card */}
                  <div className="bg-slate-50/40 dark:bg-slate-900/10 px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                      <span>{leagueName}</span>
                    </span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      Ao Vivo
                    </span>
                  </div>

                  {/* Matches entries list */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {matchesByLeague[leagueName].map((match) => {
                      const isFav = favorites?.matches?.includes(match.id) || false;
                      return (
                        <div
                          key={match.id}
                          className="flex flex-col py-3 px-4 hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors"
                        >
                          {/* Main Row: Info, Teams, Score */}
                          <div className="flex items-center justify-between w-full">
                            {/* Left: Star Only */}
                            <div className="w-[10%] shrink-0 flex items-center justify-start">
                              <button
                                onClick={() => toggleFavorite('matches', match.id)}
                                className="p-1 text-slate-300 hover:text-yellow-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                title="Favoritar partida"
                              >
                                <Star className={`w-4 h-4 ${isFav ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                              </button>
                            </div>

                            {/* Center: Interactive Teams and Score */}
                            <div
                              onClick={() => navigateTo({ type: 'match', id: match.id })}
                              className="flex-1 flex items-center justify-between cursor-pointer px-1.5 select-none"
                            >
                              {/* Home Team */}
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateTo({ type: 'club', id: match.homeClubId });
                                }}
                                className="flex flex-col items-end justify-center w-[41%] text-right pr-1.5 min-w-0 group/home cursor-pointer select-none"
                              >
                                {(match.homeClubName === 'Inglaterra' || match.homeClubName === 'Bélgica') && (
                                  <span className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold block mb-0.5 truncate max-w-full uppercase tracking-wider leading-none">
                                    TV Miramar (Moz)
                                  </span>
                                )}
                                <div className="flex items-center space-x-2 justify-end w-full">
                                  <span className={`text-[11px] font-bold text-slate-800 dark:text-slate-100 group-hover/home:text-blue-600 dark:group-hover/home:text-blue-400 transition-colors truncate ${match.score.home > match.score.away && match.status === MatchStatus.FINISHED ? 'font-black' : 'font-semibold'}`}>
                                    {match.homeClubName}
                                  </span>
                                  <img
                                    src={match.homeClubLogo}
                                    alt={match.homeClubName}
                                    className="w-5.5 h-5.5 rounded-full object-cover bg-slate-50 shrink-0 shadow-xs border border-slate-100 dark:border-slate-800 group-hover/home:scale-110 transition-transform"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              </div>

                              {/* Live/Finished Score Box */}
                              <div className="flex flex-col items-center justify-center w-[18%] shrink-0 text-center">
                                {match.status === MatchStatus.LIVE || match.status === MatchStatus.HT ? (
                                  <>
                                    <span className="text-[12px] font-black text-blue-600 font-mono tracking-tighter leading-none">
                                      {match.score.home} - {match.score.away}
                                    </span>
                                    <span className="text-[8px] text-blue-500 font-black font-mono mt-0.5 tracking-tight leading-none flex items-center justify-center space-x-0.5">
                                      {match.status === MatchStatus.HT ? (
                                        'INT'
                                      ) : (
                                        formatMatchMinute(match.minute, match.injuryTime1stHalf, match.injuryTime2ndHalf)
                                      )}
                                    </span>
                                  </>
                                ) : match.status === MatchStatus.FINISHED ? (
                                  <>
                                    <span className="text-[12px] font-black text-slate-800 dark:text-slate-100 font-mono tracking-tighter leading-none">
                                      {match.score.home} - {match.score.away}
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-bold mt-0.5 leading-none uppercase">
                                      FIM
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[9px] font-bold text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded leading-none">
                                    {match.time}
                                  </span>
                                )}
                              </div>

                              {/* Away Team */}
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateTo({ type: 'club', id: match.awayClubId });
                                }}
                                className="flex items-center space-x-2 justify-start w-[41%] text-left pl-0.5 group/away cursor-pointer select-none"
                              >
                                <img
                                  src={match.awayClubLogo}
                                  alt={match.awayClubName}
                                  className="w-5.5 h-5.5 rounded-full object-cover bg-slate-50 shrink-0 shadow-xs border border-slate-100 dark:border-slate-800 group-hover/away:scale-110 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                                <span className={`text-[11px] text-slate-800 dark:text-slate-100 group-hover/away:text-blue-600 dark:group-hover/away:text-blue-400 transition-colors truncate ${match.score.away > match.score.home && match.status === MatchStatus.FINISHED ? 'font-black' : 'font-semibold'}`}>
                                  {match.awayClubName}
                                </span>
                              </div>
                            </div>

                            {/* Right: Chevron */}
                            <div className="w-[10%] flex justify-end shrink-0">
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
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
