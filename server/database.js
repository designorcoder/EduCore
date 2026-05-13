import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "educore.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Connected to SQLite database at:", dbPath);
  }
});

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// Initialize database schema
export const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL,
          fullName TEXT,
          phone TEXT,
          avatar TEXT,
          status TEXT DEFAULT 'Online',
          metadata TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        (err) => {
          if (err) console.error("Users table error:", err);
        },
      );

      db.all("PRAGMA table_info(users)", (err, columns) => {
        if (
          !err &&
          columns &&
          !columns.some((col) => col.name === "metadata")
        ) {
          db.run("ALTER TABLE users ADD COLUMN metadata TEXT", (alterErr) => {
            if (alterErr) console.error("Add metadata column error:", alterErr);
          });
        }
      });

      // Subjects table
      db.run(
        `CREATE TABLE IF NOT EXISTS subjects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          teacher TEXT,
          phone TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        (err) => {
          if (err) console.error("Subjects table error:", err);
        },
      );

      // Tasks table
      db.run(
        `CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          className TEXT,
          subject TEXT,
          subjectId TEXT,
          deadline TEXT,
          createdBy INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (createdBy) REFERENCES users(id)
        )`,
        (err) => {
          if (err) console.error("Tasks table error:", err);
        },
      );

      // Task completions table
      db.run(
        `CREATE TABLE IF NOT EXISTS taskCompletions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          taskId TEXT NOT NULL,
          studentId INTEGER NOT NULL,
          completed BOOLEAN DEFAULT 0,
          submissionFile TEXT,
          submittedAt DATETIME,

          -- teacher approval/rejection
          approved BOOLEAN DEFAULT 0,
          rejected BOOLEAN DEFAULT 0,

          status TEXT,

          FOREIGN KEY (taskId) REFERENCES tasks(id),
          FOREIGN KEY (studentId) REFERENCES users(id),
          UNIQUE(taskId, studentId)
        )`,
        (err) => {
          if (err) console.error("Task completions table error:", err);
        },
      );

      // Ensure approved/rejected columns exist for older DBs
      db.all(
        "PRAGMA table_info(taskCompletions)",
        (infoErr, columns) => {
          if (infoErr || !columns) return;
          const hasApproved = columns.some((c) => c.name === "approved");
          const hasRejected = columns.some((c) => c.name === "rejected");
          if (!hasApproved) {
            db.run("ALTER TABLE taskCompletions ADD COLUMN approved BOOLEAN DEFAULT 0");
          }
          if (!hasRejected) {
            db.run("ALTER TABLE taskCompletions ADD COLUMN rejected BOOLEAN DEFAULT 0");
          }
        },
      );

      // Attendance table
      db.run(
        `CREATE TABLE IF NOT EXISTS attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          className TEXT,
          studentId INTEGER NOT NULL,
          isPresent BOOLEAN,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (studentId) REFERENCES users(id)
        )`,
        (err) => {
          if (err) console.error("Attendance table error:", err);
        },
      );

      // Grades table
      db.run(
        `CREATE TABLE IF NOT EXISTS grades (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          className TEXT,
          subject TEXT,
          studentId INTEGER NOT NULL,
          grade REAL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (studentId) REFERENCES users(id)
        )`,
        (err) => {
          if (err) console.error("Grades table error:", err);
        },
      );

      // Messages table
      db.run(
        `CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          senderId INTEGER NOT NULL,
          receiverId INTEGER,
          groupId TEXT,
          text TEXT NOT NULL,
          attachment TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          read BOOLEAN DEFAULT 0,

          -- group chat read model
          readBy TEXT,

          FOREIGN KEY (senderId) REFERENCES users(id),
          FOREIGN KEY (receiverId) REFERENCES users(id)
        )`,
        (err) => {
          if (err) console.error("Messages table error:", err);
        },
      );

      // Ensure readBy column exists for older DBs
      db.all(
        "PRAGMA table_info(messages)",
        (infoErr, columns) => {
          if (infoErr || !columns) return;
          const hasReadBy = columns.some((c) => c.name === "readBy");
          if (!hasReadBy) {
            db.run("ALTER TABLE messages ADD COLUMN readBy TEXT");
          }
        },
      );

      // Announcements table
      db.run(
        `CREATE TABLE IF NOT EXISTS announcements (
          id TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          author INTEGER NOT NULL,
          targetClass TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (author) REFERENCES users(id)
        )`,
        (err) => {
          if (err) console.error("Announcements table error:", err);
        },
      );

      // Settings table for app-wide settings like schedule
      db.run(
        `CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        (err) => {
          if (err) console.error("Settings table error:", err);
        },
      );

      // Quizzes table
      db.run(
        `CREATE TABLE IF NOT EXISTS quizzes (
          id TEXT PRIMARY KEY,
          subject TEXT,
          className TEXT,
          title TEXT NOT NULL,
          questions TEXT,
          createdBy INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (createdBy) REFERENCES users(id)
        )`,
        (err) => {
          if (err) console.error("Quizzes table error:", err);
        },
      );

      // Quiz results table
      db.run(
        `CREATE TABLE IF NOT EXISTS quizResults (
          id TEXT PRIMARY KEY,
          quizId TEXT NOT NULL,
          studentId INTEGER NOT NULL,
          score REAL,
          answers TEXT,
          submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (quizId) REFERENCES quizzes(id),
          FOREIGN KEY (studentId) REFERENCES users(id)
        )`,
        (err) => {
          if (err) console.error("Quiz results table error:", err);
          // seed default data after schema creation
          db.get("SELECT COUNT(*) as count FROM users", (countErr, row) => {
            if (!countErr && row && row.count === 0) {
              db.run(
                "INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, ?)",
                ["admin", "123", "admin", "Online"],
              );
            }
          });

          db.get("SELECT COUNT(*) as count FROM subjects", (countErr, row) => {
            if (!countErr && row && row.count === 0) {
              const seedSubjects = [
                ["matematika", "Matematika", "Shox", "+998901112233"],
                ["ona-tili", "Ona tili", "Dilnoza", "+998901112244"],
                ["ingliz-tili", "Ingliz tili", "Jasur", "+998901112255"],
                ["tarix", "Tarix", "Aziz", "+998901112266"],
              ];
              const stmt = db.prepare(
                "INSERT INTO subjects (id, name, teacher, phone) VALUES (?, ?, ?, ?)",
              );
              for (const subject of seedSubjects) {
                stmt.run(subject);
              }
              stmt.finalize();
            }
          });

          // Seed settings if empty
          db.get("SELECT COUNT(*) as count FROM settings", (countErr, row) => {
            if (!countErr && row && row.count === 0) {
              const defaultSchedule = {
                monday: [
                  {
                    time: "08:00-09:00",
                    subject: "matematika",
                    teacher: "Shox",
                  },
                  {
                    time: "09:00-10:00",
                    subject: "ona-tili",
                    teacher: "Dilnoza",
                  },
                  {
                    time: "10:00-11:00",
                    subject: "ingliz-tili",
                    teacher: "Jasur",
                  },
                  { time: "11:00-12:00", subject: "tarix", teacher: "Aziz" },
                ],
                tuesday: [
                  {
                    time: "08:00-09:00",
                    subject: "ona-tili",
                    teacher: "Dilnoza",
                  },
                  {
                    time: "09:00-10:00",
                    subject: "matematika",
                    teacher: "Shox",
                  },
                  { time: "10:00-11:00", subject: "tarix", teacher: "Aziz" },
                  {
                    time: "11:00-12:00",
                    subject: "ingliz-tili",
                    teacher: "Jasur",
                  },
                ],
                wednesday: [
                  {
                    time: "08:00-09:00",
                    subject: "ingliz-tili",
                    teacher: "Jasur",
                  },
                  { time: "09:00-10:00", subject: "tarix", teacher: "Aziz" },
                  {
                    time: "10:00-11:00",
                    subject: "matematika",
                    teacher: "Shox",
                  },
                  {
                    time: "11:00-12:00",
                    subject: "ona-tili",
                    teacher: "Dilnoza",
                  },
                ],
                thursday: [
                  { time: "08:00-09:00", subject: "tarix", teacher: "Aziz" },
                  {
                    time: "09:00-10:00",
                    subject: "ingliz-tili",
                    teacher: "Jasur",
                  },
                  {
                    time: "10:00-11:00",
                    subject: "ona-tili",
                    teacher: "Dilnoza",
                  },
                  {
                    time: "11:00-12:00",
                    subject: "matematika",
                    teacher: "Shox",
                  },
                ],
                friday: [
                  {
                    time: "08:00-09:00",
                    subject: "matematika",
                    teacher: "Shox",
                  },
                  {
                    time: "09:00-10:00",
                    subject: "ona-tili",
                    teacher: "Dilnoza",
                  },
                  {
                    time: "10:00-11:00",
                    subject: "ingliz-tili",
                    teacher: "Jasur",
                  },
                  { time: "11:00-12:00", subject: "tarix", teacher: "Aziz" },
                ],
              };
              db.run(
                "INSERT INTO settings (key, value) VALUES (?, ?)",
                ["schedule", JSON.stringify(defaultSchedule)],
                (err) => {
                  if (err) console.error("Settings seeding error:", err);
                },
              );
            }
          });

          resolve();
        },
      );
    });
  });
};

export default db;
