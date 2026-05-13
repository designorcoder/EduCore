import React from 'react';
import { Home, Calendar, CheckSquare, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const TABS = [
  { id: 'dashboard', icon: Home, label: 'Asosiy' },
  { id: 'schedule', icon: Calendar, label: 'Jadval' },
  { id: 'tasks', icon: CheckSquare, label: 'Vazifalar' },
  { id: 'teachers', icon: Users, label: "O'qituvchi" },
];

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 md:relative md:w-28 md:h-[calc(100vh-48px)] z-50 px-3 pb-3 pt-0 md:p-0">
      <div className="glass-panel w-full md:h-full md:rounded-3xl p-2 flex md:flex-col justify-around md:justify-center md:gap-8 items-center border border-white/50 bg-white/60 backdrop-blur-2xl soft-shadow shadow-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative flex flex-col items-center justify-center p-3 md:p-4 rounded-xl transition-colors outline-none w-[70px] h-[70px] md:w-full md:h-24"
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-blue-500/10 md:bg-blue-500/5 rounded-2xl md:rounded-[20px]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <tab.icon className={cn("w-6 h-6 md:w-7 md:h-7 mb-1 z-10 transition-colors", activeTab === tab.id ? "text-blue-600" : "text-slate-400 hover:text-slate-500")} />
            <span className={cn("text-[10px] md:text-sm z-10 font-medium transition-colors", activeTab === tab.id ? "text-blue-600" : "text-slate-400")}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
