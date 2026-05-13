import pg from 'pg';
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error("Database connection error:", err);
});

// Initialize database schema
export const initializeDatabase = async () => {
  try {
    const urlParts = process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@') : [];
    console.log("Connected to PostgreSQL database at:", urlParts.length > 1 ? urlParts[1] : "unknown");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        "fullName" VARCHAR(255),
        phone VARCHAR(50),
        avatar TEXT,
        status VARCHAR(50) DEFAULT 'Online',
        metadata TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        teacher VARCHAR(255),
        phone VARCHAR(50),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        "className" VARCHAR(255),
        subject VARCHAR(255),
        "subjectId" VARCHAR(255),
        deadline VARCHAR(255),
        "createdBy" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "taskCompletions" (
        id SERIAL PRIMARY KEY,
        "taskId" VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        "studentId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        completed INTEGER DEFAULT 0,
        "submissionFile" TEXT,
        "submittedAt" TIMESTAMP,
        approved INTEGER DEFAULT 0,
        rejected INTEGER DEFAULT 0,
        status VARCHAR(50),
        UNIQUE("taskId", "studentId")
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        date VARCHAR(50) NOT NULL,
        "className" VARCHAR(255),
        "studentId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "isPresent" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS grades (
        id SERIAL PRIMARY KEY,
        date VARCHAR(50) NOT NULL,
        "className" VARCHAR(255),
        subject VARCHAR(255),
        "studentId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        grade REAL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        "senderId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "receiverId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "groupId" VARCHAR(255),
        text TEXT NOT NULL,
        attachment TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read INTEGER DEFAULT 0,
        "readBy" TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id VARCHAR(255) PRIMARY KEY,
        text TEXT NOT NULL,
        author INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "targetClass" VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id VARCHAR(255) PRIMARY KEY,
        subject VARCHAR(255),
        "className" VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        questions TEXT,
        "createdBy" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "quizResults" (
        id VARCHAR(255) PRIMARY KEY,
        "quizId" VARCHAR(255) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        "studentId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        score REAL,
        answers TEXT,
        "submittedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default data
    const userRes = await pool.query("SELECT COUNT(*) FROM users");
    if (parseInt(userRes.rows[0].count) === 0) {
      await pool.query(
        "INSERT INTO users (username, password, role, status) VALUES ($1, $2, $3, $4)",
        ["admin", "123", "admin", "Online"]
      );
    }

    const subRes = await pool.query("SELECT COUNT(*) FROM subjects");
    if (parseInt(subRes.rows[0].count) === 0) {
      const seedSubjects = [
        ["matematika", "Matematika", "Shox", "+998901112233"],
        ["ona-tili", "Ona tili", "Dilnoza", "+998901112244"],
        ["ingliz-tili", "Ingliz tili", "Jasur", "+998901112255"],
        ["tarix", "Tarix", "Aziz", "+998901112266"]
      ];
      for (const subject of seedSubjects) {
        await pool.query(
          "INSERT INTO subjects (id, name, teacher, phone) VALUES ($1, $2, $3, $4)",
          subject
        );
      }
    }

    const setRes = await pool.query("SELECT COUNT(*) FROM settings");
    if (parseInt(setRes.rows[0].count) === 0) {
      const defaultSchedule = {
        monday: [{ time: "08:00-09:00", subject: "matematika", teacher: "Shox" }, { time: "09:00-10:00", subject: "ona-tili", teacher: "Dilnoza" }, { time: "10:00-11:00", subject: "ingliz-tili", teacher: "Jasur" }, { time: "11:00-12:00", subject: "tarix", teacher: "Aziz" }],
        tuesday: [{ time: "08:00-09:00", subject: "ona-tili", teacher: "Dilnoza" }, { time: "09:00-10:00", subject: "matematika", teacher: "Shox" }, { time: "10:00-11:00", subject: "tarix", teacher: "Aziz" }, { time: "11:00-12:00", subject: "ingliz-tili", teacher: "Jasur" }],
        wednesday: [{ time: "08:00-09:00", subject: "ingliz-tili", teacher: "Jasur" }, { time: "09:00-10:00", subject: "tarix", teacher: "Aziz" }, { time: "10:00-11:00", subject: "matematika", teacher: "Shox" }, { time: "11:00-12:00", subject: "ona-tili", teacher: "Dilnoza" }],
        thursday: [{ time: "08:00-09:00", subject: "tarix", teacher: "Aziz" }, { time: "09:00-10:00", subject: "ingliz-tili", teacher: "Jasur" }, { time: "10:00-11:00", subject: "ona-tili", teacher: "Dilnoza" }, { time: "11:00-12:00", subject: "matematika", teacher: "Shox" }],
        friday: [{ time: "08:00-09:00", subject: "matematika", teacher: "Shox" }, { time: "09:00-10:00", subject: "ona-tili", teacher: "Dilnoza" }, { time: "10:00-11:00", subject: "ingliz-tili", teacher: "Jasur" }, { time: "11:00-12:00", subject: "tarix", teacher: "Aziz" }]
      };
      await pool.query(
        "INSERT INTO settings (key, value) VALUES ($1, $2)",
        ["schedule", JSON.stringify(defaultSchedule)]
      );
    }
  } catch (err) {
    console.error("Error initializing database:", err);
  }
};

export default pool;
