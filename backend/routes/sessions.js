const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { createSession, getSession, getAllSessions, getSessionAttempts, deleteSession } = require('../services/dbService');

router.get('/', (req, res) => {
  const sessions = getAllSessions();
  res.json({ success: true, sessions });
});

router.post('/', (req, res) => {
  const { name, language = 'python' } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Session name is required' });
  const id = uuidv4();
  const session = createSession(id, name, language);
  res.json({ success: true, session });
});

router.get('/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
  const attempts = getSessionAttempts(req.params.id);
  res.json({ success: true, session, attempts });
});

router.delete('/:id', (req, res) => {
  deleteSession(req.params.id);
  res.json({ success: true, message: 'Session deleted' });
});

module.exports = router;