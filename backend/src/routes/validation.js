import { Router } from 'express';
import multer from 'multer';
import { parseSpreadsheet, buildSpreadsheet } from '../parseFile.js';
import { validateDataset, REQUIRED_COLUMNS } from '../validationEngine.js';

const router = Router();

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB per idea.md

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('Unsupported file type. Please upload .xlsx, .xls, or .csv'));
    }
    cb(null, true);
  },
});

// GET required column list (used by the frontend to render the column checklist)
router.get('/schema', (req, res) => {
  res.json({ requiredColumns: REQUIRED_COLUMNS });
});

// POST /api/parse - upload + parse a spreadsheet WITHOUT validating yet.
// Used to populate the on-screen grid immediately after upload; the user then
// clicks "Validate Data" to actually run the checks.
router.post('/parse', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const { headers, rows } = parseSpreadsheet(req.file.buffer, req.file.originalname);
    if (headers.length === 0) {
      return res.status(400).json({ error: 'The uploaded file appears to be empty.' });
    }
    res.json({ headers, rows, fileName: req.file.originalname });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to process file.' });
  }
});

// POST /api/validate - upload + parse + validate a spreadsheet
router.post('/validate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const { headers, rows } = parseSpreadsheet(req.file.buffer, req.file.originalname);
    if (headers.length === 0) {
      return res.status(400).json({ error: 'The uploaded file appears to be empty.' });
    }
    const result = await validateDataset(headers, rows);
    res.json({ headers, rows, ...result, fileName: req.file.originalname });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to process file.' });
  }
});

// POST /api/revalidate - re-run validation on edited JSON rows (after inline correction)
router.post('/revalidate', async (req, res) => {
  try {
    const { headers, rows } = req.body;
    if (!Array.isArray(headers) || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'headers and rows arrays are required.' });
    }
    const result = await validateDataset(headers, rows);
    res.json({ headers, rows, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to revalidate data.' });
  }
});

// POST /api/export - build a downloadable file from corrected rows
router.post('/export', async (req, res) => {
  try {
    const { headers, rows, format = 'xlsx' } = req.body;
    if (!Array.isArray(headers) || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'headers and rows arrays are required.' });
    }
    const result = await validateDataset(headers, rows);
    if (!result.canDownload) {
      return res.status(409).json({
        error: 'Dataset still contains validation errors. Fix all errors before downloading.',
        summary: result.summary,
      });
    }
    const buffer = buildSpreadsheet(headers, rows, format);
    const mime =
      format === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const ext = format === 'csv' ? 'csv' : 'xlsx';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="validated-data.${ext}"`);
    res.send(buffer);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to export file.' });
  }
});

export default router;
