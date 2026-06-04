const express = require('express');
const router = express.Router();
const { generateCode, analyzeError, fixCode } = require('../services/claudeService');
const { executeCode } = require('../services/executionService');

router.post('/', async (req, res) => {
  const { prompt, language = 'python', strategy = 'surgical' } = req.body;
  const maxAttempts = 5;
  const attempts = [];

  try {
    let code = await generateCode(prompt, language);
    let attempt = 1;

    while (attempt <= maxAttempts) {
      const result = await executeCode(code, language);

      const attemptData = {
        attempt,
        code,
        output: result.output,
        error: result.error,
        success: result.success
      };

      if (!result.success && result.error) {
        const analysis = await analyzeError(code, result.error, language);
        attemptData.analysis = analysis;
      }

      attempts.push(attemptData);

      if (result.success) {
        return res.json({
          success: true,
          finalCode: code,
          output: result.output,
          attempts
        });
      }

      if (attempt === maxAttempts) break;

      const fix = await fixCode(code, result.error, language, strategy);
      code = fix.fixedCode;
      attempts[attempts.length - 1].explanation = fix.explanation;

      attempt++;
    }

    res.json({
      success: false,
      message: 'Could not fix the code after maximum attempts',
      attempts
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;