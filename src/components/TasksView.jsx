import React, { useState, memo } from "react";
import { useAppContext } from "../context/AppContext";
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  CalendarCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TaskItem = memo(({ task, subject, onToggle, onDelete }) => {
  const isCompleted = Boolean(task.completed);
  const isLate =
    new Date(task.deadline) <
      new Date(new Date().setHours(0, 0, 0, 0)) && !isCompleted;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 ${
        isCompleted ? "bg-slate-50/50" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <button
            onClick={() => onToggle(task.id)}
            className={`mt-0.5 transition-colors duration-200 ${
              isCompleted
                ? "text-green-500 hover:text-green-600"
                : "text-slate-400 hover:text-slate-500"
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 size={20} />
            ) : (
              <Circle size={20} />
            )}
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  subject?.color || "bg-slate-100 text-slate-700"
                }`}
              >
                {subject?.name || "Noma'lum fan"}
              </span>
              {isLate && (
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                  Muddat o'tgan
                </span>
              )}
            </div>
            <p
              className={`font-semibold mt-2 text-[16px] ${
                isCompleted ? "line-through text-slate-500" : "text-slate-800"
              }`}
            >
              {task.task}
            </p>
            <div
              className={`flex items-center gap-1.5 mt-3 text-xs font-bold ${
                isCompleted
                  ? "text-slate-400"
                  : isLate
                  ? "text-red-500"
                  : "text-amber-500"
              }`}
            >
              <Clock size={13} />
              <span>{task.deadline}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onDelete(task.id)}
          className="text-slate-400 hover:text-red-500 transition-colors duration-200 p-1"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
});

export default function TasksView() {
  const { data, toggleTask, addTask, deleteTask } = useAppContext();
  const [filter, setFilter] = useState("all"); // all, pending, done
  const [isAdding, setIsAdding] = useState(false);

  const [newTask, setNewTask] = useState("");
  const [newSubj, setNewSubj] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  const filteredTasks = data.tasks.filter((t) => {
    const isCompleted = Boolean(t.completed);
    if (filter === "pending") return !isCompleted;
    if (filter === "done") return isCompleted;
    return true;
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (newSubj && newTask && newDeadline) {
      addTask(newSubj, newTask, newDeadline);
      setIsAdding(false);
      setNewTask("");
      setNewSubj("");
      setNewDeadline("");
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-3xl mx-auto mt-2">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">
            Vazifalar menejeri
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Uy vazifalarini nazorat qilish
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`p-3 md:px-5 md:py-3 rounded-full md:rounded-2xl shadow-lg transition-all font-bold flex items-center justify-center gap-2 text-white ${isAdding ? "bg-slate-800 hover:shadow-slate-500/30" : "bg-blue-600 hover:shadow-blue-500/30"}`}
        >
          <Plus
            size={20}
            className={
              isAdding
                ? "rotate-45 transition-transform"
                : "transition-transform"
            }
          />
          <span className="hidden md:inline">
            {isAdding ? "Bekor qilish" : "Yangi vazifa"}
          </span>
        </button>
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.2 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleAdd}
              className="glass-panel p-6 border-t-[3px] border-t-blue-500 flex flex-col gap-4 mb-4"
            >
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <CalendarCheck size={20} className="text-blue-500" /> Yangi
                vazifa qo'shish
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">
                    Fan nomi
                  </label>
                  <select
                    required
                    value={newSubj}
                    onChange={(e) => setNewSubj(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 text-[15px] font-semibold text-slate-700 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Fanni tanlang...
                    </option>
                    {data.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">
                    Muddat (Deadline)
                  </label>
                  <input
                    required
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 text-[15px] font-semibold text-slate-700 transition-all cursor-text"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase px-1">
                  Vazifa tafsiloti
                </label>
                <textarea
                  required
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Masalan: 34-bet, 5-mashqni yechish"
                  rows="2"
                  className="w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 text-[15px] font-semibold text-slate-700 resize-none transition-all"
                ></textarea>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[15px] font-bold rounded-xl shadow-lg shadow-blue-500/30 w-full md:w-auto"
                >
                  Qo'shish
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex p-1 bg-white/60 backdrop-blur border border-slate-200 rounded-2xl w-full shadow-sm mx-auto md:mx-0">
        {[
          { id: "all", label: "Barchasi", count: data.tasks.length },
          {
            id: "pending",
            label: "Kutilmoqda",
            count: data.tasks.filter((t) => !Boolean(t.completed)).length,
          },
          {
            id: "done",
            label: "Bajarilgan",
            count: data.tasks.filter((t) => Boolean(t.completed)).length,
          },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${filter === f.id ? "bg-white shadow text-blue-600" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"}`}
          >
            {f.label}
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] ${filter === f.id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 pt-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 text-slate-400 glass-panel border border-dashed border-slate-300">
            <CheckCircle2
              size={48}
              className="mx-auto mb-3 text-slate-300 opacity-50"
            />
            <p className="font-semibold text-lg">
              Vazifalar ro'yxati bo'sh! 🎉
            </p>
          </div>
        ) : (
          filteredTasks
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .map((t) => {
              const subject = data.subjects.find((s) => s.id === t.subjectId);
              const isCompleted = Boolean(t.completed);
              const isLate =
                new Date(t.deadline) <
                  new Date(new Date().setHours(0, 0, 0, 0)) && !isCompleted;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={t.id}
                  className={`glass-panel p-4 md:p-5 flex gap-4 transition-all duration-300 relative overflow-hidden group ${isCompleted ? "opacity-70 bg-slate-50/50" : "hover:shadow-md"}`}
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${t.completed ? "bg-green-400" : isLate ? "bg-red-400" : "bg-amber-400"}`}
                  ></div>

                  <button
                    onClick={() => toggleTask(t.id)}
                    className={`mt-1 flex-shrink-0 transition-transform ${isCompleted ? "text-green-500" : "text-slate-300"}`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={28} />
                    ) : (
                      <Circle size={28} />
                    )}
                  </button>
                  <div className="flex-1 pt-0.5">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                        {subject?.name || t.subject || "Topilmadi"}
                      </span>
                      <button
                        onClick={() => deleteTask(t.id)}
                        className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p
                      className={`font-semibold mt-2 text-[16px] ${isCompleted ? "line-through text-slate-500" : "text-slate-800"}`}
                    >
                      {t.task}
                    </p>
                    <div
                      className={`flex items-center gap-1.5 mt-3 text-xs font-bold ${isCompleted ? "text-slate-400" : isLate ? "text-red-500" : "text-amber-500"}`}
                    >
                      <Clock size={13} />
                      <span>{t.deadline}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
        )}
      </div>
    </div>
  );
}

export default memo(TasksView);
