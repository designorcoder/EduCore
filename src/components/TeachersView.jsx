import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Phone, Users, UserPlus, BookOpen, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeachersView() {
  const { data, addSubject, deleteSubject } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [phone, setPhone] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if(name && teacher && phone) {
      addSubject(name, teacher, phone);
      setIsAdding(false);
      setName(""); setTeacher(""); setPhone("");
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto mt-2">
       <header className="flex justify-between items-center mb-6">
         <div>
          <h1 className="text-2xl font-extrabold text-slate-800">O'qituvchilar</h1>
          <p className="text-slate-500 mt-1 font-medium">Fanlar va aloqa uchun ma'lumotlar</p>
         </div>
         <button 
           onClick={() => setIsAdding(!isAdding)}
           className={`p-3 md:px-5 md:py-3 rounded-full md:rounded-2xl shadow-lg transition-all font-bold flex items-center justify-center gap-2 text-white ${isAdding ? 'bg-slate-800 hover:shadow-slate-500/30' : 'bg-blue-600 hover:shadow-blue-500/30'}`}
         >
           <UserPlus size={20} />
           <span className="hidden md:inline">{isAdding ? 'Bekor qilish' : 'Yangi qo\'shish'}</span>
         </button>
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0.2 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAdd} className="glass-panel p-6 border-t-[3px] border-t-blue-500 flex flex-col gap-4 mb-4">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <BookOpen size={20} className="text-blue-500" /> Yangi fan va o'qituvchi
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">Fan nomi</label>
                  <input required value={name} onChange={e=>setName(e.target.value)} placeholder="Masalan: Tarix" className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 text-[15px] font-semibold text-slate-700 transition-all"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">O'qituvchi</label>
                  <input required value={teacher} onChange={e=>setTeacher(e.target.value)} placeholder="Ism va sharifi" className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 text-[15px] font-semibold text-slate-700 transition-all"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">Telefon raqam</label>
                  <input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+998 90 123 45 67" className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 text-[15px] font-semibold text-slate-700 transition-all"/>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[15px] font-bold rounded-xl shadow-lg shadow-blue-500/30 w-full md:w-auto">Qo'shish va Saqlash</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.subjects.length === 0 ? (
           <div className="text-center py-16 text-slate-400 col-span-full glass-panel border border-dashed border-slate-300">
             <Users size={48} className="mx-auto mb-3 text-slate-300 opacity-50" />
             <p className="font-semibold text-lg">O'qituvchilar ro'yxati bo'sh</p>
           </div>
        ) : (
          data.subjects.map(s => (
            <motion.div whileHover={{ y: -4 }} key={s.id} className="glass-panel p-6 flex flex-col gap-5 border-t-[3px] border-t-indigo-400 group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
                    <BookOpen size={20} />
                  </div>
                  <span className="font-black text-slate-800 text-[17px] uppercase tracking-wide">{s.name}</span>
                </div>
                <button onClick={() => deleteSubject(s.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors p-2 rounded-xl opacity-0 group-hover:opacity-100">
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 group-hover:border-indigo-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Users size={16} />
                  </div>
                  <span className="font-bold text-[15px] text-slate-700">{s.teacher}</span>
                </div>
                <div className="w-full h-[1px] bg-slate-200/60"></div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                    <Phone size={16} />
                  </div>
                  <a href={`tel:${s.phone}`} className="font-bold text-[15px] text-slate-700 hover:text-green-600 transition-colors">{s.phone}</a>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
