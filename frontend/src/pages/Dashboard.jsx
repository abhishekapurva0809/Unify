import React from 'react';

const Dashboard = () => {
  return (
    <div className="h-screen bg-slate-950 text-white flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 justify-between">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/30">
          U
        </div>
        <div className="flex flex-col gap-6 text-slate-400">
          <button className="p-3 rounded-xl bg-slate-800 text-indigo-400">💬</button>
          <button className="p-3 rounded-xl hover:bg-slate-800 hover:text-white">👥</button>
          <button className="p-3 rounded-xl hover:bg-slate-800 hover:text-white">⚙️</button>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-semibold">
          ME
        </div>
      </aside>

      {/* Conversations List */}
      <section className="w-80 bg-slate-900/50 border-r border-slate-800 flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>
        <div className="p-4 flex-1 text-center text-slate-500 text-sm flex items-center justify-center">
          No active conversations yet
        </div>
      </section>

      {/* Active Chat Area */}
      <main className="flex-1 bg-slate-950 flex flex-col items-center justify-center text-slate-500">
        <p className="text-lg">Select a conversation to start chatting</p>
      </main>
    </div>
  );
};

export default Dashboard;
