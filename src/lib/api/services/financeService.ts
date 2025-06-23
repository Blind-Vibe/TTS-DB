import { SupabaseAdapter, type QueryOptions } from '../adapters/supabaseAdapter';
import { validateQuery, validateParams } from '../validation';
import { UserRole } from '../auth';
import type { ApiResponse } from '../types';
import { supabase } from '../../supabase';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  TransactionQuerySchema,
  TransactionIdSchema,
  CreateAccountSchema,
  CreateBudgetSchema,
  validateFinanceBusinessRules,
  type CreateTransactionRequest,
  type UpdateTransactionRequest,
  type TransactionQueryRequest,
  type FinancialTransaction,
  type Account,
  type CreateAccountRequest,
  type Budget,
  type CreateBudgetRequest,
  type FinancialReport,
} from '../schemas/financeSchemas';
import { ValidationError } from '../errors';

// Enhanced Transaction type
type EnhancedTransaction = FinancialTransaction & {
  metrics?: {
    totalAmount: number;
    transactionCount: number;
    averageAmount: number;
  };
};

export class FinanceService {
  private adapter: SupabaseAdapter;

  constructor() {
    this.adapter = new SupabaseAdapter();
  }

  /**
   * Get all transactions with filtering and pagination
   */
  async getTransactions(query: Partial<TransactionQueryRequest> = {}): Promise<ApiResponse<FinancialTransaction[]>> {
    // 1. Validate query parameters with defaults
    const queryWithDefaults = {
      limit: 20,
      offset: 0,
      ...query
    };
    
    const validationResult = validateQuery(TransactionQuerySchema, queryWithDefaults);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const { limit, offset, type, categoryId, accountId, search, dateRange } = validationResult.data;

    // 2. Build query options
    const queryOptions: QueryOptions = {
      select: `
        *,
        accounts(*),
        transaction_approvals(*),
        transaction_receipts(*)
      `,
      orderBy: { column: 'date', ascending: false },
      limit,
      offset,
      filters: {}
    };

    // Apply filters
    if (type) queryOptions.filters!.type = type;
    if (categoryId) queryOptions.filters!.category_id = categoryId;
    if (accountId) queryOptions.filters!.account_id = accountId;
    if (dateRange?.start) queryOptions.filters!['date'] = { operator: 'gte', value: dateRange.start };
    if (dateRange?.end) queryOptions.filters!['date'] = { operator: 'lte', value: dateRange.end };

    // 3. Execute query with adapter
    const response = await this.adapter.executeQuery(
      {
        tableName: 'financial_transactions',
        rateLimitKey: 'finance:transactions:read',
        enableLogging: true,
      },
      async () => {
        let query = this.adapter.buildQuery('financial_transactions', queryOptions);
        
        // Add search filter if provided
        if (search) {
          query = query.or(`description.ilike.%${search}%, reference.ilike.%${search}%, notes.ilike.%${search}%`);
        }
        
        return query;
      },
      'read'
    );

    if (response.success) {
      // Transform data to our Transaction format
      const transactions = Array.isArray(response.data) ? response.data : [response.data];
      const transformedTransactions = transactions.map(transaction => this.transformTransactionFromDb(transaction as Record<string, unknown>));
      
      return {
        ...response,
        data: transformedTransactions
      };
    }
    return response as ApiResponse<Transaction[]>;
  }

  /**
   * Get enhanced transactions with calculated metrics
   */
  async getEnhancedTransactions(query: Partial<TransactionQueryRequest> = {}): Promise<ApiResponse<EnhancedTransaction[]>> {
    const transactionsResponse = await this.getTransactions(query);
    if (!transactionsResponse.success) {
      return transactionsResponse as ApiResponse<EnhancedTransaction[]>;
    }

    const enhancedTransactions = await Promise.all(
      transactionsResponse.data.map(async (transaction) => {
        const metrics = await this.calculateTransactionMetrics(transaction.id);
        return {
          ...transaction,
          metrics: metrics.success ? metrics.data : undefined
        } as EnhancedTransaction;
      })
    );

    return {
      ...transactionsResponse,
      data: enhancedTransactions
    };
  }

  /**
   * Get a single transaction by ID
   */
  async getTransactionById(id: string): Promise<ApiResponse<Transaction>> {
    // 1. Validate ID
    const validationResult = validateParams(TransactionIdSchema, { id });
    if (!validationResult.success) {
      return validationResult.error;
    }

    // 2. Execute query
    const response = await this.adapter.executeQuery(
      {
        tableName: 'financial_transactions',
        rateLimitKey: 'finance:transactions:read',
        enableLogging: true,
      },
      async () => {
        return this.adapter.buildQuery('financial_transactions', {
          select: `
            *,
            accounts(*),
            transaction_approvals(*),
            transaction_receipts(*)
          `,
          filters: { id }
        });
      },
      'read'
    );

    if (response.success) {
      return {
        ...response,
        data: this.transformTransactionFromDb(response.data as Record<string, unknown>)
      };
    }
    return response as ApiResponse<Transaction>;
  }

  /**
   * Create a new transaction
   */
  async createTransaction(transactionData: CreateTransactionRequest): Promise<ApiResponse<Transaction>> {
    // 1. Validate input data
    const validationResult = validateParams(CreateTransactionSchema, transactionData);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const validatedData = validationResult.data;

    // 2. Apply business rules
    const businessRuleCheck = validateFinanceBusinessRules.validateApprovalWorkflow(validatedData);
    if (!businessRuleCheck.valid) {
      return {
        success: false,
        error: {
          type: 'https://docs.trainstation-dashboard.com/errors/business-rule-violation',
          title: 'Business Rule Violation',
          status: 400,
          detail: businessRuleCheck.reason || 'Transaction data violates business rules',
          instance: '/api/finance/transactions',
          timestamp: new Date().toISOString()
        },
        meta: {
          requestId: crypto.randomUUID(),
          source: 'validation'
        }
      };
    }

    // 3. Check budget compliance if applicable
    if (validatedData.type === 'expense') {
      const budgetCheck = await this.checkBudgetCompliance(validatedData);
      if (!budgetCheck.valid) {
        return {
          success: false,
          error: {
            type: 'https://docs.trainstation-dashboard.com/errors/budget-violation',
            title: 'Budget Compliance Violation',
            status: 400,
            detail: budgetCheck.reason || 'Transaction exceeds budget limits',
            instance: '/api/finance/transactions',
            timestamp: new Date().toISOString()
          },
          meta: {
            requestId: crypto.randomUUID(),
            source: 'budget-validation'
          }
        };
      }
    }

    // 4. Execute with appropriate permissions
    const response = await this.adapter.executeQuery(
      {
        tableName: 'financial_transactions',
        requiredRole: UserRole.STAFF, // Staff and above can create transactions
        rateLimitKey: 'finance:transactions:create',
        enableLogging: true,
      },
      async () => {
        // Convert to database format
        const dbData = this.adapter.toSnakeCase({
          type: validatedData.type,
          category: validatedData.category,
          amount: validatedData.amount,
          description: validatedData.description,
          date: validatedData.date,
          accountId: validatedData.accountId,
          transferToAccountId: validatedData.transferToAccountId,
          reference: validatedData.reference,
          taxAmount: validatedData.taxAmount,
          taxRate: validatedData.taxRate,
          status: validatedData.status || 'pending',
          approvedBy: validatedData.approvedBy,
          approvedAt: validatedData.approvedAt,
          receiptUrl: validatedData.receiptUrl,
          notes: validatedData.notes,
          tags: validatedData.tags || [],
          metadata: validatedData.metadata,
          createdBy: validatedData.createdBy,
        });

        return this.adapter.buildQuery('financial_transactions')
          .insert([dbData])
          .select('*');
      },
      'write'
    );

    if (response.success) {
      const transactionArray = Array.isArray(response.data) ? response.data : [response.data];
      return {
        ...response,
        data: this.transformTransactionFromDb(transactionArray[0] as Record<string, unknown>)
      };
    }
    return response as ApiResponse<Transaction>;
  }

  /**
   * Update an existing transaction
   */
  async updateTransaction(id: string, updates: Omit<UpdateTransactionRequest, 'id'>): Promise<ApiResponse<Transaction>> {
    // 1. Validate ID and updates
    const idValidation = validateParams(TransactionIdSchema, { id });
    if (!idValidation.success) {
      return idValidation.error;
    }

    const updateValidation = validateParams(
      UpdateTransactionSchema.omit({ id: true }), 
      updates
    );
    if (!updateValidation.success) {
      return updateValidation.error;
    }

    // 2. Check if transaction exists and can be edited
    const existingTransactionResponse = await this.getTransactionById(id);
    if (!existingTransactionResponse.success) {
      return existingTransactionResponse;
    }

    const existingTransaction = existingTransactionResponse.data;
    const businessRuleCheck = validateFinanceBusinessRules.canEdit(existingTransaction);
    if (!businessRuleCheck.valid) {
      return {
        success: false,
        error: {
          type: 'https://docs.trainstation-dashboard.com/errors/business-rule-violation',
          title: 'Business Rule Violation',
          status: 400,
          detail: businessRuleCheck.reason || 'Cannot edit this transaction',
          instance: `/api/finance/transactions/${id}`,
          timestamp: new Date().toISOString()
        },
        meta: {
          requestId: crypto.randomUUID(),
          source: 'validation'
        }
      };
    }

    // 3. Execute update
    const response = await this.adapter.executeQuery(
      {
        tableName: 'financial_transactions',
        requiredRole: UserRole.STAFF,
        rateLimitKey: 'finance:transactions:update',
        enableLogging: true,
      },
      async () => {
        // Convert updates to database format
        const dbUpdates = this.adapter.toSnakeCase({
          ...updateValidation.data,
          updated_at: new Date().toISOString()
        });

        return this.adapter.buildQuery('financial_transactions')
          .update(dbUpdates)
          .eq('id', id)
          .select('*');
      },
      'write'
    );

    if (response.success) {
      const transactionArray = Array.isArray(response.data) ? response.data : [response.data];
      return {
        ...response,
        data: this.transformTransactionFromDb(transactionArray[0] as Record<string, unknown>)
      };
    }
    return response as ApiResponse<Transaction>;
  }

  /**
   * Approve a transaction
   */
  async approveTransaction(id: string, approverId: string, notes?: string): Promise<ApiResponse<Transaction>> {
    // 1. Validate ID
    const validationResult = validateParams(TransactionIdSchema, { id });
    if (!validationResult.success) {
      return validationResult.error;
    }

    // 2. Check if transaction can be approved
    const existingTransactionResponse = await this.getTransactionById(id);
    if (!existingTransactionResponse.success) {
      return existingTransactionResponse;
    }

    const existingTransaction = existingTransactionResponse.data;
    const businessRuleCheck = validateFinanceBusinessRules.canApprove(existingTransaction, approverId);
    if (!businessRuleCheck.valid) {
      return {
        success: false,
        error: {
          type: 'https://docs.trainstation-dashboard.com/errors/business-rule-violation',
          title: 'Cannot Approve Transaction',
          status: 400,
          detail: businessRuleCheck.reason || 'Transaction cannot be approved',
          instance: `/api/finance/transactions/${id}/approve`,
          timestamp: new Date().toISOString()
        },
        meta: {
          requestId: crypto.randomUUID(),
          source: 'validation'
        }
      };
    }

    // 3. Update transaction status to approved
    return this.updateTransaction(id, {
      status: 'approved',
      approvedBy: approverId,
      approvedAt: new Date().toISOString(),
      notes: notes ? `${existingTransaction.notes || ''}\nApproval: ${notes}`.trim() : existingTransaction.notes,
    });
  }

  /**
   * Delete a transaction (soft delete by default, hard delete for admins)
   */
  async deleteTransaction(id: string, hardDelete = false): Promise<ApiResponse<{ deleted: boolean }>> {
    // 1. Validate ID
    const validationResult = validateParams(TransactionIdSchema, { id });
    if (!validationResult.success) {
      return validationResult.error;
    }

    // 2. Check if transaction can be deleted
    const existingTransactionResponse = await this.getTransactionById(id);
    if (!existingTransactionResponse.success) {
      return existingTransactionResponse;
    }

    const existingTransaction = existingTransactionResponse.data;
    const businessRuleCheck = validateFinanceBusinessRules.canDelete(existingTransaction);
    if (!businessRuleCheck.valid) {
      return {
        success: false,
        error: {
          type: 'https://docs.trainstation-dashboard.com/errors/business-rule-violation',
          title: 'Cannot Delete Transaction',
          status: 400,
          detail: businessRuleCheck.reason || 'Transaction cannot be deleted',
          instance: `/api/finance/transactions/${id}`,
          timestamp: new Date().toISOString()
        },
        meta: {
          requestId: crypto.randomUUID(),
          source: 'validation'
        }
      };
    }

    if (hardDelete) {
      // 3. Hard delete (admin only)
      const response = await this.adapter.executeQuery(
        {
          tableName: 'financial_transactions',
          requiredRole: UserRole.ADMIN,
          rateLimitKey: 'finance:transactions:delete',
          enableLogging: true,
        },
        async () => {
          return this.adapter.buildQuery('financial_transactions')
            .delete()
            .eq('id', id);
        },
        'write'
      );

      if (response.success) {
        return {
          ...response,
          data: { deleted: true }
        };
      }
      return response as ApiResponse<{ deleted: boolean }>;
    } else {
      // 4. Soft delete (set status to cancelled)
      const updateResponse = await this.updateTransaction(id, { status: 'cancelled' });
      if (updateResponse.success) {
        return {
          success: true,
          data: { deleted: true },
          meta: updateResponse.meta
        };
      }
      return updateResponse as ApiResponse<{ deleted: boolean }>;
    }
  }

  /**
   * Get all accounts
   */
  async getAccounts(): Promise<ApiResponse<Account[]>> {
    const response = await this.adapter.executeQuery(
      {
        tableName: 'accounts',
        rateLimitKey: 'finance:accounts:read',
        enableLogging: true,
      },
      async () => {
        return this.adapter.buildQuery('accounts', {
          select: '*',
          orderBy: { column: 'name', ascending: true }
        });
      },
      'read'
    );

    if (response.success) {
      const accounts = Array.isArray(response.data) ? response.data : [response.data];
      const transformedAccounts = accounts.map(account => 
        this.transformAccountFromDb(account as Record<string, unknown>)
      );
      
      return {
        ...response,
        data: transformedAccounts
      };
    }
    return response as ApiResponse<Account[]>;
  }

  /**
   * Create account
   */
  async createAccount(accountData: CreateAccountRequest): Promise<ApiResponse<Account>> {
    // 1. Validate input data
    const validationResult = validateParams(CreateAccountSchema, accountData);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const validatedData = validationResult.data;

    // 2. Execute creation
    const response = await this.adapter.executeQuery(
      {
        tableName: 'accounts',
        requiredRole: UserRole.MANAGER, // Manager role required for accounts
        rateLimitKey: 'finance:accounts:create',
        enableLogging: true,
      },
      async () => {
        const dbData = this.adapter.toSnakeCase({
          name: validatedData.name,
          type: validatedData.type,
          number: validatedData.number,
          description: validatedData.description,
          parentId: validatedData.parentId,
          isActive: validatedData.isActive !== false, // Default to true
          balance: validatedData.balance || 0,
          currency: validatedData.currency || 'USD',
        });

        return this.adapter.buildQuery('accounts')
          .insert([dbData])
          .select('*');
      },
      'write'
    );

    if (response.success) {
      const accountArray = Array.isArray(response.data) ? response.data : [response.data];
      return {
        ...response,
        data: this.transformAccountFromDb(accountArray[0] as Record<string, unknown>)
      };
    }
    return response as ApiResponse<Account>;
  }

  /**
   * Get budgets
   */
  async getBudgets(): Promise<ApiResponse<Budget[]>> {
    const response = await this.adapter.executeQuery(
      {
        tableName: 'budgets',
        rateLimitKey: 'finance:budgets:read',
        enableLogging: true,
      },
      async () => {
        return this.adapter.buildQuery('budgets', {
          select: '*',
          orderBy: { column: 'period_start', ascending: false }
        });
      },
      'read'
    );

    if (response.success) {
      const budgets = Array.isArray(response.data) ? response.data : [response.data];
      const transformedBudgets = budgets.map(budget => 
        this.transformBudgetFromDb(budget as Record<string, unknown>)
      );
      
      return {
        ...response,
        data: transformedBudgets
      };
    }
    return response as ApiResponse<Budget[]>;
  }

  /**
   * Create budget
   */
  async createBudget(budgetData: CreateBudgetRequest): Promise<ApiResponse<Budget>> {
    // 1. Validate input data
    const validationResult = validateParams(CreateBudgetSchema, budgetData);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const validatedData = validationResult.data;

    // 2. Execute creation
    const response = await this.adapter.executeQuery(
      {
        tableName: 'budgets',
        requiredRole: UserRole.MANAGER, // Manager role required for budgets
        rateLimitKey: 'finance:budgets:create',
        enableLogging: true,
      },
      async () => {
        const dbData = this.adapter.toSnakeCase({
          name: validatedData.name,
          category: validatedData.category,
          amount: validatedData.amount,
          spent: validatedData.spent || 0,
          periodStart: validatedData.periodStart,
          periodEnd: validatedData.periodEnd,
          alertThreshold: validatedData.alertThreshold || 80,
          isActive: validatedData.isActive !== false, // Default to true
          notes: validatedData.notes,
        });

        return this.adapter.buildQuery('budgets')
          .insert([dbData])
          .select('*');
      },
      'write'
    );

    if (response.success) {
      const budgetArray = Array.isArray(response.data) ? response.data : [response.data];
      return {
        ...response,
        data: this.transformBudgetFromDb(budgetArray[0] as Record<string, unknown>)
      };
    }
    return response as ApiResponse<Budget>;
  }

  /**
   * Generate financial reports
   */
  async generateReport(
    type: 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'expenses' | 'revenue',
    dateFrom?: string,
    dateTo?: string
  ): Promise<ApiResponse<FinancialReport>> {
    const periodStart = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const periodEnd = dateTo || new Date().toISOString();

    const revenueQuery = this.adapter.executeQuery(
      {
        tableName: 'financial_transactions',
        rateLimitKey: 'finance:reports',
        enableLogging: true,
      },
      async () => {
        return supabase
          .from('financial_transactions')
          .select('sum(amount)')
          .eq('type', 'income')
          .gte('date', periodStart)
          .lte('date', periodEnd)
          .single();
      },
      'read'
    );

    const expenseQuery = this.adapter.executeQuery(
      {
        tableName: 'financial_transactions',
        rateLimitKey: 'finance:reports',
        enableLogging: true,
      },
      async () => {
        return supabase
          .from('financial_transactions')
          .select('sum(amount)')
          .eq('type', 'expense')
          .gte('date', periodStart)
          .lte('date', periodEnd)
          .single();
      },
      'read'
    );

    const categoryQuery = this.adapter.executeQuery(
      {
        tableName: 'financial_transactions',
        rateLimitKey: 'finance:reports',
        enableLogging: true,
      },
      async () => {
        return supabase
          .from('financial_transactions')
          .select('category, sum(amount), count(id)', { group: 'category' })
          .gte('date', periodStart)
          .lte('date', periodEnd);
      },
      'read'
    );

    const [revenueRes, expenseRes, categoryRes] = await Promise.all([revenueQuery, expenseQuery, categoryQuery]);

    const totalRevenue = revenueRes.success && revenueRes.data?.sum ? (revenueRes.data as any).sum as number : 0;
    const totalExpenses = expenseRes.success && expenseRes.data?.sum ? (expenseRes.data as any).sum as number : 0;
    const netIncome = totalRevenue - totalExpenses;
    const grossMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

    const categories = categoryRes.success && Array.isArray(categoryRes.data)
      ? (categoryRes.data as any[]).map(row => ({
          categoryId: row.category as string,
          categoryName: row.category as string,
          amount: row.sum as number,
          percentage: totalRevenue + totalExpenses > 0 ? (row.sum as number) / (totalRevenue + totalExpenses) * 100 : 0,
          transactionCount: row.count as number,
        }))
      : [];

    const reportData: FinancialReport = {
      reportType: type,
      dateRange: { start: periodStart, end: periodEnd },
      currency: 'USD',
      data: {
        totalIncome: totalRevenue,
        totalExpenses,
        netIncome,
        categories,
      },
      generatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: reportData,
      meta: {
        requestId: crypto.randomUUID(),
        source: 'reporting',
        summary: {
          totalRevenue,
          totalExpenses,
          netIncome,
          grossMargin,
        },
      },
    };
  }

  /**
   * Get Profit and Loss Report
   */
  async getProfitAndLossReport(dateFrom?: string, dateTo?: string): Promise<ApiResponse<FinancialReport>> {
    return this.generateReport('profit_loss', dateFrom, dateTo);
  }

  /**
   * Get Balance Sheet Report
   */
  async getBalanceSheetReport(dateFrom?: string, dateTo?: string): Promise<ApiResponse<FinancialReport>> {
    return this.generateReport('balance_sheet', dateFrom, dateTo);
  }

  /**
   * Get Cash Flow Report
   */
  async getCashFlowReport(dateFrom?: string, dateTo?: string): Promise<ApiResponse<FinancialReport>> {
    return this.generateReport('cash_flow', dateFrom, dateTo);
  }

  /**
   * Check budget compliance for a transaction
   */
  private async checkBudgetCompliance(transaction: CreateTransactionRequest): Promise<{ valid: boolean; reason?: string }> {
    const { category, amount } = transaction;
    const budgetResponse = await this.adapter.executeQuery(
      {
        tableName: 'budgets',
        rateLimitKey: 'finance:budget:check',
        requiredRole: UserRole.MANAGER,
      },
      async () => {
        return this.adapter
          .buildQuery('budgets', {
            select: 'amount, spent, period_start, period_end',
            filters: { category },
          })
          .lte('period_start', transaction.date)
          .gte('period_end', transaction.date)
          .limit(1);
      },
      'read'
    );

    if (budgetResponse.success && budgetResponse.data) {
      const budget = Array.isArray(budgetResponse.data) ? budgetResponse.data[0] : budgetResponse.data;
      const remaining = budget.amount - budget.spent;
      if (remaining < amount) {
        return { valid: false, reason: 'Budget exceeded for category' };
      }
    }

    return { valid: true };
  }

  /**
   * Calculate transaction metrics
   */
  async calculateTransactionMetrics(transactionId: string): Promise<ApiResponse<any>> {
    const txResponse = await this.getTransactionById(transactionId);
    if (!txResponse.success) {
      return txResponse as ApiResponse<any>;
    }

    const tx = txResponse.data as any;
    const impactOnCashFlow = ['income', 'refund'].includes(tx.type) ? tx.amount : -tx.amount;
    const taxImpact = tx.taxAmount ?? 0;

    const monthStart = new Date(tx.date);
    monthStart.setDate(1);

    const categoryTotals = await this.adapter.executeQuery(
      {
        tableName: 'financial_transactions',
        rateLimitKey: 'finance:metrics',
      },
      async () => {
        return this.adapter
          .buildQuery('financial_transactions', {
            select: 'amount',
            filters: { category: tx.category },
          })
          .gte('date', monthStart.toISOString())
          .lte('date', tx.date);
      },
      'read'
    );

    let categoryTotal = 0;
    if (categoryTotals.success) {
      const rows = Array.isArray(categoryTotals.data) ? categoryTotals.data : [];
      categoryTotal = rows.reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0);
    }

    const budgetCheck = await this.adapter.executeQuery(
      {
        tableName: 'budgets',
        rateLimitKey: 'finance:metrics',
      },
      async () => {
        return this.adapter
          .buildQuery('budgets', {
            select: 'amount, spent, period_start, period_end',
            filters: { category: tx.category },
          })
          .lte('period_start', tx.date)
          .gte('period_end', tx.date)
          .limit(1);
      },
      'read'
    );

    let budgetUtilization = 0;
    if (budgetCheck.success && budgetCheck.data) {
      const budget = Array.isArray(budgetCheck.data) ? budgetCheck.data[0] : budgetCheck.data;
      budgetUtilization = budget.amount ? ((budget.spent ?? 0) / budget.amount) * 100 : 0;
    }

    return {
      success: true,
      data: {
        impactOnCashFlow,
        budgetUtilization,
        categoryTotal,
        taxImpact,
      },
      meta: {
        requestId: crypto.randomUUID(),
        source: 'calculation',
      },
    };
  }

  /**
   * Transform database transaction to API format
   */
  private transformTransactionFromDb(dbTransaction: Record<string, unknown>): Transaction {
    const camelCaseTransaction = this.adapter.toCamelCase(dbTransaction);
    
    return {
      id: camelCaseTransaction.id as string,
      type: camelCaseTransaction.type as 'income' | 'expense' | 'transfer' | 'adjustment' | 'refund',
      category: camelCaseTransaction.category as string,
      amount: camelCaseTransaction.amount as number,
      description: camelCaseTransaction.description as string,
      date: camelCaseTransaction.date as string,
      accountId: camelCaseTransaction.accountId as string,
      transferToAccountId: camelCaseTransaction.transferToAccountId as string || undefined,
      reference: camelCaseTransaction.reference as string || undefined,
      taxAmount: camelCaseTransaction.taxAmount as number || undefined,
      taxRate: camelCaseTransaction.taxRate as number || undefined,
      status: camelCaseTransaction.status as 'pending' | 'approved' | 'cancelled' | 'processing' | 'completed',
      approvedBy: camelCaseTransaction.approvedBy as string || undefined,
      approvedAt: camelCaseTransaction.approvedAt as string || undefined,
      receiptUrl: camelCaseTransaction.receiptUrl as string || undefined,
      notes: camelCaseTransaction.notes as string || undefined,
      tags: camelCaseTransaction.tags as string[] || [],
      metadata: camelCaseTransaction.metadata as Record<string, unknown> || undefined,
      createdBy: camelCaseTransaction.createdBy as string,
      createdAt: camelCaseTransaction.createdAt as string,
      updatedAt: camelCaseTransaction.updatedAt as string,
    };
  }

  /**
   * Transform database account to API format
   */
  private transformAccountFromDb(dbAccount: Record<string, unknown>): Account {
    const camelCaseAccount = this.adapter.toCamelCase(dbAccount);
    
    return {
      id: camelCaseAccount.id as string,
      name: camelCaseAccount.name as string,
      type: camelCaseAccount.type as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
      number: camelCaseAccount.number as string || undefined,
      description: camelCaseAccount.description as string || undefined,
      parentId: camelCaseAccount.parentId as string || undefined,
      isActive: camelCaseAccount.isActive as boolean,
      balance: camelCaseAccount.balance as number,
      currency: camelCaseAccount.currency as string,
      createdAt: camelCaseAccount.createdAt as string,
      updatedAt: camelCaseAccount.updatedAt as string,
    };
  }

  /**
   * Transform database budget to API format
   */
  private transformBudgetFromDb(dbBudget: Record<string, unknown>): Budget {
    const camelCaseBudget = this.adapter.toCamelCase(dbBudget);
    
    return {
      id: camelCaseBudget.id as string,
      name: camelCaseBudget.name as string,
      category: camelCaseBudget.category as string,
      amount: camelCaseBudget.amount as number,
      spent: camelCaseBudget.spent as number,
      periodStart: camelCaseBudget.periodStart as string,
      periodEnd: camelCaseBudget.periodEnd as string,
      alertThreshold: camelCaseBudget.alertThreshold as number,
      isActive: camelCaseBudget.isActive as boolean,
      notes: camelCaseBudget.notes as string || undefined,
      createdAt: camelCaseBudget.createdAt as string,
      updatedAt: camelCaseBudget.updatedAt as string,
    };
  }
}

// Export a singleton instance
export const financeService = new FinanceService(); 