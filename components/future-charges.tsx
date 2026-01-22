'use client'

import { useMemo, useState } from 'react'
import { Calendar, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { type Subscription, type Category } from '@/lib/types'

interface FutureChargesProps {
  subscriptions: Subscription[]
  categories: Category[]
  currentMonth: string
}

export function FutureCharges({ subscriptions, categories, currentMonth }: FutureChargesProps) {
  const [isOpen, setIsOpen] = useState(false)

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-')
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
    return new Intl.DateTimeFormat('fr-FR', {
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  const futureSubscriptions = useMemo(() => {
    return subscriptions
      .filter((s) => s.status === 'A_VENIR' && s.startMonth > currentMonth)
      .sort((a, b) => a.startMonth.localeCompare(b.startMonth))
  }, [subscriptions, currentMonth])

  const totalFutureMonthly = useMemo(() => {
    return futureSubscriptions
      .filter((s) => s.frequency === 'monthly')
      .reduce((sum, s) => sum + s.amount, 0)
  }, [futureSubscriptions])

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, Subscription[]> = {}
    futureSubscriptions.forEach((sub) => {
      if (!groups[sub.startMonth]) {
        groups[sub.startMonth] = []
      }
      groups[sub.startMonth].push(sub)
    })
    return groups
  }, [futureSubscriptions])

  if (futureSubscriptions.length === 0) {
    return null
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-base">Charges futures</CardTitle>
              <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                {futureSubscriptions.length}
              </Badge>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                {isOpen ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          {!isOpen && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-2xl font-bold text-blue-900 dark:text-blue-100 tabular-nums">
                {formatAmount(totalFutureMonthly)}
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400">/mois</span>
            </div>
          )}
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-blue-100/50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">
            Impact mensuel futur estimé
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 tabular-nums">
            {formatAmount(totalFutureMonthly)}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            (abonnements mensuels uniquement)
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(groupedByMonth).map(([month, subs]) => {
            const monthTotal = subs.reduce((sum, s) => {
              if (s.frequency === 'monthly') return sum + s.amount
              if (s.frequency === 'quarterly') return sum + s.amount / 3
              if (s.frequency === 'yearly') return sum + s.amount / 12
              return sum
            }, 0)

            return (
              <div key={month} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100">
                  <Calendar className="size-4" />
                  <span className="capitalize">{formatMonth(month)}</span>
                  <span className="text-blue-600 dark:text-blue-400 ml-auto">
                    ~{formatAmount(monthTotal)}/mois
                  </span>
                </div>
                <div className="space-y-1 pl-6">
                  {subs.map((sub) => {
                    const category = categories.find((c) => c.id === sub.categoryId)
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between text-sm py-2 px-3 rounded bg-white/50 dark:bg-blue-950/40"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{sub.name}</span>
                          {category && (
                            <Badge variant="outline" className="text-xs">
                              {category.name}
                            </Badge>
                          )}
                          {sub.isFixed && (
                            <Badge variant="secondary" className="text-xs">
                              Fixe
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {sub.frequency === 'monthly' && 'Mensuel'}
                            {sub.frequency === 'quarterly' && 'Trimestriel'}
                            {sub.frequency === 'yearly' && 'Annuel'}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatAmount(sub.amount)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

            <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300 italic">
                💡 Ces abonnements seront automatiquement activés et impacteront votre budget à partir de leur mois de début.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
