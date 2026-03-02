'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  LayoutDashboard,
  Receipt,
  RefreshCw,
  Settings as SettingsIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Target,
  BarChart3,
  Calculator,
  HandCoins,
  Wallet,
  FileBarChart,
  ListChecks,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { useExpenseData } from '@/hooks/use-expense-data'
import { useFinancialAnalysis } from '@/hooks/use-financial-analysis'
import { useAutoRecurrences } from '@/hooks/use-auto-recurrences'
import { Dashboard } from '@/components/dashboard'
import { ExpenseList } from '@/components/expense-list'
import { ExpenseForm } from '@/components/expense-form'
import { SubscriptionList } from '@/components/subscription-list'
import { SubscriptionForm } from '@/components/subscription-form'
import { Settings } from '@/components/settings'
import { IncomeForm } from '@/components/income-form'
import { IncomeList } from '@/components/income-list'
import { BudgetManager } from '@/components/budget-manager'
import { AvailableFunds } from '@/components/available-funds'
import { TemporalAnalysis } from '@/components/temporal-analysis'
import { SimulationMode } from '@/components/simulation-mode'
import { MonthlyReport } from '@/components/monthly-report'
import { FinancialActions } from '@/components/financial-actions'
import { LoanForm } from '@/components/loan-form'
import { LoanList } from '@/components/loan-list'
import { LoansSummary } from '@/components/loans-summary'
import { FutureCharges } from '@/components/future-charges'
import { TransitionMonthIndicator } from '@/components/transition-month-indicator'
import { useSupabaseSync } from '@/hooks/use-supabase-sync'

export default function ExpenseTracker() {
  const {
    data,
    isLoaded,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    addIncome,
    updateIncome,
    deleteIncome,
    setBudget,
    deleteBudget,
    createSnapshot,
    deleteSnapshot,
    updateSnapshot,
    addAction,
    updateAction,
    deleteAction,
    addLoan,
    updateLoan,
    deleteLoan,
    addRepayment,
    deleteRepayment,
    updateSettings,
    setCategoryThreshold,
    resetData,
    exportToCSV,
    exportItemsToCSV,
    exportLoansToCSV,
    exportRepaymentsToCSV,
    exportToJSON,
    importFromJSON,
    getRawData,
    setRawData,
    setOnDataChange,
  } = useExpenseData()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false)
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Analyse financière
  const analysis = useFinancialAnalysis({
    expenses: data.expenses,
    incomes: data.incomes,
    subscriptions: data.subscriptions,
    budgets: data.budgets,
    categories: data.categories,
    selectedMonth,
    minimalBudget: data.settings.minimalBudget,
  })

  // Création automatique des récurrences
  useAutoRecurrences({
    subscriptions: data.subscriptions,
    expenses: data.expenses,
    addExpense,
  })

  // Cloud sync
  const sync = useSupabaseSync()

  // Wire debounced cloud push on every local data change
  useEffect(() => {
    if (sync.isConnected) {
      setOnDataChange((newData) => sync.debouncedPush(newData))
    } else {
      setOnDataChange(null)
    }
  }, [sync.isConnected, sync.debouncedPush, setOnDataChange])

  const handleCloudConnect = useCallback(async (url: string, anonKey: string) => {
    const result = await sync.connect(url, anonKey)
    if (result.success) {
      // Push current local data to cloud on first connect
      await sync.pushToCloud(getRawData())
    }
    return result
  }, [sync, getRawData])

  const handlePullFromCloud = useCallback(async () => {
    const result = await sync.pullFromCloud(getRawData())
    if (result.cloudData) {
      setRawData(result.cloudData)
    }
  }, [sync, getRawData, setRawData])

  const handleRestoreBackup = useCallback(() => {
    const backup = sync.restoreBackup()
    if (backup) {
      setRawData(backup)
    }
  }, [sync, setRawData])

  // Filter expenses for selected month
  const monthlyExpenses = useMemo(
    () => data.expenses.filter((e) => e.date.startsWith(selectedMonth)),
    [data.expenses, selectedMonth]
  )

  // Get available months from expenses
  const availableMonths = useMemo(() => {
    const months = new Set(data.expenses.map((e) => e.date.substring(0, 7)))
    return Array.from(months).sort().reverse()
  }, [data.expenses])

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-')
    const date = new Date(parseInt(year), parseInt(m) - 1)
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const date = new Date(year, month - 1)
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1)
    } else {
      date.setMonth(date.getMonth() + 1)
    }
    setSelectedMonth(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="size-4 animate-spin" />
          <span>Chargement...</span>
        </div>
      </div>
    )
  }

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'expenses', label: 'Dépenses', icon: Receipt },
    { id: 'incomes', label: 'Revenus', icon: TrendingUp },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'analysis', label: 'Analyse', icon: BarChart3 },
    { id: 'report', label: 'Rapport', icon: FileBarChart },
    { id: 'actions', label: 'Actions', icon: ListChecks },
    { id: 'simulation', label: 'Simulation', icon: Calculator },
    { id: 'loans', label: 'Prêts & Dettes', icon: HandCoins },
    { id: 'subscriptions', label: 'Récurrences', icon: RefreshCw },
    { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
  ]

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar Navigation */}
        <Sidebar>
          <SidebarHeader className="border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <Wallet className="size-6 text-primary" />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Pilotage financier</span>
                <span className="text-xs text-muted-foreground">Gestion & décision</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => setActiveTab(item.id)}
                          isActive={activeTab === item.id}
                          tooltip={item.label}
                        >
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            <div className="text-xs text-muted-foreground text-center">
              v2.3.0
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            
            {/* Month Navigator */}
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="font-medium text-sm capitalize min-w-[140px] text-center">
                  {formatMonth(selectedMonth)}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </header>

          <div className="flex-1 p-6 space-y-6">
            {activeTab === 'dashboard' && (
            <div className="space-y-4">
            <TransitionMonthIndicator
              currentMonth={selectedMonth}
              transitionMonths={data.settings.transitionMonths}
            />
            <AvailableFunds
              monthlyIncome={analysis.monthlyIncome}
              monthlyExpenses={analysis.monthlyExpenses}
              fixedCharges={analysis.fixedChargesForMonth}
              minimalBudget={data.settings.minimalBudget}
              reallyAvailable={analysis.reallyAvailable}
            />
            <FutureCharges
              subscriptions={data.subscriptions}
              categories={data.categories}
              currentMonth={selectedMonth}
            />
            <Dashboard
              expenses={data.expenses}
              categories={data.categories}
              subscriptions={data.subscriptions}
              categoryThresholds={data.categoryThresholds}
              selectedMonth={selectedMonth}
            />
            </div>
            )}

            {activeTab === 'expenses' && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-end">
                <Button onClick={() => setShowExpenseForm(true)}>
                  <Plus className="size-4 mr-2" />
                  Nouvelle depense
                </Button>
              </div>
              <ExpenseList
                expenses={monthlyExpenses}
                categories={data.categories}
                onUpdate={updateExpense}
                onDelete={deleteExpense}
              />
            </div>
            )}

            {activeTab === 'incomes' && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-end">
                <IncomeForm
                  onAdd={addIncome}
                  selectedMonth={selectedMonth}
                />
              </div>
              <IncomeList
                incomes={data.incomes}
                selectedMonth={selectedMonth}
                onDelete={deleteIncome}
              />
            </div>
            )}

            {activeTab === 'budgets' && (
            <BudgetManager
              categories={data.categories}
              budgets={data.budgets}
              expenses={data.expenses}
              selectedMonth={selectedMonth}
              onSetBudget={setBudget}
            />
            )}

            {activeTab === 'analysis' && (
            <TemporalAnalysis
              monthComparison={analysis.monthComparison}
              threeMonthAverage={analysis.threeMonthAverage}
            />
            )}

            {activeTab === 'report' && (
            <MonthlyReport
              expenses={data.expenses}
              incomes={data.incomes}
              categories={data.categories}
              loans={data.loans}
              snapshots={data.snapshots}
              selectedMonth={selectedMonth}
              analysis={analysis}
              onCreateSnapshot={createSnapshot}
              onUpdateSnapshot={updateSnapshot}
            />
            )}

            {activeTab === 'actions' && (
            <FinancialActions
              actions={data.actions}
              loans={data.loans}
              onAdd={addAction}
              onUpdate={updateAction}
              onDelete={deleteAction}
            />
            )}

            {activeTab === 'simulation' && (
            <SimulationMode
              categories={data.categories}
              currentMonthlyIncome={analysis.monthlyIncome}
              currentMonthlyExpenses={analysis.monthlyExpenses}
              averageMonthlyExpenses={analysis.threeMonthAverage.averageTotal}
            />
            )}

            {activeTab === 'loans' && (
            <div className="space-y-6">
              <div className="flex gap-3">
                <LoanForm type="PRETE" onAdd={addLoan} />
                <LoanForm type="EMPRUNTE" onAdd={addLoan} />
              </div>
              
              <LoansSummary loans={data.loans} />

              <div className="grid gap-6 lg:grid-cols-2">
                <LoanList
                  loans={data.loans}
                  type="PRETE"
                  onDelete={deleteLoan}
                  onAddRepayment={addRepayment}
                  onDeleteRepayment={deleteRepayment}
                />
                <LoanList
                  loans={data.loans}
                  type="EMPRUNTE"
                  onDelete={deleteLoan}
                  onAddRepayment={addRepayment}
                  onDeleteRepayment={deleteRepayment}
                />
              </div>
            </div>
            )}

            {activeTab === 'subscriptions' && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-end">
                <Button onClick={() => setShowSubscriptionForm(true)}>
                  <Plus className="size-4 mr-2" />
                  Nouvelle recurrence
                </Button>
              </div>
              <SubscriptionList
                subscriptions={data.subscriptions}
                categories={data.categories}
                onUpdate={updateSubscription}
                onDelete={deleteSubscription}
              />
            </div>
            )}

            {activeTab === 'settings' && (
            <Settings
              categories={data.categories}
              categoryThresholds={data.categoryThresholds}
              settings={data.settings}
              snapshots={data.snapshots}
              selectedMonth={selectedMonth}
              onAddCategory={addCategory}
              onUpdateCategory={updateCategory}
              onDeleteCategory={deleteCategory}
              onSetThreshold={setCategoryThreshold}
              onUpdateSettings={updateSettings}
              onCreateSnapshot={createSnapshot}
              onDeleteSnapshot={deleteSnapshot}
              onExportCSV={exportToCSV}
              onExportItemsCSV={exportItemsToCSV}
              onExportLoansCSV={exportLoansToCSV}
              onExportRepaymentsCSV={exportRepaymentsToCSV}
              onExportJSON={exportToJSON}
              onImportJSON={importFromJSON}
              onResetData={resetData}
              availableMonths={availableMonths}
              cloudSync={{
                isConnected: sync.isConnected,
                isSyncing: sync.isSyncing,
                lastSyncAt: sync.lastSyncAt,
                error: sync.error,
                onConnect: handleCloudConnect,
                onDisconnect: sync.disconnect,
                onSyncNow: () => sync.syncNow(getRawData()),
                onPullFromCloud: handlePullFromCloud,
                onRestoreBackup: handleRestoreBackup,
              }}
            />
            )}
          </div>
        </SidebarInset>

        {/* Forms */}
        <ExpenseForm
          open={showExpenseForm}
          onOpenChange={setShowExpenseForm}
          categories={data.categories}
          onSubmit={addExpense}
        />

        <SubscriptionForm
          open={showSubscriptionForm}
          onOpenChange={setShowSubscriptionForm}
          categories={data.categories}
          onSubmit={addSubscription}
        />
      </div>
    </SidebarProvider>
  )
}
