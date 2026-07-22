export enum MatchStatus {
  SCHEDULED = 'Agendado',
  LIVE = 'Ao Vivo',
  HT = 'Intervalo',
  FINISHED = 'Encerrado',
  POSTPONED = 'Adiado',
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  country: string;
  founded: string;
  stadium: string;
  manager: string;
  titles: string[];
  stats: {
    wins: number;
    draws: number;
    losses: number;
    goalsScored: number;
    goalsConceded: number;
  };
}

export interface Player {
  id: string;
  name: string;
  photoUrl: string;
  age: number;
  nationality: string;
  clubId: string;
  clubName: string;
  number: number;
  position: 'Goleiro' | 'Defensor' | 'Meio-campista' | 'Atacante';
  marketValue: string;
  height?: string;
  stats: {
    matches: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
  };
  history: {
    season: string;
    club: string;
    matches: number;
    goals: number;
  }[];
}

export interface StandingRow {
  clubId: string;
  clubName: string;
  logoUrl: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  group?: string;
  baseStats?: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  };
}

export interface Championship {
  id: string;
  name: string;
  logoUrl: string;
  type: 'Liga' | 'Copa' | 'Internacional';
  season: string;
  roundsCount: number;
  currentRound: number;
  standings: StandingRow[];
  regulations: string;
  topScorers: {
    playerId: string;
    playerName: string;
    clubName: string;
    goals: number;
  }[];
  topAssists: {
    playerId: string;
    playerName: string;
    clubName: string;
    assists: number;
  }[];
  status?: 'Ativo' | 'Encerrado';
}

export interface MatchEvent {
  id: string;
  minute: number;
  type: 'Goal' | 'YellowCard' | 'RedCard' | 'Substitution' | 'PenaltyMissed' | 'Offside' | 'VAR' | 'KickOff' | 'FullTime' | 'HalfTime' | 'Corner';
  team: 'home' | 'away' | 'neutral';
  player1: string; // main player (e.g., scorer, carded player, player coming off)
  player2?: string; // secondary player (e.g., assist provider, player coming on)
  detail?: string; // e.g. "Gol de pênalti", "Substituição tática", "Cartão por falta tática", "Gol anulado pelo VAR"
}

export interface MatchStats {
  possession: { home: number; away: number }; // percentages
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  passes: { home: number; away: number };
  passAccuracy: { home: number; away: number }; // percentages
  crosses: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  saves: { home: number; away: number };
  blockedShots: { home: number; away: number };
  dangerousAttacks: { home: number; away: number };
}

export interface LineupPlayer {
  id: string;
  name: string;
  number: number;
  position: string;
  rating?: number;
}

export interface MatchLineups {
  home: {
    formation: string;
    starting: LineupPlayer[];
    bench: LineupPlayer[];
    manager: string;
  };
  away: {
    formation: string;
    starting: LineupPlayer[];
    bench: LineupPlayer[];
    manager: string;
  };
}

export interface Match {
  id: string;
  championshipId: string;
  championshipName: string;
  round: number;
  homeClubId: string;
  homeClubName: string;
  homeClubLogo: string;
  awayClubId: string;
  awayClubName: string;
  awayClubLogo: string;
  stadium: string;
  referee: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  minute: number; // current playing minute if live
  status: MatchStatus;
  score: {
    home: number;
    away: number;
  };
  phase?: string;
  isExtraTime?: boolean;
  scoreExtraTime?: {
    home: number;
    away: number;
  };
  scorePenalties?: {
    home: number;
    away: number;
  };
  events: MatchEvent[];
  stats: MatchStats;
  lineups: MatchLineups;
  isPaused?: boolean;
  lastTickAt?: number;
  htStartedAt?: number;
  statsApplied?: boolean;
  injuryTime1stHalf?: number;
  injuryTime2ndHalf?: number;
}

export function formatMatchMinute(minute: number, injuryTime1stHalf?: number, injuryTime2ndHalf?: number): string {
  if (minute <= 45) {
    return `${minute}'`;
  }
  const limit1stHalf = 45 + (injuryTime1stHalf || 0);
  if (minute <= limit1stHalf) {
    if ((injuryTime1stHalf || 0) > 0) {
      return `45+${minute - 45}'`;
    }
    return `${minute}'`;
  }
  if (minute <= 90) {
    return `${minute}'`;
  }
  return `90+${minute - 90}'`;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  category: 'Geral' | 'Transferência' | 'Lesão' | 'Entrevista' | 'Rumor';
  clubId?: string;
  clubName?: string;
  publishedAt: string; // YYYY-MM-DD HH:MM
  views: number;
}

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  photoUrl?: string;
  role: 'User' | 'Admin';
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: 'golo' | 'sistema' | 'noticia' | 'jogo';
}

export interface AppFavorites {
  clubs: string[]; // ids
  players: string[]; // ids
  championships: string[]; // ids
  matches: string[]; // ids
}

export interface UserPresence {
  uid: string;
  name: string;
  photoUrl: string;
  status: 'online' | 'offline';
  typingIn: string | null;
  lastActive?: any;
}

export interface SystemBackup {
  id: string;
  description: string;
  createdAt: string;
  createdTime: string;
  adminEmail: string;
  data: {
    clubs: Club[];
    players: Player[];
    championships: Championship[];
    matches: Match[];
    news: NewsArticle[];
  };
}

export interface AuditLog {
  id: string;
  title: string;
  desc: string;
  timestamp: string;
  adminEmail: string;
  badgeColor?: string;
}


