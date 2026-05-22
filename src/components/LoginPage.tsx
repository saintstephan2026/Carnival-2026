import React, { useState } from 'react';
import { useStore } from '../store';

interface LoginPageProps {
  onLoginAsAdmin: () => void;
  onLoginAsViewer: () => void;
}

export function LoginPage({ onLoginAsAdmin, onLoginAsViewer }: LoginPageProps) {
  const adminPin = useStore((state) => state.adminPin) || '1234';
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === adminPin) {
      onLoginAsAdmin();
    } else {
      setError(adminPin === '1234' ? 'Incorrect PIN (Hint: 1234)' : 'Incorrect PIN');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f3f4f6] to-[#e5e7eb] flex items-center justify-center p-6 relative overflow-hidden">
      <div 
        className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full blur-[60px] pointer-events-none z-0" 
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0) 70%)' }} 
      />
      
      <div className="bg-white rounded-[32px] p-10 sm:p-12 shadow-[0_20px_40px_rgba(0,0,0,0.05)] max-w-md w-full relative z-10 flex flex-col items-center">
        <h1 className="text-[2.5rem] font-bold text-[#0F172A] mb-8 text-center tracking-tight leading-tight">Select Portal</h1>
        
        {!showPin ? (
          <div className="w-full space-y-4">
            <button
              onClick={onLoginAsViewer}
              className="w-full bg-[#0F172A] text-white py-4 rounded-[16px] text-lg font-semibold transition hover:bg-slate-800 shadow-lg cursor-pointer"
            >
              Teams Portal
            </button>
            <button
              onClick={() => setShowPin(true)}
              className="w-full bg-white text-[#0F172A] border-[1.5px] border-[#E2E8F0] py-4 rounded-[16px] text-lg font-semibold transition hover:bg-slate-50 cursor-pointer shadow-sm"
            >
              Admin Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleAdminSubmit} className="w-full space-y-4 flex flex-col items-center">
            <h2 className="text-[#64748b] font-medium mb-2">Enter Admin PIN</h2>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full text-center text-2xl tracking-[0.5em] p-4 border-[1.5px] border-[#E2E8F0] rounded-[16px] focus:outline-none focus:border-[#0F172A] transition"
              autoFocus
              placeholder="****"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            <div className="w-full flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setShowPin(false); setError(''); setPin(''); }}
                className="flex-1 bg-slate-100 text-slate-700 py-3 text-sm rounded-[12px] font-semibold hover:bg-slate-200 transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#0F172A] text-white py-3 text-sm rounded-[12px] font-semibold hover:bg-slate-800 transition cursor-pointer"
              >
                Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
