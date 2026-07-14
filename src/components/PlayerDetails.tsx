import React from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Star, Trophy, Award, Calendar, Activity, Globe, DollarSign } from 'lucide-react';

interface PlayerDetailsProps {
  playerId: string;
}

export const PlayerDetails: React.FC<PlayerDetailsProps> = ({ playerId }) => {
  const { players, favorites, toggleFavorite, navigateBack, navigateTo } = useApp();

  const player = players.find((p) => p.id === playerId);

  if (!player) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-zinc-500">Jogador não encontrado.</p>
        <button
          onClick={navigateBack}
          className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
        >
          Voltar
        </button>
      </div>
    );
  }

  const isFav = favorites.players.includes(player.id);

  return (
    <div className="max-w-6xl mx-auto px-4 pt-4 pb-20 space-y-6">
      {/* Player Header Card */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={navigateBack}
            className="flex items-center space-x-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <button
            onClick={() => toggleFavorite('players', player.id)}
            className="p-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 rounded-full cursor-pointer text-zinc-400 hover:text-yellow-400 transition-colors"
          >
            <Star className={`w-5 h-5 ${isFav ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <img
            src={player.photoUrl}
            alt={player.name}
            className="w-24 h-24 rounded-full object-cover bg-zinc-100 border-2 border-emerald-500 shadow-md shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="bg-emerald-100 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                {player.position}
              </span>
              <span className="font-mono font-bold text-xs text-zinc-400">
                CAMISA Nº {player.number}
              </span>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight">
              {player.name}
            </h2>
            <p
              onClick={() => navigateTo({ type: 'club', id: player.clubId })}
              className="text-sm text-emerald-500 font-semibold cursor-pointer hover:underline"
            >
              ⚽ {player.clubName}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Bio Card */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Globe className="w-4 h-4 text-emerald-500" />
              <span>Informações Pessoais</span>
            </h3>

            <div className="space-y-3.5 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>Idade:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{player.age} anos</span>
              </div>
              <div className="flex justify-between">
                <span>Nacionalidade:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{player.nationality}</span>
              </div>
              <div className="flex justify-between">
                <span>Altura:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{player.height || '1.80 m'}</span>
              </div>
              <div className="flex justify-between">
                <span>Valor de Mercado:</span>
                <span className="font-bold text-emerald-500 flex items-center">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{player.marketValue}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Stats and Career history */}
        <div className="space-y-6 md:col-span-2">
          {/* Season Stats */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Estatísticas da Temporada</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                <span className="text-zinc-500 text-[10px] uppercase font-bold block mb-1">Jogos</span>
                <span className="font-mono font-black text-xl text-zinc-800 dark:text-zinc-200">
                  {player.stats.matches}
                </span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100/30">
                <span className="text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-bold block mb-1">Gols</span>
                <span className="font-mono font-black text-xl text-emerald-600 dark:text-emerald-400">
                  {player.stats.goals}
                </span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100/30">
                <span className="text-blue-600 dark:text-blue-400 text-[10px] uppercase font-bold block mb-1">Assistências</span>
                <span className="font-mono font-black text-xl text-blue-600 dark:text-blue-400">
                  {player.stats.assists}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                <span className="text-zinc-500 text-[10px] uppercase font-bold block mb-1">Minutos</span>
                <span className="font-mono font-black text-sm text-zinc-800 dark:text-zinc-200">
                  {player.stats.minutesPlayed}'
                </span>
              </div>
            </div>

            <div className="flex space-x-4 justify-center py-2 text-xs font-semibold">
              <span className="flex items-center space-x-1.5 text-zinc-600 dark:text-zinc-400">
                <span className="w-3.5 h-4 bg-yellow-400 rounded-xs inline-block"></span>
                <span>{player.stats.yellowCards} Amarelos</span>
              </span>
              <span className="flex items-center space-x-1.5 text-zinc-600 dark:text-zinc-400">
                <span className="w-3.5 h-4 bg-red-500 rounded-xs inline-block"></span>
                <span>{player.stats.redCards} Vermelhos</span>
              </span>
            </div>
          </div>

          {/* Career History */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Award className="w-4 h-4 text-emerald-500" />
              <span>Histórico de Carreira</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="py-2">Temporada</th>
                    <th className="py-2">Clube</th>
                    <th className="py-2 text-center">Partidas</th>
                    <th className="py-2 text-center">Gols</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300 font-medium">
                  {player.history.map((hist, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-mono">{hist.season}</td>
                      <td className="py-2.5">{hist.club}</td>
                      <td className="py-2.5 text-center font-mono">{hist.matches}</td>
                      <td className="py-2.5 text-center font-mono text-emerald-500 font-bold">{hist.goals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
