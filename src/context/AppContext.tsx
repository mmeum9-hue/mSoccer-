import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Club,
  Player,
  Championship,
  Match,
  MatchStatus,
  NewsArticle,
  AppUser,
  AppNotification,
  AppFavorites,
  MatchEvent,
  UserPresence,
  SystemBackup,
  AuditLog,
} from '../types';
import {
  INITIAL_CLUBS,
  INITIAL_PLAYERS,
  INITIAL_CHAMPIONSHIPS,
  INITIAL_MATCHES,
  INITIAL_NEWS,
} from '../mockData';
import { collection, doc, setDoc as originalSetDoc, onSnapshot, deleteDoc, getDoc, getDocs, runTransaction, updateDoc, serverTimestamp, addDoc, query, orderBy, limit, where } from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { db, auth } from '../firebase';

// Recursive utility to remove undefined values from objects before writing to Firestore
export const parseDateString = (dateStr: string): number => {
  if (!dateStr) return 0;
  try {
    if (dateStr.includes('/')) {
      const parts = dateStr.split(' ');
      const dateParts = parts[0].split('/');
      const timeParts = parts[1] ? parts[1].split(':') : ['00', '00'];
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);
        const hour = timeParts[0] ? parseInt(timeParts[0], 10) : 0;
        const minute = timeParts[1] ? parseInt(timeParts[1], 10) : 0;
        return new Date(year, month, day, hour, minute).getTime();
      }
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split(' ');
      const dateParts = parts[0].split('-');
      const timeParts = parts[1] ? parts[1].split(':') : ['00', '00'];
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);
        const hour = timeParts[0] ? parseInt(timeParts[0], 10) : 0;
        const minute = timeParts[1] ? parseInt(timeParts[1], 10) : 0;
        return new Date(year, month, day, hour, minute).getTime();
      }
    }
    const t = Date.parse(dateStr);
    return isNaN(t) ? 0 : t;
  } catch (e) {
    return 0;
  }
};

const cleanUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined);
  }
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        res[key] = cleanUndefined(obj[key]);
      }
    }
    return res;
  }
  return obj;
};

// Safe setDoc wrapper (defaults to merge: true to prevent field wiping)
const setDoc = (ref: any, data: any, options: any = { merge: true }) => {
  return originalSetDoc(ref, cleanUndefined(data), options);
};

const tickMatchWithTransaction = async (matchId: string, currentMinute: number, intervalTime: number) => {
  const matchDocRef = doc(db, 'matches', matchId);
  try {
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(matchDocRef);
      if (!sfDoc.exists()) return;

      const m = sfDoc.data() as Match;
      if (m.status !== MatchStatus.LIVE || m.isPaused) return;

      const now = Date.now();
      const lastTick = m.lastTickAt || 0;
      const timeSinceLastTick = now - lastTick;

      // Check if it's actually time to tick, and the minute is still what we expected
      if (m.minute === currentMinute && (lastTick === 0 || timeSinceLastTick >= intervalTime)) {
        const nextMinute = m.minute + 1;
        let updatedMatch: Match;

        const max1stHalfMinute = 45 + (m.injuryTime1stHalf || 0);
        const max2ndHalfMinute = 90 + (m.injuryTime2ndHalf || 0);

        if (nextMinute > max2ndHalfMinute) {
          updatedMatch = {
            ...m,
            minute: max2ndHalfMinute,
            status: MatchStatus.FINISHED,
            lastTickAt: now,
            events: [
              ...m.events,
              {
                id: 'ev_ft_' + Date.now(),
                minute: max2ndHalfMinute,
                type: 'FullTime' as const,
                team: 'neutral' as const,
                player1: 'Fim de Jogo',
                detail: 'Árbitro encerra a partida!'
              }
            ]
          };
        } else if (nextMinute > max1stHalfMinute && m.minute <= max1stHalfMinute && m.events.filter((e) => e.type === 'HalfTime').length === 0) {
          updatedMatch = {
            ...m,
            minute: 45,
            status: MatchStatus.HT,
            lastTickAt: now,
            htStartedAt: now,
            events: [
              ...m.events,
              {
                id: 'ev_ht_' + Date.now(),
                minute: 45,
                type: 'HalfTime' as const,
                team: 'neutral' as const,
                player1: 'Intervalo',
                detail: 'Fim do primeiro tempo!'
              }
            ]
          };
        } else {
          updatedMatch = {
            ...m,
            minute: nextMinute,
            lastTickAt: now
          };
        }

        transaction.update(matchDocRef, cleanUndefined(updatedMatch));
      }
    });
  } catch (e) {
    console.error("Tick transaction failed:", e);
  }
};

const transitionHTToLiveWithTransaction = async (matchId: string) => {
  const matchDocRef = doc(db, 'matches', matchId);
  try {
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(matchDocRef);
      if (!sfDoc.exists()) return;

      const m = sfDoc.data() as Match;
      if (m.status !== MatchStatus.HT) return;

      const now = Date.now();
      const updatedMatch = {
        ...m,
        minute: 46,
        status: MatchStatus.LIVE,
        lastTickAt: now,
        htStartedAt: 0,
        events: [
          ...m.events,
          {
            id: 'ev_start2_' + Date.now(),
            minute: 45,
            type: 'KickOff' as const,
            team: 'neutral' as const,
            player1: 'Início do 2T',
            detail: 'Bola em jogo para a segunda etapa!'
          }
        ]
      };

      transaction.update(matchDocRef, cleanUndefined(updatedMatch));
    });
  } catch (e) {
    console.error("HT transition transaction failed:", e);
  }
};

export type AppView =
  | { type: 'jogos' }
  | { type: 'tabela' }
  | { type: 'noticias' }
  | { type: 'admin' }
  | { type: 'perfil' }
  | { type: 'chat' }
  | { type: 'notificacoes' }
  | { type: 'match'; id: string }
  | { type: 'club'; id: string }
  | { type: 'player'; id: string }
  | { type: 'league'; id: string };

interface AppContextType {
  clubs: Club[];
  players: Player[];
  championships: Championship[];
  matches: Match[];
  news: NewsArticle[];
  favorites: AppFavorites;
  user: AppUser | null;
  notifications: AppNotification[];
  currentView: AppView;
  viewHistory: AppView[];
  theme: 'light' | 'dark';
  headerColor: string;
  setHeaderColor: (color: string) => void;
  language: 'pt' | 'en' | 'es';
  liveSimSpeed: 'off' | 'normal' | 'fast';
  toast: { title: string; body: string; id: string; type: string } | null;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  setToast: (toast: { title: string; body: string; id: string; type: string } | null) => void;
  setLiveSimSpeed: (speed: 'off' | 'normal' | 'fast') => void;
  navigateTo: (view: AppView) => void;
  navigateBack: () => void;
  toggleFavorite: (type: keyof AppFavorites, id: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'pt' | 'en' | 'es') => void;
  loginUser: (email: string, password?: string, role?: 'User' | 'Admin') => Promise<void>;
  registerUser: (email: string, password: string, name: string, role?: 'User' | 'Admin') => Promise<void>;
  loginWithGoogle: (role?: 'User' | 'Admin') => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  updateUser: (name: string, email: string, photoUrl?: string) => Promise<void>;
  updateUserRole: (role: 'User' | 'Admin') => Promise<void>;
  addNotification: (title: string, body: string, type: 'golo' | 'sistema' | 'noticia' | 'jogo') => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  dbConfig: { initialized?: boolean; cleared?: boolean } | null;
  clearAllDatabase: () => Promise<void>;
  recalculateAllPlayerStats: () => Promise<void>;
  
  // Chat & Presence addition
  chatUnreadCounts: { [room: string]: number };
  activeChatRoom: string;
  setActiveChatRoom: (room: string) => void;
  onlineUsers: UserPresence[];
  setMyTypingState: (room: string | null) => Promise<void>;
  
  // Admin triggers
  addMatch: (match: Match) => void;
  updateMatch: (match: Match) => void;
  deleteMatch: (id: string) => void;
  addClub: (club: Club) => void;
  updateClub: (club: Club) => void;
  deleteClub: (id: string) => void;
  addPlayer: (player: Player) => void;
  updatePlayer: (player: Player) => void;
  deletePlayer: (id: string) => void;
  addChampionship: (championship: Championship) => void;
  updateChampionship: (championship: Championship) => void;
  recalculateStandingsForChampionship: (champId: string, currentMatches?: Match[], currentClubs?: Club[]) => Promise<void>;
  deleteChampionship: (id: string) => void;
  clearAllChampionships: () => void;
  addNews: (news: NewsArticle) => void;
  updateNews: (news: NewsArticle) => void;
  deleteNews: (id: string) => void;
  clearAllNews: () => void;
  triggerMatchEvent: (matchId: string, event: Omit<MatchEvent, 'id'>) => void;
  
  // Backups & Auditing
  backups: SystemBackup[];
  auditLogs: AuditLog[];
  createBackup: (description: string) => Promise<void>;
  restoreBackup: (backupId: string) => Promise<void>;
  deleteBackup: (backupId: string) => Promise<void>;
  addAuditLog: (title: string, desc: string, badgeColor?: string) => Promise<void>;
}

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // ignore
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // ignore
    }
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const findMatchingClub = (clubsList: Club[], clubId: string, clubName?: string): Club | undefined => {
  if (!clubId && !clubName) return undefined;
  const cleanId = (clubId || '').trim().toLowerCase();

  if (cleanId) {
    const exactId = clubsList.find((c) => c.id.trim().toLowerCase() === cleanId);
    if (exactId) return exactId;
  }

  const cleanName = (clubName || '').trim().toLowerCase();
  if (cleanName) {
    const exactName = clubsList.find((c) => c.name.trim().toLowerCase() === cleanName);
    if (exactName) return exactName;
  }

  return undefined;
};

const isClubInStandingRow = (
  standingRow: { clubId: string; clubName: string },
  matchClubId: string,
  matchClubName: string,
  clubsList?: Club[]
): boolean => {
  if (standingRow.clubId && matchClubId) {
    return standingRow.clubId.trim().toLowerCase() === matchClubId.trim().toLowerCase();
  }
  if (standingRow.clubName && matchClubName) {
    return standingRow.clubName.trim().toLowerCase() === matchClubName.trim().toLowerCase();
  }
  return false;
};

const findBestPlayerMatchHelper = (allPlayers: Player[], name: string): Player | null => {
  if (!name) return null;
  const normalized = name.trim().toLowerCase();
  let matched = allPlayers.find(p => p.name.toLowerCase() === normalized || p.id === normalized.replace(/\s+/g, '_'));
  if (matched) return matched;

  matched = allPlayers.find(p => {
    const dbNameLower = p.name.toLowerCase();
    const words = dbNameLower.split(/\s+/);
    return words.includes(normalized);
  });
  if (matched) return matched;

  matched = allPlayers.find(p => {
    const dbNameLower = p.name.toLowerCase();
    const queryWords = normalized.split(/\s+/);
    return queryWords.includes(dbNameLower);
  });
  if (matched) return matched;

  const queryParts = normalized.split(/\s+/).filter(part => part.length > 1 && !part.endsWith('.'));
  if (queryParts.length > 0) {
    matched = allPlayers.find(p => {
      const dbNameLower = p.name.toLowerCase();
      return queryParts.every(part => dbNameLower.includes(part));
    });
    if (matched) return matched;
  }

  matched = allPlayers.find(p => p.name.toLowerCase().includes(normalized) || normalized.includes(p.name.toLowerCase()));
  return matched || null;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial states from local memory or defaults first to keep app working offline / during initial sync
  const [clubs, setClubs] = useState<Club[]>(() => {
    try {
      const saved = safeLocalStorage.getItem('msoccer_clubs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = safeLocalStorage.getItem('msoccer_players');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [championships, setChampionships] = useState<Championship[]>(() => {
    try {
      const saved = safeLocalStorage.getItem('msoccer_championships');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const saved = safeLocalStorage.getItem('msoccer_matches');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [news, setNews] = useState<NewsArticle[]>(() => {
    try {
      const saved = safeLocalStorage.getItem('msoccer_news');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<AppFavorites>(() => {
    try {
      const saved = safeLocalStorage.getItem('msoccer_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          clubs: Array.isArray(parsed?.clubs) ? parsed.clubs : [],
          players: Array.isArray(parsed?.players) ? parsed.players : [],
          championships: Array.isArray(parsed?.championships) ? parsed.championships : [],
          matches: Array.isArray(parsed?.matches) ? parsed.matches : [],
        };
      }
    } catch (e) {
      // fallback
    }
    return { clubs: [], players: [], championships: [], matches: [] };
  });

  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const saved = safeLocalStorage.getItem('msoccer_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.uid && parsed.name && parsed.email) {
          return parsed as AppUser;
        }
      }
    } catch (e) {
      // fallback
    }
    return null;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = safeLocalStorage.getItem('msoccer_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      // fallback
    }
    return [
      { id: 'n1', title: 'Bem-vindo ao mSoccer!', body: 'Acompanhe todos os resultados de futebol ao vivo, estatísticas, escalações e gerencie tudo no painel admin!', timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), read: false, type: 'sistema' }
    ];
  });

  const [currentView, setCurrentView] = useState<AppView>({ type: 'jogos' });
  const [viewHistory, setViewHistory] = useState<AppView[]>([{ type: 'jogos' }]);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = safeLocalStorage.getItem('msoccer_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [headerColor, setHeaderColorState] = useState<string>(() => {
    const saved = safeLocalStorage.getItem('msoccer_header_color');
    return saved || 'blue';
  });

  const setHeaderColor = (color: string) => {
    setHeaderColorState(color);
    safeLocalStorage.setItem('msoccer_header_color', color);
  };

  const [language, setLanguageState] = useState<'pt' | 'en' | 'es'>(() => {
    const saved = safeLocalStorage.getItem('msoccer_lang');
    return (saved as 'pt' | 'en' | 'es') || 'pt';
  });

  const [liveSimSpeed, setLiveSimSpeed] = useState<'off' | 'normal' | 'fast'>('normal');
  const [toast, setToast] = useState<{ title: string; body: string; id: string; type: string } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [dbConfig, setDbConfig] = useState<{ initialized?: boolean; cleared?: boolean } | null>(null);
  const [backups, setBackups] = useState<SystemBackup[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Chat & Presence States
  const [chatUnreadCounts, setChatUnreadCounts] = useState<{ [room: string]: number }>({});
  const [activeChatRoom, setActiveChatRoom] = useState<string>('');
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);

  const [lastReadTimestamps, setLastReadTimestamps] = useState<{ [room: string]: number }>(() => {
    try {
      const saved = safeLocalStorage.getItem('msoccer_last_read_timestamps');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Sync DB Config with safety fallbacks to prevent accidental re-seeding
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'system', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        setDbConfig(snapshot.data());
      } else {
        // Fallback: Default to initialized: true to prevent unexpected wiping or re-seeding on config document miss
        setDbConfig({ initialized: true, cleared: false });
      }
    }, (error) => {
      console.warn("Firestore system config notice:", error.message);
      setDbConfig((prev) => prev || { initialized: true, cleared: false });
    });
    return () => unsubscribe();
  }, []);

  // Safe One-time Database Seeding (only if DB is genuinely empty and uninitialized)
  useEffect(() => {
    const safeSeedDatabase = async () => {
      if (dbConfig && dbConfig.initialized === false && dbConfig.cleared !== true) {
        try {
          // Verify if collections are actually empty before seeding
          const existingClubs = await getDocs(collection(db, 'clubs'));
          if (!existingClubs.empty) {
            // Data already exists! Mark initialized without overwriting
            await setDoc(doc(db, 'system', 'config'), { initialized: true, cleared: false }, { merge: true });
            return;
          }

          await setDoc(doc(db, 'system', 'config'), { initialized: true, cleared: false }, { merge: true });

          INITIAL_CLUBS.forEach(club => {
            setDoc(doc(db, 'clubs', club.id), club, { merge: true }).catch(console.error);
          });
          INITIAL_PLAYERS.forEach(player => {
            setDoc(doc(db, 'players', player.id), player, { merge: true }).catch(console.error);
          });
          INITIAL_CHAMPIONSHIPS.forEach(champ => {
            setDoc(doc(db, 'championships', champ.id), champ, { merge: true }).catch(console.error);
          });
          INITIAL_MATCHES.forEach(m => {
            setDoc(doc(db, 'matches', m.id), m, { merge: true }).catch(console.error);
          });
          INITIAL_NEWS.forEach(n => {
            setDoc(doc(db, 'news', n.id), n, { merge: true }).catch(console.error);
          });
        } catch (err) {
          console.warn("Safety check during initial seeding:", err);
        }
      }
    };
    safeSeedDatabase();
  }, [dbConfig]);

  // Firestore Real-Time Synchronizations
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'clubs'), (snapshot) => {
      const items: Club[] = [];
      snapshot.forEach(docSnapshot => items.push(docSnapshot.data() as Club));
      setClubs(items);
    }, (error) => console.error("Firestore clubs error:", error));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'players'), (snapshot) => {
      const items: Player[] = [];
      snapshot.forEach(docSnapshot => items.push(docSnapshot.data() as Player));
      setPlayers(items);
    }, (error) => console.error("Firestore players error:", error));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'championships'), (snapshot) => {
      const items: Championship[] = [];
      snapshot.forEach(docSnapshot => items.push(docSnapshot.data() as Championship));
      setChampionships(items);
    }, (error) => console.error("Firestore championships error:", error));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'matches'), (snapshot) => {
      const items: Match[] = [];
      snapshot.forEach(docSnapshot => items.push(docSnapshot.data() as Match));
      setMatches(items);
    }, (error) => console.error("Firestore matches error:", error));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'news'), (snapshot) => {
      const items: NewsArticle[] = [];
      snapshot.forEach(docSnapshot => items.push(docSnapshot.data() as NewsArticle));
      items.sort((a, b) => parseDateString(b.publishedAt) - parseDateString(a.publishedAt));
      setNews(items);
    }, (error) => console.error("Firestore news error:", error));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const items: AuditLog[] = [];
        snapshot.forEach(docSnapshot => items.push(docSnapshot.data() as AuditLog));
        setAuditLogs(items);
      }, (error) => {
        console.warn("Firestore audit logs notice:", error.message);
      });
    } catch (err) {
      console.warn("Could not attach audit logs listener:", err);
    }
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(collection(db, 'backups'), (snapshot) => {
        const items: SystemBackup[] = [];
        snapshot.forEach(docSnapshot => items.push(docSnapshot.data() as SystemBackup));
        items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setBackups(items);
      }, (error) => {
        console.warn("Firestore backups notice:", error.message);
      });
    } catch (err) {
      console.warn("Could not attach backups listener:", err);
    }
    return () => unsubscribe();
  }, []);

  // Sync remaining user preferences and core states to local storage
  useEffect(() => { safeLocalStorage.setItem('msoccer_clubs', JSON.stringify(clubs)); }, [clubs]);
  useEffect(() => { safeLocalStorage.setItem('msoccer_players', JSON.stringify(players)); }, [players]);
  useEffect(() => { safeLocalStorage.setItem('msoccer_championships', JSON.stringify(championships)); }, [championships]);
  useEffect(() => { safeLocalStorage.setItem('msoccer_matches', JSON.stringify(matches)); }, [matches]);
  useEffect(() => { safeLocalStorage.setItem('msoccer_news', JSON.stringify(news)); }, [news]);

  useEffect(() => { safeLocalStorage.setItem('msoccer_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { 
    if (user) safeLocalStorage.setItem('msoccer_user', JSON.stringify(user));
    else safeLocalStorage.removeItem('msoccer_user');
  }, [user]);
  useEffect(() => { safeLocalStorage.setItem('msoccer_notifications', JSON.stringify(notifications)); }, [notifications]);

  useEffect(() => {
    safeLocalStorage.setItem('msoccer_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  useEffect(() => {
    safeLocalStorage.setItem('msoccer_lang', language);
  }, [language]);

  // View navigation helper with history
  const navigateTo = (view: AppView) => {
    // Avoid double pushing same view
    if (JSON.stringify(currentView) === JSON.stringify(view)) return;
    setCurrentView(view);
    setViewHistory((prev) => [...prev, view]);
  };

  const navigateBack = () => {
    if (viewHistory.length <= 1) return;
    const newHistory = [...viewHistory];
    newHistory.pop(); // remove current view
    const lastView = newHistory[newHistory.length - 1];
    setViewHistory(newHistory);
    setCurrentView(lastView);
  };

  const toggleFavorite = (type: keyof AppFavorites, id: string) => {
    setFavorites((prev) => {
      const isFav = prev[type].includes(id);
      const list = isFav
        ? prev[type].filter((x) => x !== id)
        : [...prev[type], id];
      
      // Notify user
      if (!isFav) {
        addNotification(
          'Favorito adicionado',
          `Você favoritou um item de ${type === 'clubs' ? 'Clube' : type === 'players' ? 'Jogador' : type === 'championships' ? 'Campeonato' : 'Jogo'}.`,
          'sistema'
        );
      }
      return { ...prev, [type]: list };
    });
  };

  const setTheme = (t: 'light' | 'dark') => setThemeState(t);
  const setLanguage = (l: 'pt' | 'en' | 'es') => setLanguageState(l);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        let role: 'User' | 'Admin' = 'User';
        let name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Jogador mSoccer';
        let photoUrl = firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;
        
        try {
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            role = data.role || 'User';
            name = data.name || name;
            photoUrl = data.photoUrl || photoUrl;
          } else {
            // New user signed in
            await setDoc(userDocRef, {
              uid: firebaseUser.uid,
              name,
              email: firebaseUser.email || '',
              photoUrl,
              role: (firebaseUser.email === 'admin@msoccer.com' || firebaseUser.email === 'mmeum9@gmail.com') ? 'Admin' : role,
              createdAt: new Date().toISOString()
            });
          }

          if (firebaseUser.email === 'admin@msoccer.com' || firebaseUser.email === 'mmeum9@gmail.com') {
            role = 'Admin';
          }
        } catch (e) {
          console.error("Error syncing authenticated user document:", e);
          if (firebaseUser.email === 'admin@msoccer.com' || firebaseUser.email === 'mmeum9@gmail.com') {
            role = 'Admin';
          }
        }

        setUser({
          uid: firebaseUser.uid,
          name,
          email: firebaseUser.email || '',
          photoUrl,
          role
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Mirror lastReadTimestamps, user, currentView, and activeChatRoom in Refs to avoid resubscribing onSnapshot when they change
  const lastReadTimestampsRef = React.useRef(lastReadTimestamps);
  useEffect(() => {
    lastReadTimestampsRef.current = lastReadTimestamps;
  }, [lastReadTimestamps]);

  const userRef = React.useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const currentViewRef = React.useRef(currentView);
  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  const activeChatRoomRef = React.useRef(activeChatRoom);
  useEffect(() => {
    activeChatRoomRef.current = activeChatRoom;
  }, [activeChatRoom]);

  // 1. Mark active room as read and clear unread counts
  useEffect(() => {
    if (currentView.type === 'chat' && activeChatRoom) {
      const room = activeChatRoom;
      const now = Date.now();
      setLastReadTimestamps(prev => ({ ...prev, [room]: now }));
      const saved = safeLocalStorage.getItem('msoccer_last_read_timestamps');
      const timestamps = saved ? JSON.parse(saved) : {};
      timestamps[room] = now;
      safeLocalStorage.setItem('msoccer_last_read_timestamps', JSON.stringify(timestamps));
      setChatUnreadCounts(prev => ({ ...prev, [room]: 0 }));
    }
  }, [currentView, activeChatRoom]);

  // 2. Background Chat Messages Listener (unread tracker, statuses, and Toast alerts)
  const notifiedMessagesRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setChatUnreadCounts({});
      return;
    }

    // Subscribe to the chats where the user is a participant
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    let unsubscribes: (() => void)[] = [];

    const unsubscribeChats = onSnapshot(chatsQuery, (chatsSnapshot) => {
      // Clear previous message unsubscribes
      unsubscribes.forEach(unsub => unsub());
      unsubscribes = [];

      const activeChatIds: string[] = [];
      const chatsMap: { [id: string]: any } = {};
      chatsSnapshot.forEach((docSnap) => {
        activeChatIds.push(docSnap.id);
        chatsMap[docSnap.id] = docSnap.data();
      });

      if (activeChatIds.length === 0) {
        setChatUnreadCounts({});
        return;
      }

      // For each active chat, listen to recent messages to update unread status and trigger notifications
      activeChatIds.forEach((chatId) => {
        const msgQuery = query(
          collection(db, 'chat_messages'),
          where('chatId', '==', chatId),
          limit(20)
        );

        const unsubMsg = onSnapshot(msgQuery, (msgSnapshot) => {
          const chatMsgs: any[] = [];
          msgSnapshot.forEach((docSnap) => {
            chatMsgs.push({ id: docSnap.id, ...docSnap.data() });
          });

          const currentRoom = activeChatRoomRef.current;
          const viewingChat = currentViewRef.current.type === 'chat';

          // Update unread count for this chat
          const lastRead = lastReadTimestampsRef.current[chatId] || 0;
          let unreadCount = 0;

          chatMsgs.forEach((m) => {
            const mTime = m.createdAt?.toMillis ? m.createdAt.toMillis() : (m.createdAt ? new Date(m.createdAt).getTime() : Date.now());
            const isFromMe = m.senderId === userRef.current?.uid || m.senderName === userRef.current?.name;
            if (!isFromMe && mTime > lastRead) {
              unreadCount++;
            }
          });

          setChatUnreadCounts(prev => ({
            ...prev,
            [chatId]: (viewingChat && currentRoom === chatId) ? 0 : unreadCount
          }));

          // Process new messages for notifications/toasts
          msgSnapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const m = { id: change.doc.id, ...change.doc.data() } as any;
              const isFromMe = m.senderId === userRef.current?.uid || m.senderName === userRef.current?.name;
              if (!notifiedMessagesRef.current.has(m.id)) {
                notifiedMessagesRef.current.add(m.id);
                if (!isFromMe) {
                  const isViewingThisRoom = viewingChat && currentRoom === chatId;
                  if (!isViewingThisRoom) {
                    const chatName = chatsMap[chatId]?.name || 'Chat Privado';
                    addNotification(
                      `💬 Chat: ${chatName}`,
                      `${m.senderName}: "${m.text || 'Anexo multimédia'}"`,
                      'sistema'
                    );
                  }
                }
              }
            }
          });

          // Status updates in Firestore
          chatMsgs.forEach((m) => {
            const isFromMe = m.senderId === userRef.current?.uid || m.senderName === userRef.current?.name;
            if (!isFromMe && userRef.current?.uid) {
              const isViewingThisRoom = viewingChat && currentRoom === chatId;
              if (isViewingThisRoom) {
                if (m.status !== 'read') {
                  updateDoc(doc(db, 'chat_messages', m.id), { status: 'read' }).catch(() => {});
                }
              } else {
                if (m.status === 'sent') {
                  updateDoc(doc(db, 'chat_messages', m.id), { status: 'delivered' }).catch(() => {});
                }
              }
            }
          });

        }, (err) => console.error(`Error listening to messages of chat ${chatId}:`, err));

        unsubscribes.push(unsubMsg);
      });

    }, (error) => console.error("Firestore bg chats listener error:", error));

    return () => {
      unsubscribeChats();
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user]);

  // 3. User Presence updates
  useEffect(() => {
    if (!user) {
      setOnlineUsers([]);
      return;
    }

    const presenceRef = doc(db, 'user_presence', user.uid);

    const setOnline = async () => {
      try {
        await setDoc(presenceRef, {
          uid: user.uid,
          name: user.name,
          photoUrl: user.photoUrl || '',
          status: 'online',
          typingIn: null,
          lastActive: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error("Error setting online presence:", err);
      }
    };

    const setOffline = async () => {
      if (!auth.currentUser) return;
      try {
        await updateDoc(presenceRef, {
          status: 'offline',
          typingIn: null
        });
      } catch (err) {
        console.error("Error setting offline presence:", err);
      }
    };

    setOnline();

    const heartbeat = setInterval(() => {
      setDoc(presenceRef, {
        lastActive: serverTimestamp()
      }, { merge: true }).catch(() => {});
    }, 45000);

    const handleUnload = () => {
      setOffline();
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', handleUnload);
      setOffline();
    };
  }, [user]);

  // 4. Listen to other users' presence
  useEffect(() => {
    const q = query(collection(db, 'user_presence'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const uList: UserPresence[] = [];
      snapshot.forEach((snap) => {
        uList.push(snap.data() as UserPresence);
      });
      setOnlineUsers(uList);
    }, (error) => console.error("Presence listen error:", error));

    return () => unsubscribe();
  }, []);

  const setMyTypingState = async (room: 'geral' | 'mocambola' | 'transferencias' | null) => {
    if (!user) return;
    try {
      const presenceRef = doc(db, 'user_presence', user.uid);
      await updateDoc(presenceRef, {
        typingIn: room
      });
    } catch (err) {
      console.error("Error updating typing state:", err);
    }
  };

  const loginUser = async (email: string, password?: string, role?: 'User' | 'Admin') => {
    if (!password) {
      throw new Error('A senha é obrigatória.');
    }
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const userDocRef = doc(db, 'users', credential.user.uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      let finalRole: 'User' | 'Admin' = role || 'User';
      if (email === 'admin@msoccer.com' || email === 'mmeum9@gmail.com') {
        finalRole = 'Admin';
      }
      await setDoc(userDocRef, {
        uid: credential.user.uid,
        name: credential.user.displayName || email.split('@')[0],
        email,
        photoUrl: credential.user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
        role: finalRole,
        createdAt: new Date().toISOString()
      });
    } else if (role && role !== userSnap.data().role) {
      await setDoc(userDocRef, { role }, { merge: true });
    }
    addNotification('Login Realizado', `Bem-vindo de volta!`, 'sistema');
  };

  const registerUser = async (email: string, password: string, name: string, role?: 'User' | 'Admin') => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, {
      displayName: name,
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`
    });
    
    let finalRole: 'User' | 'Admin' = role || 'User';
    if (email === 'admin@msoccer.com' || email === 'mmeum9@gmail.com') {
      finalRole = 'Admin';
    }

    const userDocRef = doc(db, 'users', credential.user.uid);
    await setDoc(userDocRef, {
      uid: credential.user.uid,
      name,
      email,
      photoUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      role: finalRole,
      createdAt: new Date().toISOString()
    });

    addNotification('Conta Criada', `Bem-vindo, ${name}!`, 'sistema');
  };

  const loginWithGoogle = async (role?: 'User' | 'Admin') => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const userDocRef = doc(db, 'users', result.user.uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      let finalRole: 'User' | 'Admin' = role || 'User';
      if (result.user.email === 'admin@msoccer.com' || result.user.email === 'mmeum9@gmail.com') {
        finalRole = 'Admin';
      }
      await setDoc(userDocRef, {
        uid: result.user.uid,
        name: result.user.displayName || result.user.email?.split('@')[0] || 'Jogador mSoccer',
        email: result.user.email || '',
        photoUrl: result.user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(result.user.displayName || 'mSoccer')}`,
        role: finalRole,
        createdAt: new Date().toISOString()
      });
    } else if (role && role !== userSnap.data().role) {
      await setDoc(userDocRef, { role }, { merge: true });
    }
    addNotification('Login Google Realizado', `Bem-vindo, ${result.user.displayName}!`, 'sistema');
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
    addNotification('Recuperação de Senha', `E-mail de redefinição enviado para ${email}`, 'sistema');
  };

  const logoutUser = async () => {
    if (user) {
      try {
        const presenceRef = doc(db, 'user_presence', user.uid);
        await updateDoc(presenceRef, {
          status: 'offline',
          typingIn: null
        });
      } catch (err) {
        // Safe to ignore or log minimally
      }
    }
    await signOut(auth);
    setUser(null);
    addNotification('Logout', 'Sessão encerrada com sucesso.', 'sistema');
  };

  const updateUser = async (name: string, email: string, photoUrl?: string) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Avoid passing long base64 data URLs to Firebase Auth updateProfile
      const isDataUrl = photoUrl && photoUrl.startsWith('data:');
      const authPhotoUrl = isDataUrl 
        ? (currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`) 
        : (photoUrl || currentUser.photoURL);

      await updateProfile(currentUser, {
        displayName: name,
        photoURL: authPhotoUrl
      });
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        name,
        photoUrl: photoUrl || currentUser.photoURL || ''
      }, { merge: true });
    }
    
    if (user) {
      setUser({ ...user, name, email, photoUrl: photoUrl || user.photoUrl });
    }
    addNotification('Perfil Atualizado', 'Suas alterações foram salvas com sucesso.', 'sistema');
  };

  const updateUserRole = async (role: 'User' | 'Admin') => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await originalSetDoc(userDocRef, { role }, { merge: true });
      } catch (err) {
        console.warn("Firestore role sync warning:", err);
      }
    }
    
    setUser((prev) => {
      if (prev) {
        return { ...prev, role };
      }
      return {
        uid: currentUser?.uid || 'admin_session_' + Date.now(),
        name: currentUser?.displayName || 'Administrador mSoccer',
        email: currentUser?.email || 'mmeum9@gmail.com',
        photoUrl: currentUser?.photoURL || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Admin',
        role
      };
    });

    addNotification('Nível de Acesso Atualizado', `Acesso alterado para ${role === 'Admin' ? 'Administrador' : 'Usuário'}.`, 'sistema');
  };

  const addNotification = (title: string, body: string, type: 'golo' | 'sistema' | 'noticia' | 'jogo') => {
    const newNotif: AppNotification = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      title,
      body,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setToast({ title, body, id: newNotif.id, type });
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // CRUD actions
  const addMatch = async (match: Match) => {
    try {
      let nextMatches: Match[] = [];
      setMatches((prev) => {
        const exists = prev.some((m) => m.id === match.id);
        nextMatches = exists ? prev.map((m) => (m.id === match.id ? match : m)) : [...prev, match];
        return nextMatches;
      });
      await setDoc(doc(db, 'matches', match.id), match);
      await addAuditLog('Partida Agendada', `Agendou partida: ${match.homeClubName} x ${match.awayClubName} (${match.championshipName})`, 'bg-emerald-600');
      if (match.championshipId) {
        await recalculateStandingsForChampionship(match.championshipId, nextMatches.length > 0 ? nextMatches : undefined);
      }
    } catch (e) {
      console.error("Error adding match:", e);
    }
  };
  const updateMatch = async (match: Match) => {
    try {
      const existingMatch = matches.find((m) => m.id === match.id);
      const updatedMatch = { ...match };

      if (updatedMatch.status === MatchStatus.LIVE) {
        if (!existingMatch || existingMatch.status !== MatchStatus.LIVE) {
          updatedMatch.lastTickAt = Date.now();
        } else if (existingMatch.isPaused && !updatedMatch.isPaused) {
          updatedMatch.lastTickAt = Date.now();
        }
      } else if (updatedMatch.status === MatchStatus.HT) {
        if (!existingMatch || existingMatch.status !== MatchStatus.HT) {
          updatedMatch.htStartedAt = Date.now();
        }
      }

      let nextMatches: Match[] = [];
      setMatches((prev) => {
        nextMatches = prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m));
        if (!prev.some((m) => m.id === updatedMatch.id)) {
          nextMatches.push(updatedMatch);
        }
        return nextMatches;
      });

      await setDoc(doc(db, 'matches', match.id), updatedMatch);
      await addAuditLog('Partida Sincronizada', `Atualizou partida: ${match.homeClubName} ${match.score.home} x ${match.score.away} ${match.awayClubName} (${match.status})`, 'bg-blue-600');
      
      if (updatedMatch.championshipId) {
        await recalculateStandingsForChampionship(updatedMatch.championshipId, nextMatches.length > 0 ? nextMatches : undefined);
      }
    } catch (e) {
      console.error("Error updating match:", e);
    }
  };
  const deleteMatch = async (id: string) => {
    if (!id) return;
    try {
      const m = matches.find(match => match.id === id);
      const label = m ? `${m.homeClubName} x ${m.awayClubName}` : id;
      
      // Remote deletion first
      await deleteDoc(doc(db, 'matches', id));
      
      let nextMatches: Match[] = [];
      setMatches((prev) => {
        nextMatches = prev.filter((match) => match.id !== id);
        return nextMatches;
      });
      await addAuditLog('Partida Removida', `Excluiu partida: ${label}`, 'bg-rose-600');

      if (m && m.championshipId) {
        await recalculateStandingsForChampionship(m.championshipId, nextMatches.length > 0 ? nextMatches : undefined);
      }
    } catch (e) {
      console.error("Error deleting match:", e);
      addNotification('Erro de Operação', 'Não foi possível excluir a partida. Seus dados foram preservados.', 'sistema');
    }
  };

  const addClub = async (club: Club) => {
    try {
      setClubs((prev) => {
        const exists = prev.some((c) => c.id === club.id);
        if (exists) return prev.map((c) => (c.id === club.id ? club : c));
        return [...prev, club];
      });
      await setDoc(doc(db, 'clubs', club.id), club);
      await addAuditLog('Clube Cadastrado', `Cadastrou o clube: ${club.name} (${club.country})`, 'bg-emerald-600');
    } catch (e) {
      console.error("Error adding club:", e);
    }
  };
  const updateClub = async (club: Club) => {
    try {
      // 1. Update clubs in state and Firestore
      setClubs((prev) => prev.map((c) => (c.id === club.id ? club : c)));
      await setDoc(doc(db, 'clubs', club.id), club);

      // 2. Propagate new name and logo to all existing matches in state and Firestore
      const updatedMatches = matches.map((m) => {
        let matchUpdated = false;
        const newMatch = { ...m };
        if (m.homeClubId === club.id) {
          newMatch.homeClubName = club.name;
          newMatch.homeClubLogo = club.logoUrl;
          matchUpdated = true;
        }
        if (m.awayClubId === club.id) {
          newMatch.awayClubName = club.name;
          newMatch.awayClubLogo = club.logoUrl;
          matchUpdated = true;
        }
        if (matchUpdated) {
          setDoc(doc(db, 'matches', m.id), newMatch);
        }
        return newMatch;
      });
      setMatches(updatedMatches);

      // 3. Propagate to players in state and Firestore
      const updatedPlayers = players.map((p) => {
        if (p.clubId === club.id) {
          const newP = { ...p, clubName: club.name };
          setDoc(doc(db, 'players', p.id), newP);
          return newP;
        }
        return p;
      });
      setPlayers(updatedPlayers);

      // 4. Propagate to news in state and Firestore
      const updatedNews = news.map((n) => {
        if (n.clubId === club.id) {
          const newN = { ...n, clubName: club.name };
          setDoc(doc(db, 'news', n.id), newN);
          return newN;
        }
        return n;
      });
      setNews(updatedNews);

      // 5. Propagate to championship standings in state and Firestore
      const updatedChampionships = championships.map((champ) => {
        let champChanged = false;
        const newStandings = champ.standings.map((row) => {
          const isThisClub = row.clubId
            ? row.clubId.trim().toLowerCase() === club.id.trim().toLowerCase()
            : row.clubName.trim().toLowerCase() === club.name.trim().toLowerCase();

          if (!isThisClub) return row;
          champChanged = true;

          const targetWins = club.stats?.wins ?? row.won;
          const targetDraws = club.stats?.draws ?? row.drawn;
          const targetLosses = club.stats?.losses ?? row.lost;
          const targetGP = club.stats?.goalsScored ?? row.goalsFor;
          const targetGC = club.stats?.goalsConceded ?? row.goalsAgainst;

          const finishedMatches = updatedMatches.filter(
            (m) => m.championshipId === champ.id && m.status === MatchStatus.FINISHED
          );

          let fWins = 0, fDraws = 0, fLosses = 0, fGP = 0, fGC = 0;
          finishedMatches.forEach((m) => {
            if (m.homeClubId === club.id || m.homeClubId === row.clubId) {
              fGP += m.score.home;
              fGC += m.score.away;
              if (m.score.home > m.score.away) fWins += 1;
              else if (m.score.home < m.score.away) fLosses += 1;
              else fDraws += 1;
            } else if (m.awayClubId === club.id || m.awayClubId === row.clubId) {
              fGP += m.score.away;
              fGC += m.score.home;
              if (m.score.away > m.score.home) fWins += 1;
              else if (m.score.away < m.score.home) fLosses += 1;
              else fDraws += 1;
            }
          });

          const bWins = Math.max(0, targetWins - fWins);
          const bDraws = Math.max(0, targetDraws - fDraws);
          const bLosses = Math.max(0, targetLosses - fLosses);
          const bGP = Math.max(0, targetGP - fGP);
          const bGC = Math.max(0, targetGC - fGC);
          const bPlayed = bWins + bDraws + bLosses;
          const bPts = bWins * 3 + bDraws;

          const totalPlayed = targetWins + targetDraws + targetLosses;
          const totalPts = Math.max(0, targetWins * 3 + targetDraws - (row.pointsDeduction || 0));

          return {
            ...row,
            clubId: club.id,
            clubName: club.name,
            logoUrl: club.logoUrl,
            played: totalPlayed,
            won: targetWins,
            drawn: targetDraws,
            lost: targetLosses,
            goalsFor: targetGP,
            goalsAgainst: targetGC,
            goalDifference: targetGP - targetGC,
            points: totalPts,
            baseStats: {
              played: bPlayed,
              won: bWins,
              drawn: bDraws,
              lost: bLosses,
              goalsFor: bGP,
              goalsAgainst: bGC,
              points: bPts,
              pointsDeduction: row.pointsDeduction || 0,
              deductionReason: row.deductionReason || ''
            }
          };
        });

        if (!champChanged) return champ;

        newStandings.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
          return b.won - a.won;
        });

        const updatedChamp = {
          ...champ,
          standings: newStandings
        };

        setDoc(doc(db, 'championships', champ.id), updatedChamp);
        return updatedChamp;
      });

      setChampionships(updatedChampionships);

      await addAuditLog('Clube Atualizado', `Atualizou informações do clube: ${club.name}`, 'bg-blue-600');
    } catch (e) {
      console.error("Error updating club:", e);
    }
  };
  const deleteClub = async (id: string) => {
    if (!id) return;
    try {
      const c = clubs.find(club => club.id === id);
      const label = c ? c.name : id;

      await deleteDoc(doc(db, 'clubs', id));
      setClubs((prev) => prev.filter((club) => club.id !== id));

      // Safely unlink players instead of permanently deleting them
      const associatedPlayers = players.filter(p => p.clubId === id);
      for (const p of associatedPlayers) {
        await setDoc(doc(db, 'players', p.id), { ...p, clubId: '', clubName: 'Sem Clube' }, { merge: true });
      }

      await addAuditLog('Clube Removido', `Excluiu o clube: ${label}. Os atletas vinculados foram mantidos e desvinculados com segurança.`, 'bg-rose-600');
    } catch (e) {
      console.error("Error deleting club:", e);
      addNotification('Erro de Operação', 'Não foi possível excluir o clube. Informações preservadas.', 'sistema');
    }
  };

  const addPlayer = async (player: Player) => {
    try {
      setPlayers((prev) => [...prev, player]);
      await setDoc(doc(db, 'players', player.id), player);
      await addAuditLog('Jogador Cadastrado', `Cadastrou o atleta: ${player.name} (${player.clubName})`, 'bg-emerald-600');
    } catch (e) {
      console.error("Error adding player:", e);
    }
  };
  const updatePlayer = async (player: Player) => {
    try {
      setPlayers((prev) => prev.map((p) => (p.id === player.id ? player : p)));
      await setDoc(doc(db, 'players', player.id), player);
      await addAuditLog('Jogador Atualizado', `Atualizou a ficha do atleta: ${player.name} (${player.clubName})`, 'bg-blue-600');
    } catch (e) {
      console.error("Error updating player:", e);
    }
  };
  const deletePlayer = async (id: string) => {
    if (!id) return;
    try {
      const p = players.find(player => player.id === id);
      const label = p ? `${p.name} (${p.clubName})` : id;

      await deleteDoc(doc(db, 'players', id));
      setPlayers((prev) => prev.filter((player) => player.id !== id));
      await addAuditLog('Jogador Removido', `Removeu o atleta do sistema: ${label}`, 'bg-rose-600');
    } catch (e) {
      console.error("Error deleting player:", e);
      addNotification('Erro de Operação', 'Não foi possível excluir o atleta. Informações mantidas.', 'sistema');
    }
  };

  const addChampionship = async (championship: Championship) => {
    try {
      setChampionships((prev) => [...prev, championship]);
      await setDoc(doc(db, 'championships', championship.id), championship);
      await addAuditLog('Campeonato Criado', `Criou o campeonato: ${championship.name} (${championship.season})`, 'bg-emerald-600');
    } catch (e) {
      console.error("Error adding championship:", e);
    }
  };
  const updateChampionship = async (championship: Championship) => {
    try {
      setChampionships((prev) => prev.map((c) => (c.id === championship.id ? championship : c)));
      await setDoc(doc(db, 'championships', championship.id), championship);
      await addAuditLog('Campeonato Atualizado', `Atualizou o campeonato: ${championship.name}`, 'bg-blue-600');
    } catch (e) {
      console.error("Error updating championship:", e);
    }
  };
  const recalculateStandingsForChampionship = async (champId: string, currentMatches?: Match[], currentClubs?: Club[]) => {
    try {
      const champ = championships.find(c => c.id === champId);
      if (!champ) return;

      const matchesToUse = currentMatches || matches;
      const clubsToUse = currentClubs || clubs;

      const isFinishedMatch = (status: any) =>
        status === MatchStatus.FINISHED || status === 'FINISHED' || status === 'Encerrado';

      // Filter finished matches for this championship
      const finishedMatches = matchesToUse.filter(
        (m) => m.championshipId === champ.id && isFinishedMatch(m.status)
      );

      // Determine initial rows. If standings table is currently empty,
      // reconstruct rows from clubs participating in this championship's matches or all available clubs.
      let sourceRows = champ.standings;
      if (!sourceRows || sourceRows.length === 0) {
        const champMatches = matchesToUse.filter((m) => m.championshipId === champ.id);
        const clubIdsInChamp = new Set<string>();
        champMatches.forEach((m) => {
          if (m.homeClubId) clubIdsInChamp.add(m.homeClubId);
          if (m.awayClubId) clubIdsInChamp.add(m.awayClubId);
        });

        let targetClubs: Club[] = [];
        if (clubIdsInChamp.size > 0) {
          targetClubs = clubsToUse.filter((c) => clubIdsInChamp.has(c.id));
        } else {
          targetClubs = clubsToUse;
        }

        sourceRows = targetClubs.map((club) => ({
          clubId: club.id,
          clubName: club.name,
          logoUrl: club.logoUrl,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        }));
      }

      // Initialize standings starting from baseStats (if set) or 0
      const recalculated = sourceRows.map((row) => {
        const club = findMatchingClub(clubsToUse, row.clubId, row.clubName);
        const base = row.baseStats || {
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
          pointsDeduction: row.pointsDeduction || 0,
          deductionReason: row.deductionReason || ''
        };

        const pointsDeduction = row.pointsDeduction ?? base.pointsDeduction ?? 0;
        const deductionReason = row.deductionReason ?? base.deductionReason ?? '';

        return {
          ...row,
          clubId: club ? club.id : row.clubId,
          clubName: club?.name || row.clubName,
          logoUrl: club?.logoUrl || row.logoUrl,
          played: base.played || 0,
          won: base.won || 0,
          drawn: base.drawn || 0,
          lost: base.lost || 0,
          goalsFor: base.goalsFor || 0,
          goalsAgainst: base.goalsAgainst || 0,
          goalDifference: (base.goalsFor || 0) - (base.goalsAgainst || 0),
          points: base.points ?? ((base.won || 0) * 3 + (base.drawn || 0)),
          pointsDeduction,
          deductionReason,
          baseStats: {
            played: base.played || 0,
            won: base.won || 0,
            drawn: base.drawn || 0,
            lost: base.lost || 0,
            goalsFor: base.goalsFor || 0,
            goalsAgainst: base.goalsAgainst || 0,
            points: base.points ?? ((base.won || 0) * 3 + (base.drawn || 0)),
            pointsDeduction,
            deductionReason
          }
        };
      });

      // Accumulate finished matches (each finished match processed exactly once)
      finishedMatches.forEach((match) => {
        const homeIdx = recalculated.findIndex((s) => isClubInStandingRow(s, match.homeClubId, match.homeClubName, clubsToUse));
        const awayIdx = recalculated.findIndex((s) => isClubInStandingRow(s, match.awayClubId, match.awayClubName, clubsToUse));

        if (homeIdx !== -1) {
          const homeRow = recalculated[homeIdx];
          homeRow.played += 1;
          homeRow.goalsFor += match.score.home;
          homeRow.goalsAgainst += match.score.away;
          if (match.score.home > match.score.away) {
            homeRow.won += 1;
            homeRow.points += 3;
          } else if (match.score.home < match.score.away) {
            homeRow.lost += 1;
          } else {
            homeRow.drawn += 1;
            homeRow.points += 1;
          }
        }

        if (awayIdx !== -1) {
          const awayRow = recalculated[awayIdx];
          awayRow.played += 1;
          awayRow.goalsFor += match.score.away;
          awayRow.goalsAgainst += match.score.home;
          if (match.score.away > match.score.home) {
            awayRow.won += 1;
            awayRow.points += 3;
          } else if (match.score.away < match.score.home) {
            awayRow.lost += 1;
          } else {
            awayRow.drawn += 1;
            awayRow.points += 1;
          }
        }
      });

      // Calculate goalDifference, efficiency (aproveitamento), recentForm (últimos 5 jogos) and apply pointsDeduction
      recalculated.forEach((row) => {
        row.goalDifference = row.goalsFor - row.goalsAgainst;

        if (row.pointsDeduction && row.pointsDeduction > 0) {
          row.points = Math.max(0, row.points - row.pointsDeduction);
        }

        // Efficiency (aproveitamento %)
        row.efficiency = row.played > 0 ? Math.round((row.points / (row.played * 3)) * 100) : 0;

        // Recent form (últimos 5 jogos) for this club in this championship
        const clubMatches = finishedMatches
          .filter((m) => isClubInStandingRow(row, m.homeClubId, m.homeClubName, clubsToUse) || isClubInStandingRow(row, m.awayClubId, m.awayClubName, clubsToUse))
          .sort((a, b) => {
            const rA = Number(a.round) || 0;
            const rB = Number(b.round) || 0;
            if (rA !== rB) return rA - rB;
            return (a.date || '').localeCompare(b.date || '');
          });

        const last5 = clubMatches.slice(-5);
        const formSymbols = last5.map((m) => {
          const isHome = isClubInStandingRow(row, m.homeClubId, m.homeClubName, clubsToUse);
          const homeScore = m.score.home;
          const awayScore = m.score.away;
          if (homeScore === awayScore) return 'E';
          if (isHome) return homeScore > awayScore ? 'V' : 'D';
          return awayScore > homeScore ? 'V' : 'D';
        });
        while (formSymbols.length < 5) {
          formSymbols.push('?' as any);
        }
        row.recentForm = formSymbols;
      });

      // Sort standings: Points DESC -> Wins DESC -> Goal Difference DESC -> Goals For DESC -> Club Name ASC
      recalculated.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.won !== a.won) return b.won - a.won;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.clubName.localeCompare(b.clubName);
      });

      // Aggregate scorer and assist maps from match events
      const scorerMap: { [playerName: string]: { playerId: string; playerName: string; clubName: string; goals: number } } = {};
      const assistMap: { [playerName: string]: { playerId: string; playerName: string; clubName: string; assists: number } } = {};

      finishedMatches.forEach((match) => {
        (match.events || []).forEach((ev) => {
          if (ev.type === 'Goal') {
            // Scorer
            if (ev.player1) {
              const name = ev.player1.trim();
              const clubName = ev.team === 'home' ? match.homeClubName : match.awayClubName;
              if (!scorerMap[name]) {
                scorerMap[name] = {
                  playerId: name.toLowerCase().replace(/\s+/g, '_'),
                  playerName: name,
                  clubName: clubName,
                  goals: 0
                };
              }
              scorerMap[name].goals += 1;
            }

            // Assist
            if (ev.player2) {
              const name = ev.player2.trim();
              const clubName = ev.team === 'home' ? match.homeClubName : match.awayClubName;
              if (!assistMap[name]) {
                assistMap[name] = {
                  playerId: name.toLowerCase().replace(/\s+/g, '_'),
                  playerName: name,
                  clubName: clubName,
                  assists: 0
                };
              }
              assistMap[name].assists += 1;
            }
          }
        });
      });

      const topScorers = Object.values(scorerMap)
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 15);

      const topAssists = Object.values(assistMap)
        .sort((a, b) => b.assists - a.assists)
        .slice(0, 15);

      const updatedChamp: Championship = {
        ...champ,
        standings: recalculated,
        topScorers,
        topAssists
      };

      await updateChampionship(updatedChamp);
    } catch (err) {
      console.error("Error recalculating standings for champ:", champId, err);
    }
  };
  const deleteChampionship = async (id: string) => {
    if (!id) return;
    try {
      const champ = championships.find(c => c.id === id);
      const label = champ ? champ.name : id;
      
      await deleteDoc(doc(db, 'championships', id));
      setChampionships((prev) => prev.filter((c) => c.id !== id));
      await addAuditLog('Campeonato Removido', `Removeu o campeonato: ${label}`, 'bg-rose-600');
    } catch (e) {
      console.error("Error deleting championship:", e);
      addNotification('Erro de Operação', 'Não foi possível remover o campeonato. Dados mantidos.', 'sistema');
    }
  };
  const clearAllChampionships = async () => {
    if (user?.role !== 'Admin') {
      addNotification('Erro de Permissão', 'Apenas administradores podem executar esta limpeza.', 'sistema');
      return;
    }
    try {
      // Create automatic emergency backup before clearing
      await createBackup(`Backup Automático pré-limpeza de campeonatos - ${new Date().toLocaleString('pt-BR')}`);

      for (const c of championships) {
        await deleteDoc(doc(db, 'championships', c.id));
      }
      for (const m of matches) {
        await deleteDoc(doc(db, 'matches', m.id));
      }
      setChampionships([]);
      setMatches([]);
      setFavorites((prev) => ({ ...prev, championships: [], matches: [] }));
      addNotification('Campeonatos Removidos', 'Todos os campeonatos e partidas foram excluídos. Um backup automático foi gerado.', 'sistema');
      await addAuditLog('Todos Campeonatos Removidos', 'Removeu todos os campeonatos e partidas do sistema com backup prévio.', 'bg-red-700');
    } catch (e) {
      console.error("Error clearing championships:", e);
      addNotification('Erro de Limpeza', 'Falha ao limpar campeonatos. Dados preservados.', 'sistema');
    }
  };

  const addNews = async (newsArt: NewsArticle) => {
    try {
      await setDoc(doc(db, 'news', newsArt.id), newsArt);
      await addAuditLog('Notícia Publicada', `Publicou nova notícia: "${newsArt.title}"`, 'bg-emerald-600');
    } catch (e) {
      console.error("Error adding news:", e);
    }
  };
  const updateNews = async (newsArt: NewsArticle) => {
    try {
      await setDoc(doc(db, 'news', newsArt.id), newsArt);
      await addAuditLog('Notícia Atualizada', `Editou a notícia: "${newsArt.title}"`, 'bg-blue-600');
    } catch (e) {
      console.error("Error updating news:", e);
    }
  };
  const deleteNews = async (id: string) => {
    if (!id) return;
    try {
      const n = news.find(article => article.id === id);
      const label = n ? n.title : id;

      await deleteDoc(doc(db, 'news', id));
      setNews((prev) => prev.filter((item) => item.id !== id));
      await addAuditLog('Notícia Removida', `Excluiu a notícia: "${label}"`, 'bg-rose-600');
    } catch (e) {
      console.error("Error deleting news:", e);
      addNotification('Erro de Operação', 'Não foi possível excluir a notícia. Informações mantidas.', 'sistema');
    }
  };
  const clearAllNews = async () => {
    if (user?.role !== 'Admin') {
      addNotification('Erro de Permissão', 'Apenas administradores podem executar esta limpeza.', 'sistema');
      return;
    }
    try {
      await createBackup(`Backup Automático pré-limpeza de notícias - ${new Date().toLocaleString('pt-BR')}`);

      for (const n of news) {
        await deleteDoc(doc(db, 'news', n.id));
      }
      setNews([]);
      addNotification('Notícias Removidas', 'Todas as notícias do sistema foram excluídas. Backup automático salvo.', 'sistema');
      await addAuditLog('Todas Notícias Removidas', 'Removeu todas as notícias cadastradas do sistema.', 'bg-red-700');
    } catch (e) {
      console.error("Error clearing news:", e);
      addNotification('Erro de Limpeza', 'Ocorreu um erro. Notícias preservadas.', 'sistema');
    }
  };

  const clearAllDatabase = async () => {
    if (!user || user.role !== 'Admin') {
      console.warn("Unauthorized attempt to clear all database!");
      addNotification('Erro de Permissão', 'Apenas administradores autorizados podem limpar a base de dados.', 'sistema');
      throw new Error('Acesso negado: Apenas administradores autorizados podem realizar esta operação.');
    }
    try {
      // 1. ALWAYS create an emergency backup before any database wipe
      await createBackup(`Backup Automático de Segurança pré-Redefinição - ${new Date().toLocaleString('pt-BR')}`);

      // 2. Set dbConfig to cleared: true so that standard auto-seeding is skipped
      await setDoc(doc(db, 'system', 'config'), { initialized: true, cleared: true }, { merge: true });

      // 3. Clear collections safely
      const collectionsToClear = ['matches', 'championships', 'players', 'clubs', 'news', 'chat_messages'];
      for (const colName of collectionsToClear) {
        const snaps = await getDocs(collection(db, colName));
        for (const docSnap of snaps.docs) {
          await deleteDoc(docSnap.ref);
        }
      }

      // 4. Reset local states
      setClubs([]);
      setPlayers([]);
      setChampionships([]);
      setMatches([]);
      setNews([]);
      setFavorites({ clubs: [], players: [], championships: [], matches: [] });

      addNotification('Sistema Reiniciado', 'Todos os dados do sistema foram zerados com sucesso. Um backup automático foi salvo antes da operação.', 'sistema');
    } catch (e) {
      console.error("Error clearing database:", e);
      addNotification('Erro ao Reiniciar', 'A operação de redefinição falhou e os dados foram preservados.', 'sistema');
    }
  };

  const addAuditLog = async (title: string, desc: string, badgeColor?: string) => {
    try {
      const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const newLog: AuditLog = {
        id: logId,
        title,
        desc,
        timestamp: new Date().toISOString(),
        adminEmail: user?.email || 'Sistema',
        badgeColor: badgeColor || 'bg-slate-700'
      };
      await setDoc(doc(db, 'audit_logs', logId), newLog, { merge: true });
    } catch (e) {
      console.error("Error writing audit log:", e);
    }
  };

  const createBackup = async (description: string) => {
    if (!user || user.role !== 'Admin') {
      addNotification('Erro de Permissão', 'Apenas administradores podem criar backups do sistema.', 'sistema');
      return;
    }
    try {
      const backupId = 'backup_' + Date.now();
      const newBackup: SystemBackup = {
        id: backupId,
        description: description || 'Backup manual do sistema',
        createdAt: new Date().toISOString(),
        createdTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        adminEmail: user.email,
        data: {
          clubs,
          players,
          championships,
          matches,
          news
        }
      };
      await setDoc(doc(db, 'backups', backupId), newBackup, { merge: true });
      await addAuditLog('Backup Criado', `O administrador criou um backup do sistema: "${description}"`, 'bg-emerald-600');
      addNotification('Backup Concluído', `Backup de segurança "${description}" criado com sucesso.`, 'sistema');
    } catch (e) {
      console.error("Error creating backup:", e);
      addNotification('Erro de Backup', 'Ocorreu um erro ao gerar o backup de dados.', 'sistema');
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!user || user.role !== 'Admin') {
      addNotification('Erro de Permissão', 'Apenas administradores podem restaurar backups do sistema.', 'sistema');
      return;
    }
    try {
      const backupDoc = await getDoc(doc(db, 'backups', backupId));
      if (!backupDoc.exists()) {
        addNotification('Erro de Restauração', 'Backup não encontrado.', 'sistema');
        return;
      }
      
      const backup = backupDoc.data() as SystemBackup;
      
      // Auto-backup current state before restoring old state
      await createBackup(`Backup Automático Pré-Restauração - ${new Date().toLocaleString('pt-BR')}`);

      // 1. Mark as cleared first so seeding doesn't conflict
      await setDoc(doc(db, 'system', 'config'), { initialized: true, cleared: true }, { merge: true });

      // 2. Clear current collections
      const collections = ['clubs', 'players', 'championships', 'matches', 'news'];
      for (const colName of collections) {
        const snap = await getDocs(collection(db, colName));
        for (const docSnap of snap.docs) {
          await deleteDoc(docSnap.ref);
        }
      }

      // 3. Restore data from backup
      for (const club of backup.data.clubs) {
        await setDoc(doc(db, 'clubs', club.id), club, { merge: true });
      }
      for (const player of backup.data.players) {
        await setDoc(doc(db, 'players', player.id), player, { merge: true });
      }
      for (const champ of backup.data.championships) {
        await setDoc(doc(db, 'championships', champ.id), champ, { merge: true });
      }
      for (const m of backup.data.matches) {
        await setDoc(doc(db, 'matches', m.id), m);
      }
      for (const n of backup.data.news) {
        await setDoc(doc(db, 'news', n.id), n);
      }

      await addAuditLog('Backup Restaurado', `O administrador restaurou o backup: "${backup.description}"`, 'bg-blue-600');
      addNotification('Restauração Concluída', `O sistema foi restaurado com sucesso para a versão de ${new Date(backup.createdAt).toLocaleString('pt-BR')}.`, 'sistema');
    } catch (e) {
      console.error("Error restoring backup:", e);
      addNotification('Erro de Restauração', 'Ocorreu um erro ao restaurar os dados do backup.', 'sistema');
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!user || user.role !== 'Admin') {
      addNotification('Erro de Permissão', 'Apenas administradores podem deletar backups.', 'sistema');
      return;
    }
    try {
      await deleteDoc(doc(db, 'backups', backupId));
      await addAuditLog('Backup Excluído', `O administrador removeu um ponto de restauração antigo.`, 'bg-red-600');
      addNotification('Backup Excluído', 'Ponto de restauração removido com sucesso.', 'sistema');
    } catch (e) {
      console.error("Error deleting backup:", e);
      addNotification('Erro ao Excluir', 'Ocorreu um erro ao excluir o backup.', 'sistema');
    }
  };

  const recalculateAllPlayerStats = async () => {
    try {
      // 1. Fetch fresh data directly from Firestore collections without relying on cached state
      const [playersSnapshot, clubsSnapshot, matchesSnapshot, champsSnapshot] = await Promise.all([
        getDocs(collection(db, 'players')),
        getDocs(collection(db, 'clubs')),
        getDocs(collection(db, 'matches')),
        getDocs(collection(db, 'championships'))
      ]);

      const rawPlayers = playersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Player));
      const rawClubs = clubsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Club));
      const rawMatches = matchesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Match));
      const rawChampionships = champsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Championship));

      const isFinishedMatch = (m: Match) =>
        m.status === MatchStatus.FINISHED ||
        (m.status as any) === 'FINISHED' ||
        (m.status as any) === 'Encerrado';

      const finishedMatches = rawMatches.filter(isFinishedMatch);

      // 2. Recalculate Club Stats (wins, draws, losses, goalsScored, goalsConceded)
      const updatedClubsList: Club[] = rawClubs.map((club) => {
        let wins = 0, draws = 0, losses = 0, goalsScored = 0, goalsConceded = 0;

        finishedMatches.forEach((m) => {
          const isHome = isClubInStandingRow({ clubId: club.id, clubName: club.name }, m.homeClubId, m.homeClubName, rawClubs);
          const isAway = isClubInStandingRow({ clubId: club.id, clubName: club.name }, m.awayClubId, m.awayClubName, rawClubs);

          if (isHome) {
            goalsScored += m.score?.home ?? 0;
            goalsConceded += m.score?.away ?? 0;
            if ((m.score?.home ?? 0) > (m.score?.away ?? 0)) wins += 1;
            else if ((m.score?.home ?? 0) < (m.score?.away ?? 0)) losses += 1;
            else draws += 1;
          } else if (isAway) {
            goalsScored += m.score?.away ?? 0;
            goalsConceded += m.score?.home ?? 0;
            if ((m.score?.away ?? 0) > (m.score?.home ?? 0)) wins += 1;
            else if ((m.score?.away ?? 0) < (m.score?.home ?? 0)) losses += 1;
            else draws += 1;
          }
        });

        return {
          ...club,
          stats: {
            wins,
            draws,
            losses,
            goalsScored,
            goalsConceded
          }
        };
      });

      // 3. Recalculate Player Stats completely from all finished matches
      const playerAccumulators = new Map<string, {
        matches: number;
        goals: number;
        assists: number;
        yellowCards: number;
        redCards: number;
        minutesPlayed: number;
      }>();

      rawPlayers.forEach((p) => {
        playerAccumulators.set(p.id, {
          matches: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          minutesPlayed: 0
        });
      });

      finishedMatches.forEach((match) => {
        const rawNames = new Set<string>();
        (match.lineups?.home?.starting || []).forEach(lp => { if (lp.name) rawNames.add(lp.name); });
        (match.lineups?.away?.starting || []).forEach(lp => { if (lp.name) rawNames.add(lp.name); });
        (match.lineups?.home?.bench || []).forEach(lp => { if (lp.name) rawNames.add(lp.name); });
        (match.lineups?.away?.bench || []).forEach(lp => { if (lp.name) rawNames.add(lp.name); });
        (match.events || []).forEach(ev => {
          if (ev.player1) rawNames.add(ev.player1);
          if (ev.player2) rawNames.add(ev.player2);
        });

        const involvedPlayersMap = new Map<string, Player>();
        rawNames.forEach(rawName => {
          const p = findBestPlayerMatchHelper(rawPlayers, rawName);
          if (p) {
            involvedPlayersMap.set(p.id, p);
          }
        });

        for (const [playerId] of involvedPlayersMap.entries()) {
          const isHomeStarter = (match.lineups?.home?.starting || []).some(lp => lp.name && findBestPlayerMatchHelper(rawPlayers, lp.name)?.id === playerId);
          const isAwayStarter = (match.lineups?.away?.starting || []).some(lp => lp.name && findBestPlayerMatchHelper(rawPlayers, lp.name)?.id === playerId);
          const isStarter = isHomeStarter || isAwayStarter;

          const subInEvent = (match.events || []).find(e =>
            e.type === 'Substitution' && e.player2 && findBestPlayerMatchHelper(rawPlayers, e.player2)?.id === playerId
          );

          const hasEvents = (match.events || []).some(e =>
            (e.player1 && findBestPlayerMatchHelper(rawPlayers, e.player1)?.id === playerId) ||
            (e.player2 && findBestPlayerMatchHelper(rawPlayers, e.player2)?.id === playerId)
          );

          const participated = isStarter || !!subInEvent || hasEvents;
          if (!participated) continue;

          let enteredMinute = 0;
          if (isStarter) {
            enteredMinute = 0;
          } else if (subInEvent) {
            enteredMinute = subInEvent.minute ?? 45;
          }

          let leftMinute = match.minute > 0 ? match.minute : 90;

          const subOffEvent = (match.events || []).find(e =>
            e.type === 'Substitution' && e.player1 && findBestPlayerMatchHelper(rawPlayers, e.player1)?.id === playerId
          );
          if (subOffEvent) {
            leftMinute = Math.min(leftMinute, subOffEvent.minute ?? 45);
          }

          const redCardEvent = (match.events || []).find(e =>
            e.type === 'RedCard' && e.player1 && findBestPlayerMatchHelper(rawPlayers, e.player1)?.id === playerId
          );
          if (redCardEvent) {
            leftMinute = Math.min(leftMinute, redCardEvent.minute ?? leftMinute);
          }

          const minutesPlayed = Math.max(0, leftMinute - enteredMinute);

          const goals = (match.events || []).filter(e =>
            e.type === 'Goal' && e.player1 && findBestPlayerMatchHelper(rawPlayers, e.player1)?.id === playerId
          ).length;

          const assists = (match.events || []).filter(e =>
            e.type === 'Goal' && e.player2 && findBestPlayerMatchHelper(rawPlayers, e.player2)?.id === playerId
          ).length;

          const yellowCards = (match.events || []).filter(e =>
            e.type === 'YellowCard' && e.player1 && findBestPlayerMatchHelper(rawPlayers, e.player1)?.id === playerId
          ).length;

          const redCards = (match.events || []).filter(e =>
            e.type === 'RedCard' && e.player1 && findBestPlayerMatchHelper(rawPlayers, e.player1)?.id === playerId
          ).length;

          const acc = playerAccumulators.get(playerId) || {
            matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0
          };

          acc.matches += 1;
          acc.goals += goals;
          acc.assists += assists;
          acc.yellowCards += yellowCards;
          acc.redCards += redCards;
          acc.minutesPlayed += minutesPlayed;

          playerAccumulators.set(playerId, acc);
        }
      });

      const updatedPlayersList: Player[] = rawPlayers.map((p) => {
        const acc = playerAccumulators.get(p.id) || {
          matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0
        };

        const currentSeason = '2026';
        const cleanedHistory = (p.history || []).filter(h => h.season !== currentSeason);

        if (acc.matches > 0 || acc.goals > 0) {
          cleanedHistory.push({
            season: currentSeason,
            club: p.clubName || 'Sem Clube',
            matches: acc.matches,
            goals: acc.goals
          });
        }

        return {
          ...p,
          stats: {
            matches: acc.matches,
            goals: acc.goals,
            assists: acc.assists,
            yellowCards: acc.yellowCards,
            redCards: acc.redCards,
            minutesPlayed: acc.minutesPlayed
          },
          history: cleanedHistory
        };
      });

      // 4. Recalculate Standings & Top Scorers / Top Assists for all Championships
      const updatedChampionshipsList: Championship[] = [];

      for (const champ of rawChampionships) {
        const champMatches = finishedMatches.filter((m) => m.championshipId === champ.id);

        const resetStandings = champ.standings.map((row) => {
          const club = findMatchingClub(updatedClubsList, row.clubId, row.clubName);

          let fWins = 0, fDraws = 0, fLosses = 0, fGP = 0, fGC = 0;
          champMatches.forEach((m) => {
            const isHome = isClubInStandingRow(row, m.homeClubId, m.homeClubName, updatedClubsList);
            const isAway = isClubInStandingRow(row, m.awayClubId, m.awayClubName, updatedClubsList);
            if (isHome) {
              fGP += m.score?.home ?? 0;
              fGC += m.score?.away ?? 0;
              if ((m.score?.home ?? 0) > (m.score?.away ?? 0)) fWins += 1;
              else if ((m.score?.home ?? 0) < (m.score?.away ?? 0)) fLosses += 1;
              else fDraws += 1;
            } else if (isAway) {
              fGP += m.score?.away ?? 0;
              fGC += m.score?.home ?? 0;
              if ((m.score?.away ?? 0) > (m.score?.home ?? 0)) fWins += 1;
              else if ((m.score?.away ?? 0) < (m.score?.home ?? 0)) fLosses += 1;
              else fDraws += 1;
            }
          });

          const targetWins = row.won ?? club?.stats?.wins ?? 0;
          const targetDraws = row.drawn ?? club?.stats?.draws ?? 0;
          const targetLosses = row.lost ?? club?.stats?.losses ?? 0;
          const targetGP = row.goalsFor ?? club?.stats?.goalsScored ?? 0;
          const targetGC = row.goalsAgainst ?? club?.stats?.goalsConceded ?? 0;

          let baseWins = 0, baseDraws = 0, baseLosses = 0, baseGoalsFor = 0, baseGoalsAgainst = 0;

          if (row.baseStats) {
            if (
              row.baseStats.won + fWins === targetWins &&
              row.baseStats.drawn + fDraws === targetDraws &&
              row.baseStats.lost + fLosses === targetLosses &&
              row.baseStats.goalsFor + fGP === targetGP &&
              row.baseStats.goalsAgainst + fGC === targetGC
            ) {
              baseWins = row.baseStats.won;
              baseDraws = row.baseStats.drawn;
              baseLosses = row.baseStats.lost;
              baseGoalsFor = row.baseStats.goalsFor;
              baseGoalsAgainst = row.baseStats.goalsAgainst;
            } else {
              baseWins = Math.max(0, targetWins - fWins);
              baseDraws = Math.max(0, targetDraws - fDraws);
              baseLosses = Math.max(0, targetLosses - fLosses);
              baseGoalsFor = Math.max(0, targetGP - fGP);
              baseGoalsAgainst = Math.max(0, targetGC - fGC);
            }
          } else {
            baseWins = Math.max(0, targetWins - fWins);
            baseDraws = Math.max(0, targetDraws - fDraws);
            baseLosses = Math.max(0, targetLosses - fLosses);
            baseGoalsFor = Math.max(0, targetGP - fGP);
            baseGoalsAgainst = Math.max(0, targetGC - fGC);
          }

          const basePlayed = baseWins + baseDraws + baseLosses;
          const basePoints = baseWins * 3 + baseDraws;
          const pointsDeduction = row.pointsDeduction ?? row.baseStats?.pointsDeduction ?? 0;
          const deductionReason = row.deductionReason ?? row.baseStats?.deductionReason ?? '';

          return {
            ...row,
            clubId: club ? club.id : row.clubId,
            clubName: club?.name || row.clubName,
            logoUrl: club?.logoUrl || row.logoUrl,
            played: basePlayed,
            won: baseWins,
            drawn: baseDraws,
            lost: baseLosses,
            goalsFor: baseGoalsFor,
            goalsAgainst: baseGoalsAgainst,
            goalDifference: baseGoalsFor - baseGoalsAgainst,
            points: basePoints,
            pointsDeduction,
            deductionReason,
            baseStats: {
              played: basePlayed,
              won: baseWins,
              drawn: baseDraws,
              lost: baseLosses,
              goalsFor: baseGoalsFor,
              goalsAgainst: baseGoalsAgainst,
              points: basePoints,
              pointsDeduction,
              deductionReason
            }
          };
        });

        // Aggregate standings from finished matches
        champMatches.forEach((match) => {
          const homeIdx = resetStandings.findIndex((s) => isClubInStandingRow(s, match.homeClubId, match.homeClubName, updatedClubsList));
          const awayIdx = resetStandings.findIndex((s) => isClubInStandingRow(s, match.awayClubId, match.awayClubName, updatedClubsList));

          if (homeIdx !== -1 && awayIdx !== -1) {
            const homeRow = resetStandings[homeIdx];
            const awayRow = resetStandings[awayIdx];

            homeRow.played += 1;
            awayRow.played += 1;

            homeRow.goalsFor += match.score?.home ?? 0;
            homeRow.goalsAgainst += match.score?.away ?? 0;
            awayRow.goalsFor += match.score?.away ?? 0;
            awayRow.goalsAgainst += match.score?.home ?? 0;

            if ((match.score?.home ?? 0) > (match.score?.away ?? 0)) {
              homeRow.won += 1;
              homeRow.points += 3;
              awayRow.lost += 1;
            } else if ((match.score?.home ?? 0) < (match.score?.away ?? 0)) {
              awayRow.won += 1;
              awayRow.points += 3;
              homeRow.lost += 1;
            } else {
              homeRow.drawn += 1;
              homeRow.points += 1;
              awayRow.drawn += 1;
              awayRow.points += 1;
            }
          }
        });

        resetStandings.forEach((row) => {
          row.goalDifference = row.goalsFor - row.goalsAgainst;
          if (row.pointsDeduction && row.pointsDeduction > 0) {
            row.points = Math.max(0, row.points - row.pointsDeduction);
          }
        });

        resetStandings.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
          return b.won - a.won;
        });

        const scorerMap: { [playerName: string]: { playerId: string; playerName: string; clubName: string; goals: number } } = {};
        const assistMap: { [playerName: string]: { playerId: string; playerName: string; clubName: string; assists: number } } = {};

        champMatches.forEach((match) => {
          (match.events || []).forEach((ev) => {
            if (ev.type === 'Goal') {
              if (ev.player1) {
                const name = ev.player1.trim();
                const clubName = ev.team === 'home' ? match.homeClubName : match.awayClubName;
                if (!scorerMap[name]) {
                  scorerMap[name] = {
                    playerId: name.toLowerCase().replace(/\s+/g, '_'),
                    playerName: name,
                    clubName: clubName,
                    goals: 0
                  };
                }
                scorerMap[name].goals += 1;
              }
              if (ev.player2) {
                const name = ev.player2.trim();
                const clubName = ev.team === 'home' ? match.homeClubName : match.awayClubName;
                if (!assistMap[name]) {
                  assistMap[name] = {
                    playerId: name.toLowerCase().replace(/\s+/g, '_'),
                    playerName: name,
                    clubName: clubName,
                    assists: 0
                  };
                }
                assistMap[name].assists += 1;
              }
            }
          });
        });

        const topScorers = Object.values(scorerMap).sort((a, b) => b.goals - a.goals).slice(0, 15);
        const topAssists = Object.values(assistMap).sort((a, b) => b.assists - a.assists).slice(0, 15);

        updatedChampionshipsList.push({
          ...champ,
          standings: resetStandings,
          topScorers,
          topAssists
        });
      }

      // 5. Update Matches (mark statsApplied = true on finished matches)
      const updatedMatchesList: Match[] = rawMatches.map((m) => {
        if (isFinishedMatch(m)) {
          return { ...m, statsApplied: true };
        }
        return m;
      });

      // 6. Write new values to Firestore (replacing old data)
      for (const p of updatedPlayersList) {
        await setDoc(doc(db, 'players', p.id), cleanUndefined(p));
      }
      for (const c of updatedClubsList) {
        await setDoc(doc(db, 'clubs', c.id), cleanUndefined(c));
      }
      for (const ch of updatedChampionshipsList) {
        await setDoc(doc(db, 'championships', ch.id), cleanUndefined(ch));
      }
      for (const m of updatedMatchesList) {
        if (isFinishedMatch(m)) {
          await setDoc(doc(db, 'matches', m.id), cleanUndefined(m));
        }
      }

      // 7. Synchronize local React state
      setPlayers(updatedPlayersList);
      setClubs(updatedClubsList);
      setChampionships(updatedChampionshipsList);
      setMatches(updatedMatchesList);

      await addAuditLog('Recálculo de Estatísticas Concluído', 'Recálculo completo de estatísticas e classificações finalizado com sucesso.', 'bg-emerald-600');
      addNotification('Recálculo Concluído', 'Recalculo das estatísticas concluído com sucesso.', 'sistema');
      alert("Recalculo das estatísticas concluído com sucesso.");
    } catch (err) {
      console.error("Error recalculating stats:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      addNotification('Erro no Recálculo', `Ocorreu um erro ao recalcular: ${errorMessage}`, 'sistema');
      alert(`Ocorreu um erro ao recalcular as estatísticas: ${errorMessage}`);
    }
  };




  // Trigger custom event from Admin panel
  const triggerMatchEvent = async (matchId: string, eventDetails: Omit<MatchEvent, 'id'>) => {
    const eventId = 'ev_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const newEvent: MatchEvent = { ...eventDetails, id: eventId };

    const m = matches.find((match) => match.id === matchId);
    if (!m) return;

    const updatedMatch: Match = {
      ...m,
      events: [...m.events, newEvent],
      stats: { ...m.stats }
    };

    if (eventDetails.type === 'Goal') {
      if (eventDetails.team === 'home') {
        updatedMatch.score = {
          ...updatedMatch.score,
          home: updatedMatch.score.home + 1
        };
      } else if (eventDetails.team === 'away') {
        updatedMatch.score = {
          ...updatedMatch.score,
          away: updatedMatch.score.away + 1
        };
      }
    } else if (eventDetails.type === 'Corner') {
      const currentCorners = updatedMatch.stats?.corners || { home: 0, away: 0 };
      if (eventDetails.team === 'home') {
        updatedMatch.stats.corners = {
          ...currentCorners,
          home: currentCorners.home + 1
        };
      } else if (eventDetails.team === 'away') {
        updatedMatch.stats.corners = {
          ...currentCorners,
          away: currentCorners.away + 1
        };
      }
    }

    try {
      await setDoc(doc(db, 'matches', matchId), updatedMatch);
    } catch (e) {
      console.error("Error saving match event:", e);
    }
  };

  // Keep track of previous matches to detect transitions to FINISHED and score changes
  const prevStandingsMatchesRef = React.useRef<Match[]>([]);

  useEffect(() => {
    if (matches.length === 0) return;

    const isFinishedMatch = (status: any) =>
      status === MatchStatus.FINISHED || status === 'FINISHED' || status === 'Encerrado';

    const changedChamps = new Set<string>();

    if (prevStandingsMatchesRef.current.length === 0) {
      // First load: check if any championship has finished matches
      championships.forEach((champ) => {
        const hasFinishedMatches = matches.some((m) => m.championshipId === champ.id && isFinishedMatch(m.status));
        if (hasFinishedMatches) {
          changedChamps.add(champ.id);
        }
      });
    } else {
      matches.forEach((m) => {
        const prev = prevStandingsMatchesRef.current.find((p) => p.id === m.id);
        if (!prev) {
          if (isFinishedMatch(m.status)) {
            changedChamps.add(m.championshipId);
          }
        } else {
          const transitionedToFinished = !isFinishedMatch(prev.status) && isFinishedMatch(m.status);
          const finishedScoreChanged = isFinishedMatch(prev.status) && isFinishedMatch(m.status) && 
            (prev.score.home !== m.score.home || prev.score.away !== m.score.away);
          const finishedStatusChanged = isFinishedMatch(prev.status) && !isFinishedMatch(m.status);

          if (transitionedToFinished || finishedScoreChanged || finishedStatusChanged) {
            changedChamps.add(m.championshipId);
          }
        }
      });

      prevStandingsMatchesRef.current.forEach((prev) => {
        const current = matches.find((m) => m.id === prev.id);
        if (!current && isFinishedMatch(prev.status)) {
          changedChamps.add(prev.championshipId);
        }
      });
    }

    prevStandingsMatchesRef.current = matches;

    if (changedChamps.size > 0) {
      changedChamps.forEach((champId) => {
        console.log(`[Auto Standing Recalculation] Recalculating standings for championship: ${champId}`);
        recalculateStandingsForChampionship(champId, matches);
      });
    }
  }, [matches, user, championships]);

  // Automatically apply finished match statistics to player season stats
  useEffect(() => {
    const applyPendingMatchStats = async () => {
      const pendingMatches = matches.filter(
        (m) => m.status === MatchStatus.FINISHED && !m.statsApplied
      );
      if (pendingMatches.length === 0) return;

      for (const match of pendingMatches) {
        console.log(`Applying stats for match ${match.id}...`);
        
        try {
          await runTransaction(db, async (transaction) => {
            const matchDocRef = doc(db, 'matches', match.id);
            
            const matchSnap = await transaction.get(matchDocRef);
            if (!matchSnap.exists()) return;
            
            const currentMatch = matchSnap.data() as Match;
            if (currentMatch.statsApplied) return; // Prevent double application across clients

            // 1. Gather player updates
            const playersToUpdate = new Map<string, {
              matches: number;
              goals: number;
              assists: number;
              yellowCards: number;
              redCards: number;
              minutesPlayed: number;
            }>();

            const findBestPlayerMatch = (name: string) => {
              const normalized = name.trim().toLowerCase();
              // A. Exact match of name or ID
              let matched = players.find(p => p.name.toLowerCase() === normalized || p.id === normalized.replace(/\s+/g, '_'));
              if (matched) return matched;

              // B. Exact match of a sub-word
              matched = players.find(p => {
                const dbNameLower = p.name.toLowerCase();
                const words = dbNameLower.split(/\s+/);
                return words.includes(normalized);
              });
              if (matched) return matched;

              // C. Query name contains db name
              matched = players.find(p => {
                const dbNameLower = p.name.toLowerCase();
                const queryWords = normalized.split(/\s+/);
                return queryWords.includes(dbNameLower);
              });
              if (matched) return matched;

              // D. Substring or initials matching e.g. "G. De Arrascaeta" with "Giorgian De Arrascaeta"
              const queryParts = normalized.split(/\s+/).filter(part => part.length > 1 && !part.endsWith('.'));
              if (queryParts.length > 0) {
                matched = players.find(p => {
                  const dbNameLower = p.name.toLowerCase();
                  return queryParts.every(part => dbNameLower.includes(part));
                });
                if (matched) return matched;
              }

              // E. Fallback contains check
              matched = players.find(p => p.name.toLowerCase().includes(normalized) || normalized.includes(p.name.toLowerCase()));
              return matched || null;
            };

            const involvedPlayersMap = new Map<string, Player>(); // playerId -> Player

            // 1. Gather all raw names from starting lineups
            const rawNames = new Set<string>();
            (currentMatch.lineups?.home?.starting || []).forEach(lp => { if (lp.name) rawNames.add(lp.name); });
            (currentMatch.lineups?.away?.starting || []).forEach(lp => { if (lp.name) rawNames.add(lp.name); });

            // 2. Gather all raw names from substitutes list
            (currentMatch.lineups?.home?.bench || []).forEach(lp => { if (lp.name) rawNames.add(lp.name); });
            (currentMatch.lineups?.away?.bench || []).forEach(lp => { if (lp.name) rawNames.add(lp.name); });

            // 3. Gather all raw names from events
            currentMatch.events.forEach(ev => {
              if (ev.player1) rawNames.add(ev.player1);
              if (ev.player2) rawNames.add(ev.player2);
            });

            // Resolve raw names to actual players in our database
            rawNames.forEach(rawName => {
              const p = findBestPlayerMatch(rawName);
              if (p) {
                involvedPlayersMap.set(p.id, p);
              }
            });

            for (const [playerId, player] of involvedPlayersMap.entries()) {
              // Check if they actually participated in the match (i.e., started or was subbed on or had events)
              const isHomeStarter = (currentMatch.lineups?.home?.starting || []).some(lp => lp.name && findBestPlayerMatch(lp.name)?.id === playerId);
              const isAwayStarter = (currentMatch.lineups?.away?.starting || []).some(lp => lp.name && findBestPlayerMatch(lp.name)?.id === playerId);
              const isStarter = isHomeStarter || isAwayStarter;

              // Find if they entered as a substitute (player2 of a Substitution event)
              const subInEvent = currentMatch.events.find(e => 
                e.type === 'Substitution' && e.player2 && findBestPlayerMatch(e.player2)?.id === playerId
              );

              const hasEvents = currentMatch.events.some(e => 
                (e.player1 && findBestPlayerMatch(e.player1)?.id === playerId) ||
                (e.player2 && findBestPlayerMatch(e.player2)?.id === playerId)
              );

              const participated = isStarter || !!subInEvent || hasEvents;
              if (!participated) {
                continue; // They didn't play in this match (remained unused sub)
              }

              // Determine entering minute
              let enteredMinute = 0;
              if (isStarter) {
                enteredMinute = 0;
              } else if (subInEvent) {
                enteredMinute = subInEvent.minute ?? 45;
              } else if (hasEvents) {
                enteredMinute = 0; // Fallback
              }

              // Determine exit minute (defaults to end of game or current simulation minute)
              let leftMinute = currentMatch.minute > 0 ? currentMatch.minute : 90;

              // Cap exit if they were subbed off (player1 of a Substitution event)
              const subOffEvent = currentMatch.events.find(e => 
                e.type === 'Substitution' && e.player1 && findBestPlayerMatch(e.player1)?.id === playerId
              );
              if (subOffEvent) {
                leftMinute = Math.min(leftMinute, subOffEvent.minute ?? 45);
              }

              // Cap exit if they were red carded (player1 of a RedCard event)
              const redCardEvent = currentMatch.events.find(e => 
                e.type === 'RedCard' && e.player1 && findBestPlayerMatch(e.player1)?.id === playerId
              );
              if (redCardEvent) {
                leftMinute = Math.min(leftMinute, redCardEvent.minute ?? leftMinute);
              }

              const minutesPlayed = Math.max(0, leftMinute - enteredMinute);

              // Count goals scored in this match
              const goals = currentMatch.events.filter(e => 
                e.type === 'Goal' && e.player1 && findBestPlayerMatch(e.player1)?.id === playerId
              ).length;

              // Count assists made in this match
              const assists = currentMatch.events.filter(e => 
                e.type === 'Goal' && e.player2 && findBestPlayerMatch(e.player2)?.id === playerId
              ).length;

              // Count yellow cards in this match
              const yellowCards = currentMatch.events.filter(e => 
                e.type === 'YellowCard' && e.player1 && findBestPlayerMatch(e.player1)?.id === playerId
              ).length;

              // Count red cards in this match
              const redCards = currentMatch.events.filter(e => 
                e.type === 'RedCard' && e.player1 && findBestPlayerMatch(e.player1)?.id === playerId
              ).length;

              // Build our update object
              playersToUpdate.set(playerId, {
                matches: 1, // Participated in 1 match
                goals,
                assists,
                yellowCards,
                redCards,
                minutesPlayed
              });
            }

            // Phase 1: Re-read all player documents inside the transaction BEFORE any writes
            const playerSnaps = new Map<string, any>();
            for (const playerId of playersToUpdate.keys()) {
              const playerDocRef = doc(db, 'players', playerId);
              const playerSnap = await transaction.get(playerDocRef);
              if (playerSnap.exists()) {
                playerSnaps.set(playerId, playerSnap.data());
              }
            }

            // Phase 2: Apply calculations and perform all writes after all reads have finished
            for (const [playerId, update] of playersToUpdate.entries()) {
              const p = playerSnaps.get(playerId);
              if (p) {
                const playerDocRef = doc(db, 'players', playerId);
                
                // Ensure values stay valid
                const finalMatches = (p.stats?.matches || 0) + Math.max(0, update.matches);
                const finalGoals = (p.stats?.goals || 0) + Math.max(0, update.goals);
                const finalAssists = (p.stats?.assists || 0) + Math.max(0, update.assists);
                const finalYellowCards = (p.stats?.yellowCards || 0) + Math.max(0, update.yellowCards);
                const finalRedCards = (p.stats?.redCards || 0) + Math.max(0, update.redCards);
                const finalMinutesPlayed = (p.stats?.minutesPlayed || 0) + Math.max(0, update.minutesPlayed);

                // Determine current season year (e.g. 2026)
                const currentSeason = currentMatch.championshipName?.includes('2026') || currentMatch.date?.startsWith('2026') ? '2026' : (new Date().getFullYear().toString());
                
                const historyList = p.history ? [...p.history] : [];
                const existingHistIdx = historyList.findIndex(h => h.season === currentSeason && h.club === p.clubName);
                
                if (existingHistIdx >= 0) {
                  historyList[existingHistIdx] = {
                    ...historyList[existingHistIdx],
                    matches: (historyList[existingHistIdx].matches || 0) + Math.max(0, update.matches),
                    goals: (historyList[existingHistIdx].goals || 0) + Math.max(0, update.goals),
                  };
                } else {
                  historyList.push({
                    season: currentSeason,
                    club: p.clubName || 'Sem Clube',
                    matches: Math.max(0, update.matches),
                    goals: Math.max(0, update.goals),
                  });
                }

                const updatedPlayer: Player = {
                  ...p,
                  stats: {
                    matches: finalMatches,
                    goals: finalGoals,
                    assists: finalAssists,
                    yellowCards: finalYellowCards,
                    redCards: finalRedCards,
                    minutesPlayed: finalMinutesPlayed
                  },
                  history: historyList
                };

                transaction.set(playerDocRef, cleanUndefined(updatedPlayer));
              }
            }

            // Mark match as statsApplied = true
            transaction.update(matchDocRef, { statsApplied: true });
          });
          
          console.log(`Successfully applied stats for match ${match.id}.`);
          addNotification(
            'Estatísticas Aplicadas',
            `As estatísticas de ${match.homeClubName} vs ${match.awayClubName} foram computadas aos atletas com sucesso!`,
            'sistema'
          );
        } catch (err) {
          console.error("Failed to apply pending match stats:", err);
        }
      }
    };

    if (players.length > 0 && matches.length > 0) {
      applyPendingMatchStats();
    }
  }, [matches, players]);

  // Concurrent-safe, Decentralized Live Match Ticker
  useEffect(() => {
    if (liveSimSpeed === 'off') return;

    const intervalTime = liveSimSpeed === 'fast' ? 2000 : 60000;

    const timer = setInterval(() => {
      matches.forEach((m) => {
        if (m.status !== MatchStatus.LIVE || m.isPaused) return;

        const now = Date.now();
        const lastTick = m.lastTickAt || 0;
        const timeSinceLastTick = now - lastTick;

        // If it's time to tick to the next minute
        if (lastTick === 0 || timeSinceLastTick >= intervalTime) {
          tickMatchWithTransaction(m.id, m.minute, intervalTime);
        }
      });
    }, 1000); // Check every second for any match that needs a tick

    return () => clearInterval(timer);
  }, [liveSimSpeed, matches]);

  // Concurrent-safe, Decentralized HT -> LIVE Transition
  useEffect(() => {
    if (liveSimSpeed === 'off') return;

    const htDuration = liveSimSpeed === 'fast' ? 4000 : 15 * 60 * 1000; // 15 minutes halftime in normal mode (real time)

    const timer = setInterval(() => {
      matches.forEach((m) => {
        if (m.status !== MatchStatus.HT) return;

        const now = Date.now();
        const htStarted = m.htStartedAt || 0;
        const elapsedHT = now - htStarted;

        if (htStarted > 0 && elapsedHT >= htDuration) {
          transitionHTToLiveWithTransaction(m.id);
        }
      });
    }, 1000); // Check every second

    return () => clearInterval(timer);
  }, [liveSimSpeed, matches]);

  // Unified, Real-Time Reactive Notification Listener for all Clients
  const prevMatchesRef = React.useRef<Match[]>([]);

  useEffect(() => {
    // If it's the very first time we receive matches, just store them and don't emit notifications for existing events
    if (prevMatchesRef.current.length === 0) {
      if (matches.length > 0) {
        prevMatchesRef.current = matches;
      }
      return;
    }

    const prevMatches = prevMatchesRef.current;
    
    matches.forEach((m) => {
      const prevM = prevMatches.find((p) => p.id === m.id);
      if (prevM) {
        // Compare events to find new ones
        const newEvents = m.events.filter(
          (ev) => !prevM.events.some((pev) => pev.id === ev.id)
        );

        newEvents.forEach((ev) => {
          if (ev.type === 'Goal') {
            const goalDesc = ev.player1 
              ? `${ev.player1} marca aos ${ev.minute}'! Assistência de ${ev.player2 || 'ninguém'}. Placar: ${m.homeClubName} ${m.score.home} - ${m.score.away} ${m.awayClubName}`
              : `Gol aos ${ev.minute}'! Placar: ${m.homeClubName} ${m.score.home} - ${m.score.away} ${m.awayClubName}`;
            
            if (ev.team === 'home') {
              addNotification(
                '⚽ GOL do ' + m.homeClubName + '!',
                goalDesc,
                'golo'
              );
            } else if (ev.team === 'away') {
              addNotification(
                '⚽ GOL do ' + m.awayClubName + '!',
                goalDesc,
                'golo'
              );
            }
          } else if (ev.type === 'RedCard') {
            addNotification(
              '🟥 Cartão Vermelho!',
              `${ev.player1} do ${ev.team === 'home' ? m.homeClubName : m.awayClubName} foi expulso aos ${ev.minute}'!`,
              'jogo'
            );
          } else if (ev.type === 'YellowCard') {
            addNotification(
              '🟨 Cartão Amarelo',
              `${ev.player1} recebe amarelo aos ${ev.minute}'`,
              'jogo'
            );
          } else if (ev.type === 'VAR') {
            addNotification(
              '🖥️ Revisão do VAR',
              `Lance polêmico aos ${ev.minute}': ${ev.detail}`,
              'jogo'
            );
          } else if (ev.type === 'HalfTime') {
            addNotification(
              '🏁 Intervalo!',
              `Fim do primeiro tempo: ${m.homeClubName} ${m.score.home} - ${m.score.away} ${m.awayClubName}`,
              'jogo'
            );
          } else if (ev.type === 'FullTime') {
            addNotification(
              '🏁 Fim de Jogo!',
              `Partida encerrada: ${m.homeClubName} ${m.score.home} - ${m.score.away} ${m.awayClubName}`,
              'jogo'
            );
          } else if (ev.type === 'KickOff' && ev.minute === 45) {
            addNotification(
              '⚽ Segundo Tempo iniciado!',
              `Recomeça o jogo para ${m.homeClubName} ${m.score.home} - ${m.score.away} ${m.awayClubName}.`,
              'jogo'
            );
          }
        });
      }
    });

    prevMatchesRef.current = matches;
  }, [matches]);

  return (
    <AppContext.Provider
      value={{
        clubs,
        players,
        championships,
        matches,
        news,
        favorites,
        user,
        notifications,
        currentView,
        viewHistory,
        theme,
        headerColor,
        setHeaderColor,
        language,
        liveSimSpeed,
        toast,
        drawerOpen,
        setDrawerOpen,
        setToast,
        setLiveSimSpeed,
        navigateTo,
        navigateBack,
        toggleFavorite,
        setTheme,
        setLanguage,
        loginUser,
        registerUser,
        loginWithGoogle,
        sendPasswordReset,
        logoutUser,
        updateUser,
        updateUserRole,
        addNotification,
        markNotificationRead,
        clearNotifications,
        dbConfig,
        clearAllDatabase,
        recalculateAllPlayerStats,
        
        // Chat & Presence additions
        chatUnreadCounts,
        activeChatRoom,
        setActiveChatRoom,
        onlineUsers,
        setMyTypingState,
        
        // Admin
        addMatch,
        updateMatch,
        deleteMatch,
        addClub,
        updateClub,
        deleteClub,
        addPlayer,
        updatePlayer,
        deletePlayer,
        addChampionship,
        updateChampionship,
        recalculateStandingsForChampionship,
        deleteChampionship,
        clearAllChampionships,
        addNews,
        updateNews,
        deleteNews,
        clearAllNews,
        triggerMatchEvent,
        
        // Backups & Auditing
        backups,
        auditLogs,
        createBackup,
        restoreBackup,
        deleteBackup,
        addAuditLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
