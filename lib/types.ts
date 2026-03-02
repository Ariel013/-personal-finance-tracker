// Item within an expense (for detailed tracking)
export interface ExpenseItem {
  id: string
  name: string
  quantity?: number
  unit?: string
  unitPrice?: number
  total?: number
  itemCategory?: string // Fine category (alimentaire, hygiene, boisson, etc.)
}

export interface Expense {
  id: string
  amount: number
  categoryId: string
  subcategory?: string
  date: string
  paymentMethod: PaymentMethod
  note?: string
  decisionNote?: string // Note de décision : pourquoi cette dépense
  items?: ExpenseItem[] // List of detailed items
  tags?: string[] // Tags transversaux (#travail, #famille, etc.)
  isSimulated?: boolean // Pour le mode simulation
  createdAt: string
  // Financial context for hybrid months
  accountingMonth?: string // YYYY-MM - Mois comptable explicite (si différent de date)
  financialContext?: string // Zone/pays (ex: Bénin, Côte d'Ivoire, France)
  incomeSource?: string // Source de revenu associée (optionnel)
}

export type PaymentMethod = 'cash' | 'mobile_money' | 'card' | 'transfer' | 'wave' | 'djamo' | 'other'

export const ITEM_CATEGORIES = [
  'alimentaire',
  'boisson',
  'hygiene',
  'entretien',
  'snack',
  'electronique',
  'vetement',
  'autre',
] as const

export type ItemCategory = (typeof ITEM_CATEGORIES)[number]

export interface Category {
  id: string
  name: string
  color: string
  isDefault: boolean
}

// Récurrences (charges fixes et variables)
export type SubscriptionStatus = 'A_VENIR' | 'ACTIF' | 'SUSPENDU'
export type SubscriptionFrequency = 'monthly' | 'quarterly' | 'yearly'

export interface Subscription {
  id: string
  name: string
  amount: number
  categoryId: string
  billingDate: number // Day of month (1-31)
  isActive: boolean // @deprecated - use status instead
  isSuspended?: boolean // @deprecated - use status instead
  suspendedUntil?: string // @deprecated
  isFixed: boolean // true = charge fixe, false = charge variable
  createdAt: string
  updatedAt?: string
  // Budgetary activation management
  status: SubscriptionStatus // A_VENIR | ACTIF | SUSPENDU
  frequency: SubscriptionFrequency // monthly | quarterly | yearly
  startMonth: string // YYYY-MM - Premier mois d'impact budgétaire réel
  endMonth?: string // YYYY-MM - Optionnel, dernier mois d'impact budgétaire
}

// Revenus mensuels
export interface Income {
  id: string
  amount: number
  source: string // Salaire, freelance, etc.
  date: string // YYYY-MM-DD
  isRecurring: boolean
  createdAt: string
}

// Budgets mensuels par catégorie
export interface Budget {
  id: string
  categoryId: string
  amount: number
  month: string // YYYY-MM
  createdAt: string
}

// Snapshot mensuel (fin de mois)
export interface MonthlySnapshot {
  id: string
  month: string // YYYY-MM
  totalIncome: number
  totalExpenses: number
  totalFixedCharges: number
  totalVariableExpenses: number
  budgetCompliance: { // Budgets respectés/dépassés
    categoryId: string
    budgeted: number
    spent: number
    status: 'ok' | 'warning' | 'exceeded' // ok < 80%, warning 80-100%, exceeded > 100%
  }[]
  topDecisions: string[] // Notes de décision clés du mois
  reportNote?: string // Note texte libre attachée au rapport
  attachmentPath?: string // Chemin vers fichier local (PDF, etc.)
  createdAt: string
}

// Prêts et dettes
export type LoanType = 'PRETE' | 'EMPRUNTE'
export type LoanStatus = 'EN_COURS' | 'PARTIELLEMENT_REMBOURSE' | 'REMBOURSE'

export interface LoanRepayment {
  id: string
  date: string // YYYY-MM-DD
  amount: number
  note?: string
  fromSalary?: boolean // Remboursé depuis le salaire
  createdAt: string
}

export interface Loan {
  id: string
  type: LoanType // PRETE (je prête) | EMPRUNTE (j'emprunte)
  person: string // Nom de la personne
  totalAmount: number
  repaidAmount: number // Montant déjà remboursé
  remainingAmount: number // Solde restant
  status: LoanStatus
  date: string // YYYY-MM-DD - Date de création du prêt/dette
  dueDate?: string // YYYY-MM-DD - Date de remboursement prévue
  paymentMethod?: PaymentMethod
  note?: string // Contexte, conditions, confiance
  repayments: LoanRepayment[] // Historique des remboursements
  createdAt: string
  updatedAt?: string
}

// Actions financières (suivi des tâches)
export type ActionStatus = 'A_FAIRE' | 'FAIT' | 'EN_ATTENTE'

export interface FinancialAction {
  id: string
  title: string
  amount?: number
  dueDate?: string // YYYY-MM-DD
  status: ActionStatus
  completedDate?: string // ISO string, set when status → FAIT
  note?: string
  createdAt: string
}

// Paramètres de l'application
export interface TransitionMonth {
  month: string // YYYY-MM
  reason: string // Ex: "Changement de pays", "Fin de contrat", etc.
  note?: string
}

export interface AppSettings {
  strictMode: boolean // Mode "mois sous contrôle"
  minimalBudget: number // Budget minimum vital mensuel
  currency: string
  locale: string
  transitionMonths: TransitionMonth[] // Mois de transition (désactive alertes inappropriées)
  defaultFinancialContext?: string // Contexte financier par défaut
}

export interface AppData {
  expenses: Expense[]
  categories: Category[]
  subscriptions: Subscription[]
  incomes: Income[]
  budgets: Budget[]
  snapshots: MonthlySnapshot[]
  loans: Loan[]
  actions: FinancialAction[]
  categoryThresholds: Record<string, number> // @deprecated - use budgets instead
  settings: AppSettings
  version: string
}

// Versioned export format for backup/restore
export const DATA_VERSION = '2.3.0' // Added: financial actions, report notes, data seeding

export interface ExportData {
  version: string
  exportDate: string
  deviceInfo: string
  data: AppData
}

export interface ImportResult {
  success: boolean
  message: string
  warnings?: string[]
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'rent', name: 'Loyer', color: '#475569', isDefault: true },
  { id: 'transport', name: 'Transport', color: '#0284c7', isDefault: true },
  { id: 'food', name: 'Nourriture', color: '#16a34a', isDefault: true },
  { id: 'subscriptions', name: 'Abonnements', color: '#7c3aed', isDefault: true },
  { id: 'health', name: 'Sante', color: '#dc2626', isDefault: true },
  { id: 'leisure', name: 'Loisirs', color: '#ea580c', isDefault: true },
  { id: 'family', name: 'Famille', color: '#db2777', isDefault: true },
  { id: 'savings', name: 'Epargne', color: '#0d9488', isDefault: true },
  { id: 'other', name: 'Autres', color: '#64748b', isDefault: true },
]

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Especes' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'card', label: 'Carte' },
  { value: 'transfer', label: 'Virement' },
  { value: 'wave', label: 'Wave' },
  { value: 'djamo', label: 'Djamo' },
  { value: 'other', label: 'Autre' },
]

// Tags suggérés (l'utilisateur peut en créer d'autres)
export const SUGGESTED_TAGS = [
  'travail',
  'famille',
  'plaisir',
  'stress',
  'exceptionnel',
  'urgent',
  'planifie',
  'cadeau',
  'sante',
  'formation',
] as const

// Sources de revenus suggérées
export const INCOME_SOURCES = [
  'Salaire',
  'Freelance',
  'Prime',
  'Investissement',
  'Cadeau',
  'Remboursement',
  'Autre',
] as const

// Paramètres par défaut
export const DEFAULT_SETTINGS: AppSettings = {
  strictMode: false,
  minimalBudget: 0,
  currency: 'XOF',
  locale: 'fr-FR',
  transitionMonths: [],
  defaultFinancialContext: undefined,
}

// Types pour l'analyse temporelle
export interface MonthComparison {
  currentMonth: string
  previousMonth: string
  currentTotal: number
  previousTotal: number
  difference: number
  percentageChange: number
  byCategory: {
    categoryId: string
    categoryName: string
    current: number
    previous: number
    difference: number
  }[]
}

export interface ThreeMonthAverage {
  months: string[]
  averageTotal: number
  currentMonth: string
  currentTotal: number
  isAboveAverage: boolean
  byCategory: {
    categoryId: string
    categoryName: string
    average: number
    current: number
  }[]
}

// Types pour le mode simulation
export interface SimulationData {
  expenses: Expense[]
  incomes: Income[]
  budgets: Budget[]
}

export interface SupabaseConfig {
  url: string
  anonKey: string
  enabled: boolean
}

export interface SimulationResult {
  month1: {
    income: number
    expenses: number
    balance: number
    availableAfterFixed: number
  }
  month3: {
    income: number
    expenses: number
    balance: number
    averageMonthly: number
  }
  month6: {
    income: number
    expenses: number
    balance: number
    averageMonthly: number
  }
}
