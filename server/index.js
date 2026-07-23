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

// Fallback static route for the root directory (to serve root index.html)
const rootPath = path.join(__dirname, '..');
app.use(express.static(rootPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API endpoint not found' });
  
  // Try serving from dist/index.html first (Vite/React bundle)
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      // Fall back to serving the root index.html (standalone single-page HTML frontend)
      res.sendFile(path.join(rootPath, 'index.html'), (fallbackErr) => {
        if (fallbackErr) {
          res.status(500).send('Pure-Grid StorageSync frontend assets not found.');
        }
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`[Pure-Grid StorageSync Engine] Running on http://localhost:${PORT}`);
});
