import React, { useState } from 'react';
import { useStore, calculateTeamProgress } from '../store';

interface LandingPageProps {
  onSelectTeam: (teamId: string) => void;
  onBack: () => void;
}

export function LandingPage({ onSelectTeam, onBack }: LandingPageProps) {
  const teams = useStore((state) => state.teams);
  const games = useStore((state) => state.games);
  const eventTargetScore = useStore((state) => state.eventTargetScore);

  const [selectedTeamForCode, setSelectedTeamForCode] = useState<string | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const targetTeam = selectedTeamForCode ? teams[selectedTeamForCode] : null;

  const handleTeamClick = (teamId: string) => {
    setSelectedTeamForCode(teamId);
    setEnteredCode('');
    setCodeError('');
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTeam || !selectedTeamForCode) return;

    if (enteredCode === targetTeam.code) {
      onSelectTeam(selectedTeamForCode);
      setSelectedTeamForCode(null);
    } else {
      setCodeError('Incorrect Access Code');
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-[#f3f4f6] to-[#e5e7eb] flex flex-col p-0">
      <div 
        className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full blur-[60px] pointer-events-none z-0" 
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0) 70%)' }} 
      />

      <div className="relative z-10 w-full flex flex-col">
        <div className="absolute top-6 left-6 md:left-[80px] z-50">
           <button 
             onClick={onBack}
             className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-white transition cursor-pointer"
           >
             ← Switch Portal
           </button>
        </div>

        <div className="pt-[100px] px-8 md:px-[80px] pb-[40px] w-full max-w-[1100px] mx-auto flex flex-col items-start z-10">
          <h2 className="text-[2rem] font-[200] text-[#64748b] mb-1">Hello!</h2>
          <h1 className="text-[3.5rem] leading-[1.1] font-[700] text-[#0F172A] tracking-[-0.02em] mb-2">Pick Your Company</h1>
          <p className="text-[1.25rem] text-[#64748b] mt-2">Enter code to view your team's score and 3D map</p>
        </div>

        <div className="w-full max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-[32px] px-8 md:px-[80px] z-10 pb-[100px]">
          {Object.values(teams).map(team => {
             const progress = calculateTeamProgress(team, games, eventTargetScore);
             return (
               <button
                  key={team.id}
                  onClick={() => handleTeamClick(team.id)}
                  className="group relative w-full h-[380px] rounded-[48px] flex flex-col items-center justify-center text-white text-center shadow-[0_20px_40px_rgba(0,0,0,0.1)] cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                  style={{ backgroundColor: team.color }}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-[4rem] mb-6 relative z-10">{team.emojis}</div>
                  <div className="text-[2.5rem] font-bold mb-2 leading-[1.2] relative z-10 font-sansArabic">
                    {team.nameAr}
                  </div>
                  <div className="absolute bottom-[24px] bg-white/20 backdrop-blur-[10px] px-6 py-2 rounded-full text-[0.875rem] font-semibold">
                    {Math.round(progress)}% COMPLETED
                  </div>
                </button>
             );
          })}
        </div>
      </div>

      {/* Access Code Modal */}
      {selectedTeamForCode && targetTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-slate-100/10 flex flex-col items-center">
            <div className="text-4xl mb-4">{targetTeam.emojis}</div>
            <h3 className="text-xl font-bold text-slate-800 text-center mb-1 font-sansArabic">{targetTeam.nameAr}</h3>
            <p className="text-xs text-slate-400 mb-6 text-center">Please enter the security access code</p>

            <form onSubmit={handleCodeSubmit} className="w-full flex flex-col items-center gap-4">
              <input
                type="password"
                maxLength={8}
                value={enteredCode}
                onChange={(e) => {
                  setEnteredCode(e.target.value);
                  setCodeError('');
                }}
                placeholder="Enter Access Code"
                className="w-full px-4 py-3 text-center text-lg border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition bg-slate-50 font-mono tracking-widest"
                autoFocus
              />

              {codeError && (
                <p className="text-red-500 text-xs font-semibold">{codeError}</p>
              )}

              <div className="flex gap-3 w-full mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeamForCode(null)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition cursor-pointer shadow-md"
                >
                  Unlock Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
