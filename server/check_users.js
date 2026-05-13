import sqlite3 from "sqlite3";

const db = new sqlite3.Database("educore.db");

db.all("SELECT id, username, role, metadata FROM users", (err, rows) => {
  if (err) {
    console.error("Error:", err);
  } else {
    console.log("All users:", rows);
  }
  db.close();
});
