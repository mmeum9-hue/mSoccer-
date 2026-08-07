import React, { useState } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';

interface AdsterraBanner320x50Props {
  className?: string;
}

export const AdsterraBanner320x50: React.FC<AdsterraBanner320x50Props> = ({ className = '' }) => {
  const [adError, setAdError] = useState(false);

  const iframeContent = `
    <!DOCTYPE html>
    <html lang="pt">
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body, html {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        </style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : '7c6fcbcaec36f30ce6ea7dc639bcb2d8',
            'format' : 'iframe',
            'height' : 50,
            'width' : 320,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highperformanceformat.com/7c6fcbcaec36f30ce6ea7dc639bcb2d8/invoke.js" onerror="window.parent.postMessage('ad_blocked', '*')"></script>
      </body>
    </html>
  `;

  if (adError) {
    return (
      <div className={`w-full flex flex-col items-center justify-center my-3 py-1.5 bg-slate-100/90 dark:bg-zinc-900/80 border-y border-zinc-200/60 dark:border-zinc-800/60 select-none overflow-hidden ${className}`}>
        <div className="w-full max-w-[320px] flex items-center justify-between px-1 pb-1 text-[8px] font-bold uppercase text-zinc-400 tracking-wider">
          <span>PUBLICIDADE</span>
          <span>PATROCINADOR</span>
        </div>
        <a
          href="https://mSoccer.app"
          target="_blank"
          rel="noopener noreferrer"
          className="w-[320px] h-[50px] min-h-[50px] overflow-hidden flex items-center justify-between px-3 bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white rounded-lg shadow-sm border border-emerald-500/30 hover:opacity-95 transition-all group"
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
            <div className="text-left">
              <p className="text-[11px] font-black uppercase tracking-tight text-white leading-none">mSoccer PRO</p>
              <p className="text-[9px] text-emerald-200 font-medium">Acompanhe estatísticas e placares ao vivo</p>
            </div>
          </div>
          <span className="text-[9px] font-extrabold bg-white text-emerald-950 px-2 py-1 rounded-md uppercase tracking-wider group-hover:scale-105 transition-transform flex items-center space-x-1">
            <span>Ver Mais</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </span>
        </a>
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col items-center justify-center my-3 py-1.5 bg-slate-100/90 dark:bg-zinc-900/80 border-y border-zinc-200/60 dark:border-zinc-800/60 select-none overflow-hidden ${className}`}>
      <div className="w-full max-w-[320px] flex items-center justify-between px-1 pb-1 text-[8px] font-bold uppercase text-zinc-400 tracking-wider">
        <span>PUBLICIDADE</span>
        <span>ANÚNCIO</span>
      </div>
      <div className="w-[320px] h-[50px] min-h-[50px] overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-950 shadow-xs rounded-sm border border-zinc-200/50 dark:border-zinc-800/50">
        <iframe
          title="Anúncio Adsterra 320x50"
          srcDoc={iframeContent}
          width="320"
          height="50"
          className="w-[320px] h-[50px] border-0 overflow-hidden shrink-0 block"
          scrolling="no"
          frameBorder="0"
          onError={() => setAdError(true)}
        />
      </div>
    </div>
  );
};
