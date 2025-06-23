/**
 * Finance Schemas - Train Station Dashboard API Standards
 * Comprehensive validation schemas for Financial Transactions, Categories, and Accounts
 * with business rule enforcement and financial reporting validation
 */

import { z } from 'zod';

// Base validation schemas
const CurrencySchema = z.number().min(0, 'Amount must be positive');
const TaxRateSchema = z.number().min(0).max(1, 'Tax rate must be between 0 and 1');

// Account schemas
const AccountBaseFields = z.object({
  name: z.string()
    .min(1, 'Account name is required')
    .max(100, 'Account name must be less than 100 characters')
    .trim(),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense'])
    .describe('Type of account'),
  subtype: z.enum([
    'checking', 'savings', 'cash', 'accounts_receivable', 'inventory',
    'accounts_payable', 'credit_card', 'loan', 'equity',
    'sales_revenue', 'service_revenue', 'other_revenue',
    'cost_of_goods', 'operating_expense', 'administrative_expense'
  ]).describe('Account subtype'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  accountNumber: z.string()
    .max(50, 'Account number must be less than 50 characters')
    .optional(),
  isActive: z.boolean().default(true),
  parentAccountId: z.string().uuid().optional()
});

export const CreateAccountSchema = AccountBaseFields;

export const UpdateAccountSchema = z.object({
  id: z.string().uuid('Invalid account ID')
}).merge(AccountBaseFields.partial());

// Transaction Category schemas
const CategoryBaseFields = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters')
    .trim(),
  type: z.enum(['income', 'expense'])
    .describe('Whether this category represents income or expense'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (use #RRGGBB)')
    .optional(),
  taxDeductible: z.boolean().default(false),
  requiresReceipt: z.boolean().default(false),
  budgetLimit: CurrencySchema.optional(),
  parentCategoryId: z.string().uuid().optional(),
  isActive: z.boolean().default(true)
});

export const CreateTransactionCategorySchema = CategoryBaseFields;

export const UpdateTransactionCategorySchema = z.object({
  id: z.string().uuid('Invalid category ID')
}).merge(CategoryBaseFields.partial());

// Financial Transaction base fields
const TransactionBaseFields = z.object({
  type: z.enum(['income', 'expense', 'transfer', 'adjustment', 'refund'])
    .describe('Type of financial transaction'),
  amount: CurrencySchema.describe('Transaction amount'),
  currency: z.string().length(3, 'Currency must be 3-character code (e.g., USD)').default('USD'),
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description must be less than 500 characters')
    .trim(),
  categoryId: z.string().uuid('Invalid category ID'),
  accountId: z.string().uuid('Invalid account ID'),
  toAccountId: z.string().uuid().optional(), // For transfers
  date: z.string().datetime().default(() => new Date().toISOString()),
  reference: z.string()
    .max(100, 'Reference must be less than 100 characters')
    .optional(),
  receiptUrl: z.string().url('Invalid receipt URL').optional(),
  taxAmount: CurrencySchema.optional(),
  taxRate: TaxRateSchema.optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
    interval: z.number().min(1).max(365),
    endDate: z.string().datetime().optional()
  }).optional(),
  tags: z.array(z.string().trim().min(1)).max(20, 'Maximum 20 tags allowed').default([]),
  relatedEntityId: z.string().uuid().optional(),
  relatedEntityType: z.enum(['event', 'artist', 'customer', 'vendor', 'equipment']).optional(),
  staffMember: z.string()
    .max(100, 'Staff member name must be less than 100 characters')
    .optional(),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
  isApproved: z.boolean().default(false),
  approvedBy: z.string().max(100).optional(),
  approvedAt: z.string().datetime().optional()
});

// Transaction creation with business rules
export const CreateTransactionSchema = TransactionBaseFields.refine(
  (data) => {
    // Transfer transactions must have toAccountId
    if (data.type === 'transfer' && !data.toAccountId) {
      return false;
    }
    return true;
  },
  {
    message: 'Transfer transactions must specify destination account',
    path: ['toAccountId']
  }
).refine(
  (data) => {
    // Tax amount cannot exceed transaction amount
    if (data.taxAmount && data.taxAmount > data.amount) {
      return false;
    }
    return true;
  },
  {
    message: 'Tax amount cannot exceed transaction amount',
    path: ['taxAmount']
  }
).refine(
  (data) => {
    // If recurring, must have pattern
    if (data.isRecurring && !data.recurringPattern) {
      return false;
    }
    return true;
  },
  {
    message: 'Recurring transactions must specify pattern',
    path: ['recurringPattern']
  }
).refine(
  (data) => {
    // If relatedEntityId provided, must have type
    if (data.relatedEntityId && !data.relatedEntityType) {
      return false;
    }
    return true;
  },
  {
    message: 'Related entity type is required when related entity ID is provided',
    path: ['relatedEntityType']
  }
);

// Transaction update schema
export const UpdateTransactionSchema = z.object({
  id: z.string().uuid('Invalid transaction ID')
}).merge(TransactionBaseFields.partial()).refine(
  (data) => {
    if (data.type === 'transfer' && data.toAccountId === undefined) {
      return false;
    }
    return true;
  },
  {
    message: 'Transfer transactions must specify destination account',
    path: ['toAccountId']
  }
);

// Query schemas
export const TransactionQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(['income', 'expense', 'transfer', 'adjustment', 'refund']).optional(),
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional()
  }).optional(),
  amountRange: z.object({
    min: CurrencySchema.optional(),
    max: CurrencySchema.optional()
  }).optional(),
  tags: z.array(z.string()).optional(),
  currency: z.string().length(3).optional(),
  isRecurring: z.boolean().optional(),
  isApproved: z.boolean().optional(),
  staffMember: z.string().optional(),
  relatedEntityType: z.enum(['event', 'artist', 'customer', 'vendor', 'equipment']).optional(),
  hasReceipt: z.boolean().optional(),
  // Pagination
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  // Sorting
  sortBy: z.enum(['date', 'amount', 'description', 'category', 'type']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Financial Report schemas
export const FinancialReportSchema = z.object({
  reportType: z.enum(['profit_loss', 'balance_sheet', 'cash_flow', 'expense_report', 'revenue_report']),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }),
  includeSubcategories: z.boolean().default(true),
  currency: z.string().length(3).default('USD'),
  compareToLastPeriod: z.boolean().default(false),
  groupBy: z.enum(['category', 'account', 'month', 'quarter']).optional()
});

// Budget schemas
export const BudgetBaseFields = z.object({
  name: z.string()
    .min(1, 'Budget name is required')
    .max(100, 'Budget name must be less than 100 characters')
    .trim(),
  categoryId: z.string().uuid('Invalid category ID'),
  amount: CurrencySchema.describe('Budget amount'),
  period: z.enum(['monthly', 'quarterly', 'yearly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  alertThreshold: z.number().min(0).max(1).default(0.8)
    .describe('Alert when spending reaches this percentage of budget'),
  isActive: z.boolean().default(true)
});

export const CreateBudgetSchema = BudgetBaseFields.refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'End date must be after start date',
    path: ['endDate']
  }
);

export const UpdateBudgetSchema = z.object({
  id: z.string().uuid('Invalid budget ID')
}).merge(BudgetBaseFields.partial());

// Bulk operations
export const BulkTransactionUpdateSchema = z.object({
  transactionIds: z.array(z.string().uuid()).min(1).max(100),
  updates: z.object({
    categoryId: z.string().uuid().optional(),
    tags: z.array(z.string()).optional(),
    isApproved: z.boolean().optional(),
    approvedBy: z.string().max(100).optional()
  })
});

export const BulkTransactionApprovalSchema = z.object({
  transactionIds: z.array(z.string().uuid()).min(1).max(100),
  approve: z.boolean(),
  approvedBy: z.string()
    .min(1, 'Approver name is required')
    .max(100, 'Approver name must be less than 100 characters')
});

// ID validation schemas
export const TransactionIdSchema = z.object({
  id: z.string().uuid('Invalid transaction ID')
});

export const AccountIdSchema = z.object({
  id: z.string().uuid('Invalid account ID')
});

export const CategoryIdSchema = z.object({
  id: z.string().uuid('Invalid category ID')
});

export const BudgetIdSchema = z.object({
  id: z.string().uuid('Invalid budget ID')
});

// Export TypeScript types
export type CreateTransactionRequest = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionRequest = z.infer<typeof UpdateTransactionSchema>;
export type CreateAccountRequest = z.infer<typeof CreateAccountSchema>;
export type UpdateAccountRequest = z.infer<typeof UpdateAccountSchema>;
export type CreateTransactionCategoryRequest = z.infer<typeof CreateTransactionCategorySchema>;
export type UpdateTransactionCategoryRequest = z.infer<typeof UpdateTransactionCategorySchema>;
export type CreateBudgetRequest = z.infer<typeof CreateBudgetSchema>;
export type UpdateBudgetRequest = z.infer<typeof UpdateBudgetSchema>;
export type TransactionQueryRequest = z.infer<typeof TransactionQuerySchema>;
export type FinancialReportRequest = z.infer<typeof FinancialReportSchema>;
export type BulkTransactionUpdateRequest = z.infer<typeof BulkTransactionUpdateSchema>;
export type BulkTransactionApprovalRequest = z.infer<typeof BulkTransactionApprovalSchema>;

// Enhanced interfaces
export interface Account {
  id: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subtype: string;
  description?: string;
  accountNumber?: string;
  balance: number;
  isActive: boolean;
  parentAccountId?: string;
  parentAccount?: Account;
  childAccounts?: Account[];
  createdAt: string;
  updatedAt: string;
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  description?: string;
  color?: string;
  taxDeductible: boolean;
  requiresReceipt: boolean;
  budgetLimit?: number;
  parentCategoryId?: string;
  parentCategory?: TransactionCategory;
  childCategories?: TransactionCategory[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Enhanced fields
  metrics?: {
    totalAmount: number;
    transactionCount: number;
    averageAmount: number;
    monthlyTrend: number;
    budgetUsage?: number;
  };
}

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense' | 'transfer' | 'adjustment' | 'refund';
  amount: number;
  currency: string;
  description: string;
  categoryId: string;
  category?: TransactionCategory;
  accountId: string;
  account?: Account;
  toAccountId?: string;
  toAccount?: Account;
  date: string;
  reference?: string;
  receiptUrl?: string;
  taxAmount?: number;
  taxRate?: number;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  tags: string[];
  relatedEntityId?: string;
  relatedEntityType?: 'event' | 'artist' | 'customer' | 'vendor' | 'equipment';
  staffMember?: string;
  notes?: string;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Enhanced fields
  netAmount?: number; // Amount after tax
  accountBalance?: number; // Account balance after this transaction
}

export interface Budget {
  id: string;
  name: string;
  categoryId: string;
  category?: TransactionCategory;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  alertThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Enhanced fields
  spent?: number;
  remaining?: number;
  percentageUsed?: number;
  isOverBudget?: boolean;
  projectedSpend?: number;
}

export interface FinancialReport {
  reportType: 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'expense_report' | 'revenue_report';
  dateRange: {
    start: string;
    end: string;
  };
  currency: string;
  data: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    categories: Array<{
      categoryId: string;
      categoryName: string;
      amount: number;
      percentage: number;
      transactionCount: number;
    }>;
    accounts?: Array<{
      accountId: string;
      accountName: string;
      balance: number;
      transactions: number;
    }>;
    trends?: {
      monthlyTotals: Array<{
        month: string;
        income: number;
        expenses: number;
        net: number;
      }>;
    };
  };
  generatedAt: string;
}

export const FinancialReportResponseSchema = z.object({
  reportType: z.enum(['profit_loss', 'balance_sheet', 'cash_flow', 'expense_report', 'revenue_report']),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  currency: z.string(),
  data: z.object({
    totalIncome: z.number(),
    totalExpenses: z.number(),
    netIncome: z.number(),
    categories: z.array(
      z.object({
        categoryId: z.string(),
        categoryName: z.string(),
        amount: z.number(),
        percentage: z.number(),
        transactionCount: z.number(),
      })
    ),
    accounts: z
      .array(
        z.object({
          accountId: z.string(),
          accountName: z.string(),
          balance: z.number(),
          transactions: z.number(),
        })
      )
      .optional(),
    trends: z
      .object({
        monthlyTotals: z.array(
          z.object({
            month: z.string(),
            income: z.number(),
            expenses: z.number(),
            net: z.number(),
          })
        ),
      })
      .optional(),
  }),
  generatedAt: z.string().datetime(),
});

export type FinancialReportResponse = z.infer<typeof FinancialReportResponseSchema>;

// Business rule validation utilities
export const validateFinanceBusinessRules = {
  canDeleteTransaction: (transaction: FinancialTransaction): { valid: boolean; reason?: string } => {
    if (transaction.isApproved) {
      return {
        valid: false,
        reason: 'Cannot delete approved transactions. Please unapprove first.'
      };
    }
    
    if (transaction.isRecurring) {
      return {
        valid: false,
        reason: 'Cannot delete recurring transactions. Disable recurring pattern first.'
      };
    }
    
    return { valid: true };
  },

  canApproveTransaction: (transaction: FinancialTransaction, approver: string): { valid: boolean; reason?: string } => {
    if (transaction.isApproved) {
      return {
        valid: false,
        reason: 'Transaction is already approved'
      };
    }
    
    if (transaction.staffMember === approver) {
      return {
        valid: false,
        reason: 'Cannot approve your own transactions'
      };
    }
    
    return { valid: true };
  },

  canEditTransaction: (transaction: FinancialTransaction): { valid: boolean; reason?: string } => {
    if (transaction.isApproved) {
      return {
        valid: false,
        reason: 'Cannot edit approved transactions'
      };
    }
    
    return { valid: true };
  },

  validateTransactionAmount: (amount: number, account: Account): { valid: boolean; reason?: string } => {
    if (account.type === 'asset' && account.balance < amount) {
      return {
        valid: false,
        reason: 'Insufficient funds in account'
      };
    }
    
    return { valid: true };
  },

  checkBudgetCompliance: (transaction: FinancialTransaction, budget?: Budget): { valid: boolean; reason?: string; warning?: string } => {
    if (!budget || transaction.type !== 'expense') {
      return { valid: true };
    }
    
    const projectedSpend = (budget.spent || 0) + transaction.amount;
    const budgetUsage = projectedSpend / budget.amount;
    
    if (budgetUsage > 1) {
      return {
        valid: false,
        reason: `Transaction would exceed budget by $${(projectedSpend - budget.amount).toFixed(2)}`
      };
    }
    
    if (budgetUsage > budget.alertThreshold) {
      return {
        valid: true,
        warning: `Transaction will use ${(budgetUsage * 100).toFixed(1)}% of budget`
      };
    }
    
    return { valid: true };
  },

  validateRecurringPattern: (pattern: { frequency?: string; interval?: number; endDate?: string }): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!pattern.frequency) {
      errors.push('Frequency is required for recurring transactions');
    }
    
    if (!pattern.interval || pattern.interval < 1) {
      errors.push('Interval must be at least 1');
    }
    
    if (pattern.frequency === 'daily' && pattern.interval > 365) {
      errors.push('Daily interval cannot exceed 365 days');
    }
    
    if (pattern.endDate && new Date(pattern.endDate) <= new Date()) {
      errors.push('End date must be in the future');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  calculateTaxAmount: (amount: number, taxRate: number): number => {
    return Math.round(amount * taxRate * 100) / 100;
  },

  calculateNetAmount: (amount: number, taxAmount?: number): number => {
    return amount - (taxAmount || 0);
  }
}; 