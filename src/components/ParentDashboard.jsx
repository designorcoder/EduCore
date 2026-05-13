import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { BookOpen, CheckCircle2, Clock, Calendar, Shield, Megaphone, MessageSquare, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../context/TranslationContext';
import ChatComponent from './ChatComponent';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

export default function ParentDashboard() {
  const { currentUser, users } = useAuth();
  const { data } = useAppContext();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('overview'); // overview | tasks | schedule | chat
  const [selectedChat, setSelectedChat] = useState(null);

  // Get fresh current user data from users array
  const me = users.find(u => u.id === currentUser.id) || currentUser;

  // Identify child (with fallback for old accounts where childId might be a string username or stored as studentId, child, childUsername, extraData)
  const possibleIdentifiers = [
    me.childId, 
    me.studentId, 
    me.childUsername, 
    me.child, 
    me.student,
    me.class // in case old code saved it in class property by accident
  ].filter(Boolean).map(String);

  const child = users.find(u => 
    u.role === 'student' && (
      possibleIdentifiers.includes(String(u.id)) || 
      possibleIdentifiers.includes(String(u.username))
    )
  );
  
  if (!child) {
    return (
      <div className="p-10 text-center space-y-4">
        <div className="font-bold text-slate-500 text-lg">Farzand biriktirilmagan. Iltimos adminga murojaat qiling.</div>
        <div className="text-xs text-slate-400 bg-slate-100 p-4 rounded-xl max-w-lg mx-auto overflow-auto text-left">
          <p className="font-bold mb-2">Debug ma'lumot (Adminga ko'rsating):</p>
          <pre>{JSON.stringify(me, null, 2)}</pre>
        </div>
      </div>
    );
  }

  const studentClass = child.class;
  const classTasks = data.tasks.filter(t => t.className === studentClass);
  const classSchedule = data.schedule[studentClass] || {};
  const announcements = (data.announcements || []).filter(a => !a.targetClass || a.targetClass === studentClass);

  // Stats
  const childAttendance = data.attendance.filter(a => a.studentId === child.id);
  const absences = childAttendance.filter(a => !a.isPresent).length;
  
  const childGrades = data.grades.filter(g => g.studentId === child.id);
  const avgGrade = childGrades.length > 0 
    ? (childGrades.reduce((acc, curr) => acc + Number(curr.grade), 0) / childGrades.length).toFixed(1) 
    : 'Yo\'q';

  // Chart Data: Average grade per subject
  const subjects = [...new Set(childGrades.map(g => g.subject))];
  const chartData = subjects.map(sub => {
    const sGrades = childGrades.filter(g => g.subject === sub);
    const avg = sGrades.reduce((a,c) => a + Number(c.grade), 0) / sGrades.length;
    return { name: sub, "O'rtacha": Number(avg.toFixed(1)) };
  });

  const classAdvisor = users.find(u => u.role === 'advisor' && u.advisorClasses && u.advisorClasses.includes(studentClass));
  const totalUnread = (data.messages || []).filter(m => m.receiverId === currentUser.id && !m.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-2">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Shield className="text-pink-500" /> {t('role_parent')}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Farzandingiz: <span className="font-bold text-indigo-600">{child.username}</span> ({studentClass})</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center px-6">
            <div className="text-xs font-bold text-slate-400 uppercase">O'rtacha Baho</div>
            <div className={`text-xl font-black ${Number(avgGrade) >= 4 ? 'text-green-500' : Number(avgGrade) >= 3 ? 'text-amber-500' : 'text-slate-800'}`}>{avgGrade}</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center px-6">
            <div className="text-xs font-bold text-slate-400 uppercase">Qoldirilgan Darslar</div>
            <div className={`text-xl font-black ${absences > 0 ? 'text-red-500' : 'text-slate-800'}`}>{absences}</div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl w-max flex-wrap gap-1">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-white shadow text-pink-600' : 'text-slate-500'}`}
        >
          <Megaphone size={18}/> {t('announcements')}
        </button>
        <button 
          onClick={() => setActiveTab('tasks')}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'tasks' ? 'bg-white shadow text-pink-600' : 'text-slate-500'}`}
        >
          <BookOpen size={18}/> {t('tasks')}
        </button>
        <button 
          onClick={() => setActiveTab('schedule')}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'schedule' ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:bg-slate-200/50'}`}
        >
          <Calendar size={18}/> {t('schedule')}
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'chat' ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:bg-slate-200/50'}`}
        >
          <MessageSquare size={18}/> {t('chat')}
          {totalUnread > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{totalUnread}</span>}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-4 mt-4">
            <h2 className="font-bold text-lg text-slate-800 mb-2">Maktab e'lonlari</h2>
            {announcements.length === 0 ? (
              <div className="text-center py-10 text-slate-400 glass-panel">Hozircha e'lonlar yo'q</div>
            ) : (
              announcements.map(a => (
                <div key={a.id} className="glass-panel p-5 border-l-4 border-l-indigo-500">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-indigo-600">{a.author}</span>
                    <span className="text-xs font-bold text-slate-400">{new Date(a.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-700 font-medium">{a.text}</p>
                </div>
              ))
            )}
            
            <h2 className="font-bold text-lg text-slate-800 mt-6 mb-2">Oxirgi Baholar</h2>
            <div className="glass-panel p-4">
              {childGrades.length === 0 ? (
                <div className="text-center py-5 text-slate-400">Baholar olinmagan</div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {childGrades.slice().reverse().map(g => (
                    <div key={g.id} className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{g.subject}</div>
                      <div className={`text-lg font-black ${g.grade === '5' ? 'text-green-500' : g.grade === '4' ? 'text-blue-500' : 'text-amber-500'}`}>{g.grade}</div>
                      <div className="text-[10px] text-slate-400">{g.date}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {chartData.length > 0 && (
              <div className="glass-panel p-6 mt-6">
                <h2 className="font-bold text-lg text-slate-800 mb-6">Fanlar bo'yicha o'zlashtirish</h2>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="O'rtacha" fill="#ec4899" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'tasks' && (
          <motion.div key="tasks" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="grid gap-4 mt-4">
            {classTasks.length === 0 ? (
              <div className="text-center py-16 text-slate-400 glass-panel border border-dashed border-slate-300">
                <p className="font-semibold text-lg">Farzandingiz sinfida vazifalar yo'q.</p>
              </div>
            ) : (
              classTasks.sort((a,b)=>new Date(b.deadline)-new Date(a.deadline)).map(t => {
                const submission = t.completedBy.find(c => c === child.id || c.studentId === child.id);
                const isDone = !!submission;
                const isLate = new Date(t.deadline) < new Date(new Date().setHours(0,0,0,0)) && !isDone;

                return (
                  <motion.div 
                    layout
                    key={t.id} 
                    className={`glass-panel p-5 flex gap-4 transition-all duration-300 relative overflow-hidden group ${isDone ? 'opacity-80 bg-green-50/30 border-t-2 border-t-green-400' : 'border-t-2 border-t-amber-400'}`}
                  >
                    <div className="flex flex-col items-center gap-2 mt-1">
                      <div className={`flex-shrink-0 ${isDone ? 'text-green-500' : 'text-amber-400'}`}>
                        {isDone ? <CheckCircle2 size={28} strokeWidth={2.5} /> : <Clock size={28} strokeWidth={2.5} />}
                      </div>
                    </div>
                    
                    <div className="flex-1 pt-0.5">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{t.subject}</span>
                      
                      <p className={`font-bold mt-2 text-[17px] leading-snug ${isDone ? 'text-slate-600' : 'text-slate-800'}`}>
                        {t.task}
                      </p>
                      
                      <div className={`flex items-center gap-1.5 mt-3 text-xs font-bold ${isDone ? 'text-slate-400' : isLate ? 'text-red-500 bg-red-50 w-max px-2 py-1 rounded-md' : 'text-amber-500'}`}>
                        <span>Muddati: {t.deadline} {isLate ? '(Muddati o\'tgan)' : ''}</span>
                        {isDone && <span className="ml-2 text-green-600 bg-green-100 px-2 py-0.5 rounded-md">Bajarilgan</span>}
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        )}

        {activeTab === 'schedule' && (
          <motion.div key="schedule" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="grid md:grid-cols-2 gap-4 mt-4">
             {DAYS.map(day => (
                <div key={day} className="glass-panel p-5 border-t-[3px] border-t-indigo-400">
                  <h3 className="font-bold text-lg text-slate-800 mb-4">{day}</h3>
                  {(!classSchedule[day] || classSchedule[day].length === 0) ? (
                    <div className="py-4 text-sm text-slate-400 font-medium italic border-2 border-dashed border-slate-100 rounded-xl text-center">Darslar yo'q</div>
                  ) : (
                    <ul className="space-y-2.5 mt-2">
                      {classSchedule[day].map((subj, idx) => (
                        <li key={idx} className="flex gap-4 text-sm items-center p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
                          <span className="font-black text-slate-300 w-5 text-right font-mono text-[16px]">{idx+1}</span>
                          <span className="text-slate-800 font-bold">{subj}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
             ))}
          </motion.div>
        )}

        {activeTab === 'chat' && (
          <motion.div key="chat" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="grid md:grid-cols-12 gap-6 mt-4">
            <div className={`md:col-span-4 glass-panel p-4 h-max ${selectedChat ? 'hidden md:block' : 'block'}`}>
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={18} className="text-pink-500"/> Bog'lanish</h3>
                
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4 ml-1">Sinf rahbari</div>
                  {classAdvisor ? (
                    (() => {
                      const unreadCount = (data.messages || []).filter(m => m.senderId === classAdvisor.id && m.receiverId === currentUser.id && !m.read).length;
                      return (
                        <button 
                          onClick={() => setSelectedChat({ id: classAdvisor.id, name: classAdvisor.username, type: 'advisor' })}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center ${selectedChat?.id === classAdvisor.id ? 'bg-pink-50 border-pink-200 text-pink-700' : 'bg-slate-50 border-slate-100 hover:border-pink-100'}`}
                        >
                          <div className="flex items-center gap-3">
                            {classAdvisor.avatar ? (
                              <img src={classAdvisor.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold border border-slate-200">
                                {classAdvisor.username.substring(0,2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-sm">{classAdvisor.username}</div>
                            </div>
                          </div>
                          {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">{unreadCount}</span>}
                        </button>
                      );
                    })()
                  ) : (
                    <div className="text-sm text-slate-400 italic p-3 text-center border border-dashed rounded-xl">Sinf rahbari tayinlanmagan</div>
                  )}
                </div>
            </div>
            
            <div className={`md:col-span-8 ${selectedChat ? 'block' : 'hidden md:block'}`}>
                {selectedChat ? (
                  <ChatComponent targetUserId={selectedChat.id} targetUserName={selectedChat.name} onBack={() => setSelectedChat(null)} />
                ) : (
                  <div className="h-full flex items-center justify-center p-10 text-slate-400 font-medium italic glass-panel border border-dashed border-slate-200">
                    Suhbatni boshlash uchun chap tomondan tanlang
                  </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
