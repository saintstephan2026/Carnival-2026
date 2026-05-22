import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// High-level synchronization API to persist our application state to the database
export const supabaseSync = {
  // Fetch everything upon app load
  async loadAllState() {
    try {
      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase URL or Anon key is missing in environment variables. Using local fallback.');
        return null;
      }

      // Fetch Days
      const { data: daysData, error: daysError } = await supabase
        .from('days')
        .select('*');
      if (daysError) throw daysError;

      // Fetch Games
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*');
      if (gamesError) throw gamesError;

      // Fetch Sub-games
      const { data: subGamesData, error: subGamesError } = await supabase
        .from('sub_games')
        .select('*');
      if (subGamesError) throw subGamesError;

      // Fetch Teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*');
      if (teamsError) throw teamsError;

      // Fetch Team Scores
      const { data: teamScoresData, error: teamScoresError } = await supabase
        .from('team_scores')
        .select('*');
      if (teamScoresError) throw teamScoresError;

      // Fetch Players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*');
      if (playersError) throw playersError;

      // Fetch Player Scores
      const { data: playerScoresData, error: playerScoresError } = await supabase
        .from('player_scores')
        .select('*');
      if (playerScoresError) throw playerScoresError;

      // Fetch Settings (Target score & Admin PIN)
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('*');
      
      let targetScore = 500;
      let adminPin = '1234';
      if (!settingsError && settingsData) {
        const row = settingsData.find(s => s.key === 'event_target_score');
        if (row) targetScore = parseInt(row.value, 10) || 500;

        const pinRow = settingsData.find(s => s.key === 'admin_pin');
        if (pinRow) adminPin = pinRow.value || '1234';
      }

      // Transform raw base DB objects to frontend app structure
      const daysRecord: Record<string, any> = {};
      daysData?.forEach(day => {
        daysRecord[day.id] = {
          id: day.id,
          name: day.name,
          date: day.date
        };
      });

      // Prepare subgames grouping
      const subgamesByGameId: Record<string, any[]> = {};
      subGamesData?.forEach(sg => {
        if (!subgamesByGameId[sg.game_id]) {
          subgamesByGameId[sg.game_id] = [];
        }
        subgamesByGameId[sg.game_id].push({
          id: sg.id,
          name: sg.name,
          maxPoints: sg.max_points
        });
      });

      const gamesList = (gamesData || []).map(g => ({
        id: g.id,
        name: g.name,
        maxPoints: g.max_points,
        subGames: subgamesByGameId[g.id] || [],
        isTeamScoring: g.is_team_scoring,
        isMvpScoring: g.is_mvp_scoring,
        dayId: g.day_id
      }));

      // Prepare team scores grouping
      const scoresByTeamId: Record<string, Record<string, number>> = {};
      teamScoresData?.forEach(row => {
        if (!scoresByTeamId[row.team_id]) {
          scoresByTeamId[row.team_id] = {};
        }
        scoresByTeamId[row.team_id][row.score_id] = row.score;
      });

      const teamsRecord: Record<string, any> = {};
      teamsData?.forEach(t => {
        teamsRecord[t.id] = {
          id: t.id,
          nameAr: t.name_ar,
          emojis: t.emojis,
          color: t.color,
          code: t.code,
          scores: scoresByTeamId[t.id] || {}
        };
      });

      // Prepare player scores grouping
      const scoresByPlayerId: Record<string, Record<string, number>> = {};
      playerScoresData?.forEach(row => {
        if (!scoresByPlayerId[row.player_id]) {
          scoresByPlayerId[row.player_id] = {};
        }
        scoresByPlayerId[row.player_id][row.target_id] = row.score;
      });

      const playersRecord: Record<string, any> = {};
      playersData?.forEach(p => {
        playersRecord[p.id] = {
          id: p.id,
          name: p.name,
          teamId: p.team_id,
          scores: scoresByPlayerId[p.id] || {}
        };
      });

      // Make sure we have fallback if days/teams table is empty
      if (Object.keys(daysRecord).length === 0) return null;

      return {
        days: daysRecord,
        games: gamesList,
        teams: teamsRecord,
        players: playersRecord,
        eventTargetScore: targetScore,
        adminPin: adminPin,
      };

    } catch (e) {
      console.error('Error fetching state from Supabase:', e);
      return null;
    }
  },

  // Save/Upsert Day to Supabase
  async saveDay(id: string, name: string, date: string) {
    try {
      const { error } = await supabase.from('days').upsert({ id, name, date });
      if (error) throw error;
    } catch (e) {
      console.error('Supabase Error writing day:', e);
      throw e;
    }
  },

  // Delete Day
  async deleteDay(id: string) {
    try {
      const { error } = await supabase.from('days').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Supabase Error deleting day:', e);
      throw e;
    }
  },

  // Save/Upsert Game to Supabase
  async saveGame(id: string, name: string, maxPoints: number, isTeamScoring: boolean, isMvpScoring: boolean, dayId?: string) {
    try {
      const { error } = await supabase.from('games').upsert({
        id,
        name,
        max_points: maxPoints,
        is_team_scoring: isTeamScoring,
        is_mvp_scoring: isMvpScoring,
        day_id: dayId || null
      });
      if (error) throw error;
    } catch (e) {
      console.error('Supabase Error writing game:', e);
      throw e;
    }
  },

  // Delete Game
  async deleteGame(id: string) {
    try {
      const { error } = await supabase.from('games').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Supabase Error deleting game:', e);
      throw e;
    }
  },

  // Save/Upsert SubGame
  async saveSubGame(id: string, gameId: string, name: string, maxPoints: number) {
    try {
      const { error } = await supabase.from('sub_games').upsert({
        id,
        game_id: gameId,
        name,
        max_points: maxPoints
      });
      if (error) throw error;
    } catch (e) {
      console.error('Supabase Error writing sub_game:', e);
      throw e;
    }
  },

  // Delete SubGame
  async deleteSubGame(id: string) {
    try {
      const { error } = await supabase.from('sub_games').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Supabase Error deleting sub_game:', e);
      throw e;
    }
  },

  // Upsert Team Info
  async saveTeam(id: string, nameAr: string, emojis: string, color: string, code: string) {
    try {
      const { error } = await supabase.from('teams').upsert({
        id,
        name_ar: nameAr,
        emojis,
        color,
        code
      });
      if (error) throw error;
    } catch (e) {
      console.error('Supabase Error writing team:', e);
      throw e;
    }
  },

  // Upsert Team Score
  async saveTeamScore(teamId: string, scoreId: string, score: number) {
    try {
      const { error } = await supabase.from('team_scores').upsert({
        team_id: teamId,
        score_id: scoreId,
        score
      });
      if (error) throw error;
    } catch (e) {
      console.error('Supabase Error writing team score:', e);
      throw e;
    }
  },

  // Save/Upsert Player
  async savePlayer(id: string, name: string, teamId: string) {
    try {
      const { error } = await supabase.from('players').upsert({
        id,
        name,
        team_id: teamId
      });
      if (error) throw error;
    } catch (e) {
      console.error('Supabase Error writing player:', e);
      throw e;
    }
  },

  // Delete Player
  async deletePlayer(id: string) {
    try {
      const { error } = await supabase.from('players').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Supabase Error deleting player:', e);
      throw e;
    }
  },

  // Save/Upsert Player Score
  async savePlayerScore(playerId: string, targetId: string, score: number) {
    try {
      const { error } = await supabase.from('player_scores').upsert({
        player_id: playerId,
        target_id: targetId,
        score
      });
      if (error) throw error;
    } catch (e) {
      console.error('Supabase Error writing player score:', e);
      throw e;
    }
  },

  // Save global settings
  async saveSetting(key: string, value: string) {
    try {
      const { error } = await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
      if (error) throw error;
    } catch (e) {
      console.error('Supabase Error updating setting:', e);
      throw e;
    }
  }
};
