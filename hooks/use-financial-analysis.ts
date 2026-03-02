'use client'

import { useMemo } from 'react'
import {
  type Expense,
  type Income,
  type Subscription,
  type Budget,
  type Category,
  type MonthComparison,
  type ThreeMonthAverage,
} from '@/lib/types'

interface UseFinancialAnalysisProps {
  expenses: Expense[]
  incomes: Income[]
  subscriptions: Subscription[]
  budgets: Budget[]
  categories: Category[]
  selectedMonth: string
  minimalBudget: number
}

export function useFinancialAnalysis({
  expenses,
  incomes,
  subscriptions,
  budgets,
  categories,
  selectedMonth,
  minimalBudget,
}: UseFinancialAnalysisProps) {
  // Calcul du mois précédent
  const previousMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const date = new Date(year, month - 2, 1) // -2 car les mois commencent à 0
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }, [selectedMonth])

  // Calcul des 3 derniers mois
  const lastThreeMonths = useMemo(() => {
    const months: string[] = []
    const [year, month] = selectedMonth.split('-').map(Number)
    
    for (let i = 2; i >= 0; i--) {
      const date = new Date(year, month - 1 - i, 1)
      months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
    }
    
    return months
  }, [selectedMonth])

  // Charges fixes du mois en cours
  const fixedChargesForMonth = useMemo(() => {
    return subscriptions
      .filter((s) => {
        if (!s.isActive || !s.isFixed) return false
        if (s.startMonth && selectedMonth < s.startMonth) return false
        if (s.isSuspended && s.suspendedUntil) {
          return selectedMonth > s.suspendedUntil
        }
        return true
      })
      .reduce((sum, s) => sum + s.amount, 0)
  }, [subscriptions, selectedMonth])

  // Revenus du mois
  const monthlyIncome = useMemo(() => {
    return incomes
      .filter((i) => i.date.startsWith(selectedMonth))
      .reduce((sum, i) => sum + i.amount, 0)
  }, [incomes, selectedMonth])

  // Dépenses du mois
  const monthlyExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.date.startsWith(selectedMonth) && !e.isSimulated)
      .reduce((sum, e) => sum + e.amount, 0)
  }, [expenses, selectedMonth])

  // Argent réellement disponible
  const reallyAvailable = useMemo(() => {
    const today = new Date()
    const [selYear, selMonth] = selectedMonth.split('-').map(Number)
    const isCurrentMonth =
      today.getFullYear() === selYear && today.getMonth() + 1 === selMonth
    const currentDay = isCurrentMonth ? today.getDate() : 0

    const remainingFixedCharges = subscriptions
      .filter((s) => {
        if (!s.isActive || !s.isFixed) return false
        if (s.isSuspended && s.suspendedUntil && selectedMonth <= s.suspendedUntil) return false
        if (s.startMonth && selectedMonth < s.startMonth) return false
        // For current month: only charges not yet billed
        // For future months: all charges count
        return s.billingDate > currentDay
      })
      .reduce((sum, s) => sum + s.amount, 0)

    return monthlyIncome - monthlyExpenses - remainingFixedCharges - minimalBudget
  }, [monthlyIncome, monthlyExpenses, subscriptions, selectedMonth, minimalBudget])

  // Comparaison avec le mois précédent
  const monthComparison = useMemo((): MonthComparison => {
    const currentExpenses = expenses.filter(
      (e) => e.date.startsWith(selectedMonth) && !e.isSimulated
    )
    const previousExpenses = expenses.filter(
      (e) => e.date.startsWith(previousMonth) && !e.isSimulated
    )

    const currentTotal = currentExpenses.reduce((sum, e) => sum + e.amount, 0)
    const previousTotal = previousExpenses.reduce((sum, e) => sum + e.amount, 0)
    const difference = currentTotal - previousTotal
    const percentageChange = previousTotal > 0 ? (difference / previousTotal) * 100 : 0

    const byCategory = categories.map((cat) => {
      const current = currentExpenses
        .filter((e) => e.categoryId === cat.id)
        .reduce((sum, e) => sum + e.amount, 0)
      const previous = previousExpenses
        .filter((e) => e.categoryId === cat.id)
        .reduce((sum, e) => sum + e.amount, 0)

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        current,
        previous,
        difference: current - previous,
      }
    }).filter(c => c.current > 0 || c.previous > 0)

    return {
      currentMonth: selectedMonth,
      previousMonth,
      currentTotal,
      previousTotal,
      difference,
      percentageChange,
      byCategory,
    }
  }, [expenses, categories, selectedMonth, previousMonth])

  // Moyenne sur 3 mois
  const threeMonthAverage = useMemo((): ThreeMonthAverage => {
    const monthlyTotals = lastThreeMonths.map((month) => {
      return expenses
        .filter((e) => e.date.startsWith(month) && !e.isSimulated)
        .reduce((sum, e) => sum + e.amount, 0)
    })

    const averageTotal = monthlyTotals.reduce((sum, t) => sum + t, 0) / 3
    const currentTotal = monthlyExpenses

    const byCategory = categories.map((cat) => {
      const monthlyAmounts = lastThreeMonths.map((month) => {
        return expenses
          .filter((e) => e.date.startsWith(month) && e.categoryId === cat.id && !e.isSimulated)
          .reduce((sum, e) => sum + e.amount, 0)
      })

      const average = monthlyAmounts.reduce((sum, a) => sum + a, 0) / 3
      const current = expenses
        .filter((e) => e.date.startsWith(selectedMonth) && e.categoryId === cat.id && !e.isSimulated)
        .reduce((sum, e) => sum + e.amount, 0)

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        average,
        current,
      }
    }).filter(c => c.average > 0 || c.current > 0)

    return {
      months: lastThreeMonths,
      averageTotal,
      currentMonth: selectedMonth,
      currentTotal,
      isAboveAverage: currentTotal > averageTotal,
      byCategory,
    }
  }, [expenses, categories, lastThreeMonths, selectedMonth, monthlyExpenses])

  // Statut des budgets par catégorie
  const budgetStatus = useMemo(() => {
    return categories
      .map((cat) => {
        const budget = budgets.find(
          (b) => b.categoryId === cat.id && b.month === selectedMonth
        )
        
        if (!budget) return null

        const spent = expenses
          .filter((e) => e.date.startsWith(selectedMonth) && e.categoryId === cat.id && !e.isSimulated)
          .reduce((sum, e) => sum + e.amount, 0)

        const remaining = budget.amount - spent
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0

        let status: 'ok' | 'warning' | 'exceeded'
        if (percentage < 80) status = 'ok'
        else if (percentage <= 100) status = 'warning'
        else status = 'exceeded'

        return {
          categoryId: cat.id,
          categoryName: cat.name,
          categoryColor: cat.color,
          budgeted: budget.amount,
          spent,
          remaining,
          percentage,
          status,
        }
      })
      .filter((b): b is NonNullable<typeof b> => b !== null)
  }, [categories, budgets, expenses, selectedMonth])

  return {
    fixedChargesForMonth,
    monthlyIncome,
    monthlyExpenses,
    reallyAvailable,
    monthComparison,
    threeMonthAverage,
    budgetStatus,
  }
}
