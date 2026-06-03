const express = require('express');
const router = express.Router();
const { generateCode, fixCode } = require('../services/claudeService');

router.post('/', async (req, res) => {
  const { prompt, language = 'python' } = req.body;

  try {
    const code = await generateCode(prompt, language);
    res.json({ success: true, code });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/fix', async (req, res) => {
  const { code, error, language, strategy } = req.body;

  try {
    const result = await fixCode(code, error, language, strategy);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;