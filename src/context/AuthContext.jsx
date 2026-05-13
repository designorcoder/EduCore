import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  
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

  const fetchUsers = async () => {
    try {
      const data = await authAPI.getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('schoolPlannerCurrentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('schoolPlannerCurrentUser');
    }
  }, [currentUser]);

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password);
      if (response && response.id) {
        setCurrentUser(response);
        return { success: true };
      }
      return { success: false, message: 'Invalid username or password' };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: 'Invalid username or password' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const createUser = async (username, password, role, extraData = {}) => {
    try {
      const newUser = await authAPI.createUser({ username, password, role, ...extraData });
      if (newUser.error) {
        return { success: false, message: newUser.error };
      }
      await fetchUsers();
      return { success: true };
    } catch (error) {
      console.error("Create user error:", error);
      return { success: false, message: 'Failed to create user' };
    }
  };

  const deleteUser = async (id) => {
    try {
      await authAPI.deleteUser(id);
      await fetchUsers();
    } catch (error) {
      console.error("Delete user error:", error);
    }
  };

  const updateProfilePic = async (id, base64Image) => {
    try {
      await authAPI.updateUser(id, { avatar: base64Image });
      await fetchUsers();
      if (currentUser?.id === id) {
        setCurrentUser(prev => ({ ...prev, avatar: base64Image }));
      }
    } catch (error) {
      console.error("Update profile pic error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ users, currentUser, login, logout, createUser, deleteUser, updateProfilePic }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
