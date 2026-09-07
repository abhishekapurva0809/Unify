import React, { useState, useEffect, useRef, useMemo } from 'react';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import useChat from '../hooks/useChat';
import { useTheme } from '../context/ThemeContext';
import UserSearchModal from '../components/UserSearchModal';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupSettingsModal from '../components/GroupSettingsModal';
import MessageSearchModal from '../components/MessageSearchModal';
import EmojiPicker from '../components/EmojiPicker';
import { uploadMediaAttachmentApi, toggleMessageReactionApi } from '../services/messageService';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { socketConnected } = useSocket();
  const {
    conversations,
    selectedChat,
    messages,
    loadingConversations,
    loadingMessages,
    isTyping,
    selectConversation,
    sendMessage,
    sendTyping,
    sendStopTyping,
    loadConversations,
    setSelectedChat,
    deleteConversation,
  } = useChat();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [attachmentDraft, setAttachmentDraft] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [deletingChat, setDeletingChat] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const SOCKET_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:8090';

  // Toggle emoji reaction on message
  const handleToggleReaction = async (messageId, reactionEmoji) => {
    try {
      await toggleMessageReactionApi(messageId, reactionEmoji);
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  // Auto-scroll message thread to bottom when messages update or typing occurs
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, attachmentDraft]);

  // Helper to extract conversation partner for 1-to-1 chats
  const getChatPartner = (chat) => {
    if (!chat) return null;
    if (chat.isGroup) return null;
    if (chat.targetUser) return chat.targetUser;
    if (!chat.participants || !Array.isArray(chat.participants)) return null;
    return (
      chat.participants.find((p) => {
        const pid = p._id ? p._id.toString() : p.toString();
        return pid !== (user?._id ? user._id.toString() : '');
      }) || chat.participants[0]
    );
  };

  // Helper to get conversation display name
  const getChatName = (chat) => {
    if (!chat) return '';
    if (chat.isGroup) return chat.name || 'Group Chat';
    const partner = getChatPartner(chat);
    return partner ? partner.name : 'Unknown User';
  };

  // Helper to get conversation display avatar
  const getChatAvatar = (chat) => {
    if (!chat) return '';
    if (chat.isGroup) return '';
    const partner = getChatPartner(chat);
    return partner ? partner.avatar : '';
  };

  // Combined list of conversations ensuring active conversation always shows in sidebar
  const displayedConversations = React.useMemo(() => {
    if (!selectedChat) return conversations;
    const selectedPartner = getChatPartner(selectedChat);
    const exists = conversations.some((c) => {
      if (c._id && selectedChat._id && c._id === selectedChat._id) return true;
      if (!c.isGroup && !selectedChat.isGroup && c.participants && selectedPartner) {
        return c.participants.some(
          (p) => (p._id ? p._id.toString() : p.toString()) === (selectedPartner._id || selectedPartner).toString()
        );
      }
      return false;
    });

    if (!exists) {
      return [selectedChat, ...conversations];
    }
    return conversations;
  }, [conversations, selectedChat, user]);

  // Input Change Handler with Typing Debounce
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    sendTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping();
    }, 2000);
  };

  // File Select Attachment Handler
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingMedia(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await uploadMediaAttachmentApi(formData);
      if (response.success) {
        setAttachmentDraft(response.data);
      }
    } catch (err) {
      console.error('Failed to upload attachment:', err);
    } finally {
      setUploadingMedia(false);
      e.target.value = null; // reset file input
    }
  };

  // Select user from Search Modal
  const handleSelectUserFromSearch = async (targetUser) => {
    const existingChat = conversations.find((c) => {
      if (c.isGroup || !c.participants) return false;
      return c.participants.some(
        (p) => (p._id ? p._id.toString() : p.toString()) === targetUser._id.toString()
      );
    });

    if (existingChat) {
      selectConversation(existingChat);
    } else {
      const tempChat = {
        _id: `temp-${targetUser._id}`,
        isGroup: false,
        name: targetUser.name,
        participants: [user, targetUser],
        targetUser,
      };
      selectConversation(tempChat);
    }
  };

  // Submit Message
  const handleSend = async (e) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachmentDraft) || sending) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendStopTyping();

    const messageText = inputText.trim();
    const mediaUrl = attachmentDraft ? attachmentDraft.mediaUrl : '';
    const mediaType = attachmentDraft ? attachmentDraft.mediaType : '';

    setInputText('');
    setAttachmentDraft(null);

    try {
      setSending(true);

      const targetRecId =
        selectedChat?.targetUser?._id ||
        (selectedChat && !selectedChat._id && selectedChat.participants
          ? selectedChat.participants.find((p) => (p._id || p) !== user._id)?._id
          : undefined);

      await sendMessage({
        conversationId: selectedChat?._id,
        recipientId: targetRecId,
        content: messageText,
        mediaUrl,
        mediaType,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  // Confirm delete conversation
  const handleConfirmDeleteChat = async () => {
    if (!chatToDelete) return;
    try {
      setDeletingChat(true);
      setDeleteError('');
      await deleteConversation(chatToDelete._id);
      setChatToDelete(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || 'Failed to delete chat');
    } finally {
      setDeletingChat(false);
    }
  };

  return (
    <div className="h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-white flex overflow-hidden selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* 1. Leftmost Navigation Bar */}
      <aside className="w-20 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-6 justify-between z-10 transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/30 text-white">
            U
          </div>
          {/* Socket Live Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
              socketConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400'
            }`}
            title={socketConnected ? 'WebSockets Live' : 'Connecting to WebSockets...'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{socketConnected ? 'Live' : 'Connecting'}</span>
          </div>
        </div>

        <div className="flex flex-col gap-5 text-slate-400 items-center">
          <div className="relative">
            <button className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400" title="Chats">
              💬
            </button>
            {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsMessageSearchOpen(true)}
            className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white transition-all text-slate-500 dark:text-indigo-400"
            title="Search Messages"
          >
            🔎
          </button>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white transition-all text-slate-500 dark:text-slate-400"
            title="Search Users"
          >
            🔍
          </button>

          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-500 transition-all text-slate-500 dark:text-slate-400 text-lg"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button
            onClick={logout}
            className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 transition-all text-slate-500 dark:text-slate-400"
            title="Sign Out"
          >
            🚪
          </button>
        </div>

        {/* User Profile Avatar */}
        <div
          className="w-10 h-10 rounded-full bg-indigo-600/20 dark:bg-indigo-600/40 border border-indigo-400/50 dark:border-indigo-500/50 flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-300 overflow-hidden cursor-pointer"
          title={user?.name}
        >
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
      </aside>

      {/* 2. Middle Conversations List Column */}
      <section className="w-80 bg-white/80 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Messages</h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600 text-purple-600 dark:text-purple-300 hover:text-white text-xs font-semibold transition-all"
            >
              + Group
            </button>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white text-xs font-semibold transition-all"
            >
              + Chat
            </button>
          </div>
        </div>

        {/* Conversations Feed */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loadingConversations ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading conversations...</div>
          ) : displayedConversations.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
              <p>No active conversations yet</p>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
              >
                Search & Start Chat
              </button>
            </div>
          ) : (
            displayedConversations.map((chat) => {
              const isSelected = selectedChat && selectedChat._id === chat._id;
              const chatName = getChatName(chat);
              const chatAvatar = getChatAvatar(chat);
              const partner = getChatPartner(chat);

              return (
                <div
                  key={chat._id}
                  onClick={() => selectConversation(chat)}
                  className={`p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all animate-fade-in group ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="relative w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 overflow-hidden flex-shrink-0">
                    {chatAvatar ? (
                      <img
                        src={`${SOCKET_URL}${chatAvatar}`}
                        alt={chatName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      chatName.charAt(0).toUpperCase()
                    )}
                    {partner && (
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                          partner.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="text-sm font-semibold truncate text-slate-900 dark:text-white">{chatName}</h4>
                      {chat.latestMessage && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(chat.latestMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex-1">
                        {chat.latestMessage
                          ? chat.latestMessage.mediaUrl
                            ? chat.latestMessage.mediaType === 'image'
                              ? '📷 Image attachment'
                              : '📄 File attachment'
                            : chat.latestMessage.content
                          : 'No messages yet'}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {chat.unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-md shadow-indigo-600/30">
                            {chat.unreadCount}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteError('');
                            setChatToDelete(chat);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                          title="Delete Chat"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 3. Main Active Chat Window */}
      <main className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
        {selectedChat ? (
          <>
            {/* Active Chat Header */}
            <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold overflow-hidden">
                  {getChatAvatar(selectedChat) ? (
                    <img
                      src={`${SOCKET_URL}${getChatAvatar(selectedChat)}`}
                      alt={getChatName(selectedChat)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getChatName(selectedChat).charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {getChatName(selectedChat)}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    {isTyping ? (
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                        <span>typing</span>
                        <span className="flex gap-0.5">
                          <span className="w-1 h-1 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-1 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-1 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </span>
                    ) : selectedChat.isGroup ? (
                      `${selectedChat.participants?.length || 0} members`
                    ) : getChatPartner(selectedChat)?.status === 'online' ? (
                      '🟢 Online'
                    ) : (
                      'Offline'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Group Settings Button */}
                {selectedChat.isGroup && (
                  <button
                    onClick={() => setIsGroupSettingsOpen(true)}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-transparent"
                    title="Group Settings"
                  >
                    <span>⚙️</span>
                    <span className="hidden sm:inline">Settings</span>
                  </button>
                )}

                {/* Delete Chat Button */}
                <button
                  onClick={() => {
                    setDeleteError('');
                    setChatToDelete(selectedChat);
                  }}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-500/20 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-all text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-transparent"
                  title="Delete Chat"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </header>

            {/* Scrollable Message Thread Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages ? (
                <div className="py-12 text-center text-slate-500 text-sm">Loading message history...</div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No messages in this chat yet. Send a message to start communicating!
                </div>
              ) : (
                messages.map((msg) => {
                  const isSentByMe =
                    (msg.sender?._id || msg.sender) === user._id ||
                    (typeof msg.sender === 'object' && msg.sender._id === user._id);

                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col group relative ${isSentByMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-end gap-2 max-w-[70%] relative">
                        {!isSentByMe && (
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 overflow-hidden flex-shrink-0 mb-1">
                            {msg.sender?.avatar ? (
                              <img
                                src={`${SOCKET_URL}${msg.sender.avatar}`}
                                alt="sender"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              msg.sender?.name?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                        )}

                        {/* Quick Reaction Hover Toolbar */}
                        <div
                          className={`absolute -top-7 ${
                            isSentByMe ? 'right-0' : 'left-9'
                          } hidden group-hover:flex items-center gap-1 bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 backdrop-blur-md px-2 py-1 rounded-full shadow-lg z-20 animate-in fade-in zoom-in-90 duration-100`}
                        >
                          {['👍', '❤️', '😂', '😮', '😢', '🔥'].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg._id, emoji)}
                              className="text-xs hover:scale-125 transition-transform"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        {/* Chat Bubble */}
                        <div
                          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed relative ${
                            isSentByMe
                              ? 'bg-indigo-600 text-white rounded-br-xs shadow-md shadow-indigo-600/20'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs shadow-xs'
                          }`}
                        >
                          {/* Image Attachment Rendering */}
                          {msg.mediaUrl && msg.mediaType === 'image' && (
                            <div className="mb-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50">
                              <img
                                src={`${SOCKET_URL}${msg.mediaUrl}`}
                                alt="Attachment"
                                className="max-w-xs max-h-60 object-cover cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => window.open(`${SOCKET_URL}${msg.mediaUrl}`, '_blank')}
                              />
                            </div>
                          )}

                          {/* File Attachment Rendering */}
                          {msg.mediaUrl && msg.mediaType === 'file' && (
                            <div className="mb-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                              <span>📄</span>
                              <a
                                href={`${SOCKET_URL}${msg.mediaUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="text-xs text-indigo-600 dark:text-indigo-300 underline font-semibold hover:text-indigo-800 dark:hover:text-white truncate max-w-xs"
                              >
                                View / Download Attachment
                              </a>
                            </div>
                          )}

                          {/* Message Content Text */}
                          {msg.content && <p>{msg.content}</p>}

                          {/* Reaction Badges Display */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {Object.entries(
                                msg.reactions.reduce((acc, r) => {
                                  acc[r.reaction] = (acc[r.reaction] || 0) + 1;
                                  return acc;
                                }, {})
                              ).map(([emoji, count]) => {
                                const hasUserReacted = msg.reactions.some(
                                  (r) => (r.user?._id || r.user) === user._id && r.reaction === emoji
                                );
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => handleToggleReaction(msg._id, emoji)}
                                    className={`px-1.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 border transition-all ${
                                      hasUserReacted
                                        ? 'bg-indigo-500/20 dark:bg-indigo-500/30 border-indigo-400 text-indigo-600 dark:text-indigo-200'
                                        : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                                    }`}
                                  >
                                    <span>{emoji}</span>
                                    {count > 1 && <span className="font-bold">{count}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          <div
                            className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                              isSentByMe ? 'text-indigo-200/90' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isSentByMe && (
                              <span className="font-bold text-xs">
                                {msg.status === 'read' ? (
                                  <span className="text-cyan-300" title="Read">
                                    ✓✓
                                  </span>
                                ) : msg.status === 'delivered' ? (
                                  <span className="text-slate-300/80" title="Delivered">
                                    ✓✓
                                  </span>
                                ) : (
                                  <span className="text-indigo-200/70" title="Sent">
                                    ✓
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Animated Typing Dots Indicator Bubble */}
              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 overflow-hidden">
                    {getChatAvatar(selectedChat) ? (
                      <img
                        src={`${SOCKET_URL}${getChatAvatar(selectedChat)}`}
                        alt="partner"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getChatName(selectedChat).charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-500 flex items-center gap-1.5 rounded-bl-xs shadow-xs">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Footer */}
            <footer className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 backdrop-blur-md relative transition-colors">
              {/* Emoji Picker Popover */}
              <EmojiPicker
                isOpen={isEmojiPickerOpen}
                onClose={() => setIsEmojiPickerOpen(false)}
                onSelectEmoji={(emoji) => {
                  setInputText((prev) => prev + emoji);
                  setIsEmojiPickerOpen(false);
                }}
              />

              {/* Attachment Preview Banner */}
              {attachmentDraft && (
                <div className="mb-3 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-indigo-400 dark:border-indigo-500/40 flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-300">
                  <div className="flex items-center gap-2 truncate">
                    <span>{attachmentDraft.mediaType === 'image' ? '📷' : '📄'}</span>
                    <span className="font-semibold truncate">
                      {attachmentDraft.originalName || 'Attachment Ready'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachmentDraft(null)}
                    className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              )}

              <form onSubmit={handleSend} className="flex items-center gap-3">
                {/* Paperclip Attachment Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center font-bold text-lg transition-all flex-shrink-0 disabled:opacity-50"
                  title="Attach Image or File"
                >
                  {uploadingMedia ? '⏳' : '📎'}
                </button>

                {/* Emoji Picker Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-bold text-lg transition-all flex-shrink-0 ${
                    isEmojiPickerOpen
                      ? 'bg-indigo-100 dark:bg-indigo-600/20 border-indigo-400 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-yellow-500'
                  }`}
                  title="Insert Emoji"
                >
                  😊
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                />

                <button
                  type="submit"
                  disabled={(!inputText.trim() && !attachmentDraft) || sending}
                  className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  ➤
                </button>
              </form>
            </footer>
          </>
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
        onSelectUser={handleSelectUserFromSearch}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onGroupCreated={(newGroup) => {
          selectConversation(newGroup);
        }}
      />

      {/* Group Settings Modal */}
      <GroupSettingsModal
        isOpen={isGroupSettingsOpen}
        onClose={() => setIsGroupSettingsOpen(false)}
        chat={selectedChat}
        onGroupUpdated={(updatedGroup) => {
          setSelectedChat(updatedGroup);
          loadConversations();
        }}
      />

      {/* Full-Text Message Search Modal */}
      <MessageSearchModal
        isOpen={isMessageSearchOpen}
        onClose={() => setIsMessageSearchOpen(false)}
        onSelectResult={(searchMsg) => {
          const conv = searchMsg.conversationId;
          if (conv) {
            selectConversation(conv);
          }
        }}
      />

      {/* Delete Chat Confirmation Modal */}
      {chatToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center text-2xl mx-auto">
              🗑️
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete Chat?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {chatToDelete.isGroup
                  ? `Are you sure you want to delete the group "${getChatName(chatToDelete)}"? This will remove the conversation and all messages for all participants.`
                  : `Are you sure you want to delete your chat with "${getChatName(chatToDelete)}"? All messages will be permanently removed.`}
              </p>
            </div>

            {deleteError && (
              <div className="p-3 text-xs text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                {deleteError}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={deletingChat}
                onClick={() => {
                  setChatToDelete(null);
                  setDeleteError('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingChat}
                onClick={handleConfirmDeleteChat}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingChat ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete Chat'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
