import React, { useState, useEffect } from 'react';
import { useStore, calculateTeamScore, calculateTeamProgress, calculatePlayerScore } from '../store';
import { cn } from '../lib/utils';
import { 
  Pencil, Check, X, Award, Target, Trophy, Plus, 
  Calendar, ChevronDown, ChevronUp, Undo, Trash2 
} from 'lucide-react';

interface AnimatedScoreInputProps {
  value: number;
  min?: number;
  max: number;
  onChange: (val: number) => void;
  className?: string;
  activeColor?: string;
}

function AnimatedScoreInput({ value, min = 0, max, onChange, className = '', activeColor = 'amber' }: AnimatedScoreInputProps) {
  const [prevValue, setPrevValue] = useState(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (value !== prevValue) {
      if (value > prevValue) {
        setFlash('up');
      } else if (value < prevValue) {
        setFlash('down');
      }
      setPrevValue(value);
      const timer = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  let bgFlashClass = 'bg-white border-slate-200';
  if (flash === 'up') {
    bgFlashClass = 'bg-emerald-50 text-emerald-800 border-emerald-400 scale-105 shadow-md shadow-emerald-500/10 font-bold z-10';
  } else if (flash === 'down') {
    bgFlashClass = 'bg-rose-50 text-rose-800 border-rose-400 scale-105 shadow-md shadow-rose-500/10 font-bold z-10';
  }

  const borderFocusClass = activeColor === 'sky' 
    ? 'focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20' 
    : 'focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20';

  return (
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => {
        const val = Math.min(max, Math.max(min, parseInt(e.target.value, 10) || 0));
        onChange(val);
      }}
      className={cn(
        "text-center text-xs font-bold p-1 rounded-lg border focus:outline-none transition-all duration-300 ease-out",
        bgFlashClass,
        borderFocusClass,
        className
      )}
    />
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onCancel} />
      
      {/* Modal Dialog */}
      <div className="bg-white rounded-[24px] p-6 max-w-md w-full border border-slate-100 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 text-amber-600 mb-3">
          <span className="text-2xl">⚠️</span>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </div>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed" dir="auto">
          {message}
        </p>
        <div className="flex gap-2.5 justify-end">
          <button 
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-md cursor-pointer"
          >
            Yes, Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

interface AdminDashboardProps {
  onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const { 
    teams, games, players, days, activeDayId,
    addDay, deleteDay, setActiveDayId,
    addGame, deleteGame, addSubGame, deleteSubGame, updateScore, 
    eventTargetScore, setEventTargetScore,
    addPlayer, deletePlayer, updatePlayerScore,
    editGame, editSubGame
  } = useStore();

  const [activeTab, setActiveTab] = useState<'scoring' | 'setup' | 'mvp'>('scoring');

  // Days Forms
  const [newDayName, setNewDayName] = useState('');
  const [newDayDate, setNewDayDate] = useState(new Date().toISOString().split('T')[0]);

  // Scoring tab selected day
  const [selectedDayId, setSelectedDayId] = useState<string>('default-day');

  // Ensure selectedDayId always points to a valid day
  useEffect(() => {
    if (Object.keys(days).length > 0 && !days[selectedDayId]) {
      const firstId = Object.keys(days)[0];
      if (firstId) {
        setSelectedDayId(firstId);
      }
    }
  }, [days, selectedDayId]);

  // Game Setup Form
  const [newGameName, setNewGameName] = useState('');
  const [newGameMax, setNewGameMax] = useState('50');
  const [newGameIsTeam, setNewGameIsTeam] = useState(true);
  const [newGameIsMvp, setNewGameIsMvp] = useState(true);
  const [newGameDayId, setNewGameDayId] = useState('default-day');

  // Big Game inline edits
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editGameName, setEditGameName] = useState('');
  const [editGameMax, setEditGameMax] = useState(50);
  const [editGameIsTeam, setEditGameIsTeam] = useState(true);
  const [editGameIsMvp, setEditGameIsMvp] = useState(true);
  const [editGameDayId, setEditGameDayId] = useState('default-day');

  // SubGame Form
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [newSubGameName, setNewSubGameName] = useState('');
  const [newSubGameMax, setNewSubGameMax] = useState('10');

  // Sub Game inline edits
  const [editingSubGameId, setEditingSubGameId] = useState<string | null>(null);
  const [editSubGameName, setEditSubGameName] = useState('');
  const [editSubGameMax, setEditSubGameMax] = useState(10);

  // MVP Form
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTeam, setNewPlayerTeam] = useState('construction');

  // Collapsible Game list for scoring
  const [expandedGames, setExpandedGames] = useState<Record<string, boolean>>({});

  // Draft ratings scores
  const [draftScores, setDraftScores] = useState<Record<string, number>>({});

  // Local state for Global Target input editing
  const [localTargetScore, setLocalTargetScore] = useState<string>(eventTargetScore.toString());

  useEffect(() => {
    setLocalTargetScore(eventTargetScore.toString());
  }, [eventTargetScore]);

  // Confirm Modal state controller
  const [confirmProps, setConfirmProps] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmProps({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const handleCreateDay = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedDate = newDayDate || new Date().toISOString().split('T')[0];
    const defaultName = `Day ${formattedDate}`;
    const displayName = newDayName.trim() || defaultName;

    triggerConfirm(
      "Create New Day",
      `Are you sure you want to create a new day named "${displayName}" with date (${formattedDate})?`,
      () => {
        const dId = addDay(displayName, formattedDate);
        setSelectedDayId(dId);
        setNewGameDayId(dId);
        setNewDayName('');
      }
    );
  };

  const handleDeleteDayClick = (dayId: string, dayName: string) => {
    triggerConfirm(
      "Delete Day",
      `Are you sure you want to delete day "${dayName}"? Warning: All associated games and scores will be permanently deleted and cannot be recovered!`,
      () => {
        deleteDay(dayId);
      }
    );
  };

  const startEditingGame = (game: any) => {
    setEditingGameId(game.id);
    setEditGameName(game.name);
    setEditGameMax(game.maxPoints);
    setEditGameIsTeam(game.isTeamScoring !== false);
    setEditGameIsMvp(game.isMvpScoring !== false);
    setEditGameDayId(game.dayId || 'default-day');
  };

  const startEditingSubGame = (sg: any) => {
    setEditingSubGameId(sg.id);
    setEditSubGameName(sg.name);
    setEditSubGameMax(sg.maxPoints);
  };

  const handleSaveEditGame = (gameId: string) => {
    if (editGameName.trim()) {
      triggerConfirm(
        "Save Game Changes",
        `Are you sure you want to save modifications to the game "${editGameName.trim()}"?`,
        () => {
          editGame(gameId, editGameName.trim(), editGameMax, editGameIsTeam, editGameIsMvp);
          // Shift day structure manually if game has dayId
          useStore.setState((state) => ({
            games: state.games.map(g => g.id === gameId ? { ...g, dayId: editGameDayId } : g)
          }));
          setEditingGameId(null);
        }
      );
    }
  };

  const handleSaveEditSubGame = (gameId: string, subGameId: string) => {
    if (editSubGameName.trim()) {
      triggerConfirm(
        "Save Subgame Changes",
        `Are you sure you want to save modifications to the sub-game "${editSubGameName.trim()}"?`,
        () => {
          editSubGame(gameId, subGameId, editSubGameName.trim(), editSubGameMax);
          setEditingSubGameId(null);
        }
      );
    }
  };

  const handleAddGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGameName.trim() && !isNaN(Number(newGameMax))) {
      triggerConfirm(
        "Create Game",
        `Are you sure you want to add a new game "${newGameName.trim()}" with points limit ${newGameMax}?`,
        () => {
          addGame(newGameName.trim(), Number(newGameMax), newGameIsTeam, newGameIsMvp, newGameDayId);
          setNewGameName('');
          setNewGameMax('50');
          setNewGameIsTeam(true);
          setNewGameIsMvp(true);
        }
      );
    }
  };

  const handleAddSubGame = (e: React.FormEvent, gameId: string) => {
    e.preventDefault();
    if (newSubGameName.trim() && !isNaN(Number(newSubGameMax))) {
      triggerConfirm(
        "Add Subgame",
        `Are you sure you want to add sub-game "${newSubGameName.trim()}"?`,
        () => {
          addSubGame(gameId, newSubGameName.trim(), Number(newSubGameMax));
          setNewSubGameName('');
          setNewSubGameMax('10');
          setActiveGameId(null);
        }
      );
    }
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      triggerConfirm(
        "Create Player",
        `Are you sure you want to add player "${newPlayerName.trim()}" to the tournament roster?`,
        () => {
          addPlayer(newPlayerName.trim(), newPlayerTeam);
          setNewPlayerName('');
        }
      );
    }
  };

  const handleDeleteGameClick = (gameId: string, gameName: string) => {
    triggerConfirm(
      "Delete Game",
      `Are you sure you want to delete the game "${gameName}" and clean all team scores associated with it?`,
      () => {
        deleteGame(gameId);
      }
    );
  };

  const handleDeleteSubGameClick = (gameId: string, subGameId: string, subGameName: string) => {
    triggerConfirm(
      "Delete Subgame",
      `Are you sure you want to delete the sub-game "${subGameName}"?`,
      () => {
        deleteSubGame(gameId, subGameId);
      }
    );
  };

  const handleDeletePlayerClick = (playerId: string, playerName: string) => {
    triggerConfirm(
      "Delete Player",
      `Are you sure you want to delete player "${playerName}"?`,
      () => {
        deletePlayer(playerId);
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 w-full font-sans pb-20">
      <div className="max-w-5xl mx-auto">
        
        {/* Switch back button */}
        <button 
          onClick={onBack} 
          className="mb-8 px-5 py-2.5 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all text-sm font-semibold text-slate-700 cursor-pointer flex items-center gap-2 font-sans"
        >
          <span>←</span> Portal Hub
        </button>
        
        {/* Title area */}
        <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
             <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Admin Dashboard</h1>
             <p className="text-slate-500 font-medium text-sm sm:text-base">Configure challenges, record scores, and track players securely.</p>
           </div>
           
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
             <label className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Global Target:</label>
             <div className="flex items-center gap-2">
               <input 
                 type="number" 
                 min="1"
                 value={localTargetScore} 
                 onChange={(e) => setLocalTargetScore(e.target.value)} 
                 className="w-24 bg-slate-50 border border-slate-200 p-2 rounded-lg text-center focus:outline-none focus:border-slate-400 font-bold text-slate-800" 
               />
               <button
                 type="button"
                 onClick={() => {
                   const val = Number(localTargetScore) || 1;
                   triggerConfirm(
                     "Update Target Score",
                     `Are you sure you want to update the overall project target score to ${val} points?`,
                     () => {
                       setEventTargetScore(val);
                     }
                   );
                 }}
                 disabled={localTargetScore === eventTargetScore.toString()}
                 className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed font-sans"
               >
                 <Check size={14} />
                 <span>Save</span>
               </button>
             </div>
           </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-white rounded-[16px] p-1.5 shadow-sm border border-slate-200 mb-8 max-w-fit overflow-x-auto whitespace-nowrap">
          <button 
            type="button"
            onClick={() => {
              setDraftScores({});
              setActiveTab('scoring');
            }} 
            className={cn("px-6 py-2.5 rounded-[12px] text-sm font-bold transition cursor-pointer", activeTab === 'scoring' ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900")}
          >
            Team Scoring
          </button>
          <button 
            type="button"
            onClick={() => {
              setDraftScores({});
              setActiveTab('setup');
            }} 
            className={cn("px-6 py-2.5 rounded-[12px] text-sm font-bold transition cursor-pointer", activeTab === 'setup' ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900")}
          >
            Games Setup
          </button>
          <button 
            type="button"
            onClick={() => {
              setDraftScores({});
              setActiveTab('mvp');
            }} 
            className={cn("px-6 py-2.5 rounded-[12px] text-sm font-bold transition cursor-pointer", activeTab === 'mvp' ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900")}
          >
            MVP Scoring
          </button>
        </div>

        {/* tab CONTENT: setup */}
        {activeTab === 'setup' && (
          <div className="space-y-8 animate-in fade-in-50 duration-200">
            
            {/* Day Management Section */}
            <div className="bg-white p-6 sm:p-8 rounded-[24px] shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4 tracking-tight flex items-center gap-2">
                <Calendar size={20} className="text-indigo-500" />
                <span>Days Setup</span>
              </h2>

              <p className="text-slate-500 text-xs mb-6 font-medium">Create and structure dates of the tournament to group challenge packages.</p>

              {/* Day Creation Form */}
              <form onSubmit={handleCreateDay} className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed mb-6">
                <div className="w-full sm:flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Day Name (Optional)</label>
                  <input 
                    type="text" 
                    value={newDayName} 
                    onChange={e => setNewDayName(e.target.value)} 
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="e.g. Day 1, Opening Day, Friday"
                  />
                </div>
                <div className="w-full sm:w-64">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Date</label>
                  <input 
                    type="date" 
                    value={newDayDate} 
                    onChange={e => setNewDayDate(e.target.value)} 
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-sm focus:outline-none focus:border-indigo-400 font-mono"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full sm:w-auto bg-[#0F172A] text-white px-5 py-2 rounded-lg font-semibold hover:bg-slate-800 transition whitespace-nowrap h-[42px] cursor-pointer text-xs flex items-center gap-1.5 justify-center"
                >
                  <Plus size={14} /> Add Day
                </button>
              </form>

              {/* Day Listing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(days).map(day => (
                  <div key={day.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-sm">{day.name}</span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{day.date}</p>
                      </div>
                    </div>
                    {day.id !== 'default-day' && (
                      <button 
                        onClick={() => handleDeleteDayClick(day.id, day.name)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Day"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Main Games Setup */}
            <div className="bg-white p-6 sm:p-8 rounded-[24px] shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 tracking-tight flex items-center gap-2">
                <Trophy size={20} className="text-amber-500" />
                <span>Main Games Details</span>
              </h2>

              <div className="space-y-8 mb-8">
                {games.length === 0 && <p className="text-slate-400 italic text-sm">No games created yet.</p>}
                
                {Object.values(days).map(day => {
                  const dayGames = games.filter(g => g.dayId === day.id || (!g.dayId && day.id === "default-day"));
                  if (dayGames.length === 0) return null;

                  return (
                    <div key={day.id} className="space-y-4 animate-in fade-in-50 duration-250">
                      {/* Day Heading */}
                      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                        <Calendar size={15} className="text-indigo-600" />
                        <h3 className="text-xs font-black text-slate-700 tracking-wider uppercase">
                          {day.name} <span className="text-slate-400 font-normal font-mono text-[11px]">({day.date})</span>
                        </h3>
                        <span className="ml-auto bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                          {dayGames.length} {dayGames.length === 1 ? 'game' : 'games'}
                        </span>
                      </div>

                      <div className="grid gap-4">
                        {dayGames.map(game => {
                          const subGamesTotal = game.subGames.reduce((acc, curr) => acc + curr.maxPoints, 0);
                          const displayMax = game.subGames.length > 0 ? subGamesTotal : game.maxPoints;
                          const isEditingThisGame = editingGameId === game.id;
                          const associatedDay = days[game.dayId || 'default-day'] || { name: 'Unassigned', date: '' };
                          
                          return (
                            <div key={game.id} className="bg-white rounded-[16px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-100">
                               {isEditingThisGame ? (
                                 <div className="p-5 bg-amber-50/40 border-b border-slate-200">
                                   <h3 className="text-sm font-bold text-amber-800 mb-3 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                                     <Pencil size={14} className="text-amber-500" /> Edit Game Details
                                   </h3>
                                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                     <div>
                                       <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Game Name</label>
                                       <input 
                                         type="text" 
                                         value={editGameName} 
                                         onChange={e => setEditGameName(e.target.value)} 
                                         className="w-full bg-white border border-slate-300 focus:border-amber-400 p-2 rounded-lg text-sm focus:outline-none" 
                                         required 
                                       />
                                     </div>
                                     <div>
                                       <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Max Points</label>
                                       <input 
                                         type="number" 
                                         value={editGameMax} 
                                         onChange={e => setEditGameMax(Number(e.target.value) || 0)} 
                                         className="w-full bg-white border border-slate-300 focus:border-amber-400 p-2 rounded-lg text-sm focus:outline-none" 
                                         required 
                                       />
                                     </div>
                                     <div>
                                       <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Associated Day</label>
                                       <select 
                                         value={editGameDayId} 
                                         onChange={e => setEditGameDayId(e.target.value)}
                                         className="w-full bg-white border border-slate-300 focus:border-amber-400 p-2 rounded-lg text-sm focus:outline-none"
                                       >
                                         {Object.values(days).map(d => (
                                           <option key={d.id} value={d.id}>{d.name} ({d.date})</option>
                                         ))}
                                       </select>
                                     </div>
                                   </div>
                                   
                                   <div className="flex flex-wrap gap-6 mb-4">
                                     <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 text-xs select-none">
                                       <input 
                                         type="checkbox" 
                                         checked={editGameIsTeam} 
                                         onChange={e => setEditGameIsTeam(e.target.checked)} 
                                         className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4" 
                                       />
                                       Include in Team Progress (The Building)
                                     </label>
                                     <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 text-xs select-none">
                                       <input 
                                         type="checkbox" 
                                         checked={editGameIsMvp} 
                                         onChange={e => setEditGameIsMvp(e.target.checked)} 
                                         className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4" 
                                       />
                                       Include in MVP/Personal Scoring
                                     </label>
                                   </div>
                                   
                                   <div className="flex justify-end gap-2">
                                     <button 
                                       type="button"
                                       onClick={() => handleSaveEditGame(game.id)} 
                                       className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                     >
                                       <Check size={14} /> Save Changes
                                     </button>
                                     <button 
                                       type="button"
                                       onClick={() => setEditingGameId(null)} 
                                       className="bg-slate-400 hover:bg-slate-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                     >
                                       <X size={14} /> Cancel
                                     </button>
                                   </div>
                                 </div>
                               ) : (
                                 <div className="bg-slate-50/70 p-4 border-b border-slate-200/60 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                   <div>
                                     <div className="font-bold text-slate-850 text-base sm:text-lg flex flex-wrap items-center gap-2">
                                       <span>{game.name}</span>
                                       <div className="flex gap-1">
                                         {game.isTeamScoring !== false && (
                                           <span className="text-[9px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Team scoring</span>
                                         )}
                                         {game.isMvpScoring !== false && (
                                           <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">MVP scoring</span>
                                         )}
                                       </div>
                                     </div>
                                     <div className="text-[11px] font-bold uppercase tracking-widest mt-1 text-slate-400">
                                       <span className="text-blue-600">Max Points: {game.maxPoints}</span>
                                       {game.subGames.length > 0 && <><span className="text-slate-300 ml-2 mr-2">|</span><span className="text-rose-600 font-extrabold">Remaining Points: <span className="text-rose-600 font-black text-sm">{game.maxPoints - subGamesTotal}</span></span></>}
                                     </div>
                                   </div>
                                   <div className="flex flex-wrap gap-2">
                                     <button 
                                       type="button"
                                       onClick={() => startEditingGame(game)} 
                                       className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-sm"
                                     >
                                       <Pencil size={12} /> Edit
                                     </button>
                                     <button type="button" onClick={() => setActiveGameId(activeGameId === game.id ? null : game.id)} className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition cursor-pointer">
                                       + Sub-Game
                                     </button>
                                     <button type="button" onClick={() => handleDeleteGameClick(game.id, game.name)} className="text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer">
                                       Delete Game
                                     </button>
                                   </div>
                                 </div>
                               )}
                                
                               {activeGameId === game.id && (
                                 <form onSubmit={(e) => handleAddSubGame(e, game.id)} className="p-4 bg-indigo-50/50 flex flex-col sm:flex-row gap-3 items-end border-b border-slate-200">
                                    <div className="w-full">
                                      <label className="block text-[10px] font-bold text-slate-550 mb-1.5 uppercase tracking-widest">Sub-Game Name</label>
                                      <input type="text" value={newSubGameName} onChange={e => setNewSubGameName(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded-lg text-sm focus:outline-none focus:border-indigo-400" placeholder="e.g. Round 1" required />
                                    </div>
                                    <div className="w-32">
                                      <label className="block text-[10px] font-bold text-slate-550 mb-1.5 uppercase tracking-widest">Points Limit</label>
                                      <input type="number" min="1" value={newSubGameMax} onChange={e => setNewSubGameMax(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded-lg text-sm focus:outline-none focus:border-indigo-400" required />
                                    </div>
                                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition cursor-pointer mb-[1px] whitespace-nowrap h-[38px]">
                                      Add Sub-Game
                                    </button>
                                 </form>
                               )}
           
                               {game.subGames.length > 0 && (
                                 <div className="p-4 border-t border-slate-100">
                                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Sub-Games breakdown</h4>
                                   <div className="flex flex-col gap-2">
                                     {game.subGames.map(sg => {
                                       const isEditingSub = editingSubGameId === sg.id;
                                       
                                       return (
                                         <div key={sg.id} className="flex justify-between items-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 min-h-[50px]">
                                           {isEditingSub ? (
                                             <div className="flex-1 flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                                               <div className="flex-1 w-full">
                                                 <label className="block text-[9px] font-bold text-slate-455 uppercase tracking-wider mb-0.5">Edit Sub-Game Name</label>
                                                 <input 
                                                   type="text" 
                                                   value={editSubGameName} 
                                                   onChange={e => setEditSubGameName(e.target.value)} 
                                                   className="w-full bg-white border border-slate-300 px-2.5 py-1 rounded text-sm focus:outline-none focus:border-amber-400 font-medium" 
                                                   required
                                                 />
                                               </div>
                                               <div className="w-24">
                                                 <label className="block text-[9px] font-bold text-slate-455 uppercase tracking-wider mb-0.5">Points Limit</label>
                                                 <input 
                                                   type="number" 
                                                   value={editSubGameMax} 
                                                   onChange={e => setEditSubGameMax(Number(e.target.value) || 0)} 
                                                   className="w-full bg-white border border-slate-300 px-2.5 py-1 rounded text-sm focus:outline-none focus:border-amber-400 font-mono font-bold" 
                                                   required
                                                 />
                                               </div>
                                               <div className="flex gap-1 mb-[1px]">
                                                 <button 
                                                   type="button"
                                                   onClick={() => handleSaveEditSubGame(game.id, sg.id)} 
                                                   className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded transition cursor-pointer"
                                                 >
                                                   <Check size={14} />
                                                 </button>
                                                 <button 
                                                   type="button"
                                                   onClick={() => setEditingSubGameId(null)} 
                                                   className="bg-slate-400 hover:bg-slate-500 text-white p-2 rounded transition cursor-pointer"
                                                 >
                                                   <X size={14} />
                                                 </button>
                                               </div>
                                             </div>
                                           ) : (
                                             <>
                                               <span className="text-sm font-semibold text-slate-700">
                                                 {sg.name} <span className="text-orange-500 ml-2 font-bold">(Max: {sg.maxPoints})</span>
                                               </span>
                                                <div className="flex items-center gap-2">
                                                  <button 
                                                    type="button"
                                                    onClick={() => startEditingSubGame(sg)} 
                                                    className="bg-amber-400 hover:bg-amber-500 text-slate-900 p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                                                    title="Edit Subgame Name or Points"
                                                  >
                                                    <Pencil size={12} />
                                                  </button>
                                                  <button type="button" onClick={() => handleDeleteSubGameClick(game.id, sg.id, sg.name)} className="text-xs font-bold text-rose-500 hover:bg-rose-50 px-2.5 py-1 rounded transition cursor-pointer animate-in">
                                                    Remove
                                                  </button>
                                                </div>
                                             </>
                                           )}
                                         </div>
                                       );
                                     })}
                                   </div>
                                 </div>
                               )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Game Form */}
              <form onSubmit={handleAddGame} className="flex flex-col bg-slate-50 p-6 rounded-[16px] border border-slate-200 border-dashed gap-4">
                 <div className="flex flex-col sm:flex-row gap-4 items-end w-full">
                    <div className="w-full sm:flex-1">
                       <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Create New Big Game</label>
                       <input type="text" value={newGameName} onChange={e => setNewGameName(e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-lg focus:outline-none focus:border-slate-400 text-sm" placeholder="e.g., Target Shoot, Puzzle Solving" required />
                    </div>
                    <div className="w-full sm:w-32">
                       <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Max Points</label>
                       <input type="number" min="1" value={newGameMax} onChange={e => setNewGameMax(e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-lg focus:outline-none focus:border-slate-400 text-sm" required />
                    </div>
                    <div className="w-full sm:w-48">
                       <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Link to Day</label>
                       <select value={newGameDayId} onChange={e => setNewGameDayId(e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-lg focus:outline-none focus:border-slate-400 text-sm">
                         {Object.values(days).map(d => (
                           <option key={d.id} value={d.id}>{d.name}</option>
                         ))}
                       </select>
                    </div>
                 </div>

                 <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-6 max-w-fit">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">Target Modules:</span>
                   <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700 text-xs select-none">
                     <input 
                       type="checkbox" 
                       checked={newGameIsTeam} 
                       onChange={e => setNewGameIsTeam(e.target.checked)} 
                       className="rounded text-indigo-650 focus:ring-indigo-500 h-4 w-4" 
                     />
                     Include in Team Progress (The Building)
                   </label>
                   <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700 text-xs select-none">
                     <input 
                       type="checkbox" 
                       checked={newGameIsMvp} 
                       onChange={e => setNewGameIsMvp(e.target.checked)} 
                       className="rounded text-indigo-650 focus:ring-indigo-500 h-4 w-4" 
                     />
                     Include in MVP/Personal Score
                   </label>
                 </div>

                 <div className="text-right">
                   <button type="submit" className="w-full sm:w-auto bg-[#0F172A] text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-800 transition whitespace-nowrap cursor-pointer text-xs">
                      Add Main Game
                   </button>
                 </div>
              </form>
            </div>
          </div>
        )}

        {/* tab CONTENT: scoring */}
        {activeTab === 'scoring' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            
            {/* Horizontal Day Selection Tabs */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Grouped by Day</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(days).map((day) => {
                  const dayGamesCount = games.filter(g => g.dayId === day.id).length;
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => {
                        setDraftScores({});
                        setSelectedDayId(day.id);
                      }}
                      className={cn(
                        "px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer",
                        selectedDayId === day.id
                          ? "bg-slate-900 border-slate-900 text-white shadow"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <Calendar size={13} />
                      <span>{day.name}</span>
                      <span className="text-[10px] opacity-70 font-mono bg-white/20 px-2 py-0.5 rounded-full">{dayGamesCount} Games</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List Game Accordions for Selected Day */}
            {(() => {
              const filteredGames = games.filter(g => g.dayId === selectedDayId);
              
              if (filteredGames.length === 0) {
                return (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 border-dashed text-slate-400">
                    <Calendar className="mx-auto mb-3 text-slate-300" size={36} />
                    <p className="font-bold text-sm">No games added for this day yet</p>
                    <p className="text-xs text-slate-400 mt-1">Please add games or switch day in the Setup tab</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredGames.map((game) => {
                    const isExpanded = !!expandedGames[game.id];
                    const hasSubGames = game.subGames.length > 0;
                    
                    // Header Scores Summary
                    const summaries = Object.values(teams).map(t => {
                      let teamScore = 0;
                      if (hasSubGames) {
                        game.subGames.forEach(sg => {
                          teamScore += (t.scores[sg.id] || 0);
                        });
                      } else {
                        teamScore = t.scores[game.id] || 0;
                      }
                      return { emojis: t.emojis, name: t.nameAr, score: teamScore, color: t.color };
                    });

                    return (
                      <div key={game.id} className="bg-white rounded-[20px] border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-300">
                        {/* Accordion Trigger */}
                        <button
                          type="button"
                          onClick={() => setExpandedGames(prev => ({ ...prev, [game.id]: !prev[game.id] }))}
                          className="w-full text-left p-5 bg-slate-50/40 hover:bg-slate-50/90 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 transition duration-150 cursor-pointer"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">{game.name}</h3>
                              <span className={cn(
                                "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                hasSubGames ? "bg-indigo-50 text-indigo-700" : "bg-sky-50 text-sky-700"
                              )}>
                                {hasSubGames ? `${game.subGames.length} Sub-games` : 'Standard'}
                              </span>
                              {game.isTeamScoring !== false && (
                                <span className="text-[9px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">🏗️ Affects Building</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider mt-1">Max score limit: {game.maxPoints}</p>
                          </div>

                          {/* Preview Scores & Caret */}
                          <div className="flex items-center gap-3.5 self-end md:self-auto">
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-650 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-inner">
                              {summaries.map((s, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <span>{s.emojis}</span> 
                                  <span style={{ color: s.color }} className="font-mono">{s.score}</span>
                                  {idx < summaries.length - 1 && <span className="text-slate-200">|</span>}
                                </div>
                              ))}
                            </div>
                            <div className="text-slate-450">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                        </button>

                        {/* Accordion scoring panel */}
                        {isExpanded && (
                          <div className="p-6 bg-white space-y-6 border-t border-slate-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {Object.values(teams).map((team) => {
                                return (
                                  <div key={team.id} className="p-5 rounded-xl bg-slate-50/60 border border-slate-200/60 flex flex-col justify-between space-y-4">
                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                      <span className="text-xl">{team.emojis}</span>
                                      <span className="font-bold text-slate-800 font-sansArabic text-sm">{team.nameAr}</span>
                                    </div>

                                    {!hasSubGames ? (
                                      // Single Game Input Slider with Safe Draft Apply confirmation
                                      <div className="space-y-4">
                                        {(() => {
                                          const draftKey = `team-${team.id}-${game.id}`;
                                          const savedVal = team.scores[game.id] || 0;
                                          const currentVal = draftKey in draftScores ? draftScores[draftKey] : savedVal;
                                          const isDirty = currentVal !== savedVal;

                                          return (
                                            <>
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs font-semibold text-slate-400">Points Score</span>
                                                <div className="flex items-center gap-2">
                                                  <AnimatedScoreInput
                                                    value={currentVal}
                                                    max={game.maxPoints}
                                                    onChange={(val) => setDraftScores(prev => ({ ...prev, [draftKey]: val }))}
                                                    className={cn("w-14", isDirty && "border-amber-400 bg-amber-50")}
                                                    activeColor="sky"
                                                  />
                                                  <span className="text-xs text-slate-400">/ {game.maxPoints}</span>
                                                  
                                                  {isDirty && (
                                                    <div className="flex gap-1 animate-in zoom-in-95 duration-100">
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          triggerConfirm(
                                                            "Confirm Score Update",
                                                            `Are you sure you want to save the score for team "${team.nameAr}" in "${game.name}" as ${currentVal} points?`,
                                                            () => {
                                                              updateScore(team.id, game.id, currentVal);
                                                              setDraftScores(prev => {
                                                                const copy = { ...prev };
                                                                delete copy[draftKey];
                                                                return copy;
                                                              });
                                                            }
                                                          );
                                                        }}
                                                        className="p-1 px-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition cursor-pointer font-bold text-[10px] flex items-center gap-0.5"
                                                      >
                                                        <Check size={11} /> Save
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          setDraftScores(prev => {
                                                            const copy = { ...prev };
                                                            delete copy[draftKey];
                                                            return copy;
                                                          });
                                                        }}
                                                        className="p-1 bg-slate-200 text-slate-655 rounded-lg hover:bg-slate-300 transition cursor-pointer"
                                                        title="Discard"
                                                      >
                                                        <Undo size={11} />
                                                      </button>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>

                                              <input
                                                type="range"
                                                min="0"
                                                max={game.maxPoints}
                                                value={currentVal}
                                                onChange={(e) => {
                                                  setDraftScores(prev => ({ ...prev, [draftKey]: parseInt(e.target.value, 10) }));
                                                }}
                                                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                                                style={{
                                                  background: `linear-gradient(to right, ${team.color} ${currentVal / game.maxPoints * 100}%, #cbd5e1 ${currentVal / game.maxPoints * 100}%)`
                                                }}
                                              />
                                            </>
                                          );
                                        })()}
                                      </div>
                                    ) : (
                                      // Nested Subgames
                                      <div className="space-y-3.5">
                                        {game.subGames.map((subg) => {
                                          const subDraftKey = `team-${team.id}-${subg.id}`;
                                          const savedSubVal = team.scores[subg.id] || 0;
                                          const currentSubVal = subDraftKey in draftScores ? draftScores[subDraftKey] : savedSubVal;
                                          const subDirty = currentSubVal !== savedSubVal;

                                          return (
                                            <div key={subg.id} className="bg-white p-3 rounded-lg border border-slate-100 flex flex-col gap-2 shadow-inner">
                                              <div className="flex justify-between items-center">
                                                <span className="text-xs font-semibold text-slate-705">{subg.name}</span>
                                                <div className="flex items-center gap-1.5">
                                                  <AnimatedScoreInput
                                                    value={currentSubVal}
                                                    max={subg.maxPoints}
                                                    onChange={(val) => setDraftScores(prev => ({ ...prev, [subDraftKey]: val }))}
                                                    className={cn("w-12", subDirty && "border-amber-300 bg-amber-50")}
                                                    activeColor="sky"
                                                  />
                                                  <span className="text-[10px] text-slate-400">/ {subg.maxPoints}</span>

                                                  {subDirty && (
                                                    <div className="flex gap-1 animate-in zoom-in-95">
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          triggerConfirm(
                                                            "Confirm Sub-Challenge Score",
                                                            `Are you sure you want to save the score of team "${team.nameAr}" in "${subg.name}" as ${currentSubVal} points?`,
                                                            () => {
                                                              updateScore(team.id, subg.id, currentSubVal);
                                                              setDraftScores(prev => {
                                                                const copy = { ...prev };
                                                                delete copy[subDraftKey];
                                                                return copy;
                                                              });
                                                            }
                                                          );
                                                        }}
                                                        className="p-1 px-1.5 text-[9px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition cursor-pointer"
                                                      >
                                                        Save
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          setDraftScores(prev => {
                                                            const copy = { ...prev };
                                                            delete copy[subDraftKey];
                                                            return copy;
                                                          });
                                                        }}
                                                        className="p-1 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded transition"
                                                      >
                                                        <Undo size={10} />
                                                      </button>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>

                                              <input
                                                type="range"
                                                min="0"
                                                max={subg.maxPoints}
                                                value={currentSubVal}
                                                onChange={(e) => {
                                                  setDraftScores(prev => ({ ...prev, [subDraftKey]: parseInt(e.target.value, 10) }));
                                                }}
                                                className="w-full h-1 rounded-lg appearance-none cursor-pointer"
                                                style={{
                                                  background: `linear-gradient(to right, ${team.color} ${currentSubVal / subg.maxPoints * 100}%, #cbd5e1 ${currentSubVal / subg.maxPoints * 100}%)`
                                                }}
                                              />
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Total progress bars display */}
            <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm mt-8">
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Cumulative Overviews</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.values(teams).map((team) => {
                  const teamTotal = calculateTeamScore(team, games);
                  const progress = calculateTeamProgress(team, games, eventTargetScore);

                  return (
                    <div key={team.id} className="relative">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-800 font-sansArabic flex items-center gap-1.5">
                          <span>{team.emojis}</span> {team.nameAr}
                        </span>
                        <span className="font-bold text-sm tracking-tight" style={{ color: team.color }}>
                          {teamTotal} / {eventTargetScore} pts
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-4 p-0.5 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${progress}%`, backgroundColor: team.color }}
                        />
                      </div>
                      <div className="text-right text-[9px] font-extrabold text-slate-400 mt-1 tracking-widest">
                        {Math.round(progress)}% COMPLETION
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* tab CONTENT: mvp */}
        {activeTab === 'mvp' && (
          <div className="space-y-8 animate-in fade-in-50 duration-200">
            <div className="bg-white p-6 sm:p-8 rounded-[24px] shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Personal MVP Scoring</h2>
              <p className="text-slate-500 text-sm mb-6 font-medium">These scores are for individual players and do not affect the main 3D building progress.</p>
              
              <form onSubmit={handleAddPlayer} className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="w-full sm:flex-1">
                    <label className="block text-[11px] font-bold text-slate-505 mb-1.5 uppercase tracking-widest">Player Name</label>
                    <input type="text" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} className="w-full bg-white border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-slate-400 text-sm" placeholder="e.g. Antony Mohab" required />
                  </div>
                  <div className="w-full sm:w-64">
                    <label className="block text-[11px] font-bold text-slate-505 mb-1.5 uppercase tracking-widest">Assign Team</label>
                    <select value={newPlayerTeam} onChange={e => setNewPlayerTeam(e.target.value)} className="w-full bg-white border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-slate-400 text-sm">
                      {Object.values(teams).map(t => (
                        <option key={t.id} value={t.id}>{t.nameAr}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="w-full sm:w-auto bg-[#0F172A] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-800 transition whitespace-nowrap h-[44px] cursor-pointer text-xs flex items-center justify-center">
                    Add Player
                  </button>
              </form>
            </div>

            {Object.values(players).length > 0 && (
              <div className="space-y-12">
                {Object.values(teams).map(team => {
                  const teamPlayers = Object.values(players).filter(p => p.teamId === team.id);
                  if (teamPlayers.length === 0) return null;

                  return (
                    <div key={team.id} className="space-y-4">
                      {/* Team Header/Divider */}
                      <div className="flex items-center gap-3 px-2 py-1 select-none">
                        <span className="text-2xl">{team.emojis}</span>
                        <h3 className="text-lg font-bold text-slate-800 font-sansArabic">{team.nameAr}</h3>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200" style={{ borderColor: `${team.color}30`, backgroundColor: `${team.color}10`, color: team.color }}>
                          {teamPlayers.length} {teamPlayers.length === 1 ? 'Player' : 'Players'}
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                      </div>

                      <div className="grid gap-6">
                        {teamPlayers.map(player => {
                          const totalScore = calculatePlayerScore(player);
                          const filteredMvpGames = games.filter(g => g.isMvpScoring !== false);
                          
                          return (
                            <div key={player.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-200 flex flex-col md:flex-row gap-8 items-start hover:shadow-md transition duration-200 animate-in fade-in duration-100">
                              <div className="md:w-1/3 flex flex-col border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-8 md:min-h-[160px] h-full justify-between">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h3 className="text-xl font-bold text-slate-900">{player.name}</h3>
                                    <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full border" style={{ borderColor: `${team.color}40`, backgroundColor: `${team.color}15`, color: team.color }}>
                                      {team.nameAr}
                                    </span>
                                  </div>
                                  <button onClick={() => handleDeletePlayerClick(player.id, player.name)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded cursor-pointer transition">Delete</button>
                                </div>
                                <div className="mt-auto pt-4 flex items-baseline gap-2">
                                  <span className="text-3xl font-extrabold text-amber-500">{totalScore}</span>
                                  <span className="text-[10px] font-bold text-slate-405 uppercase tracking-widest">Total MVP Points</span>
                                </div>
                              </div>
                              
                              <div className="md:w-2/3 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                                
                                {/* Bonus MVP Points card */}
                                {(() => {
                                  const bonusKey = `player-${player.id}-bonus`;
                                  const savedBonus = player.scores['bonus'] || 0;
                                  const currentBonus = bonusKey in draftScores ? draftScores[bonusKey] : savedBonus;
                                  const isDirty = currentBonus !== savedBonus;
        
                                  return (
                                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex flex-col justify-between min-h-[110px]">
                                      <div className="flex justify-between items-center mb-1">
                                         <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                                           <Award size={14} /> Bonus MVP Points
                                         </span>
                                         <div className="flex items-center gap-1.5">
                                           <AnimatedScoreInput
                                             value={currentBonus}
                                             max={100}
                                             onChange={(val) => setDraftScores(prev => ({ ...prev, [bonusKey]: val }))}
                                             className="w-12 border-amber-200 text-amber-900"
                                             activeColor="amber"
                                           />
                                           
                                           {isDirty && (
                                             <div className="flex gap-1 animate-in zoom-in-95 font-sans">
                                               <button
                                                 type="button"
                                                 onClick={() => {
                                                   triggerConfirm(
                                                     "Save Bonus Score",
                                                     `Are you sure you want to award ${currentBonus} bonus MVP points to player "${player.name}"?`,
                                                     () => {
                                                       updatePlayerScore(player.id, 'bonus', currentBonus);
                                                       setDraftScores(prev => {
                                                         const copy = { ...prev };
                                                         delete copy[bonusKey];
                                                         return copy;
                                                       });
                                                     }
                                                   );
                                                 }}
                                                 className="p-1 px-2 text-[9px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                                               >
                                                 Save
                                               </button>
                                               <button
                                                 type="button"
                                                 onClick={() => {
                                                   setDraftScores(prev => {
                                                     const copy = { ...prev };
                                                     delete copy[bonusKey];
                                                     return copy;
                                                   });
                                                 }}
                                                 className="p-1 bg-white text-slate-500 rounded hover:bg-slate-100 transition"
                                               >
                                                 <Undo size={10} />
                                               </button>
                                             </div>
                                           )}
                                         </div>
                                      </div>
                                      <input 
                                        type="range" min="0" max="100" 
                                        value={currentBonus} 
                                        onChange={(e) => setDraftScores(prev => ({ ...prev, [bonusKey]: parseInt(e.target.value, 10) }))}
                                        className="w-full h-1 appearance-none cursor-pointer bg-amber-200 mt-2 rounded-lg"
                                      />
                                    </div>
                                  );
                                })()}
                                
                                {/* Regular game MVP inputs */}
                                {filteredMvpGames.length === 0 ? (
                                  <div className="bg-slate-50 p-4 rounded-xl text-center text-slate-400 text-xs italic border border-dashed border-slate-200 flex items-center justify-center min-h-[110px]">
                                    No games designated for MVP scoring.
                                  </div>
                                ) : (
                                  filteredMvpGames.map(g => {
                                    const mvpGameKey = `player-${player.id}-${g.id}`;
                                    const savedMvpVal = player.scores[g.id] || 0;
                                    const currentMvpVal = mvpGameKey in draftScores ? draftScores[mvpGameKey] : savedMvpVal;
                                    const isDirty = currentMvpVal !== savedMvpVal;
        
                                    return (
                                       <div key={g.id} className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 flex flex-col justify-between min-h-[110px]">
                                         <div className="flex justify-between items-center mb-1 font-sans">
                                            <span className="text-xs font-semibold text-slate-700 truncate mr-2 animate-in" title={g.name}>{g.name}</span>
                                            <div className="flex items-center gap-1.5">
                                              <AnimatedScoreInput
                                                value={currentMvpVal}
                                                max={g.maxPoints}
                                                onChange={(val) => setDraftScores(prev => ({ ...prev, [mvpGameKey]: val }))}
                                                className="w-12"
                                                activeColor="amber"
                                              />
        
                                              {isDirty && (
                                                <div className="flex gap-1 animate-in zoom-in-95">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      triggerConfirm(
                                                        "Save Player Challenge Score",
                                                        `Are you sure you want to record ${currentMvpVal} MVP points for player "${player.name}" in game "${g.name}"?`,
                                                        () => {
                                                          updatePlayerScore(player.id, g.id, currentMvpVal);
                                                          setDraftScores(prev => {
                                                            const copy = { ...prev };
                                                            delete copy[mvpGameKey];
                                                            return copy;
                                                          });
                                                        }
                                                      );
                                                    }}
                                                    className="p-1 px-2 text-[9px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                                                  >
                                                    Save
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setDraftScores(prev => {
                                                        const copy = { ...prev };
                                                        delete copy[mvpGameKey];
                                                        return copy;
                                                      });
                                                    }}
                                                    className="p-1 bg-white text-slate-550 rounded hover:bg-slate-100 transition"
                                                  >
                                                    <Undo size={10} />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                         </div>
                                         <input 
                                           type="range" min="0" max={g.maxPoints} 
                                           value={currentMvpVal} 
                                           onChange={(e) => setDraftScores(prev => ({ ...prev, [mvpGameKey]: parseInt(e.target.value, 10) }))}
                                           className="w-full h-1 appearance-none cursor-pointer bg-slate-200 mt-2 rounded-lg"
                                         />
                                       </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Unassigned/fallback group if any players with invalid or deleted teamIds exist */}
                {(() => {
                  const unassignedPlayers = Object.values(players).filter(p => !p.teamId || !teams[p.teamId]);
                  if (unassignedPlayers.length === 0) return null;

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-2 py-1 select-none">
                        <span className="text-2xl">👥</span>
                        <h3 className="text-lg font-bold text-slate-800">Unassigned Players</h3>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 bg-slate-100 text-slate-600">
                          {unassignedPlayers.length}
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                      </div>

                      <div className="grid gap-6">
                        {unassignedPlayers.map(player => {
                          const totalScore = calculatePlayerScore(player);
                          const filteredMvpGames = games.filter(g => g.isMvpScoring !== false);
                          
                          return (
                            <div key={player.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-200 flex flex-col md:flex-row gap-8 items-start hover:shadow-md transition duration-200 animate-in fade-in duration-100">
                              <div className="md:w-1/3 flex flex-col border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-8 md:min-h-[160px] h-full justify-between">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h3 className="text-xl font-bold text-slate-900">{player.name}</h3>
                                    <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                      No Team
                                    </span>
                                  </div>
                                  <button onClick={() => handleDeletePlayerClick(player.id, player.name)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded cursor-pointer transition">Delete</button>
                                </div>
                                <div className="mt-auto pt-4 flex items-baseline gap-2">
                                  <span className="text-3xl font-extrabold text-amber-500">{totalScore}</span>
                                  <span className="text-[10px] font-bold text-slate-405 uppercase tracking-widest">Total MVP Points</span>
                                </div>
                              </div>
                              
                              <div className="md:w-2/3 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                                
                                {/* Bonus MVP Points card */}
                                {(() => {
                                  const bonusKey = `player-${player.id}-bonus`;
                                  const savedBonus = player.scores['bonus'] || 0;
                                  const currentBonus = bonusKey in draftScores ? draftScores[bonusKey] : savedBonus;
                                  const isDirty = currentBonus !== savedBonus;
        
                                  return (
                                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex flex-col justify-between min-h-[110px]">
                                      <div className="flex justify-between items-center mb-1">
                                         <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                                           <Award size={14} /> Bonus MVP Points
                                         </span>
                                         <div className="flex items-center gap-1.5">
                                           <AnimatedScoreInput
                                             value={currentBonus}
                                             max={100}
                                             onChange={(val) => setDraftScores(prev => ({ ...prev, [bonusKey]: val }))}
                                             className="w-12 border-amber-200 text-amber-900"
                                             activeColor="amber"
                                           />
                                           
                                           {isDirty && (
                                             <div className="flex gap-1 animate-in zoom-in-95 font-sans">
                                               <button
                                                 type="button"
                                                 onClick={() => {
                                                   triggerConfirm(
                                                     "Save Bonus Score",
                                                     `Are you sure you want to award ${currentBonus} bonus MVP points to player "${player.name}"?`,
                                                     () => {
                                                       updatePlayerScore(player.id, 'bonus', currentBonus);
                                                       setDraftScores(prev => {
                                                         const copy = { ...prev };
                                                         delete copy[bonusKey];
                                                         return copy;
                                                       });
                                                     }
                                                   );
                                                 }}
                                                 className="p-1 px-2 text-[9px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                                               >
                                                 Save
                                               </button>
                                               <button
                                                 type="button"
                                                 onClick={() => {
                                                   setDraftScores(prev => {
                                                     const copy = { ...prev };
                                                     delete copy[bonusKey];
                                                     return copy;
                                                   });
                                                 }}
                                                 className="p-1 bg-white text-slate-500 rounded hover:bg-slate-100 transition"
                                               >
                                                 <Undo size={10} />
                                               </button>
                                             </div>
                                           )}
                                         </div>
                                      </div>
                                      <input 
                                        type="range" min="0" max="100" 
                                        value={currentBonus} 
                                        onChange={(e) => setDraftScores(prev => ({ ...prev, [bonusKey]: parseInt(e.target.value, 10) }))}
                                        className="w-full h-1 appearance-none cursor-pointer bg-amber-200 mt-2 rounded-lg"
                                      />
                                    </div>
                                  );
                                })()}
                                
                                {/* Regular game MVP inputs */}
                                {filteredMvpGames.length === 0 ? (
                                  <div className="bg-slate-50 p-4 rounded-xl text-center text-slate-400 text-xs italic border border-dashed border-slate-200 flex items-center justify-center min-h-[110px]">
                                    No games designated for MVP scoring.
                                  </div>
                                ) : (
                                  filteredMvpGames.map(g => {
                                    const mvpGameKey = `player-${player.id}-${g.id}`;
                                    const savedMvpVal = player.scores[g.id] || 0;
                                    const currentMvpVal = mvpGameKey in draftScores ? draftScores[mvpGameKey] : savedMvpVal;
                                    const isDirty = currentMvpVal !== savedMvpVal;
        
                                    return (
                                       <div key={g.id} className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 flex flex-col justify-between min-h-[110px]">
                                         <div className="flex justify-between items-center mb-1 font-sans">
                                            <span className="text-xs font-semibold text-slate-700 truncate mr-2 animate-in" title={g.name}>{g.name}</span>
                                            <div className="flex items-center gap-1.5">
                                              <AnimatedScoreInput
                                                value={currentMvpVal}
                                                max={g.maxPoints}
                                                onChange={(val) => setDraftScores(prev => ({ ...prev, [mvpGameKey]: val }))}
                                                className="w-12"
                                                activeColor="amber"
                                              />
        
                                              {isDirty && (
                                                <div className="flex gap-1 animate-in zoom-in-95">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      triggerConfirm(
                                                        "Save Player Challenge Score",
                                                        `Are you sure you want to record ${currentMvpVal} MVP points for player "${player.name}" in game "${g.name}"?`,
                                                        () => {
                                                          updatePlayerScore(player.id, g.id, currentMvpVal);
                                                          setDraftScores(prev => {
                                                            const copy = { ...prev };
                                                            delete copy[mvpGameKey];
                                                            return copy;
                                                          });
                                                        }
                                                      );
                                                    }}
                                                    className="p-1 px-2 text-[9px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                                                  >
                                                    Save
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setDraftScores(prev => {
                                                        const copy = { ...prev };
                                                        delete copy[mvpGameKey];
                                                        return copy;
                                                      });
                                                    }}
                                                    className="p-1 bg-white text-slate-550 rounded hover:bg-slate-100 transition"
                                                  >
                                                    <Undo size={10} />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                         </div>
                                         <input 
                                           type="range" min="0" max={g.maxPoints} 
                                           value={currentMvpVal} 
                                           onChange={(e) => setDraftScores(prev => ({ ...prev, [mvpGameKey]: parseInt(e.target.value, 10) }))}
                                           className="w-full h-1 appearance-none cursor-pointer bg-slate-200 mt-2 rounded-lg"
                                         />
                                       </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmProps.isOpen}
        title={confirmProps.title}
        message={confirmProps.message}
        onConfirm={confirmProps.onConfirm}
        onCancel={() => setConfirmProps(p => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}
