import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from '../context/TranslationContext';
import { BookOpen, CheckCircle2, Circle, Clock, Calendar, MessageSquare, User, Upload, Trophy, Megaphone, Users, Library, FileQuestion, Youtube, FileText, Link, Menu, X, Award, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatComponent from './ChatComponent';

const DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
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

const calculateStudentXP = (studentId, data) => {
  let xp = 0;
  data.tasks.forEach(t => {
     const sub = t.completedBy.find(c => c === studentId || c.studentId === studentId);
     if (sub) {
       if (typeof sub === 'string' || sub.approved || (sub.approved === undefined && !sub.rejected)) xp += 20;
     }
  });
  data.grades.forEach(g => {
     if (g.studentId === studentId && g.grade) xp += parseInt(g.grade) * 10;
  });
  return xp;
};

export default function StudentDashboard() {
  const { currentUser, users } = useAuth();
  const { data, toggleTask, submitQuiz } = useAppContext();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('tasks');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null); // { id: targetUserId, name: targetUserName, type: 'teacher' | 'group' }
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizTimeLeft, setQuizTimeLeft] = useState(0);
  const [showCertificate, setShowCertificate] = useState(false);
  const fileInputRef = useRef(null);

  const studentClass = currentUser.class;
  const classTasks = data.tasks.filter(t => t.className === studentClass);
  const classSchedule = data.schedule[studentClass] || {};
  const teachers = users.filter(u => u.role === 'teacher');
  const advisor = users.find(u => {
    if (u.role !== 'advisor') return false;
    const classes = u.advisorClasses || (u.class ? u.class.split(',').map(s=>s.trim()) : []);
    return classes.includes(studentClass);
  });
  const classmates = users.filter(u => u.role === 'student' && u.class === studentClass);

  const announcements = (data.announcements || []).filter(a => !a.targetClass || a.targetClass === studentClass);
  const classLibrary = (data.library || []).filter(l => !l.targetClass || l.targetClass === studentClass);
  const classQuizzes = (data.quizzes || []).filter(q => q.className === studentClass);

  const totalUnread = (data.messages || []).filter(m => m.receiverId === currentUser.id && !m.read).length;

  const handleTaskClick = (taskId, isDone, isRejected) => {
    if (isDone && !isRejected) {
      toggleTask(taskId, currentUser.id);
    } else {
      setSelectedTaskId(taskId);
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && selectedTaskId) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Fayl hajmi 2MB dan oshmasligi kerak (brauzer xotirasini tejash uchun)!");
        setSelectedTaskId(null);
        e.target.value = null;
        return;
      }
      
      let base64;
      if (file.type.startsWith('image/')) {
        base64 = await compressImage(file);
      } else {
        base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => resolve(event.target.result);
        });
      }
      
      const fileData = {
        data: base64,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'zip'
      };

      toggleTask(selectedTaskId, currentUser.id, fileData);
    }
    setSelectedTaskId(null);
    e.target.value = null; // reset
  };

  const handleQuizSubmit = (e) => {
    if (e) e.preventDefault();
    if (!activeQuiz) return;
    let score = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctIndex) score++;
    });
    submitQuiz(activeQuiz.id, currentUser.id, score);
    setActiveQuiz(null);
    setQuizAnswers({});
  };

  // Timer logic
  useEffect(() => {
    let timer;
    if (activeQuiz && quizTimeLeft > 0) {
      timer = setInterval(() => {
        setQuizTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (activeQuiz && quizTimeLeft === 0) {
      handleQuizSubmit();
    }
    return () => clearInterval(timer);
  }, [activeQuiz, quizTimeLeft]);

  // Anti-cheat logic
  useEffect(() => {
    const handleBlur = () => {
      if (activeQuiz) {
        alert("Siz test jarayonida sahifadan chiqdingiz! Qoida buzildi, test 0 ball bilan yakunlandi.");
        submitQuiz(activeQuiz.id, currentUser.id, 0);
        setActiveQuiz(null);
        setQuizAnswers({});
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [activeQuiz, currentUser.id, submitQuiz]);

  const getQuizResult = (quizId) => {
    return (data.quizResults || []).find(r => r.quizId === quizId && r.studentId === currentUser.id);
  };

  // Leaderboard data
  const leaderboard = classmates.map(s => ({
    ...s,
    xp: calculateStudentXP(s.id, data)
  })).sort((a,b) => b.xp - a.xp);

  const myRank = leaderboard.findIndex(s => s.id === currentUser.id) + 1;
  const myXp = calculateStudentXP(currentUser.id, data);

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-2 pb-10">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">{t('welcome')}, {currentUser.username}!</h1>
          <p className="text-slate-500 mt-1 font-medium">{studentClass} - sinf o'quvchisi paneli</p>
        </div>
        
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-3 rounded-xl shadow-lg shadow-orange-500/30 text-white flex items-center gap-4 px-6 border-2 border-white/20">
          <Trophy size={28} className="text-yellow-200" />
          <div>
            <div className="text-xs font-bold text-orange-100 uppercase tracking-wider">Sinfdagi O'rningiz</div>
            <div className="text-xl font-black">#{myRank} <span className="text-sm font-medium opacity-80">({myXp} XP)</span></div>
          </div>
        </div>
      </header>

      {/* Hidden file input */}
      <input type="file" accept="image/*,.pdf,.zip,application/pdf,application/zip" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* Burger Menu for Tabs */}
      <div className="relative z-[60] mb-4">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          Asosiy Menyu
        </button>
        
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-14 left-0 z-[100] w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl p-2.5 flex flex-col gap-1.5"
            >
              <button onClick={() => {setActiveTab('tasks'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 ${activeTab === 'tasks' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:translate-x-1'}`}>
                <BookOpen size={20}/> {t('tasks')}
              </button>
              <button onClick={() => {setActiveTab('schedule'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 ${activeTab === 'schedule' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:translate-x-1'}`}>
                <Calendar size={20}/> {t('schedule')}
              </button>
              <button onClick={() => {setActiveTab('library'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 ${activeTab === 'library' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:translate-x-1'}`}>
                <Library size={20}/> {t('library')}
              </button>
              <button onClick={() => {setActiveTab('tests'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 ${activeTab === 'tests' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:translate-x-1'}`}>
                <FileQuestion size={20}/> {t('tests')}
              </button>
              <button onClick={() => {setActiveTab('chat'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 justify-between ${activeTab === 'chat' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:translate-x-1'}`}>
                <div className="flex items-center gap-3"><MessageSquare size={20}/> {t('chat')}</div>
                {totalUnread > 0 && <span className="bg-red-500 text-white text-[11px] px-2.5 py-0.5 rounded-full shadow-md">{totalUnread}</span>}
              </button>
              <button onClick={() => {setActiveTab('leaderboard'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 ${activeTab === 'leaderboard' ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-md' : 'text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:translate-x-1'}`}>
                <Trophy size={20}/> {t('leaderboard')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'tasks' && (
          <motion.div key="tasks" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-4 mt-4">
            
            {announcements.length > 0 && (
              <div className="mb-6 space-y-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Megaphone size={18} className="text-indigo-500" /> Yangi e'lonlar</h3>
                {announcements.slice(0,3).map(a => (
                  <div key={a.id} className="glass-panel p-4 border-l-4 border-l-indigo-500 bg-indigo-50/30">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-xs text-indigo-600">{a.author}</span>
                    </div>
                    <p className="text-slate-700 font-medium text-sm">{a.text}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-4">
              {classTasks.length === 0 ? (
                <div className="text-center py-16 text-slate-400 glass-panel border border-dashed border-slate-300">
                  <CheckCircle2 size={48} className="mx-auto mb-3 text-slate-300 opacity-50" />
                  <p className="font-semibold text-lg">Sinfingiz uchun vazifalar yo'q! 🎉</p>
                </div>
              ) : (
                classTasks.sort((a,b)=>new Date(a.deadline)-new Date(b.deadline)).map(t => {
                  const submission = t.completedBy.find(c => c === currentUser.id || c.studentId === currentUser.id);
                  const isDone = !!submission;
                  const isApproved = submission && submission.approved;
                  const isRejected = submission && submission.rejected;
                  const isLate = new Date(t.deadline) < new Date(new Date().setHours(0,0,0,0)) && !isDone;

                  return (
                    <motion.div 
                      layout
                      key={t.id} 
                      className={`glass-panel p-5 flex gap-4 transition-all duration-300 relative overflow-hidden group ${isApproved ? 'opacity-80 bg-green-50/50 border-t-2 border-t-green-400' : isRejected ? 'bg-red-50/50 border-t-2 border-t-red-400' : isDone ? 'opacity-80 bg-slate-50/50 border-t-2 border-t-blue-400' : 'hover:shadow-md border-t-2 border-t-blue-400'}`}
                    >
                      <div className="flex flex-col items-center gap-2 mt-1">
                        <button 
                          onClick={() => handleTaskClick(t.id, isDone, isRejected)} 
                          className={`flex-shrink-0 transition-transform hover:scale-110 focus:outline-none ${isApproved ? 'text-green-500' : isRejected ? 'text-red-500' : isDone ? 'text-blue-500' : 'text-slate-300 hover:text-blue-500'}`}
                          title={isApproved ? "Qabul qilingan" : isRejected ? "Qaytadan ishlash (Rad etilgan)" : isDone ? "Bekor qilish" : "Fayl/Rasm yuklash va bajarish"}
                        >
                          {isApproved ? <CheckCircle2 size={28} strokeWidth={2.5} /> : isRejected ? <X size={28} strokeWidth={2.5} /> : isDone ? <CheckCircle2 size={28} strokeWidth={2.5} /> : <Circle size={28} strokeWidth={2.5} />}
                        </button>
                        {!isDone && !isRejected && <Upload size={14} className="text-slate-300" />}
                      </div>
                      
                      <div className="flex-1 pt-0.5">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{t.subject}</span>
                        
                        <p className={`font-bold mt-2 text-[17px] leading-snug ${isApproved ? 'line-through text-slate-500' : isRejected ? 'text-red-800' : isDone ? 'text-slate-600' : 'text-slate-800'}`}>
                          {t.task}
                        </p>
                        
                        <div className={`flex items-center gap-1.5 mt-3 text-xs font-bold ${isApproved ? 'text-green-500' : isRejected ? 'text-red-500' : isDone ? 'text-blue-500' : isLate ? 'text-red-500 bg-red-50 w-full px-2 py-1 rounded-md' : 'text-amber-500'}`}>
                          <Clock size={13} strokeWidth={2.5} />
                          <span>{t.deadline} {isLate ? '(Muddati o\'tgan)' : ''}</span>
                          {isRejected && <span className="ml-2 bg-red-100 px-2 py-0.5 rounded-md">Rad etildi. Qayta ishlang!</span>}
                          {isApproved && <span className="ml-2 bg-green-100 px-2 py-0.5 rounded-md">Tasdiqlandi (+20 XP)</span>}
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
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
                        <li key={idx} className="flex gap-4 text-sm items-center p-2.5 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 group transition-colors">
                          <span className="font-black text-slate-300 group-hover:text-indigo-300 transition-colors w-5 text-right font-mono text-[16px]">{idx+1}</span>
                          <span className="text-slate-800 font-bold group-hover:text-indigo-700 transition-colors">{subj}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
             ))}
          </motion.div>
        )}

        {activeTab === 'library' && (
          <motion.div key="library" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="grid gap-4 mt-4">
            {classLibrary.length === 0 ? (
              <div className="text-center py-16 text-slate-400 glass-panel">Kutubxonaga materiallar qo'shilmagan.</div>
            ) : (
              classLibrary.map(item => (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="glass-panel p-4 flex items-center gap-4 hover:border-indigo-300 transition-all group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${item.type === 'youtube' ? 'bg-red-500' : item.type === 'pdf' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                    {item.type === 'youtube' ? <Youtube /> : item.type === 'pdf' ? <FileText /> : <Link />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                    <div className="flex gap-2 items-center mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md">{item.subject}</span>
                      <span>• {item.addedBy}</span>
                    </div>
                  </div>
                </a>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'tests' && (
          <motion.div key="tests" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="mt-4">
            {!activeQuiz ? (
              <div className="grid gap-4">
                {classQuizzes.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 glass-panel">Hozircha testlar yo'q.</div>
                ) : (
                  classQuizzes.map(quiz => {
                    const result = getQuizResult(quiz.id);
                    return (
                      <div key={quiz.id} className="glass-panel p-5 flex justify-between items-center">
                        <div>
                          <span className="text-[11px] font-black text-indigo-500 uppercase bg-indigo-50 px-2 py-0.5 rounded-md">{quiz.subject}</span>
                          <h3 className="font-bold text-slate-800 text-lg mt-1">{quiz.title}</h3>
                          <p className="text-sm text-slate-500 font-medium mt-1">{quiz.questions.length} ta savol</p>
                        </div>
                        {result ? (
                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-400 uppercase">Natija</div>
                            <div className="text-2xl font-black text-green-500">{result.score} / {quiz.questions.length}</div>
                          </div>
                        ) : (
                          <button onClick={() => {setActiveQuiz(quiz); setQuizTimeLeft(quiz.questions.length * 60);}} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md shadow-indigo-500/30 hover:bg-indigo-700 transition-colors">
                            Boshlash
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="glass-panel p-6 border-t-4 border-t-indigo-500">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex justify-between items-center">
                  <span>{activeQuiz.title}</span>
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-black flex items-center gap-1 ${quizTimeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                      <Clock size={20} />
                      {Math.floor(quizTimeLeft / 60).toString().padStart(2, '0')}:{ (quizTimeLeft % 60).toString().padStart(2, '0') }
                    </span>
                    <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">{activeQuiz.subject}</span>
                  </div>
                </h2>
                <form onSubmit={handleQuizSubmit} className="space-y-6">
                  {activeQuiz.questions.map((q, qIdx) => (
                    <div key={qIdx} className="space-y-3">
                      <p className="font-bold text-slate-800">{qIdx + 1}. {q.question}</p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => (
                          <label key={optIdx} className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${quizAnswers[qIdx] === optIdx ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-bold' : 'border-slate-200 bg-slate-50 hover:border-indigo-200'}`}>
                            <input 
                              type="radio" 
                              name={`question-${qIdx}`} 
                              checked={quizAnswers[qIdx] === optIdx} 
                              onChange={() => setQuizAnswers(prev => ({...prev, [qIdx]: optIdx}))}
                              className="w-4 h-4 text-indigo-600"
                              required
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => {setActiveQuiz(null); setQuizAnswers({});}} className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                      Bekor qilish
                    </button>
                    <button type="submit" className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors">
                      Testni Yakunlash
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'chat' && (
          <motion.div key="chat" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="grid md:grid-cols-12 gap-6 mt-4">
             <div className={`md:col-span-4 glass-panel p-4 h-max ${selectedChat ? 'hidden md:block' : 'block'}`}>
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={18} className="text-indigo-500"/> Guruh va Ustozlar</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => setSelectedChat({ id: `GROUP_${studentClass}`, name: studentClass, type: 'group' })}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center ${selectedChat?.id === `GROUP_${studentClass}` ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-100 hover:border-indigo-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                        <Users size={20} />
                      </div>
                      <div className="font-bold text-sm">Sinf Guruhi ({studentClass})</div>
                    </div>
                    {(() => {
                      const msgCount = (data.messages || []).filter(m => m.receiverId === `GROUP_${studentClass}` && !(m.readBy || [m.senderId]).includes(currentUser.id)).length;
                      return msgCount > 0 ? (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                          {msgCount}
                        </span>
                      ) : null;
                    })()}
                  </button>

                  <div className="my-4 border-t border-slate-100"></div>

                  {advisor && (() => {
                    const unreadCount = (data.messages || []).filter(m => m.senderId === advisor.id && m.receiverId === currentUser.id && !m.read).length;
                    return (
                      <button 
                        onClick={() => setSelectedChat({ id: advisor.id, name: advisor.username, subject: 'Sinf rahbari', type: 'advisor' })}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center mb-2 ${selectedChat?.id === advisor.id ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-50 border-slate-100 hover:border-purple-100'}`}
                      >
                        <div className="flex items-center gap-3">
                          {advisor.avatar ? (
                            <img src={advisor.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 font-bold border border-slate-200">
                              {advisor.username.substring(0,2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-sm">{advisor.username}</div>
                            <div className="text-[11px] font-bold text-slate-400 uppercase mt-1">Sinf rahbari</div>
                          </div>
                        </div>
                        {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">{unreadCount}</span>}
                      </button>
                    )
                  })()}

                  {teachers.map(teacher => {
                    const unreadCount = (data.messages || []).filter(m => m.senderId === teacher.id && m.receiverId === currentUser.id && !m.read).length;
                    return (
                      <button 
                        key={teacher.id}
                        onClick={() => setSelectedChat({ id: teacher.id, name: teacher.username, subject: teacher.subject, type: 'teacher' })}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center ${selectedChat?.id === teacher.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-100 hover:border-indigo-100'}`}
                      >
                        <div className="flex items-center gap-3">
                          {teacher.avatar ? (
                            <img src={teacher.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold border border-slate-200">
                              {teacher.username.substring(0,2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-sm">{teacher.username}</div>
                            <div className="text-[11px] font-bold text-slate-400 uppercase mt-1">{teacher.subject}</div>
                          </div>
                        </div>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
             </div>
             <div className={`md:col-span-8 ${selectedChat ? 'block' : 'hidden md:block'}`}>
                {selectedChat ? (
                  <ChatComponent targetUserId={selectedChat.id} targetUserName={selectedChat.type === 'group' ? selectedChat.name : `${selectedChat.name} (${selectedChat.subject})`} onBack={() => setSelectedChat(null)} />
                ) : (
                  <div className="h-full flex items-center justify-center p-10 text-slate-400 font-medium italic glass-panel border border-dashed border-slate-200">
                    Suhbatni boshlash uchun chap tomondan tanlang
                  </div>
                )}
             </div>
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div key="leaderboard" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="glass-panel p-6 mt-4 max-w-2xl mx-auto">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-2 flex items-center justify-center gap-3">
              <Trophy className="text-orange-500" size={32} /> Reyting (Sinf bo'yicha)
            </h2>
            <p className="text-center text-slate-500 font-medium mb-6">Uy vazifasi: +20 XP, A'lo baho (5): +50 XP</p>
            
            {myRank === 1 && myXp > 0 && (
              <div className="bg-gradient-to-r from-amber-200 to-yellow-400 p-4 rounded-xl flex items-center justify-between mb-8 shadow-md">
                <div className="flex items-center gap-3 text-amber-900">
                  <Award size={32} />
                  <div>
                    <div className="font-black">Tabriklaymiz, siz 1-o'rindasiz!</div>
                    <div className="text-sm font-medium">Faxriy yorlig'ingizni ko'rish uchun bosing</div>
                  </div>
                </div>
                <button onClick={() => setShowCertificate(true)} className="bg-white text-amber-600 font-bold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow">Yorliqni Ko'rish</button>
              </div>
            )}

            <div className="space-y-3">
              {leaderboard.map((student, idx) => (
                <div key={student.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${student.id === currentUser.id ? 'bg-orange-50/50 border-orange-200 shadow-sm' : 'bg-slate-50 border-transparent hover:border-slate-100'}`}>
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

                  <div className="flex-1">
                    <div className="font-bold text-slate-800">{student.username}</div>
                  </div>
                  <div className="font-black text-orange-500 text-xl">{student.xp} <span className="text-xs text-orange-300">XP</span></div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Certificate Modal */}
      <AnimatePresence>
        {showCertificate && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 print-section"
            onClick={() => setShowCertificate(false)}
          >
            <div className="relative max-w-3xl w-full bg-white p-10 md:p-16 rounded-2xl shadow-2xl border-[12px] border-double border-amber-300 text-center" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowCertificate(false)} className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors print:hidden">
                <X size={24} />
              </button>
              
              <div className="text-amber-500 mb-6 flex justify-center"><Award size={80} strokeWidth={1} /></div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-800 uppercase tracking-widest mb-2 font-serif">Faxriy Yorliq</h1>
              <p className="text-lg text-slate-500 font-medium italic mb-10">Maktab ma'muriyati tomonidan taqdim etildi</p>
              
              <div className="text-2xl font-medium text-slate-600 mb-4">Ushbu yorliq</div>
              <div className="text-4xl font-black text-indigo-600 mb-4 border-b-2 border-indigo-200 pb-2 inline-block px-10">{currentUser.username}</div>
              <div className="text-xl text-slate-600 font-medium leading-relaxed max-w-xl mx-auto mb-12">
                ga {studentClass} sinfi o'quvchilari orasida qisqa vaqt ichida eng yuqori natijani ({myXp} XP) qayd etib, mutlaq peshqadam bo'lganligi uchun minnatdorchilik sifatida berildi.
              </div>
              
              <div className="flex justify-between items-end mt-16 px-10">
                <div className="text-center">
                  <div className="w-40 border-b-2 border-slate-800 mb-2"></div>
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Direktor</div>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b-2 border-slate-800 mb-2"></div>
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Sana: {new Date().toLocaleDateString('ru-RU')}</div>
                </div>
              </div>

              <button onClick={() => window.print()} className="absolute bottom-4 right-4 bg-slate-100 p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors print:hidden">
                <Printer size={20}/>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
