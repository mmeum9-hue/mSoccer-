import { Club, Player, Championship, Match, MatchStatus, NewsArticle } from './types';

export const INITIAL_CLUBS: Club[] = [
  {
    id: 'flamengo',
    name: 'CR Flamengo',
    shortName: 'FLA',
    logoUrl: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop&q=80', // Red/black flag background stylized
    country: 'Brasil',
    founded: '1895',
    stadium: 'Maracanã',
    manager: 'Filipe Luís',
    titles: ['3x Libertadores', '8x Brasileirão', '5x Copa do Brasil'],
    stats: { wins: 15, draws: 5, losses: 4, goalsScored: 42, goalsConceded: 21 }
  },
  {
    id: 'palmeiras',
    name: 'SE Palmeiras',
    shortName: 'PAL',
    logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop&q=80', // Green field theme
    country: 'Brasil',
    founded: '1914',
    stadium: 'Allianz Parque',
    manager: 'Abel Ferreira',
    titles: ['3x Libertadores', '12x Brasileirão', '4x Copa do Brasil'],
    stats: { wins: 14, draws: 6, losses: 4, goalsScored: 38, goalsConceded: 19 }
  },
  {
    id: 'sao_paulo',
    name: 'São Paulo FC',
    shortName: 'SAO',
    logoUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=100&h=100&fit=crop&q=80', // Tricolor theme
    country: 'Brasil',
    founded: '1930',
    stadium: 'MorumBIS',
    manager: 'Luis Zubeldía',
    titles: ['3x Mundial de Clubes', '3x Libertadores', '6x Brasileirão'],
    stats: { wins: 11, draws: 8, losses: 5, goalsScored: 33, goalsConceded: 24 }
  },
  {
    id: 'atletico_mg',
    name: 'Atlético Mineiro',
    shortName: 'CAM',
    logoUrl: 'https://images.unsplash.com/photo-1540747737956-378724044453?w=100&h=100&fit=crop&q=80', // Black/White stadium theme
    country: 'Brasil',
    founded: '1908',
    stadium: 'Arena MRV',
    manager: 'Gabriel Milito',
    titles: ['1x Libertadores', '2x Brasileirão', '2x Copa do Brasil'],
    stats: { wins: 10, draws: 9, losses: 5, goalsScored: 31, goalsConceded: 22 }
  },
  {
    id: 'real_madrid',
    name: 'Real Madrid CF',
    shortName: 'RMA',
    logoUrl: 'https://images.unsplash.com/photo-1504156806659-3c3149f7e53f?w=100&h=100&fit=crop&q=80', // White flag with crown aesthetic
    country: 'Espanha',
    founded: '1902',
    stadium: 'Santiago Bernabéu',
    manager: 'Carlo Ancelotti',
    titles: ['15x Champions League', '36x La Liga', '20x Copa del Rey'],
    stats: { wins: 18, draws: 4, losses: 2, goalsScored: 55, goalsConceded: 18 }
  },
  {
    id: 'barcelona',
    name: 'FC Barcelona',
    shortName: 'BAR',
    logoUrl: 'https://images.unsplash.com/photo-1431324155629-1a6edd1def2d?w=100&h=100&fit=crop&q=80', // Blaugrana theme
    country: 'Espanha',
    founded: '1899',
    stadium: 'Camp Nou',
    manager: 'Hansi Flick',
    titles: ['5x Champions League', '27x La Liga', '31x Copa del Rey'],
    stats: { wins: 17, draws: 3, losses: 4, goalsScored: 52, goalsConceded: 20 }
  }
];

export const INITIAL_PLAYERS: Player[] = [
  // Flamengo
  {
    id: 'pedro',
    name: 'Pedro Guilherme',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80',
    age: 29,
    nationality: 'Brasil',
    clubId: 'flamengo',
    clubName: 'CR Flamengo',
    number: 9,
    position: 'Atacante',
    marketValue: '€22.00M',
    stats: { matches: 32, goals: 28, assists: 6, yellowCards: 2, redCards: 0, minutesPlayed: 2560 },
    history: [
      { season: '2025', club: 'CR Flamengo', matches: 34, goals: 30 },
      { season: '2024', club: 'CR Flamengo', matches: 38, goals: 24 }
    ]
  },
  {
    id: 'arrascaeta',
    name: 'Giorgian De Arrascaeta',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&q=80',
    age: 32,
    nationality: 'Uruguai',
    clubId: 'flamengo',
    clubName: 'CR Flamengo',
    number: 14,
    position: 'Meio-campista',
    marketValue: '€15.00M',
    stats: { matches: 28, goals: 8, assists: 14, yellowCards: 4, redCards: 0, minutesPlayed: 2100 },
    history: [
      { season: '2025', club: 'CR Flamengo', matches: 30, goals: 10 },
      { season: '2024', club: 'CR Flamengo', matches: 32, goals: 11 }
    ]
  },
  // Palmeiras
  {
    id: 'raphael_veiga',
    name: 'Raphael Veiga',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80',
    age: 31,
    nationality: 'Brasil',
    clubId: 'palmeiras',
    clubName: 'SE Palmeiras',
    number: 23,
    position: 'Meio-campista',
    marketValue: '€16.00M',
    stats: { matches: 30, goals: 12, assists: 9, yellowCards: 3, redCards: 0, minutesPlayed: 2350 },
    history: [
      { season: '2025', club: 'SE Palmeiras', matches: 32, goals: 14 },
      { season: '2024', club: 'SE Palmeiras', matches: 35, goals: 15 }
    ]
  },
  {
    id: 'estevao',
    name: 'Estêvão Willian',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&q=80',
    age: 19,
    nationality: 'Brasil',
    clubId: 'palmeiras',
    clubName: 'SE Palmeiras',
    number: 41,
    position: 'Atacante',
    marketValue: '€40.00M',
    stats: { matches: 25, goals: 11, assists: 8, yellowCards: 1, redCards: 0, minutesPlayed: 1800 },
    history: [
      { season: '2025', club: 'SE Palmeiras', matches: 20, goals: 7 }
    ]
  },
  // Real Madrid
  {
    id: 'vini_jr',
    name: 'Vinícius Júnior',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&q=80',
    age: 25,
    nationality: 'Brasil',
    clubId: 'real_madrid',
    clubName: 'Real Madrid CF',
    number: 7,
    position: 'Atacante',
    marketValue: '€180.00M',
    stats: { matches: 35, goals: 24, assists: 11, yellowCards: 5, redCards: 0, minutesPlayed: 2900 },
    history: [
      { season: '2024/25', club: 'Real Madrid CF', matches: 39, goals: 21 },
      { season: '2023/24', club: 'Real Madrid CF', matches: 36, goals: 24 }
    ]
  },
  {
    id: 'bellingham',
    name: 'Jude Bellingham',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&q=80',
    age: 23,
    nationality: 'Inglaterra',
    clubId: 'real_madrid',
    clubName: 'Real Madrid CF',
    number: 5,
    position: 'Meio-campista',
    marketValue: '€180.00M',
    stats: { matches: 33, goals: 15, assists: 10, yellowCards: 6, redCards: 1, minutesPlayed: 2800 },
    history: [
      { season: '2024/25', club: 'Real Madrid CF', matches: 36, goals: 19 },
      { season: '2023/24', club: 'Real Madrid CF', matches: 42, goals: 23 }
    ]
  },
  // Barcelona
  {
    id: 'yamal',
    name: 'Lamine Yamal',
    photoUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=150&h=150&fit=crop&q=80',
    age: 18,
    nationality: 'Espanha',
    clubId: 'barcelona',
    clubName: 'FC Barcelona',
    number: 19,
    position: 'Atacante',
    marketValue: '€150.00M',
    stats: { matches: 36, goals: 10, assists: 15, yellowCards: 2, redCards: 0, minutesPlayed: 2750 },
    history: [
      { season: '2024/25', club: 'FC Barcelona', matches: 37, goals: 7 }
    ]
  },
  {
    id: 'lewandowski',
    name: 'Robert Lewandowski',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&q=80',
    age: 37,
    nationality: 'Polônia',
    clubId: 'barcelona',
    clubName: 'FC Barcelona',
    number: 9,
    position: 'Atacante',
    marketValue: '€15.00M',
    stats: { matches: 34, goals: 25, assists: 5, yellowCards: 3, redCards: 0, minutesPlayed: 2600 },
    history: [
      { season: '2024/25', club: 'FC Barcelona', matches: 35, goals: 26 },
      { season: '2023/24', club: 'FC Barcelona', matches: 38, goals: 19 }
    ]
  }
];

const getRelativeDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const INITIAL_CHAMPIONSHIPS: Championship[] = [
  {
    id: 'brasileirao_2026',
    name: 'Brasileirão Série A',
    logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop&q=80',
    type: 'Liga',
    season: '2026',
    roundsCount: 38,
    currentRound: 15,
    standings: [
      { clubId: 'flamengo', clubName: 'CR Flamengo', logoUrl: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop&q=80', played: 14, won: 9, drawn: 3, lost: 2, goalsFor: 28, goalsAgainst: 12, goalDifference: 16, points: 30 },
      { clubId: 'palmeiras', clubName: 'SE Palmeiras', logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop&q=80', played: 14, won: 8, drawn: 4, lost: 2, goalsFor: 24, goalsAgainst: 11, goalDifference: 13, points: 28 },
      { clubId: 'sao_paulo', clubName: 'São Paulo FC', logoUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=100&h=100&fit=crop&q=80', played: 14, won: 6, drawn: 5, lost: 3, goalsFor: 19, goalsAgainst: 14, goalDifference: 5, points: 23 },
      { clubId: 'atletico_mg', clubName: 'Atlético Mineiro', logoUrl: 'https://images.unsplash.com/photo-1540747737956-378724044453?w=100&h=100&fit=crop&q=80', played: 14, won: 5, drawn: 6, lost: 3, goalsFor: 18, goalsAgainst: 15, goalDifference: 3, points: 21 }
    ],
    regulations: 'O Campeonato Brasileiro é a principal liga nacional do Brasil, dando vaga direta para a fase de grupos da Libertadores da América aos quatro primeiros colocados.',
    topScorers: [
      { playerId: 'pedro', playerName: 'Pedro Guilherme', clubName: 'CR Flamengo', goals: 12 },
      { playerId: 'estevao', playerName: 'Estêvão Willian', clubName: 'SE Palmeiras', goals: 8 }
    ],
    topAssists: [
      { playerId: 'arrascaeta', playerName: 'Giorgian De Arrascaeta', clubName: 'CR Flamengo', assists: 9 },
      { playerId: 'raphael_veiga', playerName: 'Raphael Veiga', clubName: 'SE Palmeiras', assists: 7 }
    ],
    status: 'Ativo'
  },
  {
    id: 'champions_2026',
    name: 'UEFA Champions League',
    logoUrl: 'https://images.unsplash.com/photo-1540747737956-378724044453?w=100&h=100&fit=crop&q=80',
    type: 'Internacional',
    season: '2025/2026',
    roundsCount: 8,
    currentRound: 6,
    standings: [
      { clubId: 'real_madrid', clubName: 'Real Madrid CF', logoUrl: 'https://images.unsplash.com/photo-1504156806659-3c3149f7e53f?w=100&h=100&fit=crop&q=80', played: 5, won: 4, drawn: 1, lost: 0, goalsFor: 15, goalsAgainst: 5, goalDifference: 10, points: 13 },
      { clubId: 'barcelona', clubName: 'FC Barcelona', logoUrl: 'https://images.unsplash.com/photo-1431324155629-1a6edd1def2d?w=100&h=100&fit=crop&q=80', played: 5, won: 3, drawn: 1, lost: 1, goalsFor: 12, goalsAgainst: 7, goalDifference: 5, points: 10 }
    ],
    regulations: 'A maior competição continental europeia, onde os melhores times disputam o troféu mais cobiçado do futebol de clubes mundial.',
    topScorers: [
      { playerId: 'lewandowski', playerName: 'Robert Lewandowski', clubName: 'FC Barcelona', goals: 6 },
      { playerId: 'vini_jr', playerName: 'Vinícius Júnior', clubName: 'Real Madrid CF', goals: 5 }
    ],
    topAssists: [
      { playerId: 'yamal', playerName: 'Lamine Yamal', clubName: 'FC Barcelona', assists: 4 },
      { playerId: 'bellingham', playerName: 'Jude Bellingham', clubName: 'Real Madrid CF', assists: 3 }
    ],
    status: 'Ativo'
  }
];

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'match_live_fla_pal',
    championshipId: 'brasileirao_2026',
    championshipName: 'Brasileirão Série A',
    round: 15,
    homeClubId: 'flamengo',
    homeClubName: 'CR Flamengo',
    homeClubLogo: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop&q=80',
    awayClubId: 'palmeiras',
    awayClubName: 'SE Palmeiras',
    awayClubLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop&q=80',
    stadium: 'Maracanã',
    referee: 'Wilton Pereira Sampaio',
    date: getRelativeDate(0),
    time: '16:00',
    minute: 52,
    status: MatchStatus.LIVE,
    score: { home: 1, away: 1 },
    events: [
      { id: 'ev_1', minute: 1, type: 'KickOff', team: 'neutral', player1: 'Início do Jogo', detail: 'Começa a partida no Maracanã!' },
      { id: 'ev_2', minute: 14, type: 'Goal', team: 'away', player1: 'Estêvão Willian', player2: 'Raphael Veiga', detail: 'Golaço de fora da área!' },
      { id: 'ev_3', minute: 32, type: 'YellowCard', team: 'home', player1: 'Erick Pulgar', detail: 'Falta dura no meio de campo' },
      { id: 'ev_4', minute: 45, type: 'HalfTime', team: 'neutral', player1: 'Fim do 1T', detail: 'Partida vai para o intervalo!' },
      { id: 'ev_5', minute: 46, type: 'KickOff', team: 'neutral', player1: 'Início do 2T', detail: 'Recomeça a partida!' },
      { id: 'ev_6', minute: 49, type: 'Goal', team: 'home', player1: 'Pedro Guilherme', player2: 'Giorgian De Arrascaeta', detail: 'Cabeceio certeiro após cruzamento escanteio!' }
    ],
    stats: {
      possession: { home: 54, away: 46 },
      shots: { home: 8, away: 5 },
      shotsOnTarget: { home: 4, away: 2 },
      passes: { home: 245, away: 210 },
      passAccuracy: { home: 88, away: 81 },
      crosses: { home: 9, away: 6 },
      corners: { home: 4, away: 2 },
      fouls: { home: 6, away: 8 },
      saves: { home: 1, away: 3 },
      blockedShots: { home: 1, away: 1 },
      dangerousAttacks: { home: 38, away: 29 }
    },
    lineups: {
      home: {
        formation: '4-3-3',
        starting: [
          { id: 'rossi', name: 'Agustín Rossi', number: 1, position: 'Goleiro', rating: 6.8 },
          { id: 'wesley', name: 'Wesley', number: 2, position: 'Defensor', rating: 6.9 },
          { id: 'ortiz', name: 'Léo Ortiz', number: 3, position: 'Defensor', rating: 7.0 },
          { id: 'fabrício', name: 'Fabrício Bruno', number: 15, position: 'Defensor', rating: 7.1 },
          { id: 'ayrton', name: 'Ayrton Lucas', number: 6, position: 'Defensor', rating: 7.2 },
          { id: 'pulgar', name: 'Erick Pulgar', number: 5, position: 'Meio-campista', rating: 6.5 },
          { id: 'gerson', name: 'Gerson', number: 8, position: 'Meio-campista', rating: 7.5 },
          { id: 'arrascaeta', name: 'G. De Arrascaeta', number: 14, position: 'Meio-campista', rating: 7.8 },
          { id: 'luiz_araujo', name: 'Luiz Araújo', number: 7, position: 'Atacante', rating: 6.7 },
          { id: 'everton', name: 'Everton Cebolinha', number: 11, position: 'Atacante', rating: 6.9 },
          { id: 'pedro', name: 'Pedro Guilherme', number: 9, position: 'Atacante', rating: 8.0 }
        ],
        bench: [
          { id: 'cunha', name: 'Matheus Cunha', number: 25, position: 'Goleiro' },
          { id: 'david_luiz', name: 'David Luiz', number: 23, position: 'Defensor' },
          { id: 'allan', name: 'Allan', number: 21, position: 'Meio-campista' },
          { id: 'gabigol', name: 'Gabriel Barbosa', number: 99, position: 'Atacante' }
        ],
        manager: 'Filipe Luís'
      },
      away: {
        formation: '4-2-3-1',
        starting: [
          { id: 'weverton', name: 'Weverton', number: 21, position: 'Goleiro', rating: 7.1 },
          { id: 'rocha', name: 'Marcos Rocha', number: 2, position: 'Defensor', rating: 6.7 },
          { id: 'gomez', name: 'Gustavo Gómez', number: 15, position: 'Defensor', rating: 7.0 },
          { id: 'murilo', name: 'Murilo', number: 26, position: 'Defensor', rating: 7.1 },
          { id: 'piquerez', name: 'Joaquín Piquerez', number: 22, position: 'Defensor', rating: 6.8 },
          { id: 'anibal', name: 'Aníbal Moreno', number: 5, position: 'Meio-campista', rating: 7.2 },
          { id: 'ze_rafael', name: 'Zé Rafael', number: 8, position: 'Meio-campista', rating: 6.9 },
          { id: 'veiga', name: 'Raphael Veiga', number: 23, position: 'Meio-campista', rating: 7.6 },
          { id: 'estevao', name: 'Estêvão Willian', number: 41, position: 'Atacante', rating: 8.2 },
          { id: 'felipe_anderson', name: 'Felipe Anderson', number: 9, position: 'Atacante', rating: 6.6 },
          { id: 'flaco', name: 'Flaco López', number: 42, position: 'Atacante', rating: 6.8 }
        ],
        bench: [
          { id: 'lomba', name: 'Marcelo Lomba', number: 1, position: 'Goleiro' },
          { id: 'naves', name: 'Naves', number: 34, position: 'Defensor' },
          { id: 'rios', name: 'Richard Ríos', number: 27, position: 'Meio-campista' },
          { id: 'rony', name: 'Rony', number: 10, position: 'Atacante' }
        ],
        manager: 'Abel Ferreira'
      }
    }
  },
  {
    id: 'match_today_rma_bar',
    championshipId: 'champions_2026',
    championshipName: 'UEFA Champions League',
    round: 6,
    homeClubId: 'real_madrid',
    homeClubName: 'Real Madrid CF',
    homeClubLogo: 'https://images.unsplash.com/photo-1504156806659-3c3149f7e53f?w=100&h=100&fit=crop&q=80',
    awayClubId: 'barcelona',
    awayClubName: 'FC Barcelona',
    awayClubLogo: 'https://images.unsplash.com/photo-1431324155629-1a6edd1def2d?w=100&h=100&fit=crop&q=80',
    stadium: 'Santiago Bernabéu',
    referee: 'Szymon Marciniak',
    date: getRelativeDate(0),
    time: '20:45',
    minute: 0,
    status: MatchStatus.SCHEDULED,
    score: { home: 0, away: 0 },
    events: [],
    stats: {
      possession: { home: 50, away: 50 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      passes: { home: 0, away: 0 },
      passAccuracy: { home: 0, away: 0 },
      crosses: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      saves: { home: 0, away: 0 },
      blockedShots: { home: 0, away: 0 },
      dangerousAttacks: { home: 0, away: 0 }
    },
    lineups: {
      home: {
        formation: '4-3-3',
        starting: [
          { id: 'courtois', name: 'Thibaut Courtois', number: 1, position: 'Goleiro' },
          { id: 'carvajal', name: 'Dani Carvajal', number: 2, position: 'Defensor' },
          { id: 'militao', name: 'Éder Militão', number: 3, position: 'Defensor' },
          { id: 'rudiger', name: 'Antonio Rüdiger', number: 22, position: 'Defensor' },
          { id: 'mendy', name: 'Ferland Mendy', number: 23, position: 'Defensor' },
          { id: 'tchouameni', name: 'Aurelien Tchouaméni', number: 14, position: 'Meio-campista' },
          { id: 'valverde', name: 'Federico Valverde', number: 8, position: 'Meio-campista' },
          { id: 'bellingham', name: 'Jude Bellingham', number: 5, position: 'Meio-campista' },
          { id: 'rodrygo', name: 'Rodrygo Goes', number: 11, position: 'Atacante' },
          { id: 'mbappe', name: 'Kylian Mbappé', number: 9, position: 'Atacante' },
          { id: 'vini_jr', name: 'Vinícius Júnior', number: 7, position: 'Atacante' }
        ],
        bench: [
          { id: 'lunin', name: 'Andriy Lunin', number: 13, position: 'Goleiro' },
          { id: 'modric', name: 'Luka Modric', number: 10, position: 'Meio-campista' },
          { id: 'camavinga', name: 'Eduardo Camavinga', number: 6, position: 'Meio-campista' },
          { id: 'endrick', name: 'Endrick', number: 16, position: 'Atacante' }
        ],
        manager: 'Carlo Ancelotti'
      },
      away: {
        formation: '4-2-3-1',
        starting: [
          { id: 'ter_stegen', name: 'Marc-André ter Stegen', number: 1, position: 'Goleiro' },
          { id: 'kounde', name: 'Jules Koundé', number: 23, position: 'Defensor' },
          { id: 'cubarsi', name: 'Pau Cubarsí', number: 2, position: 'Defensor' },
          { id: 'martinez', name: 'Inigo Martínez', number: 5, position: 'Defensor' },
          { id: 'balde', name: 'Alejandro Balde', number: 3, position: 'Defensor' },
          { id: 'pedri', name: 'Pedri González', number: 8, position: 'Meio-campista' },
          { id: 'casado', name: 'Marc Casadó', number: 17, position: 'Meio-campista' },
          { id: 'olmo', name: 'Dani Olmo', number: 20, position: 'Meio-campista' },
          { id: 'yamal', name: 'Lamine Yamal', number: 19, position: 'Atacante' },
          { id: 'raphinha', name: 'Raphinha', number: 11, position: 'Atacante' },
          { id: 'lewandowski', name: 'Robert Lewandowski', number: 9, position: 'Atacante' }
        ],
        bench: [
          { id: 'pena', name: 'Inaki Pena', number: 13, position: 'Goleiro' },
          { id: 'christensen', name: 'Andreas Christensen', number: 15, position: 'Defensor' },
          { id: 'gavi', name: 'Gavi', number: 6, position: 'Meio-campista' },
          { id: 'torres', name: 'Ferran Torres', number: 7, position: 'Atacante' }
        ],
        manager: 'Hansi Flick'
      }
    }
  },
  {
    id: 'match_yesterday_sao_cam',
    championshipId: 'brasileirao_2026',
    championshipName: 'Brasileirão Série A',
    round: 14,
    homeClubId: 'sao_paulo',
    homeClubName: 'São Paulo FC',
    homeClubLogo: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=100&h=100&fit=crop&q=80',
    awayClubId: 'atletico_mg',
    awayClubName: 'Atlético Mineiro',
    awayClubLogo: 'https://images.unsplash.com/photo-1540747737956-378724044453?w=100&h=100&fit=crop&q=80',
    stadium: 'MorumBIS',
    referee: 'Ramon Abatti Abel',
    date: getRelativeDate(-1),
    time: '19:30',
    minute: 90,
    status: MatchStatus.FINISHED,
    score: { home: 2, away: 1 },
    events: [
      { id: 'ev_y1', minute: 1, type: 'KickOff', team: 'neutral', player1: 'Início', detail: 'Partida iniciada no MorumBIS!' },
      { id: 'ev_y2', minute: 23, type: 'Goal', team: 'home', player1: 'Calleri', player2: 'Lucas Moura', detail: 'Gol de cabeça' },
      { id: 'ev_y3', minute: 61, type: 'Goal', team: 'away', player1: 'Hulk', detail: 'Cobrança magistral de falta' },
      { id: 'ev_y4', minute: 78, type: 'Goal', team: 'home', player1: 'Lucas Moura', player2: 'Luciano', detail: 'Drible curto na área e chute rasteiro!' },
      { id: 'ev_y5', minute: 90, type: 'FullTime', team: 'neutral', player1: 'Fim de Jogo', detail: 'São Paulo conquista os 3 pontos!' }
    ],
    stats: {
      possession: { home: 48, away: 52 },
      shots: { home: 14, away: 11 },
      shotsOnTarget: { home: 7, away: 4 },
      passes: { home: 389, away: 420 },
      passAccuracy: { home: 84, away: 85 },
      crosses: { home: 12, away: 14 },
      corners: { home: 6, away: 5 },
      fouls: { home: 12, away: 11 },
      saves: { home: 3, away: 5 },
      blockedShots: { home: 2, away: 2 },
      dangerousAttacks: { home: 44, away: 48 }
    },
    lineups: {
      home: {
        formation: '4-2-3-1',
        starting: [
          { id: 'rafael', name: 'Rafael', number: 23, position: 'Goleiro', rating: 7.0 },
          { id: 'rafinha', name: 'Rafinha', number: 13, position: 'Defensor', rating: 6.5 },
          { id: 'arboleda', name: 'Robert Arboleda', number: 5, position: 'Defensor', rating: 7.2 },
          { id: 'alan_franco', name: 'Alan Franco', number: 28, position: 'Defensor', rating: 6.8 },
          { id: 'wellingon', name: 'Welington', number: 6, position: 'Defensor', rating: 6.7 },
          { id: 'luiz_gustavo', name: 'Luiz Gustavo', number: 8, position: 'Meio-campista', rating: 7.1 },
          { id: 'bobadilla', name: 'Damián Bobadilla', number: 21, position: 'Meio-campista', rating: 6.9 },
          { id: 'lucas', name: 'Lucas Moura', number: 7, position: 'Meio-campista', rating: 8.5 },
          { id: 'luciano', name: 'Luciano', number: 10, position: 'Meio-campista', rating: 7.3 },
          { id: 'nestor', name: 'Rodrigo Nestor', number: 11, position: 'Meio-campista', rating: 6.8 },
          { id: 'calleri', name: 'Jonathan Calleri', number: 9, position: 'Atacante', rating: 7.8 }
        ],
        bench: [
          { id: 'jandrei', name: 'Jandrei', number: 93, position: 'Goleiro' },
          { id: 'ferraresi', name: 'Nahuel Ferraresi', number: 3, position: 'Defensor' },
          { id: 'galoppo', name: 'Giuliano Galoppo', number: 14, position: 'Meio-campista' },
          { id: 'andre_silva', name: 'André Silva', number: 17, position: 'Atacante' }
        ],
        manager: 'Luis Zubeldía'
      },
      away: {
        formation: '4-3-3',
        starting: [
          { id: 'everson', name: 'Everson', number: 22, position: 'Goleiro', rating: 6.8 },
          { id: 'saravia', name: 'Renzo Saravia', number: 26, position: 'Defensor', rating: 6.4 },
          { id: 'battaglia', name: 'Rodrigo Battaglia', number: 21, position: 'Defensor', rating: 7.0 },
          { id: 'fuchs', name: 'Bruno Fuchs', number: 3, position: 'Defensor', rating: 6.6 },
          { id: 'arana', name: 'Guilherme Arana', number: 13, position: 'Defensor', rating: 7.3 },
          { id: 'otavio', name: 'Otávio', number: 5, position: 'Meio-campista', rating: 6.9 },
          { id: 'alan_franco_am', name: 'Alan Franco', number: 23, position: 'Meio-campista', rating: 6.8 },
          { id: 'scarpa', name: 'Gustavo Scarpa', number: 17, position: 'Meio-campista', rating: 7.1 },
          { id: 'paulinho', name: 'Paulinho', number: 10, position: 'Atacante', rating: 6.7 },
          { id: 'gomes', name: 'Igor Gomes', number: 17, position: 'Meio-campista', rating: 6.5 },
          { id: 'hulk', name: 'Hulk', number: 7, position: 'Atacante', rating: 7.8 }
        ],
        bench: [
          { id: 'mendes', name: 'Matheus Mendes', number: 31, position: 'Goleiro' },
          { id: 'rabello', name: 'Igor Rabello', number: 16, position: 'Defensor' },
          { id: 'palacios', name: 'Brahian Palacios', number: 30, position: 'Atacante' },
          { id: 'vargas', name: 'Eduardo Vargas', number: 11, position: 'Atacante' }
        ],
        manager: 'Gabriel Milito'
      }
    }
  },
  {
    id: 'match_tomorrow_pal_sao',
    championshipId: 'brasileirao_2026',
    championshipName: 'Brasileirão Série A',
    round: 16,
    homeClubId: 'palmeiras',
    homeClubName: 'SE Palmeiras',
    homeClubLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop&q=80',
    awayClubId: 'sao_paulo',
    awayClubName: 'São Paulo FC',
    awayClubLogo: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=100&h=100&fit=crop&q=80',
    stadium: 'Allianz Parque',
    referee: 'Raphael Claus',
    date: getRelativeDate(1),
    time: '18:30',
    minute: 0,
    status: MatchStatus.SCHEDULED,
    score: { home: 0, away: 0 },
    events: [],
    stats: {
      possession: { home: 50, away: 50 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      passes: { home: 0, away: 0 },
      passAccuracy: { home: 0, away: 0 },
      crosses: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      saves: { home: 0, away: 0 },
      blockedShots: { home: 0, away: 0 },
      dangerousAttacks: { home: 0, away: 0 }
    },
    lineups: {
      home: {
        formation: '4-2-3-1',
        starting: [
          { id: 'weverton', name: 'Weverton', number: 21, position: 'Goleiro' },
          { id: 'rocha', name: 'Marcos Rocha', number: 2, position: 'Defensor' },
          { id: 'gomez', name: 'Gustavo Gómez', number: 15, position: 'Defensor' },
          { id: 'murilo', name: 'Murilo', number: 26, position: 'Defensor' },
          { id: 'piquerez', name: 'Joaquín Piquerez', number: 22, position: 'Defensor' },
          { id: 'anibal', name: 'Aníbal Moreno', number: 5, position: 'Meio-campista' },
          { id: 'ze_rafael', name: 'Zé Rafael', number: 8, position: 'Meio-campista' },
          { id: 'veiga', name: 'Raphael Veiga', number: 23, position: 'Meio-campista' },
          { id: 'estevao', name: 'Estêvão Willian', number: 41, position: 'Atacante' },
          { id: 'felipe_anderson', name: 'Felipe Anderson', number: 9, position: 'Atacante' },
          { id: 'flaco', name: 'Flaco López', number: 42, position: 'Atacante' }
        ],
        bench: [
          { id: 'lomba', name: 'Marcelo Lomba', number: 1, position: 'Goleiro' },
          { id: 'naves', name: 'Naves', number: 34, position: 'Defensor' },
          { id: 'rios', name: 'Richard Ríos', number: 27, position: 'Meio-campista' },
          { id: 'rony', name: 'Rony', number: 10, position: 'Atacante' }
        ],
        manager: 'Abel Ferreira'
      },
      away: {
        formation: '4-2-3-1',
        starting: [
          { id: 'rafael', name: 'Rafael', number: 23, position: 'Goleiro' },
          { id: 'rafinha', name: 'Rafinha', number: 13, position: 'Defensor' },
          { id: 'arboleda', name: 'Robert Arboleda', number: 5, position: 'Defensor' },
          { id: 'alan_franco', name: 'Alan Franco', number: 28, position: 'Defensor' },
          { id: 'wellingon', name: 'Welington', number: 6, position: 'Defensor' },
          { id: 'luiz_gustavo', name: 'Luiz Gustavo', number: 8, position: 'Meio-campista' },
          { id: 'bobadilla', name: 'Damián Bobadilla', number: 21, position: 'Meio-campista' },
          { id: 'lucas', name: 'Lucas Moura', number: 7, position: 'Meio-campista' },
          { id: 'luciano', name: 'Luciano', number: 10, position: 'Meio-campista' },
          { id: 'nestor', name: 'Rodrigo Nestor', number: 11, position: 'Meio-campista' },
          { id: 'calleri', name: 'Jonathan Calleri', number: 9, position: 'Atacante' }
        ],
        bench: [
          { id: 'jandrei', name: 'Jandrei', number: 93, position: 'Goleiro' },
          { id: 'ferraresi', name: 'Nahuel Ferraresi', number: 3, position: 'Defensor' },
          { id: 'galoppo', name: 'Giuliano Galoppo', number: 14, position: 'Meio-campista' },
          { id: 'andre_silva', name: 'André Silva', number: 17, position: 'Atacante' }
        ],
        manager: 'Luis Zubeldía'
      }
    }
  }
];

export const INITIAL_NEWS: NewsArticle[] = [
  {
    id: 'news_1',
    title: 'Flamengo planeja investida por reforço europeu na janela de transferências',
    summary: 'A diretoria rubro-negra monitora a situação de meio-campista que atua na Premier League e planeja proposta oficial nas próximas semanas.',
    content: 'O Flamengo está ativo no mercado da bola buscando fortalecer seu meio de campo para o restante da temporada 2026. Segundo fontes próximas à diretoria, o técnico Filipe Luís indicou o nome de um jogador experiente que atua na Inglaterra e está insatisfeito com a falta de minutos. O clube carioca estaria disposto a oferecer um contrato de três anos com salários compatíveis com os maiores astros do elenco. As negociações devem começar oficialmente nos próximos dias.',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop&q=80',
    category: 'Transferência',
    clubId: 'flamengo',
    clubName: 'CR Flamengo',
    publishedAt: '2026-07-05 10:30',
    views: 12450
  },
  {
    id: 'news_2',
    title: 'Lamine Yamal projeta duelo decisivo da Champions League contra o Real Madrid',
    summary: 'A jovem estrela do Barcelona comentou sobre a preparação tática da equipe catalã e destacou a importância de manter a posse de bola no Bernabéu.',
    content: 'Em entrevista coletiva realizada nesta manhã, a joia do Barcelona, Lamine Yamal, mostrou-se confiante para os próximos desafios europeus. "Sabemos da qualidade do Real Madrid no Bernabéu, mas nossa equipe está focada e pronta para implementar o estilo de jogo do professor Hansi Flick. A chave será controlar o ritmo do jogo no meio-campo e sermos letais nas transições rápidas", declarou o ponta de 18 anos.',
    imageUrl: 'https://images.unsplash.com/photo-1540747737956-378724044453?w=800&h=400&fit=crop&q=80',
    category: 'Entrevista',
    clubId: 'barcelona',
    clubName: 'FC Barcelona',
    publishedAt: '2026-07-05 08:15',
    views: 18900
  },
  {
    id: 'news_3',
    title: 'Estevão brilha nos treinos e deve ser titular no clássico paulista',
    summary: 'O atacante do Palmeiras treinou entre os titulares na última atividade realizada no Allianz Parque e ganha moral com Abel Ferreira.',
    content: 'A preparação do Palmeiras para os próximos jogos do Brasileirão ganhou um reforço de peso. O atacante Estevão treinou em alto nível, demonstrando excelente forma física e pontaria afiada. Abel Ferreira testou uma nova variação tática com o jovem aberto pela direita, buscando quebrar a linha defensiva adversária com dribles verticais. A expectativa é de casa cheia no Allianz Parque para apoiar o Verdão.',
    imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=400&fit=crop&q=80',
    category: 'Geral',
    clubId: 'palmeiras',
    clubName: 'SE Palmeiras',
    publishedAt: '2026-07-04 15:40',
    views: 9320
  },
  {
    id: 'news_4',
    title: 'DM do Atlético Mineiro atualiza estado clínico de lesionados',
    summary: 'Três titulares importantes seguem cronograma especial de transição física e médica para retornar aos gramados na Arena MRV.',
    content: 'O departamento médico do Atlético Mineiro divulgou uma nota atualizando o processo de recuperação de seus atletas lesionados. O principal meia de criação iniciou hoje os trabalhos de transição com bola no gramado, aproximando-se do retorno. O zagueiro titular avançou na fisioterapia e deve realizar exames complementares na próxima semana. A comissão técnica de Gabriel Milito prega cautela para evitar novas recaídas.',
    imageUrl: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=800&h=400&fit=crop&q=80',
    category: 'Lesão',
    clubId: 'atletico_mg',
    clubName: 'Atlético Mineiro',
    publishedAt: '2026-07-03 11:20',
    views: 6510
  }
];
