import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MatchStatus, Club, Player, Championship, Match, MatchEvent, NewsArticle, LineupPlayer } from '../types';
import { LineChart, DonutChart } from './AdminCharts';
import {
  LayoutDashboard,
  Users,
  Shield,
  Activity,
  Award,
  Calendar,
  BarChart3,
  Newspaper,
  Grid,
  Image,
  Bell,
  FileText,
  DollarSign,
  Settings,
  Key,
  Terminal,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Clock,
  RefreshCw,
  PlusCircle,
  ShieldAlert,
  Plus,
  Trash2,
  Edit2,
  Play,
  Pause,
  RotateCcw,
  Sliders
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    clubs,
    players,
    championships,
    matches,
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
    deleteChampionship,
    clearAllChampionships,
    addNews,
    deleteNews,
    clearAllNews,
    clearAllDatabase,
    restoreDefaultDatabase,
    news,
    addNotification,
    triggerMatchEvent,
    user,
    navigateTo,
    updateUserRole
  } = useApp();

  // Selected administrative tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Form states - Match Creation
  const [homeClubId, setHomeClubId] = useState(clubs[0]?.id || '');
  const [awayClubId, setAwayClubId] = useState(clubs[1]?.id || '');
  const [leagueId, setLeagueId] = useState(championships[0]?.id || '');
  const [stadium, setStadium] = useState('');
  const [referee, setReferee] = useState('');
  const [matchDate, setMatchDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [matchTime, setMatchTime] = useState('16:00');
  const [matchPhase, setMatchPhase] = useState('Oitavos de Final');
  const [matchRound, setMatchRound] = useState(1);

  // Auto-set match round based on championship's current round when selected league changes
  useEffect(() => {
    const selectedChamp = championships.find((ch) => ch.id === leagueId);
    if (selectedChamp) {
      setMatchRound(selectedChamp.currentRound + 1 || 1);
    }
  }, [leagueId, championships]);

  // Auto-sync form select states when clubs/championships/matches load or change
  useEffect(() => {
    if (clubs.length > 0) {
      if (!homeClubId || !clubs.some(c => c.id === homeClubId)) {
        setHomeClubId(clubs[0].id);
      }
      if (!awayClubId || !clubs.some(c => c.id === awayClubId)) {
        setAwayClubId(clubs[1]?.id || clubs[0].id);
      }
    } else {
      setHomeClubId('');
      setAwayClubId('');
    }
  }, [clubs, homeClubId, awayClubId]);

  useEffect(() => {
    if (championships.length > 0) {
      if (!leagueId || !championships.some(ch => ch.id === leagueId)) {
        setLeagueId(championships[0].id);
      }
    } else {
      setLeagueId('');
    }
  }, [championships, leagueId]);

  // Match event live injector states
  const [selectedControllerMatchId, setSelectedControllerMatchId] = useState<string>(matches[0]?.id || '');

  useEffect(() => {
    if (matches.length > 0) {
      if (!selectedControllerMatchId || !matches.some(m => m.id === selectedControllerMatchId)) {
        setSelectedControllerMatchId(matches[0].id);
      }
    } else {
      setSelectedControllerMatchId('');
    }
  }, [matches, selectedControllerMatchId]);

  const activeMatchToControl = matches.find((m) => m.id === selectedControllerMatchId);
  const champOfMatch = activeMatchToControl ? championships.find(c => c.id === activeMatchToControl.championshipId) : null;
  const isCopaMatch = champOfMatch ? champOfMatch.type === 'Copa' : false;
  const isChampOfMatchEnded = champOfMatch?.status === 'Encerrado';
  const [eventType, setEventType] = useState<'Goal' | 'YellowCard' | 'RedCard' | 'Substitution'>('Goal');
  const [eventTeam, setEventTeam] = useState<'home' | 'away'>('home');
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [eventDetail, setEventDetail] = useState('');
  const [isPlayer1Custom, setIsPlayer1Custom] = useState(false);
  const [isPlayer2Custom, setIsPlayer2Custom] = useState(false);

  // Clear event player selections when team changes
  useEffect(() => {
    setPlayer1Name('');
    setPlayer2Name('');
    setIsPlayer1Custom(false);
    setIsPlayer2Custom(false);
  }, [eventTeam]);

  // Form states - Club Creation
  const [newClubName, setNewClubName] = useState('');
  const [newClubShort, setNewClubShort] = useState('');
  const [newClubCountry, setNewClubCountry] = useState('Brasil');
  const [newClubStadium, setNewClubStadium] = useState('');
  const [newClubManager, setNewClubManager] = useState('');
  const [newClubLogo, setNewClubLogo] = useState('');

  // Form states - Player Creation
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerAge, setNewPlayerAge] = useState(22);
  const [newPlayerNationality, setNewPlayerNationality] = useState('Brasil');
  const [newPlayerNumber, setNewPlayerNumber] = useState(10);
  const [newPlayerClub, setNewPlayerClub] = useState(clubs[0]?.id || '');
  const [newPlayerPosition, setNewPlayerPosition] = useState<'Goleiro' | 'Defensor' | 'Meio-campista' | 'Atacante'>('Atacante');
  const [newPlayerValue, setNewPlayerValue] = useState('€10.00M');
  const [newPlayerHeight, setNewPlayerHeight] = useState('1.80 m');
  const [newPlayerPhoto, setNewPlayerPhoto] = useState('');

  // Form states - Championship Creation
  const [newChampName, setNewChampName] = useState('');
  const [newChampType, setNewChampType] = useState<'Liga' | 'Copa' | 'Internacional'>('Liga');
  const [newChampSeason, setNewChampSeason] = useState('2026');
  const [newChampRounds, setNewChampRounds] = useState(38);
  const [newChampLogo, setNewChampLogo] = useState('');

  // Form states - News Article
  const [newsTitle, setNewsTitle] = useState('');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCat, setNewsCat] = useState<'Geral' | 'Transferência' | 'Lesão' | 'Entrevista' | 'Rumor'>('Geral');
  const [newsClubId, setNewsClubId] = useState('');
  const [newsImageUrl, setNewsImageUrl] = useState('');

  // Form states - Push Notification
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifType, setNotifType] = useState<'golo' | 'sistema' | 'noticia' | 'jogo'>('sistema');

  // States for editing club statistics
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [editWins, setEditWins] = useState(0);
  const [editDraws, setEditDraws] = useState(0);
  const [editLosses, setEditLosses] = useState(0);
  const [editGoalsScored, setEditGoalsScored] = useState(0);
  const [editGoalsConceded, setEditGoalsConceded] = useState(0);

  // States for adding a title to a club
  const [newTitleText, setNewTitleText] = useState<{[clubId: string]: string}>({});

  // States for managing championship standings
  const [editingChampStandingsId, setEditingChampStandingsId] = useState<string | null>(null);
  const [selectedClubToAddToStandings, setSelectedClubToAddToStandings] = useState<string>('');
  const [editingStandingClubId, setEditingStandingClubId] = useState<string | null>(null);
  const [editSPlayed, setEditSPlayed] = useState(0);
  const [editSWon, setEditSWon] = useState(0);
  const [editSDrawn, setEditSDrawn] = useState(0);
  const [editSLost, setEditSLost] = useState(0);
  const [editSGoalsFor, setEditSGoalsFor] = useState(0);
  const [editSGoalsAgainst, setEditSGoalsAgainst] = useState(0);
  const [editSPoints, setEditSPoints] = useState(0);
  const [editSGroup, setEditSGroup] = useState('');

  // Custom confirmation states to replace window.confirm (since iframes block them)
  const [champIdToConfirmEnd, setChampIdToConfirmEnd] = useState<string | null>(null);
  const [champIdToConfirmReopen, setChampIdToConfirmReopen] = useState<string | null>(null);
  const [isConfirmingClearAllChamps, setIsConfirmingClearAllChamps] = useState(false);
  const [isConfirmingClearAllNews, setIsConfirmingClearAllNews] = useState(false);

  // Interactive Live Admin Activities Stream
  const [activities, setActivities] = useState([
    { id: 1, title: 'Partida atualizada', desc: 'Flamengo 2 x 1 Palmeiras', time: 'há 2 minutos', color: 'bg-emerald-500' },
    { id: 2, title: 'Novo usuário cadastrado', desc: 'joaocarlos@email.com', time: 'há 5 minutos', color: 'bg-blue-500' },
    { id: 3, title: 'Notícia publicada', desc: 'Flamengo anuncia novo reforço', time: 'há 15 minutos', color: 'bg-orange-500' },
    { id: 4, title: 'Campeonato criado', desc: 'Copa do Nordeste 2025', time: 'há 30 minutos', color: 'bg-yellow-500' }
  ]);

  const addLog = (title: string, desc: string, color: string = 'bg-blue-500') => {
    setActivities((prev) => [
      { id: Date.now(), title, desc, time: 'Agora mesmo', color },
      ...prev.slice(0, 7)
    ]);
  };

  // Retrieve players associated with the active controlled match's team to reuse in the live events injector
  const getEventPlayers = () => {
    if (!activeMatchToControl) return [];
    
    // We use the active screen states for starting 11 players since they are what's currently being configured
    const startingList = eventTeam === 'home' ? homeStarting : awayStarting;
    const startingNames = new Set(startingList.map(p => p.name.trim().toLowerCase()).filter(name => name !== ''));

    const clubId = eventTeam === 'home' ? activeMatchToControl.homeClubId : activeMatchToControl.awayClubId;
    const clubPlayers = players.filter(p => p.clubId === clubId);

    const list: { name: string; number: number; source: string }[] = [];

    // 1. Add starting players from active state ("11 Inicial")
    startingList.forEach(p => {
      if (p.name && p.name.trim() !== '') {
        list.push({ name: p.name.trim(), number: p.number, source: 'Titular' });
      }
    });

    // 2. Add bench players from match lineups if any explicitly saved (legacy / backup support)
    const teamLineup = eventTeam === 'home' 
      ? activeMatchToControl.lineups?.home 
      : activeMatchToControl.lineups?.away;
    const savedBench = teamLineup?.bench ?? [];
    savedBench.forEach(p => {
      if (p.name && p.name.trim() !== '' && !startingNames.has(p.name.trim().toLowerCase())) {
        list.push({ name: p.name.trim(), number: p.number, source: 'Reserva' });
      }
    });

    // 3. Any general player registered for the club who is NOT in the starting list is a Suplente / Elenco
    clubPlayers.forEach(p => {
      if (p.name && p.name.trim() !== '' && !startingNames.has(p.name.trim().toLowerCase())) {
        const isAlreadyBench = savedBench.some(b => b.name.trim().toLowerCase() === p.name.trim().toLowerCase());
        if (!isAlreadyBench) {
          list.push({ name: p.name.trim(), number: p.number || 0, source: 'Elenco' });
        }
      }
    });

    return list;
  };

  // States for customizing match statistics
  const [statsPossessionHome, setStatsPossessionHome] = useState(50);
  const [statsShotsHome, setStatsShotsHome] = useState(0);
  const [statsShotsAway, setStatsShotsAway] = useState(0);
  const [statsShotsOnTargetHome, setStatsShotsOnTargetHome] = useState(0);
  const [statsShotsOnTargetAway, setStatsShotsOnTargetAway] = useState(0);
  const [statsBlockedShotsHome, setStatsBlockedShotsHome] = useState(0);
  const [statsBlockedShotsAway, setStatsBlockedShotsAway] = useState(0);
  const [statsSavesHome, setStatsSavesHome] = useState(0);
  const [statsSavesAway, setStatsSavesAway] = useState(0);
  const [statsPassesHome, setStatsPassesHome] = useState(0);
  const [statsPassesAway, setStatsPassesAway] = useState(0);
  const [statsPassAccuracyHome, setStatsPassAccuracyHome] = useState(0);
  const [statsPassAccuracyAway, setStatsPassAccuracyAway] = useState(0);
  const [statsFoulsHome, setStatsFoulsHome] = useState(0);
  const [statsFoulsAway, setStatsFoulsAway] = useState(0);
  const [statsCornersHome, setStatsCornersHome] = useState(0);
  const [statsCornersAway, setStatsCornersAway] = useState(0);
  const [statsCrossesHome, setStatsCrossesHome] = useState(0);
  const [statsCrossesAway, setStatsCrossesAway] = useState(0);
  const [statsDangerousAttacksHome, setStatsDangerousAttacksHome] = useState(0);
  const [statsDangerousAttacksAway, setStatsDangerousAttacksAway] = useState(0);

  // States for customizing match lineups and formations
  const [homeFormation, setHomeFormation] = useState('4-3-3');
  const [awayFormation, setAwayFormation] = useState('4-3-3');
  const [homeManager, setHomeManager] = useState('');
  const [awayManager, setAwayManager] = useState('');
  const [homeStarting, setHomeStarting] = useState<LineupPlayer[]>([]);
  const [awayStarting, setAwayStarting] = useState<LineupPlayer[]>([]);

  // Sync statistics whenever the active selected match changes
  useEffect(() => {
    if (activeMatchToControl) {
      if (activeMatchToControl.stats) {
        const s = activeMatchToControl.stats;
        setStatsPossessionHome(s.possession?.home ?? 50);
        setStatsShotsHome(s.shots?.home ?? 0);
        setStatsShotsAway(s.shots?.away ?? 0);
        setStatsShotsOnTargetHome(s.shotsOnTarget?.home ?? 0);
        setStatsShotsOnTargetAway(s.shotsOnTarget?.away ?? 0);
        setStatsBlockedShotsHome(s.blockedShots?.home ?? 0);
        setStatsBlockedShotsAway(s.blockedShots?.away ?? 0);
        setStatsSavesHome(s.saves?.home ?? 0);
        setStatsSavesAway(s.saves?.away ?? 0);
        setStatsPassesHome(s.passes?.home ?? 0);
        setStatsPassesAway(s.passes?.away ?? 0);
        setStatsPassAccuracyHome(s.passAccuracy?.home ?? 80);
        setStatsPassAccuracyAway(s.passAccuracy?.away ?? 80);
        setStatsFoulsHome(s.fouls?.home ?? 0);
        setStatsFoulsAway(s.fouls?.away ?? 0);
        setStatsCornersHome(s.corners?.home ?? 0);
        setStatsCornersAway(s.corners?.away ?? 0);
        setStatsCrossesHome(s.crosses?.home ?? 0);
        setStatsCrossesAway(s.crosses?.away ?? 0);
        setStatsDangerousAttacksHome(s.dangerousAttacks?.home ?? 0);
        setStatsDangerousAttacksAway(s.dangerousAttacks?.away ?? 0);
      }
      if (activeMatchToControl.lineups) {
        const l = activeMatchToControl.lineups;
        setHomeFormation(l.home?.formation ?? '4-3-3');
        setAwayFormation(l.away?.formation ?? '4-3-3');
        setHomeManager(l.home?.manager ?? '');
        setAwayManager(l.away?.manager ?? '');

        // Populate up to 11 players so editing a single player preserves the list
        const existingHome = l.home?.starting ?? [];
        const homeList = [...existingHome];
        while (homeList.length < 11) {
          const idx = homeList.length;
          homeList.push({
            id: `player_home_${idx}_${Date.now()}`,
            name: `Titular ${idx + 1}`,
            number: idx + 1,
            position: idx < 1 ? 'Goleiro' : idx < 5 ? 'Defensor' : idx < 8 ? 'Meio-campista' : 'Atacante'
          });
        }
        setHomeStarting(homeList);

        const existingAway = l.away?.starting ?? [];
        const awayList = [...existingAway];
        while (awayList.length < 11) {
          const idx = awayList.length;
          awayList.push({
            id: `player_away_${idx}_${Date.now()}`,
            name: `Titular ${idx + 1}`,
            number: idx + 1,
            position: idx < 1 ? 'Goleiro' : idx < 5 ? 'Defensor' : idx < 8 ? 'Meio-campista' : 'Atacante'
          });
        }
        setAwayStarting(awayList);
      }
    }
  }, [selectedControllerMatchId, activeMatchToControl]);

  // Update a single player's field in the lineup list
  const handleUpdatePlayerField = (team: 'home' | 'away', index: number, field: keyof LineupPlayer, value: any) => {
    const listSetter = team === 'home' ? setHomeStarting : setAwayStarting;
    listSetter((prev) => {
      const updated = [...prev];
      if (!updated[index]) {
        updated[index] = { id: `player_${team}_${index}_${Date.now()}`, name: '', number: index + 1, position: 'Defensor' };
      }
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Update multiple player's fields at once in the lineup list
  const handleUpdatePlayerMultipleFields = (team: 'home' | 'away', index: number, fields: Partial<LineupPlayer>) => {
    const listSetter = team === 'home' ? setHomeStarting : setAwayStarting;
    listSetter((prev) => {
      const updated = [...prev];
      if (!updated[index]) {
        updated[index] = { id: `player_${team}_${index}_${Date.now()}`, name: '', number: index + 1, position: 'Defensor' };
      }
      updated[index] = { ...updated[index], ...fields };
      return updated;
    });
  };

  // Auto fill starting lineup using players of that club
  const handleAutoFillLineup = (team: 'home' | 'away') => {
    if (!activeMatchToControl) return;
    const clubId = team === 'home' ? activeMatchToControl.homeClubId : activeMatchToControl.awayClubId;
    const clubPlayers = players.filter((p) => p.clubId === clubId);
    
    if (clubPlayers.length === 0) {
      alert('Nenhum jogador cadastrado para este clube ainda.');
      return;
    }

    const formationStr = team === 'home' ? homeFormation : awayFormation;
    const parts = (formationStr || '4-3-3').split('-').map(Number);
    let defCount = 4;
    let midCount = 3;
    let atkCount = 3;
    if (parts.length >= 3) {
      defCount = parts[0];
      atkCount = parts[parts.length - 1];
      midCount = parts.slice(1, parts.length - 1).reduce((sum, val) => sum + val, 0);
    }

    const gks = clubPlayers.filter(p => p.position === 'Goleiro');
    const defs = clubPlayers.filter(p => p.position === 'Defensor');
    const mids = clubPlayers.filter(p => p.position === 'Meio-campista');
    const atks = clubPlayers.filter(p => p.position === 'Atacante');

    const startingList: LineupPlayer[] = [];

    // 1. GK
    if (gks[0]) {
      startingList.push({ id: gks[0].id, name: gks[0].name, number: gks[0].number || 1, position: 'Goleiro' });
    } else {
      const anyPl = clubPlayers[0];
      if (anyPl) {
        startingList.push({ id: anyPl.id, name: anyPl.name, number: anyPl.number || 1, position: 'Goleiro' });
      }
    }

    // 2. DEFs
    const availableDefs = defs.filter(p => !startingList.some(s => s.id === p.id));
    availableDefs.slice(0, defCount).forEach((p, idx) => {
      startingList.push({ id: p.id, name: p.name, number: p.number || (2 + idx), position: 'Defensor' });
    });

    // 3. MIDs
    const availableMids = mids.filter(p => !startingList.some(s => s.id === p.id));
    availableMids.slice(0, midCount).forEach((p, idx) => {
      startingList.push({ id: p.id, name: p.name, number: p.number || (2 + defCount + idx), position: 'Meio-campista' });
    });

    // 4. ATKs
    const availableAtks = atks.filter(p => !startingList.some(s => s.id === p.id));
    availableAtks.slice(0, atkCount).forEach((p, idx) => {
      startingList.push({ id: p.id, name: p.name, number: p.number || (2 + defCount + midCount + idx), position: 'Atacante' });
    });

    // Fill up remaining spots if we are under 11
    while (startingList.length < 11) {
      const idx = startingList.length;
      const unused = clubPlayers.find(p => !startingList.some(s => s.id === p.id));
      
      let neededPosition = 'Defensor';
      if (idx === 0) {
        neededPosition = 'Goleiro';
      } else if (idx < 1 + defCount) {
        neededPosition = 'Defensor';
      } else if (idx < 1 + defCount + midCount) {
        neededPosition = 'Meio-campista';
      } else {
        neededPosition = 'Atacante';
      }

      if (unused) {
        startingList.push({ id: unused.id, name: unused.name, number: unused.number || (idx + 1), position: neededPosition });
      } else {
        startingList.push({ id: `placeholder_${team}_${idx}_${Date.now()}`, name: `Atleta ${idx + 1}`, number: idx + 1, position: neededPosition });
      }
    }

    if (team === 'home') {
      setHomeStarting(startingList.slice(0, 11));
    } else {
      setAwayStarting(startingList.slice(0, 11));
    }
  };

  const handleSaveMatchLineups = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatchToControl) return;

    const updatedMatch: Match = {
      ...activeMatchToControl,
      lineups: {
        home: {
          formation: homeFormation,
          manager: homeManager || activeMatchToControl.lineups?.home?.manager || '',
          starting: homeStarting.length > 0 ? homeStarting : (activeMatchToControl.lineups?.home?.starting ?? []),
          bench: activeMatchToControl.lineups?.home?.bench ?? [],
        },
        away: {
          formation: awayFormation,
          manager: awayManager || activeMatchToControl.lineups?.away?.manager || '',
          starting: awayStarting.length > 0 ? awayStarting : (activeMatchToControl.lineups?.away?.starting ?? []),
          bench: activeMatchToControl.lineups?.away?.bench ?? [],
        }
      }
    };

    updateMatch(updatedMatch);
    addLog('Estratégia editada', `Esquema tático de ${activeMatchToControl.homeClubShortName} (${homeFormation}) x ${activeMatchToControl.awayClubShortName} (${awayFormation}) salvo com sucesso!`, 'bg-indigo-600');
    addNotification('Esquemas Atualizados', `Esquema tático atualizado para ${homeFormation} x ${awayFormation}!`, 'jogo');
  };

  // Handler to persist statistics in the app database/context
  const handleSaveMatchStats = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatchToControl) return;

    const updatedMatch: Match = {
      ...activeMatchToControl,
      stats: {
        possession: { home: statsPossessionHome, away: 100 - statsPossessionHome },
        shots: { home: statsShotsHome, away: statsShotsAway },
        shotsOnTarget: { home: statsShotsOnTargetHome, away: statsShotsOnTargetAway },
        passes: { home: statsPassesHome, away: statsPassesAway },
        passAccuracy: { home: statsPassAccuracyHome, away: statsPassAccuracyAway },
        crosses: { home: statsCrossesHome, away: statsCrossesAway },
        corners: { home: statsCornersHome, away: statsCornersAway },
        fouls: { home: statsFoulsHome, away: statsFoulsAway },
        saves: { home: statsSavesHome, away: statsSavesAway },
        blockedShots: { home: statsBlockedShotsHome, away: statsBlockedShotsAway },
        dangerousAttacks: { home: statsDangerousAttacksHome, away: statsDangerousAttacksAway }
      }
    };

    updateMatch(updatedMatch);
    addLog('Estatísticas personalizadas', `Estatísticas de ${activeMatchToControl.homeClubShortName} x ${activeMatchToControl.awayClubShortName} atualizadas com sucesso!`, 'bg-indigo-600');
    addNotification('Estatísticas Gravadas', `As estatísticas de ${activeMatchToControl.homeClubName} vs ${activeMatchToControl.awayClubName} foram personalizadas!`, 'jogo');
  };

  // Block unauthorized users
  if (user?.role !== 'Admin') {
    return (
      <div className="max-w-md mx-auto px-4 pt-20 text-center space-y-6">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto animate-pulse" />
        <h2 className="text-xl font-black text-white">Painel de Administração</h2>
        <p className="text-sm text-zinc-400">
          Este painel é restrito. Digite a senha correta de administrador para acessar o painel:
        </p>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <input
            type="password"
            placeholder="Senha de Administrador"
            value={adminPassword}
            onChange={(e) => {
              setAdminPassword(e.target.value);
              setAdminError('');
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 text-white text-center"
          />
          <button
            onClick={async () => {
              if (adminPassword === 'djuma94') {
                setAdminError('');
                await updateUserRole('Admin');
              } else {
                setAdminError('Senha incorreta!');
              }
            }}
            className="w-full py-3 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-xl font-bold text-sm cursor-pointer transition-all shadow-md"
          >
            Acessar Painel
          </button>
          {adminError && (
            <p className="text-xs text-rose-500 font-semibold">{adminError}</p>
          )}
        </div>
        <button
          onClick={() => navigateTo({ type: 'profile' })}
          className="text-xs text-zinc-500 underline hover:text-zinc-300 cursor-pointer"
        >
          Voltar para o Perfil
        </button>
      </div>
    );
  }

  // Sidebar List
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'clubs', label: 'Clubes', icon: Shield },
    { id: 'players', label: 'Jogadores', icon: Activity },
    { id: 'leagues', label: 'Campeonatos', icon: Award },
    { id: 'matches', label: 'Partidas', icon: Calendar },
    { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
    { id: 'news', label: 'Notícias', icon: Newspaper },
    { id: 'escalacoes', label: 'Escalações', icon: Grid },
    { id: 'banners', label: 'Banners', icon: Image },
    { id: 'notifs', label: 'Notificações', icon: Bell },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
    { id: 'permissoes', label: 'Permissões', icon: Key },
    { id: 'logs', label: 'Logs do Sistema', icon: Terminal },
  ];

  // Actions
  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (homeClubId === awayClubId) {
      alert("Erro: O clube mandante (Casa) não pode ser o mesmo que o visitante (Fora)!");
      return;
    }

    const homeClub = clubs.find((c) => c.id === homeClubId);
    const awayClub = clubs.find((c) => c.id === awayClubId);
    const league = championships.find((ch) => ch.id === leagueId);

    if (!homeClub || !awayClub || !league) {
      alert("Erro: Certifique-se de que selecionou clubes e campeonatos válidos!");
      return;
    }

    const newM: Match = {
      id: 'match_' + Date.now(),
      championshipId: leagueId,
      championshipName: league.name,
      round: matchRound,
      phase: league.type === 'Copa' ? matchPhase : undefined,
      homeClubId,
      homeClubName: homeClub.name,
      homeClubLogo: homeClub.logoUrl,
      awayClubId,
      awayClubName: awayClub.name,
      awayClubLogo: awayClub.logoUrl,
      stadium: stadium || homeClub.stadium,
      referee: referee || 'Árbitro FIFA',
      date: matchDate,
      time: matchTime,
      minute: 0,
      status: MatchStatus.SCHEDULED,
      score: { home: 0, away: 0 },
      events: [],
      stats: {
        possession: { home: 0, away: 0 }, shots: { home: 0, away: 0 }, shotsOnTarget: { home: 0, away: 0 },
        passes: { home: 0, away: 0 }, passAccuracy: { home: 0, away: 0 }, crosses: { home: 0, away: 0 },
        corners: { home: 0, away: 0 }, fouls: { home: 0, away: 0 }, saves: { home: 0, away: 0 },
        blockedShots: { home: 0, away: 0 }, dangerousAttacks: { home: 0, away: 0 }
      },
      lineups: {
        home: { formation: '4-3-3', starting: [], bench: [], manager: homeClub.manager },
        away: { formation: '4-3-3', starting: [], bench: [], manager: awayClub.manager }
      }
    };

    addMatch(newM);
    addNotification('Nova Partida Criada', `${homeClub.name} x ${awayClub.name} agendada para ${matchDate}.`, 'jogo');
    addLog('Partida cadastrada', `${homeClub.shortName} x ${awayClub.shortName}`, 'bg-emerald-500');
    setStadium('');
    setReferee('');
  };

  const handleScoreInput = (team: 'home' | 'away', value: string) => {
    if (!activeMatchToControl) return;
    const numericValue = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(numericValue) || numericValue < 0) return;
    const updated = { ...activeMatchToControl };
    if (team === 'home') {
      updated.score.home = numericValue;
    } else {
      updated.score.away = numericValue;
    }
    updateMatch(updated);
    addLog('Placar Alterado Manualmente', `${activeMatchToControl.homeClubName} ${updated.score.home} x ${updated.score.away} ${activeMatchToControl.awayClubName}`, 'bg-indigo-500');
  };

  const handleStatusChange = (newStatus: MatchStatus) => {
    if (!activeMatchToControl) return;
    const updated = { ...activeMatchToControl, status: newStatus };
    if (newStatus === MatchStatus.LIVE && updated.minute === 0) {
      updated.minute = 1;
    }
    updateMatch(updated);
    addNotification('Partida Atualizada', `${updated.homeClubName} vs ${updated.awayClubName} está ${newStatus}`, 'jogo');
    addLog('Status de Jogo alterado', `${updated.homeClubShortName} x ${updated.awayClubShortName} -> ${newStatus}`, 'bg-blue-500');
  };

  const handleCustomEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatchToControl || !player1Name) return;

    triggerMatchEvent(activeMatchToControl.id, {
      minute: activeMatchToControl.minute || 1,
      type: eventType,
      team: eventTeam,
      player1: player1Name,
      player2: player2Name || undefined,
      detail: eventDetail || undefined
    });

    addLog(`Evento lançado: ${eventType}`, `${player1Name} (${eventTeam === 'home' ? 'Mandante' : 'Visitante'})`, 'bg-amber-500');
    setPlayer1Name('');
    setPlayer2Name('');
    setEventDetail('');
    setIsPlayer1Custom(false);
    setIsPlayer2Custom(false);
  };

  const handleBroadcastNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifBody) return;
    addNotification(notifTitle, notifBody, notifType);
    addLog('Notificação em Massa', notifTitle, 'bg-purple-500');
    setNotifTitle('');
    setNotifBody('');
  };

  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName || !newClubShort) return;

    const newC: Club = {
      id: newClubName.toLowerCase().replace(/\s+/g, '_'),
      name: newClubName,
      shortName: newClubShort.toUpperCase(),
      logoUrl: newClubLogo || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(newClubName)}`,
      country: newClubCountry,
      founded: '2026',
      stadium: newClubStadium || 'Arena mSoccer',
      manager: newClubManager || 'Treinador',
      titles: [],
      stats: { wins: 0, draws: 0, losses: 0, goalsScored: 0, goalsConceded: 0 }
    };

    addClub(newC);
    addLog('Novo clube adicionado', newClubName, 'bg-indigo-500');
    setNewClubName('');
    setNewClubShort('');
    setNewClubStadium('');
    setNewClubManager('');
    setNewClubLogo('');
  };

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName || !newPlayerClub) return;

    const club = clubs.find((c) => c.id === newPlayerClub);
    const newP: Player = {
      id: 'p_' + Date.now(),
      name: newPlayerName,
      photoUrl: newPlayerPhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(newPlayerName)}`,
      age: Number(newPlayerAge),
      nationality: newPlayerNationality,
      clubId: newPlayerClub,
      clubName: club?.name || 'Sem Clube',
      number: Number(newPlayerNumber),
      position: newPlayerPosition,
      marketValue: newPlayerValue,
      height: newPlayerHeight,
      stats: { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0 },
      history: []
    };

    addPlayer(newP);
    addLog('Atleta cadastrado', `${newPlayerName} -> ${club?.name}`, 'bg-teal-500');
    setNewPlayerName('');
    setNewPlayerPhoto('');
    setNewPlayerHeight('1.80 m');
  };

  const handleCreateChampionship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChampName) return;

    const newChamp: Championship = {
      id: 'champ_' + Date.now(),
      name: newChampName,
      logoUrl: newChampLogo || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(newChampName)}`,
      type: newChampType,
      season: newChampSeason,
      roundsCount: Number(newChampRounds),
      currentRound: 0,
      standings: [],
      regulations: 'Regulamento padrão',
      topScorers: [],
      topAssists: []
    };

    addChampionship(newChamp);
    addLog('Campeonato criado', newChampName, 'bg-yellow-500');
    setNewChampName('');
    setNewChampLogo('');
  };

  const handlePublishNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle || !newsContent) return;

    const associatedClub = clubs.find((c) => c.id === newsClubId);
    const defaultImage = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop&q=80';
    const newN: NewsArticle = {
      id: 'news_' + Date.now(),
      title: newsTitle,
      summary: newsSummary || newsContent.slice(0, 100) + '...',
      content: newsContent,
      imageUrl: newsImageUrl.trim() || defaultImage,
      category: newsCat,
      clubId: newsClubId || undefined,
      clubName: associatedClub?.name || undefined,
      publishedAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      views: 0
    };

    addNews(newN);
    addLog('Notícia publicada', newsTitle, 'bg-orange-500');
    setNewsTitle('');
    setNewsSummary('');
    setNewsContent('');
    setNewsImageUrl('');
  };

  const handleStartEditingClubStats = (club: Club) => {
    setEditingClubId(club.id);
    setEditWins(club.stats?.wins ?? 0);
    setEditDraws(club.stats?.draws ?? 0);
    setEditLosses(club.stats?.losses ?? 0);
    setEditGoalsScored(club.stats?.goalsScored ?? 0);
    setEditGoalsConceded(club.stats?.goalsConceded ?? 0);
  };

  const handleSaveClubStats = (clubId: string) => {
    const club = clubs.find((c) => c.id === clubId);
    if (!club) return;
    const updatedClub: Club = {
      ...club,
      stats: {
        wins: Number(editWins),
        draws: Number(editDraws),
        losses: Number(editLosses),
        goalsScored: Number(editGoalsScored),
        goalsConceded: Number(editGoalsConceded),
      }
    };
    updateClub(updatedClub);
    addLog('Estatísticas do clube atualizadas', club.name, 'bg-emerald-500');
    setEditingClubId(null);
  };

  const handleAddClubTitle = (clubId: string, title: string) => {
    if (!title.trim()) return;
    const club = clubs.find(c => c.id === clubId);
    if (!club) return;
    
    const currentTitles = club.titles || [];
    if (currentTitles.includes(title.trim())) return;
    
    const updatedClub: Club = {
      ...club,
      titles: [...currentTitles, title.trim()]
    };
    
    updateClub(updatedClub);
    addLog('Título adicionado ao clube', `${club.name}: ${title.trim()}`, 'bg-emerald-500');
    setNewTitleText(prev => ({ ...prev, [clubId]: '' }));
  };

  const handleRemoveClubTitle = (clubId: string, titleIndex: number) => {
    const club = clubs.find(c => c.id === clubId);
    if (!club) return;
    
    const currentTitles = club.titles || [];
    const updatedTitles = currentTitles.filter((_, idx) => idx !== titleIndex);
    
    const updatedClub: Club = {
      ...club,
      titles: updatedTitles
    };
    
    updateClub(updatedClub);
    addLog('Título removido do clube', `${club.name}`, 'bg-rose-500');
  };

  const handleStartEditingStandingRow = (row: any) => {
    setEditingStandingClubId(row.clubId);
    setEditSPlayed(row.played);
    setEditSWon(row.won);
    setEditSDrawn(row.drawn);
    setEditSLost(row.lost);
    setEditSGoalsFor(row.goalsFor);
    setEditSGoalsAgainst(row.goalsAgainst);
    setEditSPoints(row.points);
    setEditSGroup(row.group || '');
  };

  const handleSaveStandingRow = (champId: string, clubId: string) => {
    const champ = championships.find((c) => c.id === champId);
    if (!champ) return;

    const updatedStandings = champ.standings.map((row) => {
      if (row.clubId === clubId) {
        return {
          ...row,
          played: Number(editSPlayed),
          won: Number(editSWon),
          drawn: Number(editSDrawn),
          lost: Number(editSLost),
          goalsFor: Number(editSGoalsFor),
          goalsAgainst: Number(editSGoalsAgainst),
          goalDifference: Number(editSGoalsFor) - Number(editSGoalsAgainst),
          points: Number(editSPoints),
          group: editSGroup.trim() || undefined,
        };
      }
      return row;
    });

    // Sort standings
    updatedStandings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    const updatedChamp: Championship = {
      ...champ,
      standings: updatedStandings
    };

    updateChampionship(updatedChamp);
    addLog('Classificação atualizada', champ.name, 'bg-emerald-500');
    setEditingStandingClubId(null);
  };

  const handleAddClubToStandings = (champId: string) => {
    const champ = championships.find((c) => c.id === champId);
    if (!champ || !selectedClubToAddToStandings) return;

    const club = clubs.find((c) => c.id === selectedClubToAddToStandings);
    if (!club) return;

    // Check if club already exists in standings
    if (champ.standings.some((row) => row.clubId === club.id)) {
      return;
    }

    const newRow = {
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
      points: 0,
    };

    const updatedChamp: Championship = {
      ...champ,
      standings: [...champ.standings, newRow]
    };

    updateChampionship(updatedChamp);
    addLog('Clube adicionado à classificação', `${club.name} -> ${champ.name}`, 'bg-blue-500');
    setSelectedClubToAddToStandings('');
  };

  const handleRemoveClubFromStandings = (champId: string, clubId: string) => {
    const champ = championships.find((c) => c.id === champId);
    if (!champ) return;

    const updatedChamp: Championship = {
      ...champ,
      standings: champ.standings.filter((row) => row.clubId !== clubId)
    };

    updateChampionship(updatedChamp);
    addLog('Clube removido da classificação', champ.name, 'bg-rose-500');
  };

  // Searching filters
  const filteredMatches = matches.filter((m) =>
    m.homeClubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.awayClubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.championshipName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClubs = clubs.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.shortName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.clubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#0b0f19] text-zinc-300 font-sans antialiased overflow-hidden">
      {/* 1. LEFT SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex w-64 bg-[#0F172A] border-r border-slate-800 flex-col justify-between select-none h-full shrink-0">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 space-x-2">
            <span className="text-xl font-black text-white tracking-wider flex items-center">
              m<span className="text-emerald-500">Soccer</span>⚽
            </span>
          </div>

          {/* User Profile */}
          <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-900/40">
            <img
              src={user?.photoUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix'}
              alt="Admin"
              className="w-10 h-10 rounded-full border border-emerald-500 p-0.5 bg-slate-800"
            />
            <div>
              <p className="text-xs font-black text-white truncate max-w-[130px]">{user?.name || 'Administrador'}</p>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Super Admin</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-190px)] scrollbar-none">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500 font-black'
                      : 'text-zinc-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Exit Button */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => navigateTo({ type: 'profile' })}
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* 1b. MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col justify-between h-full p-4 animate-slide-in">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-lg font-black text-white">mSoccer⚽</span>
                <button onClick={() => setSidebarOpen(false)} className="text-zinc-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-4 space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-none">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                        isActive ? 'bg-emerald-500/10 text-emerald-400 font-black' : 'text-zinc-400 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <button
              onClick={() => navigateTo({ type: 'profile' })}
              className="w-full flex items-center justify-center space-x-2 py-2 bg-rose-500/10 text-rose-400 rounded-xl text-xs font-bold"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair do Painel</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0b0f19]">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-3 sm:px-6 bg-[#0F172A] shrink-0">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-white mr-1">
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-black text-emerald-500 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Painel Administrativo
            </span>
          </div>

          {/* Search bar inside header (actually controls state filters!) */}
          <div className="relative hidden md:block">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar partidas, clubes ou jogadores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 bg-slate-900/80 border border-slate-800 text-xs pl-10 pr-4 py-2 rounded-xl text-zinc-300 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* User Right Stats */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-[9px] text-white font-black rounded-full flex items-center justify-center border border-[#0b0f19]">
                8
              </span>
              <Bell className="w-4 h-4 text-zinc-400 cursor-pointer hover:text-white" />
            </div>

            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <img
                src={user?.photoUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix'}
                alt=""
                className="w-7 h-7 rounded-full object-cover"
              />
              <span className="text-xs font-bold text-zinc-300 hidden sm:block">Admin</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            </div>
          </div>
        </header>

        {/* Tab Viewport */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6 scrollbar-thin">
          {/* SEARCH BAR (Mobile version) */}
          <div className="relative md:hidden block w-full mb-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-xs pl-9 pr-3 py-2.5 rounded-xl text-zinc-300 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* DASHBOARD TAB VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Dashboard Banner Title */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <LayoutDashboard className="w-6 h-6 text-emerald-400" />
                    <h2 className="text-xl font-black text-white tracking-tight">Dashboard</h2>
                  </div>
                  <p className="text-xs text-zinc-500">Visão geral do sistema mSoccer</p>
                </div>

                {/* Date selector */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-1.5 flex items-center space-x-2 text-[10.5px] font-black text-zinc-400 select-none">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Painel do Administrador</span>
                </div>
              </div>

              {/* Quick Actions Grid (Beautiful, responsive, 6-columns) */}
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="pb-2 border-b border-slate-800/60">
                  <span className="text-xs font-black uppercase text-zinc-400">⚡ Ações Rápidas de Gerenciamento</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <button
                    onClick={() => setActiveTab('leagues')}
                    className="flex flex-col items-center justify-center p-4 border border-slate-800 bg-slate-900/20 rounded-xl hover:bg-slate-800 hover:border-emerald-500/30 text-xs font-bold transition-all text-center space-y-2 group cursor-pointer"
                  >
                    <span className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all text-lg">🏆</span>
                    <span>Novo Campeonato</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('clubs')}
                    className="flex flex-col items-center justify-center p-4 border border-slate-800 bg-slate-900/20 rounded-xl hover:bg-slate-800 hover:border-emerald-500/30 text-xs font-bold transition-all text-center space-y-2 group cursor-pointer"
                  >
                    <span className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all text-lg">🛡️</span>
                    <span>Novo Clube</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('matches')}
                    className="flex flex-col items-center justify-center p-4 border border-slate-800 bg-slate-900/20 rounded-xl hover:bg-slate-800 hover:border-emerald-500/30 text-xs font-bold transition-all text-center space-y-2 group cursor-pointer"
                  >
                    <span className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all text-lg">⚽</span>
                    <span>Nova Partida</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('players')}
                    className="flex flex-col items-center justify-center p-4 border border-slate-800 bg-slate-900/20 rounded-xl hover:bg-slate-800 hover:border-emerald-500/30 text-xs font-bold transition-all text-center space-y-2 group cursor-pointer"
                  >
                    <span className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all text-lg">🏃</span>
                    <span>Novo Jogador</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('news')}
                    className="flex flex-col items-center justify-center p-4 border border-slate-800 bg-slate-900/20 rounded-xl hover:bg-slate-800 hover:border-emerald-500/30 text-xs font-bold transition-all text-center space-y-2 group cursor-pointer"
                  >
                    <span className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all text-lg">📰</span>
                    <span>Publicar Notícia</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('notifs')}
                    className="flex flex-col items-center justify-center p-4 border border-slate-800 bg-slate-900/20 rounded-xl hover:bg-slate-800 hover:border-purple-500/30 text-xs font-bold transition-all text-center space-y-2 group cursor-pointer"
                  >
                    <span className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-all text-lg">🚀</span>
                    <span>Enviar Notificação</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone / Reset Database Section */}
              <div className="bg-[#0F172A] border border-red-950/40 rounded-2xl p-6 space-y-4">
                <div className="pb-2 border-b border-red-950/30 flex items-center space-x-2">
                  <span className="text-xs font-black uppercase text-red-400">⚠️ Zona de Gestão de Dados</span>
                </div>
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-red-950/10 border border-red-900/30 rounded-xl p-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-red-200">Zerar Todo o Aplicativo</h4>
                    <p className="text-[11px] text-zinc-400 max-w-2xl">
                      Esta ação irá excluir permanentemente todos os campeonatos, partidas registradas, clubes, jogadores cadastrados, notícias e mensagens de conversas do chat da comunidade. O sistema voltará ao estado completamente vazio.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (window.confirm("ATENÇÃO: Você tem certeza absoluta que deseja zerar TODOS os dados do aplicativo? Esta ação não pode ser desfeita e excluirá ligas, partidas, notícias, chats e times.")) {
                        await clearAllDatabase();
                      }
                    }}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black rounded-xl cursor-pointer transition-all shrink-0"
                  >
                    Excluir e Zerar Tudo
                  </button>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-emerald-950/10 border border-emerald-900/30 rounded-xl p-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-emerald-200">Restaurar Dados de Demonstração</h4>
                    <p className="text-[11px] text-zinc-400 max-w-2xl">
                      Se você limpou o banco de dados e deseja restaurar instantaneamente todos os campeonatos, clubes moçambicanos/europeus, jogadores, partidas de exemplo e notícias originais para fins de demonstração, use esta opção.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (window.confirm("Deseja restaurar os dados de demonstração iniciais? Isto adicionará os campeonatos, clubes, jogadores e partidas padrão.")) {
                        await restoreDefaultDatabase();
                      }
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl cursor-pointer transition-all shrink-0"
                  >
                    Restaurar Dados Padrão
                  </button>
                </div>
              </div>

              {/* Bottom Section: Recent Matches Table & Recent Activities */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Table of Latest Matches */}
                <div className="lg:col-span-8 bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="pb-2 border-b border-slate-800/60">
                    <span className="text-xs font-black uppercase text-zinc-400">Últimas Partidas</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-zinc-500 font-extrabold border-b border-slate-800/80">
                          <th className="py-2.5">Partida</th>
                          <th className="py-2.5">Campeonato</th>
                          <th className="py-2.5">Data</th>
                          <th className="py-2.5">Status</th>
                          <th className="py-2.5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {filteredMatches.slice(0, 5).map((m) => (
                          <tr key={m.id} className="hover:bg-slate-800/20">
                            <td className="py-3 flex items-center space-x-2">
                              <img src={m.homeClubLogo} alt="" className="w-5 h-5 rounded-full" />
                              <span className="font-bold text-zinc-100">{m.homeClubName}</span>
                              <span className="font-mono px-1.5 py-0.5 bg-slate-900 rounded font-black text-emerald-400">
                                {m.score.home} x {m.score.away}
                              </span>
                              <span className="font-bold text-zinc-100">{m.awayClubName}</span>
                              <img src={m.awayClubLogo} alt="" className="w-5 h-5 rounded-full" />
                            </td>
                            <td className="py-3 text-zinc-400 font-medium">{m.championshipName}</td>
                            <td className="py-3 text-zinc-400 font-mono text-[11px]">{m.date} {m.time}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                m.status === MatchStatus.LIVE
                                  ? 'bg-rose-500/10 text-rose-400 animate-pulse'
                                  : 'bg-emerald-500/10 text-emerald-400'
                              }`}>
                                {m.status}
                              </span>
                            </td>
                            <td className="py-3 text-right space-x-1.5 shrink-0">
                              {(() => {
                                const isMatchChampEnded = championships.find(c => c.id === m.championshipId)?.status === 'Encerrado';
                                return (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedControllerMatchId(m.id);
                                        setActiveTab('matches');
                                      }}
                                      title={isMatchChampEnded ? "Ver estatísticas da partida" : "Operar partida ao vivo"}
                                      className="p-1 hover:bg-slate-800 rounded text-emerald-400 cursor-pointer"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      disabled={isMatchChampEnded}
                                      onClick={() => {
                                        if (!isMatchChampEnded) {
                                          deleteMatch(m.id);
                                        }
                                      }}
                                      title={isMatchChampEnded ? "Não é possível excluir partidas de campeonatos encerrados" : "Excluir partida"}
                                      className="p-1 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded text-rose-500 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={() => setActiveTab('matches')}
                    className="w-full text-center py-2 border border-slate-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-slate-800/30 transition-all mt-2"
                  >
                    Ver todas as partidas
                  </button>
                </div>

                {/* Recent Activity List */}
                <div className="lg:col-span-4 bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="pb-2 border-b border-slate-800/60">
                    <span className="text-xs font-black uppercase text-zinc-400">Atividades Recentes</span>
                  </div>
                  <div className="space-y-4">
                    {activities.map((act) => (
                      <div key={act.id} className="flex items-start space-x-3 text-xs leading-normal">
                        <span className={`w-2 h-2 rounded-full ${act.color} mt-1.5 shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h4 className="font-bold text-zinc-200 truncate">{act.title}</h4>
                            <span className="text-[9px] text-zinc-500 font-mono shrink-0">{act.time}</span>
                          </div>
                          <p className="text-zinc-400 text-[11px] truncate">{act.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('logs')}
                    className="w-full text-center py-2 border border-slate-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-slate-800/30 transition-all mt-2"
                  >
                    Ver todas as atividades
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PARTIDAS (MATCHES) TAB VIEW */}
          {activeTab === 'matches' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center space-x-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Voltar para o Dashboard</span>
                </button>
              </div>

              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-3 sm:p-5 space-y-4">
                <h3 className="text-sm font-black text-white uppercase border-b border-slate-800 pb-2">
                  🎮 Controlador Real-Time de Jogo Ativo
                </h3>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Selecione o Jogo para Operar</label>
                  <select
                    value={selectedControllerMatchId}
                    onChange={(e) => setSelectedControllerMatchId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-2.5 text-white"
                  >
                    {matches.map((m) => (
                      <option key={m.id} value={m.id}>
                        [{m.status}] {m.homeClubName} vs {m.awayClubName} ({m.championshipName})
                      </option>
                    ))}
                  </select>
                </div>

                {activeMatchToControl ? (
                  <div className="border border-slate-800 p-2.5 sm:p-4 rounded-xl space-y-4 bg-slate-900/40">
                    {isChampOfMatchEnded && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-400 text-xs space-y-1.5 animate-fade-in">
                        <p className="font-bold flex items-center space-x-1.5">
                          <span>🔒 Partida de Campeonato Encerrado</span>
                        </p>
                        <p>Esta partida pertence ao campeonato <strong>{activeMatchToControl.championshipName}</strong>, que foi finalizado e encerrado. Todos os resultados, placares e estatísticas estão congelados e guardados para histórico de forma definitiva. Se desejar reajustar estes dados, por favor, mude o status do campeonato correspondente para "Ativo" na aba de Campeonatos.</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-emerald-400">Jogo Selecionado: Rodada</span>
                        {isChampOfMatchEnded ? (
                          <span className="text-xs font-black text-white">{activeMatchToControl.round}</span>
                        ) : (
                          <input
                            type="number"
                            min="1"
                            value={activeMatchToControl.round}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 1;
                              updateMatch({ ...activeMatchToControl, round: val });
                            }}
                            className="w-12 bg-slate-900 border border-slate-800 text-xs rounded px-1.5 py-0.5 text-center font-bold text-white"
                          />
                        )}
                      </div>
                      {!isChampOfMatchEnded && (
                        <div className="flex flex-wrap gap-1.5">
                          {[MatchStatus.SCHEDULED, MatchStatus.LIVE, MatchStatus.HT, MatchStatus.FINISHED].map((st) => (
                            <button
                              key={st}
                              onClick={() => handleStatusChange(st)}
                              className={`px-3 py-1 rounded text-[10px] font-black uppercase transition-colors ${
                                activeMatchToControl.status === st
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-800 text-zinc-400 hover:bg-slate-700'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Controladores Rápidos */}
                    {!isChampOfMatchEnded && (
                      <div className="bg-slate-950/60 p-2.5 sm:p-4 rounded-xl border border-slate-800/60 space-y-3">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">
                          ⚡ Controles do Cronômetro & Estado (Iniciar / Pausar / Retomar / Reiniciar)
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {activeMatchToControl.status === MatchStatus.SCHEDULED && (
                            <button
                              type="button"
                              onClick={() => {
                                const updatedMatch: Match = {
                                  ...activeMatchToControl,
                                  status: MatchStatus.LIVE,
                                  minute: 1,
                                  isPaused: false,
                                  score: { home: 0, away: 0 },
                                  events: [
                                    {
                                      id: 'ev_init_' + Date.now(),
                                      minute: 1,
                                      type: 'KickOff',
                                      team: 'neutral',
                                      player1: 'Início da Partida',
                                      detail: `Bola rolando para ${activeMatchToControl.homeClubName} x ${activeMatchToControl.awayClubName}!`
                                    }
                                  ]
                                };
                                updateMatch(updatedMatch);
                                addLog('Partida Iniciada', `${activeMatchToControl.homeClubName} x ${activeMatchToControl.awayClubName}`, 'bg-emerald-500');
                              }}
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer border border-emerald-500/20"
                            >
                              <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                              <span>Iniciar Jogo</span>
                            </button>
                          )}

                          {activeMatchToControl.status === MatchStatus.LIVE && (
                            <>
                              {activeMatchToControl.isPaused ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedMatch: Match = {
                                      ...activeMatchToControl,
                                      isPaused: false
                                    };
                                    updateMatch(updatedMatch);
                                    addLog('Partida Retomada', `${activeMatchToControl.homeClubName} x ${activeMatchToControl.awayClubName}`, 'bg-emerald-500');
                                  }}
                                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer border border-emerald-500/20"
                                >
                                  <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                                  <span>Retomar</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedMatch: Match = {
                                      ...activeMatchToControl,
                                      isPaused: true
                                    };
                                    updateMatch(updatedMatch);
                                    addLog('Partida Pausada', `${activeMatchToControl.homeClubName} x ${activeMatchToControl.awayClubName}`, 'bg-amber-500');
                                  }}
                                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer border border-amber-500/20"
                                >
                                  <Pause className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  <span>Pausar</span>
                                </button>
                              )}
                            </>
                          )}

                          {activeMatchToControl.status === MatchStatus.HT && (
                            <button
                              type="button"
                              onClick={() => {
                                const updatedMatch: Match = {
                                  ...activeMatchToControl,
                                  status: MatchStatus.LIVE,
                                  minute: 46,
                                  isPaused: false,
                                  events: [
                                    ...activeMatchToControl.events,
                                    {
                                      id: 'ev_2h_' + Date.now(),
                                      minute: 46,
                                      type: 'KickOff',
                                      team: 'neutral',
                                      player1: 'Início do 2º Tempo',
                                      detail: 'Bola rolando para a etapa final!'
                                    }
                                  ]
                                };
                                updateMatch(updatedMatch);
                                addLog('Segundo Tempo Iniciado', `${activeMatchToControl.homeClubName} x ${activeMatchToControl.awayClubName}`, 'bg-emerald-500');
                              }}
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer border border-emerald-500/20"
                            >
                              <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                              <span>Retomar (2º Tempo)</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const updatedMatch: Match = {
                                ...activeMatchToControl,
                                status: MatchStatus.LIVE,
                                minute: 0,
                                isPaused: false,
                                score: { home: 0, away: 0 },
                                events: [
                                  {
                                    id: 'ev_init_' + Date.now(),
                                    minute: 0,
                                    type: 'KickOff',
                                    team: 'neutral',
                                    player1: 'Partida Reiniciada',
                                    detail: `O cronômetro e placar foram reiniciados para ${activeMatchToControl.homeClubName} x ${activeMatchToControl.awayClubName}!`
                                  }
                                ]
                              };
                              updateMatch(updatedMatch);
                              addLog('Partida Reiniciada', `${activeMatchToControl.homeClubName} x ${activeMatchToControl.awayClubName}`, 'bg-rose-500');
                            }}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer border border-rose-500/20"
                          >
                            <RotateCcw className="w-3 h-3 text-rose-400" />
                            <span>Reiniciar Jogo</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Interactive scoring and timing */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                        <p className="font-bold text-xs truncate text-zinc-200">{activeMatchToControl.homeClubName}</p>
                        <div className="flex justify-center items-center">
                          <input
                            type="number"
                            min="0"
                            disabled={isChampOfMatchEnded}
                            value={activeMatchToControl.score.home}
                            onChange={(e) => handleScoreInput('home', e.target.value)}
                            className="w-20 text-center font-mono text-3xl font-black bg-slate-950 border border-slate-800 text-white rounded-lg py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                        <p className="font-bold text-xs truncate text-zinc-200">{activeMatchToControl.awayClubName}</p>
                        <div className="flex justify-center items-center">
                          <input
                            type="number"
                            min="0"
                            disabled={isChampOfMatchEnded}
                            value={activeMatchToControl.score.away}
                            onChange={(e) => handleScoreInput('away', e.target.value)}
                            className="w-20 text-center font-mono text-3xl font-black bg-slate-950 border border-slate-800 text-white rounded-lg py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Extra Time and Penalty shootouts (Copa/Eliminatória options) */}
                    {isCopaMatch && (
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center space-x-1.5">
                            <span>🏆</span>
                            <span>Regras de Copa / Eliminatórias</span>
                          </span>
                          <div className="flex items-center space-x-3">
                            <label className="flex items-center space-x-1.5 cursor-pointer text-[10px] font-bold text-zinc-400">
                              <input
                                type="checkbox"
                                checked={!!activeMatchToControl.isExtraTime}
                                disabled={isChampOfMatchEnded}
                                onChange={(e) => {
                                  const updated = { ...activeMatchToControl };
                                  updated.isExtraTime = e.target.checked;
                                  if (e.target.checked && !updated.scoreExtraTime) {
                                    updated.scoreExtraTime = { home: updated.score.home, away: updated.score.away };
                                  } else if (!e.target.checked) {
                                    delete updated.scoreExtraTime;
                                  }
                                  updateMatch(updated);
                                }}
                                className="rounded border-zinc-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Prorrogação?</span>
                            </label>
                            <label className="flex items-center space-x-1.5 cursor-pointer text-[10px] font-bold text-zinc-400">
                              <input
                                type="checkbox"
                                checked={!!activeMatchToControl.scorePenalties}
                                disabled={isChampOfMatchEnded}
                                onChange={(e) => {
                                  const updated = { ...activeMatchToControl };
                                  if (e.target.checked) {
                                    updated.scorePenalties = { home: 0, away: 0 };
                                  } else {
                                    delete updated.scorePenalties;
                                  }
                                  updateMatch(updated);
                                }}
                                className="rounded border-zinc-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span>Pênaltis?</span>
                            </label>
                          </div>
                        </div>

                        {/* Score inputs for Extra Time and Penalties */}
                        <div className="grid grid-cols-1 gap-4">
                          {activeMatchToControl.isExtraTime && (
                            <div className="space-y-1.5 border-b border-slate-800/50 pb-2.5">
                              <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block">Placar da Prorrogação (ET)</span>
                              <div className="flex items-center justify-center space-x-3 bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                                <span className="text-[10px] text-zinc-300 truncate max-w-[110px] font-bold">{activeMatchToControl.homeClubName}</span>
                                <input
                                  type="number"
                                  min="0"
                                  disabled={isChampOfMatchEnded}
                                  value={activeMatchToControl.scoreExtraTime?.home ?? activeMatchToControl.score.home}
                                  onChange={(e) => {
                                    const updated = { ...activeMatchToControl };
                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                    updated.scoreExtraTime = {
                                      home: isNaN(val) ? 0 : val,
                                      away: updated.scoreExtraTime?.away ?? updated.score.away
                                    };
                                    updateMatch(updated);
                                  }}
                                  className="w-14 text-center font-mono text-xs bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                />
                                <span className="text-xs text-zinc-500 font-bold">x</span>
                                <input
                                  type="number"
                                  min="0"
                                  disabled={isChampOfMatchEnded}
                                  value={activeMatchToControl.scoreExtraTime?.away ?? activeMatchToControl.score.away}
                                  onChange={(e) => {
                                    const updated = { ...activeMatchToControl };
                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                    updated.scoreExtraTime = {
                                      home: updated.scoreExtraTime?.home ?? updated.score.home,
                                      away: isNaN(val) ? 0 : val
                                    };
                                    updateMatch(updated);
                                  }}
                                  className="w-14 text-center font-mono text-xs bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                />
                                <span className="text-[10px] text-zinc-300 truncate max-w-[110px] font-bold">{activeMatchToControl.awayClubName}</span>
                              </div>
                            </div>
                          )}

                          {activeMatchToControl.scorePenalties && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black text-yellow-500 uppercase tracking-wider block">Decisão por Pênaltis</span>
                              <div className="flex items-center justify-center space-x-3 bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                                <span className="text-[10px] text-zinc-300 truncate max-w-[110px] font-bold">{activeMatchToControl.homeClubName}</span>
                                <input
                                  type="number"
                                  min="0"
                                  disabled={isChampOfMatchEnded}
                                  value={activeMatchToControl.scorePenalties.home}
                                  onChange={(e) => {
                                    const updated = { ...activeMatchToControl };
                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                    updated.scorePenalties = {
                                      home: isNaN(val) ? 0 : val,
                                      away: updated.scorePenalties?.away ?? 0
                                    };
                                    updateMatch(updated);
                                  }}
                                  className="w-14 text-center font-mono text-xs bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                />
                                <span className="text-xs text-zinc-500 font-bold">x</span>
                                <input
                                  type="number"
                                  min="0"
                                  disabled={isChampOfMatchEnded}
                                  value={activeMatchToControl.scorePenalties.away}
                                  onChange={(e) => {
                                    const updated = { ...activeMatchToControl };
                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                    updated.scorePenalties = {
                                      home: updated.scorePenalties?.home ?? 0,
                                      away: isNaN(val) ? 0 : val
                                    };
                                    updateMatch(updated);
                                  }}
                                  className="w-14 text-center font-mono text-xs bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                />
                                <span className="text-[10px] text-zinc-300 truncate max-w-[110px] font-bold">{activeMatchToControl.awayClubName}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Injector panel for Live Match Events */}
                    <form onSubmit={handleCustomEventSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                      <span className="text-[10px] font-black text-zinc-400 uppercase block">Injetar Evento Real-Time</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400">Tipo de Lance</label>
                          <select
                            value={eventType}
                            onChange={(e) => setEventType(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5"
                          >
                            <option value="Goal">Gol</option>
                            <option value="YellowCard">Cartão Amarelo</option>
                            <option value="RedCard">Cartão Vermelho</option>
                            <option value="Substitution">Substituição</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400">Equipe</label>
                          <select
                            value={eventTeam}
                            onChange={(e) => setEventTeam(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5"
                          >
                            <option value="home">Mandante ({activeMatchToControl.homeClubShortName || 'Casa'})</option>
                            <option value="away">Visitante ({activeMatchToControl.awayClubShortName || 'Fora'})</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400">Jogador Principal</label>
                          {(() => {
                            const currentEventPlayers = getEventPlayers();
                            if (currentEventPlayers.length > 0) {
                              return (
                                <div className="space-y-1.5">
                                  <select
                                    value={isPlayer1Custom ? "__custom__" : player1Name}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === "__custom__") {
                                        setIsPlayer1Custom(true);
                                        setPlayer1Name('');
                                      } else {
                                        setIsPlayer1Custom(false);
                                        setPlayer1Name(val);
                                      }
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-medium"
                                  >
                                    <option value="">Selecione o jogador...</option>
                                    {(() => {
                                      const starters = currentEventPlayers.filter(p => p.source === 'Titular');
                                      const subs = currentEventPlayers.filter(p => p.source !== 'Titular');
                                      return (
                                        <>
                                          {starters.length > 0 && (
                                            <optgroup label="⚽ 11 Inicial (Titulares Escalados)">
                                              {starters.map((p, idx) => (
                                                <option key={`starter-${idx}`} value={p.name} className="text-white">
                                                  {p.number ? `#${p.number} ` : ''}{p.name}
                                                </option>
                                              ))}
                                            </optgroup>
                                          )}
                                          {subs.length > 0 && (
                                            <optgroup label="🔄 Suplentes (Reservas / Elenco)">
                                              {subs.map((p, idx) => (
                                                <option key={`sub-${idx}`} value={p.name} className="text-white">
                                                  {p.number ? `#${p.number} ` : ''}{p.name} ({p.source === 'Reserva' ? 'Reserva' : 'Elenco'})
                                                </option>
                                              ))}
                                            </optgroup>
                                          )}
                                        </>
                                      );
                                    })()}
                                    <option value="__custom__">Outro (Digitar manualmente...)</option>
                                  </select>
                                  
                                  {isPlayer1Custom && (
                                    <input
                                      type="text"
                                      required
                                      placeholder="Digite o nome do atleta..."
                                      value={player1Name}
                                      onChange={(e) => setPlayer1Name(e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-medium animate-fade-in"
                                    />
                                  )}
                                </div>
                              );
                            } else {
                              return (
                                <input
                                  type="text"
                                  required
                                  placeholder="Nome do Atleta..."
                                  value={player1Name}
                                  onChange={(e) => setPlayer1Name(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-medium"
                                />
                              );
                            }
                          })()}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400">Jogador Secundário / Assistência</label>
                          {(() => {
                            const currentEventPlayers = getEventPlayers();
                            if (currentEventPlayers.length > 0) {
                              return (
                                <div className="space-y-1.5">
                                  <select
                                    value={isPlayer2Custom ? "__custom__" : player2Name}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === "__custom__") {
                                        setIsPlayer2Custom(true);
                                        setPlayer2Name('');
                                      } else {
                                        setIsPlayer2Custom(false);
                                        setPlayer2Name(val);
                                      }
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-medium"
                                  >
                                    <option value="">Opcional / Nenhum...</option>
                                    {(() => {
                                      const starters = currentEventPlayers.filter(p => p.source === 'Titular');
                                      const subs = currentEventPlayers.filter(p => p.source !== 'Titular');
                                      return (
                                        <>
                                          {starters.length > 0 && (
                                            <optgroup label="⚽ 11 Inicial (Titulares Escalados)">
                                              {starters.map((p, idx) => (
                                                <option key={`starter-${idx}`} value={p.name} className="text-white">
                                                  {p.number ? `#${p.number} ` : ''}{p.name}
                                                </option>
                                              ))}
                                            </optgroup>
                                          )}
                                          {subs.length > 0 && (
                                            <optgroup label="🔄 Suplentes (Reservas / Elenco)">
                                              {subs.map((p, idx) => (
                                                <option key={`sub-${idx}`} value={p.name} className="text-white">
                                                  {p.number ? `#${p.number} ` : ''}{p.name} ({p.source === 'Reserva' ? 'Reserva' : 'Elenco'})
                                                </option>
                                              ))}
                                            </optgroup>
                                          )}
                                        </>
                                      );
                                    })()}
                                    <option value="__custom__">Outro (Digitar manualmente...)</option>
                                  </select>
                                  
                                  {isPlayer2Custom && (
                                    <input
                                      type="text"
                                      placeholder="Digite o nome..."
                                      value={player2Name}
                                      onChange={(e) => setPlayer2Name(e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-medium animate-fade-in"
                                    />
                                  )}
                                </div>
                              );
                            } else {
                              return (
                                <input
                                  type="text"
                                  placeholder="Opcional..."
                                  value={player2Name}
                                  onChange={(e) => setPlayer2Name(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-medium"
                                />
                              );
                            }
                          })()}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400">Detalhes / Descrição do lance</label>
                          <input
                            type="text"
                            placeholder="Ex: Cabeçada precisa no canto"
                            value={eventDetail}
                            onChange={(e) => setEventDetail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-medium"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isChampOfMatchEnded}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Transmitir Lance ao Vivo
                      </button>
                    </form>

                    {/* STATS CUSTOMIZATION PANEL */}
                    <form onSubmit={handleSaveMatchStats} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                      <div className="border-b border-slate-800 pb-2">
                        <span className="text-xs font-black text-indigo-400 uppercase tracking-wider block">
                          📊 Personalização de Estatísticas da Partida
                        </span>
                        <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                          Ajuste as métricas de desempenho em tempo real. As barras de progresso do jogo serão atualizadas instantaneamente!
                        </p>
                      </div>

                      <div className="space-y-3.5">
                        {/* Possession Row */}
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-black text-zinc-400 uppercase">
                            <span>Posse de Bola (Casa): {statsPossessionHome}%</span>
                            <span>Posse de Bola (Fora): {100 - statsPossessionHome}%</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={statsPossessionHome}
                              onChange={(e) => setStatsPossessionHome(Number(e.target.value))}
                              className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                            />
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={statsPossessionHome}
                              onChange={(e) => setStatsPossessionHome(Math.max(0, Math.min(100, Number(e.target.value))))}
                              className="w-12 bg-slate-900 border border-slate-800 text-center text-xs font-mono font-black rounded py-1 text-white"
                            />
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          
                          {/* Left Column of stats */}
                          <div className="space-y-3">
                            {/* Remates Totais */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Remates totais (Chutes)</label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Mandante"
                                  value={statsShotsHome}
                                  onChange={(e) => setStatsShotsHome(Math.max(0, Number(e.target.value)))}
                                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Visitante"
                                  value={statsShotsAway}
                                  onChange={(e) => setStatsShotsAway(Math.max(0, Number(e.target.value)))}
                                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                                />
                              </div>
                            </div>

                            {/* Chutes Bloqueados */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Chutes bloqueados</label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={statsBlockedShotsHome}
                                  onChange={(e) => setStatsBlockedShotsHome(Math.max(0, Number(e.target.value)))}
                                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  value={statsBlockedShotsAway}
                                  onChange={(e) => setStatsBlockedShotsAway(Math.max(0, Number(e.target.value)))}
                                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                                />
                              </div>
                            </div>

                            {/* Chutes a Gol */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Chutes a gol (No Alvo)</label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={statsShotsOnTargetHome}
                                  onChange={(e) => setStatsShotsOnTargetHome(Math.max(0, Number(e.target.value)))}
                                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  value={statsShotsOnTargetAway}
                                  onChange={(e) => setStatsShotsOnTargetAway(Math.max(0, Number(e.target.value)))}
                                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                                />
                              </div>
                            </div>

                            {/* Defesas do Goleiro */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Defesas do Goleiro</label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={statsSavesHome}
                                  onChange={(e) => setStatsSavesHome(Math.max(0, Number(e.target.value)))}
                                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  value={statsSavesAway}
                                  onChange={(e) => setStatsSavesAway(Math.max(0, Number(e.target.value)))}
                                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Right Column of stats */}
                          <div className="space-y-3">
                            {/* Total de Passes */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Total de passes</label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={statsPassesHome}
                                  onChange={(e) => setStatsPassesHome(Math.max(0, Number(e.target.value)))}
                                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  value={statsPassesAway}
                                  onChange={(e) => setStatsPassesAway(Math.max(0, Number(e.target.value)))}
                                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                                />
                              </div>
                            </div>

                            {/* Precisão de Passes */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Precisão de passes (%)</label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={statsPassAccuracyHome}
                                  onChange={(e) => setStatsPassAccuracyHome(Math.max(0, Math.min(100, Number(e.target.value))))}
                                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={statsPassAccuracyAway}
                                  onChange={(e) => setStatsPassAccuracyAway(Math.max(0, Math.min(100, Number(e.target.value))))}
                                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                                />
                              </div>
                            </div>

                            {/* Desarmes / Faltas */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Desarmes (Faltas)</label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={statsFoulsHome}
                                  onChange={(e) => setStatsFoulsHome(Math.max(0, Number(e.target.value)))}
                                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  value={statsFoulsAway}
                                  onChange={(e) => setStatsFoulsAway(Math.max(0, Number(e.target.value)))}
                                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                                />
                              </div>
                            </div>

                            {/* Ataques Perigosos */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Ataques perigosos</label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={statsDangerousAttacksHome}
                                  onChange={(e) => setStatsDangerousAttacksHome(Math.max(0, Number(e.target.value)))}
                                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  value={statsDangerousAttacksAway}
                                  onChange={(e) => setStatsDangerousAttacksAway(Math.max(0, Number(e.target.value)))}
                                  className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-mono text-center"
                                />
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isChampOfMatchEnded}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white rounded-lg text-xs font-black transition-colors cursor-pointer uppercase tracking-wider"
                      >
                        💾 Salvar Estatísticas da Partida
                      </button>
                    </form>

                    {/* TACTICAL SCHEME & LINEUP FORM */}
                    <form onSubmit={handleSaveMatchLineups} className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 sm:p-4 space-y-4">
                      <div className="border-b border-slate-800 pb-2">
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
                          📋 Esquema Tático & Escalações da Partida
                        </span>
                        <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                          Defina as táticas de jogo, técnico e a lista de 11 atletas titulares para visualização realista no campo de jogo.
                        </p>
                      </div>

                      {/* Formation selectors side-by-side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* HOME Team Config */}
                        <div className="bg-slate-950 p-2 sm:p-3.5 rounded-xl border border-slate-800/80 space-y-3">
                          <span className="text-xs font-black text-slate-300 block truncate uppercase">
                            🏠 {activeMatchToControl.homeClubName} (Mandante)
                          </span>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-zinc-400 uppercase">Esquema Tático (Formação)</label>
                              <select
                                value={homeFormation}
                                onChange={(e) => setHomeFormation(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white"
                              >
                                <option value="4-3-3">4-3-3 (Padrão)</option>
                                <option value="4-4-2">4-4-2</option>
                                <option value="3-5-2">3-5-2</option>
                                <option value="4-2-3-1">4-2-3-1</option>
                                <option value="5-3-2">5-3-2</option>
                                <option value="4-1-2-1-2">4-1-2-1-2</option>
                                <option value="3-4-3">3-4-3</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-zinc-400 uppercase">Técnico / Treinador</label>
                              <input
                                type="text"
                                value={homeManager}
                                onChange={(e) => setHomeManager(e.target.value)}
                                placeholder="Nome do técnico..."
                                className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-medium"
                              />
                            </div>
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => handleAutoFillLineup('home')}
                                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-zinc-300 hover:text-white rounded text-[10px] font-black uppercase transition-colors cursor-pointer"
                              >
                                ⚡ Auto-escalar com elenco
                              </button>
                            </div>
                          </div>

                          {/* 11 Players inputs */}
                          <div className="space-y-2 pt-2 border-t border-slate-800 max-h-[380px] overflow-y-auto pr-1">
                            <span className="text-[9px] font-black text-zinc-500 uppercase block tracking-wider mb-1">Titulares (11 Atletas)</span>
                            {(() => {
                              const homeClubPlayers = players.filter((pl) => pl.clubId === activeMatchToControl.homeClubId);
                              return Array.from({ length: 11 }).map((_, idx) => {
                                const p = homeStarting[idx] || { name: '', number: idx + 1, position: 'Defensor' };
                                return (
                                  <div key={idx} className="flex flex-col gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800/40">
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {/* Dropdown for enrolled players */}
                                      <div>
                                        <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Jogador Inscrito</label>
                                        <select
                                          onChange={(e) => {
                                            const selectedId = e.target.value;
                                            if (selectedId) {
                                              const selectedPlayer = homeClubPlayers.find(pl => pl.id === selectedId);
                                              if (selectedPlayer) {
                                                handleUpdatePlayerMultipleFields('home', idx, {
                                                  id: selectedPlayer.id,
                                                  name: selectedPlayer.name,
                                                  number: selectedPlayer.number || (idx + 1),
                                                  position: selectedPlayer.position || 'Defensor'
                                                });
                                              }
                                            }
                                          }}
                                          value={homeClubPlayers.find(pl => pl.name === p.name)?.id || ''}
                                          className="w-full bg-slate-950 border border-slate-800 text-[10px] py-1 px-1 rounded text-emerald-400 font-bold focus:ring-1 focus:ring-emerald-500 truncate"
                                        >
                                          <option value="">-- Escolher Inscrito --</option>
                                          {homeClubPlayers.map((pl) => (
                                            <option key={pl.id} value={pl.id} className="text-white">
                                              {pl.name} ({pl.position.slice(0, 3).toUpperCase()})
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Name editor */}
                                      <div>
                                        <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Nome em Campo</label>
                                        <input
                                          type="text"
                                          value={p.name}
                                          placeholder={`Jogador ${idx + 1}`}
                                          onChange={(e) => handleUpdatePlayerField('home', idx, 'name', e.target.value)}
                                          className="w-full bg-slate-950 border border-slate-800 text-[10px] py-1 px-1.5 rounded text-white focus:ring-1 focus:ring-indigo-500 truncate"
                                        />
                                      </div>
                                    </div>

                                    {/* Number na camisola & Position */}
                                    <div className="flex items-center gap-2 justify-between">
                                      {/* Camisola number */}
                                      <div className="flex-1">
                                        <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Camisola (Nº)</label>
                                        <input
                                          type="number"
                                          value={p.number}
                                          placeholder="Nº"
                                          onChange={(e) => handleUpdatePlayerField('home', idx, 'number', Number(e.target.value))}
                                          className="w-full bg-slate-950 border border-slate-800 text-[10px] text-center font-mono py-1 rounded text-yellow-400 font-black focus:ring-1 focus:ring-yellow-500"
                                        />
                                      </div>

                                      {/* Position */}
                                      <div className="flex-1">
                                        <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Posição</label>
                                        <select
                                          value={p.position}
                                          onChange={(e) => handleUpdatePlayerField('home', idx, 'position', e.target.value)}
                                          className="w-full bg-slate-950 border border-slate-800 text-[9px] py-1 px-1 rounded text-zinc-300 font-semibold focus:ring-1 focus:ring-indigo-500"
                                        >
                                          <option value="Goleiro">GK</option>
                                          <option value="Defensor">DF</option>
                                          <option value="Meio-campista">MC</option>
                                          <option value="Atacante">AT</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>

                        {/* AWAY Team Config */}
                        <div className="bg-slate-950 p-2 sm:p-3.5 rounded-xl border border-slate-800/80 space-y-3">
                          <span className="text-xs font-black text-slate-300 block truncate uppercase">
                            ✈️ {activeMatchToControl.awayClubName} (Visitante)
                          </span>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-zinc-400 uppercase">Esquema Tático (Formação)</label>
                              <select
                                value={awayFormation}
                                onChange={(e) => setAwayFormation(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white"
                              >
                                <option value="4-3-3">4-3-3 (Padrão)</option>
                                <option value="4-4-2">4-4-2</option>
                                <option value="3-5-2">3-5-2</option>
                                <option value="4-2-3-1">4-2-3-1</option>
                                <option value="5-3-2">5-3-2</option>
                                <option value="4-1-2-1-2">4-1-2-1-2</option>
                                <option value="3-4-3">3-4-3</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-zinc-400 uppercase">Técnico / Treinador</label>
                              <input
                                type="text"
                                value={awayManager}
                                onChange={(e) => setAwayManager(e.target.value)}
                                placeholder="Nome do técnico..."
                                className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white font-medium"
                              />
                            </div>
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => handleAutoFillLineup('away')}
                                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-zinc-300 hover:text-white rounded text-[10px] font-black uppercase transition-colors cursor-pointer"
                              >
                                ⚡ Auto-escalar com elenco
                              </button>
                            </div>
                          </div>

                          {/* 11 Players inputs */}
                          <div className="space-y-2 pt-2 border-t border-slate-800 max-h-[380px] overflow-y-auto pr-1">
                            <span className="text-[9px] font-black text-zinc-500 uppercase block tracking-wider mb-1">Titulares (11 Atletas)</span>
                            {(() => {
                              const awayClubPlayers = players.filter((pl) => pl.clubId === activeMatchToControl.awayClubId);
                              return Array.from({ length: 11 }).map((_, idx) => {
                                const p = awayStarting[idx] || { name: '', number: idx + 1, position: 'Defensor' };
                                return (
                                  <div key={idx} className="flex flex-col gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800/40">
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {/* Dropdown for enrolled players */}
                                      <div>
                                        <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Jogador Inscrito</label>
                                        <select
                                          onChange={(e) => {
                                            const selectedId = e.target.value;
                                            if (selectedId) {
                                              const selectedPlayer = awayClubPlayers.find(pl => pl.id === selectedId);
                                              if (selectedPlayer) {
                                                handleUpdatePlayerMultipleFields('away', idx, {
                                                  id: selectedPlayer.id,
                                                  name: selectedPlayer.name,
                                                  number: selectedPlayer.number || (idx + 1),
                                                  position: selectedPlayer.position || 'Defensor'
                                                });
                                              }
                                            }
                                          }}
                                          value={awayClubPlayers.find(pl => pl.name === p.name)?.id || ''}
                                          className="w-full bg-slate-950 border border-slate-800 text-[10px] py-1 px-1 rounded text-emerald-400 font-bold focus:ring-1 focus:ring-emerald-500 truncate"
                                        >
                                          <option value="">-- Escolher Inscrito --</option>
                                          {awayClubPlayers.map((pl) => (
                                            <option key={pl.id} value={pl.id} className="text-white">
                                              {pl.name} ({pl.position.slice(0, 3).toUpperCase()})
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Name editor */}
                                      <div>
                                        <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Nome em Campo</label>
                                        <input
                                          type="text"
                                          value={p.name}
                                          placeholder={`Jogador ${idx + 1}`}
                                          onChange={(e) => handleUpdatePlayerField('away', idx, 'name', e.target.value)}
                                          className="w-full bg-slate-950 border border-slate-800 text-[10px] py-1 px-1.5 rounded text-white focus:ring-1 focus:ring-indigo-500 truncate"
                                        />
                                      </div>
                                    </div>

                                    {/* Number na camisola & Position */}
                                    <div className="flex items-center gap-2 justify-between">
                                      {/* Camisola number */}
                                      <div className="flex-1">
                                        <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Camisola (Nº)</label>
                                        <input
                                          type="number"
                                          value={p.number}
                                          placeholder="Nº"
                                          onChange={(e) => handleUpdatePlayerField('away', idx, 'number', Number(e.target.value))}
                                          className="w-full bg-slate-950 border border-slate-800 text-[10px] text-center font-mono py-1 rounded text-yellow-400 font-black focus:ring-1 focus:ring-yellow-500"
                                        />
                                      </div>

                                      {/* Position */}
                                      <div className="flex-1">
                                        <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Posição</label>
                                        <select
                                          value={p.position}
                                          onChange={(e) => handleUpdatePlayerField('away', idx, 'position', e.target.value)}
                                          className="w-full bg-slate-950 border border-slate-800 text-[9px] py-1 px-1 rounded text-zinc-300 font-semibold focus:ring-1 focus:ring-indigo-500"
                                        >
                                          <option value="Goleiro">GK</option>
                                          <option value="Defensor">DF</option>
                                          <option value="Meio-campista">MC</option>
                                          <option value="Atacante">AT</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isChampOfMatchEnded}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white rounded-lg text-xs font-black transition-colors cursor-pointer uppercase tracking-wider"
                      >
                        💾 Salvar Esquemas e Escalações da Partida
                      </button>
                    </form>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">Cadastre uma partida primeiro para habilitar o controlador ao vivo.</p>
                )}
              </div>

              {/* Match scheduler */}
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-black text-white uppercase border-b border-slate-800 pb-2">
                  📅 Agendar Nova Partida
                </h3>
                
                {clubs.length < 2 || championships.length < 1 ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-xl text-xs space-y-2 animate-fade-in">
                    <p className="font-bold flex items-center space-x-1.5">
                      <span>⚠️ Requisitos de Cadastro de Partida</span>
                    </p>
                    <p>
                      Para poder agendar uma partida, o sistema necessita de dados básicos cadastrados no banco de dados:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Pelo menos <strong>2 Clubes</strong> cadastrados (Atualmente: {clubs.length})</li>
                      <li>Pelo menos <strong>1 Campeonato</strong> ativo cadastrado (Atualmente: {championships.length})</li>
                    </ul>
                    <p className="pt-1.5 text-zinc-400">
                      Você pode criar novos clubes e campeonatos usando as abas <strong>"Clubes"</strong> e <strong>"Campeonatos"</strong> na barra lateral do painel, ou clicar no botão <strong>"Restaurar Dados de Demonstração"</strong> no final do dashboard para repovoar o banco de dados instantaneamente com times reais moçambicanos e europeus!
                    </p>
                  </div>
                ) : null}

                <form onSubmit={handleCreateMatch} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Mandante (Casa)</label>
                      <select
                        value={homeClubId}
                        onChange={(e) => setHomeClubId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      >
                        {clubs.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Visitante (Fora)</label>
                      <select
                        value={awayClubId}
                        onChange={(e) => setAwayClubId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      >
                        {clubs.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Campeonato</label>
                      <select
                        value={leagueId}
                        onChange={(e) => setLeagueId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      >
                        {championships.map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            {ch.name}{ch.status === 'Encerrado' ? ' (Encerrado 🔒)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Estádio</label>
                      <input
                        type="text"
                        placeholder="Ex: Maracanã"
                        value={stadium}
                        onChange={(e) => setStadium(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Árbitro</label>
                      <input
                        type="text"
                        placeholder="Nome do Árbitro"
                        value={referee}
                        onChange={(e) => setReferee(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Data</label>
                      <input
                        type="date"
                        value={matchDate}
                        onChange={(e) => setMatchDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Horário</label>
                      <input
                        type="time"
                        value={matchTime}
                        onChange={(e) => setMatchTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Rodada</label>
                      <input
                        type="number"
                        min="1"
                        value={matchRound}
                        onChange={(e) => setMatchRound(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  {(() => {
                    const selectedChamp = championships.find((ch) => ch.id === leagueId);
                    const isSelectedChampEnded = selectedChamp?.status === 'Encerrado';

                    return (
                      <>
                        {selectedChamp?.type === 'Copa' && (
                          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-1.5 animate-fade-in max-w-xs">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase">Fase da Copa / Eliminatória</label>
                            <select
                              value={matchPhase}
                              onChange={(e) => setMatchPhase(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-white cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                            >
                              <option value="Fase de Grupos">Fase de Grupos</option>
                              <option value="Oitavos de Final">Oitavos de Final</option>
                              <option value="Quartas de Final">Quartas de Final</option>
                              <option value="Semifinal">Semifinal</option>
                              <option value="Final">Final</option>
                            </select>
                          </div>
                        )}

                        {isSelectedChampEnded && (
                          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl text-xs flex items-center space-x-2 animate-fade-in">
                            <span>⚠️</span>
                            <span>O campeonato <strong>{selectedChamp?.name}</strong> está encerrado e seus dados estão congelados. Reabra o campeonato para poder agendar novas partidas.</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSelectedChampEnded || clubs.length < 2 || championships.length < 1}
                          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Cadastrar Partida</span>
                        </button>
                      </>
                    );
                  })()}
                </form>
              </div>
            </div>
          )}

          {/* CLUBES TAB VIEW */}
          {activeTab === 'clubs' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center space-x-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Voltar para o Dashboard</span>
                </button>
              </div>

              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-black text-white uppercase border-b border-slate-800 pb-2">
                  🛡️ Cadastrar Novo Clube de Futebol
                </h3>
                <form onSubmit={handleCreateClub} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Nome do Clube</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Grêmio FBPA"
                        value={newClubName}
                        onChange={(e) => setNewClubName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Sigla (3 Letras)</label>
                      <input
                        type="text"
                        required
                        maxLength={3}
                        placeholder="Ex: GRE"
                        value={newClubShort}
                        onChange={(e) => setNewClubShort(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white uppercase"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">País de Origem</label>
                      <input
                        type="text"
                        value={newClubCountry}
                        onChange={(e) => setNewClubCountry(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase block">Logo do Clube</label>
                      <div className="flex items-center space-x-2 pt-0.5">
                        {newClubLogo ? (
                          <img src={newClubLogo} alt="Preview" className="w-8 h-8 rounded-full bg-slate-800 object-cover border border-slate-700" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold text-zinc-500 border border-slate-800">Logo</div>
                        )}
                        <label className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold cursor-pointer select-none">
                          Upload
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setNewClubLogo(event.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Estádio</label>
                      <input
                        type="text"
                        placeholder="Ex: Arena do Grêmio"
                        value={newClubStadium}
                        onChange={(e) => setNewClubStadium(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Técnico</label>
                      <input
                        type="text"
                        placeholder="Ex: Renato Portaluppi"
                        value={newClubManager}
                        onChange={(e) => setNewClubManager(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cadastrar Clube
                  </button>
                </form>
              </div>

              {/* Clubs list */}
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-black text-white uppercase border-b border-slate-800 pb-2">
                  📋 Lista de Clubes Cadastrados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredClubs.map((club) => {
                    const isEditing = editingClubId === club.id;

                    // Calculate stats dynamically for this club
                    const finishedClubMatches = matches.filter(
                      (m) => (m.homeClubId === club.id || m.awayClubId === club.id) && m.status === 'Encerrado'
                    );

                    let wins = club.stats?.wins ?? 0;
                    let draws = club.stats?.draws ?? 0;
                    let losses = club.stats?.losses ?? 0;
                    let goalsScored = club.stats?.goalsScored ?? 0;
                    let goalsConceded = club.stats?.goalsConceded ?? 0;

                    finishedClubMatches.forEach((m) => {
                      const isHome = m.homeClubId === club.id;
                      const myScore = isHome ? m.score.home : m.score.away;
                      const opponentScore = isHome ? m.score.away : m.score.home;

                      goalsScored += myScore;
                      goalsConceded += opponentScore;

                      if (myScore > opponentScore) {
                        wins += 1;
                      } else if (myScore < opponentScore) {
                        losses += 1;
                      } else {
                        draws += 1;
                      }
                    });

                    const points = wins * 3 + draws;

                    return (
                      <div key={club.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col space-y-3 transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <label className="relative cursor-pointer group shrink-0" title="Clique para alterar o logo">
                              <img src={club.logoUrl} alt="" className="w-9 h-9 rounded-full bg-slate-800 p-1 group-hover:opacity-75 transition-opacity" />
                              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white text-[7px] bg-black/55 rounded-full font-black">FOTO</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        updateClub({ ...club, logoUrl: event.target.result as string });
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            <div>
                              <p className="text-xs font-black text-white">{club.name}</p>
                              <p className="text-[10px] text-zinc-400">{club.stadium}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteClub(club.id)}
                            className="text-rose-500 hover:text-rose-400 p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                            title="Excluir Clube"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Club Stats Snapshot */}
                        <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-2.5 flex flex-col space-y-1.5 text-[10px]">
                          <div className="flex justify-between text-zinc-400 font-bold uppercase tracking-wider border-b border-slate-800/40 pb-1">
                            <span>Estatísticas Atuais</span>
                            <span className="text-emerald-500 font-mono">
                              {points} pts
                            </span>
                          </div>
                          <div className="grid grid-cols-5 gap-1 text-center font-mono text-xs">
                            <div className="bg-[#0f172a] p-1 rounded border border-slate-800/40">
                              <p className="text-[9px] text-zinc-500 uppercase">V</p>
                              <p className="font-bold text-white">{wins}</p>
                            </div>
                            <div className="bg-[#0f172a] p-1 rounded border border-slate-800/40">
                              <p className="text-[9px] text-zinc-500 uppercase">E</p>
                              <p className="font-bold text-white">{draws}</p>
                            </div>
                            <div className="bg-[#0f172a] p-1 rounded border border-slate-800/40">
                              <p className="text-[9px] text-zinc-500 uppercase">D</p>
                              <p className="font-bold text-white">{losses}</p>
                            </div>
                            <div className="bg-[#0f172a] p-1 rounded border border-slate-800/40">
                              <p className="text-[9px] text-zinc-500 uppercase">GP</p>
                              <p className="font-bold text-emerald-400">{goalsScored}</p>
                            </div>
                            <div className="bg-[#0f172a] p-1 rounded border border-slate-800/40">
                              <p className="text-[9px] text-zinc-500 uppercase">GC</p>
                              <p className="font-bold text-rose-400">{goalsConceded}</p>
                            </div>
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 animate-fade-in">
                            <p className="text-[10px] font-black text-white uppercase tracking-wider">✏️ Editar Estatísticas</p>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-0.5">
                                <label className="text-[8px] font-bold text-zinc-400 uppercase">Vitórias</label>
                                <input
                                  type="number"
                                  value={editWins}
                                  onChange={(e) => setEditWins(Math.max(0, Number(e.target.value)))}
                                  className="w-full bg-slate-900 border border-slate-800 text-[10px] rounded-lg px-2 py-1 text-white font-mono text-center"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-[8px] font-bold text-zinc-400 uppercase">Empates</label>
                                <input
                                  type="number"
                                  value={editDraws}
                                  onChange={(e) => setEditDraws(Math.max(0, Number(e.target.value)))}
                                  className="w-full bg-slate-900 border border-slate-800 text-[10px] rounded-lg px-2 py-1 text-white font-mono text-center"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-[8px] font-bold text-zinc-400 uppercase">Derrotas</label>
                                <input
                                  type="number"
                                  value={editLosses}
                                  onChange={(e) => setEditLosses(Math.max(0, Number(e.target.value)))}
                                  className="w-full bg-slate-900 border border-slate-800 text-[10px] rounded-lg px-2 py-1 text-white font-mono text-center"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-0.5">
                                <label className="text-[8px] font-bold text-emerald-400 uppercase">GP (Marcados)</label>
                                <input
                                  type="number"
                                  value={editGoalsScored}
                                  onChange={(e) => setEditGoalsScored(Math.max(0, Number(e.target.value)))}
                                  className="w-full bg-slate-900 border border-slate-800 text-[10px] rounded-lg px-2 py-1 text-white font-mono text-center"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-[8px] font-bold text-rose-400 uppercase">GC (Sofridos)</label>
                                <input
                                  type="number"
                                  value={editGoalsConceded}
                                  onChange={(e) => setEditGoalsConceded(Math.max(0, Number(e.target.value)))}
                                  className="w-full bg-slate-900 border border-slate-800 text-[10px] rounded-lg px-2 py-1 text-white font-mono text-center"
                                />
                              </div>
                            </div>
                            <div className="flex space-x-2 pt-1">
                              <button
                                onClick={() => handleSaveClubStats(club.id)}
                                className="flex-1 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-colors"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setEditingClubId(null)}
                                className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-zinc-400 font-bold text-[10px] rounded-lg cursor-pointer transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEditingClubStats(club)}
                            className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-zinc-400 font-bold text-[10px] rounded-lg cursor-pointer transition-colors flex items-center justify-center space-x-1"
                          >
                            <Sliders className="w-3 h-3 text-zinc-400" />
                            <span>Editar Estatísticas</span>
                          </button>
                        )}

                        {/* Club Titles Section */}
                        <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-2.5 flex flex-col space-y-2 text-[10px]">
                          <div className="flex justify-between items-center text-zinc-400 font-bold uppercase tracking-wider border-b border-slate-800/40 pb-1">
                            <span>🏆 Galeria de Títulos</span>
                            <span className="text-[9px] text-zinc-500">{(club.titles || []).length} títulos</span>
                          </div>
                          
                          {/* List of current titles */}
                          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                            {!(club.titles || []).length ? (
                              <p className="text-zinc-600 italic text-[9px]">Sem títulos cadastrados</p>
                            ) : (
                              (club.titles || []).map((title, tIdx) => (
                                <div key={tIdx} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[9.5px]">
                                  <span className="text-zinc-200 truncate flex items-center space-x-1">
                                    <span>🏆</span>
                                    <span>{title}</span>
                                  </span>
                                  <button
                                    onClick={() => handleRemoveClubTitle(club.id, tIdx)}
                                    className="text-rose-500 hover:text-rose-400 p-0.5 hover:bg-slate-800 rounded transition-colors ml-1 shrink-0 cursor-pointer font-bold"
                                    title="Remover Título"
                                  >
                                    &times;
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Form to add title */}
                          <div className="flex space-x-1.5 pt-1 border-t border-slate-800/40">
                            <input
                              type="text"
                              placeholder="Ex: Campeão Moçambola 2025"
                              value={newTitleText[club.id] || ''}
                              onChange={(e) => setNewTitleText(prev => ({ ...prev, [club.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddClubTitle(club.id, newTitleText[club.id] || '');
                                }
                              }}
                              className="flex-1 bg-slate-900 border border-slate-800 text-[10px] rounded px-2 py-1 text-white"
                            />
                            
                            {/* Suggestion list based on championships registered */}
                            {championships.length > 0 && (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    setNewTitleText(prev => ({ ...prev, [club.id]: e.target.value }));
                                    // Reset select
                                    e.target.value = '';
                                  }
                                }}
                                className="bg-slate-900 border border-slate-800 text-[10px] rounded px-1.5 py-1 text-zinc-400 max-w-[80px]"
                              >
                                <option value="">Sugerir...</option>
                                {championships.map((champ) => (
                                  <option key={champ.id} value={`Campeão ${champ.name.replace(/🇺🇳|🇲🇿|🇪🇺|🇪🇸|🇧🇷/g, '').trim()} ${champ.season}`}>
                                    {champ.name.replace(/🇺🇳|🇲🇿|🇪🇺|🇪🇸|🇧🇷/g, '').trim()}
                                  </option>
                                ))}
                              </select>
                            )}
                            
                            <button
                              onClick={() => handleAddClubTitle(club.id, newTitleText[club.id] || '')}
                              className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] rounded cursor-pointer transition-colors shrink-0"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* JOGADORES TAB VIEW */}
          {activeTab === 'players' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center space-x-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Voltar para o Dashboard</span>
                </button>
              </div>

              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-black text-white uppercase border-b border-slate-800 pb-2">
                  🏃 Contratar / Cadastrar Novo Atleta
                </h3>
                <form onSubmit={handleCreatePlayer} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Nome Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Neymar Jr"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Idade</label>
                      <input
                        type="number"
                        value={newPlayerAge}
                        onChange={(e) => setNewPlayerAge(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Nacionalidade</label>
                      <input
                        type="text"
                        value={newPlayerNationality}
                        onChange={(e) => setNewPlayerNationality(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Altura</label>
                      <input
                        type="text"
                        placeholder="Ex: 1.85 m"
                        value={newPlayerHeight}
                        onChange={(e) => setNewPlayerHeight(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Número da Camisa</label>
                      <input
                        type="number"
                        value={newPlayerNumber}
                        onChange={(e) => setNewPlayerNumber(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Posição</label>
                      <select
                        value={newPlayerPosition}
                        onChange={(e) => setNewPlayerPosition(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      >
                        <option value="Goleiro">Goleiro</option>
                        <option value="Defensor">Defensor</option>
                        <option value="Meio-campista">Meio-campista</option>
                        <option value="Atacante">Atacante</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Valor de Mercado</label>
                      <input
                        type="text"
                        value={newPlayerValue}
                        onChange={(e) => setNewPlayerValue(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Clube Vinculado</label>
                      <select
                        value={newPlayerClub}
                        onChange={(e) => setNewPlayerClub(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      >
                        {clubs.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1 max-w-xs">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block">Foto do Jogador</label>
                    <div className="flex items-center space-x-2 pt-0.5">
                      {newPlayerPhoto ? (
                        <img src={newPlayerPhoto} alt="Preview" className="w-8 h-8 rounded-full bg-slate-800 object-cover border border-slate-700" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold text-zinc-500 border border-slate-800">Foto</div>
                      )}
                      <label className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold cursor-pointer select-none">
                        Upload
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setNewPlayerPhoto(event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cadastrar Jogador
                  </button>
                </form>
              </div>

              {/* Players database list */}
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-black text-white uppercase border-b border-slate-800 pb-2">
                  📋 Plantel de Atletas Registrados
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-zinc-500 font-extrabold border-b border-slate-800/80">
                        <th className="py-2">Foto</th>
                        <th className="py-2">Nome</th>
                        <th className="py-2">Clube</th>
                        <th className="py-2">Posição</th>
                        <th className="py-2">Nº</th>
                        <th className="py-2">Altura</th>
                        <th className="py-2">Valor</th>
                        <th className="py-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {filteredPlayers.map((player) => (
                        <tr key={player.id} className="hover:bg-slate-800/20 text-zinc-300">
                          <td className="py-2.5">
                            <label className="relative cursor-pointer group block w-7 h-7" title="Clique para alterar a foto">
                              <img src={player.photoUrl} alt="" className="w-7 h-7 rounded-full bg-slate-800 object-cover group-hover:opacity-75 transition-opacity" />
                              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white text-[6px] bg-black/50 rounded-full font-black">FOTO</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        updatePlayer({ ...player, photoUrl: event.target.result as string });
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </td>
                          <td className="py-2.5 font-bold text-white">{player.name}</td>
                          <td className="py-2.5 font-semibold text-zinc-400">{player.clubName}</td>
                          <td className="py-2.5">{player.position}</td>
                          <td className="py-2.5 font-mono">{player.number}</td>
                          <td className="py-2.5">
                            <input 
                              type="text" 
                              value={player.height || '1.80 m'} 
                              onChange={(e) => updatePlayer({ ...player, height: e.target.value })} 
                              className="w-16 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-center text-white"
                            />
                          </td>
                          <td className="py-2.5 font-mono font-bold text-emerald-400">{player.marketValue}</td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => deletePlayer(player.id)}
                              className="text-rose-500 hover:text-rose-400 p-1.5 hover:bg-slate-800 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CAMPEONATOS TAB VIEW */}
          {activeTab === 'leagues' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center space-x-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Voltar para o Dashboard</span>
                </button>
              </div>

              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-black text-white uppercase border-b border-slate-800 pb-2">
                  🏆 Criar Novo Campeonato / Liga
                </h3>
                <form onSubmit={handleCreateChampionship} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Nome do Campeonato</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Libertadores da América"
                        value={newChampName}
                        onChange={(e) => setNewChampName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Categoria</label>
                      <select
                        value={newChampType}
                        onChange={(e) => setNewChampType(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      >
                        <option value="Liga">Liga</option>
                        <option value="Copa">Copa / Eliminatória</option>
                        <option value="Internacional">Internacional</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Temporada</label>
                      <input
                        type="text"
                        value={newChampSeason}
                        onChange={(e) => setNewChampSeason(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Número de Rodadas</label>
                      <input
                        type="number"
                        value={newChampRounds}
                        onChange={(e) => setNewChampRounds(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase block">Logo / Foto</label>
                      <div className="flex items-center space-x-2 pt-0.5">
                        {newChampLogo ? (
                          <img src={newChampLogo} alt="Preview" className="w-8 h-8 rounded-full bg-slate-800 object-cover border border-slate-700" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold text-zinc-500 border border-slate-800">Logo</div>
                        )}
                        <label className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold cursor-pointer select-none">
                          Upload
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setNewChampLogo(event.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Criar Campeonato
                  </button>
                </form>
              </div>

              {/* Championships display list */}
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-black text-white uppercase">
                    🏆 Gerenciar Campeonatos
                  </h3>
                  {championships.length > 0 && (
                    <div className="flex items-center gap-2">
                      {isConfirmingClearAllChamps ? (
                        <div className="flex items-center gap-1.5 animate-fade-in bg-rose-500/10 border border-rose-500/20 p-1.5 rounded-lg">
                          <span className="text-[10px] font-bold text-rose-400">Excluir tudo?</span>
                          <button
                            type="button"
                            onClick={() => {
                              clearAllChampionships();
                              setIsConfirmingClearAllChamps(false);
                            }}
                            className="px-2 py-0.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded cursor-pointer"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsConfirmingClearAllChamps(false)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-zinc-300 text-[10px] font-bold rounded cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsConfirmingClearAllChamps(true)}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer border border-rose-500/20"
                        >
                          🗑️ Excluir Todos
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {championships.map((champ) => {
                    const isStandingsOpen = editingChampStandingsId === champ.id;
                    const clubsNotInStandings = clubs.filter(
                      (club) => !champ.standings.some((s) => s.clubId === club.id)
                    );
                    const isEnded = champ.status === 'Encerrado';

                    return (
                      <div key={champ.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center space-x-3">
                            <div className="relative group shrink-0">
                              <img src={champ.logoUrl} alt="" className="w-10 h-10 rounded-full bg-slate-800 p-1 object-cover" />
                              <label className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-slate-700">
                                <span className="text-[8px] font-black text-white uppercase text-center leading-none">Mudar</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        if (ev.target?.result) {
                                          updateChampionship({
                                            ...champ,
                                            logoUrl: ev.target.result as string
                                          });
                                          addLog('Logo atualizado', `Logo de ${champ.name} atualizado.`, 'bg-blue-500');
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-black text-white">{champ.name}</p>
                                {isEnded ? (
                                  <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Encerrado
                                  </span>
                                ) : (
                                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Ativo
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1.5 mt-0.5 text-[10px] text-zinc-400 font-mono uppercase">
                                <span>{champ.type} • {champ.season} •</span>
                                {isEnded ? (
                                  <span>{champ.roundsCount} Rodadas</span>
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="number"
                                      min="1"
                                      value={champ.roundsCount}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value, 10) || 1;
                                        updateChampionship({ ...champ, roundsCount: val });
                                      }}
                                      className="w-10 bg-slate-900 border border-slate-800 text-[10px] rounded px-1 text-center font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                      title="Alterar total de rodadas"
                                    />
                                    <span>Rodadas</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Toggle End / Reopen Championship button */}
                            {!isEnded ? (
                              champIdToConfirmEnd === champ.id ? (
                                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 p-1.5 rounded-lg animate-fade-in">
                                  <span className="text-[10px] font-bold text-amber-400">Encerrar e congelar?</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateChampionship({
                                        ...champ,
                                        status: 'Encerrado'
                                      });
                                      addLog('Campeonato Encerrado', `${champ.name} foi encerrado com sucesso.`, 'bg-amber-500');
                                      setChampIdToConfirmEnd(null);
                                    }}
                                    className="px-2 py-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded hover:bg-amber-600 transition-colors cursor-pointer"
                                  >
                                    Sim
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setChampIdToConfirmEnd(null)}
                                    className="px-2 py-1 bg-slate-800 text-zinc-300 text-[10px] font-bold rounded hover:bg-slate-700 transition-colors cursor-pointer"
                                  >
                                    Não
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChampIdToConfirmEnd(champ.id);
                                    setChampIdToConfirmReopen(null); // Close other active confirmations
                                  }}
                                  className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white text-[11px] font-bold rounded-lg border border-amber-500/20 transition-colors cursor-pointer"
                                  title="Encerrar Campeonato"
                                >
                                  Encerrar Campeonato
                                </button>
                              )
                            ) : (
                              champIdToConfirmReopen === champ.id ? (
                                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 p-1.5 rounded-lg animate-fade-in">
                                  <span className="text-[10px] font-bold text-emerald-400">Reabrir para edição?</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateChampionship({
                                        ...champ,
                                        status: 'Ativo'
                                      });
                                      addLog('Campeonato Reaberto', `${champ.name} está ativo para edições.`, 'bg-emerald-500');
                                      setChampIdToConfirmReopen(null);
                                    }}
                                    className="px-2 py-1 bg-emerald-500 text-white text-[10px] font-black rounded hover:bg-emerald-600 transition-colors cursor-pointer"
                                  >
                                    Sim
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setChampIdToConfirmReopen(null)}
                                    className="px-2 py-1 bg-slate-800 text-zinc-300 text-[10px] font-bold rounded hover:bg-slate-700 transition-colors cursor-pointer"
                                  >
                                    Não
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChampIdToConfirmReopen(champ.id);
                                    setChampIdToConfirmEnd(null); // Close other active confirmations
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white text-[11px] font-bold rounded-lg border border-emerald-500/20 transition-colors cursor-pointer"
                                  title="Reabrir Campeonato"
                                >
                                  Reabrir Campeonato
                                </button>
                              )
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (isStandingsOpen) {
                                  setEditingChampStandingsId(null);
                                  setEditingStandingClubId(null);
                                } else {
                                  setEditingChampStandingsId(champ.id);
                                  setEditingStandingClubId(null);
                                }
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center space-x-1.5"
                            >
                              <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{isStandingsOpen ? 'Fechar Classificação' : 'Gerenciar Classificação'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteChampionship(champ.id)}
                              className="text-rose-500 hover:text-rose-400 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                              title="Excluir Campeonato"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Expandable Classificação Section */}
                        {isStandingsOpen && (
                          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-4 animate-fade-in">
                            {isEnded && (
                              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-400 text-xs flex items-center space-x-2">
                                <span>🏆</span>
                                <span>Este campeonato está <strong>Encerrado</strong>. Todos os dados (jogos, classificação, datas) estão <strong>congelados</strong> e guardados para histórico de forma segura. Reabra o campeonato se precisar fazer alterações.</span>
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/60 pb-3 gap-3">
                              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-1">
                                <span>📊 Tabela de Classificação & Pontuação</span>
                              </h4>

                              {/* Add club to standings form */}
                              {!isEnded && (
                                clubsNotInStandings.length > 0 ? (
                                  <div className="flex items-center space-x-2">
                                    <select
                                      value={selectedClubToAddToStandings}
                                      onChange={(e) => setSelectedClubToAddToStandings(e.target.value)}
                                      className="bg-[#0f172a] border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-white"
                                    >
                                      <option value="">-- Adicionar clube --</option>
                                      {clubsNotInStandings.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => handleAddClubToStandings(champ.id)}
                                      disabled={!selectedClubToAddToStandings}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                                    >
                                      Adicionar à Tabela
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-zinc-500 uppercase italic">Todos os clubes participando</span>
                                )
                              )}
                            </div>

                            {champ.standings.length === 0 ? (
                              <div className="text-center py-6 text-zinc-500 text-xs">
                                Ninguém cadastrado nesta classificação. Adicione clubes acima ou finalize partidas para gerar automaticamente!
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px] font-mono text-zinc-300">
                                  <thead>
                                    <tr className="border-b border-slate-800/50 text-zinc-500 font-bold uppercase tracking-wider">
                                      <th className="py-2 px-1 text-center w-8">#</th>
                                      <th className="py-2">Clube</th>
                                      <th className="py-2 text-center w-16">Grupo</th>
                                      <th className="py-2 text-center w-10 text-emerald-400">P</th>
                                      <th className="py-2 text-center w-10">J</th>
                                      <th className="py-2 text-center w-10">V</th>
                                      <th className="py-2 text-center w-10">E</th>
                                      <th className="py-2 text-center w-10">D</th>
                                      <th className="py-2 text-center w-10 text-emerald-500">GP</th>
                                      <th className="py-2 text-center w-10 text-rose-500">GC</th>
                                      <th className="py-2 text-center w-10">SG</th>
                                      <th className="py-2 text-right pr-2">Ações</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/30">
                                    {champ.standings.map((row, idx) => {
                                      const isRowEditing = editingStandingClubId === row.clubId;
                                      return (
                                        <tr key={row.clubId} className="hover:bg-slate-900/40 transition-colors">
                                          <td className="py-2.5 px-1 text-center font-bold text-zinc-500">{idx + 1}</td>
                                          <td className="py-2.5 font-bold text-white">
                                            <div className="flex items-center space-x-2">
                                              <img src={row.logoUrl} alt="" className="w-4 h-4 rounded-full" />
                                              <span className="truncate max-w-[120px]">{row.clubName}</span>
                                            </div>
                                          </td>

                                          {isRowEditing ? (
                                            <>
                                              {/* Grupo */}
                                              <td className="py-1 text-center">
                                                <input
                                                  type="text"
                                                  placeholder="Ex: Grupo A"
                                                  value={editSGroup}
                                                  onChange={(e) => setEditSGroup(e.target.value)}
                                                  className="w-16 bg-[#0f172a] border border-slate-850 text-[10px] rounded px-1 py-0.5 text-center text-zinc-300 font-bold uppercase"
                                                />
                                              </td>
                                              {/* Points */}
                                              <td className="py-1 text-center">
                                                <input
                                                  type="number"
                                                  value={editSPoints}
                                                  onChange={(e) => setEditSPoints(Math.max(0, Number(e.target.value)))}
                                                  className="w-8 bg-[#0f172a] border border-slate-850 text-[10px] rounded text-center text-emerald-400 font-bold"
                                                />
                                              </td>
                                              {/* Played */}
                                              <td className="py-1 text-center">
                                                <input
                                                  type="number"
                                                  value={editSPlayed}
                                                  onChange={(e) => setEditSPlayed(Math.max(0, Number(e.target.value)))}
                                                  className="w-8 bg-[#0f172a] border border-slate-850 text-[10px] rounded text-center text-white"
                                                />
                                              </td>
                                              {/* Won */}
                                              <td className="py-1 text-center">
                                                <input
                                                  type="number"
                                                  value={editSWon}
                                                  onChange={(e) => setEditSWon(Math.max(0, Number(e.target.value)))}
                                                  className="w-8 bg-[#0f172a] border border-slate-850 text-[10px] rounded text-center text-white"
                                                />
                                              </td>
                                              {/* Drawn */}
                                              <td className="py-1 text-center">
                                                <input
                                                  type="number"
                                                  value={editSDrawn}
                                                  onChange={(e) => setEditSDrawn(Math.max(0, Number(e.target.value)))}
                                                  className="w-8 bg-[#0f172a] border border-slate-850 text-[10px] rounded text-center text-white"
                                                />
                                              </td>
                                              {/* Lost */}
                                              <td className="py-1 text-center">
                                                <input
                                                  type="number"
                                                  value={editSLost}
                                                  onChange={(e) => setEditSLost(Math.max(0, Number(e.target.value)))}
                                                  className="w-8 bg-[#0f172a] border border-slate-850 text-[10px] rounded text-center text-white"
                                                />
                                              </td>
                                              {/* Goals For */}
                                              <td className="py-1 text-center">
                                                <input
                                                  type="number"
                                                  value={editSGoalsFor}
                                                  onChange={(e) => setEditSGoalsFor(Math.max(0, Number(e.target.value)))}
                                                  className="w-8 bg-[#0f172a] border border-slate-850 text-[10px] rounded text-center text-emerald-450"
                                                />
                                              </td>
                                              {/* Goals Against */}
                                              <td className="py-1 text-center">
                                                <input
                                                  type="number"
                                                  value={editSGoalsAgainst}
                                                  onChange={(e) => setEditSGoalsAgainst(Math.max(0, Number(e.target.value)))}
                                                  className="w-8 bg-[#0f172a] border border-slate-850 text-[10px] rounded text-center text-rose-450"
                                                />
                                              </td>
                                              {/* Goal Difference */}
                                              <td className="py-2.5 text-center text-zinc-400 font-bold">
                                                {Number(editSGoalsFor) - Number(editSGoalsAgainst)}
                                              </td>
                                              {/* Actions */}
                                              <td className="py-1 text-right space-x-1.5 pr-2">
                                                <button
                                                  type="button"
                                                  onClick={() => handleSaveStandingRow(champ.id, row.clubId)}
                                                  className="text-emerald-400 hover:text-emerald-300 font-bold text-[10px] uppercase cursor-pointer"
                                                >
                                                  OK
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setEditingStandingClubId(null)}
                                                  className="text-zinc-500 hover:text-zinc-400 font-bold text-[10px] uppercase cursor-pointer"
                                                >
                                                  Sair
                                                </button>
                                              </td>
                                            </>
                                          ) : (
                                            <>
                                              {/* Grupo */}
                                              <td className="py-2.5 text-center font-bold text-zinc-400 uppercase">
                                                {row.group ? (
                                                  <span className="px-1.5 py-0.5 text-[8px] bg-slate-900 border border-slate-800 text-zinc-300 rounded font-bold">
                                                    {row.group}
                                                  </span>
                                                ) : (
                                                  <span className="text-zinc-600 italic text-[10px]">-</span>
                                                )}
                                              </td>
                                              <td className="py-2.5 text-center font-bold text-emerald-400">{row.points}</td>
                                              <td className="py-2.5 text-center text-white">{row.played}</td>
                                              <td className="py-2.5 text-center">{row.won}</td>
                                              <td className="py-2.5 text-center">{row.drawn}</td>
                                              <td className="py-2.5 text-center">{row.lost}</td>
                                              <td className="py-2.5 text-center text-emerald-500/80">{row.goalsFor}</td>
                                              <td className="py-2.5 text-center text-rose-500/80">{row.goalsAgainst}</td>
                                              <td className="py-2.5 text-center font-bold text-zinc-400">{row.goalDifference}</td>
                                              <td className="py-2.5 text-right space-x-1 pr-2">
                                                {isEnded ? (
                                                  <span className="text-zinc-500 font-mono text-[10px] uppercase">🔒 Congelado</span>
                                                ) : (
                                                  <>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        handleStartEditingStandingRow(row);
                                                      }}
                                                      className="text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 p-1 rounded cursor-pointer transition-colors"
                                                      title="Editar Linha"
                                                    >
                                                      <Edit2 className="w-3.5 h-3.5 inline" />
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => handleRemoveClubFromStandings(champ.id, row.clubId)}
                                                      className="text-rose-500 hover:text-rose-400 hover:bg-slate-800 p-1 rounded cursor-pointer transition-colors"
                                                      title="Remover Clube"
                                                    >
                                                      <Trash2 className="w-3.5 h-3.5 inline" />
                                                    </button>
                                                  </>
                                                )}
                                              </td>
                                            </>
                                          )}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* NOTÍCIAS (NEWS) TAB VIEW */}
          {activeTab === 'news' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center space-x-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Voltar para o Dashboard</span>
                </button>
              </div>

              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-black text-white uppercase border-b border-slate-800 pb-2">
                  📰 Publicar Nova Matéria Esportiva
                </h3>
                <form onSubmit={handlePublishNews} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Título da Notícia</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Mbappé assina acordo histórico..."
                        value={newsTitle}
                        onChange={(e) => setNewsTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Categoria</label>
                      <select
                        value={newsCat}
                        onChange={(e) => setNewsCat(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      >
                        <option value="Geral">Geral</option>
                        <option value="Transferência">Transferência</option>
                        <option value="Lesão">Lesão</option>
                        <option value="Entrevista">Entrevista</option>
                        <option value="Rumor">Rumor</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Linha Fina / Resumo Curto</label>
                      <input
                        type="text"
                        placeholder="Breve sumário"
                        value={newsSummary}
                        onChange={(e) => setNewsSummary(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Clube Vinculado (Opcional)</label>
                      <select
                        value={newsClubId}
                        onChange={(e) => setNewsClubId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      >
                        <option value="">Nenhum</option>
                        {clubs.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Link da Imagem (URL)</label>
                      <input
                        type="text"
                        placeholder="https://exemplo.com/foto.jpg"
                        value={newsImageUrl}
                        onChange={(e) => setNewsImageUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase block">Ou Upload de Imagem</label>
                      <div className="flex items-center space-x-2 pt-0.5">
                        {newsImageUrl ? (
                          <img src={newsImageUrl} alt="Preview" className="w-12 h-8 rounded bg-slate-850 object-cover border border-slate-700 shrink-0" />
                        ) : (
                          <div className="w-12 h-8 rounded bg-slate-850 flex items-center justify-center text-[8px] font-bold text-zinc-500 border border-slate-800 shrink-0">Sem Foto</div>
                        )}
                        <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[11px] font-bold cursor-pointer select-none">
                          Fazer Upload
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setNewsImageUrl(event.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {newsImageUrl && (
                          <button
                            type="button"
                            onClick={() => setNewsImageUrl('')}
                            className="px-2.5 py-2 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 rounded-xl text-[11px] font-bold border border-rose-900/30 cursor-pointer"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Conteúdo Editorial Completo</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Redija o texto da matéria..."
                      value={newsContent}
                      onChange={(e) => setNewsContent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-3 text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Publicar Matéria
                  </button>
                </form>
              </div>

              {/* GERENCIAR MATÉRIAS (MANAGE NEWS) */}
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-black text-white uppercase">
                    📰 Gerenciar Matérias Esportivas
                  </h3>
                  {news.length > 0 && (
                    <div className="flex items-center gap-2">
                      {isConfirmingClearAllNews ? (
                        <div className="flex items-center gap-1.5 animate-fade-in bg-rose-500/10 border border-rose-500/20 p-1.5 rounded-lg">
                          <span className="text-[10px] font-bold text-rose-400">Excluir tudo?</span>
                          <button
                            type="button"
                            onClick={() => {
                              clearAllNews();
                              setIsConfirmingClearAllNews(false);
                            }}
                            className="px-2 py-0.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded cursor-pointer"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsConfirmingClearAllNews(false)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-zinc-300 text-[10px] font-bold rounded cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsConfirmingClearAllNews(true)}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer border border-rose-500/20"
                        >
                          🗑️ Apagar Todas as Notícias
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {news.length === 0 ? (
                  <p className="text-zinc-500 text-xs italic">Nenhuma notícia cadastrada no sistema.</p>
                ) : (
                  <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto pr-1 space-y-1">
                    {news.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-3 group">
                        <div className="flex items-center space-x-3 min-w-0">
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-12 h-10 object-cover rounded-lg bg-slate-900 border border-slate-800 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                              {item.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                              <span className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded font-bold uppercase text-[8px] text-zinc-400 shrink-0">
                                {item.category}
                              </span>
                              <span>•</span>
                              <span className="shrink-0">{item.publishedAt}</span>
                              {item.clubName && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-500 font-bold truncate">{item.clubName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            deleteNews(item.id);
                            addLog('Notícia apagada', item.title, 'bg-rose-500');
                          }}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-all cursor-pointer border border-rose-500/20 shrink-0"
                          title="Excluir Notícia"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NOTIFICAÇÕES (NOTIFICATIONS) TAB VIEW */}
          {activeTab === 'notifs' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center space-x-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Voltar para o Dashboard</span>
                </button>
              </div>

              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-black text-white uppercase border-b border-slate-800 pb-2">
                  📢 Disparar Alerta Push Global (Toasts em tempo real)
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Envie notificações instantâneas que serão exibidas como alertas Toasts imediatos para todos os usuários logados e armazenadas na caixa de entrada.
                </p>
                <form onSubmit={handleBroadcastNotification} className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Título da Mensagem</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 🚨 GOL! Real Madrid empata a partida..."
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Categoria</label>
                      <select
                        value={notifType}
                        onChange={(e) => setNotifType(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white"
                      >
                        <option value="sistema">Sistema / Geral</option>
                        <option value="golo">Gols / Placar</option>
                        <option value="noticia">Notícias Esportivas</option>
                        <option value="jogo">Eventos de Jogos</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Mensagem Completa</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Redija a notificação..."
                      value={notifBody}
                      onChange={(e) => setNotifBody(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Transmitir Push Global
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ESTATÍSTICAS / REPORTS TAB VIEW */}
          {activeTab === 'stats' && (
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-6 animate-fade-in">
              <h3 className="text-sm font-black text-white uppercase border-b border-slate-800 pb-2">
                📊 Estatísticas de Servidor e Ingressos
              </h3>
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/40 space-y-4">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Distribuição de Dispositivos</span>
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Android App</span>
                      <span className="font-mono text-zinc-400">58% (722 acessos)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '58%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>iOS App</span>
                      <span className="font-mono text-zinc-400">27% (336 acessos)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '27%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Web browsers</span>
                      <span className="font-mono text-zinc-400">15% (187 acessos)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REPORTS TAB VIEW */}
          {activeTab === 'reports' && (
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4 animate-fade-in">
              <h3 className="text-sm font-black text-white uppercase border-b border-slate-800 pb-2">
                📂 Relatórios & Consolidados
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs font-black text-zinc-200">Relatório Financeiro Trimestral</p>
                  <p className="text-[10px] text-zinc-500 font-medium mt-1">Geração de pdf com dados de transações e anúncios.</p>
                  <button className="mt-3 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-bold cursor-pointer">
                    Exportar PDF
                  </button>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs font-black text-zinc-200">Relatório de Atividade e Engajamento</p>
                  <p className="text-[10px] text-zinc-500 font-medium mt-1">Atalhos para planilhas CSV com acessos por usuário.</p>
                  <button className="mt-3 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-bold cursor-pointer">
                    Exportar CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SYSTEM LOGS TAB VIEW */}
          {activeTab === 'logs' && (
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 space-y-4 animate-fade-in h-[480px] flex flex-col">
              <h3 className="text-sm font-black text-white uppercase border-b border-slate-800 pb-2 flex justify-between items-center shrink-0">
                <span>💻 Terminal de Logs do Sistema</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  SOCKET: ACTIVE
                </span>
              </h3>
              <div className="flex-1 bg-slate-950 border border-slate-800/80 rounded-xl p-4 font-mono text-[11px] text-zinc-400 overflow-y-auto space-y-2.5">
                <p className="text-zinc-500">[SYSTEM] [{new Date().toLocaleDateString()}] Inicializando módulos de rede...</p>
                <p className="text-emerald-500">[ONLINE] Servidor Web sincronizado com sucesso na porta 3000.</p>
                <p className="text-blue-500">[AUTH] Usuário mmeum9@gmail.com validado como ADMINISTRADOR.</p>
                <p className="text-zinc-500">[DB] Sincronização offline-first: {clubs.length} clubes, {players.length} jogadores carregados do LocalStorage.</p>
                {activities.map((act) => (
                  <p key={act.id}>
                    <span className="text-purple-400">[ACTION]</span> <span className="text-zinc-500">[{act.time}]</span> {act.title}: {act.desc}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* PLACEHOLDER VIEWS */}
          {['users', 'escalacoes', 'banners', 'financeiro', 'configuracoes', 'permissoes'].includes(activeTab) && (
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-8 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-zinc-400 border border-slate-700">
                <Sliders className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h4 className="text-sm font-black text-white uppercase">Módulo de {activeTab.toUpperCase()}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Esta seção administrativa está pré-configurada com as diretrizes visuais do painel mSoccer. Os dados serão sincronizados localmente na próxima atualização do sistema.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
