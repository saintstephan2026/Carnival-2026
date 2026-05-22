/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { ThreeDViewPage } from './components/ThreeDViewPage';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginPage } from './components/LoginPage';
import { useStore } from './store';

export default function App() {
  const [currentView, setCurrentView] = useState<'login' | 'landing' | '3d' | 'admin'>('login');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const { loadSupabaseData, supabaseLoaded } = useStore();

  useEffect(() => {
    loadSupabaseData();
  }, [loadSupabaseData]);

  const handleSelectTeam = (teamId: string) => {
    setSelectedTeam(teamId);
    setCurrentView('3d');
  };

  if (!supabaseLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mr-1.5" />
          <h2 className="text-xl font-bold text-white tracking-wider">Loading Tournament Data...</h2>
          <p className="text-slate-400 text-xs font-mono">Initializing connection to Supabase...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'login') {
    return (
       <LoginPage 
         onLoginAsAdmin={() => setCurrentView('admin')}
         onLoginAsViewer={() => setCurrentView('landing')}
       />
    );
  }

  if (currentView === 'admin') {
    return <AdminDashboard onBack={() => setCurrentView('login')} />;
  }

  if (currentView === '3d' && selectedTeam) {
    return <ThreeDViewPage teamId={selectedTeam} onBack={() => setCurrentView('landing')} />;
  }

  return (
    <LandingPage 
      onSelectTeam={handleSelectTeam} 
      onBack={() => setCurrentView('login')} 
    />
  );
}

