import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const initialData = {
  tasks: [], // { id, className, subject, task, deadline, completedBy: [] }
  attendance: [], // { id, date, className, studentId, isPresent }
  grades: [], // { id, date, className, subject, studentId, grade }
  messages: [], // { id, senderId, receiverId, text, timestamp, read }
  announcements: [], // { id, text, author, targetClass, timestamp }
  quizzes: [], // { id, subject, className, title, questions: [] }
  quizResults: [], // { id, quizId, studentId, score }
  library: [], // { id, title, type, url, subject, addedBy }
  events: [], // { id, title, date, type }
  schedule: { // className: { day: [subjects] }
    "10-A": {
      "Dushanba": ["Matematika", "Ona tili", "Ingliz tili"],
      "Seshanba": ["Tarix", "Fizika"],
      "Chorshanba": ["Ona tili", "Matematika", "Geografiya"],
      "Payshanba": ["Ingliz tili", "Jismoniy tarbiya"],
      "Juma": ["Biologiya", "Kimyo", "Informatika"],
      "Shanba": ["Adabiyot", "Matematika"]
    }
  }
};

export const AppProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('schoolPlannerData_v2');
    if (saved) return JSON.parse(saved);
    return initialData;
  });

  useEffect(() => {
    localStorage.setItem('schoolPlannerData_v2', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'schoolPlannerData_v2' && e.newValue) {
        try {
          setData(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addTask = (className, subject, taskText, deadline) => {
    setData(prev => ({
      ...prev,
      tasks: [...(prev.tasks || []), {
        id: Date.now(),
        className,
        subject,
        task: taskText,
        deadline,
        completedBy: []
      }]
    }));
  };

  const toggleTask = (taskId, studentId, filePayload = null) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id === taskId) {
          const completedBy = t.completedBy || [];
          const existingIndex = completedBy.findIndex(c => c === studentId || c.studentId === studentId);
          
          let newCompletedBy = [...completedBy];
          if (existingIndex >= 0 && !filePayload) {
             newCompletedBy.splice(existingIndex, 1);
          } else if (existingIndex === -1 && filePayload) {
             newCompletedBy.push({ 
                studentId, 
                fileData: filePayload, 
                image: filePayload.type === 'image' ? filePayload.data : null, 
                timestamp: new Date().toISOString(), 
                approved: false, 
                rejected: false 
             });
          } else if (existingIndex >= 0 && filePayload) {
             newCompletedBy[existingIndex] = { 
                studentId, 
                fileData: filePayload, 
                image: filePayload.type === 'image' ? filePayload.data : null, 
                timestamp: new Date().toISOString(), 
                approved: false, 
                rejected: false 
             };
          } else if (existingIndex === -1 && !filePayload) {
             newCompletedBy.push({ 
                studentId, 
                image: null, 
                timestamp: new Date().toISOString(), 
                approved: false, 
                rejected: false 
             });
          }

          return { ...t, completedBy: newCompletedBy };
        }
        return t;
      })
    }));
  };

  const markAttendance = (date, className, studentId, isPresent) => {
    setData(prev => {
      const existing = (prev.attendance || []).filter(a => !(a.date === date && a.studentId === studentId));
      return {
        ...prev,
        attendance: [...existing, { id: Date.now(), date, className, studentId, isPresent }]
      };
    });
  };

  const addGrade = (date, className, subject, studentId, grade) => {
    setData(prev => {
      const existing = (prev.grades || []).filter(g => !(g.date === date && g.subject === subject && g.studentId === studentId));
      if (!grade) return { ...prev, grades: existing }; // remove grade if empty
      return {
        ...prev,
        grades: [...existing, { id: Date.now(), date, className, subject, studentId, grade }]
      };
    });
  };

  const deleteTask = (taskId) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId)
    }));
  };

  const approveTask = (taskId, studentId, isApproved) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            completedBy: (t.completedBy || []).map(c => {
              const sid = c.studentId || c;
              if (sid === studentId) {
                return typeof c === 'string' 
                  ? { studentId: c, approved: isApproved, rejected: !isApproved }
                  : { ...c, approved: isApproved, rejected: !isApproved };
              }
              return c;
            })
          }
        }
        return t;
      })
    }));
  };

  const updateSchedule = (className, day, classes) => {
    setData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [className]: {
          ...(prev.schedule[className] || {}),
          [day]: classes
        }
      }
    }));
  };

  const sendMessage = (senderId, receiverId, text, imageBase64 = null) => {
    setData(prev => ({
      ...prev,
      messages: [...(prev.messages || []), {
        id: Date.now(),
        senderId,
        receiverId,
        text,
        image: imageBase64,
        timestamp: new Date().toISOString(),
        read: false,
        readBy: [senderId]
      }]
    }));
  };

  const markMessagesAsRead = (targetId, myId) => {
    setData(prev => ({
      ...prev,
      messages: (prev.messages || []).map(m => {
        if (String(targetId).startsWith('GROUP_')) {
          if (m.receiverId === targetId) {
            const readBy = m.readBy || [m.senderId];
            if (!readBy.includes(myId)) {
              return { ...m, readBy: [...readBy, myId] };
            }
          }
        } else {
          if (m.senderId === targetId && m.receiverId === myId && !m.read) {
            return { ...m, read: true };
          }
        }
        return m;
      })
    }));
  };

  const addAnnouncement = (text, author, targetClass) => {
    setData(prev => ({
      ...prev,
      announcements: [{ id: Date.now(), text, author, targetClass, timestamp: new Date().toISOString() }, ...(prev.announcements || [])]
    }));
  };

  const deleteAnnouncement = (id) => {
    setData(prev => ({
      ...prev,
      announcements: (prev.announcements || []).filter(a => a.id !== id)
    }));
  };

  const addQuiz = (subject, className, title, questions) => {
    setData(prev => ({
      ...prev,
      quizzes: [{ id: Date.now(), subject, className, title, questions }, ...(prev.quizzes || [])]
    }));
  };

  const submitQuiz = (quizId, studentId, score) => {
    setData(prev => ({
      ...prev,
      quizResults: [...(prev.quizResults || []), { id: Date.now(), quizId, studentId, score }]
    }));
  };

  const addLibraryItem = (title, type, url, subject, addedBy) => {
    setData(prev => ({
      ...prev,
      library: [{ id: Date.now(), title, type, url, subject, addedBy }, ...(prev.library || [])]
    }));
  };

  const addEvent = (title, date, type) => {
    setData(prev => ({
      ...prev,
      events: [{ id: Date.now(), title, date, type }, ...(prev.events || [])]
    }));
  };

  const editMessage = (messageId, newText) => {
    setData(prev => ({
      ...prev,
      messages: (prev.messages || []).map(m => m.id === messageId ? { ...m, text: newText, edited: true } : m)
    }));
  };

  const deleteMessage = (messageId) => {
    setData(prev => ({
      ...prev,
      messages: (prev.messages || []).filter(m => m.id !== messageId)
    }));
  };

  return (
    <AppContext.Provider value={{
      data, setData, 
      addTask, toggleTask, deleteTask, approveTask,
      markAttendance, addGrade, updateSchedule, sendMessage, markMessagesAsRead, editMessage, deleteMessage,
      addAnnouncement, deleteAnnouncement, addQuiz, submitQuiz,
      addLibraryItem, addEvent
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
