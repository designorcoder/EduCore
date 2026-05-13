import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from '../context/TranslationContext';
import { Users, Trash2, Plus, Calendar, MessageSquare, User, Image as ImageIcon, X, Megaphone, BarChart2, Library, FileQuestion, MapPin, Menu, BookOpen, Check, XCircle, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatComponent from './ChatComponent';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function TeacherDashboard() {
  const { users, currentUser } = useAuth();
  const { data, addTask, deleteTask, markAttendance, addGrade, addAnnouncement, addLibraryItem, addQuiz, addEvent, approveTask } = useAppContext();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('attendance'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [viewImage, setViewImage] = useState(null);

  const [newTask, setNewTask] = useState('');
  const [deadline, setDeadline] = useState('');
  const [announcementText, setAnnouncementText] = useState('');

  const [libTitle, setLibTitle] = useState('');
  const [libUrl, setLibUrl] = useState('');
  const [libType, setLibType] = useState('link');

  const [quizTitle, setQuizTitle] = useState('');
  const [quizQ, setQuizQ] = useState('');
  const [quizOpts, setQuizOpts] = useState(['', '', '', '']);
  const [quizCorr, setQuizCorr] = useState(0);
  const [pendingQuestions, setPendingQuestions] = useState([]);

  const students = users.filter(u => u.role === 'student');
  const availableClasses = [...new Set(students.map(s => s.class))].filter(Boolean);
  const classStudents = students.filter(s => s.class === selectedClass);
  const classTasks = data.tasks.filter(t => t.className === selectedClass && t.subject === currentUser.subject);

  const handleTaskAdd = (e) => {
    e.preventDefault();
    if (selectedClass && newTask && deadline) {
      addTask(selectedClass, currentUser.subject, newTask, deadline);
      setNewTask('');
      setDeadline('');
    }
  };

  const handleAnnouncementAdd = (e) => {
    e.preventDefault();
    if (selectedClass && announcementText) {
      addAnnouncement(announcementText, `Ustoz: ${currentUser.username} (${currentUser.subject})`, selectedClass);
      setAnnouncementText('');
    }
  };

  const handleLibAdd = (e) => {
    e.preventDefault();
    if (libTitle && libUrl) {
      addLibraryItem(libTitle, libType, libUrl, currentUser.subject, currentUser.username);
      setLibTitle('');
      setLibUrl('');
    }
  };

  const addQuizQuestion = () => {
    if (quizQ && quizOpts.every(o => o.trim() !== '')) {
      setPendingQuestions([...pendingQuestions, { question: quizQ, options: quizOpts, correctIndex: Number(quizCorr) }]);
      setQuizQ('');
      setQuizOpts(['', '', '', '']);
    }
  };

  const handleQuizPublish = () => {
    if (quizTitle && pendingQuestions.length > 0 && selectedClass) {
      addQuiz(currentUser.subject, selectedClass, quizTitle, pendingQuestions);
      setQuizTitle('');
      setPendingQuestions([]);
    }
  };

  const getAttendance = (studentId) => {
    const record = data.attendance.find(a => a.date === date && a.studentId === studentId);
    return record ? record.isPresent : true;
  };

  const getGrade = (studentId) => {
    const record = data.grades.find(g => g.date === date && g.studentId === studentId && g.subject === currentUser.subject);
    return record ? record.grade : '';
  };

  const totalUnread = (data.messages || []).filter(m => m.receiverId === currentUser.id && !m.read).length;

  const chartData = classStudents.map(s => {
    const sGrades = data.grades.filter(g => g.studentId === s.id && g.subject === currentUser.subject && g.grade);
    const avg = sGrades.length ? (sGrades.reduce((acc, curr) => acc + Number(curr.grade), 0) / sGrades.length).toFixed(1) : 0;
    return { name: s.username.split(' ')[0], "O'rtacha Baho": Number(avg) };
  });

  const getUniqueDates = () => {
    const dates = new Set();
    data.attendance.filter(a => classStudents.some(s => s.id === a.studentId)).forEach(a => dates.add(a.date));
    data.grades.filter(g => g.subject === currentUser.subject && classStudents.some(s => s.id === g.studentId)).forEach(g => dates.add(g.date));
    return Array.from(dates).sort((a,b) => new Date(a) - new Date(b));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto mt-2 pb-10">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">{t('role_teacher')}: {currentUser.subject}</h1>
        <p className="text-slate-500 mt-1 font-medium">{t('welcome')}, {currentUser.username}!</p>
      </header>

      <div className="glass-panel relative z-[60] p-4 flex flex-wrap gap-4 items-center justify-between border-t-4 border-t-amber-400">
        <div className="flex gap-4 items-center flex-1">
          <select 
            value={selectedClass} 
            onChange={e => {setSelectedClass(e.target.value); setSelectedChat(null);}}
            className="bg-slate-50 border-2 border-slate-200 p-2.5 rounded-xl outline-none focus:border-amber-400 font-semibold text-slate-700 min-w-[150px]"
          >
            <option value="" disabled>Sinfni tanlang...</option>
            {availableClasses.map(c => <option key={c} value={c}>{c} - sinf</option>)}
          </select>

          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)}
            className="bg-slate-50 border-2 border-slate-200 p-2.5 rounded-xl outline-none focus:border-amber-400 font-semibold text-slate-700"
          />
        </div>

        <div className="relative">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-colors">
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
              <button onClick={() => {setActiveTab('attendance'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 ${activeTab === 'attendance' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 hover:translate-x-1'}`}>{t('attendance')}</button>
              <button onClick={() => {setActiveTab('journal'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 ${activeTab === 'journal' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 hover:translate-x-1'}`}><BookOpen size={20} /> {t('journal')}</button>
              <button onClick={() => {setActiveTab('tasks'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 ${activeTab === 'tasks' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 hover:translate-x-1'}`}>{t('tasks')}</button>
              <button onClick={() => {setActiveTab('quizzes'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 ${activeTab === 'quizzes' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 hover:translate-x-1'}`}><FileQuestion size={20} /> {t('tests')}</button>
              <button onClick={() => {setActiveTab('library'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 ${activeTab === 'library' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 hover:translate-x-1'}`}><Library size={20} /> {t('library')}</button>
              <button onClick={() => {setActiveTab('announcements'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 ${activeTab === 'announcements' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 hover:translate-x-1'}`}><Megaphone size={20} /> {t('announcements')}</button>
              <button onClick={() => {setActiveTab('analytics'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 ${activeTab === 'analytics' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 hover:translate-x-1'}`}><BarChart2 size={20} /> {t('analytics')}</button>
              <button onClick={() => {setActiveTab('chat'); setIsMenuOpen(false);}} className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all flex items-center gap-3 justify-between ${activeTab === 'chat' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 hover:translate-x-1'}`}>
                <div className="flex items-center gap-3"><MessageSquare size={20}/> {t('chat')}</div>
                {totalUnread > 0 && <span className="bg-red-500 text-white text-[11px] px-2.5 py-0.5 rounded-full shadow-md">{totalUnread}</span>}
              </button>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>

      {(!selectedClass && activeTab !== 'chat') ? (
        <div className="text-center py-16 text-slate-400 glass-panel border border-dashed border-slate-300">
          <Users size={48} className="mx-auto mb-3 text-slate-300 opacity-50" />
          <p className="font-semibold text-lg">Iltimos, yuqoridan sinfni tanlang</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'attendance' && (
            <motion.div key="attendance" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="glass-panel overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-12 gap-4 font-bold text-slate-500 text-xs uppercase tracking-wider">
                <div className="col-span-6 md:col-span-4">O'quvchi</div>
                <div className="col-span-6 md:col-span-4 text-center">Davomat</div>
                <div className="col-span-12 md:col-span-4 text-right md:text-center mt-2 md:mt-0">Baho</div>
              </div>
              
              <div className="divide-y divide-slate-100">
                {classStudents.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-medium">Bu sinfda o'quvchilar yo'q.</div>
                ) : (
                  classStudents.map(student => {
                    const isPresent = getAttendance(student.id);
                    const currentGrade = getGrade(student.id);

                    return (
                      <div key={student.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50/50 transition-colors">
                        <div className="col-span-6 md:col-span-4 font-bold text-slate-800 flex items-center gap-2">
                          {student.avatar ? (
                            <img src={student.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 border border-slate-200">
                              {student.username.substring(0,2).toUpperCase()}
                            </div>
                          )}
                          {student.username}
                        </div>
                        
                        <div className="col-span-6 md:col-span-4 flex justify-center gap-2">
                          <button onClick={() => markAttendance(date, selectedClass, student.id, true)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isPresent ? 'bg-green-100 text-green-700 ring-2 ring-green-400' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>Keldi</button>
                          <button onClick={() => markAttendance(date, selectedClass, student.id, false)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!isPresent ? 'bg-red-100 text-red-700 ring-2 ring-red-400' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>Yo'q</button>
                        </div>
                        
                        <div className="col-span-12 md:col-span-4 flex justify-end md:justify-center">
                          <select value={currentGrade} onChange={e => addGrade(date, selectedClass, currentUser.subject, student.id, e.target.value)} className="bg-white border-2 border-slate-200 p-1.5 rounded-lg outline-none focus:border-amber-400 font-bold text-slate-700 w-20 text-center">
                            <option value="">-</option>
                            <option value="5">5 (A'lo)</option>
                            <option value="4">4 (Yaxshi)</option>
                            <option value="3">3 (Qoniqarli)</option>
                            <option value="2">2 (Yomon)</option>
                          </select>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'journal' && (
            <motion.div key="journal" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="glass-panel p-6 overflow-x-auto">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <BookOpen size={22} className="text-amber-500" /> Elektron Jurnal ({selectedClass})
                </h2>
                
                {classStudents.length === 0 || getUniqueDates().length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-medium">Bu sinfda hozircha davomat yoki baholar kiritilmagan.</div>
                ) : (
                  <div className="min-w-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-3 border-r border-slate-200 w-10 text-center">#</th>
                          <th className="p-3 border-r border-slate-200 w-48">O'quvchi ismi</th>
                          {getUniqueDates().map(d => (
                            <th key={d} className="p-3 border-r border-slate-200 w-16 text-center whitespace-nowrap">
                              {new Date(d).toLocaleDateString('ru-RU', {day:'numeric', month:'numeric'})}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {classStudents.map((student, i) => (
                          <tr key={student.id}>
                            <td className="p-3 border-r border-slate-200 text-center font-bold text-slate-400">{i+1}</td>
                            <td className="p-3 border-r border-slate-200 font-bold text-slate-800">{student.username}</td>
                            {getUniqueDates().map(d => {
                              const attendance = data.attendance.find(a => a.date === d && a.studentId === student.id);
                              const isPresent = attendance ? attendance.isPresent : true;
                              const grade = data.grades.find(g => g.date === d && g.studentId === student.id && g.subject === currentUser.subject)?.grade;

                              return (
                                <td key={d} className={`p-3 border-r border-slate-200 text-center relative font-black ${!isPresent ? 'bg-red-50' : ''}`}>
                                  {!isPresent ? <span className="text-red-500">yo'q</span> : (
                                    grade ? <span className={grade === '5' ? 'text-green-500' : grade === '4' ? 'text-blue-500' : 'text-amber-500'}>{grade}</span> : <span className="text-slate-300">-</span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <motion.div key="tasks" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6">
              
              <form onSubmit={handleTaskAdd} className="glass-panel p-5 border-t-4 border-t-amber-500 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Yangi Vazifa</label>
                  <input required type="text" value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="Masalan: 4-mavzuni o'qish" className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-amber-400 text-[15px] font-semibold text-slate-700 transition-all"/>
                </div>
                <div className="w-full md:w-auto space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Muddat</label>
                  <input required type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-amber-400 text-[15px] font-semibold text-slate-700 transition-all"/>
                </div>
                <button type="submit" className="w-full md:w-auto px-6 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-colors flex items-center justify-center gap-2">
                  <Plus size={18} /> Qo'shish
                </button>
              </form>

              <div className="grid gap-3">
                {classTasks.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-medium">Bu sinfga vazifalar berilmagan.</div>
                ) : (
                  classTasks.sort((a,b)=>new Date(b.deadline)-new Date(a.deadline)).map(t => {
                    const doneCount = t.completedBy.length;
                    const totalStudents = classStudents.length;
                    const percent = totalStudents ? Math.round((doneCount / totalStudents) * 100) : 0;
                    
                    return (
                      <div key={t.id} className="glass-panel p-5 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-800 text-lg">{t.task}</p>
                            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 font-medium">
                              <Calendar size={14} className="text-amber-500" /> Muddat: {t.deadline}
                            </div>
                          </div>
                          <button onClick={() => deleteTask(t.id)} className="text-slate-300 hover:text-red-500 p-2 rounded-lg transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                        
                        <div className="mt-2 bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <div className="flex flex-wrap gap-2">
                            {classStudents.map(s => {
                              const submission = t.completedBy.find(c => c === s.id || c.studentId === s.id);
                              const isDone = !!submission;
                              const hasImage = submission && submission.image;
                              const fileData = submission && submission.fileData;
                              const isApproved = submission && submission.approved;
                              const isRejected = submission && submission.rejected;

                              return (
                                <div key={s.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shadow-sm ${isApproved ? 'bg-green-50 text-green-700 border-green-200' : isRejected ? 'bg-red-50 text-red-700 border-red-200' : isDone ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-400 border-transparent'}`}>
                                  <span className="text-[13px] font-bold">{s.username}</span>
                                  {fileData && fileData.type === 'image' && (
                                    <button 
                                      onClick={() => setViewImage(fileData.data)} 
                                      className="p-1 bg-white rounded shadow-sm text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors ml-1"
                                      title="Rasmni ko'rish"
                                    >
                                      <ImageIcon size={14} strokeWidth={2.5}/>
                                    </button>
                                  )}
                                  {hasImage && !fileData && (
                                    <button 
                                      onClick={() => setViewImage(submission.image)} 
                                      className="p-1 bg-white rounded shadow-sm text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors ml-1"
                                      title="Rasmni ko'rish"
                                    >
                                      <ImageIcon size={14} strokeWidth={2.5}/>
                                    </button>
                                  )}
                                  {fileData && fileData.type !== 'image' && (
                                    <a 
                                      href={fileData.data} 
                                      download={fileData.name}
                                      className="p-1 bg-white rounded shadow-sm text-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-colors ml-1 inline-flex"
                                      title={`Faylni yuklab olish (${fileData.name})`}
                                    >
                                      <FileDown size={14} strokeWidth={2.5}/>
                                    </a>
                                  )}
                                  {isDone && !isApproved && !isRejected && (
                                    <div className="flex gap-1 ml-2">
                                      <button onClick={() => approveTask(t.id, s.id, true)} className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition shadow-sm" title="Qabul qilish">
                                        <Check size={14} />
                                      </button>
                                      <button onClick={() => approveTask(t.id, s.id, false)} className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition shadow-sm" title="Rad etish">
                                        <XCircle size={14} />
                                      </button>
                                    </div>
                                  )}
                                  {isApproved && (
                                    <span className="text-[10px] bg-green-200 text-green-800 px-1.5 rounded ml-1 font-bold">Qabul qilingan</span>
                                  )}
                                  {isRejected && (
                                    <span className="text-[10px] bg-red-200 text-red-800 px-1.5 rounded ml-1 font-bold">Rad etilgan</span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'quizzes' && (
            <motion.div key="quizzes" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6">
              <div className="glass-panel p-6 border-t-4 border-t-indigo-500">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileQuestion size={22} className="text-indigo-500" /> Yangi Test Yaratish ({selectedClass})
                </h2>
                
                <div className="space-y-4">
                  <input type="text" value={quizTitle} onChange={e=>setQuizTitle(e.target.value)} placeholder="Test mavzusi (masalan: 1-chorak takrorlash)" className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-400 font-semibold" />
                  
                  <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-3">
                    <input type="text" value={quizQ} onChange={e=>setQuizQ(e.target.value)} placeholder="Savolni kiriting..." className="w-full bg-white border border-slate-200 p-2 rounded-lg outline-none focus:border-indigo-400" />
                    <div className="grid grid-cols-2 gap-2">
                      {quizOpts.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input type="radio" name="corr" checked={quizCorr===i} onChange={()=>setQuizCorr(i)} className="w-4 h-4 text-indigo-600" />
                          <input type="text" value={opt} onChange={e=>{const n=[...quizOpts]; n[i]=e.target.value; setQuizOpts(n);}} placeholder={`Variant ${i+1}`} className="flex-1 bg-white border border-slate-200 p-2 rounded-lg outline-none focus:border-indigo-400" />
                        </div>
                      ))}
                    </div>
                    <button onClick={addQuizQuestion} className="w-full py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300">Savolni qo'shish</button>
                  </div>

                  {pendingQuestions.length > 0 && (
                    <div className="space-y-2">
                      {pendingQuestions.map((q, i) => (
                        <div key={i} className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-800">
                          <strong>{i+1}. {q.question}</strong> ({q.options[q.correctIndex]})
                        </div>
                      ))}
                      <button onClick={handleQuizPublish} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700">Testni {selectedClass} ga yuborish</button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div key="library" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6">
              <form onSubmit={handleLibAdd} className="glass-panel p-6 border-t-4 border-t-blue-500">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Library size={22} className="text-blue-500" /> Kutubxonaga material qo'shish
                </h2>
                <div className="space-y-4">
                  <input required type="text" value={libTitle} onChange={e=>setLibTitle(e.target.value)} placeholder="Material nomi" className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-400 font-semibold text-slate-700"/>
                  <div className="flex gap-4">
                    <select value={libType} onChange={e=>setLibType(e.target.value)} className="bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-400 font-semibold text-slate-700">
                      <option value="link">Havola (Link)</option>
                      <option value="pdf">PDF</option>
                      <option value="youtube">YouTube</option>
                    </select>
                    <input required type="url" value={libUrl} onChange={e=>setLibUrl(e.target.value)} placeholder="URL (silka)" className="flex-1 bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-400 font-semibold text-slate-700"/>
                  </div>
                  <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700">Materialni yuklash</button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'announcements' && (
            <motion.div key="announcements" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="mt-4 glass-panel p-6 border-t-4 border-t-indigo-500">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Megaphone size={22} className="text-indigo-500" /> {selectedClass} sinfi uchun e'lon berish
              </h2>
              <form onSubmit={handleAnnouncementAdd} className="space-y-4 max-w-2xl">
                <textarea 
                  required 
                  value={announcementText} 
                  onChange={e => setAnnouncementText(e.target.value)} 
                  rows="4" 
                  placeholder="E'lon matnini kiriting..." 
                  className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-xl outline-none focus:border-indigo-400 text-[15px] font-semibold text-slate-700 transition-all resize-none"
                ></textarea>
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors">
                  E'lonni yuborish
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div key="analytics" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="mt-4 glass-panel p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <BarChart2 size={22} className="text-indigo-500" /> {selectedClass} o'zlashtirish grafikasi
              </h2>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 5]} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Bar dataKey="O'rtacha Baho" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="grid md:grid-cols-12 gap-6 mt-4">
              <div className={`md:col-span-4 glass-panel p-4 h-max ${selectedChat ? 'hidden md:block' : 'block'}`}>
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={18} className="text-indigo-500"/> Guruh va O'quvchilar</h3>
                  <div className="space-y-2 h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {selectedClass && (
                      <button 
                        onClick={() => setSelectedChat({ id: `GROUP_${selectedClass}`, name: selectedClass, type: 'group' })}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center ${selectedChat?.id === `GROUP_${selectedClass}` ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-100 hover:border-amber-100'}`}
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

                    {students
                      .filter(s => availableClasses.includes(s.class))
                      .map(student => {
                        const unreadCount = (data.messages || []).filter(m => m.senderId === student.id && m.receiverId === currentUser.id && !m.read).length;
                        return { ...student, unreadCount };
                      })
                      .sort((a, b) => b.unreadCount - a.unreadCount)
                      .map(student => (
                        <button 
                          key={student.id}
                          onClick={() => setSelectedChat({ id: student.id, name: student.username, class: student.class, type: 'student' })}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center ${selectedChat?.id === student.id ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-100 hover:border-amber-100'}`}
                        >
                          <div className="flex items-center gap-3">
                            {student.avatar ? (
                              <img src={student.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 font-bold border border-slate-200">
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
                  </div>
              </div>
              <div className={`md:col-span-8 ${selectedChat ? 'block' : 'hidden md:block'}`}>
                  {selectedChat ? (
                    <ChatComponent targetUserId={selectedChat.id} targetUserName={selectedChat.type === 'group' ? selectedChat.name : `${selectedChat.name} (${selectedChat.class})`} onBack={() => setSelectedChat(null)} />
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

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {viewImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
              <button onClick={() => setViewImage(null)} className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
              </button>
              <img src={viewImage} alt="Vazifa rasmi" className="w-full h-full object-contain rounded-xl shadow-2xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
