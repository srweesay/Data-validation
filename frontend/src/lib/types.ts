export type RowRecord = Record<string, string | number>;

export interface ValidationErrorItem {
  row: number; // 1-based data row number
  column: string;
  value: string | number;
  message: string;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  missingColumns: number;
  validationErrors: number;
}

export interface ColumnValidation {
  valid: boolean;
  missingColumns: string[];
}

export interface ParsedFile {
  headers: string[];
  rows: RowRecord[];
  fileName: string;
}

export interface ValidationResult {
  headers: string[];
  rows: RowRecord[];
  columnValidation: ColumnValidation;
  summary: ValidationSummary;
  errors: ValidationErrorItem[];
  canDownload: boolean;
  fileName?: string;
}

export type WizardStep = 'upload' | 'workspace';
