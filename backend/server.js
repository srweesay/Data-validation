import express from 'express';
import cors from 'cors';
import validationRouter from './src/routes/validation.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Allowed frontend origins
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ?.split(',')
  .map((o) => o.trim());

app.use(cors(allowedOrigins ? { origin: allowedOrigins } : undefined));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.send('Data Validation API is running');
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Application routes
app.use('/api', validationRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({
    error: err.message || 'Unexpected server error.'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(
    `Data Validation Portal API listening on http://localhost:${PORT}`
  );
});
