const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const LANGUAGE_CONFIG = {
  python: {
    image: 'python:3.12-slim',
    filename: 'main.py',
    runCmd: 'python main.py'
  },
  java: {
    image: 'eclipse-temurin:21',
    filename: 'Main.java',
    runCmd: 'javac Main.java && java Main'
  },
  cpp: {
    image: 'gcc:latest',
    filename: 'main.cpp',
    runCmd: 'g++ main.cpp -o out && ./out'
  }
};

function executeCode(code, language) {
  return new Promise((resolve) => {
    const config = LANGUAGE_CONFIG[language];

    if (!config) {
      return resolve({ success: false, output: '', error: `Unsupported language: ${language}` });
    }

    const tmpDir = path.join(__dirname, '../tmp', `run_${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    const filePath = path.join(tmpDir, config.filename);
    fs.writeFileSync(filePath, code);

    const dockerCmd = `docker run --rm --network none --memory 128m --cpus 0.5 -v "${tmpDir}:/code" -w /code ${config.image} sh -c "${config.runCmd}"`;

    exec(dockerCmd, { timeout: 10000 }, (error, stdout, stderr) => {
      fs.rmSync(tmpDir, { recursive: true, force: true });

      if (error && !stdout) {
        resolve({ success: false, output: '', error: stderr || error.message });
      } else {
        resolve({ success: true, output: stdout.trim(), error: stderr || '' });
      }
    });
  });
}

module.exports = { executeCode };