import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, Power, Wrench, ChevronRight, Check } from 'lucide-react';

export const MaintenanceBanner: React.FC = () => {
  const { maintenanceConfig, toggleMaintenanceMode, navigateTo, currentView } = useApp();
  const [isDisabling, setIsDisabling] = useState(false);

  if (!maintenanceConfig.enabled) return null;

  const handleQuickDisable = async () => {
    setIsDisabling(true);
    try {
      await toggleMaintenanceMode(false);
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-3 py-2 text-xs font-bold shadow-lg flex items-center justify-between z-[90] relative select-none">
      <div className="flex items-center space-x-2 truncate">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950" />
        </span>
        <div className="flex items-center space-x-1.5 truncate">
          <Wrench className="w-3.5 h-3.5 shrink-0" />
          <span className="font-black uppercase tracking-wider text-[11px]">
            Modo de Manutenção Ativo
          </span>
          <span className="hidden sm:inline font-semibold text-slate-900 text-[11px]">
            — Aplicativo bloqueado para utilizadores comuns
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        {currentView.type !== 'admin' && (
          <button
            onClick={() => navigateTo({ type: 'admin' })}
            className="px-2.5 py-1 bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 rounded-lg text-[10.5px] font-black transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <span>Painel Admin</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}

        <button
          onClick={handleQuickDisable}
          disabled={isDisabling}
          className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-amber-400 active:scale-95 rounded-lg text-[10.5px] font-black transition-all flex items-center space-x-1 cursor-pointer shadow"
        >
          <Power className={`w-3 h-3 ${isDisabling ? 'animate-spin' : ''}`} />
          <span>{isDisabling ? 'Desativando...' : 'Desativar Agora'}</span>
        </button>
      </div>
    </div>
  );
};
