import express from 'express';
import cors from 'cors';
import validationRouter from './src/routes/validation.js';

const app = express();
const PORT = process.env.PORT || 4000;

// In production, set ALLOWED_ORIGIN to your deployed frontend's URL
// (e.g. https://your-app.vercel.app). Comma-separate multiple origins.
// Left unset, all origins are allowed — fine for local dev, but tighten this
// once you know your real frontend URL.
const allowedOrigins = process.env.ALLOWED_ORIGIN?.split(',').map((o) => o.trim());
app.use(cors(allowedOrigins ? { origin: allowedOrigins } : undefined));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', validationRouter);

// Central error handler (e.g. multer file-size/type errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || 'Unexpected server error.' });
});

app.listen(PORT, () => {
  console.log(`Data Validation Portal API listening on http://localhost:${PORT}`);
});
