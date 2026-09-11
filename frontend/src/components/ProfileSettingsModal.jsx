import React, { useState, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { updateUserProfileApi, uploadAvatarApi } from '../services/userService';
import { SOCKET_URL } from '../config';

const ProfileSettingsModal = ({ isOpen, onClose }) => {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const avatarInputRef = useRef(null);

  if (!isOpen) return null;

  const clearMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  // 1. Update Name
  const handleUpdateName = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!name.trim()) {
      setErrorMessage('Name cannot be empty');
      return;
    }

    try {
      setSavingName(true);
      const response = await updateUserProfileApi({ name: name.trim() });
      if (response.success) {
        updateUser({ name: response.data.name });
        setSuccessMessage('Name updated successfully!');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  // 2. Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!newPassword) {
      setErrorMessage('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      setSavingPassword(true);
      const response = await updateUserProfileApi({ password: newPassword });
      if (response.success) {
        setSuccessMessage('Password changed successfully!');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  // 3. Update Avatar
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clearMessages();
    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await uploadAvatarApi(formData);
      if (response.success) {
        updateUser({ avatar: response.data.avatar });
        setSuccessMessage('Profile avatar updated successfully!');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      e.target.value = null;
    }
  };

  // 4. Sign Out
  const handleSignOut = () => {
    onClose();
    logout();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-base font-bold">
              ⚙️
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Settings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage your profile, security, and preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {/* Alerts Banner */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>✓</span>
              <span>{successMessage}</span>
            </span>
            <button onClick={() => setSuccessMessage('')} className="hover:opacity-70">✕</button>
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </span>
            <button onClick={() => setErrorMessage('')} className="hover:opacity-70">✕</button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* User Profile Overview */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-600/30 border-2 border-indigo-400/50 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-300 overflow-hidden shadow-inner">
                {user?.avatar ? (
                  <img
                    src={`${SOCKET_URL}${user.avatar}`}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center hover:bg-indigo-500 shadow-md transition-transform hover:scale-110"
                title="Change Avatar"
              >
                {uploadingAvatar ? '...' : '📷'}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{user?.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Online</span>
              </span>
            </div>
          </div>

          {/* 1. Edit Name Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Personal Information
            </h4>
            <form onSubmit={handleUpdateName} className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={savingName || !name.trim() || name.trim() === user?.name}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {savingName ? 'Saving...' : 'Save Name'}
                </button>
              </div>
            </form>
          </div>

          {/* 2. Change Password Section */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Change Password
            </h4>
            <form onSubmit={handleUpdatePassword} className="space-y-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingPassword || !newPassword || newPassword.length < 6}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* 3. Website Theme Section */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Appearance & Theme
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => theme === 'dark' && toggleTheme()}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                  theme === 'light'
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg">
                  ☀️
                </div>
                <div className="text-left">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Light Mode</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Clean & bright</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => theme === 'light' && toggleTheme()}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                  theme === 'dark'
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-lg">
                  🌙
                </div>
                <div className="text-left">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Dark Mode</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Sleek & high contrast</p>
                </div>
              </button>
            </div>
          </div>

          {/* 4. Sign Out Section */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-white">Account Session</h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Sign out of your active account on this device</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-600 dark:bg-red-500/10 dark:hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white text-xs font-semibold border border-red-200 dark:border-red-500/20 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;
