# Data Validation Portal – Investor Data Upload & Validation System

## Project Purpose

Build a professional web-based Data Validation Portal that allows users to upload Excel files containing investor information, validate both the file structure and data content, display all validation errors in a user-friendly manner, allow correction of errors, and finally download the validated dataset.

The application should use a modern financial-sector UI with branding colors:

- Primary: Black
- Secondary: Gold
- Accent: Dark Blue/Black

The system must be optimized to process large Excel files (500+ records) without freezing or blocking the UI.

---

# Business Objective

The portal is intended to validate investor onboarding data before importing it into a Central Securities Depository (CSD) system.

The system must:

1. Validate required columns.
2. Validate row-level data.
3. Display all errors clearly.
4. Allow users to correct errors directly in the web interface.
5. Re-validate corrected data.
6. Allow download of validated data.

---

# Technical Stack

## Frontend

- React.js
- TypeScript
- Tailwind CSS
- Shadcn UI
- TanStack Table
- React Hook Form

## Backend

- Node.js
- Express.js

## Excel Processing

- SheetJS (xlsx)
- ExcelJS

---

# User Flow

## Step 1: Upload File

User uploads:

- .xlsx
- .xls
- .csv

Supported file size:

- Up to 20MB

Supported records:

- 500+
- 1000+
- 5000+ preferred

---

## Step 2: Column Validation

System validates whether all required columns exist.

Required columns:

```text
Client Type
First Name
Last Name
Unique Identifier
TIN Number
Investor Category
Economic Sector
Residency Status
Country of Residence
Bank of the Client
Cash Account of the Client
Main E-mail Address
Main Phone Number
Address: House No.
Address: Kebele
Address: Woreda
Address: Sub-City
Address: City
Address: Region
Address: Country
Contact Person: Full Name
Contact Person: Department
Contact Person: Position
Contact Person: E-mail Address
Contact Person: Phone Number
No. of shares
Paid up Capital
Taxation Schema
Registration Date
```

---

# Special Rule

Client Type determines the final date column.

## For PP (Physical Person)

Required column:

```text
Birth Date
```

Registration Date must not be required.

---

## For LE (Legal Entity)

Required column:

```text
Registration Date
```

Birth Date must not be required.

---

# Missing Column Validation

If any required column is missing:

Show error:

```text
Missing Required Columns
```

Example:

```text
Registration Date is missing
TIN Number is missing
Main Phone Number is missing
```

User cannot proceed until fixed.

---

# Step 3: Data Validation

Validate every row.

Display:

- Row Number
- Column Name
- Invalid Value
- Error Message

Example:

| Row | Column | Value | Error |
|------|---------|---------|---------|
| 5 | Client Type | Individual | Must be PP or LE |

---

# Column Validation Rules

## Client Type

Allowed values:

```text
PP
LE
```

Required:

```text
Yes
```

Invalid:

```text
Individual
Corporate
Physical
Legal
```

---

## First Name

Required:

```text
Yes
```

Validation:

- Must contain a valid name
- Letters only
- Spaces allowed
- No numbers
- No symbols

Example:

Valid:

```text
Abebe Kebede
```

Invalid:

```text
Abebe123
12345
@Abebe
```

---

## Last Name

Required:

```text
Yes
```

Validation:

- Letters only
- Spaces allowed
- No numbers
- No special characters

---

## Unique Identifier

Required:

```text
Yes
```

Validation:

- Numeric only
- Exactly 16 digits

Valid:

```text
1234567890123456
```

Invalid:

```text
12345
ABC123
12345678901234567
```

---

## TIN Number

Required:

```text
No
```

Validation:

- Letters allowed
- Numbers allowed
- No special characters

---

## Investor Category

Required:

```text
No
```

Allowed values:

```text
Male
Female
```

---

## Economic Sector

Required:

```text
No
```

Validation:

- Text
- No numeric-only values

---

## Residency Status

Allowed:

```text
Resident
Non Resident
```

Required:

```text
Yes
```

---

## Country of Residence

Required:

```text
Yes
```

Validation:

- Must be valid country name

Use ISO country dataset.

---

## Bank of the Client

Required:

```text
Yes
```

Validation:

Must contain valid Ethiopian SWIFT code.

Examples:

```text
ABYSETAA
CBETETAA
AWINETAA
DASHETAA
```

Not:

```text
Commercial Bank of Ethiopia
Awash Bank
Dashen Bank
```

The system should maintain a reference list of Ethiopian bank SWIFT codes.

---

## Cash Account of the Client

Required:

```text
Yes
```

Validation:

- Alphanumeric
- Minimum 8 characters

---

## Main E-mail Address

Required:

```text
Yes
```

Validation:

RFC-compliant email validation.

---

## Main Phone Number

Required:

```text
Yes
```

Valid formats:

```text
+251912345678
251912345678
0912345678
```

Normalize before validation.

---

# Address Fields

Validate as text:

```text
Address: House No.
Address: Kebele
Address: Woreda
Address: Sub-City
Address: City
Address: Region
Address: Country
```

Country must be valid country name.

---

# Contact Person Fields

Validate:

```text
Contact Person: Full Name
Contact Person: Department
Contact Person: Position
Contact Person: E-mail Address
Contact Person: Phone Number
```

Email and phone must use same validation rules.

---

# No. of Shares

Required:

```text
Yes
```

Validation:

- Numeric
- Greater than 0

---

# Paid up Capital

Required:

```text
No
```

Validation:

- Numeric
- Greater than or equal to 0

---

# Taxation Schema

Required:

```text
No
```

Validation:

- Text
- Max length 100

---

# Date Validation

## PP

Required:

```text
Birth Date
```

Validation:

- Valid date
- Cannot be future date

---

## LE

Required:

```text
Registration Date
```

Validation:

- Valid date
- Cannot be future date

---

# Error Dashboard

After validation show:

## Summary Cards

- Total Rows
- Valid Rows
- Invalid Rows
- Missing Columns
- Validation Errors

Example:

```text
Total Rows: 1000
Valid Rows: 920
Invalid Rows: 80
Errors: 145
```

---

# Error Table

Display:

- Row Number
- Column Name
- Current Value
- Error Description

Features:

- Search
- Filter
- Pagination
- Sort

---

# Data Correction

Users can fix errors directly in the table.

Example:

```text
Client Type
[Individual]
```

Change to:

```text
PP
```

---

# Revalidate

Button:

```text
Revalidate Data
```

Re-runs all validations.

---

# Download Validated File

Button:

```text
Download Clean File
```

Available only when:

```text
Error Count = 0
```

Output:

- Same Excel structure
- Corrected data
- Preserved formatting where possible

Formats:

```text
.xlsx
.csv
```

---

# Performance Requirements

Must handle:

- 500+ rows
- 1000+ rows
- 5000+ rows

Requirements:

- Web Workers for validation
- Chunk processing
- Virtualized tables
- Non-blocking UI

---

# UI Requirements

Design style:

Financial Institution / Banking Portal

Colors:

```css
Primary Black: #0B1220
Gold: #C89B3C
Dark Gold: #9C7424
Accent Blue-Black: #1E293B
Background: #F5F6F8
White: #FFFFFF
```

Pages:

1. Upload Page
2. Validation Results Page
3. Error Correction Page
4. Download Page

Use:

- Modern cards
- Professional tables
- Gold action buttons
- Responsive design
- Clean enterprise dashboard appearance

---

# Agent Instructions

Before implementation:

1. Read all validation rules carefully.
2. Design reusable validation engine.
3. Build column validation first.
4. Build row validation engine.
5. Build error dashboard.
6. Build inline editing functionality.
7. Build Excel export functionality.
8. Optimize for large datasets.
9. Test with 500+ records.
10. Ensure clean separation between frontend and backend.

Final result should be a professional enterprise-grade investor data validation portal suitable for financial institutions and CSD onboarding processes.
