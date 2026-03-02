'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  type AppData,
  type Expense,
  type ExpenseItem,
  type Category,
  type Subscription,
  type Income,
  type Budget,
  type MonthlySnapshot,
  type Loan,
  type LoanRepayment,
  type FinancialAction,
  type ExportData,
  type ImportResult,
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
  DATA_VERSION,
} from '@/lib/types'

const STORAGE_KEY = 'expense-tracker-data'

const getInitialData = (): AppData => ({
  expenses: [],
  categories: DEFAULT_CATEGORIES,
  subscriptions: [],
  incomes: [],
  budgets: [],
  snapshots: [],
  loans: [],
  actions: [],
  categoryThresholds: {},
  settings: DEFAULT_SETTINGS,
  version: DATA_VERSION,
})

// Get device info for export metadata
const getDeviceInfo = (): string => {
  if (typeof window === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (/mobile/i.test(ua)) return 'mobile'
  if (/tablet/i.test(ua)) return 'tablet'
  return 'desktop'
}

export function useExpenseData() {
  const [data, setData] = useState<AppData>(getInitialData)
  const [isLoaded, setIsLoaded] = useState(false)
  // Cloud sync callback — set by page.tsx when Supabase is connected
  const onDataChangeRef = useRef<((data: AppData) => void) | null>(null)

  // Load data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AppData
        
        // Migration de v1.x vers v2.3.0
        const migratedData: AppData = {
          ...getInitialData(),
          ...parsed,
          categories: parsed.categories?.length ? parsed.categories : DEFAULT_CATEGORIES,
          incomes: parsed.incomes || [],
          budgets: parsed.budgets || [],
          snapshots: parsed.snapshots || [],
          loans: parsed.loans || [],
          actions: parsed.actions || [],
          subscriptions: (parsed.subscriptions || []).map((s: any) => ({
            ...s,
            status: s.status || (s.isActive ? 'ACTIF' : 'SUSPENDU'),
            frequency: s.frequency || 'monthly',
            startMonth: s.startMonth || s.createdAt?.substring(0, 7) || new Date().toISOString().substring(0, 7),
          })),
          settings: {
            ...DEFAULT_SETTINGS,
            ...parsed.settings,
            transitionMonths: parsed.settings?.transitionMonths || [],
          },
          version: DATA_VERSION,
        }
        
        // Migrer les subscriptions pour ajouter isFixed si manquant
        if (migratedData.subscriptions) {
          migratedData.subscriptions = migratedData.subscriptions.map(sub => ({
            ...sub,
            isFixed: sub.isFixed !== undefined ? sub.isFixed : true, // Par défaut, les abonnements sont des charges fixes
          }))
        }
        
        setData(migratedData)
      } catch {
        setData(getInitialData())
      }
    }
    setIsLoaded(true)
  }, [])

  // Save data to localStorage whenever it changes, then notify cloud
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      // Notify cloud sync in background (local is already saved)
      onDataChangeRef.current?.(data)
    }
  }, [data, isLoaded])

  // Expense operations
  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setData((prev) => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
    }))
    return newExpense
  }, [])

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }))
  }, [])

  const deleteExpense = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }))
  }, [])

  // Category operations
  const addCategory = useCallback((category: Omit<Category, 'id' | 'isDefault'>) => {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
      isDefault: false,
    }
    setData((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }))
    return newCategory
  }, [])

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }))
  }, [])

  const deleteCategory = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
      expenses: prev.expenses.filter((e) => e.categoryId !== id),
      subscriptions: prev.subscriptions.filter((s) => s.categoryId !== id),
    }))
  }, [])

  // Subscription operations
  const addSubscription = useCallback((subscription: Omit<Subscription, 'id' | 'createdAt'>) => {
    const newSubscription: Subscription = {
      ...subscription,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setData((prev) => ({
      ...prev,
      subscriptions: [...prev.subscriptions, newSubscription],
    }))
    return newSubscription
  }, [])

  const updateSubscription = useCallback((id: string, updates: Partial<Subscription>) => {
    setData((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }))
  }, [])

  const deleteSubscription = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.filter((s) => s.id !== id),
    }))
  }, [])

  // Threshold operations (deprecated - use budgets instead)
  const setCategoryThreshold = useCallback((categoryId: string, threshold: number) => {
    setData((prev) => ({
      ...prev,
      categoryThresholds: {
        ...prev.categoryThresholds,
        [categoryId]: threshold,
      },
    }))
  }, [])

  // Income operations
  const addIncome = useCallback((income: Omit<Income, 'id' | 'createdAt'>) => {
    const newIncome: Income = {
      ...income,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setData((prev) => ({
      ...prev,
      incomes: [newIncome, ...prev.incomes],
    }))
    return newIncome
  }, [])

  const updateIncome = useCallback((id: string, updates: Partial<Income>) => {
    setData((prev) => ({
      ...prev,
      incomes: prev.incomes.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    }))
  }, [])

  const deleteIncome = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      incomes: prev.incomes.filter((i) => i.id !== id),
    }))
  }, [])

  // Budget operations
  const setBudget = useCallback((categoryId: string, month: string, amount: number) => {
    setData((prev) => {
      const existing = prev.budgets.find(
        (b) => b.categoryId === categoryId && b.month === month
      )
      
      if (existing) {
        // Update existing budget
        return {
          ...prev,
          budgets: prev.budgets.map((b) =>
            b.id === existing.id ? { ...b, amount } : b
          ),
        }
      } else {
        // Create new budget
        const newBudget: Budget = {
          id: crypto.randomUUID(),
          categoryId,
          month,
          amount,
          createdAt: new Date().toISOString(),
        }
        return {
          ...prev,
          budgets: [...prev.budgets, newBudget],
        }
      }
    })
  }, [])

  const deleteBudget = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      budgets: prev.budgets.filter((b) => b.id !== id),
    }))
  }, [])

  // Snapshot operations
  const createSnapshot = useCallback((month: string) => {
    setData((prev) => {
      const monthExpenses = prev.expenses.filter((e) => e.date.startsWith(month))
      const monthIncomes = prev.incomes.filter((i) => i.date.startsWith(month))
      const fixedCharges = prev.subscriptions
        .filter((s) => s.isActive && s.isFixed && !s.isSuspended)
        .reduce((sum, s) => sum + s.amount, 0)

      const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
      const totalIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0)
      const variableExpenses = totalExpenses

      // Calculate budget compliance
      const budgetCompliance = prev.categories
        .map((cat) => {
          const budget = prev.budgets.find(
            (b) => b.categoryId === cat.id && b.month === month
          )
          if (!budget) return null

          const spent = monthExpenses
            .filter((e) => e.categoryId === cat.id)
            .reduce((sum, e) => sum + e.amount, 0)

          const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
          const status: 'ok' | 'warning' | 'exceeded' =
            percentage < 80 ? 'ok' : percentage <= 100 ? 'warning' : 'exceeded'

          return {
            categoryId: cat.id,
            budgeted: budget.amount,
            spent,
            status,
          }
        })
        .filter((c): c is NonNullable<typeof c> => c !== null)

      // Extract top decision notes
      const topDecisions = monthExpenses
        .filter((e) => e.decisionNote && e.decisionNote.trim() !== '')
        .map((e) => e.decisionNote!)
        .slice(0, 10)

      const snapshot: MonthlySnapshot = {
        id: crypto.randomUUID(),
        month,
        totalIncome,
        totalExpenses,
        totalFixedCharges: fixedCharges,
        totalVariableExpenses: variableExpenses,
        budgetCompliance,
        topDecisions,
        createdAt: new Date().toISOString(),
      }

      // Preserve reportNote/attachmentPath from existing snapshot
      const existingSnapshot = prev.snapshots.find((s) => s.month === month)
      if (existingSnapshot?.reportNote) snapshot.reportNote = existingSnapshot.reportNote
      if (existingSnapshot?.attachmentPath) snapshot.attachmentPath = existingSnapshot.attachmentPath

      const filteredSnapshots = prev.snapshots.filter((s) => s.month !== month)

      return {
        ...prev,
        snapshots: [snapshot, ...filteredSnapshots],
      }
    })
  }, [])

  const deleteSnapshot = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      snapshots: prev.snapshots.filter((s) => s.id !== id),
    }))
  }, [])

  const updateSnapshot = useCallback((month: string, updates: Partial<MonthlySnapshot>) => {
    setData((prev) => ({
      ...prev,
      snapshots: prev.snapshots.map((s) =>
        s.month === month ? { ...s, ...updates } : s
      ),
    }))
  }, [])

  // Financial action operations
  const addAction = useCallback((action: Omit<FinancialAction, 'id' | 'createdAt'>) => {
    const newAction: FinancialAction = {
      ...action,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setData((prev) => ({
      ...prev,
      actions: [newAction, ...prev.actions],
    }))
    return newAction
  }, [])

  const updateAction = useCallback((id: string, updates: Partial<FinancialAction>) => {
    setData((prev) => ({
      ...prev,
      actions: prev.actions.map((a) => {
        if (a.id !== id) return a
        const updated = { ...a, ...updates }
        // Auto-set completedDate when marking as done
        if (updates.status === 'FAIT' && !a.completedDate) {
          updated.completedDate = new Date().toISOString()
        }
        // Clear completedDate if reverting from FAIT
        if (updates.status && updates.status !== 'FAIT') {
          updated.completedDate = undefined
        }
        return updated
      }),
    }))
  }, [])

  const deleteAction = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      actions: prev.actions.filter((a) => a.id !== id),
    }))
  }, [])

  // Settings operations
  const updateSettings = useCallback((updates: Partial<typeof data.settings>) => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...updates,
      },
    }))
  }, [])

  // Loan operations
  const addLoan = useCallback((loan: Omit<Loan, 'id' | 'createdAt' | 'repaidAmount' | 'remainingAmount' | 'status' | 'repayments'>) => {
    const newLoan: Loan = {
      ...loan,
      id: crypto.randomUUID(),
      repaidAmount: 0,
      remainingAmount: loan.totalAmount,
      status: 'EN_COURS',
      repayments: [],
      createdAt: new Date().toISOString(),
    }
    setData((prev) => ({
      ...prev,
      loans: [newLoan, ...prev.loans],
    }))
    return newLoan
  }, [])

  const updateLoan = useCallback((id: string, updates: Partial<Loan>) => {
    setData((prev) => ({
      ...prev,
      loans: prev.loans.map((l) =>
        l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
      ),
    }))
  }, [])

  const deleteLoan = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      loans: prev.loans.filter((l) => l.id !== id),
    }))
  }, [])

  const addRepayment = useCallback((loanId: string, repayment: Omit<LoanRepayment, 'id' | 'createdAt'>) => {
    setData((prev) => {
      const loan = prev.loans.find((l) => l.id === loanId)
      if (!loan) return prev

      const newRepayment: LoanRepayment = {
        ...repayment,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }

      const newRepaidAmount = loan.repaidAmount + repayment.amount
      const newRemainingAmount = loan.totalAmount - newRepaidAmount
      
      // Calculer le nouveau statut
      let newStatus: Loan['status'] = 'EN_COURS'
      if (newRemainingAmount <= 0) {
        newStatus = 'REMBOURSE'
      } else if (newRepaidAmount > 0) {
        newStatus = 'PARTIELLEMENT_REMBOURSE'
      }

      return {
        ...prev,
        loans: prev.loans.map((l) =>
          l.id === loanId
            ? {
                ...l,
                repayments: [...l.repayments, newRepayment],
                repaidAmount: newRepaidAmount,
                remainingAmount: Math.max(0, newRemainingAmount),
                status: newStatus,
                updatedAt: new Date().toISOString(),
              }
            : l
        ),
      }
    })
  }, [])

  const deleteRepayment = useCallback((loanId: string, repaymentId: string) => {
    setData((prev) => {
      const loan = prev.loans.find((l) => l.id === loanId)
      if (!loan) return prev

      const repaymentToDelete = loan.repayments.find((r) => r.id === repaymentId)
      if (!repaymentToDelete) return prev

      const newRepaidAmount = loan.repaidAmount - repaymentToDelete.amount
      const newRemainingAmount = loan.totalAmount - newRepaidAmount

      // Recalculer le statut
      let newStatus: Loan['status'] = 'EN_COURS'
      if (newRemainingAmount <= 0) {
        newStatus = 'REMBOURSE'
      } else if (newRepaidAmount > 0) {
        newStatus = 'PARTIELLEMENT_REMBOURSE'
      }

      return {
        ...prev,
        loans: prev.loans.map((l) =>
          l.id === loanId
            ? {
                ...l,
                repayments: l.repayments.filter((r) => r.id !== repaymentId),
                repaidAmount: newRepaidAmount,
                remainingAmount: Math.max(0, newRemainingAmount),
                status: newStatus,
                updatedAt: new Date().toISOString(),
              }
            : l
        ),
      }
    })
  }, [])

  // Reset all data
  const resetData = useCallback(() => {
    setData(getInitialData())
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Export to JSON (versioned, readable format)
  const exportToJSON = useCallback(() => {
    const exportData: ExportData = {
      version: DATA_VERSION,
      exportDate: new Date().toISOString(),
      deviceInfo: getDeviceInfo(),
      data: data,
    }

    const jsonContent = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const date = new Date().toISOString().split('T')[0]
    link.download = `suivi-depenses-backup-${date}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [data])

  // Import from JSON file
  const importFromJSON = useCallback((file: File): Promise<ImportResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const parsed = JSON.parse(content)
          
          // Check if it's the new versioned format or legacy format
          let importedData: AppData
          const warnings: string[] = []
          
          if (parsed.version && parsed.data) {
            // New versioned format
            const exportData = parsed as ExportData
            
            // Version compatibility check
            const [major] = exportData.version.split('.').map(Number)
            const [currentMajor] = DATA_VERSION.split('.').map(Number)
            
            if (major > currentMajor) {
              resolve({
                success: false,
                message: `Version incompatible. Le fichier est en version ${exportData.version}, cette application supporte jusqu'a la version ${DATA_VERSION}.`,
              })
              return
            }
            
            if (major < currentMajor) {
              warnings.push(`Migration depuis la version ${exportData.version}`)
            }
            
            importedData = exportData.data
          } else if (parsed.expenses && parsed.categories) {
            // Legacy format (direct AppData)
            importedData = parsed as AppData
            warnings.push('Format ancien detecte, migration effectuee')
          } else {
            resolve({
              success: false,
              message: 'Format de fichier invalide. Le fichier ne contient pas de donnees valides.',
            })
            return
          }
          
          // Validate and sanitize data
          const validatedData: AppData = {
            expenses: Array.isArray(importedData.expenses) 
              ? importedData.expenses.filter((e): e is Expense => 
                  e && typeof e.id === 'string' && typeof e.amount === 'number'
                )
              : [],
            categories: Array.isArray(importedData.categories) && importedData.categories.length > 0
              ? importedData.categories
              : DEFAULT_CATEGORIES,
            subscriptions: Array.isArray(importedData.subscriptions)
              ? importedData.subscriptions.filter((s): s is Subscription =>
                  s && typeof s.id === 'string' && typeof s.amount === 'number'
                ).map(s => ({
                  ...s,
                  isFixed: s.isFixed !== undefined ? s.isFixed : true,
                }))
              : [],
            incomes: Array.isArray(importedData.incomes)
              ? importedData.incomes.filter((i): i is Income =>
                  i && typeof i.id === 'string' && typeof i.amount === 'number'
                )
              : [],
            budgets: Array.isArray(importedData.budgets)
              ? importedData.budgets.filter((b): b is Budget =>
                  b && typeof b.id === 'string' && typeof b.amount === 'number'
                )
              : [],
            snapshots: Array.isArray(importedData.snapshots)
              ? importedData.snapshots.filter((s): s is MonthlySnapshot =>
                  s && typeof s.id === 'string' && typeof s.month === 'string'
                )
              : [],
            loans: Array.isArray(importedData.loans)
              ? importedData.loans.filter((l): l is Loan =>
                  l && typeof l.id === 'string' && typeof l.totalAmount === 'number'
                )
              : [],
            actions: Array.isArray(importedData.actions)
              ? importedData.actions.filter((a): a is FinancialAction =>
                  a && typeof a.id === 'string' && typeof a.title === 'string'
                )
              : [],
            categoryThresholds: typeof importedData.categoryThresholds === 'object'
              ? importedData.categoryThresholds || {}
              : {},
            settings: {
              ...DEFAULT_SETTINGS,
              ...importedData.settings,
            },
            version: DATA_VERSION,
          }
          
          setData(validatedData)
          
          const parts = [
            `${validatedData.expenses.length} depenses`,
            `${validatedData.incomes.length} revenus`,
            `${validatedData.subscriptions.length} recurrences`,
            `${validatedData.budgets.length} budgets`,
            `${validatedData.loans.length} prets/dettes`,
            `${validatedData.categories.length} categories`,
          ]
          
          resolve({
            success: true,
            message: `Import reussi: ${parts.join(', ')}.`,
            warnings: warnings.length > 0 ? warnings : undefined,
          })
        } catch {
          resolve({
            success: false,
            message: 'Erreur lors de la lecture du fichier. Verifiez que le fichier est un JSON valide.',
          })
        }
      }
      
      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Erreur lors de la lecture du fichier.',
        })
      }
      
      reader.readAsText(file)
    })
  }, [])

  // Export to CSV with filters
  const exportToCSV = useCallback((options?: { month?: string; categoryId?: string }) => {
    let expensesToExport = data.expenses

    if (options?.month) {
      expensesToExport = expensesToExport.filter((e) =>
        e.date.startsWith(options.month!)
      )
    }

    if (options?.categoryId) {
      expensesToExport = expensesToExport.filter((e) =>
        e.categoryId === options.categoryId
      )
    }

    if (expensesToExport.length === 0) {
      return { success: false, message: 'Aucune depense a exporter pour ces criteres.' }
    }

    const headers = ['Date', 'Montant', 'Categorie', 'Sous-categorie', 'Moyen de paiement', 'Note']
    const rows = expensesToExport.map((e) => {
      const category = data.categories.find((c) => c.id === e.categoryId)
      const paymentLabels: Record<string, string> = {
        cash: 'Especes',
        mobile_money: 'Mobile Money',
        card: 'Carte',
        transfer: 'Virement',
      }
      return [
        e.date,
        e.amount.toString(),
        category?.name || '',
        e.subcategory || '',
        paymentLabels[e.paymentMethod] || e.paymentMethod,
        e.note || '',
      ]
    })

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    // Add BOM for Excel compatibility
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    let filename = 'depenses'
    if (options?.month) filename += `-${options.month}`
    if (options?.categoryId) {
      const cat = data.categories.find(c => c.id === options.categoryId)
      if (cat) filename += `-${cat.name.toLowerCase().replace(/\s+/g, '-')}`
    }
    link.download = `${filename}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    return { success: true, message: `${expensesToExport.length} depenses exportees.` }
  }, [data.expenses, data.categories])

  // Export items to CSV (detailed items from expenses)
  const exportItemsToCSV = useCallback((options?: { month?: string; categoryId?: string; itemCategory?: string }) => {
    let expensesToExport = data.expenses

    if (options?.month) {
      expensesToExport = expensesToExport.filter((e) =>
        e.date.startsWith(options.month!)
      )
    }

    if (options?.categoryId) {
      expensesToExport = expensesToExport.filter((e) =>
        e.categoryId === options.categoryId
      )
    }

    // Collect all items from filtered expenses
    const itemRows: string[][] = []
    const paymentLabels: Record<string, string> = {
      cash: 'Especes',
      mobile_money: 'Mobile Money',
      card: 'Carte',
      transfer: 'Virement',
      wave: 'Wave',
      djamo: 'Djamo',
      other: 'Autre',
    }

    for (const expense of expensesToExport) {
      if (expense.items && expense.items.length > 0) {
        const category = data.categories.find((c) => c.id === expense.categoryId)
        
        for (const item of expense.items) {
          // Filter by item category if specified
          if (options?.itemCategory && item.itemCategory !== options.itemCategory) {
            continue
          }
          
          itemRows.push([
            expense.date,
            item.name,
            item.quantity?.toString() || '1',
            item.unit || '',
            item.unitPrice?.toString() || '',
            item.total?.toString() || '',
            item.itemCategory || '',
            category?.name || '',
            expense.subcategory || '',
            paymentLabels[expense.paymentMethod] || expense.paymentMethod,
          ])
        }
      }
    }

    if (itemRows.length === 0) {
      return { success: false, message: 'Aucun item detaille a exporter pour ces criteres.' }
    }

    const headers = ['Date', 'Item', 'Quantite', 'Unite', 'Prix unitaire', 'Total', 'Type item', 'Categorie', 'Sous-categorie', 'Paiement']
    const csvContent = [headers, ...itemRows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    let filename = 'items-detailles'
    if (options?.month) filename += `-${options.month}`
    link.download = `${filename}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    return { success: true, message: `${itemRows.length} items exportes.` }
  }, [data.expenses, data.categories])

  // Export loans to CSV
  const exportLoansToCSV = useCallback(() => {
    if (data.loans.length === 0) {
      return { success: false, message: 'Aucun pret/dette a exporter.' }
    }

    const rows: string[][] = []
    const headers = ['Type', 'Personne', 'Montant Total', 'Montant Rembourse', 'Restant', 'Statut', 'Date', 'Echeance', 'Moyen de Paiement', 'Note']

    data.loans.forEach((loan) => {
      rows.push([
        loan.type === 'PRETE' ? 'Prete' : 'Emprunte',
        loan.person,
        loan.totalAmount.toString(),
        loan.repaidAmount.toString(),
        loan.remainingAmount.toString(),
        loan.status,
        loan.date,
        loan.dueDate || '',
        loan.paymentMethod || '',
        loan.note || '',
      ])
    })

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `prets-dettes-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    return { success: true, message: `${rows.length} prets/dettes exportes.` }
  }, [data.loans])

  // Export loan repayments to CSV
  const exportRepaymentsToCSV = useCallback(() => {
    const loansWithRepayments = data.loans.filter((l) => l.repayments && l.repayments.length > 0)
    
    if (loansWithRepayments.length === 0) {
      return { success: false, message: 'Aucun remboursement a exporter.' }
    }

    const rows: string[][] = []
    const headers = ['Type Pret', 'Personne', 'Date Remboursement', 'Montant', 'Note']

    loansWithRepayments.forEach((loan) => {
      loan.repayments.forEach((repayment) => {
        rows.push([
          loan.type === 'PRETE' ? 'Prete' : 'Emprunte',
          loan.person,
          repayment.date,
          repayment.amount.toString(),
          repayment.note || '',
        ])
      })
    })

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `remboursements-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    return { success: true, message: `${rows.length} remboursements exportes.` }
  }, [data.loans])

  // Get raw data for potential future backend sync
  const getRawData = useCallback((): AppData => {
    return JSON.parse(JSON.stringify(data))
  }, [data])

  // Set data directly (for potential future backend sync)
  const setRawData = useCallback((newData: AppData) => {
    setData(newData)
  }, [])

  return {
    data,
    isLoaded,
    // Expenses
    addExpense,
    updateExpense,
    deleteExpense,
    // Categories
    addCategory,
    updateCategory,
    deleteCategory,
    // Subscriptions
    addSubscription,
    updateSubscription,
    deleteSubscription,
    // Incomes
    addIncome,
    updateIncome,
    deleteIncome,
    // Budgets
    setBudget,
    deleteBudget,
    // Snapshots
    createSnapshot,
    deleteSnapshot,
    updateSnapshot,
    // Actions
    addAction,
    updateAction,
    deleteAction,
    // Loans
    addLoan,
    updateLoan,
    deleteLoan,
    addRepayment,
    deleteRepayment,
    // Settings
    updateSettings,
    // Thresholds (deprecated)
    setCategoryThreshold,
    // Utils
    resetData,
    exportToCSV,
    exportItemsToCSV,
    exportLoansToCSV,
    exportRepaymentsToCSV,
    exportToJSON,
    importFromJSON,
    // Backend sync integration
    getRawData,
    setRawData,
    setOnDataChange: (cb: ((data: AppData) => void) | null) => { onDataChangeRef.current = cb },
  }
}
