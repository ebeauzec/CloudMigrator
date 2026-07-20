import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Pure-Grid StorageSync Backend Engine', timestamp: new Date() });
});

// Serve production static assets if built
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API endpoint not found' });
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Pure-Grid StorageSync Backend API Running. Start Vite frontend on http://localhost:5173');
    }
  });
});

app.listen(PORT, () => {
  console.log(`[Pure-Grid StorageSync Engine] Running on http://localhost:${PORT}`);
});
