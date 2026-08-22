import React, { useState } from 'react';

const EMOJI_CATEGORIES = {
  '😃 Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  '👍 Gestures': ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤟', '🤘', '👌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '💪', '🧠', '🫀', '👀', '👁️'],
  '❤️ Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '🔥', '✨', '🌟', '💫', '💥', '💯'],
  '🎉 Celebrations': ['🎉', '🎊', '🎈', '🎁', '🏆', '🏅', '⭐', '🚀', '🎯', '🎰', '🎲', '🎨', '🎬', '🎤', '🎧', '🎷', '🎸', '🎹', '🎺', '🎻', '🎮', '🕹️', '🔮'],
};

const EmojiPicker = ({ isOpen, onClose, onSelectEmoji }) => {
  const [activeCategory, setActiveCategory] = useState('😃 Smileys');

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-16 left-4 z-40 w-72 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
      {/* Header Tabs */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800/80 bg-slate-950/40 text-xs overflow-x-auto gap-1 no-scrollbar">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition-all text-xs font-semibold ${
              activeCategory === category
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {category.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="p-3 grid grid-cols-7 gap-1.5 max-h-48 overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory].map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelectEmoji(emoji);
            }}
            className="w-8 h-8 rounded-xl hover:bg-slate-800 flex items-center justify-center text-lg hover:scale-125 transition-all active:scale-95"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
