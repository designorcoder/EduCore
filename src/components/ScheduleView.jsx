import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Edit2, Save, X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

export default function ScheduleView() {
  const { data, updateSchedule } = useAppContext();
  const [editingDay, setEditingDay] = useState(null);
  const [tempClasses, setTempClasses] = useState([]);

  const startEdit = (day) => {
    setEditingDay(day);
    setTempClasses(data.schedule[day] || []);
  };

  const handleSave = () => {
    updateSchedule(editingDay, tempClasses.filter(c => c.trim() !== ''));
    setEditingDay(null);
  };

  const handleSubjectChange = (idx, value) => {
    const nw = [...tempClasses];
    nw[idx] = value;
    setTempClasses(nw);
  };

  const removeSlot = (idx) => {
    setTempClasses(tempClasses.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto mt-2">
       <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Dars jadvali</h1>
        <p className="text-slate-500 mt-1 font-medium">Haftalik dars soatlarini boshqarish</p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {DAYS.map(day => (
          <motion.div 
            whileHover={{ y: -2 }} 
            key={day} 
            className="glass-panel p-5 relative overflow-hidden flex flex-col h-full border-t-[3px] border-t-blue-400 group"
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg text-slate-800">{day}</h3>
              {editingDay !== day ? (
                <button onClick={() => startEdit(day)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl transition-all">
                  <Edit2 size={16} strokeWidth={2.5} />
                </button>
              ) : (
                <button onClick={handleSave} className="px-3 py-1.5 text-sm font-bold text-white bg-blue-600 rounded-xl transition-all shadow-md shadow-blue-500/30 flex items-center gap-1.5">
                  <Save size={16} /> Saqlash
                </button>
              )}
            </div>

            {editingDay === day ? (
              <div className="space-y-3 flex-1">
                {tempClasses.map((subj, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 text-center text-xs font-bold text-slate-400 bg-slate-100 py-1.5 rounded-md">{idx+1}</span>
                    <input 
                      value={subj}
                      onChange={(e) => handleSubjectChange(idx, e.target.value)}
                      className="flex-1 bg-white border-2 border-slate-100 outline-none px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all placeholder:font-normal placeholder:text-slate-300"
                      placeholder="Fan nomi"
                      autoFocus={idx === tempClasses.length -1}
                    />
                    <button onClick={() => removeSlot(idx)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-colors">
                      <X size={16} strokeWidth={3} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => setTempClasses([...tempClasses, ""])}
                  className="w-full mt-3 py-2.5 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl text-sm font-bold hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Dars qo'shish
                </button>
              </div>
            ) : (
              <div className="flex-1">
                {(!data.schedule[day] || data.schedule[day].length === 0) ? (
                  <div className="h-full flex items-center justify-center py-6 text-sm text-slate-400 font-medium italic border-2 border-dashed border-slate-100 rounded-xl">
                    Darslar yo'q
                  </div>
                ) : (
                  <ul className="space-y-2.5 mt-2">
                    {data.schedule[day].map((subj, idx) => (
                      <li key={idx} className="flex gap-4 text-sm items-center p-2.5 rounded-xl bg-slate-50/60 border border-slate-100 group-hover:border-slate-200 group-hover:bg-white transition-colors relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200"></div>
                        <span className="font-black text-slate-300 w-5 text-right font-mono text-[16px]">{idx+1}</span>
                        <span className="text-slate-800 font-semibold">{subj}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
