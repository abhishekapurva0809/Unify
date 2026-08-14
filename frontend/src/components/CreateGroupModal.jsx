import React, { useState, useEffect } from 'react';
import { searchUsersApi } from '../services/userService';
import { createGroupChatApi } from '../services/messageService';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  // Debounced search for group members
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setSearching(true);
        setError('');
        const response = await searchUsersApi(searchQuery);
        if (response.success) {
          setSearchResults(response.data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Add user to selected list
  const handleAddUser = (userToAdd) => {
    if (selectedUsers.some((u) => u._id === userToAdd._id)) {
      return;
    }
    setSelectedUsers([...selectedUsers, userToAdd]);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Remove user from selected list
  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter((u) => u._id !== userId));
  };

  // Handle Submit Group Creation
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      setError('Please enter a group title');
      return;
    }

    if (selectedUsers.length < 2) {
      setError('Select at least 2 members to form a group chat');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const userIds = selectedUsers.map((u) => u._id);
      const response = await createGroupChatApi({
        name: groupName.trim(),
        users: userIds,
      });

      if (response.success) {
        onGroupCreated(response.data);
        handleClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group chat');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSearchQuery('');
    setSelectedUsers([]);
    setSearchResults([]);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>👥</span> Create Group Chat
          </h3>
          <button
            onClick={handleClose}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1 overflow-y-auto">
          {/* Group Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Group Title</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Project Launch Team"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
            />
          </div>

          {/* Selected Users Badges / Pills */}
          {selectedUsers.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Selected Members ({selectedUsers.length})
              </label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1">
                {selectedUsers.map((u) => (
                  <span
                    key={u._id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium"
                  >
                    <span>{u.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(u._id)}
                      className="hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Add Members Search Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Add Members</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users to add..."
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
            />
          </div>

          {/* Search Results List */}
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {searching && (
              <p className="text-xs text-slate-500 text-center py-2">Searching members...</p>
            )}

            {!searching &&
              searchResults.map((u) => {
                const isSelected = selectedUsers.some((sel) => sel._id === u._id);
                return (
                  <div
                    key={u._id}
                    onClick={() => !isSelected && handleAddUser(u)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800/40 border-slate-800 opacity-50 cursor-not-allowed'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 hover:border-indigo-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-white">{u.name}</h5>
                        <p className="text-[10px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-indigo-400">
                      {isSelected ? 'Added' : '+ Add'}
                    </span>
                  </div>
                );
              })}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || selectedUsers.length < 2 || !groupName.trim()}
            className="w-full py-3.5 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Creating Group...' : 'Create Group Chat'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
