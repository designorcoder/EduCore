import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from '../context/TranslationContext';
import { Users, Calendar, MessageSquare, Megaphone, Trophy, ClipboardCheck, Menu, X, BookOpen, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatComponent from './ChatComponent';

const DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

const calculateStudentXP = (studentId, data) => {
  let xp = 0;
  data.tasks.forEach(t => {
     if (t.completedBy.find(c => c === studentId || c.studentId === studentId)) xp += 20;
  });
  data.grades.forEach(g => {
     if (g.studentId === studentId && g.grade) xp += parseInt(g.grade) * 10;
  });
  return xp;
};

export default function AdvisorDashboard() {
  const { users, currentUser } = useAuth();
  const { data, markAttendance, addAnnouncement } = useAppContext();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('attendance'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const advisorClasses = currentUser.advisorClasses || (currentUser.class ? currentUser.class.split(',').map(s=>s.trim()) : []);
  
  const [selectedClass, setSelectedClass] = useState(advisorClasses[0] || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [announcementText, setAnnouncementText] = useState('');

  const classStudents = users.filter(u => u.role === 'student' && u.class === selectedClass);
  const classSchedule = data.schedule[selectedClass] || {};

  const handleAnnouncementAdd = (e) => {
    e.preventDefault();
    if (selectedClass && announcementText) {
      addAnnouncement(announcementText, `Sinf rahbari: ${currentUser.username}`, selectedClass);
      setAnnouncementText('');
    }
  };

  const getAttendance = (studentId) => {
    const record = data.attendance.find(a => a.date === date && a.studentId === studentId);
    return record ? record.isPresent : true;
  };

  const totalUnread = (data.messages || []).filter(m => m.receiverId === currentUser.id && !m.read).length;

  const getSubjects = () => {
    const subjects = new Set();
    data.grades.filter(g => g.className === selectedClass).forEach(g => subjects.add(g.subject));
    return Array.from(subjects);
  };
  const subjects = getSubjects();

  const leaderboard = classStudents.map(s => ({
    ...s,
    xp: calculateStudentXP(s.id, data)
  })).sort((a,b) => b.xp - a.xp);

  return (
    <div className="space-y-6 max-w-5xl mx-auto mt-2 pb-10">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">{t('role_advisor')}</h1>
        <p className="text-slate-500 mt-1 font-medium">{t('welcome')}, {currentUser.username}!</p>
      </header>

      <div className="glass-panel relative z-[60] p-4 flex flex-wrap gap-4 items-center justify-between border-t-4 border-t-purple-400">
        <div className="flex gap-4 items-center flex-1">
          <select 
            value={selectedClass} 
            onChange={e => {setSelectedClass(e.target.value); setSelectedChat(null);}}
            className="bg-slate-50 border-2 border-slate-200 p-2.5 rounded-xl outline-none focus:border-purple-400 font-semibold text-slate-700 min-w-[150px]"
          >
            {advisorClasses.length === 0 && <option value="">Sinf biriktirilmagan</option>}
            {advisorClasses.map(c => <option key={c} value={c}>{c} - sinf</option>)}
          </select>

          {activeTab === 'attendance' && (
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="bg-slate-50 border-2 border-slate-200 p-2.5 rounded-xl outline-none focus:border-purple-400 font-semibold text-slate-700"
            />
          )}
        </div>

        <div className="relative">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-colors">
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />} Asosiy Menyu
          </button>
          <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-14 right-0 z-[100] w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl p-2.5 flex flex-col gap-1.5"
            >
              <button onClick={() => {setActiveTab('attendance'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 ${activeTab === 'attendance' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'text-slate-700 hover:bg-purple-50 hover:text-purple-600 hover:translate-x-1'}`}><ClipboardCheck size={20} /> {t('attendance')}</button>
              <button onClick={() => {setActiveTab('journal'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 ${activeTab === 'journal' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'text-slate-700 hover:bg-purple-50 hover:text-purple-600 hover:translate-x-1'}`}><BookOpen size={20} /> {t('journal')}</button>
              <button onClick={() => {setActiveTab('schedule'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 ${activeTab === 'schedule' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'text-slate-700 hover:bg-purple-50 hover:text-purple-600 hover:translate-x-1'}`}><Calendar size={20} /> {t('schedule')}</button>
              <button onClick={() => {setActiveTab('leaderboard'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 ${activeTab === 'leaderboard' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'text-slate-700 hover:bg-purple-50 hover:text-purple-600 hover:translate-x-1'}`}><Trophy size={20} /> {t('leaderboard')}</button>
              <button onClick={() => {setActiveTab('announcements'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 ${activeTab === 'announcements' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'text-slate-700 hover:bg-purple-50 hover:text-purple-600 hover:translate-x-1'}`}><Megaphone size={20} /> {t('announcements')}</button>
              <button onClick={() => {setActiveTab('chat'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 justify-between ${activeTab === 'chat' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'text-slate-700 hover:bg-purple-50 hover:text-purple-600 hover:translate-x-1'}`}>
                <div className="flex items-center gap-3"><MessageSquare size={20}/> {t('chat')}</div>
                {totalUnread > 0 && <span className="bg-red-500 text-white text-[11px] px-2.5 py-0.5 rounded-full shadow-md">{totalUnread}</span>}
              </button>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>

      {(!selectedClass && advisorClasses.length === 0) ? (
        <div className="text-center py-16 text-slate-400 glass-panel border border-dashed border-slate-300">
          <Users size={48} className="mx-auto mb-3 text-slate-300 opacity-50" />
          <p className="font-semibold text-lg">Sizga hech qaysi sinf biriktirilmagan</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'attendance' && (
            <motion.div key="attendance" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="glass-panel overflow-hidden mt-4">
              <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-12 gap-4 font-bold text-slate-500 text-xs uppercase tracking-wider">
                <div className="col-span-8">O'quvchi</div>
                <div className="col-span-4 text-center">Davomat</div>
              </div>
              
              <div className="divide-y divide-slate-100">
                {classStudents.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-medium">Bu sinfda o'quvchilar yo'q.</div>
                ) : (
                  classStudents.map(student => {
                    const isPresent = getAttendance(student.id);
                    return (
                      <div key={student.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50/50 transition-colors">
                        <div className="col-span-8 font-bold text-slate-800 flex items-center gap-2">
                          {student.avatar ? (
                            <img src={student.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 border border-slate-200">
                              {student.username.substring(0,2).toUpperCase()}
                            </div>
                          )}
                          {student.username}
                        </div>
                        
                        <div className="col-span-4 flex justify-center gap-2">
                          <button onClick={() => markAttendance(date, selectedClass, student.id, true)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isPresent ? 'bg-green-100 text-green-700 ring-2 ring-green-400' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>Keldi</button>
                          <button onClick={() => markAttendance(date, selectedClass, student.id, false)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!isPresent ? 'bg-red-100 text-red-700 ring-2 ring-red-400' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>Yo'q</button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'journal' && (
            <motion.div key="journal" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="glass-panel p-6 overflow-x-auto mt-4 print-section">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen size={22} className="text-purple-500" /> Umumiy Jurnal ({selectedClass})
                  </h2>
                  <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 print:hidden shadow-md">
                    <Printer size={18} /> Chop etish (PDF)
                  </button>
                </div>
                
                {classStudents.length === 0 || subjects.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-medium print:hidden">Bu sinfda hozircha baholar kiritilmagan.</div>
                ) : (
                  <div className="min-w-max border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-3 border-r border-slate-200 w-10 text-center">#</th>
                          <th className="p-3 border-r border-slate-200 w-48">O'quvchi ismi</th>
                          {subjects.map(sub => (
                            <th key={sub} className="p-3 border-r border-slate-200 w-24 text-center whitespace-nowrap">
                              {sub}
                            </th>
                          ))}
                          <th className="p-3 w-20 text-center bg-purple-50">O'rtacha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {classStudents.map((student, i) => {
                          let totalS = 0;
                          let countS = 0;
                          return (
                            <tr key={student.id}>
                              <td className="p-3 border-r border-slate-200 text-center font-bold text-slate-400">{i+1}</td>
                              <td className="p-3 border-r border-slate-200 font-bold text-slate-800">{student.username}</td>
                              {subjects.map(sub => {
                                const sGrades = data.grades.filter(g => g.studentId === student.id && g.subject === sub && g.grade);
                                const avg = sGrades.length ? (sGrades.reduce((acc, curr) => acc + Number(curr.grade), 0) / sGrades.length).toFixed(1) : '-';
                                if (avg !== '-') { totalS += Number(avg); countS++; }
                                return (
                                  <td key={sub} className={`p-3 border-r border-slate-200 text-center font-black ${Number(avg) >= 4.5 ? 'text-green-500' : Number(avg) >= 3.5 ? 'text-blue-500' : Number(avg) > 0 ? 'text-orange-500' : 'text-slate-300'}`}>
                                    {avg}
                                  </td>
                                )
                              })}
                              <td className="p-3 text-center font-black bg-purple-50 text-purple-700">
                                {countS > 0 ? (totalS / countS).toFixed(1) : '-'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div key="schedule" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="grid md:grid-cols-2 gap-4 mt-4">
               {DAYS.map(day => (
                  <div key={day} className="glass-panel p-5 border-t-[3px] border-t-purple-400">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">{day}</h3>
                    {(!classSchedule[day] || classSchedule[day].length === 0) ? (
                      <div className="py-4 text-sm text-slate-400 font-medium italic border-2 border-dashed border-slate-100 rounded-xl text-center">Darslar yo'q</div>
                    ) : (
                      <ul className="space-y-2.5 mt-2">
                        {classSchedule[day].map((subj, idx) => (
                          <li key={idx} className="flex gap-4 text-sm items-center p-2.5 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-purple-50 hover:border-purple-200 group transition-colors">
                            <span className="font-black text-slate-300 group-hover:text-purple-300 transition-colors w-5 text-right font-mono text-[16px]">{idx+1}</span>
                            <span className="text-slate-800 font-bold group-hover:text-purple-700 transition-colors">{subj}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
               ))}
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div key="leaderboard" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="glass-panel p-6 mt-4 max-w-2xl mx-auto">
              <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center justify-center gap-3">
                <Trophy className="text-orange-500" size={32} /> Reyting ({selectedClass})
              </h2>
              <div className="space-y-3">
                {leaderboard.length === 0 ? <div className="text-center text-slate-400">O'quvchilar yo'q</div> : leaderboard.map((student, idx) => (
                  <div key={student.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all bg-slate-50 border-transparent hover:border-slate-100`}>
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full font-black text-lg ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-600' :
                      idx === 1 ? 'bg-slate-200 text-slate-600' :
                      idx === 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>
                    {student.avatar ? (
                      <img src={student.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow-sm">
                        {student.username.substring(0,2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 font-bold text-slate-800">{student.username}</div>
                    <div className="font-black text-orange-500 text-xl">{student.xp} <span className="text-xs text-orange-300">XP</span></div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'announcements' && (
            <motion.div key="announcements" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="mt-4 glass-panel p-6 border-t-4 border-t-purple-500">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Megaphone size={22} className="text-purple-500" /> {selectedClass} sinfi uchun e'lon berish
              </h2>
              <form onSubmit={handleAnnouncementAdd} className="space-y-4 max-w-2xl">
                <textarea 
                  required 
                  value={announcementText} 
                  onChange={e => setAnnouncementText(e.target.value)} 
                  rows="4" 
                  placeholder="E'lon matnini kiriting..." 
                  className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-xl outline-none focus:border-purple-400 text-[15px] font-semibold text-slate-700 transition-all resize-none"
                ></textarea>
                <button type="submit" className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-colors">
                  E'lonni yuborish
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="grid md:grid-cols-12 gap-6 mt-4">
              <div className={`md:col-span-4 glass-panel p-4 h-max ${selectedChat ? 'hidden md:block' : 'block'}`}>
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users size={18} className="text-purple-500"/> Guruh va O'quvchilar</h3>
                  <div className="space-y-2 h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {selectedClass && (
                      <button 
                        onClick={() => setSelectedChat({ id: `GROUP_${selectedClass}`, name: selectedClass, type: 'group' })}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center ${selectedChat?.id === `GROUP_${selectedClass}` ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-50 border-slate-100 hover:border-purple-100'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                            <Users size={20} />
                          </div>
                          <div className="font-bold text-sm">Sinf Guruhi</div>
                        </div>
                        {(() => {
                          const msgCount = (data.messages || []).filter(m => m.receiverId === `GROUP_${selectedClass}` && !(m.readBy || [m.senderId]).includes(currentUser.id)).length;
                          return msgCount > 0 ? (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                              {msgCount}
                            </span>
                          ) : null;
                        })()}
                      </button>
                    )}
                    
                    <div className="my-4 border-t border-slate-100"></div>

                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4 ml-1">O'quvchilar</div>
                    {users
                      .filter(u => u.role === 'student' && advisorClasses.includes(u.class))
                      .map(student => {
                        const unreadCount = (data.messages || []).filter(m => m.senderId === student.id && m.receiverId === currentUser.id && !m.read).length;
                        return { ...student, unreadCount };
                      })
                      .sort((a, b) => b.unreadCount - a.unreadCount)
                      .map(student => (
                        <button 
                          key={student.id}
                          onClick={() => setSelectedChat({ id: student.id, name: student.username, class: student.class, type: 'student' })}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center ${selectedChat?.id === student.id ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-50 border-slate-100 hover:border-purple-100'}`}
                        >
                          <div className="flex items-center gap-3">
                            {student.avatar ? (
                              <img src={student.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 font-bold border border-slate-200">
                                {student.username.substring(0,2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-sm">{student.username}</div>
                              <div className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">{student.class}</div>
                            </div>
                          </div>
                          {student.unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">{student.unreadCount}</span>}
                        </button>
                      ))
                    }

                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-6 ml-1">Ota-onalar</div>
                    {users
                      .filter(u => {
                        if (u.role !== 'parent') return false;
                        const child = users.find(c => c.id === u.childId || c.id === u.studentId || c.username === u.childId || c.username === u.studentId);
                        return child && advisorClasses.includes(child.class);
                      })
                      .map(parent => {
                        const unreadCount = (data.messages || []).filter(m => m.senderId === parent.id && m.receiverId === currentUser.id && !m.read).length;
                        const child = users.find(c => c.id === parent.childId || c.id === parent.studentId || c.username === parent.childId || c.username === parent.studentId);
                        return { ...parent, unreadCount, childUsername: child ? child.username : 'Noma\'lum', childClass: child ? child.class : '' };
                      })
                      .sort((a, b) => b.unreadCount - a.unreadCount)
                      .map(parent => (
                        <button 
                          key={parent.id}
                          onClick={() => setSelectedChat({ id: parent.id, name: parent.username, sub: `(${parent.childUsername}ning ota-onasi)`, type: 'parent' })}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center mt-2 ${selectedChat?.id === parent.id ? 'bg-pink-50 border-pink-200 text-pink-700' : 'bg-slate-50 border-slate-100 hover:border-pink-100'}`}
                        >
                          <div className="flex items-center gap-3">
                            {parent.avatar ? (
                              <img src={parent.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold border border-slate-200">
                                {parent.username.substring(0,2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-sm">{parent.username}</div>
                              <div className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">{parent.childUsername} ({parent.childClass})</div>
                            </div>
                          </div>
                          {parent.unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">{parent.unreadCount}</span>}
                        </button>
                      ))
                    }
                  </div>
              </div>
              <div className={`md:col-span-8 ${selectedChat ? 'block' : 'hidden md:block'}`}>
                  {selectedChat ? (
                    <ChatComponent targetUserId={selectedChat.id} targetUserName={selectedChat.type === 'group' ? selectedChat.name : selectedChat.type === 'parent' ? `${selectedChat.name} ${selectedChat.sub}` : `${selectedChat.name} (${selectedChat.class})`} onBack={() => setSelectedChat(null)} />
                  ) : (
                    <div className="h-full flex items-center justify-center p-10 text-slate-400 font-medium italic glass-panel border border-dashed border-slate-200">
                      Suhbatni boshlash uchun chap tomondan tanlang
                    </div>
                  )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
