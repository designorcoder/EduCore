import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('educore.db');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Tables:', rows.map(r => r.name));
  }

  // Check settings
  db.all("SELECT * FROM settings", (err2, settings) => {
    if (err2) {
      console.error('Settings error:', err2);
    } else {
      console.log('Settings:', settings);
    }
    db.close();
  });
});