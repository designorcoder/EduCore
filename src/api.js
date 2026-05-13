const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Auth API calls
export const authAPI = {
  getUsers: async () => {
    const response = await fetch(`${API_URL}/api/users`);
    return response.json();
  },
  login: async (username, password) => {
    const response = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) throw new Error("Login failed");
    return response.json();
  },
  createUser: async (user) => {
    const response = await fetch(`${API_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    return response.json();
  },
  deleteUser: async (id) => {
    const response = await fetch(`${API_URL}/api/users/${id}`, {
      method: "DELETE",
    });
    return response.json();
  },
  updateUser: async (id, updates) => {
    const response = await fetch(`${API_URL}/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return response.json();
  },
};

// Subject API calls
export const subjectAPI = {
  getSubjects: async () => {
    const response = await fetch(`${API_URL}/api/subjects`);
    return response.json();
  },
  addSubject: async (name, teacher, phone) => {
    const response = await fetch(`${API_URL}/api/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, teacher, phone }),
    });
    return response.json();
  },
  deleteSubject: async (id) => {
    const response = await fetch(`${API_URL}/api/subjects/${id}`, {
      method: "DELETE",
    });
    return response.json();
  },
};

// Task API calls
export const taskAPI = {
  getTasks: async () => {
    const response = await fetch(`${API_URL}/api/tasks`);
    return response.json();
  },
  addTask: async (task) => {
    const response = await fetch(`${API_URL}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    return response.json();
  },
  toggleTask: async (taskId, studentData) => {
    const response = await fetch(`${API_URL}/api/tasks/${taskId}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentData),
    });
    return response.json();
  },
  deleteTask: async (id) => {
    const response = await fetch(`${API_URL}/api/tasks/${id}`, {
      method: "DELETE",
    });
    return response.json();
  },
};

// Attendance API calls
export const attendanceAPI = {
  getAttendance: async () => {
    const response = await fetch(`${API_URL}/api/attendance`);
    return response.json();
  },
  recordAttendance: async (attendance) => {
    const response = await fetch(`${API_URL}/api/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attendance),
    });
    return response.json();
  },
};

// Grades API calls
export const gradesAPI = {
  getGrades: async () => {
    const response = await fetch(`${API_URL}/api/grades`);
    return response.json();
  },
  recordGrade: async (grade) => {
    const response = await fetch(`${API_URL}/api/grades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(grade),
    });
    return response.json();
  },
};

// Messages API calls
export const messagesAPI = {
  getMessages: async () => {
    const response = await fetch(`${API_URL}/api/messages`);
    return response.json();
  },
  sendMessage: async (message) => {
    const response = await fetch(`${API_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    return response.json();
  },
  markAsRead: async (id) => {
    const response = await fetch(`${API_URL}/api/messages/${id}/read`, {
      method: "PUT",
    });
    return response.json();
  },
};

// Announcements API calls
export const announcementsAPI = {
  getAnnouncements: async () => {
    const response = await fetch(`${API_URL}/api/announcements`);
    return response.json();
  },
  createAnnouncement: async (announcement) => {
    const response = await fetch(`${API_URL}/api/announcements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(announcement),
    });
    return response.json();
  },
};

// Quizzes API calls
export const quizzesAPI = {
  getQuizzes: async () => {
    const response = await fetch(`${API_URL}/api/quizzes`);
    return response.json();
  },
  createQuiz: async (quiz) => {
    const response = await fetch(`${API_URL}/api/quizzes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quiz),
    });
    return response.json();
  },
  submitQuizResult: async (result) => {
    const response = await fetch(`${API_URL}/api/quizResults`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });
    return response.json();
  },
};

export const settingsAPI = {
  getSetting: async (key) => {
    const response = await fetch(`${API_URL}/api/settings/${key}`);
    if (!response.ok) {
      throw new Error(`Failed to get setting: ${response.statusText}`);
    }
    return response.json();
  },

  updateSetting: async (key, value) => {
    const response = await fetch(`${API_URL}/api/settings/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update setting: ${response.statusText}`);
    }
    return response.json();
  },
};
