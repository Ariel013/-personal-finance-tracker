'use client'

import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { type TransitionMonth } from '@/lib/types'

interface TransitionMonthIndicatorProps {
  currentMonth: string
  transitionMonths: TransitionMonth[]
}

export function TransitionMonthIndicator({
  currentMonth,
  transitionMonths,
}: TransitionMonthIndicatorProps) {
  const transition = transitionMonths.find((t) => t.month === currentMonth)

  if (!transition) {
    return null
  }

  return (
    <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
      <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">
        Mois de transition
      </AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <div className="space-y-2">
          <p className="font-medium">{transition.reason}</p>
          {transition.note && (
            <p className="text-sm">{transition.note}</p>
          )}
          <p className="text-xs italic">
            ⚠️ Les alertes budgétaires et les statistiques de ce mois peuvent ne pas être représentatives.
            Ce mois est marqué comme période de transition financière.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  )
}
