import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { Send, User, Users, Image as ImageIcon, X, Pencil, Trash2, ChevronLeft } from 'lucide-react';

export default function ChatComponent({ targetUserId, targetUserName, onBack }) {
  const { currentUser, users } = useAuth();
  const { data, sendMessage, markMessagesAsRead, editMessage, deleteMessage } = useAppContext();
  const [text, setText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);

  const isGroup = String(targetUserId).startsWith('GROUP_');

  const messages = (data.messages || []).filter(m => 
    isGroup 
      ? m.receiverId === targetUserId
      : ((m.senderId === currentUser.id && m.receiverId === targetUserId) ||
         (m.senderId === targetUserId && m.receiverId === currentUser.id))
  ).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, targetUserId]);

  useEffect(() => {
    if (!isGroup) {
      const hasUnread = messages.some(m => m.senderId === targetUserId && m.receiverId === currentUser.id && !m.read);
      if (hasUnread) {
        markMessagesAsRead(targetUserId, currentUser.id);
      }
    } else {
      const hasUnread = messages.some(m => m.receiverId === targetUserId && !(m.readBy || [m.senderId]).includes(currentUser.id));
      if (hasUnread) {
        markMessagesAsRead(targetUserId, currentUser.id);
      }
    }
  }, [messages.length, targetUserId, currentUser.id, isGroup]);

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          let scaleSize = 1;
          if (img.width > MAX_WIDTH) scaleSize = MAX_WIDTH / img.width;
          canvas.width = img.width * scaleSize;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setImagePreview(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
    }
    e.target.value = null;
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (editingMessageId) {
      if (text.trim()) {
        editMessage(editingMessageId, text.trim());
      } else {
        deleteMessage(editingMessageId);
      }
      setEditingMessageId(null);
      setText('');
      return;
    }
    if (text.trim() || imagePreview) {
      sendMessage(currentUser.id, targetUserId, text.trim(), imagePreview);
      setText('');
      setImagePreview(null);
    }
  };

  const targetUser = !isGroup ? users.find(u => u.id === targetUserId) : null;

  return (
    <div className="flex flex-col h-[600px] md:h-[500px] glass-panel border-t-4 border-t-indigo-400 overflow-hidden relative">
      <div className="bg-slate-50 border-b border-slate-200 p-4 font-bold text-slate-700 flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="md:hidden p-1.5 hover:bg-slate-200 rounded-lg transition-colors mr-1 flex items-center justify-center">
            <ChevronLeft size={20} />
          </button>
        )}
        {isGroup ? (
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-200">
            <Users size={20} />
          </div>
        ) : targetUser?.avatar ? (
          <img src={targetUser.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-200">
            <User size={20} />
          </div>
        )}
        {isGroup ? `Sinf Guruhi: ${targetUserName}` : `Suhbat: ${targetUserName}`}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm mt-10">
            Hozircha xabarlar yo'q. Birinchi bo'lib yozing!
          </div>
        ) : (
          messages.map(m => {
            const isMe = m.senderId === currentUser.id;
            const sender = users.find(u => u.id === m.senderId) || { username: 'Unknown' };
            
            return (
              <div key={m.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {isGroup && (
                    <div className="flex-shrink-0 mt-auto mb-1">
                      {sender.avatar ? (
                        <img src={sender.avatar} className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm" alt="Avatar"/>
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm ${sender.role === 'advisor' ? 'bg-purple-500' : sender.role === 'teacher' ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                          {sender.username.substring(0,2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {isGroup && (
                      <span className="text-[10px] font-bold text-slate-400 mb-1 mx-1">
                        {isMe ? 'Siz' : sender.username} {sender.role === 'advisor' && !isMe ? '(Sinf rahbari)' : ''}
                      </span>
                    )}
                    <div 
                      onClick={() => isMe && setActiveMessageId(activeMessageId === m.id ? null : m.id)}
                      className={`p-3 px-4 rounded-2xl shadow-sm relative cursor-pointer ${isMe ? 'bg-indigo-500 text-white rounded-br-sm' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-sm'}`}
                    >
                      {isMe && activeMessageId === m.id && (
                        <div className="absolute -top-3 right-2 flex bg-white rounded-md shadow-md border border-slate-200 overflow-hidden text-slate-500 z-10">
                          <button onClick={(e) => {e.stopPropagation(); setEditingMessageId(m.id); setText(m.text || ''); setActiveMessageId(null); if(fileInputRef.current) fileInputRef.current.value=null; setImagePreview(null);}} className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Tahrirlash">
                            <Pencil size={12} />
                          </button>
                          <button onClick={(e) => {e.stopPropagation(); deleteMessage(m.id); setActiveMessageId(null);}} className="p-1.5 hover:bg-red-50 hover:text-red-500 transition-colors border-l border-slate-200" title="O'chirish">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                      {m.image && <img src={m.image} alt="Attached" className="max-w-xs w-full rounded-xl mb-2 shadow-sm" />}
                      {m.text && <p className="text-[15px] leading-snug break-words">{m.text}</p>}
                      <p className={`text-[10px] mt-1 flex items-center gap-1 font-bold ${isMe ? 'justify-end text-indigo-200' : 'justify-start text-slate-400'}`}>
                        {m.edited && <span className="italic mr-1 font-medium opacity-80">(tahrirlangan)</span>}
                        {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {!isGroup && isMe && (
                          <span className="ml-1">
                            {m.read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {imagePreview && (
        <div className="p-3 bg-slate-100 border-t border-slate-200 relative">
          <button onClick={() => setImagePreview(null)} className="absolute top-4 right-4 bg-slate-800/60 text-white p-1 rounded-full shadow-sm hover:bg-red-500 transition-colors">
            <X size={16} />
          </button>
          <img src={imagePreview} className="h-24 rounded-lg shadow-sm border border-slate-300" alt="Preview"/>
        </div>
      )}
      <form onSubmit={handleSend} className="bg-white border-t border-slate-100 flex flex-col">
        {editingMessageId && (
          <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center text-xs font-bold text-indigo-700">
            <span>Xabarni tahrirlash...</span>
            <button type="button" onClick={() => { setEditingMessageId(null); setText(''); }} className="text-indigo-400 hover:text-indigo-600 bg-white p-1 rounded-md shadow-sm">
              <X size={14} />
            </button>
          </div>
        )}
        <div className="p-3 flex gap-2 items-center">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} disabled={!!editingMessageId} />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!!editingMessageId} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors flex-shrink-0 border shadow-sm ${editingMessageId ? 'bg-slate-100 text-slate-300 border-slate-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'}`}>
            <ImageIcon size={20} />
          </button>
          <input 
            type="text" 
            value={text} 
            onChange={e => setText(e.target.value)} 
            placeholder="Xabar yozing..." 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-2.5 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 transition-all text-[15px] font-medium"
          />
          <button type="submit" className="w-12 h-12 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md shadow-indigo-500/20 flex-shrink-0">
            <Send size={20} className={editingMessageId ? "" : "ml-1"} />
          </button>
        </div>
      </form>
    </div>
  );
}
