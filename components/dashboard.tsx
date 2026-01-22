'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Package } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type Expense, type Category, type Subscription, ITEM_CATEGORIES } from '@/lib/types'

interface DashboardProps {
  expenses: Expense[]
  categories: Category[]
  subscriptions: Subscription[]
  categoryThresholds: Record<string, number>
  selectedMonth: string
}

export function Dashboard({
  expenses,
  categories,
  subscriptions,
  categoryThresholds,
  selectedMonth,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const {
    monthlyExpenses,
    totalExpenses,
    categoryTotals,
    dailyExpenses,
    activeSubscriptionsTotal,
    variableExpenses,
    alerts,
    itemStats,
    itemCategoryStats,
  } = useMemo(() => {
    // Filter expenses for selected month
    const monthlyExp = expenses.filter((e) => e.date.startsWith(selectedMonth))
    const total = monthlyExp.reduce((sum, e) => sum + e.amount, 0)

    // Calculate totals by category
    const catTotals = categories
      .map((cat) => {
        const categoryExpenses = monthlyExp.filter((e) => e.categoryId === cat.id)
        const amount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0)
        return {
          id: cat.id,
          name: cat.name,
          color: cat.color,
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
        }
      })
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)

    // Calculate daily expenses for the month
    const daysInMonth = new Date(
      parseInt(selectedMonth.split('-')[0]),
      parseInt(selectedMonth.split('-')[1]),
      0
    ).getDate()

    const dailyExp = Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, '0')
      const date = `${selectedMonth}-${day}`
      const dayExpenses = monthlyExp.filter((e) => e.date === date)
      const amount = dayExpenses.reduce((sum, e) => sum + e.amount, 0)
      return {
        day: i + 1,
        amount,
      }
    })

    // Calculate active subscriptions total
    const activeSubsTotal = subscriptions
      .filter((s) => s.isActive)
      .reduce((sum, s) => sum + s.amount, 0)

    // Variable expenses = total - subscriptions
    const variableExp = total

    // Check for threshold alerts
    const alertList = catTotals
      .filter((cat) => {
        const threshold = categoryThresholds[cat.id]
        return threshold && cat.amount > threshold
      })
      .map((cat) => ({
        category: cat.name,
        amount: cat.amount,
        threshold: categoryThresholds[cat.id],
        excess: cat.amount - categoryThresholds[cat.id],
      }))

    // Item analysis
    const itemTotals: Record<string, { name: string; total: number; count: number }> = {}
    const itemCatTotals: Record<string, number> = {}

    for (const expense of monthlyExp) {
      if (expense.items && expense.items.length > 0) {
        for (const item of expense.items) {
          // Aggregate by item name (normalized)
          const normalizedName = item.name.toLowerCase().trim()
          if (!itemTotals[normalizedName]) {
            itemTotals[normalizedName] = { name: item.name, total: 0, count: 0 }
          }
          itemTotals[normalizedName].total += item.total || 0
          itemTotals[normalizedName].count += item.quantity || 1

          // Aggregate by item category
          if (item.itemCategory) {
            itemCatTotals[item.itemCategory] = (itemCatTotals[item.itemCategory] || 0) + (item.total || 0)
          }
        }
      }
    }

    // Convert to arrays and sort
    const itemStatsArr = Object.values(itemTotals)
      .filter((i) => i.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 15)

    const itemCatStatsArr = ITEM_CATEGORIES.map((cat) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: itemCatTotals[cat] || 0,
    }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value)

    return {
      monthlyExpenses: monthlyExp,
      totalExpenses: total,
      categoryTotals: catTotals,
      dailyExpenses: dailyExp,
      activeSubscriptionsTotal: activeSubsTotal,
      variableExpenses: variableExp,
      alerts: alertList,
      itemStats: itemStatsArr,
      itemCategoryStats: itemCatStatsArr,
    }
  }, [expenses, categories, subscriptions, categoryThresholds, selectedMonth])

  const totalWithSubscriptions = totalExpenses + activeSubscriptionsTotal
  const totalItemsTracked = itemStats.reduce((sum, i) => sum + i.count, 0)

  // Colors for item categories chart
  const itemCategoryColors = [
    '#0284c7',
    '#16a34a',
    '#ea580c',
    '#7c3aed',
    '#dc2626',
    '#0d9488',
    '#db2777',
    '#64748b',
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Seuils depasses
                </p>
                {alerts.map((alert) => (
                  <p key={alert.category} className="text-sm text-amber-800 dark:text-amber-200">
                    {alert.category}: {formatAmount(alert.amount)} ({'+'}
                    {formatAmount(alert.excess)} au-dessus du seuil)
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total du mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {formatAmount(totalWithSubscriptions)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Depenses variables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {formatAmount(variableExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Charges fixes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {formatAmount(activeSubscriptionsTotal)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nombre de depenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {monthlyExpenses.length}
            </p>
            {totalItemsTracked > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Package className="size-3" />
                {totalItemsTracked} items detailles
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Vue generale</TabsTrigger>
          <TabsTrigger value="items">Analyse items</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Pie Chart - By Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Repartition par categorie</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryTotals.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryTotals}
                            dataKey="amount"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {categoryTotals.map((entry) => (
                              <Cell key={entry.id} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatAmount(value)}
                            contentStyle={{
                              backgroundColor: 'var(--background)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-2">
                      {categoryTotals.slice(0, 5).map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className="size-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span>{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium tabular-nums">
                              {formatAmount(cat.amount)}
                            </span>
                            <span className="text-muted-foreground w-12 text-right">
                              {cat.percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune donnee pour ce mois
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Bar Chart - Daily Expenses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Depenses par jour</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyExpenses.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyExpenses}>
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) =>
                            value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
                          }
                        />
                        <Tooltip
                          formatter={(value: number) => formatAmount(value)}
                          labelFormatter={(label) => `Jour ${label}`}
                          contentStyle={{
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="amount" fill="var(--primary)" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune donnee pour ce mois
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Items les plus achetes</CardTitle>
              </CardHeader>
              <CardContent>
                {itemStats.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {itemStats.slice(0, 10).map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-muted-foreground w-5">{index + 1}.</span>
                          <span className="truncate">{item.name}</span>
                          <span className="text-xs text-muted-foreground">
                            (x{item.count})
                          </span>
                        </div>
                        <span className="font-medium tabular-nums">
                          {formatAmount(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun item detaille pour ce mois
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Item Categories Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Repartition par type d{"'"}item</CardTitle>
              </CardHeader>
              <CardContent>
                {itemCategoryStats.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={itemCategoryStats}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {itemCategoryStats.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={itemCategoryColors[index % itemCategoryColors.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatAmount(value)}
                            contentStyle={{
                              backgroundColor: 'var(--background)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-2">
                      {itemCategoryStats.map((cat, index) => {
                        const totalItemsAmount = itemCategoryStats.reduce((s, c) => s + c.value, 0)
                        const percentage =
                          totalItemsAmount > 0 ? (cat.value / totalItemsAmount) * 100 : 0
                        return (
                          <div key={cat.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span
                                className="size-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    itemCategoryColors[index % itemCategoryColors.length],
                                }}
                              />
                              <span>{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium tabular-nums">
                                {formatAmount(cat.value)}
                              </span>
                              <span className="text-muted-foreground w-12 text-right">
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun type d{"'"}item renseigne pour ce mois
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
