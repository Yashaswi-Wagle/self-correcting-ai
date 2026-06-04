const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function lintCode(code, language) {
  return new Promise((resolve) => {
    const tmpDir = path.join(__dirname, '../tmp', `lint_${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    let filename, dockerCmd;

    if (language === 'python') {
      filename = 'main.py';
      fs.writeFileSync(path.join(tmpDir, filename), code);
      dockerCmd = `docker run --rm --network none -v "${tmpDir}:/code" -w /code python:3.12-slim sh -c "python -m py_compile main.py && echo 'No syntax errors'"`;
    } else if (language === 'java') {
      filename = 'Main.java';
      fs.writeFileSync(path.join(tmpDir, filename), code);
      dockerCmd = `docker run --rm --network none -v "${tmpDir}:/code" -w /code eclipse-temurin:21 sh -c "javac Main.java 2>&1 && echo 'No syntax errors'"`;
    } else if (language === 'cpp') {
      filename = 'main.cpp';
      fs.writeFileSync(path.join(tmpDir, filename), code);
      dockerCmd = `docker run --rm --network none -v "${tmpDir}:/code" -w /code gcc:latest sh -c "g++ -Wall -Wextra main.cpp -o /dev/null 2>&1 && echo 'No syntax errors'"`;
    } else {
      return resolve({ passed: false, issues: [`Unsupported language: ${language}`], score: 0 });
    }

    exec(dockerCmd, { timeout: 30000 }, (error, stdout, stderr) => {
      fs.rmSync(tmpDir, { recursive: true, force: true });

      const output = (stdout + stderr).trim();
      const lines = output.split('\n').filter(l => l.trim());
      const issues = lines.filter(l => !l.includes('No syntax errors'));
      const passed = issues.length === 0;
      const score = passed ? 100 : Math.max(0, 100 - issues.length * 10);

      resolve({ passed, issues, score });
    });
  });
}

module.exports = { lintCode };