import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#FAF8FF] text-[#131B2E] flex flex-col justify-between selection:bg-[#4F46E5] selection:text-white">
      {/* Header Navigation */}
      <header className="px-8 py-5 flex items-center justify-between bg-white border-b border-[#E2E8F0] shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4F46E5] flex items-center justify-center font-bold text-xl text-white shadow-md shadow-[#4F46E5]/20">
            U
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-[#3525CD]">
            Unify
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#464555] hover:text-[#3525CD] hover:bg-[#F2F3FF] transition-all"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#4F46E5] hover:bg-[#3525CD] text-white shadow-md shadow-[#4F46E5]/20 transition-all hover:scale-105 active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 text-center flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EAEDFF] border border-[#C7C4D8]/50 text-[#3525CD] text-sm font-medium mb-8">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5] animate-pulse" />
          Real-time communication for high-performance teams
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#131B2E] mb-6 leading-[1.15] max-w-4xl">
          Real-time communication for <br className="hidden sm:inline" />
          <span className="text-[#3525CD]">high-performance</span> teams.
        </h1>
        
        <p className="text-lg text-[#464555] max-w-2xl mb-10 leading-relaxed">
          Centralize your engineering, design, and product discussions. One workspace for messages, assets, and decisions that keeps everyone in sync.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16">
          <Link
            to="/register"
            className="px-8 py-4 rounded-xl text-base font-bold bg-[#4F46E5] hover:bg-[#3525CD] text-white shadow-lg shadow-[#4F46E5]/25 transition-all hover:scale-105 active:scale-95 text-center"
          >
            Get Started Free
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 rounded-xl text-base font-bold bg-white hover:bg-[#F2F3FF] text-[#131B2E] border border-[#E2E8F0] shadow-sm transition-all text-center"
          >
            Log In to Workspace
          </Link>
        </div>

        {/* Floating 3-Column Preview Card */}
        <div className="w-full max-w-5xl bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl p-4 md:p-6 text-left overflow-hidden">
          <div className="flex h-[380px] rounded-xl overflow-hidden border border-[#E2E8F0]">
            {/* Column 1: Mini Nav */}
            <div className="w-16 bg-[#FAF8FF] border-r border-[#E2E8F0] flex flex-col items-center py-4 gap-4">
              <div className="w-8 h-8 bg-[#4F46E5] rounded-lg text-white font-bold text-sm flex items-center justify-center">N</div>
              <div className="w-8 h-8 bg-[#EAEDFF] text-[#4F46E5] rounded-lg flex items-center justify-center font-bold text-xs">💬</div>
            </div>

            {/* Column 2: Mini Chat List */}
            <div className="w-64 bg-[#F2F3FF] border-r border-[#E2E8F0] p-3 flex flex-col gap-2 hidden sm:flex">
              <div className="font-bold text-xs text-[#131B2E] mb-1">Messages</div>
              <div className="p-2.5 bg-white rounded-xl border border-[#E2E8F0] shadow-sm flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#3525CD] text-white font-bold text-xs flex items-center justify-center">SC</div>
                <div>
                  <div className="text-xs font-bold text-[#131B2E]">Sarah Chen</div>
                  <div className="text-[11px] text-[#464555] truncate">The Q3 designs are ready!</div>
                </div>
              </div>
            </div>

            {/* Column 3: Mini Chat Canvas */}
            <div className="flex-1 bg-white p-4 flex flex-col justify-between">
              <div className="border-b border-[#E2E8F0] pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#3525CD] text-white text-xs flex items-center justify-center font-bold">SC</div>
                  <span className="font-bold text-xs text-[#131B2E]">Sarah Chen</span>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Online</span>
                </div>
              </div>
              
              <div className="space-y-3 py-4">
                <div className="bg-[#F2F3FF] text-[#131B2E] p-3 rounded-2xl rounded-bl-none text-xs max-w-[80%]">
                  Hey team, I've just uploaded the final wireframes for the new dashboard.
                </div>
                <div className="bg-[#4F46E5] text-white p-3 rounded-2xl rounded-br-none text-xs max-w-[80%] ml-auto">
                  Looks great, Sarah! I'll take a look right now.
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-2 flex items-center gap-2">
                <input 
                  type="text" 
                  disabled 
                  placeholder="Type a message..." 
                  className="flex-1 bg-[#F2F3FF] border-none rounded-lg px-3 py-1.5 text-xs text-[#464555]"
                />
                <button className="bg-[#4F46E5] text-white px-3 py-1.5 rounded-lg text-xs font-bold">Send</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-[#464555] bg-white border-t border-[#E2E8F0]">
        © 2026 Unify Inc. Built with modern full-stack MERN & Socket.IO architecture.
      </footer>
    </div>
  );
};

export default Landing;
