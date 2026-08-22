import React, { useState, useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import useChat from '../hooks/useChat';
import UserSearchModal from '../components/UserSearchModal';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupSettingsModal from '../components/GroupSettingsModal';
import MessageSearchModal from '../components/MessageSearchModal';
import EmojiPicker from '../components/EmojiPicker';
import { uploadMediaAttachmentApi, toggleMessageReactionApi } from '../services/messageService';

const Dashboard = () => {
  const { user, logout } = useAuth();
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
    if (!chat || !chat.participants) return null;
    if (chat.isGroup) return null;
    return chat.participants.find((p) => p._id !== user._id) || chat.participants[0];
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
    const existingChat = conversations.find(
      (c) =>
        !c.isGroup &&
        c.participants &&
        c.participants.some((p) => p._id === targetUser._id)
    );

    if (existingChat) {
      selectConversation(existingChat);
    } else {
      const tempChat = {
        isGroup: false,
        name: targetUser.name,
        participants: [user, targetUser],
        targetUser,
      };
      setSelectedChat(tempChat);
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

      if (selectedChat && selectedChat._id) {
        await sendMessage({ content: messageText, mediaUrl, mediaType });
      } else if (selectedChat && selectedChat.targetUser) {
        await sendMessage({
          recipientId: selectedChat.targetUser._id,
          content: messageText,
          mediaUrl,
          mediaType,
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-white flex overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* 1. Leftmost Navigation Bar */}
      <aside className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 justify-between z-10">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/30">
            U
          </div>
          {/* Socket Live Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
              socketConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
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

        <div className="flex flex-col gap-6 text-slate-400">
          <div className="relative">
            <button className="p-3 rounded-xl bg-slate-800 text-indigo-400" title="Chats">
              💬
            </button>
            {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-900 animate-pulse">
                {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsMessageSearchOpen(true)}
            className="p-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all text-indigo-400"
            title="Search Messages"
          >
            🔎
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
      <section className="w-80 bg-slate-900/50 border-r border-slate-800 flex flex-col">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Messages</h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white text-xs font-semibold transition-all"
            >
              + Group
            </button>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-semibold transition-all"
            >
              + Chat
            </button>
          </div>
        </div>

        {/* Conversations Feed */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loadingConversations ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading conversations...</div>
          ) : conversations.length === 0 ? (
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
            conversations.map((chat) => {
              const isSelected = selectedChat && selectedChat._id === chat._id;
              const chatName = getChatName(chat);
              const chatAvatar = getChatAvatar(chat);
              const partner = getChatPartner(chat);

              return (
                <div
                  key={chat._id}
                  onClick={() => selectConversation(chat)}
                  className={`p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-500/40'
                      : 'hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="relative w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 overflow-hidden flex-shrink-0">
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
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                          partner.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="text-sm font-semibold truncate text-white">{chatName}</h4>
                      {chat.latestMessage && (
                        <span className="text-[10px] text-slate-500">
                          {new Date(chat.latestMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-400 truncate flex-1">
                        {chat.latestMessage
                          ? chat.latestMessage.mediaUrl
                            ? chat.latestMessage.mediaType === 'image'
                              ? '📷 Image attachment'
                              : '📄 File attachment'
                            : chat.latestMessage.content
                          : 'No messages yet'}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-md shadow-indigo-600/30">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 3. Main Active Chat Window */}
      <main className="flex-1 bg-slate-950 flex flex-col">
        {selectedChat ? (
          <>
            {/* Active Chat Header */}
            <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold overflow-hidden">
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
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {getChatName(selectedChat)}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    {isTyping ? (
                      <span className="text-indigo-400 font-semibold flex items-center gap-1">
                        <span>typing</span>
                        <span className="flex gap-0.5">
                          <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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

              {/* Group Settings Button */}
              {selectedChat.isGroup && (
                <button
                  onClick={() => setIsGroupSettingsOpen(true)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5"
                  title="Group Settings"
                >
                  <span>⚙️</span>
                  <span>Settings</span>
                </button>
              )}
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
                          } hidden group-hover:flex items-center gap-1 bg-slate-900/90 border border-slate-800 backdrop-blur-md px-2 py-1 rounded-full shadow-lg z-20 animate-in fade-in zoom-in-90 duration-100`}
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
                              : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs'
                          }`}
                        >
                          {/* Image Attachment Rendering */}
                          {msg.mediaUrl && msg.mediaType === 'image' && (
                            <div className="mb-2 rounded-xl overflow-hidden border border-slate-700/50">
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
                            <div className="mb-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2">
                              <span>📄</span>
                              <a
                                href={`${SOCKET_URL}${msg.mediaUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="text-xs text-indigo-300 underline font-semibold hover:text-white truncate max-w-xs"
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
                                        ? 'bg-indigo-500/30 border-indigo-400 text-indigo-200'
                                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
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
                              isSentByMe ? 'text-indigo-200/80' : 'text-slate-500'
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
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 overflow-hidden">
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
                  <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400 flex items-center gap-1.5 rounded-bl-xs">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Footer */}
            <footer className="p-4 border-t border-slate-800 bg-slate-900/40 backdrop-blur-md relative">
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
                <div className="mb-3 p-2.5 rounded-2xl bg-slate-900 border border-indigo-500/40 flex items-center justify-between text-xs text-indigo-300">
                  <div className="flex items-center gap-2 truncate">
                    <span>{attachmentDraft.mediaType === 'image' ? '📷' : '📄'}</span>
                    <span className="font-semibold truncate">
                      {attachmentDraft.originalName || 'Attachment Ready'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachmentDraft(null)}
                    className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
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
                  className="w-12 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-indigo-400 flex items-center justify-center font-bold text-lg transition-all flex-shrink-0 disabled:opacity-50"
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
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-yellow-400'
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
                  className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
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
    </div>
  );
};

export default Dashboard;
