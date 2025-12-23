/**
 * Tipos TypeScript para o Sistema Financeiro Golf Fox
 * @description Tipagem completa para custos, receitas, orçamentos e projeções
 */

// ============================================================
// ENUMS
// ============================================================

export type ProfileType = 'admin' | 'gestor_empresa' | 'gestor_transportadora' | 'all';

export type CostStatus = 'pending' | 'confirmed' | 'cancelled';

export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type FinancialAlertType =
    | 'budget_exceeded'
    | 'unusual_expense'
    | 'recurring_due'
    | 'forecast_deviation';

export type ForecastMethod =
    | 'moving_average'
    | 'linear_regression'
    | 'seasonal';

// ============================================================
// CATEGORY
// ============================================================

export interface CostCategory {
    id: string;
    name: string;
    profileType: ProfileType;
    parentId?: string | null;
    icon?: string | null;
    color?: string | null;
    keywords: string[];
    isOperational: boolean;
    isActive: boolean;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
    // Relacionamentos (quando join)
    parent?: CostCategory | null;
    children?: CostCategory[];
}

export interface CostCategoryInsert {
    name: string;
    profileType: ProfileType;
    parentId?: string | null;
    icon?: string | null;
    color?: string | null;
    keywords?: string[];
    isOperational?: boolean;
    displayOrder?: number;
}

export interface CostCategoryUpdate {
    name?: string;
    icon?: string | null;
    color?: string | null;
    keywords?: string[];
    isOperational?: boolean;
    isActive?: boolean;
    displayOrder?: number;
}

// ============================================================
// MANUAL COSTS
// ============================================================

export interface ManualCost {
    id: string;
    company_id?: string | null;
    transportadora_id?: string | null;
    category_id?: string | null;
    description: string;
    amount: number;
    cost_date: string; // ISO date string
    is_recurring: boolean;
    recurring_interval?: RecurringInterval | null;
    recurring_end_date?: string | null;
    parent_recurring_id?: string | null;
    veiculo_id?: string | null;
    route_id?: string | null;
    motorista_id?: string | null;
    attachment_url?: string | null;
    attachment_name?: string | null;
    notes?: string | null;
    status: CostStatus;
    created_by?: string | null;
    approved_by?: string | null;
    approved_at?: string | null;
    created_at: string;
    updated_at: string;
    // Relacionamentos (quando join)
    category?: CostCategory | null;
    veiculo?: { id: string; plate: string; model?: string } | null;
    route?: { id: string; name: string } | null;
    motorista?: { id: string; name?: string; email: string } | null;
    empresa?: { id: string; name: string } | null;
    transportadora?: { id: string; name: string } | null;
}

export interface ManualCostInsert {
    company_id?: string | null;
    transportadora_id?: string | null;
    category_id?: string | null;
    description: string;
    amount: number;
    cost_date: string;
    is_recurring?: boolean;
    recurring_interval?: RecurringInterval | null;
    recurring_end_date?: string | null;
    veiculo_id?: string | null;
    route_id?: string | null;
    motorista_id?: string | null;
    attachment_url?: string | null;
    attachment_name?: string | null;
    notes?: string | null;
    status?: CostStatus;
}

export interface ManualCostUpdate {
    category_id?: string | null;
    description?: string;
    amount?: number;
    cost_date?: string;
    is_recurring?: boolean;
    recurring_interval?: RecurringInterval | null;
    recurring_end_date?: string | null;
    veiculo_id?: string | null;
    route_id?: string | null;
    motorista_id?: string | null;
    attachment_url?: string | null;
    attachment_name?: string | null;
    notes?: string | null;
    status?: CostStatus;
    approved_by?: string | null;
    approved_at?: string | null;
}

// ============================================================
// MANUAL REVENUES
// ============================================================

export interface ManualRevenue {
    id: string;
    companyId?: string | null;
    carrierId?: string | null;
    category: string;
    description: string;
    amount: number;
    revenueDate: string;
    contractReference?: string | null;
    invoiceNumber?: string | null;
    isRecurring: boolean;
    recurringInterval?: RecurringInterval | null;
    attachmentUrl?: string | null;
    notes?: string | null;
    status: CostStatus;
    createdBy?: string | null;
    createdAt: string;
    updatedAt: string;
    // Relacionamentos
    company?: { id: string; name: string } | null;
    transportadora?: { id: string; name: string } | null;
}

export interface ManualRevenueInsert {
    companyId?: string | null;
    carrierId?: string | null;
    category: string;
    description: string;
    amount: number;
    revenueDate: string;
    contractReference?: string | null;
    invoiceNumber?: string | null;
    isRecurring?: boolean;
    recurringInterval?: RecurringInterval | null;
    attachmentUrl?: string | null;
    notes?: string | null;
    status?: CostStatus;
}

export interface ManualRevenueUpdate {
    category?: string;
    description?: string;
    amount?: number;
    revenueDate?: string;
    contractReference?: string | null;
    invoiceNumber?: string | null;
    isRecurring?: boolean;
    recurringInterval?: RecurringInterval | null;
    attachmentUrl?: string | null;
    notes?: string | null;
    status?: CostStatus;
}

// ============================================================
// BUDGETS
// ============================================================

export interface Budget {
    id: string;
    companyId?: string | null;
    carrierId?: string | null;
    categoryId?: string | null;
    categoryName?: string | null;
    periodYear: number;
    periodMonth: number;
    budgetedAmount: number;
    alertThresholdPercent: number;
    notes?: string | null;
    createdBy?: string | null;
    createdAt: string;
    updatedAt: string;
    // Relacionamentos
    category?: CostCategory | null;
}

export interface BudgetInsert {
    companyId?: string | null;
    carrierId?: string | null;
    categoryId?: string | null;
    categoryName?: string | null;
    periodYear: number;
    periodMonth: number;
    budgetedAmount: number;
    alertThresholdPercent?: number;
    notes?: string | null;
}

export interface BudgetUpdate {
    budgetedAmount?: number;
    alertThresholdPercent?: number;
    notes?: string | null;
}

// ============================================================
// FINANCIAL FORECASTS
// ============================================================

export interface FinancialForecast {
    id: string;
    companyId?: string | null;
    carrierId?: string | null;
    forecastType: 'cost' | 'revenue';
    categoryId?: string | null;
    periodYear: number;
    periodMonth: number;
    projectedAmount: number;
    actualAmount?: number | null;
    confidenceLevel: number;
    calculationMethod: ForecastMethod;
    basePeriodMonths: number;
    generatedAt: string;
    notes?: string | null;
    // Relacionamentos
    category?: CostCategory | null;
}

// ============================================================
// FINANCIAL ALERTS
// ============================================================

export interface FinancialAlert {
    id: string;
    companyId?: string | null;
    carrierId?: string | null;
    alertType: FinancialAlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    costId?: string | null;
    budgetId?: string | null;
    categoryId?: string | null;
    thresholdValue?: number | null;
    actualValue?: number | null;
    variancePercent?: number | null;
    isRead: boolean;
    isDismissed: boolean;
    dismissedBy?: string | null;
    dismissedAt?: string | null;
    createdAt: string;
    // Relacionamentos
    cost?: ManualCost | null;
    budget?: Budget | null;
    category?: CostCategory | null;
}

export interface FinancialAlertUpdate {
    isRead?: boolean;
    isDismissed?: boolean;
    dismissedBy?: string | null;
    dismissedAt?: string | null;
}

// ============================================================
// VIEWS / COMPUTED DATA
// ============================================================

export interface BudgetVsActual {
    tenantId: string;
    tenantType: 'empresa' | 'transportadora';
    periodYear: number;
    periodMonth: number;
    categoryName: string;
    categoryId?: string | null;
    totalCost: number;
    budgetedAmount: number;
    variancePercent?: number | null;
}

export interface AdminFinancialKPIs {
    totalCosts30d: number;
    totalRevenues30d: number;
    margin30d: number;
    costEntries30d: number;
    revenueEntries30d: number;
    criticalAlerts: number;
    warningAlerts: number;
    recurringCostsCount: number;
}

export interface VeiculoCostSummary {
    carrierId: string;
    vehicleId: string;
    vehiclePlate: string;
    vehicleModel?: string | null;
    periodYear: number;
    periodMonth: number;
    totalCost: number;
    entriesCount: number;
    categories: string[];
}

// ============================================================
// FORM HELPERS
// ============================================================

export interface CostFormData {
    categoryId: string;
    description: string;
    amount: string; // String para input controlado
    costDate: Date;
    isRecurring: boolean;
    recurringInterval?: RecurringInterval;
    recurringEndDate?: Date;
    vehicleId?: string;
    routeId?: string;
    notes?: string;
    attachment?: File;
}

export interface RevenueFormData {
    category: string;
    description: string;
    amount: string;
    revenueDate: Date;
    contractReference?: string;
    invoiceNumber?: string;
    isRecurring: boolean;
    recurringInterval?: RecurringInterval;
    notes?: string;
    attachment?: File;
}

export interface BudgetFormData {
    categoryId: string;
    periodYear: number;
    periodMonth: number;
    budgetedAmount: string;
    alertThresholdPercent: number;
    notes?: string;
}

// ============================================================
// API RESPONSES
// ============================================================

export interface CostListResponse {
    data: ManualCost[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface RevenueListResponse {
    data: ManualRevenue[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface FinancialDashboardData {
    kpis: AdminFinancialKPIs;
    budgetVsActual: BudgetVsActual[];
    monthlyTrend: {
        month: string;
        costs: number;
        revenues: number;
        margin: number;
    }[];
    categoryBreakdown: {
        name: string;
        value: number;
        percentage: number;
        color?: string;
    }[];
    alerts: FinancialAlert[];
}

// ============================================================
// FILTERS
// ============================================================

export interface CostFilters {
    category_id?: string;
    veiculo_id?: string;
    route_id?: string;
    status?: CostStatus;
    is_recurring?: boolean;
    date_from?: string;
    date_to?: string;
    amount_min?: number;
    amount_max?: number;
    search?: string;
}

export interface RevenueFilters {
    category?: string;
    contractReference?: string;
    status?: CostStatus;
    dateFrom?: string;
    dateTo?: string;
    amountMin?: number;
    amountMax?: number;
    search?: string;
}
