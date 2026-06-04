# Self-Correcting AI Code Assistant

I built this project to explore what happens when you give an AI the ability to run its own code and fix its own mistakes — without any human intervention.

## What it does

You type a task. The AI writes code, runs it in a sandboxed Docker container, and if it fails, it reads the error, figures out what went wrong, and tries again. It keeps doing this until the code works or it hits the retry limit.

## Demo

- Type: "print fibonacci sequence in Java"
- Watch it fail on attempt 1 (class name mismatch)
- Watch it analyze the error and fix it on attempt 2
- Get a quality score and a GitHub PR automatically

## Features

- Writes code in Python, Java, and C++
- Runs code safely inside Docker containers
- Explains why the code failed, not just what failed
- Three fix strategies — surgical, aggressive, conservative
- Saves every session to a local SQLite database
- Creates a GitHub Pull Request when code passes
- React UI that shows the whole process in real time

## Tech I used

- React for the frontend
- Node.js and Express for the backend
- Groq API with LLaMA 3.3 70B for AI code generation
- Docker for safe code execution
- SQLite for session memory
- Octokit for GitHub integration

## Running it locally

You need Node.js, Docker Desktop, a free Groq API key, and a GitHub personal access token.

Clone the repo and go into the folder. Create a file called .env inside the backend folder with these values:

GROQ_API_KEY=your_key
GITHUB_TOKEN=your_token
GITHUB_OWNER=your_github_username
GITHUB_REPO=self-correcting-ai
PORT=5000

Then run the backend:

cd backend
npm install
npm run dev

Then run the frontend in a new terminal:

cd frontend
npm install
npm start

Open http://localhost:3000 in your browser.

## What I learned

Getting the self-correcting loop right was the hardest part. The AI tends to write defensive code that never actually crashes, so triggering the fix loop required careful prompt engineering. Docker on Windows also had some path quirks that took time to figure out.

## License

MIT