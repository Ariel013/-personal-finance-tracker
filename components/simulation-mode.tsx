'use client'

import { useState } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Calculator } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Category } from '@/lib/types'

interface SimulatedItem {
  id: string
  type: 'expense' | 'income'
  amount: number
  categoryId?: string
  label: string
}

interface SimulationModeProps {
  categories: Category[]
  currentMonthlyIncome: number
  currentMonthlyExpenses: number
  averageMonthlyExpenses: number
}

export function SimulationMode({
  categories,
  currentMonthlyIncome,
  currentMonthlyExpenses,
  averageMonthlyExpenses,
}: SimulationModeProps) {
  const [simulatedItems, setSimulatedItems] = useState<SimulatedItem[]>([])
  const [itemType, setItemType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleAddItem = () => {
    if (!amount || parseFloat(amount) <= 0 || !label) return

    const newItem: SimulatedItem = {
      id: crypto.randomUUID(),
      type: itemType,
      amount: parseFloat(amount),
      label,
      categoryId: itemType === 'expense' ? categoryId : undefined,
    }

    setSimulatedItems((prev) => [...prev, newItem])
    setAmount('')
    setLabel('')
    setCategoryId('')
  }

  const handleRemoveItem = (id: string) => {
    setSimulatedItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Calculs de simulation
  const totalSimulatedIncome = simulatedItems
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0)

  const totalSimulatedExpenses = simulatedItems
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0)

  const projectedMonthlyIncome = currentMonthlyIncome + totalSimulatedIncome
  const projectedMonthlyExpenses = currentMonthlyExpenses + totalSimulatedExpenses
  const projectedMonthlyBalance = projectedMonthlyIncome - projectedMonthlyExpenses

  const projected3Months = {
    income: projectedMonthlyIncome * 3,
    expenses: projectedMonthlyExpenses * 3,
    balance: projectedMonthlyIncome * 3 - projectedMonthlyExpenses * 3,
  }

  const projected6Months = {
    income: projectedMonthlyIncome * 6,
    expenses: projectedMonthlyExpenses * 6,
    balance: projectedMonthlyIncome * 6 - projectedMonthlyExpenses * 6,
  }

  return (
    <div className="flex flex-col gap-6">
      <Alert>
        <Calculator className="size-4" />
        <AlertDescription>
          Les simulations n{"'"}affectent pas vos données réelles. Ajoutez des revenus ou dépenses
          hypothétiques pour projeter leur impact.
        </AlertDescription>
      </Alert>

      {/* Formulaire d'ajout */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ajouter une simulation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={itemType === 'expense' ? 'default' : 'outline'}
                onClick={() => setItemType('expense')}
                className="h-auto py-3"
              >
                <TrendingDown className="size-4 mr-2" />
                Dépense
              </Button>
              <Button
                variant={itemType === 'income' ? 'default' : 'outline'}
                onClick={() => setItemType('income')}
                className="h-auto py-3"
              >
                <TrendingUp className="size-4 mr-2" />
                Revenu
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sim-label">Description</Label>
              <Input
                id="sim-label"
                placeholder="Ex: Nouveau salaire, achat voiture..."
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sim-amount">Montant mensuel</Label>
              <Input
                id="sim-amount"
                type="number"
                step="1000"
                min="0"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {itemType === 'expense' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="sim-category">Catégorie</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="sim-category">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button onClick={handleAddItem} disabled={!amount || !label}>
              <Plus className="size-4 mr-2" />
              Ajouter à la simulation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Items simulés */}
      {simulatedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Éléments simulés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {simulatedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {item.type === 'income' ? (
                      <TrendingUp className="size-4 text-green-500" />
                    ) : (
                      <TrendingDown className="size-4 text-red-500" />
                    )}
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-semibold tabular-nums ${
                        item.type === 'income'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatAmount(item.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projection 1 mois
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Revenus</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatAmount(projectedMonthlyIncome)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Dépenses</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatAmount(projectedMonthlyExpenses)}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between">
              <span className="font-semibold">Balance</span>
              <span
                className={`font-bold tabular-nums ${
                  projectedMonthlyBalance >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatAmount(projectedMonthlyBalance)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projection 3 mois
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Revenus</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatAmount(projected3Months.income)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Dépenses</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatAmount(projected3Months.expenses)}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between">
              <span className="font-semibold">Balance</span>
              <span
                className={`font-bold tabular-nums ${
                  projected3Months.balance >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatAmount(projected3Months.balance)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projection 6 mois
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Revenus</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatAmount(projected6Months.income)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Dépenses</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatAmount(projected6Months.expenses)}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between">
              <span className="font-semibold">Balance</span>
              <span
                className={`font-bold tabular-nums ${
                  projected6Months.balance >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatAmount(projected6Months.balance)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
