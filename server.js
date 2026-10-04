const express = require('express');
const cors = require('cors');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db;

async function initDB() {
  db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      college TEXT NOT NULL,
      branch TEXT NOT NULL,
      section TEXT DEFAULT 'Section A',
      whatsapp TEXT NOT NULL,
      is_cr INTEGER DEFAULT 0,
      points INTEGER DEFAULT 50,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// 1. POST API: Save new student registration from index.html
app.post('/api/register', async (req, res) => {
  const { name, college, branch, section, whatsapp, isCR, code } = req.body;
  try {
    const points = isCR ? 100 : 50;
    await db.run(
      `INSERT INTO registrations (code, name, college, branch, section, whatsapp, is_cr, points)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, name, college, branch, section || 'Section A', whatsapp, isCR ? 1 : 0, points]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET API: Fetch all registrations for growth-ops.html
app.get('/api/leads', async (req, res) => {
  try {
    const leads = await db.all('SELECT * FROM registrations ORDER BY id DESC');
    res.json({ success: true, leads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

initDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});