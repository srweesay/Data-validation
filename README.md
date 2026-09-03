# Data Validation Portal

Investor onboarding data upload & validation system for CSD import, built to the spec in
`agents/idea.md`.

## What's in this repo

- `frontend/` — React + TypeScript + Tailwind (TanStack Start scaffold), the upload/validation/
  correction/download UI.
- `backend/` — Node.js + Express API that parses spreadsheets (SheetJS/xlsx), runs the validation
  engine, and exports the corrected file.
- `agents/idea.md` — the original project brief.

## Running it locally

### 1. Backend

```bash
cd backend
npm install
npm start        # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:3000
```

The frontend always talks directly to `http://localhost:4000/api` (see `frontend/src/lib/api.ts`) —
not a same-origin proxy, since TanStack Start's own dev server intercepts `/api/*` before a Vite
proxy would get a chance to forward it. Set `VITE_API_URL` to point at a different backend URL
(e.g. in production).

## Flow

1. **Upload** — drag/drop or browse an `.xlsx` / `.xls` / `.csv` file (≤ 20MB). The file is parsed
   and opens immediately as an editable spreadsheet inside the portal — no validation has run yet.
2. **Validate Data** — click the button to run the required-column check and every row-level rule.
   Cells with problems turn red directly in the grid (hover a cell to see the error message), and a
   summary bar appears above a **"Fix errors"** panel with two views:
   - **Step through** (default) — one error at a time: Row, Column, the error message, and an input
     to correct it, with Previous/Next navigation and a progress dot for every error.
   - **Full list** — the same errors as a searchable, filterable, sortable, paginated table, for
     jumping around freely instead of stepping through in order.
   - If required columns are missing entirely, you'll see a "Missing Required Columns" banner and
     need to fix the source file's headers and re-upload (a column can't be added from the grid).
3. **Correct** — fix values in the step-through walker, the full list, or straight in the grid —
   all three edit the same underlying data. Once you've made changes, click **Revalidate Data** to
   re-run all checks.
4. **Download** — once validation reports 0 errors, a "Validation successful" banner appears with
   buttons to download the corrected dataset as `.xlsx` or `.csv`.

## Field rules (differ by Client Type: PP = Physical Person, LE = Legal Entity, PPJ = Joint Holders)

This is modeled directly on the company's own Share Migration Template. Client Type must be
`PP`, `LE`, or `PPJ` — **PPJ (joint holders) follows the exact same rules as PP** everywhere in
this table.

The governing rule throughout: **no cell may be truly blank.** Fields that are genuinely optional
must instead contain the literal placeholder `NA` or `N/A`; fields that always carry meaningful
data must contain a real value.

| Field | PP / PPJ | LE (Legal Entity) |
|---|---|---|
| First Name | Person's name + father's name (PPJ: joint holders' names); letters/spaces/`/` only; required | Company name; free text; required |
| Last Name | Grandfather's name; letters/spaces/`/` only; required | Must be `NA`/`N/A` (not applicable) |
| Unique Identifier | Exactly 16 digits; required | Any characters except a comma; required |
| TIN Number | Digits only, or `NA`/`N/A`; required (placeholder counts) | Same as PP |
| Investor Category | Must be `Male` or `Female`; required | Any non-empty value; required |
| Economic Sector | Free text, or `NA`/`N/A`; required (placeholder counts) | Must be a real sector — `NA`/`N/A` **not** accepted; required |
| Residency Status | `Resident` or `Non-Resident`; required | Same as PP |
| Country of Residence | Must be `Ethiopia` if Resident, or any other real country if Non-Resident; required | Same as PP |
| Bank of the Client | Valid Ethiopian SWIFT code; required | Same as PP |
| Cash Account of the Client | Required, non-empty, unique across the file | Same as PP |
| Main E-mail / Phone, all Address fields, all Contact Person fields | Free text, or `NA`/`N/A`; required (placeholder counts); phone fields (if a real value is given) must still be a valid Ethiopian format — email fields have no format check | Same as PP |
| No. of shares | Numeric, > 0; required | Same as PP |
| Paid up Capital | Numeric, ≥ 0; required | Same as PP |
| Taxation Schema | `Standard` or `Exempt`; required | Same as PP |
| Date of Birth | Required for everyone; any separator/word-or-numeric month, but must be in **year → month → day** order (e.g. `2020/01/15`, `2020-Jan-15`, `2020 January 15`) — this single column doubles as the LE registration date, matching the real template which has only one date column | Same as PP |

**Uniqueness across the whole file** (not just format) is enforced for:

- Unique Identifier
- TIN Number (placeholders like `NA` are excluded from the duplicate check)
- Cash Account of the Client

If any of these repeats across two or more rows, every row sharing that value is flagged — not
just the second occurrence.

### Header flexibility

Real-world files don't always spell headers exactly like our canonical names. `canonicalizeHeaders()`
in `backend/src/validationEngine.js` normalizes known variants at parse time — e.g. `UniqueIdentifier`
→ `Unique Identifier`, `Paid up capital` → `Paid up Capital`, `Address:Woreda` → `Address: Woreda`,
`Birth Date` → `Date of Birth`. Anything not recognized is left as-is (so unrelated extra columns in
a file still pass through untouched).

This is all defined in `backend/src/validationEngine.js`.

## Deploying (Vercel frontend + separate backend host)

This is a two-part app: a stateless Express API and a frontend that calls it. Vercel is a great
fit for the frontend, but **it can't run the Express backend as-is** — Vercel's serverless
functions cap request bodies around 4.5MB, well under the 20MB upload limit this app needs, and a
long-running `app.listen()` server doesn't fit the serverless model anyway. So: deploy the
frontend to Vercel, and the backend to a host that runs a persistent Node process — e.g.
[Render](https://render.com), [Railway](https://railway.app), or [Fly.io](https://fly.io) all have
simple free/cheap tiers for this.

### 1. Deploy the backend

On Render (or similar): create a new Web Service pointing at this repo, set the root directory to
`backend`, build command `npm install`, start command `npm start`. It'll give you a public URL
like `https://your-backend.onrender.com`.

Optionally set an `ALLOWED_ORIGIN` environment variable on the backend to your frontend's exact
URL (e.g. `https://your-app.vercel.app`) to restrict CORS to just that origin — see
`backend/server.js`. Left unset, all origins are allowed, which is fine to start with.

### 2. Point the frontend at it

In your Vercel project settings → Environment Variables, add:

```
VITE_API_URL = https://your-backend.onrender.com/api
```

Then redeploy the frontend on Vercel. Without this variable, the frontend falls back to
`http://localhost:4000/api` — which only works on your own machine, since "localhost" means
whichever computer is running the browser. That's why it worked for you but not for anyone else:
their browser tried to reach a backend on their own machine that doesn't exist, and since your
Vercel site is served over HTTPS, the browser also blocks that plain `http://` request as mixed
content (which can show up looking like a CORS error even though the real problem is the wrong,
unreachable URL).

## Notes / things to double-check before production use

- The Ethiopian bank SWIFT code list (`backend/src/referenceData.js`) includes the four codes
  named in the brief plus other well-known banks — verify/expand it against an authoritative
  source (e.g. National Bank of Ethiopia) before go-live.
- Validation currently runs server-side per request; for very large files (5,000+ rows) the engine
  processes rows in chunks (yielding back to the event loop) so the API stays responsive, and the
  error table is paginated client-side so the browser never renders more than 25 rows at once.
- There is no authentication/authorization layer yet — add one before exposing this beyond a
  trusted internal network.
