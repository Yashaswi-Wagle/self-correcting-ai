import React, { useState } from 'react';
import axios from 'axios';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import java from 'react-syntax-highlighter/dist/esm/languages/hljs/java';
import cpp from 'react-syntax-highlighter/dist/esm/languages/hljs/cpp';
import './index.css';

SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('cpp', cpp);

const API = 'http://localhost:5000/api';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('python');
  const [strategy, setStrategy] = useState('surgical');
  const [sessionName, setSessionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ text: 'Ready', type: 'idle' });
  const [result, setResult] = useState(null);
  const [prUrl, setPrUrl] = useState(null);
  const [prLoading, setPrLoading] = useState(false);

  async function handleRun() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    setPrUrl(null);
    setStatus({ text: 'Thinking... generating code', type: 'thinking' });

    try {
      setStatus({ text: 'Running code in Docker sandbox...', type: 'running' });
      const res = await axios.post(`${API}/generate`, {
        prompt,
        language,
        strategy,
        sessionName: sessionName || `Session ${new Date().toLocaleString()}`
      });

      setResult(res.data);

      if (res.data.success) {
        setStatus({ text: `✅ Success in ${res.data.attempts.length} attempt(s)!`, type: 'success' });
      } else {
        setStatus({ text: `❌ Failed after ${res.data.attempts.length} attempts`, type: 'error' });
      }
    } catch (err) {
      setStatus({ text: '❌ Error connecting to backend', type: 'error' });
    }

    setLoading(false);
  }

  async function handleCreatePR() {
    if (!result) return;
    setPrLoading(true);
    try {
      const res = await axios.post(`${API}/github/create-pr`, {
        prompt,
        code: result.finalCode,
        language,
        attempts: result.attempts
      });
      setPrUrl(res.data.prUrl);
    } catch (err) {
      alert('Failed to create PR: ' + err.message);
    }
    setPrLoading(false);
  }

  return (
    <div className="app">
      <div className="header">
        <h1>⚡ Self-Correcting AI</h1>
        <p>Write → Run → Analyze → Fix → Repeat. Automatically.</p>
      </div>

      <div className="input-section">
        <div className="input-row">
          <input
            className="prompt-input"
            type="text"
            placeholder="Describe what code you want... (e.g. print fibonacci sequence)"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRun()}
          />
          <select className="select-input" value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <select className="select-input" value={strategy} onChange={e => setStrategy(e.target.value)}>
            <option value="surgical">Surgical Fix</option>
            <option value="aggressive">Aggressive Rewrite</option>
            <option value="conservative">Conservative Fix</option>
          </select>
        </div>
        <div className="options-row">
          <input
            className="session-input"
            type="text"
            placeholder="Session name (optional)"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
          />
          <button className="run-btn" onClick={handleRun} disabled={loading || !prompt.trim()}>
            {loading ? 'Running...' : '▶ Run'}
          </button>
        </div>
      </div>

      <div className="status-bar">
        <div className={`status-dot ${status.type}`}></div>
        <span>{status.text}</span>
        {result && result.quality && (
          <span className={`quality-badge ${result.quality.passed ? 'pass' : 'fail'}`}>
            Quality: {result.quality.score}/100
          </span>
        )}
      </div>

      {result ? (
        <>
          <div className="results-grid">
            <div className="panel">
              <div className="panel-header">
                <span>Final Code</span>
                <span>{language}</span>
              </div>
              <div className="panel-content">
                <SyntaxHighlighter
                  language={language === 'cpp' ? 'cpp' : language}
                  style={atomOneDark}
                  customStyle={{ background: 'transparent', fontSize: '0.85rem' }}
                >
                  {result.finalCode || '// No code generated'}
                </SyntaxHighlighter>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span>Output</span>
                <span>{result.success ? '✅ Passed' : '❌ Failed'}</span>
              </div>
              <div className="panel-content">
                {result.output ? (
                  <pre className="output-text">{result.output}</pre>
                ) : (
                  <pre className="error-text">{result.message || 'No output'}</pre>
                )}
              </div>
            </div>
          </div>

          {result.success && (
            <div className="pr-section">
              <div>
                <strong>Push to GitHub</strong>
                <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  Create a Pull Request with this AI-generated code
                </p>
              </div>
              {prUrl ? (
                <a className="pr-link" href={prUrl} target="_blank" rel="noreferrer">
                  ✅ View Pull Request →
                </a>
              ) : (
                <button className="pr-btn" onClick={handleCreatePR} disabled={prLoading}>
                  {prLoading ? 'Creating PR...' : '🐙 Create GitHub PR'}
                </button>
              )}
            </div>
          )}

          <div className="attempts-section">
            <h3>Attempt History ({result.attempts.length} attempts)</h3>
            {result.attempts.map((a, i) => (
              <div key={i} className={`attempt-card ${a.success ? 'success' : 'failed'}`}>
                <div className="attempt-header">
                  <span className="attempt-number">Attempt {a.attempt}</span>
                  <span className={`attempt-badge ${a.success ? 'success' : 'failed'}`}>
                    {a.success ? '✅ Passed' : '❌ Failed'}
                  </span>
                </div>
                <SyntaxHighlighter
                  language={language}
                  style={atomOneDark}
                  customStyle={{ background: '#0a0a1a', fontSize: '0.8rem', borderRadius: '8px' }}
                >
                  {a.code}
                </SyntaxHighlighter>
                {a.analysis && (
                  <div className="analysis-box">
                    <h4>🔍 Root Cause Analysis</h4>
                    <p><strong>Type:</strong> {a.analysis.errorType}</p>
                    <p><strong>Cause:</strong> {a.analysis.rootCause}</p>
                    <p><strong>Fix needed:</strong> {a.analysis.fixNeeded}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <p>Enter a prompt above and hit Run to see the AI self-correct in real time ⚡</p>
        </div>
      )}
    </div>
  );
}