import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Star, Trophy, Target, Award, ListOrdered, FileText, Calendar, MapPin } from 'lucide-react';
import { Match, StandingRow, formatMatchMinute } from '../types';

interface LeagueDetailsProps {
  leagueId: string;
}

export const LeagueDetails: React.FC<LeagueDetailsProps> = ({ leagueId }) => {
  const { championships, matches, favorites, toggleFavorite, navigateBack, navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState<'standings' | 'matches' | 'stats' | 'regulations'>('standings');

  const league = championships.find((c) => c.id === leagueId);

  const getRecentForm = (clubId: string, championshipId: string) => {
    // Find all finished matches of this club in this championship
    const clubMatches = matches
      .filter(
        (m) =>
          m.championshipId === championshipId &&
          m.status === 'Encerrado' &&
          (m.homeClubId === clubId || m.awayClubId === clubId)
      )
      .sort((a, b) => {
        const rA = Number(a.round) || 0;
        const rB = Number(b.round) || 0;
        if (rA !== rB) return rA - rB;
        return a.date.localeCompare(b.date);
      });

    // Get the last 5 matches
    const last5 = clubMatches.slice(-5);

    // Map to 'V', 'E', 'D'
    const formSymbols = last5.map((m) => {
      const isHome = m.homeClubId === clubId;
      const homeScore = m.score.home;
      const awayScore = m.score.away;

      if (homeScore === awayScore) {
        return 'E';
      }
      if (isHome) {
        return homeScore > awayScore ? 'V' : 'D';
      } else {
        return awayScore > homeScore ? 'V' : 'D';
      }
    });

    // Fill up to 5 with '?'
    while (formSymbols.length < 5) {
      formSymbols.push('?');
    }

    return formSymbols;
  };

  // Helper to render the standings table
  const renderStandingsTable = (rows: StandingRow[]) => {
    const maxPlayed = Math.max(...rows.map((r) => r.played));

    return (
      <div className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-[#0F172A] shadow-xs">
        <table className="w-full text-[10px] text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-extrabold uppercase tracking-tight text-center text-[9px]">
              <th className="w-[7%] py-2 text-center border-r border-zinc-200 dark:border-zinc-800">Pos</th>
              <th className="w-[37%] py-2 text-left px-1.5 border-r border-zinc-200 dark:border-zinc-800">Clube</th>
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
            {rows.map((row, idx) => {
              const bgClass = idx === 0
                ? 'bg-[#22c55e]'
                : idx >= rows.length - 3 && rows.length > 3
                ? 'bg-[#ef4444]'
                : 'bg-[#94a3b8] dark:bg-zinc-600';

              const recentForm = getRecentForm(row.clubId, leagueId);
              const diff = row.played - maxPlayed;

              return (
                <tr
                  key={row.clubId}
                  className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/10 transition-colors text-center text-zinc-700 dark:text-zinc-300"
                >
                  <td className={`p-0 w-[7%] text-center font-black text-xs text-white border-r border-zinc-200 dark:border-zinc-800 ${bgClass}`}>
                    <div className="w-full h-10 flex items-center justify-center">
                      {idx + 1}
                    </div>
                  </td>

                  <td className="py-1 px-1.5 w-[37%] text-left border-r border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col justify-center min-w-0">
                      <div
                        onClick={() => navigateTo({ type: 'club', id: row.clubId })}
                        className="flex items-center space-x-1 cursor-pointer group"
                      >
                        <img
                          src={row.logoUrl}
                          alt=""
                          className="w-4 h-4 rounded-full object-cover bg-white shadow-3xs border border-zinc-200 dark:border-zinc-700 transition-transform group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <span className="font-extrabold text-zinc-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 group-hover:underline text-[10px] transition-colors truncate leading-tight">
                          {row.clubName}
                        </span>
                      </div>
                      
                      {/* Recent Form small icons row */}
                      <div className="flex items-center space-x-0.5 mt-1">
                        {recentForm.map((symbol, sIdx) => {
                          const symBg = symbol === 'V'
                            ? 'bg-[#22c55e]'
                            : symbol === 'E'
                            ? 'bg-[#fbbf24]'
                            : symbol === 'D'
                            ? 'bg-[#ef4444]'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500';
                          return (
                            <span
                              key={sIdx}
                              className={`w-3.5 h-3.5 rounded-[2px] flex items-center justify-center text-[8px] font-black text-white shadow-3xs ${symBg}`}
                              title={symbol === 'V' ? 'Vitória' : symbol === 'E' ? 'Empate' : symbol === 'D' ? 'Derrota' : 'Sem Jogo'}
                            >
                              {symbol}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </td>

                  <td className="py-1 w-[10%] text-center font-black text-zinc-900 dark:text-white text-[12px] border-r border-zinc-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-slate-950/15">
                    {row.points}
                  </td>
                  <td className="py-1 w-[8%] text-center border-r border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 text-[10px]">{row.played}</span>
                      {diff < 0 && (
                        <span className="text-[7.5px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">{diff}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-1 w-[7%] text-center font-mono text-zinc-600 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 text-[9.5px]">{row.won}</td>
                  <td className="py-1 w-[7%] text-center font-mono text-zinc-600 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 text-[9.5px]">{row.drawn}</td>
                  <td className="py-1 w-[7%] text-center font-mono text-zinc-600 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 text-[9.5px]">{row.lost}</td>
                  <td className="py-1 w-[8%] text-center font-mono text-zinc-500 dark:text-zinc-500 border-r border-zinc-200 dark:border-zinc-800 text-[9.5px]">{row.goalsFor}</td>
                  <td className="py-1 w-[8%] text-center font-mono text-zinc-500 dark:text-zinc-500 border-r border-zinc-200 dark:border-zinc-800 text-[9.5px]">{row.goalsAgainst}</td>
                  <td
                    className={`py-1 w-[9%] text-center font-bold text-[9.5px] ${
                      row.goalDifference > 0
                        ? 'text-zinc-800 dark:text-zinc-200'
                        : row.goalDifference < 0
                        ? 'text-rose-500 font-black'
                        : 'text-zinc-500'
                    }`}
                  >
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderStandingsWithGroups = (standings: StandingRow[]) => {
    const grouped: { [key: string]: StandingRow[] } = {};
    let hasGroups = false;

    standings.forEach(row => {
      const g = row.group || 'Sem Grupo';
      if (row.group) hasGroups = true;
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(row);
    });

    if (!hasGroups) {
      return renderStandingsTable(standings);
    }

    // Sort each group's standings
    Object.keys(grouped).forEach(g => {
      grouped[g].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });
    });

    const sortedGroups = Object.keys(grouped).sort();

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedGroups.map(groupName => (
          <div key={groupName} className="bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-850 rounded-2xl p-4 shadow-xs">
            <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/60 flex justify-between items-center">
              <span>{groupName}</span>
              <span className="text-[10px] text-zinc-400 font-bold font-mono">({grouped[groupName].length} Equipes)</span>
            </h4>
            {renderStandingsTable(grouped[groupName])}
          </div>
        ))}
      </div>
    );
  };

  // Filter matches belonging to this league
  const leagueMatches = matches.filter((m) => m.championshipId === leagueId);

  // For Cup phases
  const cupPhasesWithMatches = Array.from(new Set(leagueMatches.map((m) => m.phase).filter(Boolean))) as string[];
  const defaultCupPhases = ['Fase de Grupos', 'Oitavos de Final', 'Quartas de Final', 'Semifinal', 'Final'];
  const displayCupPhases = cupPhasesWithMatches.length > 0 ?
    defaultCupPhases.filter(p => cupPhasesWithMatches.includes(p)).concat(cupPhasesWithMatches.filter(p => !defaultCupPhases.includes(p)))
    : defaultCupPhases;

  const initialCupPhase = displayCupPhases.includes('Oitavos de Final') ? 'Oitavos de Final' : (displayCupPhases[0] || 'Oitavos de Final');
  const [selectedCupPhase, setSelectedCupPhase] = useState<string>(initialCupPhase);
  const [cupTab, setCupTab] = useState<'bracket' | 'groups'>(league?.standings && league.standings.length > 0 ? 'groups' : 'bracket');

  // Calculate unique round numbers available in matches or fallback to league round limit
  const roundsWithMatches = Array.from(new Set(leagueMatches.map((m) => m.round))).sort((a, b) => Number(a) - Number(b));
  const totalRoundsCount = league?.roundsCount || 4;
  const roundsArray = Array.from({ length: totalRoundsCount }, (_, i) => i + 1);
  const displayRounds = roundsWithMatches.length > 0 ? roundsWithMatches : roundsArray;

  const currentOrFirstRound = league && displayRounds.includes(league.currentRound) ? league.currentRound : displayRounds[0] || 1;
  const [selectedRound, setSelectedRound] = useState<number>(currentOrFirstRound);

  const renderBracketMatchCard = (match: Match) => {
    const isFinished = match.status === 'Encerrado';
    const isLive = match.status === 'Ao Vivo' || match.status === 'Intervalo';
    
    return (
      <div
        key={match.id}
        onClick={() => navigateTo({ type: 'match', id: match.id })}
        className="bg-zinc-50 dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 p-3 rounded-xl transition-all cursor-pointer hover:border-emerald-500 hover:shadow-sm flex flex-col justify-between space-y-2 relative group"
      >
        <div className="flex items-center justify-between text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
          <span>📆 {match.date}</span>
          {isLive ? (
            <span className="bg-rose-500 text-white text-[7.5px] font-black px-1 py-0.5 rounded animate-pulse">LIVE</span>
          ) : isFinished ? (
            <span className="text-zinc-400 dark:text-zinc-500">ENC</span>
          ) : (
            <span className="text-blue-500">AGEND</span>
          )}
        </div>

        {/* Home & Away lines */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 min-w-0">
              <img src={match.homeClubLogo} alt="" className="w-4 h-4 rounded-full object-cover bg-white" referrerPolicy="no-referrer" />
              <span className={`text-[10px] truncate font-bold ${isFinished && match.score.home > match.score.away ? 'text-zinc-900 dark:text-white font-black' : 'text-zinc-500 dark:text-zinc-400'}`}>
                {match.homeClubName}
              </span>
            </div>
            <span className="font-mono text-[11px] font-black">
              {match.score.home}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 min-w-0">
              <img src={match.awayClubLogo} alt="" className="w-4 h-4 rounded-full object-cover bg-white" referrerPolicy="no-referrer" />
              <span className={`text-[10px] truncate font-bold ${isFinished && match.score.away > match.score.home ? 'text-zinc-900 dark:text-white font-black' : 'text-zinc-500 dark:text-zinc-400'}`}>
                {match.awayClubName}
              </span>
            </div>
            <span className="font-mono text-[11px] font-black">
              {match.score.away}
            </span>
          </div>
        </div>

        {/* Shootout or ET info */}
        {(match.isExtraTime || match.scorePenalties) && (
          <div className="text-[8px] font-black text-amber-500 border-t border-dashed border-zinc-200 dark:border-slate-800 pt-1.5 flex flex-wrap justify-between items-center gap-1">
            {match.isExtraTime && (
              <span>PRO: {match.scoreExtraTime?.home ?? match.score.home}x{match.scoreExtraTime?.away ?? match.score.away}</span>
            )}
            {match.scorePenalties && (
              <span className="text-rose-500 font-extrabold">PÊN: {match.scorePenalties.home}x{match.scorePenalties.away}</span>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!league) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-zinc-500">Campeonato não encontrado.</p>
        <button
          onClick={navigateBack}
          className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
        >
          Voltar
        </button>
      </div>
    );
  }

  const isFav = favorites.championships.includes(league.id);
  const isEnded = league.status === 'Encerrado';

  return (
    <div className="max-w-6xl mx-auto px-4 pt-4 pb-20 space-y-6">
      {/* League Header */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        {isEnded && (
          <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-sm">
            Histórico Congelado
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={navigateBack}
            className="flex items-center space-x-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <button
            onClick={() => toggleFavorite('championships', league.id)}
            className="p-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 rounded-full cursor-pointer text-zinc-400 hover:text-yellow-400 transition-colors"
          >
            <Star className={`w-5 h-5 ${isFav ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {league.logoUrl ? (
            <img src={league.logoUrl} alt="" className="w-16 h-16 object-contain bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-1 shrink-0 shadow" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-3xl shadow">
              {isEnded ? '📜' : '🏆'}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight flex items-center gap-2">
              <span>{league.name}</span>
              {isEnded && (
                <span className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Histórico
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-500 font-semibold uppercase mt-1">
              {league.type} • Temporada {league.season} {isEnded && ' (Encerrada)'}
            </p>
          </div>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800/80">
        <button
          onClick={() => setActiveTab('standings')}
          className={`flex-1 min-w-[100px] py-3 text-sm font-bold text-center border-b-2 cursor-pointer transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'standings'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent text-zinc-500 hover:text-emerald-500'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>Classificação</span>
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex-1 min-w-[100px] py-3 text-sm font-bold text-center border-b-2 cursor-pointer transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'matches'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent text-zinc-500 hover:text-emerald-500'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Jogos & Rodadas</span>
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 min-w-[100px] py-3 text-sm font-bold text-center border-b-2 cursor-pointer transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'stats'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent text-zinc-500 hover:text-emerald-500'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Estatísticas</span>
        </button>
        <button
          onClick={() => setActiveTab('regulations')}
          className={`flex-1 min-w-[100px] py-3 text-sm font-bold text-center border-b-2 cursor-pointer transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'regulations'
              ? 'border-emerald-500 text-emerald-500'
              : 'border-transparent text-zinc-500 hover:text-emerald-500'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Regulamento</span>
        </button>
      </div>

      {/* Panels */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
        {activeTab === 'standings' && (
          league.type === 'Copa' ? (
            <div className="space-y-6 animate-fade-in">
              {/* Cup Bracket Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 gap-2">
                <div>
                  <h3 className="text-xs font-black text-zinc-700 dark:text-zinc-200 uppercase tracking-wider flex items-center space-x-1.5">
                    <Trophy className="w-4 h-4 text-emerald-500" />
                    <span>Árvore de Playoffs (Chaveamento)</span>
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-semibold uppercase mt-0.5">
                    Fases Eliminatórias Diretas • Clique em um jogo para detalhes
                  </p>
                </div>
                {league.standings && league.standings.length > 0 && (
                  <div className="flex space-x-1 bg-zinc-100 dark:bg-slate-950 p-1 rounded-lg self-start sm:self-auto">
                    <button
                      onClick={() => setCupTab('groups')}
                      className={`px-3 py-1 text-[9px] font-black uppercase rounded transition-all ${
                        cupTab === 'groups'
                          ? 'bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                      }`}
                    >
                      Grupos
                    </button>
                    <button
                      onClick={() => setCupTab('bracket')}
                      className={`px-3 py-1 text-[9px] font-black uppercase rounded transition-all ${
                        cupTab === 'bracket'
                          ? 'bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                      }`}
                    >
                      Chaveamento
                    </button>
                  </div>
                )}
              </div>

              {cupTab === 'groups' && league.standings && league.standings.length > 0 ? (
                renderStandingsWithGroups(league.standings)
              ) : (
                /* PLAYOFF BRACKET (CHAVEAMENTO) */
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-4">
                  {/* Oitavos de Final Column */}
                  <div className="space-y-4 min-w-[210px] bg-slate-100/40 dark:bg-slate-900/10 p-3 rounded-2xl border border-zinc-150 dark:border-slate-800">
                    <div className="bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-850 px-3 py-2 rounded-xl text-center shadow-2xs">
                      <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Oitavos de Final</span>
                    </div>
                    <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                      {(() => {
                        const oitavos = leagueMatches.filter(m => (m.phase || '').toLowerCase().includes('oitavo'));
                        if (oitavos.length === 0) {
                          return <div className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 py-10 italic border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">Sem jogos definidos</div>;
                        }
                        return oitavos.map(m => renderBracketMatchCard(m));
                      })()}
                    </div>
                  </div>

                  {/* Quartas de Final Column */}
                  <div className="space-y-4 min-w-[210px] bg-slate-100/40 dark:bg-slate-900/10 p-3 rounded-2xl border border-zinc-150 dark:border-slate-800">
                    <div className="bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-850 px-3 py-2 rounded-xl text-center shadow-2xs">
                      <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Quartas de Final</span>
                    </div>
                    <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                      {(() => {
                        const quartas = leagueMatches.filter(m => (m.phase || '').toLowerCase().includes('quarta'));
                        if (quartas.length === 0) {
                          return <div className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 py-10 italic border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">Sem jogos definidos</div>;
                        }
                        return quartas.map(m => renderBracketMatchCard(m));
                      })()}
                    </div>
                  </div>

                  {/* Semifinal Column */}
                  <div className="space-y-4 min-w-[210px] bg-slate-100/40 dark:bg-slate-900/10 p-3 rounded-2xl border border-zinc-150 dark:border-slate-800">
                    <div className="bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-850 px-3 py-2 rounded-xl text-center shadow-2xs">
                      <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Semifinais</span>
                    </div>
                    <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                      {(() => {
                        const semis = leagueMatches.filter(m => (m.phase || '').toLowerCase().includes('semi'));
                        if (semis.length === 0) {
                          return <div className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 py-10 italic border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">Sem jogos definidos</div>;
                        }
                        return semis.map(m => renderBracketMatchCard(m));
                      })()}
                    </div>
                  </div>

                  {/* Final Column */}
                  <div className="space-y-4 min-w-[210px] bg-slate-100/40 dark:bg-slate-900/10 p-3 rounded-2xl border border-zinc-150 dark:border-slate-800">
                    <div className="bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-850 px-3 py-2 rounded-xl text-center shadow-2xs">
                      <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Grande Final</span>
                    </div>
                    <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                      {(() => {
                        const finals = leagueMatches.filter(m => (m.phase || '').toLowerCase() === 'final' || m.phase === 'Final');
                        if (finals.length === 0) {
                          return <div className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 py-10 italic border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">Sem jogos definidos</div>;
                        }
                        return finals.map(m => renderBracketMatchCard(m));
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            renderStandingsWithGroups(league.standings)
          )
        )}

        {activeTab === 'matches' && (
          <div className="space-y-6">
            {/* Round Header Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4 gap-3">
              <div>
                <h3 className="text-xs font-black text-zinc-700 dark:text-zinc-200 uppercase tracking-wider flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span>Calendário Oficial de Partidas</span>
                </h3>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase mt-0.5">
                  Temporada {league.season} • {isEnded ? 'Histórico Salvo' : 'Em Andamento'}
                </p>
              </div>

              {league.type === 'Copa' ? (
                /* Cup Phase Selector Dropdown */
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 font-black uppercase">Fase:</span>
                  <select
                    value={selectedCupPhase}
                    onChange={(e) => setSelectedCupPhase(e.target.value)}
                    className="bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-lg text-xs font-bold px-3 py-1.5 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {displayCupPhases.map((phase) => (
                      <option key={phase} value={phase}>
                        {phase}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                /* Round Selector Dropdown */
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Rodada:</span>
                  <select
                    value={selectedRound}
                    onChange={(e) => setSelectedRound(Number(e.target.value))}
                    className="bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-lg text-xs font-bold px-3 py-1.5 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {displayRounds.map((r) => (
                      <option key={r} value={r}>
                        {r}ª Rodada
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Match List for Round or Phase */}
            {(() => {
              const roundMatches = league.type === 'Copa'
                ? leagueMatches.filter((m) => (m.phase || 'Oitavos de Final') === selectedCupPhase)
                : leagueMatches.filter((m) => m.round === selectedRound);

              if (roundMatches.length === 0) {
                return (
                  <div className="text-center py-12 text-zinc-400 text-xs">
                    Nenhum jogo registrado para {league.type === 'Copa' ? selectedCupPhase : `a ${selectedRound}ª Rodada`} deste campeonato.
                  </div>
                );
              }

              return (
                <div className="grid gap-4 md:grid-cols-2">
                  {roundMatches.map((match) => {
                    const isFinished = match.status === 'Encerrado';
                    const isLive = match.status === 'Ao Vivo' || match.status === 'Intervalo';

                    return (
                      <div
                        key={match.id}
                        onClick={() => navigateTo({ type: 'match', id: match.id })}
                        className="bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/60 p-4 rounded-xl hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between space-y-4"
                      >
                        {/* Top info row */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                            {match.phase ? `${match.phase} • ` : ''}📆 {match.date} • {match.time}
                          </span>

                          {/* Status Badge */}
                          {isLive ? (
                            <span className="bg-rose-500/15 text-rose-500 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse border border-rose-500/20">
                              Ao Vivo • {formatMatchMinute(match.minute, match.injuryTime1stHalf, match.injuryTime2ndHalf)}
                            </span>
                          ) : isFinished ? (
                            <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              Encerrado
                            </span>
                          ) : (
                            <span className="bg-blue-500/10 text-blue-500 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider border border-blue-500/20">
                              Agendado
                            </span>
                          )}
                        </div>

                        {/* Match Scores and Logos */}
                        <div className="flex items-center justify-between py-1">
                          {/* Home Club */}
                          <div className="flex items-center space-x-2.5 w-[42%] min-w-0">
                            <img
                              src={match.homeClubLogo}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover bg-white p-0.5 shadow-sm shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <span className="font-bold text-xs text-zinc-800 dark:text-white truncate">
                              {match.homeClubName}
                            </span>
                          </div>

                          {/* Score Container */}
                          <div className="flex flex-col items-center space-y-1 bg-zinc-200/50 dark:bg-slate-950 border border-zinc-300/40 dark:border-zinc-800 px-3 py-1.5 rounded-xl">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm font-black text-zinc-800 dark:text-white">
                                {match.score.home}
                              </span>
                              <span className="text-[10px] font-black text-zinc-400 font-mono">x</span>
                              <span className="font-mono text-sm font-black text-zinc-800 dark:text-white">
                                {match.score.away}
                              </span>
                            </div>
                            {match.isExtraTime && (
                              <span className="text-[8px] font-black text-amber-500 uppercase tracking-wide">
                                (Prorr: {match.scoreExtraTime?.home ?? match.score.home}x{match.scoreExtraTime?.away ?? match.score.away})
                              </span>
                            )}
                            {match.scorePenalties && (
                              <span className="text-[8px] font-black text-rose-500 uppercase tracking-wide">
                                (Pên: {match.scorePenalties.home}x{match.scorePenalties.away})
                              </span>
                            )}
                          </div>

                          {/* Away Club */}
                          <div className="flex items-center space-x-2.5 w-[42%] justify-end text-right min-w-0">
                            <span className="font-bold text-xs text-zinc-800 dark:text-white truncate">
                              {match.awayClubName}
                            </span>
                            <img
                              src={match.awayClubLogo}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover bg-white p-0.5 shadow-sm shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>

                        {/* Venue details row */}
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 border-t border-slate-200/50 dark:border-slate-800/50 pt-2 font-medium">
                          <span className="truncate max-w-[140px] flex items-center space-x-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{match.stadium || 'Estádio não definido'}</span>
                          </span>
                          <span className="truncate max-w-[110px] text-right">
                            Árbitro: {match.referee || 'A definir'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Scorers */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <Award className="w-4 h-4 text-emerald-500" />
                <span>Artilharia (Gols)</span>
              </h3>
              <div className="space-y-2">
                {league.topScorers.map((scorer, idx) => (
                  <div
                    key={scorer.playerId}
                    onClick={() => navigateTo({ type: 'player', id: scorer.playerId })}
                    className="flex items-center justify-between p-2.5 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-emerald-500 transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-xs font-bold text-zinc-400 w-5">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{scorer.playerName}</p>
                        <p className="text-[10px] text-zinc-400 font-semibold uppercase">{scorer.clubName}</p>
                      </div>
                    </div>
                    <span className="font-mono font-black text-sm bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg">
                      {scorer.goals} Gols
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Assists */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <Target className="w-4 h-4 text-blue-500" />
                <span>Líderes de Assistências</span>
              </h3>
              <div className="space-y-2">
                {league.topAssists.map((assist, idx) => (
                  <div
                    key={assist.playerId}
                    onClick={() => navigateTo({ type: 'player', id: assist.playerId })}
                    className="flex items-center justify-between p-2.5 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-blue-500 transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-xs font-bold text-zinc-400 w-5">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{assist.playerName}</p>
                        <p className="text-[10px] text-zinc-400 font-semibold uppercase">{assist.clubName}</p>
                      </div>
                    </div>
                    <span className="font-mono font-black text-sm bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg">
                      {assist.assists} Assist
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'regulations' && (
          <div className="space-y-4 py-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Regulamento Oficial</span>
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium whitespace-pre-wrap">
              {league.regulations}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
