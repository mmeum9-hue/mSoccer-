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
} from '../types';
import {
  INITIAL_CLUBS,
  INITIAL_PLAYERS,
  INITIAL_CHAMPIONSHIPS,
  INITIAL_MATCHES,
  INITIAL_NEWS,
} from '../mockData';
import { collection, doc, setDoc as originalSetDoc, onSnapshot, deleteDoc, getDoc, getDocs, runTransaction, updateDoc, serverTimestamp, addDoc, query, orderBy, limit } from 'firebase/firestore';
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

// Safe setDoc wrapper
const setDoc = (ref: any, data: any, options?: any) => {
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
  restoreDefaultDatabase: () => Promise<void>;
  recalculateAllPlayerStats: () => Promise<void>;
  
  // Chat & Presence addition
  chatUnreadCounts: { [room: string]: number };
  activeChatRoom: 'geral' | 'mocambola' | 'transferencias';
  setActiveChatRoom: (room: 'geral' | 'mocambola' | 'transferencias') => void;
  onlineUsers: UserPresence[];
  setMyTypingState: (room: 'geral' | 'mocambola' | 'transferencias' | null) => Promise<void>;
  
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
  recalculateStandingsForChampionship: (champId: string, currentMatches?: Match[]) => Promise<void>;
  deleteChampionship: (id: string) => void;
  clearAllChampionships: () => void;
  addNews: (news: NewsArticle) => void;
  updateNews: (news: NewsArticle) => void;
  deleteNews: (id: string) => void;
  clearAllNews: () => void;
  triggerMatchEvent: (matchId: string, event: Omit<MatchEvent, 'id'>) => void;
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

  const [language, setLanguageState] = useState<'pt' | 'en' | 'es'>(() => {
    const saved = safeLocalStorage.getItem('msoccer_lang');
    return (saved as 'pt' | 'en' | 'es') || 'pt';
  });

  const [liveSimSpeed, setLiveSimSpeed] = useState<'off' | 'normal' | 'fast'>('normal');
  const [toast, setToast] = useState<{ title: string; body: string; id: string; type: string } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [dbConfig, setDbConfig] = useState<{ initialized?: boolean; cleared?: boolean } | null>(null);

  // Chat & Presence States
  const [chatUnreadCounts, setChatUnreadCounts] = useState<{ [room: string]: number }>({
    geral: 0,
    mocambola: 0,
    transferencias: 0
  });
  const [activeChatRoom, setActiveChatRoom] = useState<'geral' | 'mocambola' | 'transferencias'>('geral');
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);

  const [lastReadTimestamps, setLastReadTimestamps] = useState<{ [room: string]: number }>(() => {
    try {
      return {
        geral: Number(safeLocalStorage.getItem('msoccer_last_read_geral') || '0'),
        mocambola: Number(safeLocalStorage.getItem('msoccer_last_read_mocambola') || '0'),
        transferencias: Number(safeLocalStorage.getItem('msoccer_last_read_transferencias') || '0')
      };
    } catch (e) {
      return { geral: 0, mocambola: 0, transferencias: 0 };
    }
  });

  // Sync DB Config
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'system', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        setDbConfig(snapshot.data());
      } else {
        setDbConfig({ initialized: false, cleared: false });
      }
    }, (error) => console.error("Firestore system config error:", error));
    return () => unsubscribe();
  }, []);

  // One-time Database Seeding
  useEffect(() => {
    if (dbConfig && dbConfig.initialized === false && dbConfig.cleared !== true) {
      setDoc(doc(db, 'system', 'config'), { initialized: true, cleared: false }).catch(console.error);

      INITIAL_CLUBS.forEach(club => {
        setDoc(doc(db, 'clubs', club.id), club).catch(console.error);
      });
      INITIAL_PLAYERS.forEach(player => {
        setDoc(doc(db, 'players', player.id), player).catch(console.error);
      });
      INITIAL_CHAMPIONSHIPS.forEach(champ => {
        setDoc(doc(db, 'championships', champ.id), champ).catch(console.error);
      });
      INITIAL_MATCHES.forEach(m => {
        setDoc(doc(db, 'matches', m.id), m).catch(console.error);
      });
      INITIAL_NEWS.forEach(n => {
        setDoc(doc(db, 'news', n.id), n).catch(console.error);
      });
    }
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
      setNews(items);
    }, (error) => console.error("Firestore news error:", error));
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
            if (firebaseUser.email === 'admin@msoccer.com' || firebaseUser.email === 'mmeum9@gmail.com') {
              role = 'Admin';
            }
            await setDoc(userDocRef, {
              uid: firebaseUser.uid,
              name,
              email: firebaseUser.email || '',
              photoUrl,
              role,
              createdAt: new Date().toISOString()
            });
          }
        } catch (e) {
          console.error("Error syncing authenticated user document:", e);
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
    if (currentView.type === 'chat') {
      const room = activeChatRoom;
      const now = Date.now();
      setLastReadTimestamps(prev => ({ ...prev, [room]: now }));
      safeLocalStorage.setItem(`msoccer_last_read_${room}`, String(now));
      setChatUnreadCounts(prev => ({ ...prev, [room]: 0 }));
    }
  }, [currentView, activeChatRoom]);

  // 2. Background Chat Messages Listener (unread tracker, statuses, and Toast alerts)
  const notifiedMessagesRef = React.useRef<Set<string>>(new Set());
  const isInitialRef = React.useRef(true);

  useEffect(() => {
    const q = query(
      collection(db, 'chat_messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: any[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        msgs.push({ id: docSnap.id, ...d });
      });

      // Group messages by room
      const messagesByRoom: { [room: string]: any[] } = { geral: [], mocambola: [], transferencias: [] };
      msgs.forEach((m) => {
        if (m.room && messagesByRoom[m.room] !== undefined) {
          messagesByRoom[m.room].push(m);
        }
      });

      const currentRoom = activeChatRoomRef.current;
      const viewingChat = currentViewRef.current.type === 'chat';

      // If currently viewing the chat room, automatically update the lastReadTimestamp to Date.now()
      // to keep it synchronized in real-time, preventing unread counts from increasing or reverting
      if (viewingChat) {
        const now = Date.now();
        const lastReadVal = lastReadTimestampsRef.current[currentRoom] || 0;
        if (now - lastReadVal > 2000) {
          setLastReadTimestamps(prev => ({ ...prev, [currentRoom]: now }));
          safeLocalStorage.setItem(`msoccer_last_read_${currentRoom}`, String(now));
        }
      }

      // Recalculate unread counts
      const counts = { geral: 0, mocambola: 0, transferencias: 0 };
      Object.keys(messagesByRoom).forEach((r) => {
        const roomMsgs = messagesByRoom[r];
        const lastRead = lastReadTimestampsRef.current[r] || 0;
        let unread = 0;

        roomMsgs.forEach((m) => {
          const mTime = m.createdAt?.toMillis ? m.createdAt.toMillis() : (m.createdAt ? new Date(m.createdAt).getTime() : Date.now());
          const isFromMe = m.senderName === userRef.current?.name;
          if (!isFromMe && mTime > lastRead) {
            unread++;
          }
        });
        counts[r as 'geral' | 'mocambola' | 'transferencias'] = unread;
      });

      // If viewing chat, active room has 0 unread
      if (viewingChat) {
        counts[currentRoom] = 0;
      }
      setChatUnreadCounts(counts);

      // Handle initial load mapping
      if (isInitialRef.current) {
        msgs.forEach((m) => {
          notifiedMessagesRef.current.add(m.id);
        });
        isInitialRef.current = false;
      } else {
        // Live updates / New incoming messages
        msgs.forEach((m) => {
          const isFromMe = m.senderName === userRef.current?.name;
          if (!notifiedMessagesRef.current.has(m.id)) {
            notifiedMessagesRef.current.add(m.id);
            if (!isFromMe) {
              const isViewingThisRoom = viewingChat && currentRoom === m.room;
              if (!isViewingThisRoom) {
                const roomLabel = m.room === 'transferencias' ? 'Transferências' : m.room === 'mocambola' ? 'Moçambola' : 'Geral';
                addNotification(
                  `💬 Chat: ${roomLabel}`,
                  `${m.senderName}: "${m.text || 'Anexo multimédia'}"`,
                  'sistema'
                );
              }
            }
          }
        });
      }

      // Status updates in Firestore
      msgs.forEach((m) => {
        const isFromMe = m.senderName === userRef.current?.name;
        if (!isFromMe && userRef.current?.uid) {
          const isViewingThisRoom = viewingChat && currentRoom === m.room;
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
    }, (error) => console.error("Firestore bg chat listener error:", error));

    return () => unsubscribe();
  }, []);

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
      const userDocRef = doc(db, 'users', currentUser.uid);
      await originalSetDoc(userDocRef, { role }, { merge: true });
    }
    if (user) {
      setUser({ ...user, role });
    }
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
      await setDoc(doc(db, 'matches', match.id), match);
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

      await setDoc(doc(db, 'matches', match.id), updatedMatch);
    } catch (e) {
      console.error("Error updating match:", e);
    }
  };
  const deleteMatch = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'matches', id));
    } catch (e) {
      console.error("Error deleting match:", e);
    }
  };

  const addClub = async (club: Club) => {
    try {
      await setDoc(doc(db, 'clubs', club.id), club);
    } catch (e) {
      console.error("Error adding club:", e);
    }
  };
  const updateClub = async (club: Club) => {
    try {
      await setDoc(doc(db, 'clubs', club.id), club);

      // Propagate new name and logo to all existing matches
      matches.forEach(async (m) => {
        let updated = false;
        const newMatch = { ...m };
        if (m.homeClubId === club.id) {
          newMatch.homeClubName = club.name;
          newMatch.homeClubLogo = club.logoUrl;
          updated = true;
        }
        if (m.awayClubId === club.id) {
          newMatch.awayClubName = club.name;
          newMatch.awayClubLogo = club.logoUrl;
          updated = true;
        }
        if (updated) {
          await setDoc(doc(db, 'matches', m.id), newMatch);
        }
      });

      // Propagate to championship standings
      championships.forEach(async (champ) => {
        const hasClubInStandings = champ.standings.some((row) => row.clubId === club.id);
        if (hasClubInStandings) {
          const updatedStandings = champ.standings.map((row) =>
            row.clubId === club.id
              ? { ...row, clubName: club.name, logoUrl: club.logoUrl }
              : row
          );
          await setDoc(doc(db, 'championships', champ.id), { ...champ, standings: updatedStandings });
        }
      });

      // Propagate to players
      players.forEach(async (p) => {
        if (p.clubId === club.id) {
          await setDoc(doc(db, 'players', p.id), { ...p, clubName: club.name });
        }
      });

      // Propagate to news articles
      news.forEach(async (n) => {
        if (n.clubId === club.id) {
          await setDoc(doc(db, 'news', n.id), { ...n, clubName: club.name });
        }
      });
    } catch (e) {
      console.error("Error updating club:", e);
    }
  };
  const deleteClub = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clubs', id));
      players.forEach(async (p) => {
        if (p.clubId === id) {
          await deleteDoc(doc(db, 'players', p.id));
        }
      });
    } catch (e) {
      console.error("Error deleting club:", e);
    }
  };

  const addPlayer = async (player: Player) => {
    try {
      await setDoc(doc(db, 'players', player.id), player);
    } catch (e) {
      console.error("Error adding player:", e);
    }
  };
  const updatePlayer = async (player: Player) => {
    try {
      await setDoc(doc(db, 'players', player.id), player);
    } catch (e) {
      console.error("Error updating player:", e);
    }
  };
  const deletePlayer = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'players', id));
    } catch (e) {
      console.error("Error deleting player:", e);
    }
  };

  const addChampionship = async (championship: Championship) => {
    try {
      await setDoc(doc(db, 'championships', championship.id), championship);
    } catch (e) {
      console.error("Error adding championship:", e);
    }
  };
  const updateChampionship = async (championship: Championship) => {
    try {
      await setDoc(doc(db, 'championships', championship.id), championship);
    } catch (e) {
      console.error("Error updating championship:", e);
    }
  };
  const recalculateStandingsForChampionship = async (champId: string, currentMatches?: Match[]) => {
    try {
      const champ = championships.find(c => c.id === champId);
      if (!champ) return;

      const matchesToUse = currentMatches || matches;

      // Reset all existing standing rows to 0 stats, preserving the clubs currently in the championship
      const resetStandings = champ.standings.map((row) => ({
        ...row,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      }));

      // Filter finished matches for this championship
      const finishedMatches = matchesToUse.filter(
        (m) => m.championshipId === champ.id && m.status === MatchStatus.FINISHED
      );

      // Aggregate standings
      finishedMatches.forEach((match) => {
        const homeIdx = resetStandings.findIndex((s) => s.clubId === match.homeClubId);
        const awayIdx = resetStandings.findIndex((s) => s.clubId === match.awayClubId);

        if (homeIdx !== -1 && awayIdx !== -1) {
          const homeRow = resetStandings[homeIdx];
          const awayRow = resetStandings[awayIdx];

          homeRow.played += 1;
          awayRow.played += 1;

          homeRow.goalsFor += match.score.home;
          homeRow.goalsAgainst += match.score.away;
          awayRow.goalsFor += match.score.away;
          awayRow.goalsAgainst += match.score.home;

          if (match.score.home > match.score.away) {
            homeRow.won += 1;
            homeRow.points += 3;
            awayRow.lost += 1;
          } else if (match.score.home < match.score.away) {
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

      // Correct goalDifference
      resetStandings.forEach((row) => {
        row.goalDifference = row.goalsFor - row.goalsAgainst;
      });

      // Sort standings (points DESC, then goal difference DESC, then goals for DESC)
      resetStandings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });

      // Aggregate scorer and assist maps from match events
      const scorerMap: { [playerName: string]: { playerId: string; playerName: string; clubName: string; goals: number } } = {};
      const assistMap: { [playerName: string]: { playerId: string; playerName: string; clubName: string; assists: number } } = {};

      finishedMatches.forEach((match) => {
        match.events.forEach((ev) => {
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
        standings: resetStandings,
        topScorers,
        topAssists
      };

      await updateChampionship(updatedChamp);
    } catch (err) {
      console.error("Error recalculating standings for champ:", champId, err);
    }
  };
  const deleteChampionship = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'championships', id));
    } catch (e) {
      console.error("Error deleting championship:", e);
    }
  };
  const clearAllChampionships = async () => {
    try {
      championships.forEach(async (c) => {
        await deleteDoc(doc(db, 'championships', c.id));
      });
      matches.forEach(async (m) => {
        await deleteDoc(doc(db, 'matches', m.id));
      });
      setFavorites((prev) => ({ ...prev, championships: [], matches: [] }));
      addNotification('Campeonatos Removidos', 'Todos os campeonatos e partidas foram excluídos do sistema.', 'sistema');
    } catch (e) {
      console.error("Error clearing championships:", e);
    }
  };

  const addNews = async (newsArt: NewsArticle) => {
    try {
      await setDoc(doc(db, 'news', newsArt.id), newsArt);
    } catch (e) {
      console.error("Error adding news:", e);
    }
  };
  const updateNews = async (newsArt: NewsArticle) => {
    try {
      await setDoc(doc(db, 'news', newsArt.id), newsArt);
    } catch (e) {
      console.error("Error updating news:", e);
    }
  };
  const deleteNews = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'news', id));
    } catch (e) {
      console.error("Error deleting news:", e);
    }
  };
  const clearAllNews = async () => {
    try {
      news.forEach(async (n) => {
        await deleteDoc(doc(db, 'news', n.id));
      });
      addNotification('Notícias Removidas', 'Todas as notícias do sistema foram excluídas.', 'sistema');
    } catch (e) {
      console.error("Error clearing news:", e);
    }
  };

  const clearAllDatabase = async () => {
    try {
      // 1. Set dbConfig to cleared: true so that standard auto-seeding is skipped
      await setDoc(doc(db, 'system', 'config'), { initialized: true, cleared: true });

      // 2. Clear matches
      const matchesSnap = await getDocs(collection(db, 'matches'));
      for (const docSnap of matchesSnap.docs) {
        await deleteDoc(docSnap.ref);
      }

      // 3. Clear championships
      const champsSnap = await getDocs(collection(db, 'championships'));
      for (const docSnap of champsSnap.docs) {
        await deleteDoc(docSnap.ref);
      }

      // 4. Clear players
      const playersSnap = await getDocs(collection(db, 'players'));
      for (const docSnap of playersSnap.docs) {
        await deleteDoc(docSnap.ref);
      }

      // 5. Clear clubs
      const clubsSnap = await getDocs(collection(db, 'clubs'));
      for (const docSnap of clubsSnap.docs) {
        await deleteDoc(docSnap.ref);
      }

      // 6. Clear news
      const newsSnap = await getDocs(collection(db, 'news'));
      for (const docSnap of newsSnap.docs) {
        await deleteDoc(docSnap.ref);
      }

      // 7. Clear chat_messages
      try {
        const chatMessagesSnapshot = await getDocs(collection(db, 'chat_messages'));
        for (const chatDoc of chatMessagesSnapshot.docs) {
          await deleteDoc(chatDoc.ref);
        }
      } catch (err) {
        console.error("Error clearing chat messages:", err);
      }

      // 8. Clear Local Storage to prevent any stale data
      safeLocalStorage.removeItem('msoccer_clubs');
      safeLocalStorage.removeItem('msoccer_players');
      safeLocalStorage.removeItem('msoccer_championships');
      safeLocalStorage.removeItem('msoccer_matches');
      safeLocalStorage.removeItem('msoccer_news');
      safeLocalStorage.removeItem('msoccer_favorites');
      safeLocalStorage.removeItem('msoccer_notifications');

      // 9. Reset local states
      setClubs([]);
      setPlayers([]);
      setChampionships([]);
      setMatches([]);
      setNews([]);
      setFavorites({ clubs: [], players: [], championships: [], matches: [] });
      setNotifications([]);

      addNotification('Sistema Reiniciado', 'Todos os dados do sistema (ligas, partidas, notícias, conversas e times) foram zerados com sucesso.', 'sistema');
    } catch (e) {
      console.error("Error clearing database:", e);
      addNotification('Erro ao Reiniciar', 'Ocorreu um erro ao tentar zerar o banco de dados.', 'sistema');
    }
  };

  const restoreDefaultDatabase = async () => {
    try {
      // 1. Set dbConfig initialized to true and cleared to false
      await setDoc(doc(db, 'system', 'config'), { initialized: true, cleared: false });

      // 2. Insert clubs
      for (const club of INITIAL_CLUBS) {
        await setDoc(doc(db, 'clubs', club.id), club);
      }
      // 3. Insert players
      for (const player of INITIAL_PLAYERS) {
        await setDoc(doc(db, 'players', player.id), player);
      }
      // 4. Insert championships
      for (const champ of INITIAL_CHAMPIONSHIPS) {
        await setDoc(doc(db, 'championships', champ.id), champ);
      }
      // 5. Insert matches
      for (const m of INITIAL_MATCHES) {
        await setDoc(doc(db, 'matches', m.id), m);
      }
      // 6. Insert news
      for (const n of INITIAL_NEWS) {
        await setDoc(doc(db, 'news', n.id), n);
      }

      addNotification('Dados de Demonstração Restaurados', 'Todos os dados de demonstração originais foram restaurados com sucesso.', 'sistema');
    } catch (e) {
      console.error("Error restoring default database:", e);
      addNotification('Erro ao Restaurar', 'Ocorreu um erro ao tentar restaurar os dados de demonstração.', 'sistema');
    }
  };

  const recalculateAllPlayerStats = async () => {
    try {
      addNotification(
        'Recomputando Estatísticas',
        'Iniciando o recálculo de todas as estatísticas e históricos de atletas...',
        'sistema'
      );
      
      // 1. Reset all players' stats and current season (2026) history in Firestore
      const playersSnapshot = await getDocs(collection(db, 'players'));
      for (const playerDoc of playersSnapshot.docs) {
        const p = playerDoc.data() as Player;
        const cleanedHistory = p.history ? p.history.filter(h => h.season !== '2026') : [];
        const updatedPlayer: Player = {
          ...p,
          stats: {
            matches: 0,
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0,
            minutesPlayed: 0
          },
          history: cleanedHistory
        };
        await setDoc(playerDoc.ref, cleanUndefined(updatedPlayer));
      }

      // 2. Mark all finished matches as statsApplied = false in Firestore
      const matchesSnapshot = await getDocs(collection(db, 'matches'));
      const matchesData: Match[] = [];
      for (const matchDoc of matchesSnapshot.docs) {
        const m = matchDoc.data() as Match;
        matchesData.push(m);
        if (m.status === MatchStatus.FINISHED) {
          await updateDoc(matchDoc.ref, { statsApplied: false });
        }
      }

      // 3. Recalculate standings for all championships
      const champsSnapshot = await getDocs(collection(db, 'championships'));
      for (const champDoc of champsSnapshot.docs) {
        const champ = champDoc.data() as Championship;
        
        // Reset all existing standing rows to 0 stats, preserving the clubs currently in the championship
        const resetStandings = champ.standings.map((row) => ({
          ...row,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        }));

        // Filter finished matches for this championship
        const finishedMatches = matchesData.filter(
          (m) => m.championshipId === champ.id && m.status === MatchStatus.FINISHED
        );

        // Aggregate standings
        finishedMatches.forEach((match) => {
          const homeIdx = resetStandings.findIndex((s) => s.clubId === match.homeClubId);
          const awayIdx = resetStandings.findIndex((s) => s.clubId === match.awayClubId);

          if (homeIdx !== -1 && awayIdx !== -1) {
            const homeRow = resetStandings[homeIdx];
            const awayRow = resetStandings[awayIdx];

            homeRow.played += 1;
            awayRow.played += 1;

            homeRow.goalsFor += match.score.home;
            homeRow.goalsAgainst += match.score.away;
            awayRow.goalsFor += match.score.away;
            awayRow.goalsAgainst += match.score.home;

            if (match.score.home > match.score.away) {
              homeRow.won += 1;
              homeRow.points += 3;
              awayRow.lost += 1;
            } else if (match.score.home < match.score.away) {
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

        // Correct goalDifference
        resetStandings.forEach((row) => {
          row.goalDifference = row.goalsFor - row.goalsAgainst;
        });

        // Sort standings
        resetStandings.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          return b.goalsFor - a.goalsFor;
        });

        // Aggregate scorer and assist maps from match events
        const scorerMap: { [playerName: string]: { playerId: string; playerName: string; clubName: string; goals: number } } = {};
        const assistMap: { [playerName: string]: { playerId: string; playerName: string; clubName: string; assists: number } } = {};

        finishedMatches.forEach((match) => {
          match.events.forEach((ev) => {
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

        const topScorers = Object.values(scorerMap)
          .sort((a, b) => b.goals - a.goals)
          .slice(0, 15);

        const topAssists = Object.values(assistMap)
          .sort((a, b) => b.assists - a.assists)
          .slice(0, 15);

        await setDoc(champDoc.ref, {
          ...champ,
          standings: resetStandings,
          topScorers,
          topAssists
        });
      }

      addNotification(
        'Recálculo Concluído',
        'As estatísticas de atletas e tabelas de classificação foram recalculadas com sucesso.',
        'sistema'
      );
    } catch (err) {
      console.error("Error recalculating player stats:", err);
      addNotification('Erro no Recálculo', 'Ocorreu um erro ao tentar recomputar as estatísticas.', 'sistema');
    }
  };

  // One-time automatic database force-wipe on startup to satisfy the "zera tudo" request immediately
  useEffect(() => {
    const runAutoWipe = async () => {
      const alreadyWiped = safeLocalStorage.getItem('msoccer_force_wipe_v4');
      if (!alreadyWiped) {
        console.log("Auto-wipe: wiping all existing collections...");
        safeLocalStorage.setItem('msoccer_force_wipe_v4', 'true');
        await clearAllDatabase();
      }
    };
    runAutoWipe();
  }, []);

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
    // Only run this auto-update on the Admin client to avoid write conflicts
    if (user?.role !== 'Admin') {
      prevStandingsMatchesRef.current = matches;
      return;
    }

    if (prevStandingsMatchesRef.current.length === 0) {
      if (matches.length > 0) {
        prevStandingsMatchesRef.current = matches;
      }
      return;
    }

    const changedChamps = new Set<string>();

    matches.forEach((m) => {
      const prev = prevStandingsMatchesRef.current.find((p) => p.id === m.id);
      if (!prev) {
        // New match added
        if (m.status === MatchStatus.FINISHED) {
          changedChamps.add(m.championshipId);
        }
      } else {
        // Existing match updated
        const transitionedToFinished = prev.status !== MatchStatus.FINISHED && m.status === MatchStatus.FINISHED;
        const finishedScoreChanged = prev.status === MatchStatus.FINISHED && m.status === MatchStatus.FINISHED && 
          (prev.score.home !== m.score.home || prev.score.away !== m.score.away);
        const finishedStatusChanged = prev.status === MatchStatus.FINISHED && m.status !== MatchStatus.FINISHED; // Reopened!

        if (transitionedToFinished || finishedScoreChanged || finishedStatusChanged) {
          changedChamps.add(m.championshipId);
        }
      }
    });

    // Check for deleted matches
    prevStandingsMatchesRef.current.forEach((prev) => {
      const current = matches.find((m) => m.id === prev.id);
      if (!current && prev.status === MatchStatus.FINISHED) {
        // Deleted a finished match
        changedChamps.add(prev.championshipId);
      }
    });

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
            if (ev.team === 'home') {
              addNotification(
                '⚽ GOL do ' + m.homeClubName + '!',
                `${ev.player1} marca aos ${ev.minute}'! Assistência de ${ev.player2 || 'ninguém'}. Placar: ${m.homeClubName} ${m.score.home} - ${m.score.away} ${m.awayClubName}`,
                'golo'
              );
            } else if (ev.team === 'away') {
              addNotification(
                '⚽ GOL do ' + m.awayClubName + '!',
                `${ev.player1} marca aos ${ev.minute}'! Assistência de ${ev.player2 || 'ninguém'}. Placar: ${m.homeClubName} ${m.score.home} - ${m.score.away} ${m.awayClubName}`,
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
        restoreDefaultDatabase,
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
