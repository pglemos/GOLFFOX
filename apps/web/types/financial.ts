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
    profile_type: ProfileType;
    parent_id?: string | null;
    icon?: string | null;
    color?: string | null;
    keywords: string[];
    is_operational: boolean;
    is_active: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
    // Relacionamentos (quando join)
    parent?: CostCategory | null;
    children?: CostCategory[];
}

export interface CostCategoryInsert {
    name: string;
    profile_type: ProfileType;
    parent_id?: string | null;
    icon?: string | null;
    color?: string | null;
    keywords?: string[];
    is_operational?: boolean;
    display_order?: number;
}

export interface CostCategoryUpdate {
    name?: string;
    icon?: string | null;
    color?: string | null;
    keywords?: string[];
    is_operational?: boolean;
    is_active?: boolean;
    display_order?: number;
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
    company_id?: string | null;
    transportadora_id?: string | null;
    category: string;
    description: string;
    amount: number;
    revenue_date: string;
    contract_reference?: string | null;
    invoice_number?: string | null;
    is_recurring: boolean;
    recurring_interval?: RecurringInterval | null;
    attachment_url?: string | null;
    notes?: string | null;
    status: CostStatus;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
    // Relacionamentos
    company?: { id: string; name: string } | null;
    transportadora?: { id: string; name: string } | null;
}

export interface ManualRevenueInsert {
    company_id?: string | null;
    transportadora_id?: string | null;
    category: string;
    description: string;
    amount: number;
    revenue_date: string;
    contract_reference?: string | null;
    invoice_number?: string | null;
    is_recurring?: boolean;
    recurring_interval?: RecurringInterval | null;
    attachment_url?: string | null;
    notes?: string | null;
    status?: CostStatus;
}

export interface ManualRevenueUpdate {
    category?: string;
    description?: string;
    amount?: number;
    revenue_date?: string;
    contract_reference?: string | null;
    invoice_number?: string | null;
    is_recurring?: boolean;
    recurring_interval?: RecurringInterval | null;
    attachment_url?: string | null;
    notes?: string | null;
    status?: CostStatus;
}

// ============================================================
// BUDGETS
// ============================================================

export interface Budget {
    id: string;
    company_id?: string | null;
    transportadora_id?: string | null;
    category_id?: string | null;
    category_name?: string | null;
    period_year: number;
    period_month: number;
    budgeted_amount: number;
    alert_threshold_percent: number;
    notes?: string | null;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
    // Relacionamentos
    category?: CostCategory | null;
}

export interface BudgetInsert {
    company_id?: string | null;
    transportadora_id?: string | null;
    category_id?: string | null;
    category_name?: string | null;
    period_year: number;
    period_month: number;
    budgeted_amount: number;
    alert_threshold_percent?: number;
    notes?: string | null;
}

export interface BudgetUpdate {
    budgeted_amount?: number;
    alert_threshold_percent?: number;
    notes?: string | null;
}

// ============================================================
// FINANCIAL FORECASTS
// ============================================================

export interface FinancialForecast {
    id: string;
    company_id?: string | null;
    transportadora_id?: string | null;
    forecast_type: 'cost' | 'revenue';
    category_id?: string | null;
    period_year: number;
    period_month: number;
    projected_amount: number;
    actual_amount?: number | null;
    confidence_level: number;
    calculation_method: ForecastMethod;
    base_period_months: number;
    generated_at: string;
    notes?: string | null;
    // Relacionamentos
    category?: CostCategory | null;
}

// ============================================================
// FINANCIAL ALERTS
// ============================================================

export interface FinancialAlert {
    id: string;
    company_id?: string | null;
    transportadora_id?: string | null;
    alert_type: FinancialAlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    cost_id?: string | null;
    budget_id?: string | null;
    category_id?: string | null;
    threshold_value?: number | null;
    actual_value?: number | null;
    variance_percent?: number | null;
    is_read: boolean;
    is_dismissed: boolean;
    dismissed_by?: string | null;
    dismissed_at?: string | null;
    created_at: string;
    // Relacionamentos
    cost?: ManualCost | null;
    budget?: Budget | null;
    category?: CostCategory | null;
}

export interface FinancialAlertUpdate {
    is_read?: boolean;
    is_dismissed?: boolean;
    dismissed_by?: string | null;
    dismissed_at?: string | null;
}

// ============================================================
// VIEWS / COMPUTED DATA
// ============================================================

export interface BudgetVsActual {
    tenant_id: string;
    tenant_type: 'empresa' | 'transportadora';
    period_year: number;
    period_month: number;
    category_name: string;
    category_id?: string | null;
    total_cost: number;
    budgeted_amount: number;
    variance_percent?: number | null;
}

export interface AdminFinancialKPIs {
    total_costs_30d: number;
    total_revenues_30d: number;
    margin_30d: number;
    cost_entries_30d: number;
    revenue_entries_30d: number;
    critical_alerts: number;
    warning_alerts: number;
    recurring_costs_count: number;
}

export interface VeiculoCostSummary {
    transportadora_id: string;
    veiculo_id: string;
    veiculo_plate: string;
    veiculo_model?: string | null;
    period_year: number;
    period_month: number;
    total_cost: number;
    entries_count: number;
    categories: string[];
}

// ============================================================
// FORM HELPERS
// ============================================================

export interface CostFormData {
    category_id: string;
    description: string;
    amount: string; // String para input controlado
    cost_date: Date;
    is_recurring: boolean;
    recurring_interval?: RecurringInterval;
    recurring_end_date?: Date;
    veiculo_id?: string;
    route_id?: string;
    notes?: string;
    attachment?: File;
}

export interface RevenueFormData {
    category: string;
    description: string;
    amount: string;
    revenue_date: Date;
    contract_reference?: string;
    invoice_number?: string;
    is_recurring: boolean;
    recurring_interval?: RecurringInterval;
    notes?: string;
    attachment?: File;
}

export interface BudgetFormData {
    category_id: string;
    period_year: number;
    period_month: number;
    budgeted_amount: string;
    alert_threshold_percent: number;
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
    contract_reference?: string;
    status?: CostStatus;
    date_from?: string;
    date_to?: string;
    amount_min?: number;
    amount_max?: number;
    search?: string;
}
