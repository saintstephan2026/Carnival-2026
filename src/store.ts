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
  adminPin: string;
  days: Record<string, Day>;
  activeDayId: string | null;
  supabaseLoaded: boolean;
  dbNotification: { message: string; type: 'success' | 'info' | 'error' } | null;
  
  loadSupabaseData: () => Promise<void>;
  clearDbNotification: () => void;
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
  adminPin: '1234',
  activeDayId: 'default-day',
  supabaseLoaded: false,
  dbNotification: null,
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
        adminPin: data.adminPin || '1234',
        supabaseLoaded: true,
        // Pick activeDayId if any exists, else default-day
        activeDayId: Object.keys(data.days)[0] || 'default-day'
      });
    } else {
      set({ supabaseLoaded: true });
    }
  },

  clearDbNotification: () => set({ dbNotification: null }),

  setEventTargetScore: (score) => {
    set({ 
      eventTargetScore: score,
      dbNotification: { message: `Event target score set to ${score} in the Database!`, type: 'success' }
    });
    setTimeout(() => {
      useStore.getState().clearDbNotification();
    }, 4500);
    supabaseSync.saveSetting('event_target_score', score.toString()).catch(err => {
      set({ dbNotification: { message: `DB Error saving target score: ${err.message || err}`, type: 'error' } });
    });
  },

  setTeamCode: (teamId, code) => set((state) => {
    const updatedTeam = {
      ...state.teams[teamId],
      code,
    };
    supabaseSync.saveTeam(updatedTeam.id, updatedTeam.nameAr, updatedTeam.emojis, updatedTeam.color, updatedTeam.code).catch(err => {
      set({ dbNotification: { message: `DB Error updating team code: ${err.message || err}`, type: 'error' } });
    });
    setTimeout(() => {
      useStore.getState().clearDbNotification();
    }, 4500);
    return {
      teams: {
        ...state.teams,
        [teamId]: updatedTeam
      },
      dbNotification: { message: `Team "${updatedTeam.nameAr}" access code updated successfully in the Database!`, type: 'success' }
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
      activeDayId: id,
      dbNotification: { message: `Day "${finalName}" saved successfully in the Database!`, type: 'success' }
    }));

    setTimeout(() => {
      useStore.getState().clearDbNotification();
    }, 4500);

    supabaseSync.saveDay(id, finalName, dateStr).catch(err => {
      set({ dbNotification: { message: `DB Error saving day: ${err.message || err}`, type: 'error' } });
    });
    return id;
  },

  deleteDay: (dayId) => set((state) => {
    const newDays = { ...state.days };
    const dayName = newDays[dayId]?.name || 'Day';
    delete newDays[dayId];
    const activeId = state.activeDayId === dayId ? (Object.keys(newDays)[0] || null) : state.activeDayId;
    
    supabaseSync.deleteDay(dayId).catch(err => {
      set({ dbNotification: { message: `DB Error deleting day: ${err.message || err}`, type: 'error' } });
    });
    setTimeout(() => {
      useStore.getState().clearDbNotification();
    }, 4500);
    
    return {
      days: newDays,
      activeDayId: activeId,
      games: state.games.filter(g => g.dayId !== dayId),
      dbNotification: { message: `"${dayName}" and its games completely deleted from the Database!`, type: 'success' }
    };
  }),

  setActiveDayId: (dayId) => set({ activeDayId: dayId }),

  addGame: (name, maxPoints, isTeamScoring = true, isMvpScoring = true, dayId) => set((state) => {
    const dId = dayId || state.activeDayId || 'default-day';
    const newGame = { id: Date.now().toString(), name, maxPoints, subGames: [], isTeamScoring, isMvpScoring, dayId: dId };
    
    supabaseSync.saveGame(newGame.id, newGame.name, newGame.maxPoints, newGame.isTeamScoring, newGame.isMvpScoring, newGame.dayId).catch(err => {
      set({ dbNotification: { message: `DB Error saving game: ${err.message || err}`, type: 'error' } });
    });
    setTimeout(() => {
      useStore.getState().clearDbNotification();
    }, 4500);
    return {
      games: [...state.games, newGame],
      dbNotification: { message: `Game "${name}" saved successfully in the Database!`, type: 'success' }
    };
  }),

  deleteGame: (gameId) => set((state) => {
    const game = state.games.find(g => g.id === gameId);
    const gameName = game ? game.name : 'Game';
    supabaseSync.deleteGame(gameId).catch(err => {
      set({ dbNotification: { message: `DB Error deleting game: ${err.message || err}`, type: 'error' } });
    });
    setTimeout(() => {
      useStore.getState().clearDbNotification();
    }, 4500);
    return {
      games: state.games.filter(g => g.id !== gameId),
      dbNotification: { message: `Game "${gameName}" deleted successfully from the Database!`, type: 'success' }
    };
  }),

  addSubGame: (gameId, name, maxPoints) => set((state) => {
    const subGameId = Date.now().toString();
    supabaseSync.saveSubGame(subGameId, gameId, name, maxPoints).catch(err => {
      set({ dbNotification: { message: `DB Error saving sub-game: ${err.message || err}`, type: 'error' } });
    });
    setTimeout(() => {
      useStore.getState().clearDbNotification();
    }, 4500);
    return {
      games: state.games.map(g => g.id === gameId ? {
        ...g,
        subGames: [...g.subGames, { id: subGameId, name, maxPoints }]
      } : g),
      dbNotification: { message: `Sub-game "${name}" saved successfully in the Database!`, type: 'success' }
    };
  }),

  deleteSubGame: (gameId, subGameId) => set((state) => {
    const game = state.games.find(g => g.id === gameId);
    const sgName = game?.subGames.find(sg => sg.id === subGameId)?.name || 'Sub-game';
    supabaseSync.deleteSubGame(subGameId).catch(err => {
      set({ dbNotification: { message: `DB Error deleting sub-game: ${err.message || err}`, type: 'error' } });
    });
    setTimeout(() => {
      useStore.getState().clearDbNotification();
    }, 4500);
    return {
      games: state.games.map(g => g.id === gameId ? {
        ...g,
        subGames: g.subGames.filter(sg => sg.id !== subGameId)
      } : g),
      dbNotification: { message: `Sub-game "${sgName}" deleted from the Database!`, type: 'success' }
    };
  }),

  editGame: (gameId, name, maxPoints, isTeamScoring, isMvpScoring) => set((state) => {
    const game = state.games.find(g => g.id === gameId);
    if (game) {
      supabaseSync.saveGame(gameId, name, maxPoints, isTeamScoring, isMvpScoring, game.dayId).catch(err => {
        set({ dbNotification: { message: `DB Error updating game: ${err.message || err}`, type: 'error' } });
      });
    }
    setTimeout(() => {
      useStore.getState().clearDbNotification();
    }, 4500);
    return {
      games: state.games.map(g => g.id === gameId ? {
        ...g,
        name,
        maxPoints,
        isTeamScoring,
        isMvpScoring
      } : g),
      dbNotification: { message: `Game "${name}" details updated in the Database!`, type: 'success' }
    };
  }),

  editSubGame: (gameId, subGameId, name, maxPoints) => set((state) => {
    supabaseSync.saveSubGame(subGameId, gameId, name, maxPoints).catch(err => {
      set({ dbNotification: { message: `DB Error updating sub-game: ${err.message || err}`, type: 'error' } });
    });
    setTimeout(() => {
      useStore.getState().clearDbNotification();
    }, 4500);
    return {
      games: state.games.map(g => g.id === gameId ? {
        ...g,
        subGames: g.subGames.map(sg => sg.id === subGameId ? {
          ...sg,
          name,
          maxPoints
        } : sg)
      } : g),
      dbNotification: { message: `Sub-game "${name}" updated in the Database!`, type: 'success' }
    };
  }),

  updateScore: (teamId, gameId, score) => set((state) => {
    supabaseSync.saveTeamScore(teamId, gameId, score).catch(err => {
      set({ dbNotification: { message: `DB Error saving team score: ${err.message || err}`, type: 'error' } });
    });
    const teamName = state.teams[teamId]?.nameAr || 'Team';
    const gameName = state.games.find(g => g.id === gameId)?.name || 'Game';
    setTimeout(() => {
      useStore.getState().clearDbNotification();
    }, 4500);
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
      },
      dbNotification: { message: `Score for ${teamName} in "${gameName}" saved successfully in the Database!`, type: 'success' }
    };
  }),

  addPlayer: (name, teamId) => set((state) => {
    const id = Date.now().toString();
    supabaseSync.savePlayer(id, name, teamId).catch(err => {
      set({ dbNotification: { message: `DB Error registering player: ${err.message || err}`, type: 'error' } });
    });
    const teamName = state.teams[teamId]?.nameAr || 'Team';
    setTimeout(() => {
      useStore.getState().clearDbNotification();
    }, 4500);
    return {
      players: {
        ...state.players,
        [id]: { id, name, teamId, scores: {} }
      },
      dbNotification: { message: `Player "${name}" registered for ${teamName} and saved in the Database!`, type: 'success' }
    };
  }),

  deletePlayer: (playerId) => set((state) => {
    const playerName = state.players[playerId]?.name || 'Player';
    supabaseSync.deletePlayer(playerId).catch(err => {
      set({ dbNotification: { message: `DB Error deleting player: ${err.message || err}`, type: 'error' } });
    });
    const newPlayers = { ...state.players };
    delete newPlayers[playerId];
    setTimeout(() => {
      useStore.getState().clearDbNotification();
    }, 4500);
    return { 
      players: newPlayers,
      dbNotification: { message: `Player "${playerName}" removed from the Database!`, type: 'success' }
    };
  }),

  updatePlayerScore: (playerId, targetId, score) => set((state) => {
    supabaseSync.savePlayerScore(playerId, targetId, score).catch(err => {
      set({ dbNotification: { message: `DB Error updating player score: ${err.message || err}`, type: 'error' } });
    });
    const playerName = state.players[playerId]?.name || 'Player';
    setTimeout(() => {
      useStore.getState().clearDbNotification();
    }, 4500);
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
      },
      dbNotification: { message: `MVP score for "${playerName}" updated in the Database!`, type: 'success' }
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
