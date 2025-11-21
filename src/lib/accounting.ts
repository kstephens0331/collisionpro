/**
 * Integrated Accounting Library
 *
 * Double-entry accounting with chart of accounts, journal entries, and financial reporting
 */

export interface Account {
  id: string;
  shopId: string;
  accountNumber: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  accountSubtype?: string;
  parentAccountId?: string;
  description?: string;
  normalBalance: 'debit' | 'credit';
  isActive: boolean;
  isSystem: boolean;
  allowManualEntry: boolean;
  currentBalance: number;
  ytdBalance: number;
  level: number;
  fullPath?: string;
}

export interface JournalEntry {
  id: string;
  shopId: string;
  entryNumber: string;
  entryDate: Date;
  postDate?: Date;
  entryType: 'general' | 'closing' | 'adjusting' | 'reversing';
  source: string;
  sourceId?: string;
  description: string;
  memo?: string;
  status: 'draft' | 'posted' | 'void';
  isRecurring: boolean;
  recurringFrequency?: string;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  createdBy?: string;
  postedBy?: string;
  voidedBy?: string;
  voidedAt?: Date;
  voidReason?: string;
  lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  accountName?: string;
  accountNumber?: string;
  lineNumber: number;
  description?: string;
  debitAmount: number;
  creditAmount: number;
  customerId?: string;
  vendorId?: string;
  estimateId?: string;
}

export interface AccountingPeriod {
  id: string;
  shopId: string;
  periodName: string;
  startDate: Date;
  endDate: Date;
  fiscalYear: number;
  fiscalQuarter?: number;
  fiscalMonth?: number;
  status: 'open' | 'closed' | 'locked';
  closedDate?: Date;
  closedBy?: string;
  totalRevenue?: number;
  totalExpenses?: number;
  netIncome?: number;
}

export interface Budget {
  id: string;
  shopId: string;
  accountId: string;
  accountName?: string;
  fiscalYear: number;
  fiscalMonth: number;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  notes?: string;
}

export interface FinancialStatement {
  shopId: string;
  statementDate: Date;
  periodStart: Date;
  periodEnd: Date;
  accounts: AccountBalance[];
  totals: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
  };
}

export interface AccountBalance {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  balance: number;
  children?: AccountBalance[];
}

/**
 * Validate journal entry is balanced
 */
export function validateJournalBalance(entry: JournalEntry): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!entry.lines || entry.lines.length === 0) {
    errors.push('Journal entry must have at least one line');
    return { isValid: false, errors };
  }

  const totalDebits = entry.lines.reduce((sum, line) => sum + line.debitAmount, 0);
  const totalCredits = entry.lines.reduce((sum, line) => sum + line.creditAmount, 0);

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    errors.push(`Entry is not balanced: Debits ($${totalDebits.toFixed(2)}) != Credits ($${totalCredits.toFixed(2)})`);
  }

  entry.lines.forEach((line, idx) => {
    if (line.debitAmount > 0 && line.creditAmount > 0) {
      errors.push(`Line ${idx + 1}: Cannot have both debit and credit on same line`);
    }
    if (line.debitAmount === 0 && line.creditAmount === 0) {
      errors.push(`Line ${idx + 1}: Must have either a debit or credit amount`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculate net change for an account
 */
export function calculateAccountChange(
  account: Account,
  debitAmount: number,
  creditAmount: number
): number {
  if (account.normalBalance === 'debit') {
    return debitAmount - creditAmount;
  } else {
    return creditAmount - debitAmount;
  }
}

/**
 * Generate Balance Sheet
 */
export function generateBalanceSheet(
  accounts: Account[],
  asOfDate: Date
): FinancialStatement {
  const assets = accounts.filter(a => a.accountType === 'asset' && a.isActive);
  const liabilities = accounts.filter(a => a.accountType === 'liability' && a.isActive);
  const equity = accounts.filter(a => a.accountType === 'equity' && a.isActive);

  const totalAssets = sumAccountBalances(assets);
  const totalLiabilities = sumAccountBalances(liabilities);
  const totalEquity = sumAccountBalances(equity);

  return {
    shopId: accounts[0]?.shopId || '',
    statementDate: asOfDate,
    periodStart: new Date(asOfDate.getFullYear(), 0, 1),
    periodEnd: asOfDate,
    accounts: [
      ...buildAccountHierarchy(assets),
      ...buildAccountHierarchy(liabilities),
      ...buildAccountHierarchy(equity),
    ],
    totals: {
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: totalAssets - totalLiabilities - totalEquity,
    },
  };
}

/**
 * Generate Profit & Loss Statement
 */
export function generateProfitLoss(
  accounts: Account[],
  startDate: Date,
  endDate: Date
): FinancialStatement {
  const revenue = accounts.filter(a => a.accountType === 'revenue' && a.isActive);
  const expenses = accounts.filter(a => a.accountType === 'expense' && a.isActive);

  const totalRevenue = sumAccountBalances(revenue);
  const totalExpenses = sumAccountBalances(expenses);
  const netIncome = totalRevenue - totalExpenses;

  return {
    shopId: accounts[0]?.shopId || '',
    statementDate: endDate,
    periodStart: startDate,
    periodEnd: endDate,
    accounts: [
      ...buildAccountHierarchy(revenue),
      ...buildAccountHierarchy(expenses),
    ],
    totals: {
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
      totalRevenue,
      totalExpenses,
      netIncome,
    },
  };
}

/**
 * Calculate gross profit margin
 */
export function calculateGrossMargin(revenue: number, cogs: number): {
  grossProfit: number;
  grossMargin: number;
} {
  const grossProfit = revenue - cogs;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  return { grossProfit, grossMargin };
}

/**
 * Calculate operating profit
 */
export function calculateOperatingProfit(
  revenue: number,
  cogs: number,
  operatingExpenses: number
): {
  operatingProfit: number;
  operatingMargin: number;
} {
  const operatingProfit = revenue - cogs - operatingExpenses;
  const operatingMargin = revenue > 0 ? (operatingProfit / revenue) * 100 : 0;
  return { operatingProfit, operatingMargin };
}

/**
 * Calculate key financial ratios
 */
export function calculateFinancialRatios(statement: FinancialStatement): {
  currentRatio?: number;
  quickRatio?: number;
  debtToEquity?: number;
  returnOnAssets?: number;
  returnOnEquity?: number;
  profitMargin?: number;
} {
  const { totals } = statement;

  return {
    currentRatio: totals.totalLiabilities > 0
      ? totals.totalAssets / totals.totalLiabilities
      : undefined,
    debtToEquity: totals.totalEquity > 0
      ? totals.totalLiabilities / totals.totalEquity
      : undefined,
    returnOnAssets: totals.totalAssets > 0
      ? (totals.netIncome / totals.totalAssets) * 100
      : undefined,
    returnOnEquity: totals.totalEquity > 0
      ? (totals.netIncome / totals.totalEquity) * 100
      : undefined,
    profitMargin: totals.totalRevenue > 0
      ? (totals.netIncome / totals.totalRevenue) * 100
      : undefined,
  };
}

/**
 * Calculate budget variance
 */
export function calculateBudgetVariance(
  budgeted: number,
  actual: number
): {
  variance: number;
  variancePercent: number;
  status: 'over' | 'under' | 'on-budget';
} {
  const variance = actual - budgeted;
  const variancePercent = budgeted !== 0 ? (variance / budgeted) * 100 : 0;

  let status: 'over' | 'under' | 'on-budget' = 'on-budget';
  if (Math.abs(variancePercent) < 5) {
    status = 'on-budget';
  } else if (variance > 0) {
    status = 'over';
  } else {
    status = 'under';
  }

  return { variance, variancePercent, status };
}

/**
 * Helper: Sum account balances
 */
function sumAccountBalances(accounts: Account[]): number {
  return accounts.reduce((sum, account) => sum + account.currentBalance, 0);
}

/**
 * Helper: Build account hierarchy for reporting
 */
function buildAccountHierarchy(accounts: Account[]): AccountBalance[] {
  const sorted = [...accounts].sort((a, b) => {
    const numA = parseInt(a.accountNumber);
    const numB = parseInt(b.accountNumber);
    return numA - numB;
  });

  return sorted.map(account => ({
    accountId: account.id,
    accountNumber: account.accountNumber,
    accountName: account.accountName,
    accountType: account.accountType,
    balance: account.currentBalance,
  }));
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get account type color for UI
 */
export function getAccountTypeColor(accountType: string): string {
  const colors = {
    asset: 'bg-blue-100 text-blue-800',
    liability: 'bg-red-100 text-red-800',
    equity: 'bg-purple-100 text-purple-800',
    revenue: 'bg-green-100 text-green-800',
    expense: 'bg-orange-100 text-orange-800',
  };
  return colors[accountType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
}

/**
 * Get journal entry status color
 */
export function getJournalStatusColor(status: string): string {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    posted: 'bg-green-100 text-green-800',
    void: 'bg-red-100 text-red-800',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
}

/**
 * Get budget variance color
 */
export function getVarianceColor(status: string): string {
  const colors = {
    'on-budget': 'bg-green-100 text-green-800',
    under: 'bg-blue-100 text-blue-800',
    over: 'bg-red-100 text-red-800',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
}

/**
 * Auto-generate journal entries from estimates (revenue recognition)
 */
export function generateRevenueJournalEntry(
  estimateId: string,
  totalAmount: number,
  laborAmount: number,
  partsAmount: number,
  paintAmount: number
): Partial<JournalEntry> {
  const lines: Omit<JournalEntryLine, 'id' | 'journalEntryId' | 'createdAt'>[] = [];
  let lineNumber = 1;

  // Debit: Accounts Receivable
  lines.push({
    accountId: 'acc-1200', // AR account
    lineNumber: lineNumber++,
    description: 'Revenue from estimate',
    debitAmount: totalAmount,
    creditAmount: 0,
    estimateId,
  });

  // Credit: Labor Revenue
  if (laborAmount > 0) {
    lines.push({
      accountId: 'acc-4100',
      lineNumber: lineNumber++,
      description: 'Labor revenue',
      debitAmount: 0,
      creditAmount: laborAmount,
      estimateId,
    });
  }

  // Credit: Parts Revenue
  if (partsAmount > 0) {
    lines.push({
      accountId: 'acc-4200',
      lineNumber: lineNumber++,
      description: 'Parts revenue',
      debitAmount: 0,
      creditAmount: partsAmount,
      estimateId,
    });
  }

  // Credit: Paint & Materials Revenue
  if (paintAmount > 0) {
    lines.push({
      accountId: 'acc-4300',
      lineNumber: lineNumber++,
      description: 'Paint & materials revenue',
      debitAmount: 0,
      creditAmount: paintAmount,
      estimateId,
    });
  }

  return {
    entryType: 'general',
    source: 'estimate',
    sourceId: estimateId,
    description: `Revenue from estimate ${estimateId}`,
    status: 'draft',
    isRecurring: false,
    totalDebit: totalAmount,
    totalCredit: totalAmount,
    isBalanced: true,
    lines: lines as JournalEntryLine[],
  };
}

/**
 * Generate journal entry for payment received
 */
export function generatePaymentJournalEntry(
  paymentId: string,
  amount: number,
  paymentMethod: 'cash' | 'check' | 'credit-card' | 'ach'
): Partial<JournalEntry> {
  const cashAccountId = paymentMethod === 'cash' || paymentMethod === 'check'
    ? 'acc-1110'
    : 'acc-1120';

  const lines: Omit<JournalEntryLine, 'id' | 'journalEntryId' | 'createdAt'>[] = [
    {
      accountId: cashAccountId,
      lineNumber: 1,
      description: `Payment received via ${paymentMethod}`,
      debitAmount: amount,
      creditAmount: 0,
    },
    {
      accountId: 'acc-1200', // AR
      lineNumber: 2,
      description: 'Payment applied to AR',
      debitAmount: 0,
      creditAmount: amount,
    },
  ];

  return {
    entryType: 'general',
    source: 'payment',
    sourceId: paymentId,
    description: `Payment received - ${paymentMethod}`,
    status: 'draft',
    isRecurring: false,
    totalDebit: amount,
    totalCredit: amount,
    isBalanced: true,
    lines: lines as JournalEntryLine[],
  };
}

/**
 * Common account types for quick lookups
 */
export const ACCOUNT_TYPES = {
  CASH: 'acc-1110',
  AR: 'acc-1200',
  INVENTORY_PARTS: 'acc-1300',
  INVENTORY_PAINT: 'acc-1310',
  AP: 'acc-2110',
  LABOR_REVENUE: 'acc-4100',
  PARTS_REVENUE: 'acc-4200',
  PAINT_REVENUE: 'acc-4300',
  PARTS_COST: 'acc-5100',
  PAINT_COST: 'acc-5200',
} as const;
