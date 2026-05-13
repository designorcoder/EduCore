import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { useTranslation } from './context/TranslationContext';
import { LogOut, User, Sun, Moon, Camera, Globe } from 'lucide-react';

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; // smaller for avatar
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });
};
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import ParentDashboard from './components/ParentDashboard';
import AdvisorDashboard from './components/AdvisorDashboard';

function App() {
  const { currentUser, logout, updateProfilePic } = useAuth();
  const { lang, setLang, t } = useTranslation();
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const fileInputRef = useRef(null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file && currentUser) {
      const base64 = await compressImage(file);
      updateProfilePic(currentUser.id, base64);
    }
    e.target.value = null;
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  if (!currentUser) {
    return <Login />;
  }

  const renderView = () => {
    if (currentUser.role === 'admin') {
      return <AdminPanel />;
    }
    if (currentUser.role === 'teacher') {
      return <TeacherDashboard />;
    }
    if (currentUser.role === 'student') {
      return <StudentDashboard />;
    }
    if (currentUser.role === 'parent') {
      return <ParentDashboard />;
    }
    if (currentUser.role === 'advisor') {
      return <AdvisorDashboard />;
    }
    return <div>Role not found</div>;
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row max-w-6xl mx-auto overflow-hidden p-0 relative">
      
      {/* App Header overlay for Logout */}
      <div className="absolute top-3 left-4 right-4 md:left-auto md:top-6 md:right-6 z-50 flex items-center justify-between md:justify-end gap-2 md:gap-4 bg-white/80 backdrop-blur-xl px-4 py-2.5 rounded-2xl md:rounded-full border border-slate-200 shadow-sm transition-colors duration-300">
        <button 
          onClick={() => setIsDark(!isDark)}
          className="text-slate-400 hover:text-amber-500 transition-colors flex items-center justify-center"
        >
          {isDark ? <Moon size={20} className="text-blue-300" /> : <Sun size={20} className="text-amber-500" />}
        </button>
        <div className="w-[1px] h-5 bg-slate-300"></div>
        <div className="flex items-center gap-1">
          <Globe size={18} className="text-slate-400" />
          <select 
            value={lang} 
            onChange={e => setLang(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-600 outline-none cursor-pointer"
          >
            <option value="uz">UZ</option>
            <option value="en">EN</option>
            <option value="ru">RU</option>
          </select>
        </div>
        <div className="w-[1px] h-5 bg-slate-300"></div>
        <div className="flex items-center gap-2">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="relative group w-8 h-8 rounded-full overflow-hidden border border-slate-300 flex items-center justify-center bg-slate-100 hover:ring-2 hover:ring-indigo-400 transition-all"
            title="Profil rasmini o'zgartirish"
          >
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-white text-[12px] font-bold ${
                currentUser.role === 'admin' ? 'bg-red-500' : currentUser.role === 'teacher' ? 'bg-amber-500' : currentUser.role === 'advisor' ? 'bg-purple-500' : 'bg-blue-500'
              }`}>
                <User size={14} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={14} className="text-white" />
            </div>
          </button>
          <span className="text-[15px] font-bold text-slate-700 hidden sm:block">{currentUser.username}</span>
        </div>
        <div className="w-[1px] h-5 bg-slate-300"></div>
        <button onClick={logout} className="text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1.5 text-[15px] font-bold">
          <LogOut size={18} /> <span className="hidden sm:inline">{t('logout')}</span>
        </button>
      </div>

      {/* Main app body */}
      <main className="flex-1 w-full h-screen overflow-y-auto no-scrollbar relative pb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentUser.role}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="p-5 md:p-8 h-full mt-14 md:mt-2"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
      
    </div>
  );
}

export default App;
