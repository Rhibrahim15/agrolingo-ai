import React from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const ForgotPassword: React.FC = () => {
  const { setScreen } = useAppStore();

  return (
    <div className="flex flex-col h-screen bg-[#050a08] p-8">
      <button onClick={() => setScreen('auth')} className="flex items-center gap-2 text-slate-500 text-[11px] font-black uppercase tracking-widest">
        <ArrowLeft size={16} /> Back to Login
      </button>

      <div className="flex-1 flex flex-col justify-center gap-6">
        <h1 className="text-3xl font-space font-bold text-white">Reset Password</h1>
        <p className="text-sm text-slate-400">Enter your email and the AI will send you a secure recovery link.</p>
        
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFB703]/60" size={20} />
          <input 
            type="email" 
            placeholder="Email Address" 
            className="w-full bg-[#1B4332]/10 border border-[#1B4332]/30 rounded-2xl py-5 pl-12 text-white outline-none focus:border-[#FFB703]/50"
          />
        </div>

        <button className="w-full py-5 rounded-2xl bg-[#FFB703] text-[#264653] font-black uppercase tracking-widest shadow-xl">
          Send Link
        </button>
      </div>
    </div>
  );
};