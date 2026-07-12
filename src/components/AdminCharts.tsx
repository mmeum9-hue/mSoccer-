import React, { useState } from 'react';

// SVG Partidas por Dia Line Chart
export const LineChart: React.FC = () => {
  const points = [
    { label: '27/06', val: 110, x: 40, y: 93 },
    { label: '28/06', val: 90, x: 110, y: 107 },
    { label: '29/06', val: 115, x: 180, y: 89.5 },
    { label: '30/06', val: 100, x: 250, y: 100 },
    { label: '01/07', val: 145, x: 320, y: 68.5 },
    { label: '02/07', val: 115, x: 390, y: 89.5 },
    { label: '03/07', val: 130, x: 460, y: 79 },
  ];

  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  return (
    <div className="relative w-full h-[180px]">
      <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[30, 65, 100, 135, 170].map((y, idx) => (
          <line
            key={idx}
            x1="30"
            y1={y}
            x2="480"
            y2={y}
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* Area fill */}
        <path
          d="M 40,93 C 75,93 75,107 110,107 C 145,107 145,89.5 180,89.5 C 215,89.5 215,100 250,100 C 285,100 285,68.5 320,68.5 C 355,68.5 355,89.5 390,89.5 C 425,89.5 425,79 460,79 L 460,170 L 40,170 Z"
          fill="url(#chartGradient)"
        />

        {/* Main Line */}
        <path
          d="M 40,93 C 75,93 75,107 110,107 C 145,107 145,89.5 180,89.5 C 215,89.5 215,100 250,100 C 285,100 285,68.5 320,68.5 C 355,68.5 355,89.5 390,89.5 C 425,89.5 425,79 460,79"
          fill="none"
          stroke="#10b981"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hover indicator line */}
        {hoveredPoint !== null && (
          <line
            x1={points[hoveredPoint].x}
            y1="30"
            x2={points[hoveredPoint].x}
            y2="170"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
        )}

        {/* Data points */}
        {points.map((p, i) => (
          <g
            key={i}
            className="cursor-pointer"
            onMouseEnter={() => setHoveredPoint(i)}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {hoveredPoint === i && (
              <circle
                cx={p.x}
                cy={p.y}
                r="10"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                className="animate-ping"
              />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              fill="#0F172A"
              stroke="#10b981"
              strokeWidth="2.5"
            />
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredPoint !== null && (
        <div
          className="absolute bg-[#1e293b] border border-slate-700 rounded px-2 py-1 text-[10px] font-black font-mono text-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(points[hoveredPoint].x / 500) * 100}%`,
            top: `${(points[hoveredPoint].y / 200) * 100 - 8}%`,
          }}
        >
          {points[hoveredPoint].val} partidas
        </div>
      )}

      {/* X-Axis labels */}
      <div className="flex justify-between px-3 mt-1 text-[9px] font-bold text-zinc-500 font-mono">
        {points.map((p, i) => (
          <span key={i}>{p.label}</span>
        ))}
      </div>
    </div>
  );
};

// Donut Chart
export const DonutChart: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="60" fill="transparent" stroke="#1e293b" strokeWidth="18" />
          {/* Segment 1: Internationals (48.1%) -> Color #3b82f6 */}
          <circle
            cx="80"
            cy="80"
            r="60"
            fill="transparent"
            stroke="#3b82f6"
            strokeWidth="18"
            strokeDasharray="181.33 376.99"
            strokeDashoffset="0"
          />
          {/* Segment 2: Nationals (28.8%) -> Color #f97316 */}
          <circle
            cx="80"
            cy="80"
            r="60"
            fill="transparent"
            stroke="#f97316"
            strokeWidth="18"
            strokeDasharray="108.57 376.99"
            strokeDashoffset="-181.33"
          />
          {/* Segment 3: Regionals (15.4%) -> Color #a855f7 */}
          <circle
            cx="80"
            cy="80"
            r="60"
            fill="transparent"
            stroke="#a855f7"
            strokeWidth="18"
            strokeDasharray="58.05 376.99"
            strokeDashoffset="-289.9"
          />
          {/* Segment 4: Others (7.7%) -> Color #0ea5e9 */}
          <circle
            cx="80"
            cy="80"
            r="60"
            fill="transparent"
            stroke="#0ea5e9"
            strokeWidth="18"
            strokeDasharray="29.04 376.99"
            strokeDashoffset="-347.95"
          />
        </svg>
        <div className="absolute text-center select-none">
          <p className="text-[9px] uppercase tracking-widest font-extrabold text-zinc-500">Total</p>
          <p className="font-mono text-lg font-black text-white">52</p>
        </div>
      </div>

      <div className="flex-1 space-y-2 w-full text-xs">
        <div className="flex items-center justify-between font-semibold">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-zinc-400 text-[11px]">Internacionais</span>
          </div>
          <span className="font-mono text-zinc-200">25 (48.1%)</span>
        </div>
        <div className="flex items-center justify-between font-semibold">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span className="text-zinc-400 text-[11px]">Nacionais</span>
          </div>
          <span className="font-mono text-zinc-200">15 (28.8%)</span>
        </div>
        <div className="flex items-center justify-between font-semibold">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span className="text-zinc-400 text-[11px]">Regionais</span>
          </div>
          <span className="font-mono text-zinc-200">8 (15.4%)</span>
        </div>
        <div className="flex items-center justify-between font-semibold">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span className="text-zinc-400 text-[11px]">Outros</span>
          </div>
          <span className="font-mono text-zinc-200">4 (7.7%)</span>
        </div>
      </div>
    </div>
  );
};
