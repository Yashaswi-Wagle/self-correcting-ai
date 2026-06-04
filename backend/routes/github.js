const express = require('express');
const router = express.Router();
const { createCodePR } = require('../services/githubService');

router.post('/create-pr', async (req, res) => {
  const { prompt, code, language, attempts } = req.body;

  if (!prompt || !code || !language) {
    return res.status(400).json({ success: false, error: 'prompt, code and language are required' });
  }

  try {
    const result = await createCodePR(prompt, code, language, attempts || []);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;