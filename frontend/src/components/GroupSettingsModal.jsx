import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { searchUsersApi } from '../services/userService';
import {
  renameGroupApi,
  addToGroupApi,
  removeFromGroupApi,
} from '../services/messageService';

const GroupSettingsModal = ({ isOpen, onClose, chat, onGroupUpdated }) => {
  const { user } = useAuth();

  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (chat && chat.name) {
      setGroupName(chat.name);
    }
  }, [chat]);

  // Debounced search for adding new members
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await searchUsersApi(searchQuery);
        if (response.success) {
          setSearchResults(response.data);
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  if (!isOpen || !chat || !chat.isGroup) return null;

  const isAdmin = chat.admins?.some((a) => (a._id || a) === user._id);

  // Rename Group Action
  const handleRename = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || groupName.trim() === chat.name) return;

    try {
      setLoading(true);
      setError('');
      const response = await renameGroupApi({
        conversationId: chat._id,
        name: groupName.trim(),
      });
      if (response.success) {
        onGroupUpdated(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to rename group');
    } finally {
      setLoading(false);
    }
  };

  // Add Member Action
  const handleAddMember = async (userToAdd) => {
    try {
      setLoading(true);
      setError('');
      const response = await addToGroupApi({
        conversationId: chat._id,
        userId: userToAdd._id,
      });
      if (response.success) {
        onGroupUpdated(response.data);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  // Remove Member or Leave Group Action
  const handleRemoveMember = async (targetUserId) => {
    try {
      setLoading(true);
      setError('');
      const response = await removeFromGroupApi({
        conversationId: chat._id,
        userId: targetUserId,
      });
      if (response.success) {
        onGroupUpdated(response.data);
        if (targetUserId === user._id) {
          onClose();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>⚙️</span> Group Details
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="p-5 space-y-6 flex-1 overflow-y-auto">
          {/* Group Title Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Group Title</label>
            <form onSubmit={handleRename} className="flex gap-2">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={!isAdmin}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition-all disabled:opacity-60"
              />
              {isAdmin && (
                <button
                  type="submit"
                  disabled={loading || !groupName.trim() || groupName.trim() === chat.name}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition-all"
                >
                  Save
                </button>
              )}
            </form>
          </div>

          {/* Add Member Field (Admins only) */}
          {isAdmin && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Add New Member</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user by name or email..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition-all"
              />

              {/* Add Member Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto p-1 bg-slate-800/60 rounded-xl border border-slate-700">
                  {searchResults.map((u) => {
                    const isAlreadyMember = chat.participants?.some(
                      (p) => (p._id || p) === u._id
                    );
                    return (
                      <div
                        key={u._id}
                        onClick={() => !isAlreadyMember && handleAddMember(u)}
                        className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer ${
                          isAlreadyMember
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-slate-700/60 text-white'
                        }`}
                      >
                        <span>
                          {u.name} ({u.email})
                        </span>
                        <span className="font-semibold text-indigo-400">
                          {isAlreadyMember ? 'Joined' : '+ Add'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Group Members List */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Group Members ({chat.participants?.length || 0})
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {chat.participants?.map((member) => {
                const memberId = member._id || member;
                const isMemberAdmin = chat.admins?.some((a) => (a._id || a) === memberId);
                const isMe = memberId === user._id;

                return (
                  <div
                    key={memberId}
                    className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                        {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span>{member.name || 'User'}</span>
                          {isMe && <span className="text-[10px] text-slate-400">(You)</span>}
                          {isMemberAdmin && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[9px] font-bold">
                              Admin
                            </span>
                          )}
                        </h5>
                        <p className="text-[10px] text-slate-400">{member.email}</p>
                      </div>
                    </div>

                    {/* Admin Remove Action / Self Leave */}
                    {(isAdmin || isMe) && (
                      <button
                        onClick={() => handleRemoveMember(memberId)}
                        disabled={loading}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-[11px] font-semibold transition-all disabled:opacity-50"
                      >
                        {isMe ? 'Leave Group' : 'Remove'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupSettingsModal;
