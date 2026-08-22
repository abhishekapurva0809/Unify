import React, { useState, useEffect } from 'react';
import { searchMessagesApi } from '../services/messageService';

const MessageSearchModal = ({ isOpen, onClose, onSelectResult }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const SOCKET_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:8090';

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setLoading(true);
        setError('');
        const response = await searchMessagesApi(query);
        if (response.success) {
          setResults(response.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to search messages');
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>💬</span> Search Messages
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {/* Input */}
        <div className="p-4 border-b border-slate-800/60">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type message keywords to search..."
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
          />
        </div>

        {/* Results List */}
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
              <span>Searching chat history...</span>
            </div>
          )}

          {!loading && query.trim() !== '' && results.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-sm">
              No messages found matching "{query}"
            </div>
          )}

          {!loading && query.trim() === '' && (
            <div className="py-8 text-center text-slate-500 text-sm">
              Search through all your past conversations and group messages
            </div>
          )}

          {!loading &&
            results.map((msg) => (
              <div
                key={msg._id}
                onClick={() => {
                  onSelectResult(msg);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-300 overflow-hidden">
                      {msg.sender?.avatar ? (
                        <img src={`${SOCKET_URL}${msg.sender.avatar}`} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        msg.sender?.name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <span className="text-xs font-semibold text-white group-hover:text-indigo-300">
                      {msg.sender?.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700/60 text-slate-400 font-mono">
                      {msg.conversationId?.isGroup
                        ? msg.conversationId?.name || 'Group Chat'
                        : 'Direct Message'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-300 pl-8 leading-relaxed line-clamp-2">
                  {msg.content}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MessageSearchModal;
