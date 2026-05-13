import React from 'react';
import { useAppContext } from '../context/AppContext';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';

export default function Dashboard() {
  const { data } = useAppContext();
  
  const totalTasks = data.tasks.length;
  const completedTasks = data.tasks.filter(t => t.completed).length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const pendingTasks = data.tasks.filter(t => !t.completed).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline)).slice(0, 3); // top 3 closest deadline

  const days = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
  const today = days[new Date().getDay()];
  const todaySchedule = data.schedule[today] || [];
  
  return (
    <div className="space-y-6 md:space-y-8 max-w-3xl mx-auto mt-2">
      <header className="mb-8">
        <h1 className="text-[28px] font-extrabold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">Assalomu alaykum!</h1>
        <p className="text-slate-500 mt-1 font-medium text-[15px]">Farzandingizning bugungi ta'lim holati</p>
      </header>

      {/* Progress Tracker Widget */}
      <section className="glass-panel p-6 border-t-2 border-t-green-400">
        <div className="flex justify-between items-end mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle className="text-green-500" size={22} /> Haftalik Progress
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">{completedTasks} ta vazifa bajarildi (Jami: {totalTasks} ta)</p>
          </div>
          <span className="text-3xl font-extrabold text-green-500 tracking-tight">{progressPercent}%</span>
        </div>
        
        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden p-0.5 border border-slate-200/50">
          <div 
            className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full transition-all duration-1000 ease-out shadow-sm relative overflow-hidden"
            style={{ width: `${progressPercent}%` }}
          >
             <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's Schedule summary */}
        <section className="glass-panel p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <Clock className="text-blue-500" size={22} /> Bugungi darslar <span className="text-sm font-medium bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md ml-auto">{today}</span>
          </h2>
          {todaySchedule.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
               <p className="text-sm text-slate-400 font-medium">Bugun maktab darslari yo'q, dam olish kuni! ✨</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {todaySchedule.map((subject, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-blue-200 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm text-blue-600 flex items-center justify-center font-bold text-sm border-2 border-blue-50 group-hover:border-blue-200">
                    {idx + 1}
                  </div>
                  <span className="font-semibold text-slate-700 text-[15px]">{subject}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Priority Tasks */}
        <section className="glass-panel p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <BookOpen className="text-amber-500" size={22} /> Keyingi vazifalar
          </h2>
          {pendingTasks.length === 0 ? (
            <div className="py-8 text-center bg-emerald-50 rounded-2xl border border-emerald-100 border-dashed">
               <p className="text-sm text-emerald-600 font-medium">Barcha vazifalar bajarilgan! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map(t => {
                const subject = data.subjects.find(s => s.id === t.subjectId);
                const isLate = new Date(t.deadline) < new Date(new Date().setHours(0,0,0,0));
                
                return (
                  <div key={t.id} className={`p-4 border rounded-xl relative overflow-hidden ${isLate ? 'bg-red-50/40 border-red-200' : 'bg-slate-50/80 border-slate-100 hover:border-amber-200 transition-colors'}`}>
                    {isLate && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400"></div>}
                    {!isLate && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 opacity-50"></div>}
                    <div className="flex flex-col gap-1.5 pl-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{subject?.name || 'Noma\'lum'}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${isLate ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>Muddat: {t.deadline}</span>
                      </div>
                      <p className="text-[15px] font-semibold text-slate-800 leading-snug">{t.task}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
