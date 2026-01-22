'use client'

import { useState } from 'react'
import { Pencil, Trash2, ChevronDown, ChevronUp, Package, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { type Expense, type Category, PAYMENT_METHODS } from '@/lib/types'
import { ExpenseForm } from './expense-form'

interface ExpenseListProps {
  expenses: Expense[]
  categories: Category[]
  onUpdate: (id: string, updates: Partial<Expense>) => void
  onDelete: (id: string) => void
}

export function ExpenseList({
  expenses,
  categories,
  onUpdate,
  onDelete,
}: ExpenseListProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)
  const [expandedExpenses, setExpandedExpenses] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedExpenses((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    })
  }

  const getCategoryById = (id: string) => categories.find((c) => c.id === id)
  const getPaymentLabel = (method: string) =>
    PAYMENT_METHODS.find((m) => m.value === method)?.label || method

  // Group expenses by date
  const groupedExpenses = expenses.reduce<Record<string, Expense[]>>((acc, expense) => {
    const date = expense.date
    if (!acc[date]) acc[date] = []
    acc[date].push(expense)
    return acc
  }, {})

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => b.localeCompare(a))

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Aucune depense ce mois-ci</p>
        <p className="text-sm text-muted-foreground">
          Ajoutez votre premiere depense pour commencer
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {sortedDates.map((date) => (
          <div key={date}>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              {formatDate(date)}
            </h3>
            <div className="flex flex-col gap-2">
              {groupedExpenses[date].map((expense) => {
                const category = getCategoryById(expense.categoryId)
                const hasItems = expense.items && expense.items.length > 0
                const isExpanded = expandedExpenses.has(expense.id)

                return (
                  <div
                    key={expense.id}
                    className="rounded-lg border bg-card overflow-hidden"
                  >
                    <div className="flex items-center gap-3 p-3">
                      <div
                        className="size-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${category?.color}15` }}
                      >
                        <span
                          className="size-3 rounded-full"
                          style={{ backgroundColor: category?.color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {category?.name}
                          </span>
                          {expense.subcategory && (
                            <span className="text-xs text-muted-foreground truncate">
                              {expense.subcategory}
                            </span>
                          )}
                          {hasItems && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              <Package className="size-3" />
                              {expense.items!.length}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{getPaymentLabel(expense.paymentMethod)}</span>
                          {expense.note && (
                            <>
                              <span>-</span>
                              <span className="truncate">{expense.note}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold tabular-nums">
                          {formatAmount(expense.amount)}
                        </span>
                        {hasItems && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => toggleExpanded(expense.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="size-4" />
                            ) : (
                              <ChevronDown className="size-4" />
                            )}
                            <span className="sr-only">
                              {isExpanded ? 'Masquer' : 'Afficher'} les items
                            </span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditingExpense(expense)}
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Modifier</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeletingExpenseId(expense.id)}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Supprimer</span>
                        </Button>
                      </div>
                    </div>

                    {/* Items list */}
                    {hasItems && isExpanded && (
                      <div className="border-t bg-muted/30 px-3 py-2">
                        <div className="flex flex-col gap-1">
                          {expense.items!.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-sm py-1"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="truncate">{item.name}</span>
                                {item.itemCategory && (
                                  <span className="text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded">
                                    {item.itemCategory}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-muted-foreground">
                                {item.quantity && (
                                  <span className="text-xs">
                                    {item.quantity}
                                    {item.unit ? ` ${item.unit}` : ''}
                                    {item.unitPrice ? ` x ${formatAmount(item.unitPrice)}` : ''}
                                  </span>
                                )}
                                {item.total && (
                                  <span className="font-medium text-foreground tabular-nums">
                                    {formatAmount(item.total)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags and Decision Note */}
                    {(expense.tags?.length || expense.decisionNote) && (
                      <div className="border-t bg-muted/20 px-3 py-2 space-y-2">
                        {expense.tags && expense.tags.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {expense.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {expense.decisionNote && (
                          <div className="flex gap-2 text-xs">
                            <FileText className="size-3 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-muted-foreground italic">{expense.decisionNote}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {editingExpense && (
        <ExpenseForm
          open={!!editingExpense}
          onOpenChange={(open) => !open && setEditingExpense(null)}
          categories={categories}
          expense={editingExpense}
          onSubmit={(data) => {
            onUpdate(editingExpense.id, data)
            setEditingExpense(null)
          }}
        />
      )}

      <AlertDialog
        open={!!deletingExpenseId}
        onOpenChange={(open) => !open && setDeletingExpenseId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la depense?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingExpenseId) {
                  onDelete(deletingExpenseId)
                  setDeletingExpenseId(null)
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
