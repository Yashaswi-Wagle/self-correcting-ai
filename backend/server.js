const express = require('express');
const cors = require('cors');
require('dotenv').config();

const generateRoute = require('./routes/generate');
const sessionsRoute = require('./routes/sessions');
const githubRoute = require('./routes/github');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'Self-Correcting AI Backend is running' });
});

app.use('/api/generate', generateRoute);
app.use('/api/sessions', sessionsRoute);
app.use('/api/github', githubRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});