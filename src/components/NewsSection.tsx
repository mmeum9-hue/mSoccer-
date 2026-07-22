import React, { useState } from 'react';
import { useApp, parseDateString } from '../context/AppContext';
import { NewsArticle } from '../types';
import { Newspaper, Eye, Search, Calendar, ChevronRight, X, Heart, MessageSquare } from 'lucide-react';

export const NewsSection: React.FC = () => {
  const { news } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);

  // Filter Categories
  const categories = ['all', 'Geral', 'Transferência', 'Lesão', 'Entrevista', 'Rumor'];

  // Sort from newest to oldest based on parsed timestamp
  const sortedNews = [...news].sort((a, b) => parseDateString(b.publishedAt) - parseDateString(a.publishedAt));

  const filteredNews = sortedNews.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clubName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full mx-auto pb-20 divide-y divide-slate-200 dark:divide-slate-800">
      {/* Search and Title */}
      <div className="w-full bg-white dark:bg-[#1E293B] border-b border-slate-200 dark:border-slate-800 px-2.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2">
          <Newspaper className="w-5 h-5 text-emerald-500" />
          <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Portal de Notícias</h2>
        </div>

        {/* Local news search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar notícias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-9 pr-4 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Categories Filter Pills */}
      <div className="w-full bg-slate-50 dark:bg-[#0F172A] px-2.5 py-1.5 flex space-x-2 overflow-x-auto scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-emerald-500 text-white font-black'
                : 'bg-white dark:bg-[#1E293B] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {cat === 'all' ? 'Ver Todas' : cat}
          </button>
        ))}
      </div>

      {/* News List */}
      {filteredNews.length === 0 ? (
        <div className="w-full text-center py-12 bg-white dark:bg-[#1E293B]">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Nenhuma notícia encontrada nesta categoria.</p>
        </div>
      ) : (
        <div className="w-full divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-[#1E293B]">
          {filteredNews.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveArticle(item)}
              className="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer flex flex-col sm:flex-row gap-4 items-start rounded-none shadow-none"
            >
              <div className="relative shrink-0 w-full sm:w-48 h-32 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenImageUrl(item.imageUrl);
                  }}
                />
                <span className="absolute top-2 left-2 bg-black/75 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5">
                  {item.category}
                </span>
              </div>
              <div className="flex-1 flex flex-col justify-between space-y-2 w-full">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-zinc-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{item.publishedAt}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{item.views.toLocaleString()} lidas</span>
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  {item.clubName ? (
                    <span className="bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      ⚽ {item.clubName}
                    </span>
                  ) : (
                    <span></span>
                  )}
                  <span className="text-[10px] text-emerald-500 font-bold flex items-center space-x-0.5">
                    <span>Ler matéria</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULL ARTICLE MODAL OVERLAY */}
      {activeArticle && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800/80 animate-in zoom-in-95 duration-200 my-8">
            <div className="relative">
              <img
                src={activeArticle.imageUrl}
                alt={activeArticle.title}
                className="h-64 w-full object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                referrerPolicy="no-referrer"
                onClick={() => setFullscreenImageUrl(activeArticle.imageUrl)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <button
                onClick={() => setActiveArticle(null)}
                className="absolute top-4 left-4 bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-full cursor-pointer transition-all flex items-center space-x-1 text-xs font-bold uppercase backdrop-blur-sm shadow-md"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>Voltar</span>
              </button>
              <button
                id="btn-article-close"
                onClick={() => setActiveArticle(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full cursor-pointer transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded">
                  {activeArticle.category}
                </span>
                <h3 className="text-lg md:text-xl font-black leading-tight drop-shadow">
                  {activeArticle.title}
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-xs text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <span className="flex items-center space-x-1 font-medium">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  <span>Publicado em: {activeArticle.publishedAt}</span>
                </span>
                <span className="flex items-center space-x-1 font-semibold">
                  <Eye className="w-4 h-4 text-zinc-400" />
                  <span>{activeArticle.views.toLocaleString()} visualizações</span>
                </span>
              </div>

              <div className="prose prose-zinc dark:prose-invert max-w-none text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium space-y-3 whitespace-pre-line">
                <p className="font-bold text-zinc-900 dark:text-white border-l-4 border-emerald-500 pl-3">
                  {activeArticle.summary}
                </p>
                <p>{activeArticle.content}</p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800/80 mt-6">
                {activeArticle.clubName ? (
                  <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-xl">
                    Clube Relacionado: {activeArticle.clubName}
                  </span>
                ) : (
                  <span></span>
                )}
                {/* Simulated engagement */}
                <div className="flex space-x-3 text-zinc-400 text-xs">
                  <button className="flex items-center space-x-1 hover:text-rose-500 cursor-pointer">
                    <Heart className="w-4 h-4" />
                    <span>84</span>
                  </button>
                  <button className="flex items-center space-x-1 hover:text-emerald-500 cursor-pointer">
                    <MessageSquare className="w-4 h-4" />
                    <span>12</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-center border-t border-zinc-100 dark:border-zinc-800/80">
                <button
                  onClick={() => setActiveArticle(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-zinc-300 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm border border-slate-200/40 dark:border-slate-700/50"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  <span>Voltar para as Notícias</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
      {fullscreenImageUrl && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
          onClick={() => setFullscreenImageUrl(null)}
        >
          <button
            onClick={() => setFullscreenImageUrl(null)}
            className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors cursor-pointer"
            aria-label="Fechar tela cheia"
          >
            <X className="w-6 h-6" />
          </button>
          
          <img
            src={fullscreenImageUrl}
            alt="Notícia em tela cheia"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl select-none"
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
