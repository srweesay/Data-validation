// Data Validation Portal - Validation Engine
// Implements the rules defined in agents/idea.md, as refined through follow-up
// instructions from the client. The governing principle throughout: **no field
// may be blank**. Fields that are substantively optional must instead contain
// the literal placeholder "NA" or "N/A"; fields that are always meaningful
// (identifiers, names, financial figures, category enums) must contain a real
// value.
//
// The engine is intentionally framework-agnostic (plain JS, ESM) so it can be
// reused from the Express routes as well as from tests / scripts.

import { ETHIOPIAN_BANK_SWIFT_SET, ISO_COUNTRY_NAMES_LOWER } from './referenceData.js';

export const REQUIRED_COLUMNS = [
  'Client Type',
  'First Name',
  'Last Name',
  'Unique Identifier',
  'TIN Number',
  'Investor Category',
  'Economic Sector',
  'Residency Status',
  'Country of Residence',
  'Bank of the Client',
  'Cash Account of the Client',
  'Main E-mail Address',
  'Main Phone Number',
  'Address: House No.',
  'Address: Kebele',
  'Address: Woreda',
  'Address: Sub-City',
  'Address: City',
  'Address: Region',
  'Address: Country',
  'Contact Person: Full Name',
  'Contact Person: Department',
  'Contact Person: Position',
  'Contact Person: E-mail Address',
  'Contact Person: Phone Number',
  'No. of shares',
  'Paid up Capital',
  'Taxation Schema',
  'Date of Birth',
];

// Real-world source files (e.g. the company's own Share Migration Template)
// sometimes spell headers slightly differently than our canonical names —
// missing spaces, different casing, a stray typo, or an older name for the
// same field ("Birth Date" vs "Date of Birth"). Any of these variants are
// accepted and normalized to the canonical name below via canonicalizeHeaders(),
// so the rest of the app (validation, the grid, export) only ever deals with
// one consistent set of field names.
const HEADER_ALIASES = {
  'Unique Identifier': ['uniqueidentifier'],
  'Address: Woreda': ['address:woreda'],
  'Contact Person: Full Name': ['contact person: full n/ame', 'contact person:full name'],
  'Paid up Capital': ['paid up capital'],
  'Date of Birth': ['birth date'],
};

const ALIAS_LOOKUP = new Map();
for (const canonical of REQUIRED_COLUMNS) {
  ALIAS_LOOKUP.set(canonical.toLowerCase(), canonical);
}
for (const [canonical, variants] of Object.entries(HEADER_ALIASES)) {
  for (const v of variants) ALIAS_LOOKUP.set(v.toLowerCase(), canonical);
}

function normalizeHeaderKey(header) {
  return String(header ?? '').trim().toLowerCase();
}

/**
 * Maps a raw list of header strings (as literally found in an uploaded file)
 * to their canonical names wherever recognized. Unrecognized headers are left
 * untouched (so extra, non-required columns in a file still pass through).
 * Returns { canonicalHeaders, rename } where `rename` maps each raw header
 * string to the canonical name it should be treated as everywhere else.
 */
export function canonicalizeHeaders(rawHeaders) {
  const rename = new Map();
  const canonicalHeaders = rawHeaders.map((raw) => {
    const key = normalizeHeaderKey(raw);
    const canonical = ALIAS_LOOKUP.get(key) || String(raw).trim();
    rename.set(raw, canonical);
    return canonical;
  });
  return { canonicalHeaders, rename };
}
const NAME_REGEX = /^[A-Za-z\s/]+$/;
const UID_REGEX = /^\d{16}$/;
const TIN_DIGITS_REGEX = /^\d+$/;
const CASH_ACCOUNT_REGEX = /^[A-Za-z0-9]{8,}$/;

const MONTH_NAME_TO_NUM = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function toStr(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

/** True for "NA", "N/A", "na", "n / a", etc. — the accepted "not applicable" placeholder. */
function isNaPlaceholder(value) {
  const v = toStr(value).toLowerCase().replace(/\s+/g, '');
  return v === 'na' || v === 'n/a';
}

/** Normalizes an Ethiopian phone number to +2519XXXXXXXX / +2517XXXXXXXX form. */
export function normalizePhone(raw) {
  let v = toStr(raw).replace(/[\s-]/g, '');
  if (v.startsWith('+251')) return v;
  if (v.startsWith('251')) return `+${v}`;
  if (v.startsWith('0')) return `+251${v.slice(1)}`;
  return v;
}

function isValidPhone(raw) {
  const normalized = normalizePhone(raw);
  return /^\+251(9|7)\d{8}$/.test(normalized);
}

/**
 * Accepts a date in Year → Month → Day order, where the separators may be
 * "/", "-", or whitespace, and the month may be numeric or a (full or
 * abbreviated) month name. Examples that all pass: "2020/01/15",
 * "2020-01-15", "2020/Jan/15", "2020-January-15", "2020 Jan 15".
 * The *order* (year, then month, then day) is the one thing that must hold.
 */
function isValidYearMonthDayOrder(raw) {
  const value = toStr(raw);
  if (!value) return false;
  const parts = value.split(/[\/\-\s]+/).filter(Boolean);
  if (parts.length !== 3) return false;
  const [yearPart, monthPart, dayPart] = parts;

  if (!/^\d{4}$/.test(yearPart)) return false;
  const year = Number(yearPart);
  if (year < 1000 || year > 9999) return false;

  let month;
  if (/^\d{1,2}$/.test(monthPart)) {
    month = Number(monthPart);
  } else {
    month = MONTH_NAME_TO_NUM[monthPart.toLowerCase()];
  }
  if (!month || month < 1 || month > 12) return false;

  if (!/^\d{1,2}$/.test(dayPart)) return false;
  const day = Number(dayPart);
  if (day < 1 || day > 31) return false;

  return true;
}

/**
 * Validates that all required columns are present in the parsed header row.
 * Returns { valid, missingColumns: string[] }
 */
export function validateColumns(headers) {
  const headerSet = new Set(headers.map((h) => toStr(h)));
  const missingColumns = REQUIRED_COLUMNS.filter((col) => !headerSet.has(col));
  return { valid: missingColumns.length === 0, missingColumns };
}

/**
 * Validates a single row and returns an array of field-level errors:
 * { column, value, message }
 */
export function validateRow(row, context = {}) {
  const errors = [];
  const push = (column, message) => {
    errors.push({ column, value: row[column], message });
  };

  // --- Client Type ---
  // PP = Physical Person, LE = Legal Entity, PPJ = Joint Holders (treated the
  // same as PP throughout this file — the template groups "PP and joint
  // holders" under one shared set of rules).
  const clientType = toStr(row['Client Type']).toUpperCase();
  if (isBlank(row['Client Type'])) {
    push('Client Type', 'Client Type is required');
  } else if (!['PP', 'LE', 'PPJ'].includes(clientType)) {
    push('Client Type', 'Must be PP, LE, or PPJ');
  }

  // --- First Name ---
  // PP/PPJ: the physical person's own name + father's name, letters/spaces/"/" only.
  // LE: the company name — free text, no character restriction.
  if (isBlank(row['First Name'])) {
    push('First Name', 'First Name is required');
  } else if (clientType !== 'LE' && !NAME_REGEX.test(toStr(row['First Name']))) {
    push('First Name', 'Letters, spaces, and "/" only, no numbers or other symbols');
  }

  // --- Last Name ---
  // PP/PPJ: the grandfather's name, letters/spaces/"/" only.
  // LE: not applicable — must be "NA" or "N/A".
  if (clientType === 'LE') {
    if (isBlank(row['Last Name']) || !isNaPlaceholder(row['Last Name'])) {
      push('Last Name', 'Must be "NA" or "N/A" for a Legal Entity (LE)');
    }
  } else if (isBlank(row['Last Name'])) {
    push('Last Name', 'Last Name is required');
  } else if (!NAME_REGEX.test(toStr(row['Last Name']))) {
    push('Last Name', 'Letters, spaces, and "/" only, no numbers or other symbols');
  }

  // --- Unique Identifier ---
  // PP/PPJ: exactly 16 digits. LE: any characters/symbols allowed except a comma.
  // All: must be non-blank and unique across the whole file.
  const uid = toStr(row['Unique Identifier']);
  if (isBlank(row['Unique Identifier'])) {
    push('Unique Identifier', 'Unique Identifier is required');
  } else if (clientType === 'LE') {
    if (uid.includes(',')) {
      push('Unique Identifier', 'Must not contain a comma');
    } else if (context.duplicateUids && context.duplicateUids.has(uid)) {
      push('Unique Identifier', 'Must be unique — this value is used by more than one row');
    }
  } else if (!UID_REGEX.test(uid)) {
    push('Unique Identifier', 'Must be numeric and exactly 16 digits');
  } else if (context.duplicateUids && context.duplicateUids.has(uid)) {
    push('Unique Identifier', 'Must be unique — this value is used by more than one row');
  }

  // --- TIN Number --- (digits only, or "NA"/"N/A" if the client doesn't have one)
  const tin = toStr(row['TIN Number']);
  if (isBlank(row['TIN Number'])) {
    push('TIN Number', 'Required — enter digits only, or "NA"/"N/A" if not applicable');
  } else if (!isNaPlaceholder(tin)) {
    if (!TIN_DIGITS_REGEX.test(tin)) {
      push('TIN Number', 'Must contain numbers only, or "NA"/"N/A" if not applicable');
    } else if (context.duplicateTins && context.duplicateTins.has(tin)) {
      push('TIN Number', 'Must be unique — this value is used by more than one row');
    }
  }

  // --- Investor Category ---
  // PP/PPJ: must be Male or Female. LE: any non-empty value is accepted.
  if (isBlank(row['Investor Category'])) {
    push('Investor Category', 'Investor Category is required');
  } else if (clientType !== 'LE' && !['Male', 'Female'].includes(toStr(row['Investor Category']))) {
    push('Investor Category', 'Must be Male or Female');
  }

  // --- Economic Sector ---
  // PP/PPJ: free text, or "NA"/"N/A" if not applicable. LE: must be a real
  // sector value — "NA"/"N/A" is not accepted.
  if (isBlank(row['Economic Sector'])) {
    push(
      'Economic Sector',
      clientType === 'LE'
        ? 'Economic Sector is required for LE'
        : 'Required — enter a sector, or "NA"/"N/A" if not applicable'
    );
  } else if (clientType === 'LE') {
    if (isNaPlaceholder(row['Economic Sector'])) {
      push('Economic Sector', 'Must be an actual sector for LE, not "NA"/"N/A"');
    } else if (/^\d+$/.test(toStr(row['Economic Sector']))) {
      push('Economic Sector', 'Must be text, not numeric-only');
    }
  } else if (!isNaPlaceholder(row['Economic Sector']) && /^\d+$/.test(toStr(row['Economic Sector']))) {
    push('Economic Sector', 'Must be text, not numeric-only');
  }

  // --- Residency Status ---
  const residencyStatus = toStr(row['Residency Status']);
  if (isBlank(row['Residency Status'])) {
    push('Residency Status', 'Residency Status is required');
  } else if (!['Resident', 'Non-Resident'].includes(residencyStatus)) {
    push('Residency Status', 'Must be Resident or Non-Resident');
  }

  // --- Country of Residence --- (tied to Residency Status: Resident -> Ethiopia,
  // Non-Resident -> any other real country)
  const countryOfResidence = toStr(row['Country of Residence']);
  if (isBlank(row['Country of Residence'])) {
    push('Country of Residence', 'Country of Residence is required');
  } else if (residencyStatus === 'Resident') {
    if (countryOfResidence.toLowerCase() !== 'ethiopia') {
      push('Country of Residence', 'Must be "Ethiopia" when Residency Status is Resident');
    }
  } else if (residencyStatus === 'Non-Resident') {
    if (
      !ISO_COUNTRY_NAMES_LOWER.has(countryOfResidence.toLowerCase()) ||
      countryOfResidence.toLowerCase() === 'ethiopia'
    ) {
      push('Country of Residence', 'Must be a valid country other than Ethiopia when Residency Status is Non-Resident');
    }
  } else if (!ISO_COUNTRY_NAMES_LOWER.has(countryOfResidence.toLowerCase())) {
    // Residency Status itself is missing/invalid (already flagged above) — still
    // sanity-check that this holds a real country name.
    push('Country of Residence', 'Must be a valid country name');
  }

  // --- Bank of the Client ---
  if (isBlank(row['Bank of the Client'])) {
    push('Bank of the Client', 'Bank of the Client is required');
  } else if (!ETHIOPIAN_BANK_SWIFT_SET.has(toStr(row['Bank of the Client']).toUpperCase())) {
    push('Bank of the Client', 'Must be a valid Ethiopian bank SWIFT code');
  }

  // --- Cash Account of the Client ---
  const cashAccount = toStr(row['Cash Account of the Client']);
  if (isBlank(row['Cash Account of the Client'])) {
    push('Cash Account of the Client', 'Cash Account of the Client is required');
  } else if (!CASH_ACCOUNT_REGEX.test(cashAccount)) {
    push('Cash Account of the Client', 'Must be alphanumeric, minimum 8 characters');
  } else if (context.duplicateCashAccounts && context.duplicateCashAccounts.has(cashAccount)) {
    push('Cash Account of the Client', 'Must be unique — this value is used by more than one row');
  }

  // --- Main E-mail Address --- (any value, or "NA"/"N/A"; no format check)
  if (isBlank(row['Main E-mail Address'])) {
    push('Main E-mail Address', 'Required — enter an email address, or "NA"/"N/A" if not applicable');
  }

  // --- Main Phone Number --- (real phone must be valid Ethiopian format, or "NA"/"N/A")
  if (isBlank(row['Main Phone Number'])) {
    push('Main Phone Number', 'Required — enter a phone number, or "NA"/"N/A" if not applicable');
  } else if (!isNaPlaceholder(row['Main Phone Number']) && !isValidPhone(row['Main Phone Number'])) {
    push('Main Phone Number', 'Must be a valid Ethiopian phone number (+2519.../0912345678), or "NA"/"N/A"');
  }

  // --- Address fields --- (free text, or "NA"/"N/A"; Address: Country also format-checked)
  const freeTextAddressFields = [
    'Address: House No.',
    'Address: Kebele',
    'Address: Woreda',
    'Address: Sub-City',
    'Address: City',
    'Address: Region',
  ];
  for (const field of freeTextAddressFields) {
    if (isBlank(row[field])) {
      push(field, `Required — enter a value, or "NA"/"N/A" if not applicable`);
    }
  }

  if (isBlank(row['Address: Country'])) {
    push('Address: Country', 'Required — enter a country, or "NA"/"N/A" if not applicable');
  } else if (
    !isNaPlaceholder(row['Address: Country']) &&
    !ISO_COUNTRY_NAMES_LOWER.has(toStr(row['Address: Country']).toLowerCase())
  ) {
    push('Address: Country', 'Must be a valid country name, or "NA"/"N/A"');
  }

  // --- Contact Person fields --- (free text, or "NA"/"N/A")
  const freeTextContactFields = [
    'Contact Person: Full Name',
    'Contact Person: Department',
    'Contact Person: Position',
  ];
  for (const field of freeTextContactFields) {
    if (isBlank(row[field])) {
      push(field, `Required — enter a value, or "NA"/"N/A" if not applicable`);
    }
  }

  if (isBlank(row['Contact Person: E-mail Address'])) {
    push('Contact Person: E-mail Address', 'Required — enter an email address, or "NA"/"N/A" if not applicable');
  }

  if (isBlank(row['Contact Person: Phone Number'])) {
    push('Contact Person: Phone Number', 'Required — enter a phone number, or "NA"/"N/A" if not applicable');
  } else if (
    !isNaPlaceholder(row['Contact Person: Phone Number']) &&
    !isValidPhone(row['Contact Person: Phone Number'])
  ) {
    push('Contact Person: Phone Number', 'Must be a valid Ethiopian phone number, or "NA"/"N/A"');
  }

  // --- No. of shares ---
  if (isBlank(row['No. of shares'])) {
    push('No. of shares', 'No. of shares is required');
  } else {
    const shares = Number(row['No. of shares']);
    if (Number.isNaN(shares) || shares <= 0) {
      push('No. of shares', 'Must be numeric and greater than 0');
    }
  }

  // --- Paid up Capital ---
  if (isBlank(row['Paid up Capital'])) {
    push('Paid up Capital', 'Paid up Capital is required');
  } else {
    const paidUp = Number(row['Paid up Capital']);
    if (Number.isNaN(paidUp) || paidUp < 0) {
      push('Paid up Capital', 'Must be numeric and greater than or equal to 0');
    }
  }

  // --- Taxation Schema ---
  if (isBlank(row['Taxation Schema'])) {
    push('Taxation Schema', 'Taxation Schema is required');
  } else if (!['Standard', 'Exempt'].includes(toStr(row['Taxation Schema']))) {
    push('Taxation Schema', 'Must be Standard or Exempt');
  }

  // --- Date of Birth ---
  // The real-world template has a single date column shared by every Client
  // Type (PP/PPJ's date of birth, LE's registration date) — required for
  // everyone, flexible separators/word-or-numeric month, but year → month →
  // day order must hold.
  if (isBlank(row['Date of Birth'])) {
    push('Date of Birth', 'Date of Birth is required (e.g. 2020/01/15, 2020-Jan-15 — year, then month, then day)');
  } else if (!isValidYearMonthDayOrder(row['Date of Birth'])) {
    push('Date of Birth', 'Must be in year-month-day order (e.g. 2020/01/15, 2020-Jan-15)');
  }

  return errors;
}

/**
 * Validates an entire dataset. `rows` is an array of plain objects keyed by
 * column name. Processing is chunked (yielding back to the event loop between
 * batches) so very large files (500-5000+ rows) do not block the Node process
 * for an extended period.
 */
export async function validateDataset(headers, rows, { chunkSize = 250 } = {}) {
  const columnCheck = validateColumns(headers);

  // Pre-pass: find values that appear on more than one row for each field that
  // must be unique, so every occurrence can be flagged (not just the second
  // one). "NA"/"N/A" placeholders are excluded — multiple rows legitimately
  // not having a TIN Number shouldn't be flagged as duplicates of each other.
  function findDuplicates(fieldName) {
    const counts = new Map();
    for (const r of rows) {
      const v = toStr(r[fieldName]);
      if (!v || isNaPlaceholder(v)) continue;
      counts.set(v, (counts.get(v) || 0) + 1);
    }
    return new Set(
      Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([v]) => v)
    );
  }

  const duplicateUids = findDuplicates('Unique Identifier');
  const duplicateTins = findDuplicates('TIN Number');
  const duplicateCashAccounts = findDuplicates('Cash Account of the Client');

  const rowErrors = []; // { row, column, value, message }
  const invalidRowIndexes = new Set();

  for (let start = 0; start < rows.length; start += chunkSize) {
    const end = Math.min(start + chunkSize, rows.length);
    for (let i = start; i < end; i++) {
      const errs = validateRow(rows[i], { duplicateUids, duplicateTins, duplicateCashAccounts });
      if (errs.length > 0) {
        invalidRowIndexes.add(i);
        for (const e of errs) {
          rowErrors.push({ row: i + 1, column: e.column, value: e.value ?? '', message: e.message });
        }
      }
    }
    // Yield control back to the event loop between chunks.
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setImmediate(resolve));
  }

  const summary = {
    totalRows: rows.length,
    validRows: rows.length - invalidRowIndexes.size,
    invalidRows: invalidRowIndexes.size,
    missingColumns: columnCheck.missingColumns.length,
    validationErrors: rowErrors.length,
  };

  return {
    columnValidation: columnCheck,
    summary,
    errors: rowErrors,
    canDownload: columnCheck.valid && rowErrors.length === 0,
  };
}
