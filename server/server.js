import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import db, { initializeDatabase } from "./database.js";
import { v4 as uuidv4 } from "uuid";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Initialize database
console.log("Initializing database...");
await initializeDatabase();
console.log("Database initialized successfully");

// Helper function to run db queries
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// ===== AUTH ENDPOINTS =====
// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await dbAll("SELECT * FROM users");
    const usersWithMetadata = users.map((user) => {
      const metadata = user.metadata ? JSON.parse(user.metadata) : {};
      return {
        ...user,
        metadata,
        class: metadata.class || null,
        subject: metadata.subject || null,
      };
    });
    res.json(usersWithMetadata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await dbGet(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [username, password],
    );
    if (user) {
      const metadata = user.metadata ? JSON.parse(user.metadata) : {};
      res.json({
        ...user,
        metadata,
        class: metadata.class || null,
        subject: metadata.subject || null,
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
app.post("/api/users", async (req, res) => {
  try {
    const { username, password, role, fullName, phone, metadata } = req.body;
    const result = await dbRun(
      "INSERT INTO users (username, password, role, fullName, phone, metadata) VALUES (?, ?, ?, ?, ?, ?)",
      [
        username,
        password,
        role,
        fullName || "",
        phone || "",
        metadata ? JSON.stringify(metadata) : null,
      ],
    );
    const user = await dbGet("SELECT * FROM users WHERE id = ?", [
      result.lastID,
    ]);
    const userMetadata = user.metadata ? JSON.parse(user.metadata) : {};
    res.json({
      ...user,
      metadata: userMetadata,
      class: userMetadata.class || null,
      subject: userMetadata.subject || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
app.delete("/api/users/:id", async (req, res) => {
  try {
    await dbRun("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== BULK DELETE (Admin) =====
// Delete all users by role (student/parent).
// Deletes dependent rows first to avoid FK constraint issues.
app.delete("/api/users/role/:role", async (req, res) => {
  try {
    const { role } = req.params;

    if (!["student", "parent"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // For students: dependent rows in taskCompletions/attendance/grades/messages
    if (role === "student") {
      await dbRun(
        `DELETE FROM taskCompletions
         WHERE studentId IN (SELECT id FROM users WHERE role = ?)`,
        [role],
      );
      await dbRun(
        `DELETE FROM attendance
         WHERE studentId IN (SELECT id FROM users WHERE role = ?)`,
        [role],
      );
      await dbRun(
        `DELETE FROM grades
         WHERE studentId IN (SELECT id FROM users WHERE role = ?)`,
        [role],
      );
      await dbRun(
        `DELETE FROM messages
         WHERE senderId IN (SELECT id FROM users WHERE role = ?)
            OR receiverId IN (SELECT id FROM users WHERE role = ?)`,
        [role, role],
      );
    }

    // For parents: only messages depend (sender/receiver)
    if (role === "parent") {
      await dbRun(
        `DELETE FROM messages
         WHERE senderId IN (SELECT id FROM users WHERE role = ?)
            OR receiverId IN (SELECT id FROM users WHERE role = ?)`,
        [role, role],
      );
    }

    await dbRun(`DELETE FROM users WHERE role = ?`, [role]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
app.put("/api/users/:id", async (req, res) => {
  try {
    const { fullName, phone, avatar, status } = req.body;
    await dbRun(
      "UPDATE users SET fullName = ?, phone = ?, avatar = ?, status = ? WHERE id = ?",
      [fullName, phone, avatar, status, req.params.id],
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== SUBJECT ENDPOINTS =====
// Get all subjects
app.get("/api/subjects", async (req, res) => {
  try {
    const subjects = await dbAll("SELECT * FROM subjects");
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add subject
app.post("/api/subjects", async (req, res) => {
  try {
    const { name, teacher, phone } = req.body;
    const id = name.toLowerCase().replace(/\s+/g, "-");
    await dbRun(
      "INSERT INTO subjects (id, name, teacher, phone) VALUES (?, ?, ?, ?)",
      [id, name, teacher, phone],
    );
    res.json({ id, name, teacher, phone });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete subject
app.delete("/api/subjects/:id", async (req, res) => {
  try {
    await dbRun("DELETE FROM subjects WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TASK ENDPOINTS =====
// Get all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await dbAll("SELECT * FROM tasks");
    const completions = await dbAll("SELECT * FROM taskCompletions");
    const tasksWithCompletions = tasks.map((task) => ({
      ...task,
      task: task.title,
      completedBy: completions
        .filter((c) => c.taskId === task.id)
        .map((c) => ({
          studentId: c.studentId,
          completed: c.completed,
          submissionFile: c.submissionFile,
          status: c.status,

          // teacher decision persisted
          approved: c.approved ? 1 : 0,
          rejected: c.rejected ? 1 : 0,
        })),
    }));
    res.json(tasksWithCompletions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
app.post("/api/tasks", async (req, res) => {
  try {
    const {
      title,
      description,
      className,
      subject,
      subjectId,
      deadline,
      createdBy,
    } = req.body;
    const id = uuidv4();
    await dbRun(
      "INSERT INTO tasks (id, title, description, className, subject, subjectId, deadline, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        title,
        description,
        className,
        subject,
        subjectId,
        deadline,
        createdBy,
      ],
    );
    res.json({
      id,
      title,
      task: title,
      description,
      className,
      subject,
      subjectId,
      deadline,
      completedBy: [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Student submit: task completion + file (toggle/re-upload)
 * approved/rejected teacher state saqlanadi.
 */
app.post("/api/tasks/:taskId/toggle", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { studentId, completed, submissionFile, status } = req.body;

    // Keep existing approved/rejected flags if row exists.
    await dbRun(
      `
      INSERT INTO taskCompletions (taskId, studentId, completed, submissionFile, submittedAt, status, approved, rejected)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 
        COALESCE((SELECT approved FROM taskCompletions WHERE taskId = ? AND studentId = ?), 0),
        COALESCE((SELECT rejected FROM taskCompletions WHERE taskId = ? AND studentId = ?), 0)
      )
      ON CONFLICT(taskId, studentId) DO UPDATE SET
        completed = excluded.completed,
        submissionFile = excluded.submissionFile,
        submittedAt = CURRENT_TIMESTAMP,
        status = excluded.status
      `,
      [
        taskId,
        studentId,
        completed ? 1 : 0,
        submissionFile || null,
        status || "pending",

        // for approved/rejected subqueries (insert values)
        taskId,
        studentId,
        taskId,
        studentId,
      ],
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Teacher approval/rejection for a student's submission
 */
app.post("/api/tasks/:taskId/decision", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { studentId, decision, status } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: "studentId is required" });
    }
    if (!decision || !["approved", "rejected"].includes(decision)) {
      return res
        .status(400)
        .json({ error: 'decision must be "approved" or "rejected"' });
    }

    const approved = decision === "approved" ? 1 : 0;
    const rejected = decision === "rejected" ? 1 : 0;

    await dbRun(
      `
      INSERT INTO taskCompletions (
        taskId,
        studentId,
        completed,
        submissionFile,
        submittedAt,
        status,
        approved,
        rejected
      )
      VALUES (
        ?,
        ?,
        1,
        NULL,
        CURRENT_TIMESTAMP,
        ?,
        ?,
        ?
      )
      ON CONFLICT(taskId, studentId) DO UPDATE SET
        completed = 1,
        status = excluded.status,
        submissionFile = COALESCE(taskCompletions.submissionFile, excluded.submissionFile),
        approved = excluded.approved,
        rejected = excluded.rejected
    `,
      [
        taskId,
        studentId,
        status || (decision === "approved" ? "approved" : "rejected"),
        approved,
        rejected,
      ],
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    await dbRun("DELETE FROM tasks WHERE id = ?", [req.params.id]);
    await dbRun("DELETE FROM taskCompletions WHERE taskId = ?", [
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ATTENDANCE ENDPOINTS =====
// Get attendance
app.get("/api/attendance", async (req, res) => {
  try {
    const attendance = await dbAll("SELECT * FROM attendance");
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record attendance
app.post("/api/attendance", async (req, res) => {
  try {
    const { date, className, studentId, isPresent } = req.body;
    await dbRun(
      "INSERT INTO attendance (date, className, studentId, isPresent) VALUES (?, ?, ?, ?)",
      [date, className, studentId, isPresent ? 1 : 0],
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== GRADES ENDPOINTS =====
// Get grades
app.get("/api/grades", async (req, res) => {
  try {
    const grades = await dbAll("SELECT * FROM grades");
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record grade
app.post("/api/grades", async (req, res) => {
  try {
    const { date, className, subject, studentId, grade } = req.body;
    await dbRun(
      "INSERT INTO grades (date, className, subject, studentId, grade) VALUES (?, ?, ?, ?, ?)",
      [date, className, subject, studentId, grade],
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== MESSAGES ENDPOINTS =====
// Get messages
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await dbAll(
      "SELECT * FROM messages ORDER BY timestamp DESC",
    );
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message
app.post("/api/messages", async (req, res) => {
  try {
    const { senderId, receiverId, groupId, text, attachment } = req.body;
    const id = uuidv4();
    await dbRun(
      "INSERT INTO messages (id, senderId, receiverId, groupId, text, attachment) VALUES (?, ?, ?, ?, ?, ?)",
      [
        id,
        senderId,
        receiverId || null,
        groupId || null,
        text,
        attachment || null,
      ],
    );
    res.json({
      id,
      senderId,
      receiverId,
      groupId,
      text,
      attachment,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark message as read (private chat model)
app.put("/api/messages/:id/read", async (req, res) => {
  try {
    await dbRun("UPDATE messages SET read = 1 WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark message as read for group chat (readBy model)
app.put("/api/messages/:id/readBy", async (req, res) => {
  try {
    const { myId } = req.body;
    if (!myId) return res.status(400).json({ error: "myId is required" });

    const message = await dbGet("SELECT readBy FROM messages WHERE id = ?", [req.params.id]);
    const existing = message?.readBy;

    let readByArr = [];
    try {
      if (existing) {
        // store as JSON string (recommended) OR fallback "1,2"
        readByArr = JSON.parse(existing);
        if (!Array.isArray(readByArr)) readByArr = [];
      }
    } catch {
      readByArr = typeof existing === "string" ? existing.split(",").map((x) => Number(x)).filter(Boolean) : [];
    }

    const myIdNum = Number(myId);
    if (!readByArr.includes(myIdNum)) readByArr.push(myIdNum);

    await dbRun("UPDATE messages SET readBy = ? WHERE id = ?", [JSON.stringify(readByArr), req.params.id]);
    res.json({ success: true, readBy: readByArr });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ANNOUNCEMENTS ENDPOINTS =====
// Get announcements
app.get("/api/announcements", async (req, res) => {
  try {
    const announcements = await dbAll(
      "SELECT * FROM announcements ORDER BY timestamp DESC",
    );
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create announcement
app.post("/api/announcements", async (req, res) => {
  try {
    const { text, author, targetClass } = req.body;
    const id = uuidv4();
    await dbRun(
      "INSERT INTO announcements (id, text, author, targetClass) VALUES (?, ?, ?, ?)",
      [id, text, author, targetClass],
    );
    res.json({ id, text, author, targetClass, timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== QUIZZES ENDPOINTS =====
// Get quizzes
app.get("/api/quizzes", async (req, res) => {
  try {
    const quizzes = await dbAll("SELECT * FROM quizzes");
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create quiz
app.post("/api/quizzes", async (req, res) => {
  try {
    const { subject, className, title, questions, createdBy } = req.body;
    const id = uuidv4();
    await dbRun(
      "INSERT INTO quizzes (id, subject, className, title, questions, createdBy) VALUES (?, ?, ?, ?, ?, ?)",
      [id, subject, className, title, JSON.stringify(questions), createdBy],
    );
    res.json({ id, subject, className, title, questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit quiz result
app.post("/api/quizResults", async (req, res) => {
  try {
    const { quizId, studentId, score, answers } = req.body;
    const id = uuidv4();
    await dbRun(
      "INSERT INTO quizResults (id, quizId, studentId, score, answers) VALUES (?, ?, ?, ?, ?)",
      [id, quizId, studentId, score, JSON.stringify(answers)],
    );
    res.json({ id, quizId, studentId, score });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== SETTINGS ENDPOINTS =====
// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Test route works" });
});

// Get setting by key
app.get("/api/settings/:key", async (req, res) => {
  console.log(`GET /api/settings/${req.params.key}`);
  try {
    const { key } = req.params;
    const setting = await dbGet("SELECT * FROM settings WHERE key = ?", [key]);
    if (!setting) {
      return res.status(404).json({ error: "Setting not found" });
    }
    res.json({ key: setting.key, value: JSON.parse(setting.value) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update setting
app.put("/api/settings/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    await dbRun(
      "INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, datetime('now'))",
      [key, JSON.stringify(value)],
    );
    res.json({ key, value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 EduCore backend running on http://localhost:${PORT}`);
});
