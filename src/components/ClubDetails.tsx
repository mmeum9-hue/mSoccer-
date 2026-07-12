import React from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Star, MapPin, Trophy, Users, Calendar, BarChart3 } from 'lucide-react';

interface ClubDetailsProps {
  clubId: string;
}

export const ClubDetails: React.FC<ClubDetailsProps> = ({ clubId }) => {
  const { clubs, players, matches, favorites, toggleFavorite, navigateBack, navigateTo } = useApp();

  const club = clubs.find((c) => c.id === clubId);
  const clubPlayers = players.filter((p) => p.clubId === clubId);
  const clubMatches = matches.filter((m) => m.homeClubId === clubId || m.awayClubId === clubId);

  if (!club) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-zinc-500">Clube não encontrado.</p>
        <button
          onClick={navigateBack}
          className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
        >
          Voltar
        </button>
      </div>
    );
  }

  // Calculate stats dynamically from finished matches in the system
  const finishedClubMatches = matches.filter(
    (m) => (m.homeClubId === club.id || m.awayClubId === club.id) && m.status === 'Encerrado'
  );

  let wins = club.stats?.wins ?? 0;
  let draws = club.stats?.draws ?? 0;
  let losses = club.stats?.losses ?? 0;
  let goalsScored = club.stats?.goalsScored ?? 0;
  let goalsConceded = club.stats?.goalsConceded ?? 0;

  finishedClubMatches.forEach((m) => {
    const isHome = m.homeClubId === club.id;
    const myScore = isHome ? m.score.home : m.score.away;
    const opponentScore = isHome ? m.score.away : m.score.home;

    goalsScored += myScore;
    goalsConceded += opponentScore;

    if (myScore > opponentScore) {
      wins += 1;
    } else if (myScore < opponentScore) {
      losses += 1;
    } else {
      draws += 1;
    }
  });

  const isFav = favorites.clubs.includes(club.id);

  return (
    <div className="max-w-6xl mx-auto px-4 pt-4 pb-20 space-y-6">
      {/* Club Header Card */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={navigateBack}
            className="flex items-center space-x-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <button
            onClick={() => toggleFavorite('clubs', club.id)}
            className="p-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 rounded-full cursor-pointer text-zinc-400 hover:text-yellow-400 transition-colors"
          >
            <Star className={`w-5 h-5 ${isFav ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <img
            src={club.logoUrl}
            alt={club.name}
            className="w-24 h-24 rounded-full object-cover bg-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-md shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="text-center sm:text-left space-y-1.5">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight">
              {club.name}
            </h2>
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-3 gap-y-1 text-xs text-zinc-500">
              <span>📍 {club.country}</span>
              <span>📅 Fundado em {club.founded}</span>
              <span>🏟️ {club.stadium}</span>
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-400">
              <span className="font-bold">Treinador:</span> {club.manager}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left column: Stats and Honors */}
        <div className="space-y-6 md:col-span-1">
          {/* Season Stats */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span>Estatísticas da Temporada</span>
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-xl">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg block">
                  {wins}
                </span>
                <span className="text-[10px] text-zinc-500">Vitórias</span>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl">
                <span className="text-zinc-600 dark:text-zinc-300 font-bold text-lg block">
                  {draws}
                </span>
                <span className="text-[10px] text-zinc-500">Empates</span>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/20 p-2 rounded-xl">
                <span className="text-rose-600 dark:text-rose-400 font-bold text-lg block">
                  {losses}
                </span>
                <span className="text-[10px] text-zinc-500">Derrotas</span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>Gols Marcados:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{goalsScored}</span>
              </div>
              <div className="flex justify-between">
                <span>Gols Sofridos:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{goalsConceded}</span>
              </div>
              <div className="flex justify-between">
                <span>Saldo de Gols:</span>
                <span className="font-bold text-emerald-500">
                  {goalsScored - goalsConceded}
                </span>
              </div>
            </div>
          </div>

          {/* Honors/Titles */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>Galeria de Títulos</span>
            </h3>
            <div className="space-y-2">
              {club.titles.map((title, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-sm text-zinc-800 dark:text-zinc-200">
                  <span className="text-yellow-500 font-bold">🏆</span>
                  <span>{title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right columns: Squad and Fixtures */}
        <div className="space-y-6 md:col-span-2">
          {/* Squad list */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Users className="w-4 h-4 text-emerald-500" />
              <span>Elenco Atual ({clubPlayers.length})</span>
            </h3>
            {clubPlayers.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">Nenhum jogador cadastrado para este clube.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {clubPlayers.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => navigateTo({ type: 'player', id: player.id })}
                    className="flex items-center space-x-3 p-2.5 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-emerald-500 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/25 transition-all cursor-pointer"
                  >
                    <img
                      src={player.photoUrl}
                      alt={player.name}
                      className="w-10 h-10 rounded-full object-cover bg-zinc-100 border border-zinc-200 dark:border-zinc-800"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{player.name}</p>
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase">
                        Nº {player.number} • {player.position}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Matches list */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>Jogos Recentes e Próximos ({clubMatches.length})</span>
            </h3>
            {clubMatches.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">Nenhuma partida registrada para esta equipe.</p>
            ) : (
              <div className="space-y-3">
                {clubMatches.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => navigateTo({ type: 'match', id: match.id })}
                    className="p-3 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-emerald-500 dark:hover:hover:border-emerald-500 transition-all cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="flex flex-col space-y-0.5">
                      <span className="font-bold text-[10px] text-emerald-500 uppercase">{match.championshipName}</span>
                      <span className="text-zinc-400">{match.date.split('-').reverse().join('/')} • R{match.round}</span>
                    </div>

                     <div className="flex items-center space-x-3">
                       <div 
                         onClick={(e) => {
                           e.stopPropagation();
                           navigateTo({ type: 'club', id: match.homeClubId });
                         }}
                         className="flex items-center space-x-1.5 cursor-pointer group/home"
                       >
                         <span className="font-bold text-zinc-800 dark:text-zinc-200 group-hover/home:text-blue-600 dark:group-hover/home:text-blue-400 transition-colors">{match.homeClubName}</span>
                         <img src={match.homeClubLogo} alt="" className="w-4 h-4 rounded-full group-hover/home:scale-110 transition-transform" />
                       </div>
                       <span className="font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-800 dark:text-zinc-200">
                         {match.score.home} - {match.score.away}
                       </span>
                       <div 
                         onClick={(e) => {
                           e.stopPropagation();
                           navigateTo({ type: 'club', id: match.awayClubId });
                         }}
                         className="flex items-center space-x-1.5 cursor-pointer group/away"
                       >
                         <img src={match.awayClubLogo} alt="" className="w-4 h-4 rounded-full group-hover/away:scale-110 transition-transform" />
                         <span className="font-bold text-zinc-800 dark:text-zinc-200 group-hover/away:text-blue-600 dark:group-hover/away:text-blue-400 transition-colors">{match.awayClubName}</span>
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
