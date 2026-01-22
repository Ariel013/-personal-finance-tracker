'use client'

import { useEffect } from 'react'
import { type Subscription, type Expense } from '@/lib/types'

const AUTO_RECURRENCE_KEY = 'last-recurrence-check'

interface UseAutoRecurrencesProps {
  subscriptions: Subscription[]
  expenses: Expense[]
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void
}

/**
 * Hook pour créer automatiquement les dépenses récurrentes en début de mois
 */
export function useAutoRecurrences({
  subscriptions,
  expenses,
  addExpense,
}: UseAutoRecurrencesProps) {
  useEffect(() => {
    // Vérifier une seule fois par jour maximum
    const lastCheck = localStorage.getItem(AUTO_RECURRENCE_KEY)
    const today = new Date().toISOString().split('T')[0]
    
    if (lastCheck === today) {
      return // Déjà vérifié aujourd'hui
    }

    const currentMonth = today.substring(0, 7) // YYYY-MM
    
    // Récupérer les récurrences actives et dans leur période d'impact budgétaire
    const activeRecurrences = subscriptions.filter((sub) => {
      // Utiliser le nouveau champ status si disponible, sinon fallback sur isActive
      const isActive = sub.status ? sub.status === 'ACTIF' : sub.isActive
      if (!isActive) return false
      
      // Vérifier si l'abonnement a commencé son impact budgétaire
      if (sub.startMonth && currentMonth < sub.startMonth) {
        return false // Pas encore actif budgétairement
      }
      
      // Vérifier si l'abonnement a terminé son impact budgétaire
      if (sub.endMonth && currentMonth > sub.endMonth) {
        return false // Plus actif
      }
      
      // Vérifier la suspension (compatibilité)
      if (sub.isSuspended && sub.suspendedUntil && currentMonth <= sub.suspendedUntil) {
        return false
      }
      
      return true
    })

    // Vérifier si les dépenses ont déjà été créées pour ce mois
    activeRecurrences.forEach((sub) => {
      // Vérifier si c'est le bon mois selon la fréquence
      const shouldGenerateThisMonth = (() => {
        const frequency = sub.frequency || 'monthly'
        
        if (frequency === 'monthly') {
          return true // Générer tous les mois
        }
        
        if (frequency === 'quarterly') {
          // Générer tous les 3 mois à partir du startMonth
          const start = new Date(sub.startMonth + '-01')
          const current = new Date(currentMonth + '-01')
          const monthsDiff = (current.getFullYear() - start.getFullYear()) * 12 + 
                            (current.getMonth() - start.getMonth())
          return monthsDiff % 3 === 0
        }
        
        if (frequency === 'yearly') {
          // Générer le même mois chaque année
          const startMonthNum = sub.startMonth.substring(5, 7)
          const currentMonthNum = currentMonth.substring(5, 7)
          return startMonthNum === currentMonthNum
        }
        
        return true // Par défaut, générer
      })()
      
      if (!shouldGenerateThisMonth) {
        return // Pas le bon mois pour cette fréquence
      }
      
      const alreadyExists = expenses.some(
        (exp) =>
          exp.date.startsWith(currentMonth) &&
          exp.note?.includes(`[AUTO-${sub.id}]`)
      )

      if (!alreadyExists) {
        // Créer la dépense automatiquement
        const day = Math.min(sub.billingDate, 28) // Limiter au 28 pour éviter les problèmes avec février
        const expenseDate = `${currentMonth}-${String(day).padStart(2, '0')}`

        addExpense({
          amount: sub.amount,
          categoryId: sub.categoryId,
          subcategory: sub.name,
          date: expenseDate,
          paymentMethod: 'other',
          note: `Recurrence automatique [AUTO-${sub.id}]`,
        })
      }
    })

    // Marquer comme vérifié aujourd'hui
    localStorage.setItem(AUTO_RECURRENCE_KEY, today)
  }, [subscriptions, expenses, addExpense])
}
