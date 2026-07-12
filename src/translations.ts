export interface TranslationSet {
  ontem: string;
  hoje: string;
  aoVivo: string;
  amanha: string;
  tabelaClassificacao: string;
  pontuacaoEstatisticas: string;
  favoritos: string;
  partidas: string;
  noticiasRecomendadas: string;
  nenhumaPartida: string;
  favoritarInstrucao: string;
  predictorTitulo: string;
  comoFunciona: string;
  comoFuncionaDesc: string;
  escolhaPartida: string;
  golsCasa: string;
  golsFora: string;
  confirmarPalpite: string;
  palpiteSucesso: string;
  apostouEm: string;
  multiplicadorEstimado: string;
  dicaAdmin: string;
  buscarClubeJogador: string;
  idioma: string;
  visualApp: string;
  claro: string;
  escuro: string;
  preferenciasGerais: string;
  salvarAlteracoes: string;
  todas: string;
}

export const translations: Record<'pt' | 'en' | 'es', TranslationSet> = {
  pt: {
    ontem: 'Ontem',
    hoje: 'Hoje',
    aoVivo: 'Ao Vivo',
    amanha: 'Amanhã',
    tabelaClassificacao: 'Tabela de Classificação',
    pontuacaoEstatisticas: 'Pontuação, estatísticas e clubes',
    favoritos: 'Favoritos',
    partidas: 'Partidas',
    noticiasRecomendadas: 'Notícias Recomendadas',
    nenhumaPartida: 'Nenhuma partida disponível no momento.',
    favoritarInstrucao: 'Marque partidas como favoritas clicando na estrela para acompanhá-las aqui!',
    predictorTitulo: 'mSoccer Palpites',
    comoFunciona: 'Como Funciona',
    comoFuncionaDesc: 'Insira seu palpite para o placar de uma partida em destaque hoje. Se você acertar, acumula pontos de prestígio no app!',
    escolhaPartida: 'Escolha a Partida',
    golsCasa: 'Gols Casa',
    golsFora: 'Gols Fora',
    confirmarPalpite: 'Confirmar Palpite',
    palpiteSucesso: 'Palpite Enviado com Sucesso!',
    apostouEm: 'Você apostou em',
    multiplicadorEstimado: 'Multiplicador estimado de',
    dicaAdmin: 'Dica: Use o Painel Admin para simular gols ao vivo!',
    buscarClubeJogador: 'Pesquise clubes, jogadores, campeonatos...',
    idioma: 'Idioma',
    visualApp: 'Visual do App',
    claro: 'Claro',
    escuro: 'Escuro',
    preferenciasGerais: 'Preferências Gerais',
    salvarAlteracoes: 'Salvar Alterações',
    todas: 'Todas'
  },
  en: {
    ontem: 'Yesterday',
    hoje: 'Today',
    aoVivo: 'Live',
    amanha: 'Tomorrow',
    tabelaClassificacao: 'League Standings',
    pontuacaoEstatisticas: 'Points, stats, and clubs',
    favoritos: 'Favorites',
    partidas: 'Matches',
    noticiasRecomendadas: 'Recommended News',
    nenhumaPartida: 'No matches available at the moment.',
    favoritarInstrucao: 'Add matches to favorites by clicking the star to track them here!',
    predictorTitulo: 'mSoccer Predictor',
    comoFunciona: 'How it Works',
    comoFuncionaDesc: 'Enter your score prediction for a featured match today. If you get it right, you earn prestige points!',
    escolhaPartida: 'Choose Match',
    golsCasa: 'Home Goals',
    golsFora: 'Away Goals',
    confirmarPalpite: 'Confirm Prediction',
    palpiteSucesso: 'Prediction Submitted Successfully!',
    apostouEm: 'You bet on',
    multiplicadorEstimado: 'Estimated multiplier of',
    dicaAdmin: 'Tip: Use the Admin Panel to simulate live goals!',
    buscarClubeJogador: 'Search clubs, players, leagues...',
    idioma: 'Language',
    visualApp: 'App Theme',
    claro: 'Light',
    escuro: 'Dark',
    preferenciasGerais: 'General Preferences',
    salvarAlteracoes: 'Save Changes',
    todas: 'All'
  },
  es: {
    ontem: 'Ayer',
    hoje: 'Hoy',
    aoVivo: 'En Vivo',
    amanha: 'Mañana',
    tabelaClassificacao: 'Tabla de Posiciones',
    pontuacaoEstatisticas: 'Puntos, estadísticas y clubes',
    favoritos: 'Favoritos',
    partidas: 'Partidos',
    noticiasRecomendadas: 'Noticias Recomendadas',
    nenhumaPartida: 'No hay partidos disponibles en este momento.',
    favoritarInstrucao: '¡Marque los partidos como favoritos haciendo clic en la estrella para seguirlos aquí!',
    predictorTitulo: 'mSoccer Pronósticos',
    comoFunciona: 'Cómo Funciona',
    comoFuncionaDesc: 'Ingrese su pronóstico para el marcador de un partido destacado de hoy. ¡Si acierta, acumulará puntos de prestigio!',
    escolhaPartida: 'Elegir Partido',
    golsCasa: 'Goles Local',
    golsFora: 'Goles Visitante',
    confirmarPalpite: 'Confirmar Pronóstico',
    palpiteSucesso: '¡Pronóstico Enviado con Éxito!',
    apostouEm: 'Apostaste por',
    multiplicadorEstimado: 'Multiplicador estimado de',
    dicaAdmin: 'Consejo: ¡Use el Panel de Admin para simular goles en vivo!',
    buscarClubeJogador: 'Buscar clubes, jugadores, ligas...',
    idioma: 'Idioma',
    visualApp: 'Visual del App',
    claro: 'Claro',
    escuro: 'Oscuro',
    preferenciasGerais: 'Preferencias Generales',
    salvarAlteracoes: 'Guardar Cambios',
    todas: 'Todas'
  }
};
