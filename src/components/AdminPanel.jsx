import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { UserPlus, Trash2, Shield, Users, Calendar, Megaphone, Database, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminScheduleView from './AdminScheduleView';
import { useTranslation } from '../context/TranslationContext';

export default function AdminPanel() {
  const { users, createUser, deleteUser, currentUser } = useAuth();
  const { data, addAnnouncement, deleteAnnouncement } = useAppContext();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('users'); // users | schedule | announcements
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [message, setMessage] = useState('');
  
  const [extraData, setExtraData] = useState('');

  const [announcement, setAnnouncement] = useState('');

  const handleCreateUser = (e) => {
    e.preventDefault();
    let data = {};
    if (role === 'student') data = { class: extraData };
    if (role === 'teacher') data = { subject: extraData };
    if (role === 'parent') {
      const student = users.find(u => u.role === 'student' && u.username === extraData.trim());
      if (!student) {
        setMessage({ type: 'error', text: "Bunday loginga ega o'quvchi topilmadi!" });
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      data = { studentId: student.id, childId: student.id };
    }
    if (role === 'advisor') {
      const classesArray = extraData.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);
      data = { advisorClasses: classesArray };
    }
    
    const result = createUser(username, password, role, data);
    if (result.success) {
      setMessage({ type: 'success', text: `Foydalanuvchi ${username} yaratildi!` });
      setUsername('');
      setPassword('');
      setExtraData('');
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAddAnnouncement = (e) => {
    e.preventDefault();
    if (announcement.trim()) {
      addAnnouncement(announcement, 'Admin', null);
      setAnnouncement('');
      setMessage({ type: 'success', text: "E'lon barchaga yuborildi!" });
      setTimeout(() => setMessage(''), 3000);
    }
  }

  const handleExport = () => {
    const dataObj = {
      users: JSON.parse(localStorage.getItem('schoolPlannerUsers') || '[]'),
      data: JSON.parse(localStorage.getItem('schoolPlannerData_v2') || '{}')
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataObj));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "maktab_baza_zaxirasi_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setMessage({ type: 'success', text: "Zaxira muvaffaqiyatli saqlandi!" });
    setTimeout(() => setMessage(''), 3000);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const obj = JSON.parse(event.target.result);
        if (obj.users && obj.data) {
          localStorage.setItem('schoolPlannerUsers', JSON.stringify(obj.users));
          localStorage.setItem('schoolPlannerData_v2', JSON.stringify(obj.data));
          setMessage({ type: 'success', text: "Ma'lumotlar tiklandi! Sahifa yangilanmoqda..." });
          setTimeout(() => {
             window.location.reload();
          }, 2000);
        } else {
          setMessage({ type: 'error', text: "Noto'g'ri fayl formati!" });
        }
      } catch(err) {
        setMessage({ type: 'error', text: "Faylni o'qishda xatolik yuz berdi!" });
      }
    };
    reader.readAsText(file);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto mt-2">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <Shield className="text-indigo-600" size={32} /> {t('role_admin')}
        </h1>
        <p className="text-slate-500 mt-2 font-medium">{t('welcome')}, {currentUser.username}!</p>
      </header>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl flex-wrap gap-1 w-max">
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200/50'}`}
        >
          <Users size={18}/> {t('users')}
        </button>
        <button 
          onClick={() => setActiveTab('schedule')}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'schedule' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200/50'}`}
        >
          <Calendar size={18}/> {t('schedule')}
        </button>
        <button 
          onClick={() => setActiveTab('announcements')}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'announcements' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200/50'}`}
        >
          <Megaphone size={18}/> {t('announcements')}
        </button>
        <button 
          onClick={() => setActiveTab('system')}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'system' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200/50'}`}
        >
          <Database size={18}/> Zaxira va Tiklash
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-sm font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
          {message.text}
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'users' && (
          <motion.div key="users" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="grid md:grid-cols-2 gap-8 mt-4">
            {/* Create User Form */}
            <section className="glass-panel p-6 border-t-4 border-t-indigo-500">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <UserPlus size={22} className="text-indigo-500" /> Yangi Profil Yaratish
              </h2>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Username</label>
                  <input required type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 text-[15px] font-semibold text-slate-700 transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
                  <input required type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 text-[15px] font-semibold text-slate-700 transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Role</label>
                  <div className="flex gap-4">
                    <select value={role} onChange={e => {setRole(e.target.value); setExtraData('');}} className="bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-400 font-semibold text-slate-700">
                      <option value="student">O'quvchi</option>
                      <option value="teacher">Ustoz</option>
                      <option value="parent">Ota-ona</option>
                      <option value="advisor">Sinf rahbari</option>
                      <option value="admin">Admin</option>
                    </select>
                    {role === 'student' && (
                      <input type="text" value={extraData} onChange={e=>setExtraData(e.target.value)} placeholder="Sinf (masalan: 10-A)" className="flex-1 bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-400 font-semibold text-slate-700 transition-all"/>
                    )}
                    {role === 'teacher' && (
                      <input type="text" value={extraData} onChange={e=>setExtraData(e.target.value)} placeholder="Fan nomi (masalan: Matematika)" className="flex-1 bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-400 font-semibold text-slate-700 transition-all"/>
                    )}
                    {role === 'parent' && (
                      <input type="text" value={extraData} onChange={e=>setExtraData(e.target.value)} placeholder="Farzandining logini (username)" className="flex-1 bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-400 font-semibold text-slate-700 transition-all"/>
                    )}
                    {role === 'advisor' && (
                      <input type="text" value={extraData} onChange={e=>setExtraData(e.target.value)} placeholder="Sinflar (vergul bilan ajrating, max 3 ta)" className="flex-1 bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-400 font-semibold text-slate-700 transition-all"/>
                    )}
                  </div>
                </div>

                <button type="submit" className="w-full py-3 mt-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors">
                  Create User
                </button>
              </form>
            </section>

            {/* User List */}
            <section className="glass-panel p-6 border-t-4 border-t-slate-400">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Users size={22} className="text-slate-500" /> Barcha Foydalanuvchilar
              </h2>
              
              <div className="space-y-6 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  { role: 'admin', title: 'Adminlar', color: 'bg-red-100 text-red-600' },
                  { role: 'advisor', title: 'Sinf Rahbarlari', color: 'bg-purple-100 text-purple-600' },
                  { role: 'teacher', title: 'Ustozlar', color: 'bg-amber-100 text-amber-600' },
                  { role: 'parent', title: 'Ota-onalar', color: 'bg-emerald-100 text-emerald-600' }
                ].map(group => {
                  const groupUsers = users.filter(u => u.role === group.role);
                  if (groupUsers.length === 0) return null;
                  return (
                    <div key={group.role} className="space-y-3">
                      <h3 className="font-extrabold text-slate-700 bg-slate-100 p-2.5 rounded-xl uppercase tracking-wider text-xs sticky top-0 z-10 shadow-sm border border-slate-200 flex items-center justify-between">
                        <span>{group.title}</span>
                        <span className={group.color + " px-2 py-0.5 rounded-md"}>{groupUsers.length} ta</span>
                      </h3>
                      <div className="grid gap-2">
                        {groupUsers.map(u => (
                          <div key={u.id} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center group hover:border-indigo-300 transition-all shadow-sm">
                            <div>
                              <div className="font-bold text-slate-800 text-[15px]">{u.username}</div>
                              <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                                {u.role === 'teacher' ? `Fan: ${u.subject}` : u.role === 'parent' ? `Farzandi: ${users.find(s => s.id === u.childId || s.id === u.studentId || s.username === u.childId || s.username === u.studentId)?.username || 'Noma\'lum'}` : u.role === 'advisor' ? `Sinflar: ${(u.advisorClasses || (u.class ? u.class.split(',').map(s=>s.trim()) : [])).join(', ')}` : 'Tizim boshqaruvchisi'}
                              </div>
                            </div>
                            {u.id !== currentUser.id && (
                              <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Students grouped by class */}
                {(() => {
                  const students = users.filter(u => u.role === 'student');
                  if (students.length === 0) return null;
                  const classes = [...new Set(students.map(s => s.class))].filter(Boolean).sort();
                  
                  return (
                    <div className="space-y-4">
                      <h3 className="font-extrabold text-slate-700 bg-slate-100 p-2.5 rounded-xl uppercase tracking-wider text-xs sticky top-0 z-10 shadow-sm border border-slate-200 flex items-center justify-between">
                        <span>O'quvchilar</span>
                        <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md">{students.length} ta</span>
                      </h3>
                      {classes.map(cls => {
                        const clsStudents = students.filter(s => s.class === cls);
                        return (
                          <div key={cls} className="ml-2 pl-3 border-l-2 border-blue-200 space-y-2 relative">
                            <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-widest">{cls} - sinf ({clsStudents.length})</h4>
                            <div className="grid gap-2">
                              {clsStudents.map(u => (
                                <div key={u.id} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center group hover:border-blue-300 transition-all shadow-sm">
                                  <div>
                                    <div className="font-bold text-slate-800 text-[14px]">{u.username}</div>
                                  </div>
                                  <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'schedule' && (
          <motion.div key="schedule" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="mt-4">
            <AdminScheduleView />
          </motion.div>
        )}

        {activeTab === 'announcements' && (
          <motion.div key="announcements" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6 mt-4">
            
            {/* Create Announcement Form */}
            <div className="glass-panel p-6 border-t-4 border-t-indigo-500">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Megaphone size={22} className="text-indigo-500" /> Barcha uchun e'lon berish
              </h2>
              <form onSubmit={handleAddAnnouncement} className="space-y-4 max-w-2xl">
                <textarea 
                  required 
                  value={announcement} 
                  onChange={e => setAnnouncement(e.target.value)} 
                  rows="4" 
                  placeholder="E'lon matnini kiriting..." 
                  className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-xl outline-none focus:border-indigo-400 text-[15px] font-semibold text-slate-700 transition-all resize-none"
                ></textarea>
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors">
                  E'lonni yuborish
                </button>
              </form>
            </div>

            {/* List Announcements */}
            <div className="glass-panel p-6 border-t-4 border-t-slate-400">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                E'lonlar Tarixi
              </h2>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {(!data.announcements || data.announcements.length === 0) ? (
                  <div className="text-slate-400 text-center py-6">E'lonlar yo'q</div>
                ) : (
                  data.announcements.map(a => (
                    <div key={a.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-start group hover:border-indigo-200 transition-colors">
                      <div>
                        <div className="flex gap-2 items-center mb-1">
                          <span className="font-bold text-[13px] text-indigo-600">{a.author}</span>
                          <span className="text-[11px] font-bold text-slate-400">{new Date(a.timestamp).toLocaleString()}</span>
                          {a.targetClass && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-md font-bold">{a.targetClass}</span>}
                        </div>
                        <p className="text-sm font-medium text-slate-700">{a.text}</p>
                      </div>
                      <button onClick={() => deleteAnnouncement(a.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </motion.div>
        )}

        {activeTab === 'system' && (
          <motion.div key="system" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6 mt-4">
            <div className="glass-panel p-6 border-t-4 border-t-emerald-500">
              <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Database size={22} className="text-emerald-500" /> Tizim Zaxirasi (Backup)
              </h2>
              <p className="text-slate-500 mb-6 font-medium">Barcha ma'lumotlarni xavfsiz saqlash va boshqa qurilmaga o'tkazish uchun.</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-xl space-y-4">
                  <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                    <Download size={20} /> Zaxira Nusxasini Olish
                  </h3>
                  <p className="text-sm text-emerald-600 font-medium">Barcha foydalanuvchilar, jurnallar, xabarlar va fayllarni bitta fayl sifatida saqlaydi.</p>
                  <button onClick={handleExport} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-colors">
                    Export (Yuklab olish)
                  </button>
                </div>

                <div className="p-6 bg-amber-50 border border-amber-100 rounded-xl space-y-4">
                  <h3 className="font-bold text-amber-800 flex items-center gap-2">
                    <Upload size={20} /> Zaxirani Tiklash
                  </h3>
                  <p className="text-sm text-amber-600 font-medium">Avval saqlab olingan .json faylni yuklash orqali barcha ma'lumotlarni qayta tiklash.</p>
                  <label className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 hover:bg-amber-700 transition-colors cursor-pointer text-center block">
                    Import (Fayl tanlash)
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
