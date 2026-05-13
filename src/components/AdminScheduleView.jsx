import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { Edit2, Save, X, Plus, GripVertical } from "lucide-react";
import { motion } from "framer-motion";

const DAYS = [
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
];

export default function AdminScheduleView() {
  const { data, updateSchedule } = useAppContext();
  const { users } = useAuth();
  const [selectedClass, setSelectedClass] = useState("");

  const [editingDay, setEditingDay] = useState(null);
  const [tempClasses, setTempClasses] = useState([]);
  const [draggedIdx, setDraggedIdx] = useState(null);

  const classes = [
    ...new Set(
      users
        .filter((u) => u.role === "student")
        .map((u) => u.class || u.metadata?.class)
        .filter(Boolean),
    ),
  ];

  const classSchedule = data.schedule[selectedClass] || {};

  const startEdit = (day) => {
    setEditingDay(day);
    setTempClasses(classSchedule[day] || []);
  };

  const handleSave = () => {
    updateSchedule(
      selectedClass,
      editingDay,
      tempClasses.filter((c) => c.trim() !== ""),
    );
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

  const handleDragStart = (idx) => {
    setDraggedIdx(idx);
  };

  const handleDrop = (idx) => {
    if (draggedIdx === null) return;
    if (draggedIdx === idx) return;
    const items = [...tempClasses];
    const draggedItem = items[draggedIdx];
    items.splice(draggedIdx, 1);
    items.splice(idx, 0, draggedItem);
    setTempClasses(items);
    setDraggedIdx(null);
  };

  if (classes.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        Iltimos, avval o'quvchilar (sinflar bilan) yarating.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center mb-6">
        <label className="font-bold text-slate-700">Sinfni tanlang:</label>
        <select
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(e.target.value);
            setEditingDay(null);
          }}
          className="bg-white border-2 border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-400 font-semibold text-slate-700 min-w-[150px]"
        >
          <option value="" disabled>
            Tanlang...
          </option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {!selectedClass ? (
        <div className="text-center py-10 text-slate-400 font-medium italic">
          Jadvalni tahrirlash uchun sinfni tanlang.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {DAYS.map((day) => (
            <motion.div
              whileHover={{ y: -2 }}
              key={day}
              className="glass-panel p-5 relative overflow-hidden flex flex-col h-full border-t-[3px] border-t-indigo-400 group"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-lg text-slate-800">{day}</h3>
                {editingDay !== day ? (
                  <button
                    onClick={() => startEdit(day)}
                    className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <Edit2 size={16} strokeWidth={2.5} />
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    className="px-3 py-1.5 text-sm font-bold text-white bg-indigo-600 rounded-xl transition-all shadow-md shadow-indigo-500/30 flex items-center gap-1.5"
                  >
                    <Save size={16} /> Saqlash
                  </button>
                )}
              </div>

              {editingDay === day ? (
                <div className="space-y-3 flex-1">
                  {tempClasses.map((subj, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 transition-all ${draggedIdx === idx ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={() => handleDrop(idx)}
                      onDragEnd={() => setDraggedIdx(null)}
                    >
                      <span
                        className="w-6 flex items-center justify-center text-slate-400 bg-slate-100 py-1.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-slate-200 transition-colors"
                        title="Sichqoncha bilan tortib o'rnini almashtiring"
                      >
                        <GripVertical size={14} />
                      </span>
                      <span className="w-4 text-center text-xs font-bold text-slate-400">
                        {idx + 1}
                      </span>
                      <input
                        value={subj}
                        onChange={(e) =>
                          handleSubjectChange(idx, e.target.value)
                        }
                        className="flex-1 bg-white border-2 border-slate-100 outline-none px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 focus:border-indigo-400 transition-all placeholder:font-normal placeholder:text-slate-300"
                        placeholder="Fan nomi"
                        autoFocus={idx === tempClasses.length - 1}
                      />
                      <button
                        onClick={() => removeSlot(idx)}
                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <X size={16} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setTempClasses([...tempClasses, ""])}
                    className="w-full mt-3 py-2.5 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl text-sm font-bold hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Dars qo'shish
                  </button>
                </div>
              ) : (
                <div className="flex-1">
                  {!classSchedule[day] || classSchedule[day].length === 0 ? (
                    <div className="h-full flex items-center justify-center py-6 text-sm text-slate-400 font-medium italic border-2 border-dashed border-slate-100 rounded-xl">
                      Darslar yo'q
                    </div>
                  ) : (
                    <ul className="space-y-2.5 mt-2">
                      {classSchedule[day].map((subj, idx) => (
                        <li
                          key={idx}
                          className="flex gap-4 text-sm items-center p-2.5 rounded-xl bg-slate-50/60 border border-slate-100 group-hover:border-slate-200 group-hover:bg-white transition-colors relative overflow-hidden"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200"></div>
                          <span className="font-black text-slate-300 w-5 text-right font-mono text-[16px]">
                            {idx + 1}
                          </span>
                          <span className="text-slate-800 font-semibold">
                            {subj}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
