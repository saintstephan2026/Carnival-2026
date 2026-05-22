import { create } from 'zustand';
import { supabaseSync } from './lib/supabase';

export interface SubGame {
  id: string;
  name: string;
  maxPoints: number;
}

export interface Day {
  id: string;
  name: string;
  date: string;
}

export interface Game {
  id: string;
  name: string;
  maxPoints: number;
  subGames: SubGame[];
  isTeamScoring: boolean;
  isMvpScoring: boolean;
  dayId?: string;
}

export interface Team {
  id: string;
  nameAr: string;
  emojis: string;
  color: string;
  scores: Record<string, number>;
  code: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  scores: Record<string, number>; // gameId or 'bonus' -> points
}

interface AppState {
  teams: Record<string, Team>;
  games: Game[];
  players: Record<string, Player>;
  eventTargetScore: number;
  days: Record<string, Day>;
  activeDayId: string | null;
  supabaseLoaded: boolean;
  
  loadSupabaseData: () => Promise<void>;
  addDay: (name?: string, date?: string) => string;
  deleteDay: (dayId: string) => void;
  setActiveDayId: (dayId: string | null) => void;

  addGame: (name: string, maxPoints: number, isTeamScoring?: boolean, isMvpScoring?: boolean, dayId?: string) => void;
  deleteGame: (gameId: string) => void;
  addSubGame: (gameId: string, name: string, maxPoints: number) => void;
  deleteSubGame: (gameId: string, subGameId: string) => void;
  
  editGame: (gameId: string, name: string, maxPoints: number, isTeamScoring: boolean, isMvpScoring: boolean) => void;
  editSubGame: (gameId: string, subGameId: string, name: string, maxPoints: number) => void;

  updateScore: (teamId: string, gameId: string, score: number) => void;
  setEventTargetScore: (score: number) => void;

  addPlayer: (name: string, teamId: string) => void;
  deletePlayer: (playerId: string) => void;
  updatePlayerScore: (playerId: string, targetId: string, score: number) => void;
  setTeamCode: (teamId: string, code: string) => void;
}

export const useStore = create<AppState>((set) => ({
  eventTargetScore: 500, // Fixed target for building progress 
  activeDayId: 'default-day',
  supabaseLoaded: false,
  days: {
    'default-day': {
      id: 'default-day',
      name: 'Day 1',
      date: '2026-05-21',
    }
  },
  games: [
    { id: 'game1', name: 'Crane Challenge', maxPoints: 50, subGames: [], isTeamScoring: true, isMvpScoring: true, dayId: 'default-day' },
    { id: 'game2', name: 'Cargo Loading', maxPoints: 50, subGames: [], isTeamScoring: true, isMvpScoring: true, dayId: 'default-day' },
  ],
  teams: {
    construction: {
      id: 'construction',
      nameAr: 'اولاد نحميا للمقاولات',
      emojis: '🏗️🔨',
      color: '#6C9EE2',
      scores: { game1: 10, game2: 10 },
      code: '1111',
    },
    shipping: {
      id: 'shipping',
      nameAr: 'نوح وشركاؤه',
      emojis: '🚢🌊',
      color: '#F9A01B',
      scores: { game1: 25, game2: 25 },
      code: '2222',
    },
  },
  players: {}, // personal MVP tracking

  loadSupabaseData: async () => {
    const data = await supabaseSync.loadAllState();
    if (data) {
      set({
        days: data.days,
        games: data.games,
        teams: data.teams,
        players: data.players,
        eventTargetScore: data.eventTargetScore,
        supabaseLoaded: true,
        // Pick activeDayId if any exists, else default-day
        activeDayId: Object.keys(data.days)[0] || 'default-day'
      });
    } else {
      set({ supabaseLoaded: true });
    }
  },

  setEventTargetScore: (score) => {
    set({ eventTargetScore: score });
    supabaseSync.saveSetting('event_target_score', score.toString());
  },

  setTeamCode: (teamId, code) => set((state) => {
    const updatedTeam = {
      ...state.teams[teamId],
      code,
    };
    supabaseSync.saveTeam(updatedTeam.id, updatedTeam.nameAr, updatedTeam.emojis, updatedTeam.color, updatedTeam.code);
    return {
      teams: {
        ...state.teams,
        [teamId]: updatedTeam
      }
    };
  }),
  
  addDay: (name, date) => {
    const id = Date.now().toString();
    const today = new Date();
    const dateStr = date || today.toISOString().split('T')[0];
    const finalName = name?.trim() || `Day ${dateStr}`;
    
    set((state) => ({
      days: {
        ...state.days,
        [id]: { id, name: finalName, date: dateStr }
      },
      activeDayId: id
    }));

    supabaseSync.saveDay(id, finalName, dateStr);
    return id;
  },

  deleteDay: (dayId) => set((state) => {
    const newDays = { ...state.days };
    delete newDays[dayId];
    const activeId = state.activeDayId === dayId ? (Object.keys(newDays)[0] || null) : state.activeDayId;
    
    supabaseSync.deleteDay(dayId);
    
    return {
      days: newDays,
      activeDayId: activeId,
      games: state.games.filter(g => g.dayId !== dayId)
    };
  }),

  setActiveDayId: (dayId) => set({ activeDayId: dayId }),

  addGame: (name, maxPoints, isTeamScoring = true, isMvpScoring = true, dayId) => set((state) => {
    const dId = dayId || state.activeDayId || 'default-day';
    const newGame = { id: Date.now().toString(), name, maxPoints, subGames: [], isTeamScoring, isMvpScoring, dayId: dId };
    
    supabaseSync.saveGame(newGame.id, newGame.name, newGame.maxPoints, newGame.isTeamScoring, newGame.isMvpScoring, newGame.dayId);
    
    return {
      games: [...state.games, newGame]
    };
  }),

  deleteGame: (gameId) => set((state) => {
    supabaseSync.deleteGame(gameId);
    return {
      games: state.games.filter(g => g.id !== gameId)
    };
  }),

  addSubGame: (gameId, name, maxPoints) => set((state) => {
    const subGameId = Date.now().toString();
    supabaseSync.saveSubGame(subGameId, gameId, name, maxPoints);
    
    return {
      games: state.games.map(g => g.id === gameId ? {
        ...g,
        subGames: [...g.subGames, { id: subGameId, name, maxPoints }]
      } : g)
    };
  }),

  deleteSubGame: (gameId, subGameId) => set((state) => {
    supabaseSync.deleteSubGame(subGameId);
    return {
      games: state.games.map(g => g.id === gameId ? {
        ...g,
        subGames: g.subGames.filter(sg => sg.id !== subGameId)
      } : g)
    };
  }),

  editGame: (gameId, name, maxPoints, isTeamScoring, isMvpScoring) => set((state) => {
    const game = state.games.find(g => g.id === gameId);
    if (game) {
      supabaseSync.saveGame(gameId, name, maxPoints, isTeamScoring, isMvpScoring, game.dayId);
    }
    return {
      games: state.games.map(g => g.id === gameId ? {
        ...g,
        name,
        maxPoints,
        isTeamScoring,
        isMvpScoring
      } : g)
    };
  }),

  editSubGame: (gameId, subGameId, name, maxPoints) => set((state) => {
    supabaseSync.saveSubGame(subGameId, gameId, name, maxPoints);
    return {
      games: state.games.map(g => g.id === gameId ? {
        ...g,
        subGames: g.subGames.map(sg => sg.id === subGameId ? {
          ...sg,
          name,
          maxPoints
        } : sg)
      } : g)
    };
  }),

  updateScore: (teamId, gameId, score) => set((state) => {
    supabaseSync.saveTeamScore(teamId, gameId, score);
    return {
      teams: {
        ...state.teams,
        [teamId]: {
          ...state.teams[teamId],
          scores: {
            ...state.teams[teamId].scores,
            [gameId]: score,
          }
        }
      }
    };
  }),

  addPlayer: (name, teamId) => set((state) => {
    const id = Date.now().toString();
    supabaseSync.savePlayer(id, name, teamId);
    return {
      players: {
        ...state.players,
        [id]: { id, name, teamId, scores: {} }
      }
    };
  }),

  deletePlayer: (playerId) => set((state) => {
    supabaseSync.deletePlayer(playerId);
    const newPlayers = { ...state.players };
    delete newPlayers[playerId];
    return { players: newPlayers };
  }),

  updatePlayerScore: (playerId, targetId, score) => set((state) => {
    supabaseSync.savePlayerScore(playerId, targetId, score);
    return {
      players: {
        ...state.players,
        [playerId]: {
          ...state.players[playerId],
          scores: {
            ...state.players[playerId].scores,
            [targetId]: score
          }
        }
      }
    };
  })
}));

export const calculateTeamScore = (team: Team, games: Game[]) => {
  let total = 0;
  games.forEach(g => {
    if (g.isTeamScoring === false) return; // Skip if it shouldn't affect team progress!
    if (g.subGames && g.subGames.length > 0) {
      g.subGames.forEach(sg => {
        total += (team.scores[sg.id] || 0);
      });
    } else {
      total += (team.scores[g.id] || 0);
    }
  });
  return total;
};

export const calculateTeamProgress = (team: Team, games: Game[], targetScore: number) => {
  if (targetScore === 0) return 0;
  const currentTotal = calculateTeamScore(team, games);
  return Math.min(100, Math.max(0, (currentTotal / targetScore) * 100));
};

export const calculatePlayerScore = (player: Player) => {
  return Object.values(player.scores).reduce((sum, s) => sum + (s || 0), 0);
};
