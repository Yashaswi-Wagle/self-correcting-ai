const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { generateCode, analyzeError, fixCode } = require('../services/claudeService');
const { executeCode } = require('../services/executionService');
const { lintCode } = require('../services/lintService');
const { createSession, saveAttempt } = require('../services/dbService');

router.post('/', async (req, res) => {
  const { prompt, language = 'python', strategy = 'surgical', sessionName } = req.body;
  const maxAttempts = 5;
  const attempts = [];

  const sessionId = uuidv4();
  const name = sessionName || `Session ${new Date().toLocaleString()}`;
  createSession(sessionId, name, language);

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
        const lint = await lintCode(code, language);

        saveAttempt(sessionId, {
          attemptNumber: attempt,
          prompt,
          code,
          output: result.output,
          error: result.error,
          success: true,
          strategy,
          qualityScore: lint.score
        });

        return res.json({
          success: true,
          sessionId,
          finalCode: code,
          output: result.output,
          quality: {
            passed: lint.passed,
            score: lint.score,
            issues: lint.issues
          },
          attempts
        });
      }

      saveAttempt(sessionId, {
        attemptNumber: attempt,
        prompt,
        code,
        output: result.output,
        error: result.error,
        success: false,
        analysis: attemptData.analysis,
        strategy
      });

      if (attempt === maxAttempts) break;

      const fix = await fixCode(code, result.error, language, strategy);
      code = fix.fixedCode;
      attempts[attempts.length - 1].explanation = fix.explanation;

      attempt++;
    }

    res.json({
      success: false,
      sessionId,
      message: 'Could not fix the code after maximum attempts',
      attempts
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;