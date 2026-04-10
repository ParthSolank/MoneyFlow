/**
 * Bank Statement Parser
 * Supports CSV and PDF parsing with intelligent column detection
 */

import Papa from 'papaparse';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  rawRow?: any;
}

export interface ParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  errors: string[];
  summary: {
    totalRows: number;
    successfulImports: number;
    failedRows: number;
  };
}

// ============================================
// COLUMN NAME MAPPINGS
// ============================================

const DATE_COLUMNS = [
  'date',
  'transaction date',
  'txn date',
  'posting date',
  'value date',
  'trans date',
  'transaction_date',
  'txn_date',
  'posting_date',
  'value_date',
  'trans_date',
];

const DESCRIPTION_COLUMNS = [
  'description',
  'narration',
  'particulars',
  'details',
  'transaction details',
  'transaction description',
  'remarks',
  'memo',
  'reference',
  'txn_description',
  'transaction_description',
];

const DEBIT_COLUMNS = [
  'debit',
  'withdrawal',
  'debit amount',
  'withdrawals',
  'paid out',
  'expense',
  'dr',
  'debit_amount',
  'withdrawal_amount',
];

const CREDIT_COLUMNS = [
  'credit',
  'deposit',
  'credit amount',
  'deposits',
  'paid in',
  'income',
  'cr',
  'credit_amount',
  'deposit_amount',
];

const AMOUNT_COLUMNS = [
  'amount',
  'transaction amount',
  'txn amount',
  'value',
  'txn_amount',
  'transaction_amount',
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Normalize column name for matching
 */
const normalizeColumnName = (name: string): string => {
  return name.toLowerCase().trim().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
};

/**
 * Find matching column from headers
 */
const findColumn = (headers: string[], possibleNames: string[]): string | null => {
  const normalizedHeaders = headers.map(h => normalizeColumnName(h));
  
  for (const possibleName of possibleNames) {
    const normalized = normalizeColumnName(possibleName);
    const index = normalizedHeaders.findIndex(h => h === normalized || h.includes(normalized));
    if (index !== -1) {
      return headers[index];
    }
  }
  
  return null;
};

/**
 * Parse date string to YYYY-MM-DD format
 */
const parseDate = (dateStr: string): string | null => {
  if (!dateStr) return null;

  try {
    // Try common formats
    const formats = [
      // DD/MM/YYYY or DD-MM-YYYY
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
      // MM/DD/YYYY or MM-DD-YYYY
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
      // YYYY/MM/DD or YYYY-MM-DD
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
      // DD MMM YYYY (e.g., 15 Jan 2024)
      /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/,
    ];

    const cleanStr = dateStr.trim();

    // Try YYYY-MM-DD format first
    const isoMatch = cleanStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Try DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyyMatch = cleanStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      // Assume DD/MM/YYYY (common in India and Europe)
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Try DD MMM YYYY
    const ddMmmYyyyMatch = cleanStr.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
    if (ddMmmYyyyMatch) {
      const [, day, monthStr, year] = ddMmmYyyyMatch;
      const monthMap: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
      };
      const month = monthMap[monthStr.toLowerCase().substring(0, 3)];
      if (month) {
        return `${year}-${month}-${day.padStart(2, '0')}`;
      }
    }

    // Fallback: Try JavaScript Date parsing
    const jsDate = new Date(cleanStr);
    if (!isNaN(jsDate.getTime())) {
      const year = jsDate.getFullYear();
      const month = String(jsDate.getMonth() + 1).padStart(2, '0');
      const day = String(jsDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Parse amount string to number
 */
const parseAmount = (amountStr: string): number | null => {
  if (!amountStr) return null;

  try {
    // Remove currency symbols, commas, and spaces
    const cleaned = amountStr
      .toString()
      .replace(/[₹$€£,\s]/g, '')
      .replace(/\((\d+\.?\d*)\)/, '-$1') // Handle negative in parentheses
      .trim();

    const amount = parseFloat(cleaned);
    return isNaN(amount) ? null : Math.abs(amount);
  } catch (error) {
    return null;
  }
};

/**
 * Auto-categorize transaction based on description
 */
const autoCategorizze = (description: string): string => {
  const desc = description.toLowerCase();

  // Income keywords
  if (desc.includes('salary') || desc.includes('payroll') || desc.includes('wage')) {
    return 'Salary';
  }
  if (desc.includes('refund') || desc.includes('cashback') || desc.includes('reward')) {
    return 'Refund';
  }

  // Expense keywords
  if (desc.includes('zomato') || desc.includes('swiggy') || desc.includes('ubereats') || 
      desc.includes('restaurant') || desc.includes('food') || desc.includes('cafe')) {
    return 'Food & Dining';
  }
  if (desc.includes('uber') || desc.includes('ola') || desc.includes('rapido') || 
      desc.includes('taxi') || desc.includes('transport') || desc.includes('fuel') || 
      desc.includes('petrol') || desc.includes('diesel')) {
    return 'Transportation';
  }
  if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('myntra') || 
      desc.includes('shopping') || desc.includes('purchase')) {
    return 'Shopping';
  }
  if (desc.includes('electricity') || desc.includes('water') || desc.includes('gas') || 
      desc.includes('broadband') || desc.includes('mobile') || desc.includes('internet') || 
      desc.includes('bill')) {
    return 'Bills & Utilities';
  }
  if (desc.includes('rent') || desc.includes('maintenance')) {
    return 'Rent';
  }
  if (desc.includes('medical') || desc.includes('hospital') || desc.includes('pharmacy') || 
      desc.includes('doctor') || desc.includes('medicine')) {
    return 'Healthcare';
  }
  if (desc.includes('movie') || desc.includes('netflix') || desc.includes('prime') || 
      desc.includes('hotstar') || desc.includes('entertainment')) {
    return 'Entertainment';
  }

  return 'Uncategorized';
};

// ============================================
// CSV PARSING
// ============================================

/**
 * Parse CSV file and extract transactions
 */
export const parseCSV = async (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const transactions: ParsedTransaction[] = [];
        const errors: string[] = [];
        let successCount = 0;
        let failCount = 0;

        const headers = results.meta.fields || [];
        
        // Detect column mappings
        const dateCol = findColumn(headers, DATE_COLUMNS);
        const descCol = findColumn(headers, DESCRIPTION_COLUMNS);
        const debitCol = findColumn(headers, DEBIT_COLUMNS);
        const creditCol = findColumn(headers, CREDIT_COLUMNS);
        const amountCol = findColumn(headers, AMOUNT_COLUMNS);

        if (!dateCol) {
          errors.push('Could not detect date column. Please ensure your CSV has a date column.');
        }
        if (!descCol) {
          errors.push('Could not detect description column. Please ensure your CSV has a description column.');
        }

        // Process each row
        results.data.forEach((row: any, index: number) => {
          try {
            // Extract date
            const dateStr = dateCol ? row[dateCol] : null;
            const date = parseDate(dateStr);
            if (!date) {
              errors.push(`Row ${index + 1}: Invalid date format`);
              failCount++;
              return;
            }

            // Extract description
            const description = descCol ? row[descCol]?.toString().trim() : '';
            if (!description) {
              errors.push(`Row ${index + 1}: Missing description`);
              failCount++;
              return;
            }

            // Extract amount and type
            let amount: number | null = null;
            let type: 'income' | 'expense' = 'expense';

            // Check if there's a single amount column
            if (amountCol) {
              amount = parseAmount(row[amountCol]);
              // Try to determine type from other columns or amount sign
              if (amount && amount < 0) {
                type = 'expense';
                amount = Math.abs(amount);
              } else {
                // Default to expense, but check description for income keywords
                const descLower = description.toLowerCase();
                if (descLower.includes('credit') || descLower.includes('deposit') || 
                    descLower.includes('salary') || descLower.includes('refund')) {
                  type = 'income';
                }
              }
            } else {
              // Check debit/credit columns
              const debitAmount = debitCol ? parseAmount(row[debitCol]) : null;
              const creditAmount = creditCol ? parseAmount(row[creditCol]) : null;

              if (debitAmount && debitAmount > 0) {
                amount = debitAmount;
                type = 'expense';
              } else if (creditAmount && creditAmount > 0) {
                amount = creditAmount;
                type = 'income';
              }
            }

            if (!amount || amount <= 0) {
              errors.push(`Row ${index + 1}: Invalid amount`);
              failCount++;
              return;
            }

            // Auto-categorize
            const category = autoCategorizze(description);

            transactions.push({
              date,
              description,
              amount,
              type,
              category,
              rawRow: row,
            });

            successCount++;
          } catch (error: any) {
            errors.push(`Row ${index + 1}: ${error.message}`);
            failCount++;
          }
        });

        resolve({
          success: transactions.length > 0,
          transactions,
          errors,
          summary: {
            totalRows: results.data.length,
            successfulImports: successCount,
            failedRows: failCount,
          },
        });
      },
      error: (error) => {
        resolve({
          success: false,
          transactions: [],
          errors: [`CSV parsing error: ${error.message}`],
          summary: {
            totalRows: 0,
            successfulImports: 0,
            failedRows: 0,
          },
        });
      },
    });
  });
};

// ============================================
// PDF PARSING (Basic)
// ============================================

/**
 * Parse PDF file and extract transactions
 * Note: PDF parsing is complex and may not work for all bank formats
 */
export const parsePDF = async (file: File): Promise<ParseResult> => {
  try {
    // For browser environment, we need to use a different approach
    // pdf-parse is designed for Node.js, so we'll provide a basic implementation
    
    const arrayBuffer = await file.arrayBuffer();
    const text = await extractTextFromPDF(arrayBuffer);

    if (!text) {
      return {
        success: false,
        transactions: [],
        errors: ['Could not extract text from PDF. The PDF might be scanned or encrypted.'],
        summary: { totalRows: 0, successfulImports: 0, failedRows: 0 },
      };
    }

    // Try to parse transactions from text
    const transactions = parseTransactionsFromText(text);

    if (transactions.length === 0) {
      return {
        success: false,
        transactions: [],
        errors: [
          'Could not automatically parse transactions from PDF.',
          'Please convert your bank statement to CSV format for better results.',
        ],
        summary: { totalRows: 0, successfulImports: 0, failedRows: 0 },
      };
    }

    return {
      success: true,
      transactions,
      errors: [],
      summary: {
        totalRows: transactions.length,
        successfulImports: transactions.length,
        failedRows: 0,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      transactions: [],
      errors: [`PDF parsing error: ${error.message}. Please use CSV format for reliable imports.`],
      summary: { totalRows: 0, successfulImports: 0, failedRows: 0 },
    };
  }
};

/**
 * Extract text from PDF (simplified browser version)
 */
const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    // Import pdf.js dynamically for browser
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    return '';
  }
};

/**
 * Parse transactions from extracted PDF text
 * This is a basic implementation and may need customization per bank
 */
const parseTransactionsFromText = (text: string): ParsedTransaction[] => {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split('\n');

  // Try to find transaction patterns
  // Example pattern: DATE DESCRIPTION DEBIT CREDIT BALANCE
  const transactionPattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)?/gi;

  lines.forEach((line) => {
    const match = transactionPattern.exec(line);
    if (match) {
      const [, dateStr, description, amount1Str, amount2Str] = match;

      const date = parseDate(dateStr);
      if (!date) return;

      const amount1 = parseAmount(amount1Str);
      const amount2 = parseAmount(amount2Str);

      let amount: number;
      let type: 'income' | 'expense';

      // Determine which column is debit/credit
      if (amount1 && !amount2) {
        amount = amount1;
        type = 'expense'; // Assume single amount is debit
      } else if (!amount1 && amount2) {
        amount = amount2;
        type = 'income'; // Assume it's credit
      } else if (amount1 && amount2) {
        // Both present, use the first non-zero
        amount = amount1;
        type = 'expense';
      } else {
        return; // Skip if no valid amount
      }

      transactions.push({
        date,
        description: description.trim(),
        amount,
        type,
        category: autoCategorizze(description),
      });
    }
  });

  return transactions;
};

// ============================================
// MAIN PARSER FUNCTION
// ============================================

/**
 * Parse bank statement file (CSV or PDF)
 */
export const parseBankStatement = async (file: File): Promise<ParseResult> => {
  const fileType = file.name.toLowerCase().split('.').pop();

  if (fileType === 'csv') {
    return await parseCSV(file);
  } else if (fileType === 'pdf') {
    return await parsePDF(file);
  } else {
    return {
      success: false,
      transactions: [],
      errors: [`Unsupported file type: ${fileType}. Please upload CSV or PDF files.`],
      summary: { totalRows: 0, successfulImports: 0, failedRows: 0 },
    };
  }
};
