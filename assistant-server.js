// Minimal Express server to relay chat between frontend and Ollama LLM

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';


const app = express();
const PORT = process.env.PORT || 4001;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'; // Default Ollama local port

app.use(cors());
app.use(bodyParser.json());

// POST /api/assistant { message: "..." }
app.post('/api/assistant', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });
  try {
    // Forward to Ollama's /api/chat or /api/generate endpoint (adjust as needed)
    const ollamaRes = await axios.post(`${OLLAMA_URL}/api/chat`, {
      model: 'gemma3:1b', // Temporary model as requested
      messages: [{ role: 'user', content: message }],
      stream: false
    });
    const reply = ollamaRes.data?.message?.content || ollamaRes.data?.response || 'No response';
    res.json({ reply });
  } catch (err) {
    console.error('Ollama error:', err?.response?.data || err.message || err);
    res.status(500).json({ error: 'Ollama server error', details: err?.response?.data || err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Assistant server running on http://localhost:${PORT}`);
});
