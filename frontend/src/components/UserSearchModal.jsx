import React, { useState, useEffect } from 'react';
import { searchUsersApi } from '../services/userService';

const UserSearchModal = ({ isOpen, onClose, onSelectUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debounced real-time user search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setLoading(true);
        setError('');
        const response = await searchUsersApi(searchQuery);
        if (response.success) {
          setResults(response.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to search users');
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🔍</span> Search Users
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {/* Search Input Field */}
        <div className="p-4 border-b border-slate-800/60">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type name or email address..."
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
          />
        </div>

        {/* Results List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
              {error}
            </div>
          )}

          {loading && (
            <div className="py-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Searching directory...</span>
            </div>
          )}

          {!loading && searchQuery.trim() !== '' && results.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-sm">
              No users found matching "{searchQuery}"
            </div>
          )}

          {!loading && searchQuery.trim() === '' && (
            <div className="py-8 text-center text-slate-500 text-sm">
              Start typing to search users by name or email
            </div>
          )}

          {!loading &&
            results.map((targetUser) => (
              <div
                key={targetUser._id}
                onClick={() => {
                  onSelectUser(targetUser);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 flex items-center justify-between cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  {/* User Avatar */}
                  <div className="relative w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold overflow-hidden">
                    {targetUser.avatar ? (
                      <img
                        src={`${import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:8090'}${targetUser.avatar}`}
                        alt={targetUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      targetUser.name.charAt(0).toUpperCase()
                    )}
                    {/* Status Dot */}
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        targetUser.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                      }`}
                    />
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {targetUser.name}
                    </h4>
                    <p className="text-xs text-slate-400">{targetUser.email}</p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  Chat
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;
