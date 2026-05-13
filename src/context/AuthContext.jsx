import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const initialUsers = [
  { id: 1, username: 'admin', password: '123', role: 'admin' }, // Default admin
];

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('schoolPlannerUsers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialUsers;
      }
    }
    return initialUsers;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('schoolPlannerCurrentUser');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem('schoolPlannerUsers', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('schoolPlannerCurrentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('schoolPlannerCurrentUser');
    }
  }, [currentUser]);

  const login = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      return { success: true };
    }
    return { success: false, message: 'Invalid username or password' };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const createUser = (username, password, role, extraData = {}) => {
    if (users.find(u => u.username === username)) {
      return { success: false, message: 'Username already exists' };
    }
    const newUser = { id: Date.now(), username, password, role, ...extraData };
    setUsers(prev => [...prev, newUser]);
    return { success: true };
  };

  const deleteUser = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const updateProfilePic = (id, base64Image) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, avatar: base64Image } : u));
    if (currentUser?.id === id) {
      setCurrentUser(prev => ({ ...prev, avatar: base64Image }));
    }
  };

  return (
    <AuthContext.Provider value={{ users, currentUser, login, logout, createUser, deleteUser, updateProfilePic }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
