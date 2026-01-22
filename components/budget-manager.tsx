'use client'

import { useState } from 'react'
import { AlertTriangle, TrendingDown, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { type Category, type Budget, type Expense } from '@/lib/types'

interface BudgetManagerProps {
  categories: Category[]
  budgets: Budget[]
  expenses: Expense[]
  selectedMonth: string
  onSetBudget: (categoryId: string, month: string, amount: number) => void
}

export function BudgetManager({
  categories,
  budgets,
  expenses,
  selectedMonth,
  onSetBudget,
}: BudgetManagerProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [budgetInput, setBudgetInput] = useState('')

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getBudgetData = (categoryId: string) => {
    const budget = budgets.find(
      (b) => b.categoryId === categoryId && b.month === selectedMonth
    )

    const spent = expenses
      .filter(
        (e) =>
          e.date.startsWith(selectedMonth) &&
          e.categoryId === categoryId &&
          !e.isSimulated
      )
      .reduce((sum, e) => sum + e.amount, 0)

    if (!budget) return { budget: null, spent, remaining: 0, percentage: 0, status: 'none' as const }

    const remaining = budget.amount - spent
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0

    let status: 'ok' | 'warning' | 'exceeded'
    if (percentage < 80) status = 'ok'
    else if (percentage <= 100) status = 'warning'
    else status = 'exceeded'

    return { budget, spent, remaining, percentage, status }
  }

  const handleSaveBudget = (categoryId: string) => {
    const amount = parseFloat(budgetInput)
    if (amount > 0) {
      onSetBudget(categoryId, selectedMonth, amount)
    }
    setEditingCategory(null)
    setBudgetInput('')
  }

  const handleEditBudget = (categoryId: string, currentAmount?: number) => {
    setEditingCategory(categoryId)
    setBudgetInput(currentAmount ? currentAmount.toString() : '')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Budgets mensuels</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {categories.map((category) => {
            const { budget, spent, remaining, percentage, status } = getBudgetData(category.id)
            const isEditing = editingCategory === category.id

            return (
              <div
                key={category.id}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  {status === 'exceeded' && (
                    <AlertTriangle className="size-4 text-red-500" />
                  )}
                  {status === 'warning' && (
                    <TrendingDown className="size-4 text-amber-500" />
                  )}
                  {status === 'ok' && budget && (
                    <Check className="size-4 text-green-500" />
                  )}
                </div>

                {isEditing ? (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="1000"
                      min="0"
                      placeholder="Montant du budget"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveBudget(category.id)}
                      disabled={!budgetInput || parseFloat(budgetInput) <= 0}
                    >
                      OK
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCategory(null)
                        setBudgetInput('')
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <>
                    {budget ? (
                      <>
                        <div className="flex items-baseline justify-between mb-2 text-sm">
                          <span className="text-muted-foreground">
                            {formatAmount(spent)} / {formatAmount(budget.amount)}
                          </span>
                          <span
                            className={`font-semibold tabular-nums ${
                              status === 'exceeded'
                                ? 'text-red-600 dark:text-red-400'
                                : status === 'warning'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-green-600 dark:text-green-400'
                            }`}
                          >
                            {remaining >= 0 ? formatAmount(remaining) : `-${formatAmount(Math.abs(remaining))}`}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(percentage, 100)}
                          className="h-2 mb-2"
                          indicatorClassName={
                            status === 'exceeded'
                              ? 'bg-red-500'
                              : status === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                          }
                        />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {percentage.toFixed(0)}% utilisé
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => handleEditBudget(category.id, budget.amount)}
                          >
                            Modifier
                          </Button>
                        </div>
                      </>
                    ) : spent > 0 ? (
                      <>
                        <div className="text-sm text-muted-foreground mb-2">
                          Dépensé : {formatAmount(spent)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleEditBudget(category.id)}
                        >
                          Définir un budget
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground"
                        onClick={() => handleEditBudget(category.id)}
                      >
                        Définir un budget
                      </Button>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
