const Groq = require('groq-sdk');

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function generateCode(userPrompt, language) {
  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Write ${language} code for the following task. Return ONLY the raw code, no explanation, no markdown, no backticks.

Task: ${userPrompt}`
      }
    ]
  });

  return response.choices[0].message.content;
}

async function fixCode(originalCode, error, language, strategy = 'surgical') {
  const strategies = {
    surgical: 'Fix only the specific lines causing the error. Minimal changes.',
    aggressive: 'Rewrite the entire solution from scratch.',
    conservative: 'Make the smallest possible change to fix the exact error.'
  };

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You wrote this ${language} code:

${originalCode}

It failed with this error:
${error}

Strategy: ${strategies[strategy]}

First, in one sentence explain the root cause.
Then on a new line write: FIXED_CODE:
Then provide the corrected code with no markdown or backticks.`
      }
    ]
  });

  const text = response.choices[0].message.content;
  const parts = text.split('FIXED_CODE:');

  return {
    explanation: parts[0].trim(),
    fixedCode: parts[1] ? parts[1].trim() : text
  };
}

module.exports = { generateCode, fixCode };