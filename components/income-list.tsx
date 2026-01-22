'use client'

import { Trash2, TrendingUp, Repeat } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { type Income } from '@/lib/types'

interface IncomeListProps {
  incomes: Income[]
  selectedMonth: string
  onDelete: (id: string) => void
}

export function IncomeList({ incomes, selectedMonth, onDelete }: IncomeListProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const monthIncomes = incomes
    .filter((i) => i.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date))

  const total = monthIncomes.reduce((sum, i) => sum + i.amount, 0)

  if (monthIncomes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="size-4" />
            Revenus du mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucun revenu enregistré pour ce mois
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="size-4" />
            Revenus du mois
          </span>
          <span className="text-lg font-bold tabular-nums text-green-600 dark:text-green-400">
            {formatAmount(total)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {monthIncomes.map((income) => (
            <div
              key={income.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{income.source}</span>
                  {income.isRecurring && (
                    <Repeat className="size-3 text-muted-foreground shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(income.date)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold tabular-nums text-green-600 dark:text-green-400">
                  {formatAmount(income.amount)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(income.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
