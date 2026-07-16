import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MatchStatus, MatchEvent, formatMatchMinute } from '../types';
import { 
  ArrowLeft, Star, MapPin, User, ChevronRight, BarChart2, Shield, Flame, Activity, 
  ChevronDown, ChevronUp, TrendingDown, TrendingUp, Clock, Coins, Newspaper, Zap, AlertTriangle 
} from 'lucide-react';

interface MatchDetailsProps {
  matchId: string;
}

const getFormattedMatchDate = (dateStr: string, timeStr?: string) => {
  if (!dateStr) return 'DOMINGO 5 JUL.';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    const dateObj = new Date(year, month - 1, day);
    
    const daysOfWeek = [
      'DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 
      'QUINTA', 'SEXTA', 'SÁBADO'
    ];
    
    const months = [
      'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 
      'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
    ];
    
    if (isNaN(dateObj.getTime())) {
      return dateStr;
    }
    
    const dayName = daysOfWeek[dateObj.getDay()];
    const monthName = months[dateObj.getMonth()];
    
    const formattedDate = `${dayName} ${day} ${monthName}.`;
    if (timeStr) {
      return `${formattedDate} • ${timeStr}`;
    }
    return formattedDate;
  } catch (e) {
    return dateStr;
  }
};

export const MatchDetails: React.FC<MatchDetailsProps> = ({ matchId }) => {
  const { matches, championships, favorites, toggleFavorite, navigateBack, navigateTo, news, user, players } = useApp();
  const match = matches.find((m) => m.id === matchId);
  const champ = championships?.find(c => c.id === match?.championshipId);
  const displayPhase = match?.phase 
    ? match.phase 
    : (champ?.type === 'Copa' ? 'Oitavos de Final' : '');

  const [activeTab, setActiveTab] = useState<'formacoes' | 'eventos' | 'direto' | 'noticias' | 'previa'>(
    match?.status === MatchStatus.SCHEDULED ? 'previa' : 'eventos'
  );
  const [formacaoView, setFormacaoView] = useState<'campo' | 'lista'>('campo');
  
  // Collapse states for the event groups
  const [golsCollapsed, setGolsCollapsed] = useState(false);
  const [cardsCollapsed, setCardsCollapsed] = useState(false);
  const [subsCollapsed, setSubsCollapsed] = useState(false);

  // Match Preview specific states
  const [previaChampionshipOnly, setPreviaChampionshipOnly] = useState(false);
  const [h2hLimit, setH2hLimit] = useState(4);
  const [selectedH2HId, setSelectedH2HId] = useState<string | null>(null);

  if (!match) {
    return (
      <div className="text-center py-20 px-4 bg-slate-50 min-h-screen">
        <p className="text-zinc-500">Partida não encontrada.</p>
        <button
          onClick={navigateBack}
          className="mt-4 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl font-bold cursor-pointer"
        >
          Voltar para Jogos
        </button>
      </div>
    );
  }

  const isFav = favorites.matches.includes(match.id);
  const isInitialMatch = match.id.startsWith('match_yesterday_') || match.id.startsWith('match_today_') || match.id.startsWith('match_tomorrow_');

  // Let's create some beautiful, realistic mocked avatars for the goalscorers/VAR players to look extremely authentic!
  const getPlayerAvatar = (playerName: string) => {
    const hash = playerName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const id = (hash % 70) + 1;
    return `https://i.pravatar.cc/100?img=${id}`;
  };

  // Get goal events or fallback to rich mocked events to match the Brazilian/Norwegian screenshot
  const getGoalsEvents = () => {
    const goals = match.events.filter(e => e.type === 'Goal');
    if (goals.length > 0) return goals;

    // Only allow fallback for the original 3 mock matches
    const isOriginalMock = match.id === 'match_1' || match.id === 'match_2' || match.id === 'match_3';
    if (!isOriginalMock) return [];

    return [
      {
        id: 'g1',
        minute: 79,
        type: 'Goal' as const,
        team: 'away' as const,
        player1: 'E. Haaland',
        player2: 'A. Schjelderup',
        detail: 'Gol de cabeça'
      },
      {
        id: 'g2',
        minute: 90,
        type: 'Goal' as const,
        team: 'away' as const,
        player1: 'E. Haaland',
        player2: 'A. Schjelderup',
        detail: 'Chute cruzado'
      },
      {
        id: 'g3',
        minute: 90 + 10,
        type: 'Goal' as const,
        team: 'home' as const,
        player1: 'Neymar',
        detail: 'Pênalti'
      }
    ];
  };

  const getCardsEvents = () => {
    const cards = match.events.filter(e => e.type === 'YellowCard' || e.type === 'RedCard');
    if (cards.length > 0) return cards;

    // Only allow fallback for the original 3 mock matches
    const isOriginalMock = match.id === 'match_1' || match.id === 'match_2' || match.id === 'match_3';
    if (!isOriginalMock) return [];

    return [
      {
        id: 'c1',
        minute: 34,
        type: 'YellowCard' as const,
        team: 'away' as const,
        player1: 'Gustavo Gómez',
        detail: 'Falta dura na lateral'
      },
      {
        id: 'c2',
        minute: 82,
        type: 'YellowCard' as const,
        team: 'home' as const,
        player1: 'Vinícius Júnior',
        detail: 'Reclamação com a arbitragem'
      },
      {
        id: 'c3',
        minute: 88,
        type: 'RedCard' as const,
        team: 'away' as const,
        player1: 'Danilo',
        detail: 'Entrada violenta por trás'
      }
    ];
  };

  const getSubstitutionsEvents = () => {
    const subs = match.events.filter(e => e.type === 'Substitution');
    if (subs.length > 0) return subs;

    // Only allow fallback for the original 3 mock matches
    const isOriginalMock = match.id === 'match_1' || match.id === 'match_2' || match.id === 'match_3';
    if (!isOriginalMock) return [];

    return [
      {
        id: 'sub1',
        minute: 58,
        type: 'Substitution' as const,
        team: 'home' as const,
        player1: 'Jesus',
        player2: 'Vinícius Júnior',
        detail: 'Substituição tática'
      },
      {
        id: 'sub2',
        minute: 79,
        type: 'Substitution' as const,
        team: 'home' as const,
        player1: 'Daniel boa',
        player2: 'Rodrygo',
        detail: 'Substituição tática'
      },
      {
        id: 'sub3',
        minute: 46,
        type: 'Substitution' as const,
        team: 'away' as const,
        player1: 'Nada',
        player2: 'A. Schjelderup',
        detail: 'Substituição tática'
      }
    ];
  };

  const cardsList = getCardsEvents();
  const homeYellows = cardsList.filter(c => c.team === 'home' && c.type === 'YellowCard').length;
  const homeReds = cardsList.filter(c => c.team === 'home' && c.type === 'RedCard').length;
  const awayYellows = cardsList.filter(c => c.team === 'away' && c.type === 'YellowCard').length;
  const awayReds = cardsList.filter(c => c.team === 'away' && c.type === 'RedCard').length;

  // Helper functions for Preview
  const getRecentFormWithFallback = (clubId: string, clubName: string, clubLogo: string, filterByCurrentChampionship: boolean) => {
    let realMatches = matches.filter(m => {
      const involvesClub = m.homeClubId === clubId || m.awayClubId === clubId;
      const isFinished = m.status === MatchStatus.FINISHED;
      if (!involvesClub || !isFinished) return false;
      if (filterByCurrentChampionship) {
        return m.championshipId === match.championshipId;
      }
      return true;
    });

    realMatches.sort((a, b) => b.date.localeCompare(a.date));
    return realMatches.slice(0, 5);
  };

  const getMatchResult = (m: any, clubId: string): 'V' | 'E' | 'D' => {
    const isHome = m.homeClubId === clubId;
    const scoreHome = m.score.home;
    const scoreAway = m.score.away;
    if (scoreHome === scoreAway) return 'E';
    if (isHome) {
      return scoreHome > scoreAway ? 'V' : 'D';
    } else {
      return scoreAway > scoreHome ? 'V' : 'D';
    }
  };

  const getH2HWithFallback = () => {
    const realH2H = matches.filter(m => {
      const involvesBoth = 
        (m.homeClubId === match.homeClubId && m.awayClubId === match.awayClubId) ||
        (m.homeClubId === match.awayClubId && m.awayClubId === match.homeClubId);
      const isFinished = m.status === MatchStatus.FINISHED;
      return involvesBoth && isFinished;
    });

    realH2H.sort((a, b) => b.date.localeCompare(a.date));
    return realH2H;
  };

  const getStadiumInfo = (m: any) => {
    const name = m.stadium || 'Estádio Municipal';
    let cityCountry = 'Porto, Portugal';

    const lowerName = name.toLowerCase();
    if (lowerName.includes('maracanã') || m.homeClubName.includes('Flamengo') || m.homeClubName.includes('Fluminense')) {
      cityCountry = 'Rio de Janeiro, Brasil';
    } else if (lowerName.includes('bernabéu') || m.homeClubName.includes('Real Madrid')) {
      cityCountry = 'Madri, Espanha';
    } else if (lowerName.includes('camp nou') || m.homeClubName.includes('Barcelona')) {
      cityCountry = 'Barcelona, Espanha';
    } else if (lowerName.includes('allianz arena') || m.homeClubName.includes('Bayern')) {
      cityCountry = 'Munique, Alemanha';
    } else if (lowerName.includes('wembley') || lowerName.includes('emirates') || lowerName.includes('stamford') || m.homeClubName.includes('Chelsea') || m.homeClubName.includes('Arsenal')) {
      cityCountry = 'Londres, Inglaterra';
    } else if (lowerName.includes('etihad') || lowerName.includes('old trafford') || m.homeClubName.includes('Manchester')) {
      cityCountry = 'Manchester, Inglaterra';
    } else if (lowerName.includes('san siro') || m.homeClubName.includes('Milan') || m.homeClubName.includes('Inter')) {
      cityCountry = 'Milão, Itália';
    } else if (m.championshipName.includes('Moçambique') || m.homeClubName.includes('Ferroviário') || m.homeClubName.includes('Costa do Sol') || m.homeClubName.includes('Songo')) {
      cityCountry = 'Maputo, Moçambique';
    } else if (m.championshipName.includes('Brasil') || m.homeClubName.includes('Palmeiras') || m.homeClubName.includes('São Paulo') || m.homeClubName.includes('Santos')) {
      cityCountry = 'São Paulo, Brasil';
    }

    return {
      stadium: name,
      cityCountry,
      referee: m.referee || 'Wilton Pereira Sampaio (Fifa)'
    };
  };

  const getClubStanding = (clubId: string, clubName: string, clubLogoUrl: string) => {
    if (champ && champ.standings && champ.standings.length > 0) {
      const idx = champ.standings.findIndex(s => s.clubId === clubId);
      if (idx !== -1) {
        return {
          position: idx + 1,
          row: champ.standings[idx]
        };
      }
    }

    const champMatches = matches.filter(m => m.championshipId === match.championshipId && m.status === MatchStatus.FINISHED);
    const stats = {
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0
    };

    champMatches.forEach(m => {
      const isHome = m.homeClubId === clubId;
      const isAway = m.awayClubId === clubId;
      if (!isHome && !isAway) return;

      stats.played += 1;
      const gf = isHome ? m.score.home : m.score.away;
      const ga = isHome ? m.score.away : m.score.home;
      stats.goalsFor += gf;
      stats.goalsAgainst += ga;

      if (gf > ga) {
        stats.won += 1;
        stats.points += 3;
      } else if (gf === ga) {
        stats.drawn += 1;
        stats.points += 1;
      } else {
        stats.lost += 1;
      }
    });

    if (stats.played > 0) {
      return {
        position: 1,
        row: {
          clubId,
          clubName,
          logoUrl: clubLogoUrl,
          played: stats.played,
          won: stats.won,
          drawn: stats.drawn,
          lost: stats.lost,
          goalsFor: stats.goalsFor,
          goalsAgainst: stats.goalsAgainst,
          goalDifference: stats.goalsFor - stats.goalsAgainst,
          points: stats.points
        }
      };
    }

    const hash = clubId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const position = (hash % 10) + 1;
    const points = 45 - position * 3 + (hash % 3);
    const played = 20;
    const won = Math.floor(points / 3);
    const drawn = points % 3;
    const lost = Math.max(0, played - won - drawn);
    const goalsFor = won * 2 + drawn;
    const goalsAgainst = lost * 2 + drawn;

    return {
      position,
      row: {
        clubId,
        clubName,
        logoUrl: clubLogoUrl,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points
      }
    };
  };

  // E. Prévia Tab (Match Preview Details: Form, H2H, Standings, Match Info)
  const renderPreviaTab = () => {
    const homeForm = getRecentFormWithFallback(match.homeClubId, match.homeClubName, match.homeClubLogo, previaChampionshipOnly);
    const awayForm = getRecentFormWithFallback(match.awayClubId, match.awayClubName, match.awayClubLogo, previaChampionshipOnly);
    
    const h2hMatches = getH2HWithFallback();
    const totalH2HCount = h2hMatches.length;
    const displayedH2H = h2hMatches.slice(0, h2hLimit);

    const h2hSummary = h2hMatches.reduce((acc, m) => {
      const scoreHome = m.score.home;
      const scoreAway = m.score.away;
      const isHomeClubHost = m.homeClubId === match.homeClubId;

      if (scoreHome === scoreAway) {
        acc.draws += 1;
      } else if (scoreHome > scoreAway) {
        if (isHomeClubHost) {
          acc.homeWins += 1;
        } else {
          acc.awayWins += 1;
        }
      } else {
        if (isHomeClubHost) {
          acc.awayWins += 1;
        } else {
          acc.homeWins += 1;
        }
      }
      return acc;
    }, { homeWins: 0, awayWins: 0, draws: 0 });

    const stadiumInfo = getStadiumInfo(match);
    
    const homeStandObj = getClubStanding(match.homeClubId, match.homeClubName, match.homeClubLogo);
    const awayStandObj = getClubStanding(match.awayClubId, match.awayClubName, match.awayClubLogo);

    return (
      <div className="space-y-6">
        {/* 1. INFORMAÇÕES DA PARTIDA PANEL */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center space-x-2">
            <span>ℹ️</span>
            <span>Informações da Partida</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <div className="p-2 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Estádio</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1 block">
                  {stadiumInfo.stadium}
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <div className="p-2 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Árbitro Principal</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1 block">
                  {stadiumInfo.referee}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. FORMA RECENTE */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider pb-1">
            Forma Recente
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => setPreviaChampionshipOnly(true)}
              className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer text-center ${
                previaChampionshipOnly
                  ? 'bg-[#EAF6EC] dark:bg-emerald-950/40 text-[#1B5E20] dark:text-emerald-400'
                  : 'bg-[#F1F3F4] dark:bg-slate-800/80 text-[#5F6368] dark:text-zinc-400 hover:bg-[#E8EAED] dark:hover:bg-slate-800'
              }`}
            >
              {match.championshipName ? match.championshipName.replace(/🇺🇳|🇲🇿|🇪🇺|🇪🇸|🇧🇷/g, '').trim().toUpperCase() : 'CAMPEONATO'}
            </button>
            <button
              onClick={() => setPreviaChampionshipOnly(false)}
              className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer text-center ${
                !previaChampionshipOnly
                  ? 'bg-[#EAF6EC] dark:bg-emerald-950/40 text-[#1B5E20] dark:text-emerald-400'
                  : 'bg-[#F1F3F4] dark:bg-slate-800/80 text-[#5F6368] dark:text-zinc-400 hover:bg-[#E8EAED] dark:hover:bg-slate-800'
              }`}
            >
              Todos
            </button>
          </div>

          <div className="overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="min-w-[580px] lg:min-w-full space-y-4">
              {Math.max(homeForm.length, awayForm.length) === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-zinc-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/10">
                  <p className="text-xs font-bold uppercase tracking-wider">Nenhuma partida finalizada registrada</p>
                  <p className="text-[10px] text-slate-400 mt-1">A forma recente será preenchida conforme as partidas forem sendo disputadas.</p>
                </div>
              ) : (
                Array.from({ length: Math.min(5, Math.max(homeForm.length, awayForm.length)) }).map((_, idx) => {
                  const mHome = homeForm[idx];
                  const mAway = awayForm[idx];

                  const resHome = mHome ? getMatchResult(mHome, match.homeClubId) : 'E';
                  const resAway = mAway ? getMatchResult(mAway, match.awayClubId) : 'E';

                  return (
                    <div key={idx} className="grid grid-cols-2 gap-x-4 sm:gap-x-6 items-center">
                      {/* Left Column (Home Team Form): [Card] [CircleBadge] */}
                      <div className="flex items-center justify-end space-x-2 sm:space-x-3 w-full">
                        {mHome ? (
                          <>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 flex-1 flex items-center justify-between shadow-xs max-w-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
                              <img 
                                src={mHome.homeClubLogo} 
                                alt="" 
                                className="w-6.5 h-6.5 sm:w-8 h-8 rounded-full object-contain bg-white shrink-0 border border-slate-100/30" 
                                referrerPolicy="no-referrer" 
                              />
                              <span className="font-mono font-black text-xs sm:text-sm text-slate-800 dark:text-zinc-100 px-2 text-center flex-1">
                                {mHome.score.home} - {mHome.score.away}
                              </span>
                              <img 
                                src={mHome.awayClubLogo} 
                                alt="" 
                                className="w-6.5 h-6.5 sm:w-8 h-8 rounded-full object-contain bg-white shrink-0 border border-slate-100/30" 
                                referrerPolicy="no-referrer" 
                              />
                            </div>
                            <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-[11px] sm:text-xs shadow-sm text-white shrink-0 ${
                              resHome === 'V'
                                ? 'bg-[#5CB85C]'
                                : resHome === 'E'
                                ? 'bg-[#E5B53B]'
                                : 'bg-[#C2514D]'
                            }`}>
                              {resHome}
                            </span>
                          </>
                        ) : (
                          <div className="h-12 w-full bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] text-slate-400">
                            N/A
                          </div>
                        )}
                      </div>

                      {/* Right Column (Away Team Form): [CircleBadge] [Card] */}
                      <div className="flex items-center justify-start space-x-2 sm:space-x-3 w-full">
                        {mAway ? (
                          <>
                            <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-[11px] sm:text-xs shadow-sm text-white shrink-0 ${
                              resAway === 'V'
                                ? 'bg-[#5CB85C]'
                                : resAway === 'E'
                                ? 'bg-[#E5B53B]'
                                : 'bg-[#C2514D]'
                            }`}>
                              {resAway}
                            </span>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 flex-1 flex items-center justify-between shadow-xs max-w-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
                              <img 
                                src={mAway.homeClubLogo} 
                                alt="" 
                                className="w-6.5 h-6.5 sm:w-8 h-8 rounded-full object-contain bg-white shrink-0 border border-slate-100/30" 
                                referrerPolicy="no-referrer" 
                              />
                              <span className="font-mono font-black text-xs sm:text-sm text-slate-800 dark:text-zinc-100 px-2 text-center flex-1">
                                {mAway.score.home} - {mAway.score.away}
                              </span>
                              <img 
                                src={mAway.awayClubLogo} 
                                alt="" 
                                className="w-6.5 h-6.5 sm:w-8 h-8 rounded-full object-contain bg-white shrink-0 border border-slate-100/30" 
                                referrerPolicy="no-referrer" 
                              />
                            </div>
                          </>
                        ) : (
                          <div className="h-12 w-full bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] text-slate-400">
                            N/A
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 3. ÚLTIMOS JOGOS H2H */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
              Últimos Jogos H2H
            </h3>
            <button
              onClick={() => {
                if (h2hLimit === 4) {
                  setH2hLimit(8);
                } else {
                  setH2hLimit(4);
                  setSelectedH2HId(null);
                }
              }}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-black text-xs uppercase tracking-wider select-none cursor-pointer"
            >
              {h2hLimit === 4 ? 'MAIS' : 'MENOS'}
            </button>
          </div>

          <div className="overflow-x-auto pb-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex space-x-3 min-w-max pb-1 w-full">
              {displayedH2H.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-zinc-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/10 w-full">
                  <p className="text-xs font-bold uppercase tracking-wider">Nenhum confronto direto registrado</p>
                  <p className="text-[10px] text-slate-400 mt-1">Os dados do H2H serão atualizados à medida que novos confrontos ocorrerem.</p>
                </div>
              ) : (
                displayedH2H.map((m, idx) => {
                  const isSelected = selectedH2HId === m.id || (!selectedH2HId && idx === 2 && displayedH2H.length >= 3);
                  const isHomeWin = m.score.home > m.score.away;
                  const isAwayWin = m.score.away > m.score.home;
                  const isDraw = m.score.home === m.score.away;

                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedH2HId(m.id)}
                      className={`w-[145px] sm:w-[165px] shrink-0 border rounded-2xl p-4 flex flex-col items-center justify-between shadow-xs transition-all duration-200 cursor-pointer select-none ${
                        isSelected
                          ? 'bg-[#F1F3F4] dark:bg-slate-800 border-slate-300 dark:border-slate-700 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                      }`}
                    >
                      {/* Logos Row */}
                      <div className="flex items-center justify-center space-x-3 w-full mb-1">
                        <img 
                          src={m.homeClubLogo} 
                          alt="" 
                          className="w-8 h-8 rounded-full object-contain bg-white shadow-xs p-0.5 border border-slate-100" 
                          referrerPolicy="no-referrer" 
                        />
                        <img 
                          src={m.awayClubLogo} 
                          alt="" 
                          className="w-8 h-8 rounded-full object-contain bg-white shadow-xs p-0.5 border border-slate-100" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>

                      {/* Underline indicators */}
                      <div className="flex items-center justify-center space-x-4 w-full px-1.5 mb-2.5">
                        {/* Left bar (Home result) */}
                        <div className={`h-1 w-7 rounded-full ${
                          isDraw ? 'bg-[#E5B53B]' : isHomeWin ? 'bg-[#5CB85C]' : 'bg-[#C2514D]'
                        }`} />
                        {/* Right bar (Away result) */}
                        <div className={`h-1 w-7 rounded-full ${
                          isDraw ? 'bg-[#E5B53B]' : isAwayWin ? 'bg-[#5CB85C]' : 'bg-[#C2514D]'
                        }`} />
                      </div>

                      {/* Score */}
                      <span className="font-mono font-black text-slate-800 dark:text-zinc-100 text-base">
                        {m.score.home}-{m.score.away}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* H2H Stat pill summary row at the bottom */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3.5 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center space-x-2">
              <img 
                src={match.homeClubLogo} 
                alt="" 
                className="w-7 h-7 object-contain bg-white rounded-full p-0.5 border border-slate-150" 
                referrerPolicy="no-referrer" 
              />
              <div className="bg-[#F1F3F4] dark:bg-slate-800 text-slate-800 dark:text-zinc-200 font-mono font-black px-2.5 py-1 rounded-lg border border-slate-250/60 dark:border-slate-700 shadow-2xs text-xs">
                {h2hSummary.homeWins}
              </div>
              <span className="text-[10.5px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                Vitórias
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="bg-[#F1F3F4] dark:bg-slate-800 text-slate-800 dark:text-zinc-200 font-mono font-black px-2.5 py-1 rounded-lg border border-slate-250/60 dark:border-slate-700 shadow-2xs text-xs">
                {h2hSummary.draws}
              </div>
              <span className="text-[10.5px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                Empates
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="bg-[#F1F3F4] dark:bg-slate-800 text-slate-800 dark:text-zinc-200 font-mono font-black px-2.5 py-1 rounded-lg border border-slate-250/60 dark:border-slate-700 shadow-2xs text-xs">
                {h2hSummary.awayWins}
              </div>
              <span className="text-[10.5px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                Vitórias
              </span>
              <img 
                src={match.awayClubLogo} 
                alt="" 
                className="w-7 h-7 object-contain bg-white rounded-full p-0.5 border border-slate-150" 
                referrerPolicy="no-referrer" 
              />
            </div>
          </div>
        </div>

        {/* 4. CLASSIFICAÇÃO COMPARISON TABLE */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center space-x-2">
            <span>📊</span>
            <span>Classificação (Comparativo de Tabela)</span>
          </h3>

          <div className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-[#0F172A] shadow-xs">
            <table className="w-full text-[10px] text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-extrabold uppercase tracking-tight text-center text-[9px]">
                  <th className="w-[7%] py-2 text-center border-r border-zinc-200 dark:border-zinc-800">Pos</th>
                  <th className="w-[37%] py-2 text-left px-1.5 border-r border-zinc-200 dark:border-zinc-800">Equipe</th>
                  <th className="w-[10%] py-2 text-center font-black border-r border-zinc-200 dark:border-zinc-800 bg-slate-100/40 dark:bg-slate-900/40 text-zinc-900 dark:text-white">P</th>
                  <th className="w-[8%] py-2 text-center border-r border-zinc-200 dark:border-zinc-800">J</th>
                  <th className="w-[7%] py-2 text-center border-r border-zinc-200 dark:border-zinc-800">V</th>
                  <th className="w-[7%] py-2 text-center border-r border-zinc-200 dark:border-zinc-800">E</th>
                  <th className="w-[7%] py-2 text-center border-r border-zinc-200 dark:border-zinc-800">D</th>
                  <th className="w-[8%] py-2 text-center border-r border-zinc-200 dark:border-zinc-800">GP</th>
                  <th className="w-[8%] py-2 text-center border-r border-zinc-200 dark:border-zinc-800">GC</th>
                  <th className="w-[9%] py-2 text-center">SG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                {/* Home team row */}
                <tr className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/10 transition-colors text-center font-bold text-zinc-700 dark:text-zinc-300">
                  <td className="p-0 w-[7%] text-center font-black text-xs text-white border-r border-zinc-200 dark:border-zinc-800 bg-blue-500">
                    <div className="w-full h-10 flex items-center justify-center">
                      {homeStandObj.position}
                    </div>
                  </td>
                  <td className="py-1 px-1.5 w-[37%] text-left border-r border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center space-x-1 cursor-pointer group" onClick={() => navigateTo({ type: 'club', id: match.homeClubId })}>
                      <img src={match.homeClubLogo} alt="" className="w-4 h-4 rounded-full object-cover bg-white shadow-3xs border border-zinc-200 dark:border-zinc-700 transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                      <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:underline text-[10px] transition-colors truncate leading-tight">{match.homeClubName}</span>
                    </div>
                  </td>
                  <td className="py-1 w-[10%] text-center font-black text-zinc-900 dark:text-white text-[12px] border-r border-zinc-200 dark:border-zinc-800 bg-blue-50/10 dark:bg-blue-950/10">{homeStandObj.row.points}</td>
                  <td className="py-1 w-[8%] text-center font-mono text-zinc-600 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 text-[9.5px]">{homeStandObj.row.played}</td>
                  <td className="py-1 w-[7%] text-center font-mono text-zinc-600 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 text-[9.5px]">{homeStandObj.row.won}</td>
                  <td className="py-1 w-[7%] text-center font-mono text-zinc-600 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 text-[9.5px]">{homeStandObj.row.drawn}</td>
                  <td className="py-1 w-[7%] text-center font-mono text-zinc-600 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 text-[9.5px]">{homeStandObj.row.lost}</td>
                  <td className="py-1 w-[8%] text-center font-mono text-zinc-500 dark:text-zinc-500 border-r border-zinc-200 dark:border-zinc-800 text-[9.5px]">{homeStandObj.row.goalsFor}</td>
                  <td className="py-1 w-[8%] text-center font-mono text-zinc-500 dark:text-zinc-500 border-r border-zinc-200 dark:border-zinc-800 text-[9.5px]">{homeStandObj.row.goalsAgainst}</td>
                  <td className={`py-1 w-[9%] text-center font-bold text-[9.5px] ${homeStandObj.row.goalDifference > 0 ? 'text-zinc-800 dark:text-zinc-200' : homeStandObj.row.goalDifference < 0 ? 'text-rose-500 font-black' : 'text-zinc-500'}`}>
                    {homeStandObj.row.goalDifference > 0 ? `+${homeStandObj.row.goalDifference}` : homeStandObj.row.goalDifference}
                  </td>
                </tr>

                {/* Away team row */}
                <tr className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/10 transition-colors text-center font-bold text-zinc-700 dark:text-zinc-300">
                  <td className="p-0 w-[7%] text-center font-black text-xs text-white border-r border-zinc-200 dark:border-zinc-800 bg-rose-500">
                    <div className="w-full h-10 flex items-center justify-center">
                      {awayStandObj.position}
                    </div>
                  </td>
                  <td className="py-1 px-1.5 w-[37%] text-left border-r border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center space-x-1 cursor-pointer group" onClick={() => navigateTo({ type: 'club', id: match.awayClubId })}>
                      <img src={match.awayClubLogo} alt="" className="w-4 h-4 rounded-full object-cover bg-white shadow-3xs border border-zinc-200 dark:border-zinc-700 transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                      <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-rose-500 dark:group-hover:text-rose-400 group-hover:underline text-[10px] transition-colors truncate leading-tight">{match.awayClubName}</span>
                    </div>
                  </td>
                  <td className="py-1 w-[10%] text-center font-black text-zinc-900 dark:text-white text-[12px] border-r border-zinc-200 dark:border-zinc-800 bg-rose-50/10 dark:bg-rose-950/10">{awayStandObj.row.points}</td>
                  <td className="py-1 w-[8%] text-center font-mono text-zinc-600 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 text-[9.5px]">{awayStandObj.row.played}</td>
                  <td className="py-1 w-[7%] text-center font-mono text-zinc-600 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 text-[9.5px]">{awayStandObj.row.won}</td>
                  <td className="py-1 w-[7%] text-center font-mono text-zinc-600 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 text-[9.5px]">{awayStandObj.row.drawn}</td>
                  <td className="py-1 w-[7%] text-center font-mono text-zinc-600 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 text-[9.5px]">{awayStandObj.row.lost}</td>
                  <td className="py-1 w-[8%] text-center font-mono text-zinc-500 dark:text-zinc-500 border-r border-zinc-200 dark:border-zinc-800 text-[9.5px]">{awayStandObj.row.goalsFor}</td>
                  <td className="py-1 w-[8%] text-center font-mono text-zinc-500 dark:text-zinc-500 border-r border-zinc-200 dark:border-zinc-800 text-[9.5px]">{awayStandObj.row.goalsAgainst}</td>
                  <td className={`py-1 w-[9%] text-center font-bold text-[9.5px] ${awayStandObj.row.goalDifference > 0 ? 'text-zinc-800 dark:text-zinc-200' : awayStandObj.row.goalDifference < 0 ? 'text-rose-500 font-black' : 'text-zinc-500'}`}>
                    {awayStandObj.row.goalDifference > 0 ? `+${awayStandObj.row.goalDifference}` : awayStandObj.row.goalDifference}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 1. TABS CONTENT RENDERERS
  
  // A. Eventos Tab (Custom Timeline following the user's layout exactly)
  const renderEventosTab = () => {
    const goalsList = getGoalsEvents();
    const cardsList = getCardsEvents();

    return (
      <div className="space-y-4">
        {/* Dynamic Match Time Ticker Divider */}
        <div className="flex items-center justify-center space-x-4 py-2">
          <div className="h-px bg-slate-200 dark:bg-slate-800/80 flex-1"></div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-bold bg-slate-100 dark:bg-slate-900/60 px-3 py-1 rounded-full border border-slate-200/50 dark:border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {match.status === MatchStatus.LIVE
                ? formatMatchMinute(match.minute, match.injuryTime1stHalf, match.injuryTime2ndHalf)
                : match.status === MatchStatus.HT
                ? 'Intervalo'
                : match.status === MatchStatus.FINISHED
                ? 'Terminou'
                : 'Não Iniciado'}
            </span>
          </div>
          <div className="h-px bg-slate-200 dark:bg-slate-800/80 flex-1"></div>
        </div>

        {/* 1. COLLAPSIBLE GOLS SECTION */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setGolsCollapsed(!golsCollapsed)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800/60 select-none cursor-pointer"
          >
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              GOLS
            </span>
            {golsCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </button>

          {!golsCollapsed && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40 p-2 space-y-3">
              {goalsList.map((g) => {
                const isHome = g.team === 'home';
                const avatar = getPlayerAvatar(g.player1);

                return (
                  <div key={g.id} className="py-2 flex items-center justify-between">
                    {/* Home Team Scorer (Left) */}
                    <div className="w-[45%] flex items-center justify-start space-x-2.5 pl-2">
                      {isHome ? (
                        <>
                          <img
                            src={avatar}
                            alt={g.player1}
                            className="w-8 h-8 rounded-full object-cover bg-zinc-100 border border-slate-200 dark:border-slate-800"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex flex-col text-left leading-tight min-w-0">
                            <span className="font-bold text-xs text-slate-800 dark:text-white truncate">
                              {g.player1}
                            </span>
                            <div className="flex items-center space-x-1">
                              {g.detail?.toLowerCase().includes('pênalti') ? (
                                <span className="bg-amber-100 dark:bg-amber-950/45 text-amber-600 dark:text-amber-400 text-[8px] font-black px-1 rounded uppercase tracking-wider leading-none">
                                  PEN
                                </span>
                              ) : g.player2 ? (
                                <span className="text-[9px] text-slate-400 truncate">
                                  Assist: {g.player2}
                                </span>
                              ) : (
                                <span className="text-[9px] text-blue-600 font-bold">Gol!</span>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="h-8"></div>
                      )}
                    </div>

                    {/* Minute Indicator (Center) */}
                    <div className="w-[10%] text-center shrink-0">
                      <span className="text-[11.5px] font-black text-blue-600 font-mono">
                        {formatMatchMinute(g.minute, match.injuryTime1stHalf, match.injuryTime2ndHalf)}
                      </span>
                    </div>

                    {/* Away Team Scorer (Right) */}
                    <div className="w-[45%] flex items-center justify-end space-x-2.5 pr-2 text-right">
                      {!isHome ? (
                        <>
                          <div className="flex flex-col text-right leading-tight min-w-0">
                            <span className="font-bold text-xs text-slate-800 dark:text-white truncate">
                              {g.player1}
                            </span>
                            <div className="flex items-center justify-end space-x-1">
                              {g.detail?.toLowerCase().includes('pênalti') ? (
                                <span className="bg-amber-100 dark:bg-amber-950/45 text-amber-600 dark:text-amber-400 text-[8px] font-black px-1 rounded uppercase tracking-wider leading-none">
                                  PEN
                                </span>
                              ) : g.player2 ? (
                                <span className="text-[9px] text-slate-400 truncate">
                                  Assist: {g.player2}
                                </span>
                              ) : (
                                <span className="text-[9px] text-blue-600 font-bold">Gol!</span>
                              )}
                            </div>
                          </div>
                          <img
                            src={avatar}
                            alt={g.player1}
                            className="w-8 h-8 rounded-full object-cover bg-zinc-100 border border-slate-200 dark:border-slate-800"
                            referrerPolicy="no-referrer"
                          />
                        </>
                      ) : (
                        <div className="h-8"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. COLLAPSIBLE CARTÕES SECTION */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setCardsCollapsed(!cardsCollapsed)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800/60 select-none cursor-pointer"
          >
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
              <span>🟨🟥</span>
              <span>CARTÕES</span>
            </span>
            {cardsCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </button>

          {!cardsCollapsed && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40 p-2 space-y-3">
              {cardsList.map((c) => {
                const isHome = c.team === 'home';
                const avatar = getPlayerAvatar(c.player1);
                const isYellow = c.type === 'YellowCard';

                return (
                  <div key={c.id} className="py-2 flex items-center justify-between">
                    {/* Home Team Carded (Left) */}
                    <div className="w-[45%] flex items-center justify-start space-x-2.5 pl-2">
                      {isHome ? (
                        <>
                          <img
                            src={avatar}
                            alt={c.player1}
                            className="w-8 h-8 rounded-full object-cover bg-zinc-100 border border-slate-200 dark:border-slate-800"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex flex-col text-left leading-tight min-w-0">
                            <span className="font-bold text-xs text-slate-800 dark:text-white truncate">
                              {c.player1}
                            </span>
                            <span className="text-[9px] text-slate-400 truncate">
                              {c.detail || (isYellow ? 'Falta dura' : 'Cartão vermelho')}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="h-8"></div>
                      )}
                    </div>

                    {/* Card type icon and minute (Center) */}
                    <div className="w-[10%] flex flex-col items-center justify-center space-y-0.5 shrink-0">
                      {isYellow ? (
                        <div className="w-3 h-4 bg-amber-400 rounded-xs border border-amber-500 shadow-xs" title="Cartão Amarelo" />
                      ) : (
                        <div className="w-3 h-4 bg-rose-500 rounded-xs border border-rose-600 shadow-xs animate-pulse" title="Cartão Vermelho" />
                      )}
                      <span className="text-[10px] font-black text-slate-400 font-mono">
                        {formatMatchMinute(c.minute, match.injuryTime1stHalf, match.injuryTime2ndHalf)}
                      </span>
                    </div>

                    {/* Away Team Carded (Right) */}
                    <div className="w-[45%] flex items-center justify-end space-x-2.5 pr-2 text-right">
                      {!isHome ? (
                        <>
                          <div className="flex flex-col text-right leading-tight min-w-0">
                            <span className="font-bold text-xs text-slate-800 dark:text-white truncate">
                              {c.player1}
                            </span>
                            <span className="text-[9px] text-slate-400 truncate">
                              {c.detail || (isYellow ? 'Falta dura' : 'Cartão vermelho')}
                            </span>
                          </div>
                          <img
                            src={avatar}
                            alt={c.player1}
                            className="w-8 h-8 rounded-full object-cover bg-zinc-100 border border-slate-200 dark:border-slate-800"
                            referrerPolicy="no-referrer"
                          />
                        </>
                      ) : (
                        <div className="h-8"></div>
                      )}
                    </div>
                  </div>
                );
              })}
              {cardsList.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-400">
                  Nenhum cartão nesta partida.
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. COLLAPSIBLE SUBSTITUIÇÕES SECTION */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setSubsCollapsed(!subsCollapsed)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800/60 select-none cursor-pointer"
          >
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
              <span>🔄</span>
              <span>SUBSTITUIÇÕES</span>
            </span>
            {subsCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </button>

          {!subsCollapsed && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40 p-2 space-y-3">
              {getSubstitutionsEvents().map((s) => {
                const isHome = s.team === 'home';
                const avatarOff = getPlayerAvatar(s.player1);
                const avatarOn = getPlayerAvatar(s.player2 || '');

                return (
                  <div key={s.id} className="py-2.5 flex items-center justify-between">
                    {/* Home Team Subs (Left) */}
                    <div className="w-[45%] flex items-center justify-start space-x-2 pl-2">
                      {isHome ? (
                        <div className="flex items-center space-x-2">
                          <div className="relative shrink-0 flex">
                            <img
                              src={avatarOff}
                              alt={s.player1}
                              className="w-7 h-7 rounded-full object-cover bg-zinc-100 border border-slate-200 dark:border-slate-800 z-10"
                              referrerPolicy="no-referrer"
                            />
                            <img
                              src={avatarOn}
                              alt={s.player2}
                              className="w-7 h-7 rounded-full object-cover bg-zinc-100 border border-slate-200 dark:border-slate-800 -ml-3 z-20"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex flex-col text-left leading-tight min-w-0">
                            {/* Player coming on (Entra) - Blue arrow pointing up */}
                            <div className="flex items-center space-x-1">
                              <span className="text-blue-600 dark:text-blue-400 font-extrabold text-[10px]">↑</span>
                              <span className="font-bold text-[11px] text-slate-800 dark:text-white truncate">
                                {s.player2}
                              </span>
                            </div>
                            {/* Player coming off (Sai) - Red arrow pointing down */}
                            <div className="flex items-center space-x-1 opacity-80">
                              <span className="text-red-500 font-extrabold text-[10px]">↓</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {s.player1}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-8"></div>
                      )}
                    </div>

                    {/* Minute (Center) */}
                    <div className="w-[10%] text-center shrink-0">
                      <span className="text-[10.5px] font-black text-slate-400 font-mono">
                        {formatMatchMinute(s.minute, match.injuryTime1stHalf, match.injuryTime2ndHalf)}
                      </span>
                    </div>

                    {/* Away Team Subs (Right) */}
                    <div className="w-[45%] flex items-center justify-end space-x-2 pr-2 text-right">
                      {!isHome ? (
                        <div className="flex items-center justify-end space-x-2">
                          <div className="flex flex-col text-right leading-tight min-w-0">
                            {/* Player coming on (Entra) - Blue arrow pointing up */}
                            <div className="flex items-center justify-end space-x-1">
                              <span className="font-bold text-[11px] text-slate-800 dark:text-white truncate">
                                {s.player2}
                              </span>
                              <span className="text-blue-600 dark:text-blue-400 font-extrabold text-[10px]">↑</span>
                            </div>
                            {/* Player coming off (Sai) - Red arrow pointing down */}
                            <div className="flex items-center justify-end space-x-1 opacity-80">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {s.player1}
                              </span>
                              <span className="text-red-500 font-extrabold text-[10px]">↓</span>
                            </div>
                          </div>
                          <div className="relative shrink-0 flex">
                            <img
                              src={avatarOff}
                              alt={s.player1}
                              className="w-7 h-7 rounded-full object-cover bg-zinc-100 border border-slate-200 dark:border-slate-800 z-10"
                              referrerPolicy="no-referrer"
                            />
                            <img
                              src={avatarOn}
                              alt={s.player2}
                              className="w-7 h-7 rounded-full object-cover bg-zinc-100 border border-slate-200 dark:border-slate-800 -ml-3 z-20"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="h-8"></div>
                      )}
                    </div>
                  </div>
                );
              })}
              {getSubstitutionsEvents().length === 0 && (
                <div className="text-center py-4 text-xs text-slate-400">
                  Nenhuma substituição registrada.
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. PREMIUM DETAILED MATCH STATISTICS (From User Screenshot) */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 space-y-6 shadow-sm">
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 text-center">
            📊 Estatísticas de Jogo
          </h3>

          {/* ATAQUE SECTION */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-slate-400 dark:text-zinc-500 text-center tracking-wider uppercase">
              ATAQUE
            </h4>
            
            {/* Remates totais */}
            {(() => {
              const renderStatRow = (
                label: string, 
                homeValue: string | number, 
                awayValue: string | number, 
                homeRaw: number, 
                awayRaw: number
              ) => {
                const total = homeRaw + awayRaw;
                const homePct = total > 0 ? (homeRaw / total) * 100 : 0;
                const awayPct = total > 0 ? (awayRaw / total) * 100 : 0;
                const isHomeGreater = homeRaw > awayRaw;
                const isAwayGreater = awayRaw > homeRaw;

                return (
                  <div className="space-y-1.5 py-0.5">
                    <div className="flex items-center justify-between text-xs font-black">
                      {/* Home label */}
                      <div className="w-14 text-left">
                        {isHomeGreater ? (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-[10px] font-black inline-block">
                            {homeValue}
                          </span>
                        ) : (
                          <span className="text-slate-800 dark:text-zinc-300">
                            {homeValue}
                          </span>
                        )}
                      </div>
                      
                      {/* Label */}
                      <span className="text-[10px] text-slate-600 dark:text-zinc-400 font-bold uppercase">
                        {label}
                      </span>
                      
                      {/* Away label */}
                      <div className="w-14 text-right">
                        {isAwayGreater ? (
                          <span className="px-2 py-0.5 bg-indigo-500 text-white rounded text-[10px] font-black inline-block">
                            {awayValue}
                          </span>
                        ) : (
                          <span className="text-slate-800 dark:text-zinc-300">
                            {awayValue}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Progress Slider */}
                    <div className="h-1.5 w-full flex rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="bg-emerald-500 rounded-l-full transition-all duration-500" 
                        style={{ width: `${homePct}%` }}
                      ></div>
                      <div 
                        className="bg-indigo-500 rounded-r-full transition-all duration-500" 
                        style={{ width: `${awayPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              };

              // Calculate shots off target: shots - shotsOnTarget - blockedShots (fallback to 0)
              const homeShotsOff = Math.max(0, (match.stats.shots?.home ?? 0) - (match.stats.shotsOnTarget?.home ?? 0) - (match.stats.blockedShots?.home ?? 0));
              const awayShotsOff = Math.max(0, (match.stats.shots?.away ?? 0) - (match.stats.shotsOnTarget?.away ?? 0) - (match.stats.blockedShots?.away ?? 0));

              // Calculate completed passes
              const homePassesCompleted = Math.round((match.stats.passes?.home ?? 0) * ((match.stats.passAccuracy?.home ?? 80) / 100));
              const awayPassesCompleted = Math.round((match.stats.passes?.away ?? 0) * ((match.stats.passAccuracy?.away ?? 80) / 100));

              return (
                <div className="space-y-4">
                  {renderStatRow("Remates totais", match.stats.shots?.home ?? 0, match.stats.shots?.away ?? 0, match.stats.shots?.home ?? 0, match.stats.shots?.away ?? 0)}
                  {renderStatRow("Chutes bloqueados", match.stats.blockedShots?.home ?? 0, match.stats.blockedShots?.away ?? 0, match.stats.blockedShots?.home ?? 0, match.stats.blockedShots?.away ?? 0)}
                  
                  {/* Nested Group from Screenshot */}
                  <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-2xl p-3 space-y-4">
                    {renderStatRow("Chutes para fora", homeShotsOff, awayShotsOff, homeShotsOff, awayShotsOff)}
                    <div className="bg-white dark:bg-[#111827] border border-slate-150 dark:border-slate-800 rounded-xl p-2.5">
                      {renderStatRow("Chutes a gol", match.stats.shotsOnTarget?.home ?? 0, match.stats.shotsOnTarget?.away ?? 0, match.stats.shotsOnTarget?.home ?? 0, match.stats.shotsOnTarget?.away ?? 0)}
                    </div>
                  </div>

                  {/* ZAGUEIRO SECTION */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-[11px] font-black text-slate-400 dark:text-zinc-500 text-center tracking-wider uppercase">
                      ZAGUEIRO
                    </h4>
                    {renderStatRow("Defesas do goleiro", match.stats.saves?.home ?? 0, match.stats.saves?.away ?? 0, match.stats.saves?.home ?? 0, match.stats.saves?.away ?? 0)}
                    {renderStatRow("Desarmes", match.stats.fouls?.home ?? 0, match.stats.fouls?.away ?? 0, match.stats.fouls?.home ?? 0, match.stats.fouls?.away ?? 0)}
                  </div>

                  {/* DISTRIBUIÇÃO SECTION */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-[11px] font-black text-slate-400 dark:text-zinc-500 text-center tracking-wider uppercase">
                      DISTRIBUIÇÃO
                    </h4>
                    {renderStatRow("Total de passes", match.stats.passes?.home ?? 0, match.stats.passes?.away ?? 0, match.stats.passes?.home ?? 0, match.stats.passes?.away ?? 0)}
                    {renderStatRow(
                      "Passes completos", 
                      `${homePassesCompleted} (${match.stats.passAccuracy?.home ?? 80}%)`, 
                      `${awayPassesCompleted} (${match.stats.passAccuracy?.away ?? 80}%)`, 
                      homePassesCompleted, 
                      awayPassesCompleted
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  // B. Formações Tab (Lineups layout)
  const renderFormacoesTab = () => {
    const { home, away } = match.lineups;

    const hasLineups = home && home.starting && home.starting.length > 0 && away && away.starting && away.starting.length > 0;

    if (!hasLineups) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-3.5 max-w-md mx-auto my-6 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wide">
              Escalações Pendentes
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[280px] mx-auto">
              Os esquemas táticos desta partida ainda não foram publicados. Retorne mais tarde ou configure-os no Painel do Administrador.
            </p>
          </div>
        </div>
      );
    }

    // Helper to render pitch player with realistic badges matching the screenshot
    const renderPitchPlayer = (p: any, x: number, y: number, isHomeTeam: boolean) => {
      const avatar = getPlayerAvatar(p.name);
      
      // Check for goals by this player in match events
      const goalCount = match.events.filter(e => e.type === 'Goal' && e.player1?.toLowerCase() === p.name.toLowerCase()).length;
      
      // Determine simulated Captain and Substitution attributes to match screenshot perfectly!
      const isCaptain = (isHomeTeam && p.number === 4) || (!isHomeTeam && p.number === 10);
      
      // Look up if this player has been substituted (real or mock)
      let subEvent = match.events.find(
        e => e.type === 'Substitution' && e.player1?.trim().toLowerCase() === p.name.trim().toLowerCase()
      );

      if (!subEvent) {
        const isOriginalMock = match.id === 'match_1' || match.id === 'match_2' || match.id === 'match_3';
        if (isOriginalMock) {
          let mockInPlayer = '';
          let mockMin = 0;
          if (isHomeTeam) {
            if (p.number === 8) { mockInPlayer = 'Rodrygo'; mockMin = 79; }
            if (p.number === 26) { mockInPlayer = 'Raphinha'; mockMin = 67; }
            if (p.number === 9) { mockInPlayer = 'Vinícius Júnior'; mockMin = 58; }
          } else {
            if (p.number === 20) { mockInPlayer = 'A. Schjelderup'; mockMin = 46; }
            if (p.number === 7) { mockInPlayer = 'M. Elyounoussi'; mockMin = 46; }
            if (p.number === 5) { mockInPlayer = 'H. Vetlesen'; mockMin = 95; }
            if (p.number === 26) { mockInPlayer = 'S. Berge'; mockMin = 63; }
          }

          if (mockInPlayer) {
            subEvent = {
              id: `mock_sub_${p.id}`,
              minute: mockMin,
              type: 'Substitution' as const,
              team: isHomeTeam ? 'home' : 'away',
              player1: p.name,
              player2: mockInPlayer,
              detail: 'Substituição tática'
            };
          }
        }
      }

      const rating = p.rating === 6.5 ? undefined : (p.rating || (isHomeTeam ? 5.3 : 6.3));

      const shortenName = (nameStr: string) => {
        if (!nameStr) return '';
        const parts = nameStr.trim().split(/\s+/);
        if (parts.length === 1) return parts[0];
        if (parts.length === 2) {
          if (parts[0].length + parts[1].length <= 11) return nameStr;
          return `${parts[0][0]}. ${parts[1]}`;
        }
        const last = parts[parts.length - 1];
        if (last.toLowerCase() === 'jr' || last.toLowerCase() === 'neto' || last.toLowerCase() === 'filho') {
          return `${parts[parts.length - 2]} ${last}`;
        }
        return `${parts[0][0]}. ${last}`;
      };

      return (
        <div 
          key={`${p.id}_${x}_${y}`}
          onClick={() => navigateTo({ type: 'player', id: p.id })}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none cursor-pointer z-20 transition-transform hover:scale-110"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          {/* Main Avatar Container */}
          <div className="relative w-11 h-11 rounded-full p-0.5 bg-white shadow-md border border-slate-200/50">
            <img 
              src={avatar} 
              alt={p.name}
              className="w-full h-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
            
            {/* Rating Badge removed for tactical scheme layout */}

            {/* Substitution Indicator removed */}

            {/* Goals Indicator (Ball icon) */}
            {goalCount > 0 && (
              <div className="absolute top-1/2 -left-3 -translate-y-1/2 bg-white text-slate-800 font-black text-[7.5px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-200 shadow-sm space-x-0.5">
                <span>⚽</span>
                {goalCount > 1 && <span className="text-[6px]">{goalCount}</span>}
              </div>
            )}

            {/* Shirt Number & Captain Indicator overlay (overlapping bottom) */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[7.5px] font-black h-4 px-1 rounded-full flex items-center justify-center space-x-0.5 border border-white whitespace-nowrap">
              <span>{p.number}</span>
              {isCaptain && (
                <span className="bg-blue-500 text-white font-black text-[6.5px] px-0.5 rounded-xs leading-none">C</span>
              )}
            </div>
          </div>

          {/* Player Surname Label (Black pill or custom red/blue substitution layout) */}
          {subEvent ? (
            <div className="flex flex-col items-center space-y-0.5 mt-2 max-w-[82px] z-30">
              {/* Sai (leaves) - Red arrow pointing down */}
              <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-150 dark:border-red-900/30 text-[7px] font-black px-1.5 py-0.5 rounded flex items-center justify-center space-x-0.5 shadow-xs w-full">
                <span className="text-[8px] text-red-500 font-black shrink-0">↓</span>
                <span className="truncate">{shortenName(subEvent.player1)}</span>
              </div>
              {/* Entra (enters) - Blue arrow pointing up */}
              <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-150 dark:border-blue-900/30 text-[7px] font-black px-1.5 py-0.5 rounded flex items-center justify-center space-x-0.5 shadow-xs w-full">
                <span className="text-[8px] text-blue-600 font-black shrink-0">↑</span>
                <span className="truncate">{shortenName(subEvent.player2 || '')}</span>
              </div>
            </div>
          ) : (
            /* Player Surname Label (Black pill) */
            <div className="bg-black/85 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md mt-2.5 truncate max-w-[76px] tracking-wide text-center shadow-sm">
              {shortenName(p.name)}
            </div>
          )}
        </div>
      );
    };

    // Helper to calculate relative positions
    const getX = (index: number, total: number) => {
      if (total === 1) return 50;
      return 15 + (index * 70) / (total - 1);
    };

    // Parse formation string into position counts (DEF, MID, ATK)
    const parseFormation = (formationStr: string) => {
      const parts = (formationStr || '4-3-3').split('-').map(Number);
      if (parts.length >= 3) {
        const defCount = parts[0];
        const atkCount = parts[parts.length - 1];
        const midCount = parts.slice(1, parts.length - 1).reduce((sum, val) => sum + val, 0);
        return { defCount, midCount, atkCount };
      }
      return { defCount: 4, midCount: 3, atkCount: 3 };
    };

    // Group starting players dynamically based on selected formation
    const getGroupedByFormation = (startingList: any[], formationStr: string) => {
      const { defCount, midCount, atkCount } = parseFormation(formationStr);
      
      const starting = [...startingList];
      while (starting.length < 11) {
        const idx = starting.length;
        starting.push({
          id: `placeholder_${idx}`,
          name: `Jogador ${idx + 1}`,
          number: idx + 1,
          position: 'Defensor'
        });
      }

      // Find Goleiro
      let gkIndex = starting.findIndex(p => p.position === 'Goleiro');
      if (gkIndex === -1) gkIndex = 0;
      
      const gk = starting[gkIndex];
      const outfield = starting.filter((_, idx) => idx !== gkIndex);

      // Sort outfield so Defenders go to DEF, Midfielders to MID, Attackers to ATK slots
      const positionPriority: Record<string, number> = { 'Defensor': 1, 'Meio-campista': 2, 'Atacante': 3, 'Goleiro': 4 };
      const outfieldSorted = [...outfield].sort((a, b) => {
        const pA = positionPriority[a.position] || 2;
        const pB = positionPriority[b.position] || 2;
        return pA - pB;
      });

      const defs = outfieldSorted.slice(0, defCount);
      const mids = outfieldSorted.slice(defCount, defCount + midCount);
      const atks = outfieldSorted.slice(defCount + midCount, defCount + midCount + atkCount);

      return {
        gks: [gk],
        defs,
        mids,
        atks
      };
    };

    const homeGrouped = getGroupedByFormation(home.starting, home.formation);
    const awayGrouped = getGroupedByFormation(away.starting, away.formation);

    const getBenchPlayers = (isHomeTeam: boolean) => {
      const teamLineup = isHomeTeam ? home : away;
      const clubId = isHomeTeam ? match.homeClubId : match.awayClubId;
      const startingNames = new Set((teamLineup?.starting ?? []).map(p => p.name.trim().toLowerCase()).filter(n => n !== ''));
      
      const clubPlayers = players.filter(p => p.clubId === clubId);
      const subs: { id: string; name: string; number: number; position: string; rating?: number }[] = [];
      
      const savedBench = teamLineup?.bench ?? [];
      savedBench.forEach(p => {
        if (p.name && p.name.trim() !== '' && !startingNames.has(p.name.trim().toLowerCase())) {
          subs.push({
            id: p.id,
            name: p.name,
            number: p.number,
            position: p.position,
            rating: p.rating
          });
        }
      });
      
      clubPlayers.forEach(p => {
        const nameLower = p.name.trim().toLowerCase();
        if (p.name && p.name.trim() !== '' && !startingNames.has(nameLower) && !subs.some(s => s.name.trim().toLowerCase() === nameLower)) {
          subs.push({
            id: p.id,
            name: p.name,
            number: p.number || 0,
            position: p.position || 'Jogador',
            rating: undefined
          });
        }
      });
      
      return subs.sort((a, b) => (a.number || 99) - (b.number || 99));
    };

    return (
      <div className="space-y-4">
        {/* Top Control: Formations & View Toggle */}
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">Esquemas:</span>
            <div className="flex space-x-1.5 text-[10px] font-bold font-mono bg-slate-200/50 dark:bg-slate-800 p-1 rounded-lg">
              <span className="text-blue-600 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded shadow-xs">{home.formation}</span>
              <span className="text-zinc-400 dark:text-zinc-500 px-1.5 py-0.5">vs</span>
              <span className="text-blue-600 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded shadow-xs">{away.formation}</span>
            </div>
          </div>

          <div className="flex bg-slate-200/60 dark:bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setFormacaoView('campo')}
              className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                formacaoView === 'campo'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Campo
            </button>
            <button
              onClick={() => setFormacaoView('lista')}
              className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                formacaoView === 'lista'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Lista
            </button>
          </div>
        </div>

        {formacaoView === 'campo' ? (
          <div className="space-y-6">
            {/* VERTICAL FOOTBALL PITCH LAYOUT matching requested screenshot */}
            <div className="max-w-md mx-auto relative h-[620px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-[#2E7D32] select-none"
                 style={{ background: 'repeating-linear-gradient(to bottom, #2E7D32, #2E7D32 40px, #388E3C 40px, #388E3C 80px)' }}
            >
              {/* Fine White Lines Overlay */}
              <div className="absolute inset-2 border border-white/20 rounded-xl pointer-events-none">
                {/* Midfield line */}
                <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-white/20"></div>
                
                {/* Midfield circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-white/20"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/30"></div>

                {/* Home Box (Top Half) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-b border-x border-white/20"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-7 border-b border-x border-white/20"></div>
                <div className="absolute top-14 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/30"></div>

                {/* Away Box (Bottom Half) */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-t border-x border-white/20"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-7 border-t border-x border-white/20"></div>
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/30"></div>

                {/* Corner Arcs */}
                <div className="absolute top-0 left-0 w-3 h-3 border-r border-b border-white/20 rounded-br-full"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-l border-b border-white/20 rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-r border-t border-white/20 rounded-tr-full"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-l border-t border-white/20 rounded-tl-full"></div>
              </div>

              {/* Quick-look indicators */}
              <div className="absolute top-4 left-4 bg-black/45 text-[8.5px] font-black text-white px-2 py-0.5 rounded uppercase tracking-wide">
                {match.homeClubName} ({home.formation})
              </div>
              <div className="absolute bottom-4 left-4 bg-black/45 text-[8.5px] font-black text-white px-2 py-0.5 rounded uppercase tracking-wide">
                {match.awayClubName} ({away.formation})
              </div>

              {/* Render Home Team players on top-half of vertical field */}
              {homeGrouped.gks.map((p, idx) => renderPitchPlayer(p, 50, 7, true))}
              {homeGrouped.defs.map((p, idx) => renderPitchPlayer(p, getX(idx, homeGrouped.defs.length), 20, true))}
              {homeGrouped.mids.map((p, idx) => renderPitchPlayer(p, getX(idx, homeGrouped.mids.length), 34, true))}
              {homeGrouped.atks.map((p, idx) => renderPitchPlayer(p, getX(idx, homeGrouped.atks.length), 45, true))}

              {/* Render Away Team players on bottom-half of vertical field */}
              {awayGrouped.atks.map((p, idx) => renderPitchPlayer(p, getX(idx, awayGrouped.atks.length), 55, false))}
              {awayGrouped.mids.map((p, idx) => renderPitchPlayer(p, getX(idx, awayGrouped.mids.length), 66, false))}
              {awayGrouped.defs.map((p, idx) => renderPitchPlayer(p, getX(idx, awayGrouped.defs.length), 80, false))}
              {awayGrouped.gks.map((p, idx) => renderPitchPlayer(p, 50, 93, false))}
            </div>

            {/* Render Substitute Players (Banco) for each team below the pitch */}
            <div className="max-w-md mx-auto mt-6 bg-white dark:bg-slate-900/40 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                  Suplentes (Banco de Reservas)
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Home Team Subs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                      {match.homeClubName}
                    </span>
                    <span className="text-[8px] font-black bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full uppercase">
                      Reservas
                    </span>
                  </div>
                  {(() => {
                    const subs = getBenchPlayers(true);
                    if (subs.length === 0) {
                      return <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">Sem suplentes.</p>;
                    }
                    return (
                      <div className="space-y-1">
                        {subs.map((p, idx) => (
                          <div
                            key={`home-sub-${p.id}-${idx}`}
                            onClick={() => navigateTo({ type: 'player', id: p.id })}
                            className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-850"
                          >
                            <div className="flex items-center space-x-1.5 min-w-0">
                              <span className="font-mono text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                                {p.number || '-'}
                              </span>
                              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
                            </div>
                            <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-1 rounded text-zinc-500 font-bold uppercase shrink-0">
                              {p.position.slice(0, 3)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Away Team Subs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                      {match.awayClubName}
                    </span>
                    <span className="text-[8px] font-black bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-full uppercase">
                      Reservas
                    </span>
                  </div>
                  {(() => {
                    const subs = getBenchPlayers(false);
                    if (subs.length === 0) {
                      return <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">Sem suplentes.</p>;
                    }
                    return (
                      <div className="space-y-1">
                        {subs.map((p, idx) => (
                          <div
                            key={`away-sub-${p.id}-${idx}`}
                            onClick={() => navigateTo({ type: 'player', id: p.id })}
                            className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-850"
                          >
                            <div className="flex items-center space-x-1.5 min-w-0">
                              <span className="font-mono text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                                {p.number || '-'}
                              </span>
                              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
                            </div>
                            <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-1 rounded text-zinc-500 font-bold uppercase shrink-0">
                              {p.position.slice(0, 3)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TRADITIONAL STARTING LIST DISPLAY fallback */
          <div className="grid md:grid-cols-2 gap-6">
            {/* Home Squad */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-widest pb-1.5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between">
                <span>{match.homeClubName}</span>
                <span className="text-[10px] text-blue-600 font-black uppercase">Titulares</span>
              </h4>
              <div className="space-y-1.5">
                {home.starting.map((p, idx) => (
                  <div
                    key={`${p.id}_${idx}`}
                    onClick={() => navigateTo({ type: 'player', id: p.id })}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-xs font-bold bg-blue-50 text-blue-600 w-5.5 h-5.5 rounded-full flex items-center justify-center">
                        {p.number}
                      </span>
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{p.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 font-bold uppercase">
                        {p.position.slice(0, 3)}
                      </span>
                      {p.rating && p.rating !== 6.5 && (
                        <span className="font-mono text-xs font-black bg-blue-600 text-white px-1.5 py-0.5 rounded leading-none">
                          {p.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Away Squad */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-widest pb-1.5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between">
                <span>{match.awayClubName}</span>
                <span className="text-[10px] text-zinc-500 font-black uppercase">Titulares</span>
              </h4>
              <div className="space-y-1.5">
                {away.starting.map((p, idx) => (
                  <div
                    key={`${p.id}_${idx}`}
                    onClick={() => navigateTo({ type: 'player', id: p.id })}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-xs font-bold bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 w-5.5 h-5.5 rounded-full flex items-center justify-center">
                        {p.number}
                      </span>
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{p.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 font-bold uppercase">
                        {p.position.slice(0, 3)}
                      </span>
                      {p.rating && p.rating !== 6.5 && (
                        <span className="font-mono text-xs font-black bg-blue-600 text-white px-1.5 py-0.5 rounded leading-none">
                          {p.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // C. Odds Tab (Detailed sports betting odds overview)
  const renderOddsTab = () => {
    return (
      <div className="space-y-4">
        <div className="bg-slate-50 dark:bg-slate-900/45 p-4 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800/60">
          <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider block">
            Comparador de Apostas Esportivas
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Odds atualizadas em tempo real com multiplicadores de lucro estimados. Aposte com responsabilidade.
          </p>
        </div>

        <div className="grid gap-3.5">
          {/* Detailed premium statistics */}
          <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 bg-white dark:bg-slate-900/30">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Probabilidade de Vitória (Simulação)
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                <span>{match.homeClubName} (33%)</span>
                <span>Empate (10%)</span>
                <span>{match.awayClubName} (67%)</span>
              </div>
              <div className="h-3 w-full flex rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <div className="bg-blue-400 w-[33%]"></div>
                <div className="bg-slate-300 w-[10%]"></div>
                <div className="bg-[#1E3A8A] w-[67%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // D. Direto Tab (Play-by-play commentary log)
  const renderDiretoTab = () => {
    return (
      <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
        <div className="bg-rose-50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900/40 p-3 rounded-xl flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="leading-tight">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-400 block">Comentários ao Vivo</span>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-500/80">Partida em tempo real via satélite.</span>
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="border-l-2 border-blue-600 pl-3 space-y-1">
            <span className="text-[10px] text-blue-600 font-bold font-mono">90'+11</span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Fim do Jogo!</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              O árbitro encerra a partida em um confronto disputado e eletrizante até o último suspiro.
            </p>
          </div>

          <div className="border-l-2 border-slate-300 dark:border-slate-800 pl-3 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold font-mono">90'+10</span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">GOLO DO BRASIL! Neymar de pênalti!</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Neymar cobra o pênalti com extrema frieza e categoria deslocando o goleiro norueguês.
            </p>
          </div>

          <div className="border-l-2 border-slate-300 dark:border-slate-800 pl-3 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold font-mono">79'</span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">GOLO DA NORUEGA! Haaland amplia!</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Haaland sobe mais alto que toda a defesa após cruzamento de escanteio perfeito.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // E. Noticias Tab (Related News)
  const renderNoticiasTab = () => {
    const relatedNews = news.filter(
      (n) => n.clubId === match.homeClubId || n.clubId === match.awayClubId
    );
    const displayNews = relatedNews.length > 0 ? relatedNews : news.slice(0, 3);

    return (
      <div className="space-y-4">
        {displayNews.map((n) => (
          <div
            key={n.id}
            className="flex items-start space-x-3 p-2.5 border border-slate-100 dark:border-slate-800/60 rounded-xl hover:border-[#1E3A8A] transition-all cursor-pointer bg-slate-50/30"
          >
            <img
              src={n.imageUrl}
              alt={n.title}
              className="w-20 h-20 rounded-lg object-cover bg-zinc-100 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-1 leading-tight min-w-0">
              <span className="text-[9px] text-[#1E3A8A] font-black uppercase tracking-wider block">
                {n.category}
              </span>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-2 leading-snug">
                {n.title}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                {n.summary}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const pHome = match.stats?.possession?.home ?? 0;
  const pAway = match.stats?.possession?.away ?? 0;

  let homeColor = '#000000'; // black
  let awayColor = '#000000'; // black

  if (pHome > pAway) {
    homeColor = '#3B82F6'; // blue
    awayColor = '#000000'; // black
  } else if (pAway > pHome) {
    homeColor = '#000000'; // black
    awayColor = '#3B82F6'; // blue
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-24 text-slate-900">
      {/* MATCH SCORE BANNER HEADER (BEAUTIFUL DEEP BLUE DESIGN FROM SCREENSHOT) */}
      <div className="bg-[#1E3A8A] text-white shadow-lg relative overflow-hidden pb-4">
        {/* Navigation line */}
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 sticky top-0 bg-[#1E3A8A] z-30">
          <button
            onClick={navigateBack}
            className="p-1.5 hover:bg-white/10 rounded-full transition-all cursor-pointer"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-white/90">
            Ficha do Jogo
          </span>
          <button
            onClick={() => toggleFavorite('matches', match.id)}
            className="p-1.5 hover:bg-white/10 rounded-full transition-all cursor-pointer"
          >
            <Star className={`w-5 h-5 ${isFav ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`} />
          </button>
        </div>

        {/* Dynamic Teams Grid & Circular Gauges from screenshot */}
        <div className="max-w-6xl mx-auto px-4 pt-4 space-y-4">
          <div className="text-center">
            <span className="text-[10.5px] text-white/90 font-black tracking-widest uppercase">
              {match.championshipName.replace(/🇺🇳|🇲🇿|🇪🇺|🇪🇸|🇧🇷/g, '').trim()}
              {match.round ? ` (${match.round}ª Rodada)` : ''}
              {displayPhase ? ` • ${displayPhase}` : ''}
            </span>
          </div>

          <div className="flex items-center justify-between">
            {/* Left: Home Team Circle Gauge */}
            <div 
              onClick={() => navigateTo({ type: 'club', id: match.homeClubId })}
              className="flex flex-col items-center justify-center space-y-2 w-[32%] text-center cursor-pointer group/home select-none"
            >
              <div className="relative">
                <div className="relative w-18 h-18 flex items-center justify-center group-hover/home:scale-105 transition-transform">
                  {/* Circular Gauge SVG */}
                  <svg className="absolute inset-0 w-18 h-18 -rotate-90" viewBox="0 0 72 72">
                    {/* Background Circle Track */}
                    <circle
                      cx="36"
                      cy="36"
                      r="32"
                      stroke="#cbd5e1"
                      strokeWidth="4.5"
                      fill="transparent"
                    />
                    {/* Foreground Percentage Circle */}
                    <circle
                      cx="36"
                      cy="36"
                      r="32"
                      stroke={homeColor}
                      strokeWidth="4.5"
                      fill="transparent"
                      strokeDasharray="201"
                      strokeDashoffset={201 * (1 - pHome / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  {/* Inner Crest with White Background */}
                  <div className="w-13 h-13 rounded-full bg-white p-1 flex items-center justify-center z-10 shadow-inner">
                    <img
                      src={match.homeClubLogo}
                      alt={match.homeClubName}
                      className="w-full h-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
              <div className="leading-tight flex flex-col items-center">
                <span className="text-[9.5px] text-white/80 font-black block uppercase tracking-wider">
                  {pHome}%
                </span>
                <span className="text-xs font-black tracking-wide text-white block truncate max-w-[90px] group-hover/home:underline">
                  {match.homeClubName}
                </span>
              </div>
            </div>

            {/* Center: Large Score */}
            <div className="flex flex-col items-center justify-center w-[36%] text-center space-y-1">
              <span className="text-3xl font-sans font-black tracking-tighter text-white">
                {match.score.home} - {match.score.away}
              </span>
              {match.isExtraTime && (
                <span className="text-[9.5px] text-amber-300 font-extrabold uppercase tracking-wider block bg-amber-500/20 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                  Prorr: {match.scoreExtraTime?.home ?? match.score.home} - {match.scoreExtraTime?.away ?? match.score.away}
                </span>
              )}
              {match.scorePenalties && (
                <span className="text-[9.5px] text-rose-300 font-extrabold uppercase tracking-wider block bg-rose-500/20 px-2.5 py-0.5 rounded-md border border-rose-500/30 mt-1">
                  Pênaltis: {match.scorePenalties.home} - {match.scorePenalties.away}
                </span>
              )}
              <span className="text-[9px] text-white/90 font-extrabold uppercase tracking-widest block font-mono">
                {getFormattedMatchDate(match.date, match.time)}
              </span>
              <div className="pt-1.5">
                {match.status === MatchStatus.LIVE ? (
                  <span className="bg-rose-500 text-white text-[9.5px] font-black px-3 py-1 rounded-md animate-pulse uppercase tracking-wider block">
                    Em Jogo ({formatMatchMinute(match.minute, match.injuryTime1stHalf, match.injuryTime2ndHalf)})
                  </span>
                ) : match.status === MatchStatus.HT ? (
                  <span className="bg-blue-500 text-white text-[9.5px] font-black px-3 py-1 rounded-md uppercase tracking-wider block">
                    Intervalo
                  </span>
                ) : match.status === MatchStatus.FINISHED ? (
                  <span className="bg-red-600 text-white text-[9.5px] font-black px-3 py-1 rounded-md uppercase tracking-wider block">
                    Terminou
                  </span>
                ) : (
                  <span className="bg-slate-600 text-white text-[9.5px] font-black px-3 py-1 rounded-md uppercase tracking-wider block">
                    Não Iniciado
                  </span>
                )}
              </div>
            </div>

            {/* Right: Away Team Circle Gauge */}
            <div 
              onClick={() => navigateTo({ type: 'club', id: match.awayClubId })}
              className="flex flex-col items-center justify-center space-y-2 w-[32%] text-center cursor-pointer group/away select-none"
            >
              <div className="relative">
                <div className="relative w-18 h-18 flex items-center justify-center group-hover/away:scale-105 transition-transform">
                  {/* Circular Gauge SVG */}
                  <svg className="absolute inset-0 w-18 h-18 -rotate-90" viewBox="0 0 72 72">
                    {/* Background Circle Track */}
                    <circle
                      cx="36"
                      cy="36"
                      r="32"
                      stroke="#cbd5e1"
                      strokeWidth="4.5"
                      fill="transparent"
                    />
                    {/* Foreground Percentage Circle */}
                    <circle
                      cx="36"
                      cy="36"
                      r="32"
                      stroke={awayColor}
                      strokeWidth="4.5"
                      fill="transparent"
                      strokeDasharray="201"
                      strokeDashoffset={201 * (1 - pAway / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  {/* Inner Crest with White Background */}
                  <div className="w-13 h-13 rounded-full bg-white p-1 flex items-center justify-center z-10 shadow-inner">
                    <img
                      src={match.awayClubLogo}
                      alt={match.awayClubName}
                      className="w-full h-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
              <div className="leading-tight flex flex-col items-center">
                <span className="text-[9.5px] text-white/80 font-black block uppercase tracking-wider">
                  {pAway}%
                </span>
                <span className="text-xs font-black tracking-wide text-white block truncate max-w-[90px] group-hover/away:underline">
                  {match.awayClubName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. MATCH DETAILS TAB BAR (From Screenshot) */}
        <div className="max-w-6xl mx-auto mt-6 px-1 border-t border-white/10 pt-2 select-none">
          <div className="flex justify-between items-center text-[10.5px] font-black uppercase tracking-wider text-white/70">
            <button
              onClick={() => setActiveTab('previa')}
              className={`pb-1.5 px-1.5 transition-colors relative cursor-pointer ${
                activeTab === 'previa' ? 'text-white' : 'hover:text-white'
              }`}
            >
              <span>Prévia</span>
              {activeTab === 'previa' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>}
            </button>

            <button
              onClick={() => setActiveTab('formacoes')}
              className={`pb-1.5 px-1.5 transition-colors relative cursor-pointer ${
                activeTab === 'formacoes' ? 'text-white' : 'hover:text-white'
              }`}
            >
              <span>Formações</span>
              {activeTab === 'formacoes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>}
            </button>

            <button
              onClick={() => setActiveTab('eventos')}
              className={`pb-1.5 px-1.5 transition-colors relative cursor-pointer ${
                activeTab === 'eventos' ? 'text-white' : 'hover:text-white'
              }`}
            >
              <span>Eventos</span>
              {activeTab === 'eventos' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>}
            </button>

            {isInitialMatch && (
              <button
                onClick={() => setActiveTab('direto')}
                className={`pb-1.5 px-1.5 transition-colors relative cursor-pointer ${
                  activeTab === 'direto' ? 'text-white' : 'hover:text-white'
                }`}
              >
                <span>Direto</span>
                {activeTab === 'direto' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>}
              </button>
            )}

            <button
              onClick={() => setActiveTab('noticias')}
              className={`pb-1.5 px-1.5 transition-colors relative cursor-pointer ${
                activeTab === 'noticias' ? 'text-white' : 'hover:text-white'
              }`}
            >
              <span>Notícias</span>
              {activeTab === 'noticias' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>}
            </button>
          </div>
        </div>
      </div>

      {/* 3. TABS ACTIVE COMPONENT VIEW CONTAINER */}
      <div className="max-w-6xl mx-auto px-4 mt-4">
        {activeTab === 'previa' && renderPreviaTab()}
        {activeTab === 'eventos' && renderEventosTab()}
        {activeTab === 'formacoes' && renderFormacoesTab()}
        {activeTab === 'direto' && isInitialMatch && renderDiretoTab()}
        {activeTab === 'noticias' && renderNoticiasTab()}
      </div>
    </div>
  );
};
