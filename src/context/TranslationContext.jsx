import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  uz: {
    dashboard: "Panel",
    tasks: "Vazifalar",
    schedule: "Dars Jadvali",
    chat: "Xabarlar",
    leaderboard: "Reyting",
    library: "Kutubxona",
    events: "Tadbirlar",
    tests: "Testlar",
    announcements: "E'lonlar",
    attendance: "Yo'qlama",
    analytics: "Statistika",
    journal: "Jurnal",
    logout: "Chiqish",
    welcome: "Salom",
    role_admin: "Admin Paneli",
    role_teacher: "Ustoz Paneli",
    role_advisor: "Sinf Rahbari Paneli",
    role_parent: "Ota-ona Paneli",
    users: "Foydalanuvchilar"
  },
  en: {
    dashboard: "Dashboard",
    tasks: "Tasks",
    schedule: "Schedule",
    chat: "Messages",
    leaderboard: "Leaderboard",
    library: "Library",
    events: "Events",
    tests: "Quizzes",
    announcements: "Announcements",
    attendance: "Attendance",
    analytics: "Analytics",
    journal: "Journal",
    logout: "Logout",
    welcome: "Hello",
    role_admin: "Admin Dashboard",
    role_teacher: "Teacher Dashboard",
    role_advisor: "Advisor Dashboard",
    role_parent: "Parent Dashboard",
    users: "Users"
  },
  ru: {
    dashboard: "Панель",
    tasks: "Задания",
    schedule: "Расписание",
    chat: "Сообщения",
    leaderboard: "Рейтинг",
    library: "Библиотека",
    events: "События",
    tests: "Тесты",
    announcements: "Объявления",
    attendance: "Посещаемость",
    analytics: "Аналитика",
    journal: "Журнал",
    logout: "Выйти",
    welcome: "Привет",
    role_admin: "Панель Админа",
    role_teacher: "Панель Учителя",
    role_advisor: "Панель Классного Руководителя",
    role_parent: "Панель Родителя",
    users: "Пользователи"
  }
};

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'uz');

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = (key) => translations[lang][key] || key;

  return (
    <TranslationContext.Provider value={{ lang, setLang, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);
