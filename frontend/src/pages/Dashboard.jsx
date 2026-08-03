import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import UserSearchModal from '../components/UserSearchModal';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleSelectUser = (targetUser) => {
    setSelectedUser(targetUser);
    console.log('Selected user for conversation:', targetUser);
  };

  return (
    <div className="h-screen bg-slate-950 text-white flex overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 justify-between z-10">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/30">
          U
        </div>
        <div className="flex flex-col gap-6 text-slate-400">
          <button className="p-3 rounded-xl bg-slate-800 text-indigo-400" title="Chats">
            💬
          </button>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all"
            title="Search Users"
          >
            🔍
          </button>
          <button
            onClick={logout}
            className="p-3 rounded-xl hover:bg-slate-800 hover:text-red-400 transition-all"
            title="Sign Out"
          >
            🚪
          </button>
        </div>
        {/* User Profile Avatar */}
        <div
          className="w-10 h-10 rounded-full bg-indigo-600/40 border border-indigo-500/50 flex items-center justify-center text-sm font-semibold text-indigo-300 overflow-hidden cursor-pointer"
          title={user?.name}
        >
          {user?.avatar ? (
            <img
              src={`${import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:8090'}${user.avatar}`}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            user?.name?.charAt(0).toUpperCase() || 'U'
          )}
        </div>
      </aside>

      {/* Conversations List Panel */}
      <section className="w-80 bg-slate-900/50 border-r border-slate-800 flex flex-col">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold">Messages</h2>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-semibold transition-all"
          >
            + New Chat
          </button>
        </div>

        <div className="p-4 flex-1 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
          {selectedUser ? (
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 w-full text-left">
              <p className="text-xs text-indigo-400 font-semibold mb-1">Selected Contact</p>
              <h4 className="text-sm font-bold text-white">{selectedUser.name}</h4>
              <p className="text-xs text-slate-400">{selectedUser.email}</p>
            </div>
          ) : (
            <>
              <p>No active conversations yet</p>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
              >
                Search & Start Chat
              </button>
            </>
          )}
        </div>
      </section>

      {/* Active Chat Area */}
      <main className="flex-1 bg-slate-950 flex flex-col items-center justify-center text-slate-500 p-6">
        {selectedUser ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-2xl font-bold text-indigo-300 mx-auto mb-4">
              {selectedUser.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{selectedUser.name}</h3>
            <p className="text-sm text-slate-400 mb-6">{selectedUser.email}</p>
            <p className="text-xs text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 inline-block">
              Ready for Chat System Integration (Phase 6 & 7)
            </p>
          </div>
        ) : (
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl mx-auto mb-4">
              💬
            </div>
            <h3 className="text-lg font-bold text-slate-300 mb-2">Your Messages</h3>
            <p className="text-sm text-slate-500">
              Select a contact or search users to start messaging in real-time.
            </p>
          </div>
        )}
      </main>

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectUser={handleSelectUser}
      />
    </div>
  );
};

export default Dashboard;
