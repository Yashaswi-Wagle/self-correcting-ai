const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../data');
fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(path.join(dbDir, 'sessions.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    language TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    attempt_number INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    code TEXT NOT NULL,
    output TEXT,
    error TEXT,
    success INTEGER,
    analysis TEXT,
    explanation TEXT,
    strategy TEXT,
    quality_score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );
`);

function createSession(id, name, language) {
  const stmt = db.prepare('INSERT INTO sessions (id, name, language) VALUES (?, ?, ?)');
  stmt.run(id, name, language);
  return getSession(id);
}

function getSession(id) {
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
}

function getAllSessions() {
  return db.prepare('SELECT * FROM sessions ORDER BY updated_at DESC').all();
}

function saveAttempt(sessionId, data) {
  const stmt = db.prepare(`
    INSERT INTO attempts (session_id, attempt_number, prompt, code, output, error, success, analysis, explanation, strategy, quality_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    sessionId,
    data.attemptNumber,
    data.prompt,
    data.code,
    data.output || '',
    data.error || '',
    data.success ? 1 : 0,
    data.analysis ? JSON.stringify(data.analysis) : null,
    data.explanation || null,
    data.strategy || 'surgical',
    data.qualityScore || null
  );

  db.prepare('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(sessionId);
}

function getSessionAttempts(sessionId) {
  const attempts = db.prepare('SELECT * FROM attempts WHERE session_id = ? ORDER BY attempt_number ASC').all(sessionId);
  return attempts.map(a => ({
    ...a,
    analysis: a.analysis ? JSON.parse(a.analysis) : null,
    success: a.success === 1
  }));
}

function deleteSession(id) {
  db.prepare('DELETE FROM attempts WHERE session_id = ?').run(id);
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
}

module.exports = { createSession, getSession, getAllSessions, saveAttempt, getSessionAttempts, deleteSession };