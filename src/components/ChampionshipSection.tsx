import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, ArrowRight, ShieldCheck, History, Calendar, Award } from 'lucide-react';
import { CompetitionAdBanner } from './CompetitionAdBanner';

export const ChampionshipSection: React.FC = () => {
  const { championships, navigateTo } = useApp();
  const [activeSection, setActiveSection] = useState<'active' | 'history'>('active');

  const activeChamps = championships.filter((c) => c.status !== 'Encerrado');
  const endedChamps = championships.filter((c) => c.status === 'Encerrado');

  return (
    <div className="w-full mx-auto pb-20 divide-y divide-slate-200 dark:divide-slate-800">
      {/* Header section - Single row */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between px-2.5 py-2.5 bg-white dark:bg-[#1E293B] border-b border-slate-200 dark:border-slate-800 gap-2.5">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Campeonatos & Classificação</h2>
        </div>

        {/* Section Selector tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 self-start sm:self-auto">
          <button
            onClick={() => setActiveSection('active')}
            className={`px-3 py-1.5 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSection === 'active'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white font-black'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Ativos ({activeChamps.length})</span>
          </button>
          <button
            onClick={() => setActiveSection('history')}
            className={`px-3 py-1.5 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSection === 'history'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white font-black'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico ({endedChamps.length})</span>
          </button>
        </div>
      </div>

      {activeSection === 'active' ? (
        <div className="w-full divide-y divide-slate-200 dark:divide-slate-800">
          {activeChamps.length === 0 ? (
            <div className="w-full bg-white dark:bg-[#1E293B] p-10 text-center space-y-3">
              <span className="text-4xl block">🏆</span>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Nenhum campeonato ativo no momento.</p>
              <p className="text-xs text-zinc-400">Você pode criar ou ativar campeonatos através do Painel Admin!</p>
            </div>
          ) : (
            activeChamps.map((champ, index) => (
              <React.Fragment key={champ.id}>
                <div
                  onClick={() => navigateTo({ type: 'league', id: champ.id })}
                  className="w-full bg-white dark:bg-[#1E293B] p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer flex flex-col space-y-3 rounded-none shadow-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {champ.logoUrl ? (
                        <img src={champ.logoUrl} alt="" className="w-8 h-8 object-contain bg-slate-50 dark:bg-slate-800 p-0.5 shrink-0" />
                      ) : (
                        <span className="text-2xl">🏆</span>
                      )}
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                          {champ.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">
                          Temporada {champ.season} • {champ.type}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-600 font-bold px-2 py-0.5">
                      R{champ.currentRound}
                    </span>
                  </div>

                  {/* Quick mini standings snapshot of top 3 */}
                  <div className="w-full bg-slate-50 dark:bg-[#0F172A] p-2.5 space-y-1.5 border-y border-slate-100 dark:border-slate-800/50">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Líderes</span>
                    <div className="space-y-1">
                      {champ.standings.slice(0, 3).map((team, idx) => (
                        <div key={team.clubId} className="flex items-center justify-between text-xs">
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateTo({ type: 'club', id: team.clubId });
                            }}
                            className="flex items-center space-x-2 cursor-pointer group/leader"
                          >
                            <span className="font-mono text-[10px] text-zinc-400 font-black">#{idx + 1}</span>
                            <img src={team.logoUrl} alt="" className="w-4 h-4 rounded-full group-hover/leader:scale-110 transition-transform" />
                            <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 group-hover/leader:text-blue-600 dark:group-hover/leader:text-blue-400 transition-colors">{team.clubName}</span>
                          </div>
                          <span className="font-mono font-bold text-zinc-900 dark:text-white">{team.points} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold pt-0.5">
                    <span className="text-zinc-400 flex items-center space-x-1.5 text-[10px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{champ.standings.length} clubes na disputa</span>
                    </span>
                    <span className="text-blue-600 font-bold flex items-center space-x-0.5">
                      <span>Tabela Completa</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* AD BANNER BETWEEN COMPETITIONS */}
                {index < activeChamps.length - 1 && (
                  <div className="w-full my-2">
                    <CompetitionAdBanner />
                  </div>
                )}
              </React.Fragment>
            ))
          )}
        </div>
      ) : (
        <div className="w-full divide-y divide-slate-200 dark:divide-slate-800">
          {endedChamps.length === 0 ? (
            <div className="w-full bg-white dark:bg-[#1E293B] p-12 text-center space-y-4">
              <span className="text-4xl block">📜</span>
              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Histórico de temporadas vazio</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Quando uma temporada/campeonato for encerrado no <strong>Painel Admin</strong>, todos os jogos, classificação final, artilharia e datas serão guardados aqui no histórico de forma permanente para consulta.
              </p>
            </div>
          ) : (
            endedChamps.map((champ) => {
              const champion = champ.standings && champ.standings.length > 0 ? champ.standings[0] : null;

              return (
                <div
                  key={champ.id}
                  onClick={() => navigateTo({ type: 'league', id: champ.id })}
                  className="w-full bg-white dark:bg-[#1E293B] p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer flex flex-col space-y-3 rounded-none shadow-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {champ.logoUrl ? (
                        <img src={champ.logoUrl} alt="" className="w-8 h-8 object-contain bg-slate-50 dark:bg-slate-800 p-0.5 shrink-0" />
                      ) : (
                        <span className="text-2xl">📜</span>
                      )}
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                          {champ.name}
                        </h3>
                        <p className="text-[10px] text-zinc-400 font-semibold uppercase">
                          Temporada {champ.season} • {champ.type}
                        </p>
                      </div>
                    </div>
                    <span className="bg-amber-500 text-slate-950 font-black text-[8px] uppercase tracking-wider px-2 py-0.5">
                      Histórico Congelado
                    </span>
                  </div>

                  {/* Champion details block */}
                  {champion ? (
                    <div className="bg-amber-500/5 dark:bg-amber-500/10 p-3 space-y-2 border-y border-amber-500/15">
                      <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                        <Award className="w-3.5 h-3.5" />
                        <span>Campeão da Temporada</span>
                      </span>
                      <div className="flex items-center justify-between text-xs">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateTo({ type: 'club', id: champion.clubId });
                          }}
                          className="flex items-center space-x-2.5 cursor-pointer group/champ"
                        >
                          <img src={champion.logoUrl} alt="" className="w-6 h-6 rounded-full group-hover/champ:scale-110 transition-transform bg-zinc-100" />
                          <div>
                            <span className="font-bold text-zinc-800 dark:text-white group-hover/champ:text-amber-600 transition-colors block">{champion.clubName}</span>
                            <span className="text-[9px] text-zinc-400 font-mono">
                              {champion.won} Vitórias • {champion.goalsFor} GP
                            </span>
                          </div>
                        </div>
                        <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">{champion.points} pts</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-[#0F172A] p-2.5 text-center text-[10px] text-zinc-500">
                      Nenhuma classificação registrada nesta temporada.
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs font-semibold pt-0.5">
                    <span className="text-zinc-400 flex items-center space-x-1.5 text-[10px]">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{champ.roundsCount} rodadas concluídas</span>
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center space-x-0.5 hover:underline text-[11px]">
                      <span>Ver Resultados Históricos</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

